// MUNDO VOXEL — Minecraft-like 3D game with Three.js

// ── World dimensions ──────────────────────────────────────────────────────────
const W = 48, H = 14, D = 48;

// ── Block types ───────────────────────────────────────────────────────────────
const AIR = 0;
// BLOCKS[id] = { name, top:[r,g,b], side:[r,g,b], bot:[r,g,b] }  (0–1 range)
const BLOCKS = [
  null,
  { name:'Terra',   top:[0.54,0.41,0.23], side:[0.54,0.41,0.23], bot:[0.54,0.41,0.23] },
  { name:'Grama',   top:[0.29,0.65,0.17], side:[0.54,0.41,0.23], bot:[0.54,0.41,0.23] },
  { name:'Pedra',   top:[0.62,0.62,0.62], side:[0.60,0.60,0.60], bot:[0.58,0.58,0.58] },
  { name:'Areia',   top:[0.90,0.82,0.52], side:[0.88,0.80,0.50], bot:[0.88,0.80,0.50] },
  { name:'Madeira', top:[0.52,0.38,0.20], side:[0.46,0.32,0.17], bot:[0.52,0.38,0.20] },
  { name:'Folhas',  top:[0.22,0.52,0.14], side:[0.20,0.48,0.12], bot:[0.20,0.48,0.12] },
];
const BLOCK_EMOJIS  = ['', '🟫','🟩','⬜','🟨','🪵','🌿'];
const BLOCK_NAMES   = BLOCKS.map(b => b ? b.name : '');
let selectedBlock = 1;

// ── World storage ─────────────────────────────────────────────────────────────
const world = new Uint8Array(W * H * D);
function idx(x,y,z){ return y*W*D + z*W + x; }

function getBlock(x,y,z){
  if(x<0||x>=W||z<0||z>=D) return 3; // stone wall at border
  if(y<0) return 3;
  if(y>=H) return AIR;
  return world[idx(x,y,z)];
}
function setBlock(x,y,z,t){
  if(x<0||x>=W||y<0||y>=H||z<0||z>=D) return;
  world[idx(x,y,z)] = t;
}

// ── Noise / terrain ───────────────────────────────────────────────────────────
function hash2(x,z){ let n=Math.sin(x*127.1+z*311.7)*43758.5453; return n-Math.floor(n); }
function smoothNoise(x,z){
  const xi=Math.floor(x),zi=Math.floor(z);
  const xf=x-xi, zf=z-zi;
  const ux=xf*xf*(3-2*xf), uz=zf*zf*(3-2*zf);
  const a=hash2(xi,zi),b=hash2(xi+1,zi),c=hash2(xi,zi+1),d=hash2(xi+1,zi+1);
  return a*(1-ux)*(1-uz)+b*ux*(1-uz)+c*(1-ux)*uz+d*ux*uz;
}
function fbm(x,z){
  return smoothNoise(x*.07,z*.07)*.50
       + smoothNoise(x*.15,z*.15)*.30
       + smoothNoise(x*.30,z*.30)*.20;
}

function generateTerrain(){
  for(let x=0;x<W;x++) for(let z=0;z<D;z++){
    const h = 3 + Math.round(fbm(x,z)*7);
    for(let y=0;y<=h&&y<H;y++){
      if(y===h) setBlock(x,y,z, h<=3 ? 4 : 2); // sand near water level, else grass
      else if(y>=h-3) setBlock(x,y,z,1); // dirt
      else setBlock(x,y,z,3); // stone
    }
  }

  // Trees
  const rng = (a,b) => a+Math.floor(hash2(a*7,b*13)*(b-a));
  for(let i=0;i<12;i++){
    const tx=rng(4,W-4), tz=rng(4,D-4);
    let ty=H-1;
    while(ty>0 && getBlock(tx,ty,tz)===AIR) ty--;
    if(getBlock(tx,ty,tz)!==2) continue; // only on grass
    ty++;
    const trunk=3+Math.floor(hash2(tx,tz)*2);
    for(let y=ty;y<ty+trunk&&y<H;y++) setBlock(tx,y,tz,5); // wood
    for(let lx=-2;lx<=2;lx++) for(let lz=-2;lz<=2;lz++) for(let ly=0;ly<=2;ly++){
      if(Math.abs(lx)+Math.abs(lz)>3) continue;
      const by=ty+trunk-1+ly;
      if(by>=H) continue;
      if(getBlock(tx+lx,by,tz+lz)===AIR) setBlock(tx+lx,by,tz+lz,6); // leaves
    }
  }
}

