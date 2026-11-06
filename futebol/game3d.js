// Dominic FC em 3D: desenha a mesma partida (a lógica continua no game.js) num estádio 3D com three.js.
// O game.js chama FC3D.start(campo) ao começar, FC3D.render(partida) a cada quadro e FC3D.stop() no fim.
(() => {
  let renderer, scene, camera, field, ballMesh, ballShadow, marker, chargeBar;
  const meshes = new Map();   // jogador da partida → boneco 3D
  let F;                      // medidas do campo do game.js (x/y em pixels do jogo)
  const S = 0.1;              // 1 pixel do jogo = 0,1 unidade 3D
  const camPos = { x: 0, z: 0 };
  let ballH = 0, ballVH = 0, lastOwner = null;

  const to3 = (x, y) => [(x - F.W / 2) * S, (y - F.MIDY) * S];

  // Gramado com listras e as linhas do campo, desenhado num canvas e usado como textura
  function fieldTexture() {
    const c = document.createElement('canvas');
    const w = 1024, h = Math.round(1024 * (F.FY1 - F.FY0 + 40) / (F.FX1 - F.FX0 + 40));
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    const sx = w / (F.FX1 - F.FX0 + 40), sy = h / (F.FY1 - F.FY0 + 40);
    const X = x => (x - F.FX0 + 20) * sx, Y = y => (y - F.FY0 + 20) * sy;
    for (let i = 0; i < 14; i++) { g.fillStyle = i % 2 ? '#2f9a40' : '#2a8c3a'; g.fillRect(i * w / 14, 0, w / 14 + 1, h); }
    g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 4;
    g.strokeRect(X(F.FX0), Y(F.FY0), X(F.FX1) - X(F.FX0), Y(F.FY1) - Y(F.FY0));
    g.beginPath(); g.moveTo(X(F.W / 2), Y(F.FY0)); g.lineTo(X(F.W / 2), Y(F.FY1)); g.stroke();
    g.beginPath(); g.ellipse(X(F.W / 2), Y(F.MIDY), 30 * sx, 30 * sy, 0, 0, Math.PI * 2); g.stroke();
    g.strokeRect(X(F.FX0), Y(F.MIDY - 60), 50 * sx, 120 * sy); g.strokeRect(X(F.FX1 - 50), Y(F.MIDY - 60), 50 * sx, 120 * sy);
    g.fillStyle = '#fff'; g.beginPath(); g.arc(X(F.W / 2), Y(F.MIDY), 5, 0, Math.PI * 2); g.fill();
    const t = new THREE.CanvasTexture(c);
    t.anisotropy = 4;
    return t;
  }

  // Torcida: pontinhos coloridos na arquibancada
  function crowdTexture() {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 128;
    const g = c.getContext('2d');
    g.fillStyle = '#2a2f45'; g.fillRect(0, 0, 512, 128);
    const cols = ['#e83a3a', '#2a6aff', '#ffd23a', '#ffffff', '#7ddf64', '#ff9a2e', '#b06cff', '#111'];
    for (let y = 4; y < 128; y += 8) for (let x = 2; x < 512; x += 6) {
      g.fillStyle = cols[(Math.random() * cols.length) | 0];
      g.fillRect(x + Math.random() * 2, y + Math.random() * 2, 4, 5);
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = THREE.RepeatWrapping; t.repeat.set(4, 1);
    return t;
  }

  function goal(side) {
    const grp = new THREE.Group();
    const [gx] = to3(side < 0 ? F.FX0 : F.FX1, 0);
    const hw = (F.GY1 - F.GY0) * S / 2, hgt = 2.4, depth = 1.6;
    const white = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const post = (x, y, z, w, h, d) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), white); m.position.set(x, y, z); m.castShadow = true; grp.add(m); };
    post(gx, hgt / 2, -hw, 0.15, hgt, 0.15); post(gx, hgt / 2, hw, 0.15, hgt, 0.15); post(gx, hgt, 0, 0.15, 0.15, hw * 2 + 0.15);
    const net = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.25, side: THREE.DoubleSide });
    const back = new THREE.Mesh(new THREE.PlaneGeometry(hw * 2, hgt), net);
    back.position.set(gx + side * depth, hgt / 2, 0); back.rotation.y = Math.PI / 2; grp.add(back);
    const top = new THREE.Mesh(new THREE.PlaneGeometry(depth, hw * 2), net);
    top.position.set(gx + side * depth / 2, hgt, 0); top.rotation.x = Math.PI / 2; grp.add(top);
    for (const z of [-hw, hw]) {
      const s = new THREE.Mesh(new THREE.PlaneGeometry(depth, hgt), net);
      s.position.set(gx + side * depth / 2, hgt / 2, z); grp.add(s);
    }
    return grp;
  }

  // Boneco do jogador: pernas, corpo da cor do time, cabeça e cabelo
  function makeMan(color, shorts) {
    const grp = new THREE.Group();
    const mat = c => new THREE.MeshStandardMaterial({ color: c });
    const legMat = mat(shorts), skin = mat(0xffcc99);
    const legs = [];
    for (const z of [-0.14, 0.14]) {
      const leg = new THREE.Group();
      const l = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.7, 0.16), legMat); l.position.y = -0.35; l.castShadow = true;
      const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.1, 0.18), mat(0x111111)); shoe.position.set(0.05, -0.72, 0);
      leg.add(l, shoe); leg.position.set(0, 0.75, z);
      grp.add(leg); legs.push(leg);
    }
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.65, 0.55), mat(color)); body.position.y = 1.08; body.castShadow = true;
    const arms = [];
    for (const z of [-0.36, 0.36]) {
      const a = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.55, 0.13), mat(color)); a.position.set(0, 1.05, z); a.castShadow = true;
      grp.add(a); arms.push(a);
    }
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), skin); head.position.y = 1.62; head.castShadow = true;
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.21, 12, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat(0x2a1a0a)); hair.position.y = 1.65;
    grp.add(body, head, hair);
    grp.userData = { legs, arms, step: 0 };
    return grp;
  }

  function start(fieldInfo) {
    F = fieldInfo;
    if (!renderer) {
      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.shadowMap.enabled = true;
      renderer.domElement.id = 'game3d';
      document.body.insertBefore(renderer.domElement, document.body.firstChild);
    }
    renderer.domElement.style.display = 'block';
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x7ec8ff);
    scene.fog = new THREE.Fog(0x7ec8ff, 60, 140);
    camera = new THREE.PerspectiveCamera(42, 1, 0.1, 400);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x3a5a3a, 0.75));
    const sun = new THREE.DirectionalLight(0xffffff, 0.9);
    sun.position.set(-20, 40, 25); sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 20, bottom: -20, near: 1, far: 100 });
    scene.add(sun);

    // Gramado (um pouco maior que o campo)
    const fw = (F.FX1 - F.FX0 + 40) * S, fh = (F.FY1 - F.FY0 + 40) * S;
    field = new THREE.Mesh(new THREE.PlaneGeometry(fw, fh), new THREE.MeshStandardMaterial({ map: fieldTexture() }));
    field.rotation.x = -Math.PI / 2; field.receiveShadow = true;
    scene.add(field);
    const outer = new THREE.Mesh(new THREE.PlaneGeometry(fw + 30, fh + 30), new THREE.MeshStandardMaterial({ color: 0x247a32 }));
    outer.rotation.x = -Math.PI / 2; outer.position.y = -0.02; scene.add(outer);
    scene.add(goal(-1), goal(1));

    // Arquibancada com torcida dos 4 lados
    const crowd = new THREE.MeshStandardMaterial({ map: crowdTexture() });
    const stand = (w, x, z, ry) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, 8, 6), crowd);
      m.position.set(x, 3, z); m.rotation.y = ry; m.rotation.x = 0; scene.add(m);
      const roof = new THREE.Mesh(new THREE.BoxGeometry(w, 0.4, 7), new THREE.MeshStandardMaterial({ color: 0xdddddd }));
      roof.position.set(x, 7.5, z); roof.rotation.y = ry; scene.add(roof);
    };
    stand(fw + 20, 0, -fh / 2 - 9, 0); stand(fw + 20, 0, fh / 2 + 12, 0);
    stand(fh + 20, -fw / 2 - 10, 0, Math.PI / 2); stand(fh + 20, fw / 2 + 10, 0, Math.PI / 2);
    // Placas de propaganda na beira do campo
    const boards = new THREE.MeshStandardMaterial({ color: 0x1a4ad0, emissive: 0x0a1a50 });
    for (const z of [-fh / 2 - 1, fh / 2 + 1]) { const b = new THREE.Mesh(new THREE.BoxGeometry(fw, 0.8, 0.2), boards); b.position.set(0, 0.4, z); scene.add(b); }

    ballMesh = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 12), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    ballMesh.castShadow = true;
    const spots = new THREE.Mesh(new THREE.SphereGeometry(0.225, 6, 4), new THREE.MeshStandardMaterial({ color: 0x111111, wireframe: true }));
    ballMesh.add(spots);
    scene.add(ballMesh);
    ballShadow = new THREE.Mesh(new THREE.CircleGeometry(0.25, 12), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3 }));
    ballShadow.rotation.x = -Math.PI / 2; ballShadow.position.y = 0.01; scene.add(ballShadow);

    // Seta amarela em cima de quem você controla, e a barra de força do chute
    marker = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.4, 4), new THREE.MeshBasicMaterial({ color: 0xffe94a }));
    marker.rotation.x = Math.PI; scene.add(marker);
    chargeBar = new THREE.Mesh(new THREE.BoxGeometry(1, 0.12, 0.12), new THREE.MeshBasicMaterial({ color: 0xffd23a }));
    scene.add(chargeBar);

    meshes.clear();
    ballH = 0; ballVH = 0; lastOwner = null;
    camPos.x = 0; camPos.z = 0;
    resize();
  }

  function resize() {
    if (!renderer) return;
    const w = innerWidth, h = innerHeight;
    renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize);

  const COLORS = [{ body: 0x2a6aff, shorts: 0xffffff, gk: 0xffd23a }, { body: 0xe83a3a, shorts: 0x222222, gk: 0x7ddf64 }];

  function render(M) {
    if (!renderer || !M) return;
    for (const p of M.players) {
      let m = meshes.get(p);
      if (!m) {
        const c = COLORS[p.team];
        m = makeMan(p.gk ? c.gk : c.body, c.shorts);
        scene.add(m); meshes.set(p, m);
      }
      const [x, z] = to3(p.x, p.y);
      m.position.set(x, 0, z);
      m.rotation.y = -p.face;
      // Anda: pernas e braços balançam conforme a velocidade
      const sp = Math.hypot(p.vx, p.vy);
      const u = m.userData;
      u.step += sp * 0.35;
      const sw = Math.sin(u.step) * Math.min(0.9, sp * 0.45);
      u.legs[0].rotation.z = sw; u.legs[1].rotation.z = -sw;
      u.arms[0].rotation.z = -sw * 0.8; u.arms[1].rotation.z = sw * 0.8;
    }
    // Bola: sobe quando é chutada forte e quica no chão
    const b = M.ball;
    const speed = Math.hypot(b.vx, b.vy);
    if (!b.owner && lastOwner && speed > 4.5) ballVH = Math.min(0.35, (speed - 4) * 0.06);   // chute forte: bola alta
    lastOwner = b.owner;
    if (b.owner) { ballH = 0; ballVH = 0; }
    else {
      ballVH -= 0.02; ballH += ballVH;
      if (ballH < 0) { ballH = 0; ballVH = Math.abs(ballVH) > 0.05 ? -ballVH * 0.45 : 0; }
    }
    const [bx, bz] = to3(b.x, b.y);
    ballMesh.position.set(bx, 0.22 + ballH * 4, bz);
    ballMesh.rotation.z -= b.vx * 0.15; ballMesh.rotation.x += b.vy * 0.15;
    ballShadow.position.set(bx, 0.01, bz);
    // Seta e barra de força
    const me = M.me && meshes.get(M.me);
    marker.visible = !!me;
    if (me) { marker.position.set(me.position.x, 2.25 + Math.sin(performance.now() / 150) * 0.08, me.position.z); }
    chargeBar.visible = !!me && M.charge > 0;
    if (chargeBar.visible) {
      chargeBar.scale.x = Math.max(0.05, M.charge);
      chargeBar.material.color.setHex(M.charge > 0.8 ? 0xff4a4a : 0xffd23a);
      chargeBar.position.set(me.position.x, 2.6, me.position.z);
    }
    // Câmera de TV: do lado do campo, alta, seguindo a bola devagar
    camPos.x += (bx * 0.85 - camPos.x) * 0.06;
    camPos.z += (bz * 0.3 - camPos.z) * 0.04;
    camera.position.set(camPos.x, 19, camPos.z + 27);
    camera.lookAt(camPos.x, 0, camPos.z + 1.5);
    renderer.render(scene, camera);
  }

  function stop() {
    if (renderer) renderer.domElement.style.display = 'none';
    for (const m of meshes.values()) scene && scene.remove(m);
    meshes.clear();
  }

  window.FC3D = { start, render, stop };
})();
