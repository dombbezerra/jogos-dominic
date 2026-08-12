// ═══════════════════════════════════════════════════════════════════════════
//  CONTRA-ATAQUE — tiroteio tático em primeira pessoa
// ═══════════════════════════════════════════════════════════════════════════

const isTouch = matchMedia('(hover: none) and (pointer: coarse)').matches;
if (isTouch) document.body.classList.add('touch');

const $ = id => document.getElementById(id);

// ── Texturas procedurais ──────────────────────────────────────────────────
function tex(w, h, paint) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  paint(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
const rnd = (a, b) => a + Math.random() * (b - a);

const TEX = {
  areia: tex(128, 128, (g, w, h) => {
    g.fillStyle = '#c8ac74'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) {
      g.fillStyle = `rgba(${rnd(150,210)|0},${rnd(130,180)|0},${rnd(90,130)|0},.5)`;
      g.fillRect(rnd(0,w), rnd(0,h), rnd(1,3), rnd(1,3));
    }
  }),
  parede: tex(128, 128, (g, w, h) => {
    g.fillStyle = '#b9a179'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 32) {
      for (let x = 0; x < w; x += 64) {
        const o = (y / 32) % 2 ? 32 : 0;
        g.fillStyle = `rgb(${rnd(168,195)|0},${rnd(146,170)|0},${rnd(108,130)|0})`;
        g.fillRect(x + o + 2, y + 2, 60, 28);
      }
    }
    for (let i = 0; i < 900; i++) {
      g.fillStyle = `rgba(90,72,44,${Math.random() * .18})`;
      g.fillRect(rnd(0,w), rnd(0,h), 2, 2);
    }
  }),
  caixa: tex(64, 64, (g, w, h) => {
    g.fillStyle = '#a5763c'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#6d4a22'; g.lineWidth = 4;
    g.strokeRect(2, 2, w - 4, h - 4);
    g.beginPath(); g.moveTo(2, 2); g.lineTo(w - 2, h - 2);
    g.moveTo(w - 2, 2); g.lineTo(2, h - 2); g.stroke();
    for (let i = 0; i < 400; i++) {
      g.fillStyle = `rgba(70,45,20,${Math.random() * .2})`;
      g.fillRect(rnd(0,w), rnd(0,h), 2, 2);
    }
  }),
  metal: tex(64, 64, (g, w, h) => {
    g.fillStyle = '#6f7378'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 8) {
      g.fillStyle = `rgba(255,255,255,${Math.random() * .07})`;
      g.fillRect(0, y, w, 4);
    }
    for (let i = 0; i < 300; i++) {
      g.fillStyle = `rgba(30,32,36,${Math.random() * .3})`;
      g.fillRect(rnd(0,w), rnd(0,h), 2, 2);
    }
  }),
};

// ── Cena ──────────────────────────────────────────────────────────────────
const CEU = 0xbfd0e0;
const renderer = new THREE.WebGLRenderer({ antialias: !isTouch, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, isTouch ? 1.5 : 2));
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);
const cv = renderer.domElement;

const scene = new THREE.Scene();
scene.background = new THREE.Color(CEU);
scene.fog = new THREE.Fog(CEU, 34, 96);

const camera = new THREE.PerspectiveCamera(78, innerWidth / innerHeight, 0.03, 400);

scene.add(new THREE.AmbientLight(0xffffff, .72));
const sol = new THREE.DirectionalLight(0xfff0d0, .85);
sol.position.set(30, 60, 18);
scene.add(sol);
scene.add(new THREE.HemisphereLight(0xdfe9f5, 0x6b5a3a, .45));

// ── Mapa ──────────────────────────────────────────────────────────────────
const ARENA = 46;                 // metade do lado
const colisores = [];             // AABBs
const paredes = [];               // malhas para o raycast do tiro

function caixa(x, y, z, w, h, d, textura, rep) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const t = textura.clone(); t.needsUpdate = true;
  t.repeat.set(rep ? w / rep : 1, rep ? h / rep : 1);
  const mat = new THREE.MeshLambertMaterial({ map: t });
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  scene.add(m);
  paredes.push(m);
  colisores.push({
    minX: x - w/2, maxX: x + w/2,
    minY: y - h/2, maxY: y + h/2,
    minZ: z - d/2, maxZ: z + d/2,
  });
  return m;
}

// chão
const chaoTex = TEX.areia.clone(); chaoTex.needsUpdate = true; chaoTex.repeat.set(24, 24);
const chao = new THREE.Mesh(
  new THREE.PlaneGeometry(ARENA * 2, ARENA * 2),
  new THREE.MeshLambertMaterial({ map: chaoTex })
);
chao.rotation.x = -Math.PI / 2;
scene.add(chao);
paredes.push(chao);