// ── Mesh builder (exposed faces only) ────────────────────────────────────────
// face: [dirX,dirY,dirZ, verts×4, lightFactor, colorSlot 0=top 1=side 2=bot]
const FACE_DEFS = [
  { d:[0,1,0],  verts:[[0,1,0],[1,1,0],[1,1,1],[0,1,1]], l:1.00, c:0 }, // top
  { d:[0,-1,0], verts:[[0,0,1],[1,0,1],[1,0,0],[0,0,0]], l:0.60, c:2 }, // bottom
  { d:[0,0,1],  verts:[[0,0,1],[1,0,1],[1,1,1],[0,1,1]], l:0.80, c:1 }, // front
  { d:[0,0,-1], verts:[[1,0,0],[0,0,0],[0,1,0],[1,1,0]], l:0.80, c:1 }, // back
  { d:[1,0,0],  verts:[[1,0,1],[1,0,0],[1,1,0],[1,1,1]], l:0.70, c:1 }, // right
  { d:[-1,0,0], verts:[[0,0,0],[0,0,1],[0,1,1],[0,1,0]], l:0.70, c:1 }, // left
];

function buildGeometry(){
  const pos=[], col=[], idx_=[];
  let vi=0;
  for(let y=0;y<H;y++) for(let z=0;z<D;z++) for(let x=0;x<W;x++){
    const b=getBlock(x,y,z); if(b===AIR) continue;
    const bd=BLOCKS[b];
    for(const f of FACE_DEFS){
      if(getBlock(x+f.d[0],y+f.d[1],z+f.d[2])!==AIR) continue;
      const rgb = f.c===0?bd.top : f.c===2?bd.bot : bd.side;
      for(const [vx,vy,vz] of f.verts){
        pos.push(x+vx, y+vy, z+vz);
        col.push(rgb[0]*f.l, rgb[1]*f.l, rgb[2]*f.l);
      }
      idx_.push(vi,vi+1,vi+2, vi,vi+2,vi+3);
      vi+=4;
    }
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos,3));
  geo.setAttribute('color',    new THREE.Float32BufferAttribute(col,3));
  geo.setIndex(idx_);
  geo.computeVertexNormals();
  return geo;
}

// ── Three.js setup ────────────────────────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = false;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);
scene.fog = new THREE.FogExp2(0x87CEEB, 0.025);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.05, 300);

// Lighting
scene.add(new THREE.AmbientLight(0xffffff, 0.55));
const sun = new THREE.DirectionalLight(0xfffbe8, 0.9);
sun.position.set(1, 2, 0.5);
scene.add(sun);

// World mesh
const worldMat = new THREE.MeshLambertMaterial({ vertexColors: true });
let worldMesh = null;

function rebuildWorld(){
  if(worldMesh){ worldMesh.geometry.dispose(); scene.remove(worldMesh); }
  worldMesh = new THREE.Mesh(buildGeometry(), worldMat);
  scene.add(worldMesh);
}

// Block highlight
const hlGeo = new THREE.BoxGeometry(1.002,1.002,1.002);
const hlMat = new THREE.MeshBasicMaterial({ color:0x000000, wireframe:true, transparent:true, opacity:0.45 });
const highlight = new THREE.Mesh(hlGeo, hlMat);
highlight.visible = false;
scene.add(highlight);

// ── Player ────────────────────────────────────────────────────────────────────
const player = {
  pos: new THREE.Vector3(W/2, H, D/2),
  vel: new THREE.Vector3(),
  onGround: false,
  EYE: 1.62,
  W: 0.3,   // half-width for collision
  SPEED: 5.5,
  JUMP: 8,
};

