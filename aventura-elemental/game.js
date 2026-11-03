// Aventura Elemental — explore o reino, junte os orbes de FOGO, GELO e RAIO e derrote o Rei Sombrio.
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const T = 16, COLS = 20, ROWS = 12, HUD = 16;
  const W = COLS * T, H = ROWS * T + HUD;

  // ── Elementos ─────────────────────────────────────────────
  const ELEMS = {
    agua: { name: 'ÁGUA', color: '#3cb4ff', dark: '#1a6fb0', dmg: 1, speed: 3.2, cd: 16 },
    fogo: { name: 'FOGO', color: '#ff6a2a', dark: '#b03a10', dmg: 2, speed: 3.0, cd: 22 },
    gelo: { name: 'GELO', color: '#bff2ff', dark: '#5fb6d6', dmg: 1, speed: 3.0, cd: 20 },
    raio: { name: 'RAIO', color: '#ffe94a', dark: '#c9a000', dmg: 2, speed: 4.6, cd: 26 },
  };
  const ELEM_ORDER = ['agua', 'fogo', 'gelo', 'raio'];
  const ORB_TILES = { F: 'fogo', G: 'gelo', R: 'raio' };
  const ORB_HINTS = {
    fogo: 'Pegou o orbe de FOGO! Queime os arbustos que bloqueiam o caminho.',
    gelo: 'Pegou o orbe de GELO! Atire na água pra congelar e andar por cima.',
    raio: 'Pegou o orbe de RAIO! Quebre as pedras rachadas.',
  };

  // ── Mapa: 3 x 3 telas + a sala do chefão ─────────────────
  // # árvore  T muro  ~ água  I gelo  b arbusto  r pedra rachada  c baú  o baú aberto
  // D porta do castelo  F G R orbes  p pedestal vazio  . grama  , flores  s areia  n neve
  const SOLID = new Set(['#', 'T', '~', 'b', 'r', 'c', 'o', 'D']);
  const SHOT_WALL = new Set(['#', 'T', 'b', 'r', 'c', 'o', 'D']);
  const ROOMS = {};
  const CHESTS = {};   // 'sala:x,y' → 'vida' ou 'moedas'

  function room(key, opt) {
    const g = [];
    for (let y = 0; y < ROWS; y++) {
      const row = [];
      for (let x = 0; x < COLS; x++) {
        const edge = x === 0 || y === 0 || x === COLS - 1 || y === ROWS - 1;
        row.push(edge ? (opt.wall || '#') : opt.ground || '.');
      }
      g.push(row);
    }
    const ex = opt.exits || '';
    if (ex.includes('N')) g[0][9] = g[0][10] = opt.ground || '.';
    if (ex.includes('S')) g[ROWS - 1][9] = g[ROWS - 1][10] = opt.ground || '.';
    if (ex.includes('W')) g[5][0] = g[6][0] = opt.ground || '.';
    if (ex.includes('E')) g[5][COLS - 1] = g[6][COLS - 1] = opt.ground || '.';
    const rect = (x, y, w, h, ch) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) g[j][i] = ch; };
    const set = (x, y, ch) => { g[y][x] = ch; };
    // Florzinhas espalhadas sempre no mesmo lugar
    if ((opt.ground || '.') === '.') {
      for (let i = 0; i < 14; i++) {
        const x = 1 + ((i * 7 + key.length * 3) % 18), y = 1 + ((i * 5 + 3) % 10);
        if (g[y][x] === '.') g[y][x] = ',';
      }
    }
    if (opt.build) opt.build(rect, set);
    ROOMS[key] = { key, name: opt.name, grid: g, exits: ex, enemies: opt.enemies || [], ground: opt.ground || '.' };
  }

  room('1,2', {
    name: 'Vila do Começo', exits: 'NWE',
    build(rect, set) {
      rect(8, 1, 4, 2, 'b');   // arbustos fechando o caminho pro norte
      rect(3, 3, 2, 1, '#'); rect(15, 3, 2, 1, '#'); set(3, 8, '#'); set(16, 8, '#');
      rect(6, 7, 1, 1, '#'); rect(13, 7, 1, 1, '#');
    },
  });
  room('0,2', {
    name: 'Floresta Sombria', exits: 'E',
    build(rect, set) {
      rect(2, 2, 3, 1, '#'); rect(10, 2, 2, 3, '#'); rect(14, 7, 3, 2, '#'); rect(5, 8, 2, 2, '#');
      rect(16, 2, 1, 3, '#'); rect(8, 6, 1, 2, '#');
      rect(3, 4, 3, 3, '.'); set(4, 5, 'F');
    },
    enemies: [['slime', 8, 3], ['slime', 12, 8], ['slime', 6, 9]],
  });
  room('2,2', {
    name: 'Praia', exits: 'W', ground: 's',
    build(rect, set) {
      rect(15, 1, 4, 10, '~'); rect(14, 3, 1, 6, '~');
      set(6, 3, '#'); set(9, 8, '#'); set(3, 9, '#');
      set(12, 2, 'c'); CHESTS['2,2:12,2'] = 'vida';
    },
    enemies: [['slime', 8, 5], ['slime', 11, 8], ['bat', 5, 8]],
  });
  room('1,1', {
    name: 'Lago Azul', exits: 'NSWE',
    build(rect, set) {
      rect(5, 1, 10, 4, '~'); rect(7, 5, 6, 1, '~');
      set(2, 8, '#'); set(17, 8, '#'); set(3, 2, '#'); set(16, 2, '#'); set(2, 3, '#'); set(17, 3, '#');
    },
    enemies: [['bat', 4, 7], ['bat', 15, 7], ['slime', 9, 8]],
  });
  room('2,1', {
    name: 'Caverna de Gelo', exits: 'WN', ground: 'n', wall: 'T',
    build(rect, set) {
      rect(13, 2, 6, 1, 'T'); rect(13, 9, 6, 1, 'T'); rect(13, 2, 1, 3, 'T'); rect(13, 7, 1, 3, 'T');
      rect(4, 3, 2, 1, 'I'); rect(7, 8, 3, 1, 'I');
      set(16, 5, 'G');
    },
    enemies: [['skeleton', 10, 3], ['skeleton', 10, 8], ['bat', 15, 8]],
  });
  room('0,1', {
    name: 'Pântano', exits: 'EN',
    build(rect, set) {
      rect(3, 2, 9, 8, '~'); rect(5, 4, 5, 4, '.'); set(7, 5, 'R');
      set(15, 2, '#'); set(16, 9, '#');
    },
    enemies: [['slime', 14, 3], ['slime', 14, 8], ['skeleton', 16, 5]],
  });
  room('0,0', {
    name: 'Ruínas Antigas', exits: 'SE', ground: 's', wall: 'T',
    build(rect, set) {
      rect(3, 2, 3, 3, 'r'); set(4, 3, 'c'); CHESTS['0,0:4,3'] = 'vida';
      rect(9, 2, 1, 3, 'T'); rect(12, 7, 3, 1, 'T'); rect(5, 8, 1, 2, 'T');
      set(15, 8, 'c'); CHESTS['0,0:15,8'] = 'moedas';
    },
    enemies: [['skeleton', 10, 5], ['skeleton', 8, 8]],
  });
  room('2,0', {
    name: 'Montanha', exits: 'SW', wall: 'T',
    build(rect, set) {
      rect(2, 2, 4, 2, 'T'); rect(14, 2, 4, 3, 'T'); rect(6, 8, 3, 2, 'T');
      set(16, 8, 'c'); CHESTS['2,0:16,8'] = 'moedas';
    },
    enemies: [['bat', 5, 5], ['bat', 12, 4], ['bat', 14, 8]],
  });
  room('1,0', {
    name: 'Portão do Castelo', exits: 'SWE', ground: 's',
    build(rect, set) {
      rect(1, 1, 18, 2, 'T'); set(9, 2, 'D'); set(10, 2, 'D');
      rect(1, 4, 18, 1, 'T'); rect(8, 4, 4, 1, 'r');   // pedras rachadas no caminho
    },
    enemies: [['skeleton', 5, 8], ['skeleton', 14, 8]],
  });
  room('boss', {
    name: 'Trono do Rei Sombrio', exits: '', ground: 's', wall: 'T',
    build(rect, set) { set(4, 3, 'T'); set(15, 3, 'T'); set(4, 8, 'T'); set(15, 8, 'T'); },
  });
  const BASE = {};
  for (const k in ROOMS) BASE[k] = ROOMS[k].grid.map(r => r.slice());

  // ── Estado ────────────────────────────────────────────────
  const SAVE_KEY = 'aventuraElemental';
  let save = null;
  let roomKey = '1,2', cur = ROOMS[roomKey];
  const player = { x: 0, y: 0, dx: 0, dy: 1, hp: 5, maxHp: 5, coins: 0, inv: 0, kx: 0, ky: 0, cd: 0, walk: 0, elem: 'agua', owned: ['agua'] };
  let enemies = [], shots = [], pickups = [], parts = [];
  let boss = null, bossDead = false;
  let mods = {};   // mudanças no mapa (arbusto queimado, água congelada...) por sala
  let state = 'title';   // title (menu), play, dead, win
  let started = false;    // já tem uma aventura rodando (o JOGAR do menu só continua)
  function setState(s) {
    state = s;
    document.body.classList.toggle('in-menu', s === 'title');
    if (s === 'title') { for (const k in keys) keys[k] = false; renderMenu(); }
  }
  let stateTimer = 0, frame = 0;
  let toast = '', toastTimer = 0;
  let roomTitleTimer = 0;

  // ── Conta: moedas, personagens, melhorias e usuário (continuam mesmo num jogo novo) ──
  const META_KEY = 'aventuraConta';
  const SKINS = [
    { id: 'explorador', name: 'Explorador', price: 0,   hair: '#5a3214', skin: '#f2c18d', pants: '#3a2a5a' },
    { id: 'ninja',      name: 'Ninja',      price: 15,  hair: '#1a1a1a', skin: '#f2c18d', pants: '#1a1a1a', mask: '#1a1a1a' },
    { id: 'cavaleiro',  name: 'Cavaleiro',  price: 25,  hair: '#9aa0ad', skin: '#e8b98a', pants: '#5d5f6a', helmet: '#b8bcc8' },
    { id: 'mago',       name: 'Mago',       price: 40,  hair: '#e8e8e8', skin: '#f2c18d', pants: '#3a1f5c', hat: '#5a2a9a' },
    { id: 'pirata',     name: 'Pirata',     price: 60,  hair: '#2a1a0a', skin: '#d9a070', pants: '#6b4423', bandana: '#d62828' },
    { id: 'robo',       name: 'Robô',       price: 100, hair: '#7d8a99', skin: '#b8c4d0', pants: '#4a5566', robot: true },
  ];
  const UPGRADES = [
    { id: 'vida',   name: '+1 Coração',    icon: '❤️', desc: 'Começa com mais vida',     prices: [15, 30, 45] },
    { id: 'forca',  name: 'Tiro Forte',    icon: '💥', desc: '+1 de dano em todo tiro',  prices: [30, 60] },
    { id: 'rapido', name: 'Tiro Rápido',   icon: '⚡', desc: 'Atira mais vezes',          prices: [20, 40] },
    { id: 'veloz',  name: 'Botas Velozes', icon: '👟', desc: 'Anda mais rápido',          prices: [20, 40] },
  ];
  const meta = { coins: 0, skins: ['explorador'], skin: 'explorador', up: { vida: 0, forca: 0, rapido: 0, veloz: 0 }, user: null };
  let chestHearts = 0;   // corações ganhos nos baús desta aventura
  function loadMeta() {
    let m = null;
    try { m = JSON.parse(localStorage.getItem(META_KEY)); } catch (e) { m = null; }
    if (!m) {
      // Quem já jogava antes da loja traz as moedas do save antigo
      loadSave();
      if (save && save.coins) meta.coins = save.coins;
      return;
    }
    meta.coins = m.coins || 0;
    meta.skins = Array.isArray(m.skins) && m.skins.length ? m.skins : ['explorador'];
    meta.skin = SKINS.some(s => s.id === m.skin) ? m.skin : 'explorador';
    for (const u of UPGRADES) meta.up[u.id] = Math.min(u.prices.length, (m.up && m.up[u.id]) || 0);
    meta.user = m.user || null;
  }
  function writeMeta() {
    try { localStorage.setItem(META_KEY, JSON.stringify(meta)); } catch (e) { /* sem salvar */ }
  }
  const skinOf = id => SKINS.find(s => s.id === id) || SKINS[0];
  // Vida máxima, dano, recarga e velocidade com as melhorias da loja
  const maxHpNow = () => 5 + chestHearts + meta.up.vida;
  const dmgOf = elem => ELEMS[elem].dmg + meta.up.forca;
  const cdOf = elem => Math.round(ELEMS[elem].cd * (1 - 0.2 * meta.up.rapido));
  const walkSpeed = () => 1.35 * (1 + 0.12 * meta.up.veloz);

  function loadSave() {
    try { save = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { save = null; }
  }
  function writeSave() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        owned: player.owned, elem: player.elem, chestHearts,
        mods, bossDead, room: roomKey === 'boss' ? '1,0' : roomKey,
      }));
    } catch (e) { /* sem salvar */ }
    writeMeta();
  }
  function setTile(x, y, ch) {
    cur.grid[y][x] = ch;
    (mods[roomKey] = mods[roomKey] || {})[x + ',' + y] = ch;
  }
  function applyMods() {
    for (const k in ROOMS) ROOMS[k].grid = BASE[k].map(r => r.slice());
    for (const k in mods) for (const p in mods[k]) {
      const [x, y] = p.split(',').map(Number);
      if (ROOMS[k]) ROOMS[k].grid[y][x] = mods[k][p];
    }
  }

  function newGame(cont) {
    loadSave();
    if (cont && save) {
      player.owned = save.owned || ['agua'];
      player.elem = save.elem || 'agua';
      chestHearts = save.chestHearts != null ? save.chestHearts : Math.max(0, (save.maxHp || 5) - 5);
      mods = save.mods || {};
      bossDead = !!save.bossDead;
      roomKey = ROOMS[save.room] ? save.room : '1,2';
    } else {
      player.owned = ['agua']; player.elem = 'agua'; chestHearts = 0;
      mods = {}; bossDead = false; roomKey = '1,2';
    }
    applyMods();
    player.maxHp = maxHpNow();
    player.hp = player.maxHp;
    enterRoom(roomKey, 'center');
    started = true;
    setState('play');
    if (!cont || !save) say('Ache os 3 orbes elementais! Os arbustos ao norte precisam de FOGO.');
    writeSave();
  }

  // ── Salas ─────────────────────────────────────────────────
  const tileAt = (x, y) => (x < 0 || y < 0 || x >= COLS || y >= ROWS ? '#' : cur.grid[y][x]);

  function enterRoom(key, from) {
    roomKey = key; cur = ROOMS[key];
    shots = []; pickups = []; parts = []; boss = null;
    enemies = cur.enemies.map(([type, x, y]) => makeEnemy(type, x * T + 8, y * T + 8));
    if (from === 'center') { player.x = 10 * T; player.y = 6.5 * T; }
    else if (from === 'N') { player.y = T * 0.6; }
    else if (from === 'S') { player.y = ROWS * T - T * 0.6; }
    else if (from === 'W') { player.x = T * 0.6; }
    else if (from === 'E') { player.x = COLS * T - T * 0.6; }
    if (key === 'boss') {
      player.x = 10 * T; player.y = 9.5 * T;
      if (!bossDead) {
        boss = { x: 10 * T, y: 3 * T, hp: 40, maxHp: 40, t: 0, shoot: 90, summon: 360, hurt: 0, stun: 0 };
        setTileRaw(9, ROWS - 1, 'T'); setTileRaw(10, ROWS - 1, 'T');
      } else { setTileRaw(9, ROWS - 1, 's'); setTileRaw(10, ROWS - 1, 's'); }
    }
    roomTitleTimer = 120;
    writeSave();
  }
  function setTileRaw(x, y, ch) { cur.grid[y][x] = ch; }

  const NEIGHBOR = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
  const OPPOSITE = { N: 'S', S: 'N', W: 'E', E: 'W' };
  function leaveRoom(dir) {
    if (roomKey === 'boss') {
      // Saindo do trono volta pra frente da porta do castelo
      enterRoom('1,0', 'center');
      player.x = 10 * T; player.y = 3.5 * T;
      return;
    }
    const [rx, ry] = roomKey.split(',').map(Number);
    const [dx, dy] = NEIGHBOR[dir];
    const key = (rx + dx) + ',' + (ry + dy);
    if (!ROOMS[key]) return;
    enterRoom(key, OPPOSITE[dir]);
  }

  // ── Inimigos ──────────────────────────────────────────────
  const ENEMY = {
    slime: { hp: 2, speed: 0.5, size: 11, fly: false },
    bat: { hp: 1, speed: 0.95, size: 10, fly: true },
    skeleton: { hp: 3, speed: 0.45, size: 11, fly: false },
  };
  function makeEnemy(type, x, y) {
    return { type, x, y, hp: ENEMY[type].hp, vx: 0, vy: 0, t: Math.random() * 60 | 0, stun: 0, hurt: 0, shoot: 60 + Math.random() * 80 };
  }

  function solidFor(ch, fly) {
    if (fly) return ch === '#' || ch === 'T' || ch === 'D';
    return SOLID.has(ch);
  }
  // Move uma caixa centrada em (o.x, o.y) testando os 4 cantos
  function moveBox(o, dx, dy, half, fly) {
    const blocked = (x, y) => {
      for (const [cx, cy] of [[x - half, y - half], [x + half, y - half], [x - half, y + half], [x + half, y + half]]) {
        const tx = Math.floor(cx / T), ty = Math.floor(cy / T);
        if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) { if (o !== player) return { tx, ty }; continue; }
        if (solidFor(cur.grid[ty][tx], fly)) return { tx, ty };
      }
      return null;
    };
    let hitX = null, hitY = null;
    if (dx) { const b = blocked(o.x + dx, o.y); if (b) hitX = b; else o.x += dx; }
    if (dy) { const b = blocked(o.x, o.y + dy); if (b) hitY = b; else o.y += dy; }
    return hitX || hitY;
  }

  function updateEnemies() {
    for (const e of enemies) {
      const def = ENEMY[e.type];
      if (e.hurt > 0) e.hurt--;
      if (e.stun > 0) { e.stun--; continue; }
      e.t--;
      const px = player.x - e.x, py = player.y - e.y, d = Math.hypot(px, py) || 1;
      if (e.type === 'slime') {
        if (e.t <= 0) {
          e.t = 50 + Math.random() * 70;
          if (d < 70 && Math.random() < 0.6) { e.vx = px / d * def.speed; e.vy = py / d * def.speed; }
          else { const a = Math.random() * Math.PI * 2; e.vx = Math.cos(a) * def.speed; e.vy = Math.sin(a) * def.speed; }
          if (Math.random() < 0.25) e.vx = e.vy = 0;
        }
      } else if (e.type === 'bat') {
        if (d < 95) { e.vx = px / d * def.speed + Math.sin(frame / 8 + e.x) * 0.4; e.vy = py / d * def.speed + Math.cos(frame / 9) * 0.4; }
        else { e.vx = Math.sin(frame / 30 + e.y) * 0.3; e.vy = Math.cos(frame / 25 + e.x) * 0.3; }
      } else if (e.type === 'skeleton') {
        // Fica de longe e joga osso
        if (e.t <= 0) {
          e.t = 40;
          const want = d > 80 ? 1 : d < 50 ? -1 : 0;
          const a = Math.atan2(py, px) + (want === 0 ? Math.PI / 2 * (Math.random() < 0.5 ? 1 : -1) : 0);
          e.vx = Math.cos(a) * def.speed * (want || 1); e.vy = Math.sin(a) * def.speed * (want || 1);
        }
        e.shoot--;
        if (e.shoot <= 0 && d < 150) {
          e.shoot = 110;
          shots.push({ x: e.x, y: e.y, vx: px / d * 1.8, vy: py / d * 1.8, enemy: true, life: 140, bone: true });
        }
      }
      const hit = moveBox(e, e.vx, e.vy, def.size / 2, def.fly);
      if (hit && e.type !== 'bat') { e.vx = -e.vx; e.vy = -e.vy; }
      if (d < def.size / 2 + 6) hurtPlayer(e.x, e.y);
    }
  }

  function updateBoss() {
    if (!boss) return;
    const b = boss;
    if (b.hurt > 0) b.hurt--;
    if (b.stun > 0) { b.stun--; } else {
      b.t++;
      const fast = b.hp < b.maxHp / 2;
      b.x = 10 * T + Math.sin(b.t / (fast ? 45 : 70)) * 6.5 * T;
      b.y = 3 * T + Math.sin(b.t / 37) * 10;
      b.shoot--;
      if (b.shoot <= 0) {
        // Leque de bolas sombrias na sua direção
        b.shoot = fast ? 70 : 100;
        const base = Math.atan2(player.y - b.y, player.x - b.x);
        const n = fast ? 7 : 5;
        for (let i = 0; i < n; i++) {
          const a = base + (i - (n - 1) / 2) * 0.28;
          shots.push({ x: b.x, y: b.y + 8, vx: Math.cos(a) * 1.7, vy: Math.sin(a) * 1.7, enemy: true, life: 200, dark: true });
        }
        beep(140, 0.12, 'sawtooth');
      }
      if (fast) {
        b.summon--;
        if (b.summon <= 0 && enemies.length < 4) {
          b.summon = 360;
          enemies.push(makeEnemy('bat', b.x - 20, b.y + 10), makeEnemy('bat', b.x + 20, b.y + 10));
        }
      }
    }
    if (Math.abs(player.x - b.x) < 18 && Math.abs(player.y - b.y) < 18) hurtPlayer(b.x, b.y);
  }

  // ── Tiros ─────────────────────────────────────────────────
  function fire() {
    if (player.cd > 0) return;
    const el = ELEMS[player.elem];
    player.cd = cdOf(player.elem);
    shots.push({
      x: player.x + player.dx * 8, y: player.y + player.dy * 8,
      vx: player.dx * el.speed, vy: player.dy * el.speed, elem: player.elem, life: 70,
    });
    beep({ agua: 520, fogo: 300, gelo: 880, raio: 1200 }[player.elem], 0.06, player.elem === 'raio' ? 'square' : 'triangle');
  }

  function updateShots() {
    for (const s of shots) {
      s.x += s.vx; s.y += s.vy; s.life--;
      const tx = Math.floor(s.x / T), ty = Math.floor(s.y / T);
      const ch = tileAt(tx, ty);
      if (!s.enemy) {
        if (s.elem === 'gelo' && ch === '~') { freeze(tx, ty); s.life = 0; continue; }
        if (SHOT_WALL.has(ch)) { hitTile(s, tx, ty, ch); s.life = 0; continue; }
        for (const e of enemies) {
          if (Math.abs(e.x - s.x) < 8 && Math.abs(e.y - s.y) < 8) { damageEnemy(e, s); s.life = 0; break; }
        }
        if (boss && s.life > 0 && Math.abs(boss.x - s.x) < 16 && Math.abs(boss.y - s.y) < 16) {
          boss.hp -= dmgOf(s.elem); boss.hurt = 8; s.life = 0;
          if (s.elem === 'gelo') boss.stun = 20;
          burst(s.x, s.y, ELEMS[s.elem].color, 6);
          beep(220, 0.05, 'square');
          if (boss.hp <= 0) bossDefeated();
        }
      } else {
        if (SHOT_WALL.has(ch)) { s.life = 0; continue; }
        if (Math.abs(player.x - s.x) < 7 && Math.abs(player.y - s.y) < 7) { hurtPlayer(s.x - s.vx * 4, s.y - s.vy * 4); s.life = 0; }
      }
    }
    shots = shots.filter(s => s.life > 0);
  }

  function hitTile(s, tx, ty, ch) {
    const cx = tx * T + 8, cy = ty * T + 8;
    if (ch === 'b' && s.elem === 'fogo') {
      setTile(tx, ty, '.');
      burst(cx, cy, '#ff8a2a', 14); burst(cx, cy, '#ffd23a', 8);
      beep(180, 0.15, 'sawtooth');
      // O fogo pega nos arbustos do lado também
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        if (tileAt(tx + dx, ty + dy) === 'b') setTimeout(() => { if (tileAt(tx + dx, ty + dy) === 'b') hitTile({ elem: 'fogo' }, tx + dx, ty + dy, 'b'); }, 180);
      }
      writeSave();
    } else if (ch === 'r' && s.elem === 'raio') {
      setTile(tx, ty, cur.ground === 's' ? 's' : '.');
      burst(cx, cy, '#999', 14); burst(cx, cy, '#ffe94a', 6);
      beep(90, 0.18, 'square');
      writeSave();
    } else if (ch === 'c') {
      openChest(tx, ty);
    } else {
      burst(s.x - s.vx, s.y - s.vy, ELEMS[s.elem].color, 4);
      if (ch === 'b') say('O arbusto não queima... precisa do FOGO!');
      if (ch === 'r') say('Pedra rachada... só o RAIO quebra!');
    }
  }

  function freeze(tx, ty) {
    // Congela um quadrado 3x3, largo o bastante pra passar andando
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (tileAt(tx + dx, ty + dy) === '~') setTile(tx + dx, ty + dy, 'I');
    }
    burst(tx * T + 8, ty * T + 8, '#e8fbff', 10);
    beep(1300, 0.08, 'sine');
    writeSave();
  }

  function damageEnemy(e, s) {
    const el = ELEMS[s.elem];
    e.hp -= dmgOf(s.elem); e.hurt = 8;
    if (s.elem === 'gelo') e.stun = 120;
    else { e.x += Math.sign(s.vx) * 4; e.y += Math.sign(s.vy) * 4; }
    burst(e.x, e.y, el.color, 6);
    beep(330, 0.05, 'square');
    if (e.hp <= 0) {
      e.dead = true;
      burst(e.x, e.y, '#fff', 12);
      const r = Math.random();
      if (r < 0.25) pickups.push({ type: 'heart', x: e.x, y: e.y, life: 600 });
      else if (r < 0.65) pickups.push({ type: 'coin', x: e.x, y: e.y, life: 600 });
    }
    enemies = enemies.filter(o => !o.dead);
  }

  function bossDefeated() {
    burst(boss.x, boss.y, '#b06cff', 40); burst(boss.x, boss.y, '#ffd23a', 30);
    boss = null; bossDead = true; enemies = []; shots = [];
    setTileRaw(9, ROWS - 1, 's'); setTileRaw(10, ROWS - 1, 's');
    state = 'win'; stateTimer = 0;
    beep(523, 0.15, 'triangle'); setTimeout(() => beep(659, 0.15, 'triangle'), 150); setTimeout(() => beep(784, 0.3, 'triangle'), 300);
    writeSave();
  }

  function openChest(tx, ty) {
    const what = CHESTS[roomKey + ':' + tx + ',' + ty];
    setTile(tx, ty, 'o');
    burst(tx * T + 8, ty * T + 8, '#ffd23a', 16);
    if (what === 'vida') {
      chestHearts++; player.maxHp = maxHpNow(); player.hp = player.maxHp;
      say('Baú: +1 coração! Agora você tem ' + player.maxHp + ' corações.');
    } else {
      meta.coins += 10;
      say('Baú: +10 moedas!');
    }
    beep(660, 0.1, 'triangle'); setTimeout(() => beep(880, 0.15, 'triangle'), 110);
    writeSave();
  }

  // ── Jogador ───────────────────────────────────────────────
  function hurtPlayer(fx, fy) {
    if (player.inv > 0 || state !== 'play') return;
    player.hp--; player.inv = 70;
    const d = Math.hypot(player.x - fx, player.y - fy) || 1;
    player.kx = (player.x - fx) / d * 3; player.ky = (player.y - fy) / d * 3;
    burst(player.x, player.y, '#ff4040', 8);
    beep(120, 0.15, 'sawtooth');
    if (player.hp <= 0) { state = 'dead'; stateTimer = 0; }
  }

  function swapElem(to) {
    if (to && !player.owned.includes(to)) return;
    if (!to) {
      const list = ELEM_ORDER.filter(e => player.owned.includes(e));
      to = list[(list.indexOf(player.elem) + 1) % list.length];
    }
    if (to === player.elem) return;
    player.elem = to;
    say(ELEMS[to].name);
    beep(440, 0.05, 'sine');
  }

  function updatePlayer() {
    if (player.cd > 0) player.cd--;
    if (player.inv > 0) player.inv--;
    let mx = 0, my = 0;
    if (keys.left) mx -= 1;
    if (keys.right) mx += 1;
    if (keys.up) my -= 1;
    if (keys.down) my += 1;
    if (stick.active) { mx = stick.x; my = stick.y; }
    const m = Math.hypot(mx, my);
    if (m > 0.2) {
      mx /= Math.max(1, m); my /= Math.max(1, m);
      // Olha pra direção principal (4 direções)
      if (Math.abs(mx) > Math.abs(my)) { player.dx = Math.sign(mx); player.dy = 0; }
      else { player.dx = 0; player.dy = Math.sign(my); }
      player.walk++;
    } else { mx = my = 0; }
    const speed = walkSpeed();
    const hit = moveBox(player, mx * speed + player.kx, my * speed + player.ky, 5, false);
    player.kx *= 0.8; player.ky *= 0.8;
    if (hit) bump(hit.tx, hit.ty);

    // Saiu pela borda: outra sala
    if (player.x < 2) leaveRoom('W');
    else if (player.x > W - 2) leaveRoom('E');
    else if (player.y < 2) leaveRoom('N');
    else if (player.y > ROWS * T - 2) leaveRoom('S');

    // Pegou um orbe?
    const tx = Math.floor(player.x / T), ty = Math.floor(player.y / T);
    const ch = tileAt(tx, ty);
    if (ORB_TILES[ch]) {
      const el = ORB_TILES[ch];
      setTile(tx, ty, 'p');
      if (!player.owned.includes(el)) player.owned.push(el);
      player.elem = el;
      burst(player.x, player.y, ELEMS[el].color, 30);
      say(ORB_HINTS[el]);
      beep(523, 0.1, 'triangle'); setTimeout(() => beep(784, 0.2, 'triangle'), 120);
      writeSave();
    }
    for (const p of pickups) {
      if (Math.abs(p.x - player.x) < 10 && Math.abs(p.y - player.y) < 10) {
        p.life = 0;
        if (p.type === 'heart') player.hp = Math.min(player.maxHp, player.hp + 1);
        else meta.coins++;
        beep(p.type === 'heart' ? 700 : 990, 0.06, 'triangle');
      }
    }
    pickups = pickups.filter(p => --p.life > 0);
    if (keys.attack) fire();
  }

  // Encostou num bloco: baú abre, porta do castelo pede os orbes
  function bump(tx, ty) {
    const ch = tileAt(tx, ty);
    if (ch === 'c') openChest(tx, ty);
    else if (ch === 'D') {
      const missing = ['fogo', 'gelo', 'raio'].filter(e => !player.owned.includes(e));
      if (missing.length) say('A porta tem 3 buracos de orbe. Faltam: ' + missing.map(e => ELEMS[e].name).join(', '));
      else enterRoom('boss');
    }
  }

  // ── Efeitos ───────────────────────────────────────────────
  function burst(x, y, color, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, sp = 0.5 + Math.random() * 1.8;
      parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 20 + Math.random() * 20, color });
    }
  }
  function say(msg) { toast = msg; toastTimer = 200; }

  let audio = null, muted = false;
  try { muted = localStorage.getItem('aventuraMudo') === '1'; } catch (e) { /* ok */ }
  function beep(freq, dur, type) {
    if (muted) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      const o = audio.createOscillator(), g = audio.createGain();
      o.type = type || 'square'; o.frequency.value = freq;
      g.gain.setValueAtTime(0.06, audio.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + dur);
      o.connect(g); g.connect(audio.destination);
      o.start(); o.stop(audio.currentTime + dur);
    } catch (e) { /* sem som */ }
  }
  const soundBtn = document.getElementById('sound-btn');
  const renderSound = () => { soundBtn.textContent = muted ? '🔇' : '🔊'; };
  renderSound();
  soundBtn.addEventListener('click', () => {
    muted = !muted; renderSound();
    try { localStorage.setItem('aventuraMudo', muted ? '1' : '0'); } catch (e) { /* ok */ }
  });

  // ── Loop ──────────────────────────────────────────────────
  function update() {
    frame++;
    // No menu, a prévia do herói vai girando
    if (state === 'title' && menuPage === 'main' && frame % 45 === 0) { heroTurn++; heroCanvas($('hero'), meta.skin, player.elem, HERO_DIRS[heroTurn % 4]); }
    if (toastTimer > 0) toastTimer--;
    if (roomTitleTimer > 0) roomTitleTimer--;
    for (const p of parts) { p.x += p.vx; p.y += p.vy; p.vx *= 0.92; p.vy *= 0.92; p.life--; }
    parts = parts.filter(p => p.life > 0);
    if (state === 'play') {
      updatePlayer();
      if (state !== 'play') return;
      updateEnemies();
      updateBoss();
      updateShots();
    } else if (state === 'dead') {
      stateTimer++;
      if (stateTimer > 120) {
        // Acorda na vila com a vida cheia (os orbes continuam com você)
        player.hp = player.maxHp; player.inv = 90;
        enterRoom('1,2', 'center');
        state = 'play';
        say('Você acordou na vila. Tente de novo!');
      }
    } else if (state === 'win') {
      stateTimer++;
    }
  }

  // ── Desenho ───────────────────────────────────────────────
  const hash = (x, y) => ((x * 73856093) ^ (y * 19349663) ^ roomKey.length * 83492791) >>> 0;
  function px(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); }

  function drawGround(ch, x, y, tx, ty) {
    if (ch === 's') {
      px(x, y, T, T, '#e2c98a');
      if (hash(tx, ty) % 5 === 0) px(x + (hash(tx, ty) % 12), y + (hash(ty, tx) % 12), 2, 1, '#c9ae6c');
    } else if (ch === 'n') {
      px(x, y, T, T, '#eef6fb');
      if (hash(tx, ty) % 4 === 0) px(x + (hash(tx, ty) % 12), y + (hash(ty, tx) % 12), 2, 2, '#d4e6f0');
    } else {
      px(x, y, T, T, '#4fa43a');
      const h = hash(tx, ty);
      px(x + h % 13, y + (h >> 4) % 13, 1, 2, '#3e8a2c');
      px(x + (h >> 8) % 13, y + (h >> 12) % 13, 1, 2, '#62b84a');
    }
  }

  function drawTile(ch, tx, ty) {
    const x = tx * T, y = ty * T + HUD;
    const groundCh = ['.', ',', 's', 'n'].includes(ch) ? ch : cur.ground;
    drawGround(groundCh, x, y, tx, ty);
    switch (ch) {
      case ',': {
        const h = hash(tx, ty);
        const c = ['#ff5a7a', '#ffd23a', '#fff'][h % 3];
        px(x + 4, y + 5, 2, 2, c); px(x + 10, y + 10, 2, 2, c); px(x + 5, y + 7, 1, 2, '#2f7a22'); px(x + 11, y + 12, 1, 2, '#2f7a22');
        break;
      }
      case '#':
        px(x + 6, y + 10, 4, 6, '#6b4423');
        px(x + 1, y + 1, 14, 11, '#2e7d32'); px(x + 3, y, 10, 2, '#2e7d32');
        px(x + 3, y + 2, 5, 3, '#43a047'); px(x + 1, y + 10, 14, 2, '#1b5e20');
        break;
      case 'T':
        px(x, y, T, T, '#7d7f8c');
        px(x, y + 7, T, 1, '#5d5f6a'); px(x, y + 15, T, 1, '#5d5f6a');
        px(x + 7, y, 1, 7, '#5d5f6a'); px(x + 3, y + 8, 1, 7, '#5d5f6a'); px(x + 12, y + 8, 1, 7, '#5d5f6a');
        px(x, y, T, 1, '#9fa1ad');
        break;
      case '~': {
        px(x, y, T, T, '#2f7fd6');
        const o = Math.floor(frame / 12 + tx * 3 + ty * 5) % 8;
        px(x + o, y + 4, 5, 1, '#6cb4ff'); px(x + (o + 6) % 12, y + 11, 4, 1, '#6cb4ff');
        break;
      }
      case 'I':
        px(x, y, T, T, '#bfeaff');
        px(x + 2, y + 3, 6, 1, '#fff'); px(x + 9, y + 10, 4, 1, '#fff'); px(x, y + 15, T, 1, '#94d3ef');
        break;
      case 'b':
        px(x + 1, y + 3, 14, 12, '#3f9d36'); px(x + 3, y + 1, 10, 3, '#3f9d36');
        px(x + 3, y + 5, 2, 2, '#2b6f25'); px(x + 10, y + 8, 2, 2, '#2b6f25'); px(x + 6, y + 11, 2, 2, '#2b6f25');
        px(x + 4, y + 3, 3, 1, '#6cc95e');
        break;
      case 'r':
        px(x + 1, y + 3, 14, 12, '#8d8d8d'); px(x + 2, y + 2, 12, 2, '#a5a5a5');
        px(x + 7, y + 3, 1, 4, '#4a4a4a'); px(x + 6, y + 7, 1, 3, '#4a4a4a'); px(x + 8, y + 9, 1, 4, '#4a4a4a');
        px(x + 1, y + 13, 14, 2, '#6a6a6a');
        break;
      case 'c': case 'o':
        px(x + 2, y + 5, 12, 10, '#9c5b2a'); px(x + 2, y + 5, 12, 1, '#c27a3c');
        px(x + 2, y + 9, 12, 1, '#5e3416'); px(x + 7, y + 8, 2, 3, '#ffd23a');
        if (ch === 'o') { px(x + 2, y + 2, 12, 3, '#5e3416'); px(x + 4, y + 6, 8, 2, '#3a2010'); }
        break;
      case 'D':
        px(x, y, T, T, '#4a2c14'); px(x + 2, y + 2, 12, 14, '#6b4423');
        for (let i = 0; i < 3; i++) px(x + 4 + i * 4, y + 6, 2, 2, ['#ff6a2a', '#bff2ff', '#ffe94a'][i]);
        break;
      case 'F': case 'G': case 'R': case 'p': {
        px(x + 3, y + 9, 10, 6, '#b8b8c8'); px(x + 2, y + 14, 12, 2, '#8a8a9a');
        if (ch !== 'p') {
          const el = ELEMS[ORB_TILES[ch]];
          const bob = Math.round(Math.sin(frame / 15) * 1.5);
          px(x + 4, y + 2 + bob, 8, 7, el.color); px(x + 5, y + 3 + bob, 3, 2, '#fff');
          if (frame % 20 < 10) px(x + 13, y + 1, 1, 1, '#fff');
        }
        break;
      }
    }
  }

  // Herói com o visual escolhido; a roupa tem a cor do elemento que está usando.
  // Também desenha a prévia do menu (g é o contexto do canvas que vai receber o desenho)
  function drawHero(g, x, y, skinId, elem, dx, dy, step) {
    const s = skinOf(skinId), el = ELEMS[elem];
    const p = (a, b, w, h, c) => { g.fillStyle = c; g.fillRect(a, b, w, h); };
    p(x - 5, y + 6, 10, 2, 'rgba(0,0,0,0.25)');
    p(x - 4, y + 3, 3, 4 - step, s.pants); p(x + 1, y + 3, 3, 3 + step, s.pants);   // pernas
    p(x - 5, y - 3, 10, 7, el.color); p(x - 5, y + 2, 10, 1, el.dark);             // roupa
    if (s.robot) { p(x - 5, y - 3, 10, 2, s.hair); p(x - 1, y - 1, 2, 2, '#ff3030'); }
    p(x - 4, y - 9, 8, 6, s.skin);                                                  // rosto
    p(x - 5, y - 10, 10, 3, s.hair);                                                // cabelo
    if (s.helmet) { p(x - 5, y - 11, 10, 4, s.helmet); p(x - 5, y - 9, 1, 4, s.helmet); p(x + 4, y - 9, 1, 4, s.helmet); }
    if (s.hat) { p(x - 6, y - 11, 12, 2, s.hat); p(x - 3, y - 15, 6, 4, s.hat); p(x - 1, y - 17, 3, 2, s.hat); p(x + 2, y - 14, 1, 1, '#ffd23a'); }
    if (s.bandana) { p(x - 5, y - 10, 10, 2, s.bandana); p(dx < 0 ? x + 5 : x - 7, y - 9, 2, 3, s.bandana); }
    if (s.robot) { p(x - 1, y - 13, 2, 3, s.hair); p(x - 2, y - 14, 4, 1, '#ff3030'); }
    if (dy < 0) p(x - 4, y - 9, 8, 4, s.hair);
    else {
      const eye = s.robot ? '#5ccfff' : '#000';
      if (dx > 0) { p(x + 1, y - 7, 1, 2, eye); p(x + 3, y - 7, 1, 2, eye); }
      else if (dx < 0) { p(x - 4, y - 7, 1, 2, eye); p(x - 2, y - 7, 1, 2, eye); }
      else { p(x - 3, y - 7, 1, 2, eye); p(x + 2, y - 7, 1, 2, eye); }
      if (s.mask) p(x - 4, y - 5, 8, 2, s.mask);   // máscara do ninja
    }
    // Cajado com a ponta da cor do elemento
    const sx = x + (dx < 0 ? -7 : 6), sy = y - 2;
    p(sx, sy - 6, 1, 10, '#8a5a2a'); p(sx - 1, sy - 8, 3, 3, el.color);
  }

  function drawPlayer() {
    if (player.inv > 0 && Math.floor(player.inv / 4) % 2 === 0) return;
    const step = player.walk % 20 < 10 ? 0 : 1;
    drawHero(ctx, Math.round(player.x), Math.round(player.y) + HUD, meta.skin, player.elem, player.dx, player.dy, step);
  }

  function drawEnemy(e) {
    const x = Math.round(e.x), y = Math.round(e.y) + HUD;
    const flash = e.hurt > 0 && e.hurt % 4 < 2;
    const ice = e.stun > 0;
    if (e.type === 'slime') {
      const sq = Math.floor(frame / 10 + e.x) % 2;
      const c = flash ? '#fff' : ice ? '#bff2ff' : '#55d655';
      px(x - 6, y + 5, 12, 2, 'rgba(0,0,0,0.25)');
      px(x - 6, y - 3 + sq, 12, 8 - sq, c); px(x - 4, y - 5 + sq, 8, 2, c);
      px(x - 3, y - 1, 2, 2, '#000'); px(x + 2, y - 1, 2, 2, '#000');
      px(x - 4, y - 4 + sq, 2, 1, '#b6ffb6');
    } else if (e.type === 'bat') {
      const wing = Math.floor(frame / 5) % 2;
      const c = flash ? '#fff' : ice ? '#bff2ff' : '#7a3fb0';
      px(x - 3, y - 3, 6, 6, c);
      px(x - 8, y - 3 + wing * 2, 5, 3, c); px(x + 3, y - 3 + wing * 2, 5, 3, c);
      px(x - 2, y - 1, 1, 1, '#ff3030'); px(x + 1, y - 1, 1, 1, '#ff3030');
    } else {
      const c = flash ? '#ff8080' : ice ? '#bff2ff' : '#ecebe2';
      px(x - 5, y + 6, 10, 2, 'rgba(0,0,0,0.25)');
      px(x - 4, y - 10, 8, 7, c); px(x - 2, y - 8, 2, 2, '#000'); px(x + 1, y - 8, 2, 2, '#000');
      px(x - 3, y - 3, 6, 6, c); px(x - 3, y - 2, 6, 1, '#888'); px(x - 3, y, 6, 1, '#888');
      px(x - 3, y + 3, 2, 4, c); px(x + 1, y + 3, 2, 4, c);
    }
  }

  function drawBoss() {
    if (!boss) return;
    const b = boss, x = Math.round(b.x), y = Math.round(b.y) + HUD;
    const flash = b.hurt > 0 && b.hurt % 4 < 2;
    const body = flash ? '#fff' : b.stun > 0 ? '#bff2ff' : '#3a1f5c';
    px(x - 14, y + 14, 28, 3, 'rgba(0,0,0,0.3)');
    px(x - 14, y - 6, 28, 20, body);                       // capa
    px(x - 10, y - 16, 20, 12, flash ? '#fff' : '#5a3a8a'); // cabeça
    px(x - 6, y - 12, 4, 3, '#ff3030'); px(x + 2, y - 12, 4, 3, '#ff3030');
    px(x - 10, y - 22, 20, 5, '#ffd23a');                   // coroa
    px(x - 10, y - 25, 3, 3, '#ffd23a'); px(x - 2, y - 26, 4, 4, '#ffd23a'); px(x + 7, y - 25, 3, 3, '#ffd23a');
    px(x - 1, y - 21, 2, 2, '#ff3030');
    // Barra de vida do chefão
    px(60, HUD + 4, 200, 6, '#000'); px(61, HUD + 5, 198 * Math.max(0, b.hp) / b.maxHp, 4, '#b06cff');
  }

  function drawShot(s) {
    const x = Math.round(s.x), y = Math.round(s.y) + HUD;
    if (s.enemy) {
      if (s.bone) { px(x - 3, y - 1, 6, 2, '#ecebe2'); px(x - 4, y - 2, 2, 4, '#ecebe2'); px(x + 2, y - 2, 2, 4, '#ecebe2'); }
      else { px(x - 3, y - 3, 6, 6, '#1a0a2a'); px(x - 2, y - 2, 4, 4, '#b06cff'); }
      return;
    }
    const el = ELEMS[s.elem];
    if (s.elem === 'raio') { px(x - 3, y - 1, 6, 2, el.color); px(x - 1, y - 3, 2, 6, el.color); px(x, y, 1, 1, '#fff'); }
    else { px(x - 3, y - 3, 6, 6, el.dark); px(x - 2, y - 2, 4, 4, el.color); px(x - 1, y - 2, 2, 1, '#fff'); }
    if (frame % 2) parts.push({ x: s.x, y: s.y, vx: 0, vy: 0, life: 8, color: el.color });
  }

  function heart(x, y, full) {
    const c = full ? '#ff3a4a' : '#3a1a20';
    px(x + 1, y, 2, 1, c); px(x + 4, y, 2, 1, c); px(x, y + 1, 7, 2, c); px(x + 1, y + 3, 5, 1, c); px(x + 2, y + 4, 3, 1, c); px(x + 3, y + 5, 1, 1, c);
  }

  function drawHud() {
    px(0, 0, W, HUD, '#10141f');
    px(0, HUD - 1, W, 1, '#2a3350');
    for (let i = 0; i < player.maxHp; i++) heart(4 + i * 9, 5, i < player.hp);
    // Moedas
    const cx = 4 + player.maxHp * 9 + 6;
    px(cx, 5, 6, 6, '#ffd23a'); px(cx + 2, 6, 2, 4, '#c9a000');
    ctx.fillStyle = '#fff'; ctx.font = '8px monospace'; ctx.textBaseline = 'top';
    ctx.fillText('x' + meta.coins, cx + 8, 4);
    // Elementos: o que você tem e o que está usando
    ELEM_ORDER.forEach((k, i) => {
      const x = W - 4 - (4 - i) * 16, have = player.owned.includes(k), on = player.elem === k;
      px(x, 2, 13, 12, on ? '#fff' : '#2a3350');
      px(x + 1, 3, 11, 10, '#10141f');
      if (have) { px(x + 3, 5, 7, 6, ELEMS[k].color); px(x + 4, 6, 2, 2, '#fff'); }
      else { px(x + 5, 7, 3, 2, '#3a4366'); }
    });
  }

  function drawText(msg, y, color, size) {
    ctx.font = `bold ${size || 8}px monospace`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#000';
    for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) ctx.fillText(msg, W / 2 + ox, y + oy);
    ctx.fillStyle = color || '#fff';
    ctx.fillText(msg, W / 2, y);
    ctx.textAlign = 'left';
  }
  // Quebra a frase em linhas que caibam na tela
  function wrap(msg, max) {
    const words = msg.split(' '), lines = [];
    let line = '';
    for (const w of words) {
      if ((line + ' ' + w).trim().length > max) { lines.push(line.trim()); line = w; }
      else line += ' ' + w;
    }
    if (line.trim()) lines.push(line.trim());
    return lines;
  }

  // ── Menu: tela inicial, personagens, loja e usuário ───────
  const $ = id => document.getElementById(id);
  let menuPage = 'main', heroTurn = 0;
  const HERO_DIRS = [[0, 1], [1, 0], [0, -1], [-1, 0]];   // a prévia do herói vai girando

  function showPage(name) {
    menuPage = name;
    document.querySelectorAll('#menu .page').forEach(p => p.classList.toggle('on', p.id === 'page-' + name));
    renderMenu();
  }
  document.querySelectorAll('#menu [data-go]').forEach(b => b.addEventListener('click', () => showPage(b.dataset.go)));

  function heroCanvas(c, skinId, elem, dir) {
    const g = c.getContext('2d');
    g.clearRect(0, 0, c.width, c.height);
    const [dx, dy] = dir || [0, 1];
    drawHero(g, 16, 20, skinId, elem, dx, dy, 0);
  }

  function renderMenu() {
    $('m-coins').textContent = meta.coins;
    $('m-user').textContent = meta.user ? '👤 ' + meta.user.nome : '';
    if (menuPage === 'main') {
      heroCanvas($('hero'), meta.skin, player.elem, HERO_DIRS[heroTurn % 4]);
      $('m-skin').textContent = skinOf(meta.skin).name.toUpperCase();
      loadSave();
      const run = started ? { owned: player.owned, bossDead } : save;
      $('m-progress').textContent = !run ? 'Nova aventura'
        : run.bossDead ? 'Reino salvo! 👑' : `Orbes: ${(run.owned || ['agua']).length - 1} de 3`;
      $('m-play').textContent = started ? 'CONTINUAR' : 'JOGAR';
      $('m-new').style.display = run ? '' : 'none';
    } else if (menuPage === 'skins') renderSkins();
    else if (menuPage === 'shop') renderShop();
    else if (menuPage === 'user') renderUser();
  }

  function card(sel) {
    const d = document.createElement('div');
    d.className = 'card' + (sel ? ' sel' : '');
    return d;
  }
  function el(tag, text, cls) {
    const e = document.createElement(tag);
    if (text != null) e.textContent = text;
    if (cls) e.className = cls;
    return e;
  }

  function renderSkins() {
    const grid = $('skin-grid');
    grid.innerHTML = '';
    for (const s of SKINS) {
      const have = meta.skins.includes(s.id), on = meta.skin === s.id;
      const c = el('canvas'); c.width = c.height = 32;
      heroCanvas(c, s.id, player.elem);
      const btn = el('button', on ? 'USANDO' : have ? 'USAR' : '● ' + s.price, on ? 'cyan' : have ? 'green' : 'orange');
      btn.disabled = on || (!have && meta.coins < s.price);
      btn.addEventListener('click', () => {
        if (!have) { meta.coins -= s.price; meta.skins.push(s.id); }
        meta.skin = s.id;
        writeMeta(); renderMenu();
      });
      const d = card(on);
      d.append(c, el('b', s.name), el('small', have ? 'Seu' : 'Custa ' + s.price + ' moedas'), btn);
      grid.appendChild(d);
    }
  }

  function renderShop() {
    const grid = $('shop-grid');
    grid.innerHTML = '';
    for (const u of UPGRADES) {
      const lvl = meta.up[u.id], max = u.prices.length, price = u.prices[lvl];
      const btn = el('button', lvl >= max ? 'MÁXIMO' : 'COMPRAR ● ' + price, lvl >= max ? 'cyan' : 'orange');
      btn.disabled = lvl >= max || meta.coins < price;
      btn.addEventListener('click', () => {
        meta.coins -= price; meta.up[u.id]++;
        if (u.id === 'vida' && started) { player.maxHp = maxHpNow(); player.hp++; }
        writeMeta(); renderMenu();
      });
      const d = card(false);
      d.append(el('div', u.icon, 'icon'), el('b', u.name), el('small', u.desc),
        el('div', '●'.repeat(lvl) + '○'.repeat(max - lvl), 'pips'), btn);
      grid.appendChild(d);
    }
  }

  // Usuário: e-mail e nome, guardados neste aparelho e no servidor do site
  const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  function renderUser() {
    $('u-email').value = meta.user ? meta.user.email : '';
    $('u-name').value = meta.user ? meta.user.nome : '';
    $('u-msg').textContent = ''; $('u-msg').className = '';
  }
  $('user-form').addEventListener('submit', async e => {
    e.preventDefault();
    const email = $('u-email').value.trim().toLowerCase(), nome = $('u-name').value.trim().slice(0, 40);
    const msg = $('u-msg');
    if (!EMAIL_OK.test(email)) { msg.textContent = 'Esse e-mail não parece certo. Confira o @ e o final (ex: gmail.com).'; msg.className = 'err'; return; }
    if (!nome) { msg.textContent = 'Escreva o nome como você quer ficar.'; msg.className = 'err'; return; }
    msg.textContent = 'Salvando...'; msg.className = '';
    meta.user = { email, nome };
    writeMeta();
    try {
      const r = await fetch('/api/conta/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, nome }) });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || 'erro');
      msg.textContent = 'Pronto, ' + nome + '! Você está online. 👋'; msg.className = 'ok';
    } catch (err) {
      msg.textContent = 'Salvo neste aparelho. O servidor não respondeu agora; tenta de novo mais tarde.'; msg.className = 'err';
    }
    $('m-user').textContent = '👤 ' + nome;
  });

  $('m-play').addEventListener('click', () => {
    if (started) setState('play');
    else { loadSave(); newGame(!!save); }
  });
  $('m-new').addEventListener('click', () => {
    if (confirm('Começar uma aventura nova? Os orbes e os baús voltam pro começo, mas suas moedas, personagens e melhorias continuam.')) newGame(false);
  });
  $('menu-btn').addEventListener('click', () => {
    if (state !== 'play' && state !== 'win') return;
    if (state === 'win') state = 'play';
    writeSave();
    showPage('main');
    setState('title');
  });

  function draw() {
    if (state === 'title') { px(0, 0, W, H, '#10141f'); return; }
    for (let ty = 0; ty < ROWS; ty++) for (let tx = 0; tx < COLS; tx++) drawTile(cur.grid[ty][tx], tx, ty);
    for (const p of pickups) {
      if (p.life < 120 && p.life % 10 < 5) continue;
      const x = Math.round(p.x), y = Math.round(p.y) + HUD + Math.round(Math.sin(frame / 10) * 1.5);
      if (p.type === 'heart') heart(x - 3, y - 3, true);
      else { px(x - 3, y - 3, 6, 6, '#ffd23a'); px(x - 1, y - 2, 2, 4, '#c9a000'); }
    }
    const things = [...enemies.map(e => ({ y: e.y, d: () => drawEnemy(e) })), { y: player.y, d: drawPlayer }];
    things.sort((a, b) => a.y - b.y).forEach(t => t.d());
    drawBoss();
    for (const s of shots) drawShot(s);
    for (const p of parts) px(Math.round(p.x), Math.round(p.y) + HUD, 2, 2, p.color);
    drawHud();
    if (roomTitleTimer > 0 && state === 'play') drawText(cur.name, HUD + 14, '#ffd23a', 9);
    if (toastTimer > 0) {
      const lines = wrap(toast, 46);
      const top = H - 14 - lines.length * 10;
      ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(8, top - 6, W - 16, lines.length * 10 + 6);
      lines.forEach((l, i) => drawText(l, top + i * 10, '#fff', 8));
    }
    if (state === 'dead') {
      ctx.fillStyle = `rgba(0,0,0,${Math.min(0.75, stateTimer / 60)})`; ctx.fillRect(0, 0, W, H);
      drawText('Você desmaiou...', H / 2, '#ff6a6a', 14);
    }
    if (state === 'win') {
      ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 0, W, H);
      drawText('VOCÊ VENCEU!', H / 2 - 30, '#ffd23a', 20);
      drawText('O Rei Sombrio foi derrotado', H / 2, '#fff', 9);
      drawText('e o Reino Elemental está salvo!', H / 2 + 14, '#fff', 9);
      if (stateTimer > 90) drawText(isTouch ? 'Toque pra continuar explorando' : 'Aperte ESPAÇO pra continuar explorando', H / 2 + 40, '#8a93b8', 8);
    }
  }

  // ── Controles ─────────────────────────────────────────────
  const keys = { left: false, right: false, up: false, down: false, attack: false };
  const KEYMAP = {
    ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
    ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
    Space: 'attack', KeyJ: 'attack', KeyK: 'attack', KeyZ: 'attack',
  };
  addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT') return;   // digitando no e-mail ou no nome
    if (state === 'title') { if (menuPage === 'main' && (e.code === 'Enter' || e.code === 'Space')) { e.preventDefault(); $('m-play').click(); } return; }
    if (KEYMAP[e.code]) { keys[KEYMAP[e.code]] = true; e.preventDefault(); }
    if (state === 'win' && stateTimer > 90 && (e.code === 'Space' || e.code === 'Enter')) { state = 'play'; keys.attack = false; return; }
    if (state !== 'play' || e.repeat) return;
    if (e.code === 'KeyQ' || e.code === 'KeyE' || e.code === 'KeyX' || e.code === 'ShiftLeft') swapElem();
    const n = ['Digit1', 'Digit2', 'Digit3', 'Digit4'].indexOf(e.code);
    if (n >= 0) swapElem(ELEM_ORDER[n]);
  });
  addEventListener('keyup', e => { if (KEYMAP[e.code]) keys[KEYMAP[e.code]] = false; });
  addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

  // Clique/toque na tela de vitória continua explorando
  canvas.addEventListener('pointerdown', () => { if (state === 'win' && stateTimer > 90) state = 'play'; });

  // Celular: analógico que aparece onde você encosta o dedo
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (isTouch) document.body.classList.add('touch');
  const stick = { active: false, id: null, ox: 0, oy: 0, x: 0, y: 0 };
  const stickZone = document.getElementById('stick-zone'), stickEl = document.getElementById('stick'), knob = document.getElementById('stick-knob');
  stickZone.addEventListener('touchstart', e => {
    e.preventDefault();
    if (state === 'win' && stateTimer > 90) { state = 'play'; return; }
    const t = e.changedTouches[0];
    stick.active = true; stick.id = t.identifier; stick.ox = t.clientX; stick.oy = t.clientY; stick.x = stick.y = 0;
    stickEl.style.display = 'block'; stickEl.style.left = t.clientX + 'px'; stickEl.style.top = t.clientY + 'px';
    knob.style.transform = '';
  }, { passive: false });
  stickZone.addEventListener('touchmove', e => {
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (t.identifier !== stick.id) continue;
      let dx = t.clientX - stick.ox, dy = t.clientY - stick.oy;
      const d = Math.hypot(dx, dy), max = 45;
      if (d > max) { dx = dx / d * max; dy = dy / d * max; }
      stick.x = dx / max; stick.y = dy / max;
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
    }
  }, { passive: false });
  const stickEnd = e => {
    for (const t of e.changedTouches) if (t.identifier === stick.id) {
      stick.active = false; stick.id = null; stick.x = stick.y = 0; stickEl.style.display = 'none';
    }
  };
  stickZone.addEventListener('touchend', stickEnd);
  stickZone.addEventListener('touchcancel', stickEnd);

  const btnAttack = document.getElementById('btn-attack'), btnSwap = document.getElementById('btn-swap');
  btnAttack.addEventListener('touchstart', e => {
    e.preventDefault(); btnAttack.classList.add('on');
    if (state === 'win' && stateTimer > 90) { state = 'play'; return; }
    keys.attack = true;
  }, { passive: false });
  const attackEnd = e => { e.preventDefault(); btnAttack.classList.remove('on'); keys.attack = false; };
  btnAttack.addEventListener('touchend', attackEnd, { passive: false });
  btnAttack.addEventListener('touchcancel', attackEnd, { passive: false });
  btnSwap.addEventListener('touchstart', e => { e.preventDefault(); btnSwap.classList.add('on'); if (state === 'play') swapElem(); }, { passive: false });
  btnSwap.addEventListener('touchend', e => { e.preventDefault(); btnSwap.classList.remove('on'); }, { passive: false });

  // Passo fixo de 60 por segundo, mesmo em telas de 120 Hz
  let last = performance.now(), acc = 0;
  function loop(now) {
    acc += Math.min(100, now - last); last = now;
    while (acc >= 1000 / 60) { update(); acc -= 1000 / 60; }
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  loadMeta();
  showPage('main');
  setState('title');

  // Só pra testar pelo console: abrir com #debug
  if (location.hash === '#debug') window.av = { player, meta, showPage, setState, get room() { return roomKey; }, get state() { return state; }, get enemies() { return enemies; }, get boss() { return boss; }, enterRoom, newGame, keys, tileAt, update, swapElem, fire };
})();