function montarMapa() {
  const A = ARENA;
  // muros externos
  caixa(0, 3, -A, A*2, 6, 2, TEX.parede, 4);
  caixa(0, 3,  A, A*2, 6, 2, TEX.parede, 4);
  caixa(-A, 3, 0, 2, 6, A*2, TEX.parede, 4);
  caixa( A, 3, 0, 2, 6, A*2, TEX.parede, 4);

  // prédio central com duas entradas
  caixa(-4, 2.5, 0, 1.2, 5, 16, TEX.parede, 4);
  caixa( 4, 2.5, 0, 1.2, 5, 16, TEX.parede, 4);
  caixa( 0, 2.5, -8, 8, 5, 1.2, TEX.parede, 4);
  caixa(-2.6, 4.2, 8, 3, 1.6, 1.2, TEX.parede, 4);   // verga da porta
  caixa( 2.6, 4.2, 8, 3, 1.6, 1.2, TEX.parede, 4);
  caixa( 0, 5.4, 0, 9.2, .6, 17, TEX.metal, 4);      // laje

  // rampa para a laje (degraus)
  for (let i = 0; i < 6; i++) caixa(10, .5 + i * .9, 6 - i * 1.6, 4, .9, 1.8, TEX.metal, 4);
  caixa(7.6, 5.4, -2, 3, .6, 8, TEX.metal, 4);       // passarela até a laje

  // engradados
  const cx = [[-14,-12],[-12,-9.5],[-14,-7],[16,10],[18,12],[16,14],[-20,14],[-18,16],[9,-16],[11,-14],[-8,18],[-6,20],[20,-8],[18,-10],[22,-6]];
  cx.forEach(([x, z], i) => {
    caixa(x, 1, z, 2, 2, 2, TEX.caixa);
    if (i % 3 === 0) caixa(x, 3, z, 2, 2, 2, TEX.caixa);
  });

  // muretas
  caixa(-24, 1.5, 0, 1, 3, 18, TEX.parede, 3);
  caixa( 26, 1.5, 4, 1, 3, 22, TEX.parede, 3);
  caixa( 0, 1.5, 26, 26, 3, 1, TEX.parede, 3);
  caixa(-14, 1.5, -22, 20, 3, 1, TEX.parede, 3);
  caixa( 22, 2.5, -24, 1, 5, 14, TEX.parede, 3);

  // torres
  caixa(-30, 4, -28, 6, 8, 6, TEX.parede, 4);
  caixa( 32, 4,  28, 6, 8, 6, TEX.parede, 4);
  caixa(-30, 3.5, 30, 5, 7, 5, TEX.parede, 4);

  // contêineres
  caixa(-20, 1.4, -6, 6, 2.8, 2.6, TEX.metal, 3);
  caixa( 14, 1.4, 22, 6, 2.8, 2.6, TEX.metal, 3);
  caixa(-6, 1.4, -30, 2.6, 2.8, 6, TEX.metal, 3);
}
montarMapa();

// ── Jogador ───────────────────────────────────────────────────────────────
// ── Arsenal ───────────────────────────────────────────────────────────────
// pelotas = quantos projéteis saem por disparo (escopeta)
const FK9 = { id:'fk9', nome:'FK9', tipo:'Pistola', modelo:'pistola',
  mag:12, reserva:72, dano:24, danoCab:80, cad:11, recuo:.10, disp:.020,
  recarga:70, auto:false, zoom:0, pelotas:1 };

const PRIMARIAS = [
  { id:'f200', nome:'F200', tipo:'Fuzil de assalto', modelo:'rifle',
    mag:30, reserva:90, dano:26, danoCab:100, cad:7, recuo:.085, disp:.055,
    recarga:110, auto:true, zoom:0, pelotas:1 },
  { id:'mp5x', nome:'MP5-X', tipo:'Submetralhadora', modelo:'smg',
    mag:30, reserva:120, dano:17, danoCab:58, cad:4, recuo:.055, disp:.075,
    recarga:85, auto:true, zoom:0, pelotas:1 },
  { id:'s12', nome:'S12', tipo:'Escopeta', modelo:'escopeta',
    mag:8, reserva:32, dano:15, danoCab:24, cad:30, recuo:.42, disp:.11,
    recarga:130, auto:false, zoom:0, pelotas:8 },
  { id:'sniper4', nome:'SNIPER 4', tipo:'Fuzil de precisão', modelo:'sniper',
    mag:5, reserva:25, dano:100, danoCab:150, cad:65, recuo:.55, disp:.004,
    recarga:160, auto:false, zoom:26, pelotas:1 },
  { id:'lmg60', nome:'LMG-60', tipo:'Metralhadora', modelo:'lmg',
    mag:100, reserva:100, dano:21, danoCab:68, cad:6, recuo:.11, disp:.095,
    recarga:210, auto:true, zoom:0, pelotas:1 },
];

let primIdx = 0;
try { const v = +localStorage.getItem('caArma'); if (v >= 0 && v < PRIMARIAS.length) primIdx = v; } catch (e) {}
let ARMAS = [FK9, PRIMARIAS[primIdx]];   // slot 1 e slot 2

const OLHO = 1.62, RAIO = .38, ALT = 1.75;
const player = {
  pos: new THREE.Vector3(0, 0, 26),
  vel: new THREE.Vector3(),
  noChao: false, hp: 100, vivo: true, respawn: 0,
  arma: 1,                                   // índice em ARMAS
  bal: ARMAS.map(a => ({ mag: a.mag, reserva: a.reserva })),
  recarregando: 0, cadencia: 0,
  recuo: 0, kills: 0, deaths: 0, mirando: false,
  protegido: 0,        // quadros de imunidade ao renascer
  semLevar: 0,         // quadros sem tomar tiro (para a vida voltar)
};
const arma = () => ARMAS[player.arma];
const bal  = () => player.bal[player.arma];
const euler = new THREE.Euler(0, 0, 0, 'YXZ');

const PONTOS_BRUTOS = [
  new THREE.Vector3(0, 0, 21), new THREE.Vector3(-28, 0, 20), new THREE.Vector3(28, 0, -20),
  new THREE.Vector3(-34, 0, -12), new THREE.Vector3(34, 0, 14), new THREE.Vector3(-2, 0, -30),
  new THREE.Vector3(20, 0, 30), new THREE.Vector3(-24, 0, 34), new THREE.Vector3(14, 0, 6),
  new THREE.Vector3(-16, 0, -16),
];
let PONTOS = PONTOS_BRUTOS;                 // filtrado abaixo, depois que o mapa existe
function pontosLivres() { return PONTOS; }
const sorteiaPonto = () => PONTOS[(Math.random() * PONTOS.length) | 0];

// ── Colisão com o cenário ─────────────────────────────────────────────────
function bate(p) {
  const minX = p.x - RAIO, maxX = p.x + RAIO;
  const minZ = p.z - RAIO, maxZ = p.z + RAIO;
  const minY = p.y, maxY = p.y + ALT;
  for (const c of colisores) {
    if (maxX > c.minX && minX < c.maxX &&
        maxY > c.minY && minY < c.maxY &&
        maxZ > c.minZ && minZ < c.maxZ) return true;
  }
  return false;
}
function alturaChao(p) {                 // topo do obstáculo sob o jogador
  let y = 0;
  for (const c of colisores) {
    if (p.x + RAIO > c.minX && p.x - RAIO < c.maxX &&
        p.z + RAIO > c.minZ && p.z - RAIO < c.maxZ) {
      if (c.maxY <= p.y + .55 && c.maxY > y) y = c.maxY;
    }
  }
  return y;
}