// ── Controls ──────────────────────────────────────────────────────────────────
const euler = new THREE.Euler(0,0,0,'YXZ');
const keys  = {};
let locked  = false;

function lockPointer(){ renderer.domElement.requestPointerLock(); }

document.getElementById('start-btn').addEventListener('click', lockPointer);
renderer.domElement.addEventListener('click', () => { if(!locked) lockPointer(); });

document.addEventListener('pointerlockchange', ()=>{
  locked = document.pointerLockElement === renderer.domElement;
  document.getElementById('crosshair').style.display  = locked ? 'block' : 'none';
  document.getElementById('overlay').style.display    = locked ? 'none'  : 'flex';
  document.getElementById('selected-name').style.display = locked ? 'block' : 'none';
});

document.addEventListener('mousemove', e=>{
  if(!locked) return;
  euler.y -= e.movementX * 0.0022;
  euler.x  = Math.max(-Math.PI/2, Math.min(Math.PI/2, euler.x - e.movementY*0.0022));
  camera.quaternion.setFromEuler(euler);
});

document.addEventListener('keydown', e=>{ keys[e.code]=true;
  const n=parseInt(e.key); if(n>=1&&n<=6){ selectedBlock=n; updateHotbar(); }
});
document.addEventListener('keyup',   e=>{ keys[e.code]=false; });

document.addEventListener('wheel', e=>{
  if(!locked) return;
  selectedBlock=((selectedBlock-1+(e.deltaY>0?1:-1)+6)%6)+1;
  updateHotbar();
},{passive:true});

document.addEventListener('mousedown', e=>{
  if(!locked) return;
  const hit=raycast();
  if(!hit) return;
  if(e.button===0){
    setBlock(hit.x,hit.y,hit.z,AIR);
    rebuildWorld();
  } else if(e.button===2){
    const px=hit.x+hit.nx, py=hit.y+hit.ny, pz=hit.z+hit.nz;
    // Don't place inside player
    const pw=player.W+0.05;
    const pminX=player.pos.x-pw, pmaxX=player.pos.x+pw;
    const pminY=player.pos.y-player.EYE-0.05, pmaxY=player.pos.y+0.1;
    const pminZ=player.pos.z-pw, pmaxZ=player.pos.z+pw;
    const inside = px+1>pminX&&px<pmaxX && py+1>pminY&&py<pmaxY && pz+1>pminZ&&pz<pmaxZ;
    if(!inside){ setBlock(px,py,pz,selectedBlock); rebuildWorld(); }
  }
});
renderer.domElement.addEventListener('contextmenu', e=>e.preventDefault());

// Hotbar clicks (for mobile selection)
document.querySelectorAll('.slot').forEach(el=>{
  el.addEventListener('click', ()=>{
    selectedBlock=parseInt(el.dataset.slot);
    updateHotbar();
  });
});

function updateHotbar(){
  document.querySelectorAll('.slot').forEach((el,i)=>{
    el.classList.toggle('active', i+1===selectedBlock);
  });
  const nm=document.getElementById('selected-name');
  nm.textContent=BLOCK_NAMES[selectedBlock];
  nm.style.display='block';
  clearTimeout(updateHotbar._t);
  updateHotbar._t=setTimeout(()=>{ if(locked) nm.style.display='none'; },1800);
}

// ── Raycasting ────────────────────────────────────────────────────────────────
const _rayDir  = new THREE.Vector3();
const _rayFwd  = new THREE.Vector3();

function raycast(){
  _rayFwd.set(0,0,-1).applyQuaternion(camera.quaternion).normalize();
  const STEP=0.04, MAX=6;
  let lx,ly,lz;
  for(let t=0;t<=MAX;t+=STEP){
    const px=camera.position.x+_rayFwd.x*t;
    const py=camera.position.y+_rayFwd.y*t;
    const pz=camera.position.z+_rayFwd.z*t;
    const bx=Math.floor(px), by=Math.floor(py), bz=Math.floor(pz);
    if(getBlock(bx,by,bz)!==AIR){
      return { x:bx,y:by,z:bz,
               nx: lx!==undefined?lx-bx:0,
               ny: ly!==undefined?ly-by:0,
               nz: lz!==undefined?lz-bz:0 };
    }
    lx=bx; ly=by; lz=bz;
  }
  return null;
}