// descarta pontos de nascimento que caíram dentro de alguma parede
PONTOS = PONTOS_BRUTOS.filter(p => !bate(p));
if (!PONTOS.length) PONTOS = PONTOS_BRUTOS;

// ── Inimigos ──────────────────────────────────────────────────────────────
// alcance = até onde o inimigo enxerga o jogador (metros)
const DIFS = [
  { nome:'FÁCIL',   qtd:3, reacao:85, precisao:.16, dano:4,  cad:100, vida:100, alcance:32, veloc:2.4 },
  { nome:'NORMAL',  qtd:4, reacao:55, precisao:.28, dano:6,  cad:72,  vida:100, alcance:46, veloc:2.9 },
  { nome:'DIFÍCIL', qtd:6, reacao:26, precisao:.50, dano:11, cad:44,  vida:100, alcance:68, veloc:3.4 },
];
let dif = DIFS[1];
const bots = [];

function criarBot(i) {
  const g = new THREE.Group();
  const corpoMat = new THREE.MeshLambertMaterial({ color: 0x8a4a3a });
  const colete  = new THREE.MeshLambertMaterial({ color: 0x3a3a44 });
  const pele    = new THREE.MeshLambertMaterial({ color: 0xc79a6a });

  const pernas = new THREE.Mesh(new THREE.BoxGeometry(.52, .85, .34), colete);
  pernas.position.y = .42; g.add(pernas);
  const torso = new THREE.Mesh(new THREE.BoxGeometry(.62, .72, .38), corpoMat);
  torso.position.y = 1.2; g.add(torso);
  const cinto = new THREE.Mesh(new THREE.BoxGeometry(.66, .22, .42), colete);
  cinto.position.y = 1.06; g.add(cinto);
  const bracoE = new THREE.Mesh(new THREE.BoxGeometry(.17, .6, .17), corpoMat);
  bracoE.position.set(-.4, 1.2, 0); g.add(bracoE);
  const bracoD = new THREE.Mesh(new THREE.BoxGeometry(.17, .6, .17), corpoMat);
  bracoD.position.set(.4, 1.2, .12); bracoD.rotation.x = -.9; g.add(bracoD);
  const arma = new THREE.Mesh(new THREE.BoxGeometry(.1, .12, .8), new THREE.MeshLambertMaterial({ color: 0x22252b }));
  arma.position.set(.4, 1.18, .42); g.add(arma);
  const cabeca = new THREE.Mesh(new THREE.BoxGeometry(.34, .34, .34), pele);
  cabeca.position.y = 1.74; g.add(cabeca);
  const capacete = new THREE.Mesh(new THREE.BoxGeometry(.4, .18, .4), colete);
  capacete.position.y = 1.9; g.add(capacete);

  scene.add(g);
  const b = {
    obj: g, cabeca, torso, hp: dif.vida, vivo: true,
    pos: new THREE.Vector3(), alvo: new THREE.Vector3(),
    verTimer: 0, tiroTimer: 0, respawn: 0, idx: i, dir: 0,
  };
  respawnBot(b);
  bots.push(b);
  return b;
}
function respawnBot(b) {
  const pts = pontosLivres();
  let p, tent = 0;
  do { p = pts[(Math.random() * pts.length) | 0]; tent++; }
  while (p.distanceTo(player.pos) < 16 && tent < 20);
  b.pos.copy(p);
  b.hp = dif.vida; b.vivo = true; b.respawn = 0;
  b.obj.visible = true;
  b.obj.rotation.z = 0;
  b.alvo.copy(pts[(Math.random() * pts.length) | 0]);
}

// ── Tiro: efeitos ─────────────────────────────────────────────────────────
const ray = new THREE.Raycaster();
ray.far = 220;

const furos = [];
const furoGeo = new THREE.CircleGeometry(.07, 8);
const furoMat = new THREE.MeshBasicMaterial({ color: 0x1a1510, transparent: true, opacity: .9 });
for (let i = 0; i < 40; i++) {
  const m = new THREE.Mesh(furoGeo, furoMat);
  m.visible = false; scene.add(m); furos.push(m);
}
let furoIdx = 0;
function marcarFuro(ponto, normal) {
  const m = furos[furoIdx = (furoIdx + 1) % furos.length];
  m.position.copy(ponto).addScaledVector(normal, .012);
  m.lookAt(ponto.clone().add(normal));
  m.visible = true;
}

const tracos = [];
const tracoMat = new THREE.LineBasicMaterial({ color: 0xffe08a, transparent: true, opacity: .9 });
function traco(a, b) {
  const g = new THREE.BufferGeometry().setFromPoints([a, b]);
  const l = new THREE.Line(g, tracoMat.clone());
  scene.add(l);
  tracos.push({ l, vida: 5 });
}

const fumacas = [];
function fumaca(p) {
  const m = new THREE.Mesh(
    new THREE.SphereGeometry(.16, 6, 6),
    new THREE.MeshBasicMaterial({ color: 0xcfc4ae, transparent: true, opacity: .55 })
  );
  m.position.copy(p); scene.add(m);
  fumacas.push({ m, vida: 24 });
}

const sangues = [];
function sangue(p) {
  for (let i = 0; i < 8; i++) {
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(.05, 5, 5),
      new THREE.MeshBasicMaterial({ color: 0xa01818 })
    );
    m.position.copy(p);
    scene.add(m);
    sangues.push({
      m, vida: 26,
      v: new THREE.Vector3((Math.random()-.5)*.13, Math.random()*.11, (Math.random()-.5)*.13),
    });
  }
}

// ── Armas na tela (viewmodel) ─────────────────────────────────────────────
const matPreto = new THREE.MeshLambertMaterial({ color: 0x24272e });
const matCinza = new THREE.MeshLambertMaterial({ color: 0x3b4048 });
const matMad   = new THREE.MeshLambertMaterial({ color: 0x5c3f27 });

function montarArma(id) {
  const g = new THREE.Group();
  const add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); g.add(m); return m; };
  let bocaZ;

  if (id === 'pistola') {
    add(new THREE.BoxGeometry(.14, .18, .5), matPreto, 0, 0, -.16);      // ferrolho
    add(new THREE.BoxGeometry(.07, .07, .16), matCinza, 0, .01, -.46);   // cano
    add(new THREE.BoxGeometry(.13, .3, .16), matPreto, 0, -.22, .04);    // punho
    add(new THREE.BoxGeometry(.04, .06, .04), matCinza, 0, .11, -.36);   // massa de mira
    bocaZ = -.58;
  } else if (id === 'sniper') {
    add(new THREE.BoxGeometry(.13, .15, 1.15), matPreto, 0, 0, -.4);     // corpo
    add(new THREE.BoxGeometry(.07, .07, 1.0), matCinza, 0, .02, -1.3);   // cano longo
    add(new THREE.BoxGeometry(.1, .26, .14), matPreto, 0, -.2, -.24);    // carregador
    add(new THREE.BoxGeometry(.11, .17, .42), matMad, 0, -.02, .3);      // coronha
    add(new THREE.CylinderGeometry(.07, .07, .52, 8), matCinza, 0, .17, -.5) // luneta
      .rotation.x = Math.PI / 2;
    add(new THREE.BoxGeometry(.04, .09, .04), matPreto, 0, .09, -.28);   // suporte
    add(new THREE.BoxGeometry(.04, .09, .04), matPreto, 0, .09, -.72);
    bocaZ = -1.82;
  } else if (id === 'smg') {
    add(new THREE.BoxGeometry(.13, .16, .62), matPreto, 0, 0, -.22);     // corpo curto
    add(new THREE.BoxGeometry(.06, .06, .3), matCinza, 0, .02, -.62);    // cano
    add(new THREE.BoxGeometry(.09, .34, .12), matPreto, 0, -.24, -.1);   // carregador longo
    add(new THREE.BoxGeometry(.09, .12, .26), matPreto, 0, -.02, .18);   // coronha dobrável
    add(new THREE.BoxGeometry(.04, .08, .04), matCinza, 0, .12, -.46);
    bocaZ = -.84;
  } else if (id === 'escopeta') {
    add(new THREE.BoxGeometry(.16, .16, .8), matPreto, 0, 0, -.3);       // corpo grosso
    add(new THREE.BoxGeometry(.1, .1, .72), matCinza, 0, .04, -.94);     // cano largo
    add(new THREE.BoxGeometry(.11, .09, .3), matMad, 0, -.11, -.66);     // bombeamento
    add(new THREE.BoxGeometry(.12, .19, .38), matMad, 0, -.04, .26);     // coronha de madeira
    bocaZ = -1.34;
  } else if (id === 'lmg') {
    add(new THREE.BoxGeometry(.17, .2, 1.05), matPreto, 0, 0, -.38);     // corpo grandão
    add(new THREE.BoxGeometry(.09, .09, .8), matCinza, 0, .04, -1.1);    // cano pesado
    add(new THREE.BoxGeometry(.24, .3, .3), matPreto, 0, -.22, -.24);    // caixa de munição
    add(new THREE.BoxGeometry(.12, .18, .34), matMad, 0, -.04, .26);     // coronha
    add(new THREE.BoxGeometry(.05, .12, .05), matCinza, 0, .16, -.78);   // alça
    add(new THREE.BoxGeometry(.05, .3, .05), matCinza, 0, -.22, -.86);   // bipé
    bocaZ = -1.6;
  } else {                                                               // rifle
    add(new THREE.BoxGeometry(.15, .17, .95), matPreto, 0, 0, -.34);
    add(new THREE.BoxGeometry(.08, .08, .62), matCinza, 0, .03, -.92);
    add(new THREE.BoxGeometry(.11, .3, .16), matPreto, 0, -.21, -.2);
    add(new THREE.BoxGeometry(.1, .16, .3), matMad, 0, -.03, .2);
    add(new THREE.BoxGeometry(.05, .1, .05), matCinza, 0, .13, -.72);
    add(new THREE.BoxGeometry(.1, .12, .2), matPreto, 0, -.1, -.62);
    bocaZ = -1.26;
  }

  const luz = new THREE.Mesh(
    new THREE.PlaneGeometry(.42, .42),
    new THREE.MeshBasicMaterial({ color: 0xffd070, transparent: true, opacity: .9, side: THREE.DoubleSide })
  );
  luz.position.set(0, .03, bocaZ); luz.visible = false;
  g.add(luz);
  g.userData.flash = luz;
  return g;
}

const ARMA_BASE = new THREE.Vector3(.17, -.15, -.42);
let armaMalhas = [];

function montarArsenal() {
  armaMalhas.forEach(g => camera.remove(g));
  armaMalhas = ARMAS.map(a => {
    const g = montarArma(a.modelo);
    g.position.copy(ARMA_BASE);
    g.scale.setScalar(a.modelo === 'pistola' ? .5 : .42);
    g.rotation.y = .05;
    g.visible = false;
    camera.add(g);
    return g;
  });
  armaMalhas[player ? player.arma : 1].visible = true;
}
scene.add(camera);
const armaGrp = () => armaMalhas[player.arma];

function escolherPrimaria(i) {
  primIdx = i;
  try { localStorage.setItem('caArma', i); } catch (e) {}
  ARMAS = [FK9, PRIMARIAS[i]];
  if (player) {
    player.bal = ARMAS.map(a => ({ mag: a.mag, reserva: a.reserva }));
    player.arma = 1;
  }
  montarArsenal();
  montarGradeArmas();
  if (typeof atualizarHUD === 'function' && player) atualizarHUD();
}

function trocarArma(i) {
  if (i < 0 || i >= ARMAS.length) return;
  if (player.recarregando > 0) player.recarregando = 0;
  player.arma = i;
  player.recuo = 0;
  player.mirando = false;
  armaMalhas.forEach((g, k) => g.visible = (k === i));
  atualizarHUD();
}
montarArsenal();