// ── Physics & collision ───────────────────────────────────────────────────────
const GRAVITY = -28;
const _fwd   = new THREE.Vector3();
const _right = new THREE.Vector3();

function solidAt(x,y,z){ return getBlock(Math.floor(x),Math.floor(y),Math.floor(z))!==AIR; }

function collidesWithWorld(pos){
  const pw=player.W;
  for(const [dx,dz] of [[-pw,-pw],[ pw,-pw],[-pw,pw],[pw,pw]]){
    if(solidAt(pos.x+dx, pos.y-player.EYE, pos.z+dz)) return true;
    if(solidAt(pos.x+dx, pos.y-player.EYE/2, pos.z+dz)) return true;
    if(solidAt(pos.x+dx, pos.y+0.05, pos.z+dz)) return true;
  }
  return false;
}

function updatePlayer(dt){
  if(!locked) return;

  // Move direction from camera yaw only (horizontal movement)
  _fwd.set(  -Math.sin(euler.y), 0, -Math.cos(euler.y));
  _right.set(-Math.cos(euler.y), 0,  Math.sin(euler.y));

  let mx=0, mz=0;
  if(keys['KeyW']){ mx+=_fwd.x; mz+=_fwd.z; }
  if(keys['KeyS']){ mx-=_fwd.x; mz-=_fwd.z; }
  if(keys['KeyA']){ mx+=_right.x; mz+=_right.z; }
  if(keys['KeyD']){ mx-=_right.x; mz-=_right.z; }
  const ml=Math.sqrt(mx*mx+mz*mz);
  if(ml>0){ mx/=ml; mz/=ml; }
  player.vel.x=mx*player.SPEED;
  player.vel.z=mz*player.SPEED;

  if(keys['Space']&&player.onGround){ player.vel.y=player.JUMP; player.onGround=false; }
  if(!player.onGround) player.vel.y+=GRAVITY*dt;
  player.vel.y=Math.max(player.vel.y,-40);

  const np=player.pos.clone();

  // X
  np.x+=player.vel.x*dt;
  if(collidesWithWorld(np)){ np.x=player.pos.x; player.vel.x=0; }

  // Y
  np.y+=player.vel.y*dt;
  if(collidesWithWorld(np)){
    if(player.vel.y<0) player.onGround=true;
    np.y=player.pos.y; player.vel.y=0;
  } else { player.onGround=false; }

  // Z
  np.z+=player.vel.z*dt;
  if(collidesWithWorld(np)){ np.z=player.pos.z; player.vel.z=0; }

  // Clamp inside world
  np.x=Math.max(1,Math.min(W-1,np.x));
  np.z=Math.max(1,Math.min(D-1,np.z));

  player.pos.copy(np);
  camera.position.set(np.x, np.y, np.z);
}

// ── Resize ────────────────────────────────────────────────────────────────────
window.addEventListener('resize',()=>{
  camera.aspect=window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth,window.innerHeight);
});

// ── Init ──────────────────────────────────────────────────────────────────────
generateTerrain();
rebuildWorld();

// Spawn player above surface
let spawnY=H-1;
while(spawnY>0&&getBlock(Math.floor(W/2),spawnY,Math.floor(D/2))===AIR) spawnY--;
player.pos.set(W/2, spawnY + 1 + player.EYE + 0.1, D/2);
camera.position.copy(player.pos);
camera.quaternion.setFromEuler(euler);

// ── Game loop ─────────────────────────────────────────────────────────────────
let last=0;
function animate(t){
  requestAnimationFrame(animate);
  const dt=Math.min((t-last)/1000, 0.1);
  last=t;

  updatePlayer(dt);

  const hit=locked?raycast():null;
  if(hit){ highlight.position.set(hit.x+.5,hit.y+.5,hit.z+.5); highlight.visible=true; }
  else    { highlight.visible=false; }

  renderer.render(scene,camera);
}
animate(0);