// ── Entrada ───────────────────────────────────────────────────────────────
const keys = {};
let jogando = false, mouseDown = false, botaoDir = false, gatilhoAnt = false;
const toque = { f: 0, s: 0, fogo: 0, pulo: 0 };
const SENSI = .0024;

addEventListener('keydown', e => {
  keys[e.code] = true;
  if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) e.preventDefault();
  if (e.code === 'KeyR') recarregar();
  if (e.code === 'Digit1') trocarArma(0);
  if (e.code === 'Digit2') trocarArma(1);
  // P (ou Esc) pausa e abre o menu; apertando de novo, volta ao jogo
  if (e.code === 'KeyP' || e.code === 'Escape') {
    if (jogando) pausar();
    else if (pausado) retomar();
  }
});
addEventListener('keyup', e => { keys[e.code] = false; });

function olhar(dx, dy) {
  euler.y -= dx * SENSI;
  euler.x = Math.max(-Math.PI/2 + .01, Math.min(Math.PI/2 - .01, euler.x - dy * SENSI));
}

// No computador a câmera é virada pelas setas. O mouse não gira a câmera:
// ele escolhe o ponto da tela para onde o tiro vai.
const mira = { x: innerWidth / 2, y: innerHeight / 2, nx: 0, ny: 0 };
const elCross = $('cross'), elHit = $('hitmark');

function moverMira(cx, cy) {
  mira.x = cx; mira.y = cy;
  mira.nx = (cx / innerWidth) * 2 - 1;
  mira.ny = -(cy / innerHeight) * 2 + 1;
  elCross.style.left = cx + 'px';
  elCross.style.top = cy + 'px';
  elHit.style.left = cx + 'px';
  elHit.style.top = cy + 'px';
}
moverMira(mira.x, mira.y);

addEventListener('mousemove', e => {
  if (isTouch) return;
  moverMira(e.clientX, e.clientY);
});

cv.addEventListener('mousedown', e => {
  if (!jogando) return;
  if (e.button === 0) mouseDown = true;
  if (e.button === 2) botaoDir = true;
});
addEventListener('mouseup', e => {
  if (e.button === 0) mouseDown = false;
  if (e.button === 2) botaoDir = false;
});
addEventListener('blur', () => { mouseDown = botaoDir = false; });
cv.addEventListener('contextmenu', e => e.preventDefault());

// toque
const stick = $('stick'), knob = $('knob');
let stickId = null, lookId = null, lx = 0, ly = 0;
addEventListener('touchstart', e => {
  if (!jogando) return;
  for (const t of e.changedTouches) {
    if (t.target.closest('.tb') || t.target.closest('#back-link')) continue;
    if (t.clientX < innerWidth * .45 && stickId === null) {
      stickId = t.identifier;
      const r = stick.getBoundingClientRect();
      stick.dataset.cx = r.left + r.width / 2;
      stick.dataset.cy = r.top + r.height / 2;
    } else if (lookId === null) { lookId = t.identifier; lx = t.clientX; ly = t.clientY; }
  }
}, { passive: true });
addEventListener('touchmove', e => {
  if (!jogando) return;
  for (const t of e.changedTouches) {
    if (t.identifier === stickId) {
      let dx = t.clientX - +stick.dataset.cx, dy = t.clientY - +stick.dataset.cy;
      const d = Math.hypot(dx, dy), max = 48;
      if (d > max) { dx = dx / d * max; dy = dy / d * max; }
      knob.style.transform = `translate(${dx}px,${dy}px)`;
      toque.f = -dy / max; toque.s = -dx / max;
    } else if (t.identifier === lookId) {
      olhar((t.clientX - lx) * 1.5, (t.clientY - ly) * 1.5);
      lx = t.clientX; ly = t.clientY;
    }
  }
}, { passive: true });
function fimToque(e) {
  for (const t of e.changedTouches) {
    if (t.identifier === stickId) { stickId = null; toque.f = toque.s = 0; knob.style.transform = 'translate(0,0)'; }
    else if (t.identifier === lookId) lookId = null;
  }
}
addEventListener('touchend', fimToque, { passive: true });
addEventListener('touchcancel', fimToque, { passive: true });

const segurar = (el, on, off) => {
  el.addEventListener('touchstart', e => { e.preventDefault(); on(); }, { passive: false });
  el.addEventListener('touchend',   e => { e.preventDefault(); off && off(); }, { passive: false });
};
segurar($('b-fire'), () => toque.fogo = 1, () => toque.fogo = 0);
segurar($('b-jump'), () => toque.pulo = 1, () => toque.pulo = 0);
segurar($('b-reload'), () => recarregar());

// ── Menu ──────────────────────────────────────────────────────────────────
$('keysTxt').innerHTML = isTouch
  ? 'Analógico esquerdo <b>anda</b> · arraste à direita para <b>mirar</b><br>FOGO · PULO · REC recarrega'
  : '<b>↑ ↓</b> anda &nbsp;·&nbsp; <b>← →</b> vira a tela &nbsp;·&nbsp; <b>Q E</b> olha pra cima e pra baixo<br>'
  + '<b>Mouse</b> aponta onde o tiro vai · <b>Clique</b> ou <b>Ctrl</b> atira<br>'
  + '<b>1</b> pistola FK9 · <b>2</b> sua arma (<b>botão direito</b> ou <b>Z</b> dá zoom)<br>'
  + '<b>Shift</b> corre · <b>Espaço</b> pula · <b>R</b> recarrega · <b>P</b> pausa';

document.querySelectorAll('.dif').forEach(b => {
  b.onclick = () => {
    document.querySelectorAll('.dif').forEach(o => o.classList.remove('on'));
    b.classList.add('on');
    dif = DIFS[+b.dataset.d];
  };
});

// ── Tela de armas ─────────────────────────────────────────────────────────
const MAXES = {
  dano: 100, cad: 30, mun: 100,
};
function montarGradeArmas() {
  const g = $('gradeArmas');
  if (!g) return;
  g.innerHTML = '';
  PRIMARIAS.forEach((a, i) => {
    const dps = (a.dano * a.pelotas) / (a.cad / 60);          // dano por segundo
    const barra = (rot, pct) =>
      `<div class="barra"><span>${rot}</span><i><b style="width:${Math.min(100, pct)}%"></b></i></div>`;
    const d = document.createElement('div');
    d.className = 'arma-card' + (i === primIdx ? ' on' : '');
    d.innerHTML =
      `<div class="n">${a.nome}</div><div class="t">${a.tipo}</div>` +
      barra('DANO',    a.dano * a.pelotas) +
      barra('CADÊNCIA', 100 - a.cad * 3) +
      barra('PONTARIA', 100 - a.disp * 850) +
      `<div class="mun">Pente ${a.mag} · reserva ${a.reserva}` +
      (a.pelotas > 1 ? ` · ${a.pelotas} bagos` : '') +
      (a.zoom ? ' · com luneta' : '') + `</div>`;
    d.onclick = () => escolherPrimaria(i);
    g.appendChild(d);
  });
}
montarGradeArmas();

$('btnArmas').onclick = () => {
  $('menu').classList.add('hidden');
  $('armasTela').classList.remove('hidden');
};
$('voltarArmas').onclick = () => {
  $('armasTela').classList.add('hidden');
  $('menu').classList.remove('hidden');
};
$('continuar').onclick = () => retomar();
$('play').onclick = () => comecar();

function comecar() {
  // (re)cria os bots conforme a dificuldade
  bots.forEach(b => scene.remove(b.obj));
  bots.length = 0;
  for (let i = 0; i < dif.qtd; i++) criarBot(i);

  player.pos.copy(PONTOS[0]); player.vel.set(0, 0, 0);
  player.hp = 100; player.vivo = true; player.respawn = 0;
  player.protegido = 180; player.semLevar = 0;
  player.bal = ARMAS.map(a => ({ mag: a.mag, reserva: a.reserva }));
  player.recarregando = 0;
  player.kills = 0; player.deaths = 0;
  trocarArma(1); armaMalhas.forEach((g, k) => g.visible = (k === player.arma));
  euler.set(0, 0, 0);
  jogando = true; pausado = false;
  document.body.classList.add('playing');
  $('menu').classList.add('hidden');
  $('armasTela').classList.add('hidden');
  $('continuar').classList.add('hidden');
  $('killfeed').innerHTML = '';
  atualizarHUD();
}
let pausado = false;
function pausar() {
  jogando = false; pausado = true;
  mouseDown = botaoDir = false;
  document.body.classList.remove('playing', 'luneta');
  $('armasTela').classList.add('hidden');
  $('menu').classList.remove('hidden');
  $('continuar').classList.remove('hidden');
}
function retomar() {
  if (!pausado) return;
  pausado = false; jogando = true;
  document.body.classList.add('playing');
  $('menu').classList.add('hidden');
  $('continuar').classList.add('hidden');
  ultimo = performance.now();
}

// ── HUD ───────────────────────────────────────────────────────────────────
function atualizarHUD() {
  $('hpVal').textContent = Math.max(0, Math.round(player.hp));
  $('magVal').textContent = bal().mag;
  $('resVal').textContent = bal().reserva;
  $('armaNome').textContent = arma().nome;
  $('kills').textContent = player.kills;
  $('deaths').textContent = player.deaths;
  $('reloading').textContent = player.recarregando > 0 ? 'RECARREGANDO…' : '';
}
let hitTimer = 0;
function marcarAcerto() { hitTimer = 12; $('hitmark').style.opacity = '1'; }
function avisoDano() {
  const d = $('dmg');
  d.style.opacity = '.9';
  setTimeout(() => d.style.opacity = '0', 90);
}
function feed(txt) {
  const f = $('killfeed');
  const d = document.createElement('div');
  d.innerHTML = txt;
  f.prepend(d);
  while (f.children.length > 4) f.lastChild.remove();
  setTimeout(() => d.remove(), 4000);
}

// mira que abre conforme o recuo
function atualizarMira() {
  const s = 5 + player.recuo * 26 + (Math.hypot(player.vel.x, player.vel.z) * 1.6);
  $('cr-up').style.top = (-s - 9) + 'px';
  $('cr-dn').style.top = s + 'px';
  $('cr-lf').style.left = (-s - 9) + 'px';
  $('cr-rt').style.left = s + 'px';
}

// ── Combate ───────────────────────────────────────────────────────────────
function recarregar() {
  if (!jogando || !player.vivo) return;
  const a = arma(), b = bal();
  if (player.recarregando > 0 || b.mag === a.mag || b.reserva === 0) return;
  player.recarregando = a.recarga;
  atualizarHUD();
}

const _dir = new THREE.Vector3();
const _ndc = new THREE.Vector2();
function atirar() {
  if (!player.vivo || player.recarregando > 0 || player.cadencia > 0) return;
  const a = arma(), b = bal();
  if (b.mag <= 0) { recarregar(); return; }

  b.mag--;
  player.cadencia = a.cad;
  player.recuo = Math.min(.9, player.recuo + a.recuo);
  atualizarHUD();

  // clarão + fumaça
  const fl = armaGrp().userData.flash;
  fl.visible = true; fl.rotation.z = Math.random() * 6.28;
  setTimeout(() => fl.visible = false, 45);

  // direção base: o ponto da tela onde está o cursor
  // (com a luneta, a mira é o centro dela)
  const base = new THREE.Vector3();
  if (isTouch || player.mirando) {
    camera.getWorldDirection(base);
  } else {
    camera.updateMatrixWorld();
    ray.setFromCamera(_ndc.set(mira.nx, mira.ny), camera);
    base.copy(ray.ray.direction);
  }
  const disp = a.disp * (1 + player.recuo * 2)
             + (player.noChao ? 0 : .05)
             + Math.hypot(player.vel.x, player.vel.z) * .010;

  const origem = camera.position.clone();
  let acertouAlgum = false;

  // a escopeta solta vários projéteis de uma vez
  for (let n = 0; n < a.pelotas; n++) {
    _dir.copy(base);
    _dir.x += (Math.random() - .5) * disp;
    _dir.y += (Math.random() - .5) * disp;
    _dir.z += (Math.random() - .5) * disp;
    _dir.normalize();
    ray.set(origem, _dir);

    // o que está mais perto: bot ou parede?
    let alvoBot = null, distBot = Infinity, naCabeca = false;
    for (const b of bots) {
      if (!b.vivo) continue;
      const hits = ray.intersectObjects([b.cabeca, b.torso], false);
      if (hits.length && hits[0].distance < distBot) {
        distBot = hits[0].distance; alvoBot = b; naCabeca = hits[0].object === b.cabeca;
      }
    }
    const hitParede = ray.intersectObjects(paredes, false);
    const distParede = hitParede.length ? hitParede[0].distance : Infinity;

    const ponta = origem.clone().addScaledVector(_dir, Math.min(distBot, distParede, 200));
    if (n === 0 || a.pelotas <= 4) traco(origem.clone().addScaledVector(_dir, .6), ponta);

    if (alvoBot && distBot < distParede) {
      alvoBot.hp -= naCabeca ? a.danoCab : a.dano;
      sangue(ponta);
      acertouAlgum = true;
      if (alvoBot.hp <= 0 && alvoBot.vivo) {
        alvoBot.vivo = false;
        alvoBot.respawn = 180;
        alvoBot.obj.rotation.z = Math.PI / 2;      // tomba
        player.kills++;
        feed(`<b>VOCÊ</b> eliminou INIMIGO ${naCabeca ? '· <b>NA CABEÇA</b>' : ''}`);
        atualizarHUD();
      }
    } else if (hitParede.length) {
      const h = hitParede[0];
      const nm = h.face ? h.face.normal.clone().transformDirection(h.object.matrixWorld) : new THREE.Vector3(0,1,0);
      marcarFuro(h.point, nm);
      if (n === 0) fumaca(h.point);
    }
  }
  if (acertouAlgum) marcarAcerto();
}

function levarDano(d) {
  if (!player.vivo || player.protegido > 0) return;
  player.hp -= d;
  player.semLevar = 0;
  avisoDano();
  atualizarHUD();
  if (player.hp <= 0) {
    player.hp = 0; player.vivo = false; player.respawn = 150;
    player.deaths++;
    feed('<b>VOCÊ</b> foi eliminado');
    atualizarHUD();
  }
}

// ── Passo do jogador ──────────────────────────────────────────────────────
function passoJogador(dt) {
  if (!player.vivo) {
    player.respawn--;
    if (player.respawn <= 0) {
      const pts = pontosLivres();
      player.pos.copy(pts[(Math.random() * pts.length) | 0]);
      player.vel.set(0, 0, 0);
      player.hp = 100; player.vivo = true;
      player.protegido = 150;          // 2,5 s de proteção ao voltar
      player.semLevar = 0;
      player.bal = ARMAS.map(a => ({ mag: a.mag, reserva: a.reserva }));
      atualizarHUD();
    }
    return;
  }

  // proteção ao renascer e vida que volta sozinha depois de 3 s sem levar tiro
  if (player.protegido > 0) player.protegido--;
  player.semLevar++;
  if (player.semLevar > 180 && player.hp < 100) {
    player.hp = Math.min(100, player.hp + .35);
    if (player.semLevar % 12 === 0) atualizarHUD();
  }

  const correr = keys.ShiftLeft || keys.ShiftRight;
  const vel = correr ? 8.2 : 5.4;

  // setas ← → giram a tela junto (dá para jogar só no teclado)
  const giro = (keys.ArrowLeft ? 1 : 0) - (keys.ArrowRight ? 1 : 0);
  if (giro) euler.y += giro * 2.3 * dt;

  // Q / E olham para cima e para baixo
  const olhaV = (keys.KeyQ ? 1 : 0) - (keys.KeyE ? 1 : 0);
  if (olhaV) euler.x = Math.max(-1.1, Math.min(1.1, euler.x + olhaV * 1.6 * dt));
  else if (!keys.KeyQ && !keys.KeyE) euler.x *= .97;   // volta devagar para o nível

  const sy = Math.sin(euler.y), cy = Math.cos(euler.y);
  let f = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0) + toque.f;
  let s = (keys.KeyA ? 1 : 0) - (keys.KeyD ? 1 : 0) + toque.s;
  const len = Math.hypot(f, s);
  if (len > 1) { f /= len; s /= len; }

  player.vel.x = (-sy * f - cy * s) * vel;
  player.vel.z = (-cy * f + sy * s) * vel;

  // gravidade e pulo
  if ((keys.Space || toque.pulo) && player.noChao) { player.vel.y = 6.4; player.noChao = false; }
  player.vel.y -= 22 * dt;
  if (player.vel.y < -40) player.vel.y = -40;

  const p = player.pos;
  // se ficou preso dentro de algo, sobe até sair (em vez de travar)
  let saida = 0;
  while (bate(p) && saida++ < 40) p.y += .25;

  const nx = p.clone(); nx.x += player.vel.x * dt;
  if (!bate(nx)) p.x = nx.x;
  const nz = p.clone(); nz.z += player.vel.z * dt;
  if (!bate(nz)) p.z = nz.z;

  const ny = p.clone(); ny.y += player.vel.y * dt;
  if (!bate(ny)) { p.y = ny.y; player.noChao = false; }
  else {
    if (player.vel.y < 0) { p.y = alturaChao(p); player.noChao = true; }
    player.vel.y = 0;
  }
  if (p.y <= 0.001) { p.y = 0; player.noChao = true; player.vel.y = 0; }

  const lim = ARENA - 2;
  p.x = Math.max(-lim, Math.min(lim, p.x));
  p.z = Math.max(-lim, Math.min(lim, p.z));

  // tiro — automático segura o gatilho, semiautomático precisa clicar de novo
  if (player.cadencia > 0) player.cadencia--;
  const quer = mouseDown || toque.fogo || keys.ControlLeft || keys.ControlRight;
  if (jogando && quer && (arma().auto || !gatilhoAnt)) atirar();
  gatilhoAnt = quer;
  player.recuo *= .90;

  if (player.recarregando > 0) {
    player.recarregando--;
    if (player.recarregando === 0) {
      const a = arma(), b = bal();
      const usa = Math.min(a.mag - b.mag, b.reserva);
      b.mag += usa; b.reserva -= usa;
      atualizarHUD();
    }
  }

  // luneta da sniper (botão direito ou tecla Z)
  const querZoom = arma().zoom > 0 && (botaoDir || keys.KeyZ) && player.recarregando === 0;
  player.mirando = querZoom;
  const fovAlvo = querZoom ? arma().zoom : 78;
  if (Math.abs(camera.fov - fovAlvo) > .3) {
    camera.fov += (fovAlvo - camera.fov) * .25;
    camera.updateProjectionMatrix();
  }
  armaMalhas[player.arma].visible = !querZoom;
  document.body.classList.toggle('luneta', querZoom);

  // câmera: cabeça + balanço + recuo
  const andando = Math.hypot(player.vel.x, player.vel.z) > .5 && player.noChao;
  bob += andando ? (correr ? .22 : .15) : 0;
  const bx = Math.sin(bob) * .035, by = Math.abs(Math.cos(bob)) * .03;
  camera.position.set(p.x + bx, p.y + OLHO + by, p.z);
  euler.x -= player.recuo * .0055;
  camera.quaternion.setFromEuler(euler);

  const g = armaGrp();
  g.position.set(
    ARMA_BASE.x + bx * .5,
    ARMA_BASE.y + by * .6 - player.recuo * .05,
    ARMA_BASE.z + player.recuo * .14
  );
  g.rotation.x = player.recuo * .55 + (player.recarregando > 0 ? Math.sin(player.recarregando * .06) * .5 - .5 : 0);
}
let bob = 0;

// ── Inimigos: IA ──────────────────────────────────────────────────────────
const _v = new THREE.Vector3();
function passoBot(b, dt) {
  if (!b.vivo) {
    b.respawn--;
    if (b.respawn <= 0) respawnBot(b);
    b.obj.position.copy(b.pos);
    return;
  }

  const olhoBot = b.pos.clone().setY(b.pos.y + 1.5);
  const olhoPl  = player.pos.clone().setY(player.pos.y + OLHO);
  _v.subVectors(olhoPl, olhoBot);
  const dist = _v.length();
  _v.normalize();

  // enxerga o jogador?
  let vendo = false;
  if (player.vivo && dist < dif.alcance) {
    ray.set(olhoBot, _v);
    const h = ray.intersectObjects(paredes, false);
    vendo = !h.length || h[0].distance > dist - .6;
  }

  if (vendo) {
    b.verTimer++;
    b.dir = Math.atan2(_v.x, _v.z);
    // se aproxima até uma distância de combate
    if (dist > 12) {
      const nx = b.pos.clone(); nx.x += _v.x * dif.veloc * dt;
      if (!bate(nx)) b.pos.x = nx.x;
      const nz = b.pos.clone(); nz.z += _v.z * dif.veloc * dt;
      if (!bate(nz)) b.pos.z = nz.z;
    }
    // atira depois do tempo de reação
    b.tiroTimer--;
    if (b.verTimer > dif.reacao && b.tiroTimer <= 0) {
      b.tiroTimer = dif.cad + Math.random() * 20;
      traco(olhoBot, olhoPl.clone().add(new THREE.Vector3(
        (Math.random()-.5) * 1.6, (Math.random()-.5) * 1.2, (Math.random()-.5) * 1.6)));
      if (Math.random() < dif.precisao) levarDano(dif.dano);
    }
  } else {
    b.verTimer = Math.max(0, b.verTimer - 2);
    // patrulha
    _v.subVectors(b.alvo, b.pos); _v.y = 0;
    if (_v.length() < 2) b.alvo.copy(sorteiaPonto());
    _v.normalize();
    b.dir = Math.atan2(_v.x, _v.z);
    const nx = b.pos.clone(); nx.x += _v.x * 2.4 * dt;
    if (!bate(nx)) b.pos.x = nx.x; else b.alvo.copy(sorteiaPonto());
    const nz = b.pos.clone(); nz.z += _v.z * 2.4 * dt;
    if (!bate(nz)) b.pos.z = nz.z;
  }

  // cola no chão / degraus
  b.pos.y = alturaChao(b.pos);
  b.obj.position.copy(b.pos);
  b.obj.rotation.y = b.dir;
}

// ── Efeitos ───────────────────────────────────────────────────────────────
function passoEfeitos() {
  for (let i = tracos.length - 1; i >= 0; i--) {
    const t = tracos[i]; t.vida--;
    t.l.material.opacity = t.vida / 5 * .9;
    if (t.vida <= 0) { scene.remove(t.l); t.l.geometry.dispose(); tracos.splice(i, 1); }
  }
  for (let i = fumacas.length - 1; i >= 0; i--) {
    const f = fumacas[i]; f.vida--;
    f.m.scale.multiplyScalar(1.06);
    f.m.material.opacity = f.vida / 24 * .55;
    if (f.vida <= 0) { scene.remove(f.m); f.m.geometry.dispose(); fumacas.splice(i, 1); }
  }
  for (let i = sangues.length - 1; i >= 0; i--) {
    const s = sangues[i]; s.vida--;
    s.m.position.add(s.v); s.v.y -= .012;
    if (s.vida <= 0) { scene.remove(s.m); s.m.geometry.dispose(); sangues.splice(i, 1); }
  }
  if (hitTimer > 0 && --hitTimer === 0) $('hitmark').style.opacity = '0';
}

// ── Laço ──────────────────────────────────────────────────────────────────
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  moverMira(mira.x, mira.y);          // recalcula a mira no novo tamanho
});

camera.position.set(0, OLHO, 26);
let ultimo = performance.now();
function laco(agora) {
  requestAnimationFrame(laco);
  const dt = Math.min((agora - ultimo) / 1000, .05);
  ultimo = agora;

  if (jogando) {
    passoJogador(dt);
    for (const b of bots) passoBot(b, dt);
    atualizarMira();
  }
  passoEfeitos();

  renderer.render(scene, camera);
}

requestAnimationFrame(laco);
