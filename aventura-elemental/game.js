// Aventura Elemental — jogo de plataforma: corra, pule, pise nos inimigos e use os poderes
// de FOGO, GELO e RAIO pra passar pelas fases até derrotar o Rei Sombrio.
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const T = 16, COLS = 20, ROWS = 12, HUD = 16;
  const W = COLS * T, H = ROWS * T + HUD;

  // ── Elementos ─────────────────────────────────────────────
  const ELEMS = {
    agua: { name: 'ÁGUA', color: '#3cb4ff', dark: '#1a6fb0', dmg: 1, speed: 3.6, cd: 16 },
    fogo: { name: 'FOGO', color: '#ff6a2a', dark: '#b03a10', dmg: 2, speed: 3.4, cd: 22 },
    gelo: { name: 'GELO', color: '#bff2ff', dark: '#5fb6d6', dmg: 1, speed: 1.6, cd: 20 },
    raio: { name: 'RAIO', color: '#ffe94a', dark: '#c9a000', dmg: 2, speed: 5.0, cd: 26 },
  };
  // Supremo Elemental (todos os elementos) atira raio
  const elemOf = skinId => { const e = skinOf(skinId).elem; return e === 'all' ? 'raio' : e; };

  // ── Fases: 1000 fases de pedra, uma depois da outra ──────
  // # chão  B tijolo  T muro do castelo  ? bloco de gema  C bloco de coração  U bloco usado
  // r pedra rachada (qualquer tiro quebra)  ^ espinho  o gema  h coração
  // K bandeira de checkpoint  P bandeira do fim
  const SOLID = new Set(['#', 'B', 'T', '?', 'C', 'U', 'b', 'r', 'I']);
  const MAX_LEVEL = 1000;
  const BOSS_EVERY = 10;     // fase 10, 20, 30... tem chefão
  const ARENA_X = 36;        // passou daqui no castelo, a porta fecha e o chefão aparece
  const levelGems = n => 5 + Math.floor(n / 20);   // prêmio por terminar a fase n (cresce devagar)

  // Sorteio que dá sempre o mesmo resultado pro mesmo número de fase
  function rng(seed) {
    let t = seed >>> 0;
    return () => {
      t = (t + 0x6D2B79F5) >>> 0;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  function blankLevel(width) {
    const g = [];
    for (let y = 0; y < ROWS; y++) g.push(Array(width).fill(' '));
    const fill = (x0, y0, x1, y1, ch) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (x >= 0 && x < width) g[y][x] = ch; };
    return { g, fill };
  }

  // Fase n (1 a 1000). Quanto maior o n, mais inimigos, buracos e espinhos
  function makeLevel(n) {
    if (n % BOSS_EVERY === 0) return makeBossLevel(n);
    const R = rng(n * 9973 + 17);
    const pick = arr => arr[Math.floor(R() * arr.length)];
    const d = Math.min(1, n / 400);   // dificuldade de 0 a 1
    const width = Math.min(110 + n * 2, 260);
    const { g, fill } = blankLevel(width);
    const ents = [];
    let x = 0, top = 10, checkpointDone = false, heartDone = n % 5 !== 0;
    const flat = len => { fill(x, top, x + len - 1, ROWS - 1, '#'); x += len; };
    const enemyAt = ex => {
      const r = R();
      const type = r < 0.15 + d * 0.25 ? 'bat' : r < 0.35 + d * 0.35 ? 'skeleton' : 'slime';
      ents.push([type, ex, type === 'bat' ? top - 4 : top - 1]);
    };
    flat(8);
    while (x < width - 16) {
      const kind = pick(['flat', 'flat', 'gap', 'gap', 'step', 'spikes', 'rocks', 'platforms', 'stairs', 'blocks']);
      if (kind === 'flat' || kind === 'blocks') {
        const len = 4 + Math.floor(R() * 6), x0 = x;
        flat(len);
        if (R() < 0.35 + d * 0.5) enemyAt(x0 + 1 + Math.floor(R() * (len - 2)));
        if (kind === 'blocks' || R() < 0.25) {
          const bx = x0 + 1, k = 1 + Math.floor(R() * 3);
          for (let i = 0; i < k && bx + i < x - 1; i++) g[top - 4][bx + i] = !heartDone && i === 0 ? 'C' : i % 2 ? 'B' : '?';
          if (!heartDone) heartDone = true;
        } else if (R() < 0.4) for (let i = 0; i < 3 && x0 + 1 + i < x; i++) g[top - 2][x0 + 1 + i] = 'o';
        if (!checkpointDone && x > width / 2) { g[top - 1][x - 2] = 'K'; checkpointDone = true; }
      } else if (kind === 'gap') {
        const gap = 1 + Math.floor(R() * (1 + Math.min(2, Math.floor(1 + d * 2))));   // 1 a 3 blocos
        if (R() < 0.5) g[top - 3][x + Math.floor(gap / 2)] = 'o';
        x += gap;
        flat(4);   // sempre um chão bom pra cair depois do buraco
      } else if (kind === 'step') {
        top = Math.max(6, Math.min(10, top + pick([-2, -1, 1, 2])));
        flat(4 + Math.floor(R() * 3));
      } else if (kind === 'spikes') {
        const w = 1 + Math.floor(R() * 2);
        flat(2); fill(x, top, x + w + 1, ROWS - 1, '#'); fill(x, top - 1, x + w - 1, top - 1, '^'); x += w + 2;
        if (d > 0.3 && R() < 0.4) enemyAt(x - 1);
      } else if (kind === 'rocks') {
        // Parede de pedra rachada: quebra com tiro
        flat(3); const h = 3 + Math.floor(R() * 2);
        fill(x, top, x + 2, ROWS - 1, '#'); fill(x, top - h, x + 1, top - 1, 'r'); x += 3;
        flat(2);
      } else if (kind === 'platforms') {
        // Buraco largo com tijolos flutuando no meio
        const pit = 4 + Math.floor(R() * 2);
        fill(x + 1, top - 2, x + pit - 2, top - 2, 'B');
        if (R() < 0.5) g[top - 3][x + 2] = 'o';
        x += pit;
        flat(5);
      } else if (kind === 'stairs') {
        const h = 2 + Math.floor(R() * 3);
        for (let i = 0; i < h; i++) { fill(x, top, x, ROWS - 1, '#'); fill(x, top - 1 - i, x, top - 1, 'B'); x++; }
        flat(1);
        for (let i = h - 1; i >= 0; i--) { fill(x, top, x, ROWS - 1, '#'); fill(x, top - 1 - i, x, top - 1, 'B'); x++; }
        flat(4);
      }
    }
    flat(width - x);
    g[top - 1][width - 6] = 'P';
    const sky = SKIES[Math.floor((n - 1) / 25) % SKIES.length];
    return { n, name: 'Fase ' + n, width, theme: 'pedra', sky, base: g, ents, start: { x: 2, y: 9 }, bossAt: null };
  }

  // A cada 10 fases: o castelo do Rei Sombrio, mais forte a cada vez
  function makeBossLevel(n) {
    const width = 60;
    const { g, fill } = blankLevel(width);
    fill(0, 10, 59, 11, 'T'); fill(0, 0, 59, 0, 'T');
    fill(0, 1, 0, 9, 'T'); fill(59, 1, 59, 9, 'T');
    fill(12, 7, 14, 7, 'T'); fill(20, 6, 22, 6, 'T'); g[3][21] = '?';
    g[8][27] = 'h'; g[8][28] = 'o'; g[8][29] = 'o';
    return { n, name: 'Chefão da Fase ' + n, width, theme: 'castelo', base: g,
      ents: [['skeleton', 15, 9], ['bat', 25, 5]], start: { x: 2, y: 9 }, bossAt: { x: 48, y: 5 } };
  }

  const SKIES = [['#ff9a5a', '#ffd08a'], ['#6cc4ff', '#cfeaff'], ['#3a3a6a', '#8a7ab0'], ['#7a3a5a', '#e08a6a'], ['#1a2a3a', '#4a6a7a']];

  // ── Estado ────────────────────────────────────────────────
  const SAVE_KEY = 'aventuraElemental';
  let save = null;
  let levelIdx = 0, lv = null, grid = null;
  const player = {
    x: 0, y: 0, w: 10, h: 14, vx: 0, vy: 0, face: 1, onGround: false, coyote: 0, jumpBuf: 0,
    hp: 5, maxHp: 5, inv: 0, cd: 0, walk: 0, elem: 'agua',
  };
  let enemies = [], shots = [], pickups = [], parts = [];
  let boss = null, bossStarted = false;
  let heartBlocks = [];   // blocos de coração já usados (não dão de novo)
  let checkpoint = null;
  let camX = 0;
  let state = 'title';   // title (menu), play, dead, clear, win
  let started = false;    // já tem uma aventura rodando (o JOGAR do menu só continua)
  function setState(s) {
    state = s;
    document.body.classList.toggle('in-menu', s === 'title');
    if (s === 'title') { for (const k in keys) keys[k] = false; renderMenu(); }
  }
  let stateTimer = 0, frame = 0;
  let toast = '', toastTimer = 0;
  let levelTitleTimer = 0;


  // ── Conta: moedas, personagens, melhorias e usuário (continuam mesmo num jogo novo) ──
  const META_KEY = 'aventuraConta';
  // Personagens de elemento, por raridade. O bônus de elemento vale pros tiros daquele elemento
  const RARITY = {
    raro:   { name: 'RARO',         color: '#7ddf64', price: 0 },
    super:  { name: 'SUPER RARO',   color: '#5ccfff', price: 50 },
    lenda:  { name: 'LENDÁRIO',     color: '#ffb02e', price: 100 },
    divino: { name: 'DIVINO',       color: '#ff6ad5', price: 500 },
    ultra:  { name: 'ULTRA DIVINO', color: '#ffffff', price: 1000 },
  };
  const SKINS = [
    { id: 'gotinha',    name: 'Gotinha',        rar: 'raro',   elem: 'agua', hair: '#2a7fd6', skin: '#f2c18d', pants: '#1a4f80', b: { dmgElem: 1 } },
    { id: 'faisca',     name: 'Faísca',         rar: 'raro',   elem: 'fogo', hair: '#d64a1a', skin: '#f2c18d', pants: '#6b2a10', b: { dmgElem: 1 } },
    { id: 'floco',      name: 'Floco',          rar: 'raro',   elem: 'gelo', hair: '#dff6ff', skin: '#f6d2b0', pants: '#3a7fa0', b: { dmgElem: 1 } },
    { id: 'mare',       name: 'Maré',           rar: 'super',  elem: 'agua', hair: '#1a5fb0', skin: '#e8b98a', pants: '#123a66', b: { dmgElem: 1, hp: 1 } },
    { id: 'chama',      name: 'Chama',          rar: 'super',  elem: 'fogo', hair: '#ff3a1a', skin: '#e8b98a', pants: '#4a1a0a', b: { dmgElem: 1, hp: 1 } },
    { id: 'trovao',     name: 'Trovão',         rar: 'super',  elem: 'raio', hair: '#f5d000', skin: '#f2c18d', pants: '#3a3a5a', b: { dmgElem: 1, hp: 1 } },
    { id: 'tsunami',    name: 'Tsunami',        rar: 'lenda',  elem: 'agua', hair: '#0f4fa0', skin: '#d9a070', pants: '#0a2a50', b: { dmgElem: 2, hp: 1, speed: 0.1 } },
    { id: 'vulcao',     name: 'Vulcão',         rar: 'lenda',  elem: 'fogo', hair: '#2a1a1a', skin: '#d9a070', pants: '#5a1a0a', b: { dmgElem: 2, hp: 1, speed: 0.1 } },
    { id: 'nevasca',    name: 'Nevasca',        rar: 'lenda',  elem: 'gelo', hair: '#ffffff', skin: '#f6d2b0', pants: '#2a5f80', b: { dmgElem: 2, hp: 1, speed: 0.1 } },
    { id: 'tempestade', name: 'Tempestade',     rar: 'lenda',  elem: 'raio', hair: '#4a4a6a', skin: '#e8b98a', pants: '#2a2a40', b: { dmgElem: 2, hp: 1, speed: 0.1 } },
    { id: 'reimar',     name: 'Rei dos Mares',  rar: 'divino', elem: 'agua', hair: '#9fe0ff', skin: '#f2c18d', pants: '#0a3a80', b: { dmgAll: 2, hp: 2, speed: 0.2, rate: 0.25, pierce: true } },
    { id: 'fenix',      name: 'Fênix',          rar: 'divino', elem: 'fogo', hair: '#ffb02e', skin: '#f2c18d', pants: '#8a1a0a', b: { dmgAll: 2, hp: 2, speed: 0.2, rate: 0.25, pierce: true } },
    { id: 'dragaogelo', name: 'Dragão de Gelo', rar: 'divino', elem: 'gelo', hair: '#5fb6d6', skin: '#dff6ff', pants: '#1a4a6a', b: { dmgAll: 2, hp: 2, speed: 0.2, rate: 0.25, pierce: true } },
    { id: 'zeus',       name: 'Zeus',           rar: 'divino', elem: 'raio', hair: '#f0f0f0', skin: '#e8b98a', pants: '#5a4a00', b: { dmgAll: 2, hp: 2, speed: 0.2, rate: 0.25, pierce: true } },
    { id: 'supremo',    name: 'Supremo Elemental', rar: 'ultra', elem: 'all', hair: '#ffffff', skin: '#f2c18d', pants: '#2a1a4a', b: { dmgAll: 3, hp: 3, speed: 0.25, rate: 0.4, pierce: true, triple: true } },
  ];
  // Visuais antigos (Ninja, Cavaleiro...) foram trocados: quem comprou recebe as moedas de volta
  const OLD_SKINS = { ninja: 15, cavaleiro: 25, mago: 40, pirata: 60, robo: 100 };
  const FREE_SKINS = SKINS.filter(s => RARITY[s.rar].price === 0).map(s => s.id);
  const priceOf = s => RARITY[s.rar].price;
  const ELEM_NAME = { agua: 'ÁGUA', fogo: 'FOGO', gelo: 'GELO', raio: 'RAIO', all: 'TODOS' };
  // Lista dos poderes pra mostrar no cartão do personagem
  function perks(s) {
    const b = s.b, out = [];
    if (b.dmgElem) out.push(`+${b.dmgElem} dano de ${ELEM_NAME[s.elem]}`);
    if (b.dmgAll) out.push(`+${b.dmgAll} dano em tudo`);
    if (b.hp) out.push(`+${b.hp} ❤`);
    if (b.speed) out.push(`+${Math.round(b.speed * 100)}% velocidade`);
    if (b.rate) out.push(`Atira ${Math.round(b.rate * 100)}% mais rápido`);
    if (b.pierce) out.push('Tiro atravessa inimigos');
    if (b.triple) out.push('Tiro triplo');
    return out;
  }
  const UPGRADES = [
    { id: 'vida',   name: '+1 Coração',    icon: '❤️', desc: 'Começa com mais vida',     prices: [15, 30, 45] },
    { id: 'forca',  name: 'Tiro Forte',    icon: '💥', desc: '+1 de dano em todo tiro',  prices: [30, 60] },
    { id: 'rapido', name: 'Tiro Rápido',   icon: '⚡', desc: 'Atira mais vezes',          prices: [20, 40] },
    { id: 'veloz',  name: 'Botas Velozes', icon: '👟', desc: 'Anda mais rápido',          prices: [20, 40] },
  ];
  // Recursos Elementais: Moeda Elemental comprada com Gemas, e Gemas compradas com Moeda Elemental
  const GEM_PACKS = [
    { gems: 10,  price: 50,  tag: '' },
    { gems: 30,  price: 120, tag: 'OFERTA!' },
    { gems: 100, price: 350, tag: 'MEGA!' },
  ];
  const COIN_PACKS = [
    { coins: 40,  price: 10,  tag: '' },
    { coins: 130, price: 30,  tag: 'OFERTA!' },
    { coins: 450, price: 100, tag: 'MEGA!' },
  ];
  const BOSS_GEMS = 20;
  // Cores do nome de usuário, compradas com Moeda Elemental
  const NAME_COLORS = [
    { id: 'branco',   name: 'Branco',     color: '#ffffff', price: 0 },
    { id: 'verde',    name: 'Verde',      color: '#5df07a', price: 5 },
    { id: 'azul',     name: 'Azul',       color: '#5ccfff', price: 5 },
    { id: 'vermelho', name: 'Vermelho',   color: '#ff5a5a', price: 10 },
    { id: 'laranja',  name: 'Laranja',    color: '#ff9a2e', price: 10 },
    { id: 'roxo',     name: 'Roxo',       color: '#b06cff', price: 15 },
    { id: 'rosa',     name: 'Rosa',       color: '#ff6ad5', price: 15 },
    { id: 'dourado',  name: 'Dourado',    color: '#ffd23a', price: 30 },
    { id: 'arcoiris', name: 'Arco-íris',  color: 'rainbow', price: 60 },
  ];
  const colorOf = id => NAME_COLORS.find(c => c.id === id) || NAME_COLORS[0];
  // meta.coins = Gemas Elementais (ganhas jogando); meta.gems = Moedas Elementais (especiais)
  const meta = { coins: 0, gems: 0, skins: FREE_SKINS.slice(), skin: 'gotinha', up: { vida: 0, forca: 0, rapido: 0, veloz: 0 },
    colors: ['branco'], nameColor: 'branco', user: null };
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
    const owned = Array.isArray(m.skins) ? m.skins : [];
    let refund = 0;
    for (const id of owned) if (OLD_SKINS[id]) refund += OLD_SKINS[id];
    meta.coins += refund;
    meta.skins = [...new Set([...FREE_SKINS, ...owned.filter(id => SKINS.some(s => s.id === id))])];
    meta.skin = SKINS.some(s => s.id === m.skin) ? m.skin : 'gotinha';
    for (const u of UPGRADES) meta.up[u.id] = Math.min(u.prices.length, (m.up && m.up[u.id]) || 0);
    meta.user = m.user || null;
    meta.gems = m.gems || 0;
    meta.seenHelp = !!m.seenHelp;
    meta.codes = Array.isArray(m.codes) ? m.codes : [];
    meta.colors = Array.isArray(m.colors) ? [...new Set(['branco', ...m.colors.filter(id => NAME_COLORS.some(c => c.id === id))])] : ['branco'];
    meta.nameColor = meta.colors.includes(m.nameColor) ? m.nameColor : 'branco';
    if (refund) writeMeta();   // devolve uma vez só
  }
  function writeMeta() {
    try { localStorage.setItem(META_KEY, JSON.stringify(meta)); } catch (e) { /* sem salvar */ }
  }
  const skinOf = id => SKINS.find(s => s.id === id) || SKINS[0];
  // Vida máxima, dano, recarga e velocidade com as melhorias da loja
  const charB = () => skinOf(meta.skin).b;
  const maxHpNow = () => 5 + chestHearts + meta.up.vida + (charB().hp || 0);
  const dmgOf = elem => {
    const c = skinOf(meta.skin), b = c.b;
    const own = b.dmgElem && (c.elem === elem || c.elem === 'all') ? b.dmgElem : 0;
    return ELEMS[elem].dmg + meta.up.forca + (b.dmgAll || 0) + own;
  };
  const cdOf = elem => Math.max(6, Math.round(ELEMS[elem].cd * (1 - 0.2 * meta.up.rapido) * (1 - (charB().rate || 0))));
  const walkSpeed = () => 1.35 * (1 + 0.12 * meta.up.veloz) * (1 + (charB().speed || 0));


  function loadSave() {
    try { save = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { save = null; }
  }
  function writeSave() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        v: 3, level: levelIdx, checkpoint, chestHearts, heartBlocks,
      }));
    } catch (e) { /* sem salvar */ }
    writeMeta();
  }

  function newGame(cont) {
    loadSave();
    // Saves das versões antigas (outras fases) começam na fase 1, mantendo os corações dos baús
    if (cont && save) {
      chestHearts = save.chestHearts || 0;
      const same = save.v === 3;
      heartBlocks = same ? save.heartBlocks || [] : [];
      levelIdx = same ? Math.min(save.level || 0, MAX_LEVEL - 1) : 0;
      checkpoint = same ? save.checkpoint || null : null;
    } else {
      chestHearts = 0; heartBlocks = []; levelIdx = 0; checkpoint = null;
    }
    startLevel();
    started = true;
    setState('play');
    if (levelIdx === 0 && !checkpoint) say('Pule com ESPAÇO, pise na cabeça dos inimigos e atire nas pedras rachadas!');
    writeSave();
  }

  // Monta a fase do zero (pedras e blocos voltam ao normal)
  function startLevel() {
    if (!lv || lv.n !== levelIdx + 1) lv = makeLevel(levelIdx + 1);
    grid = lv.base.map(r => r.slice());
    player.elem = elemOf(meta.skin);   // o tiro é o elemento do personagem
    for (const id of heartBlocks) {
      const [l, x, y] = id.split(':');
      if (+l === levelIdx && grid[+y][+x] === 'C') grid[+y][+x] = 'U';
    }
    if (checkpoint) for (const row of grid) for (let x = 0; x <= checkpoint.x && x < row.length; x++) if (row[x] === 'K') row[x] = 'k';
    enemies = lv.ents.map(([type, x, y]) => makeEnemy(type, x * T + 8, y * T + 16));
    shots = []; pickups = []; parts = [];
    boss = null; bossStarted = false;
    const sp = checkpoint || lv.start;
    player.x = sp.x * T + 3; player.y = sp.y * T + T - player.h;
    player.vx = player.vy = 0; player.face = 1; player.inv = 0;
    player.maxHp = maxHpNow(); player.hp = player.maxHp;
    camX = clamp(player.x - 130, 0, lv.width * T - W);
    levelTitleTimer = 150;
  }

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const tileAt = (x, y) => (y < 0 ? ' ' : y >= ROWS ? ' ' : x < 0 || x >= lv.width ? 'T' : grid[y][x]);
  const isSolid = (x, y) => SOLID.has(tileAt(x, y));
  function setTile(x, y, ch) { if (y >= 0 && y < ROWS && x >= 0 && x < lv.width) grid[y][x] = ch; }

  // Move uma caixa (x, y, w, h) e para nos blocos; devolve os blocos que bateu
  function moveBody(o, dx, dy) {
    const hit = { x: null, y: null };
    if (dx) {
      o.x += dx;
      const x = dx > 0 ? Math.floor((o.x + o.w - 0.01) / T) : Math.floor(o.x / T);
      for (let ty = Math.floor(o.y / T); ty <= Math.floor((o.y + o.h - 0.01) / T); ty++) {
        if (!isSolid(x, ty)) continue;
        o.x = dx > 0 ? x * T - o.w : (x + 1) * T;
        hit.x = { tx: x, ty };
        break;
      }
    }
    if (dy) {
      o.y += dy;
      const y = dy > 0 ? Math.floor((o.y + o.h - 0.01) / T) : Math.floor(o.y / T);
      for (let tx = Math.floor(o.x / T); tx <= Math.floor((o.x + o.w - 0.01) / T); tx++) {
        if (!isSolid(tx, y)) continue;
        o.y = dy > 0 ? y * T - o.h : (y + 1) * T;
        hit.y = { tx, ty: y };
        break;
      }
    }
    return hit;
  }
  const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  // Algum bloco desse tipo encostando na caixa?
  function touches(o, ch) {
    for (let ty = Math.floor(o.y / T); ty <= Math.floor((o.y + o.h - 0.01) / T); ty++)
      for (let tx = Math.floor(o.x / T); tx <= Math.floor((o.x + o.w - 0.01) / T); tx++)
        if (tileAt(tx, ty) === ch) return { tx, ty };
    return null;
  }

  // ── Inimigos ──────────────────────────────────────────────
  const ENEMY = {
    slime: { hp: 1, speed: 0.45, w: 12, h: 10 },
    bat: { hp: 1, speed: 0.8, w: 12, h: 8 },
    skeleton: { hp: 2, speed: 0.35, w: 10, h: 14 },
  };
  // Fases altas: inimigos mais rápidos (até +80%) e esqueletos atirando mais
  const hardness = () => Math.min(1, ((lv && lv.n) || 1) / 500);
  function makeEnemy(type, x, y) {
    const d = ENEMY[type];
    return { type, x: x - d.w / 2, y: y - d.h, w: d.w, h: d.h, hp: d.hp, vx: -d.speed * (1 + hardness() * 0.8), vy: 0, baseY: y - d.h,
      t: Math.random() * 100, stun: 0, hurt: 0, shoot: 80 + Math.random() * 80 };
  }

  function updateEnemies() {
    for (const e of enemies) {
      const def = ENEMY[e.type];
      if (e.hurt > 0) e.hurt--;
      if (Math.abs(e.x - player.x) > W * 1.2) continue;   // longe da tela fica parado
      if (e.stun > 0) { e.stun--; }
      else if (e.type === 'bat') {
        e.t++;
        const dx = player.x - e.x;
        if (Math.abs(dx) < 120) e.x += Math.sign(dx) * def.speed * (1 + hardness() * 0.8);
        e.y = e.baseY + Math.sin(e.t / 20) * 20 + (Math.abs(dx) < 120 ? clamp(player.y - e.baseY, -30, 40) * 0.5 : 0);
      } else {
        // Anda e vira na parede ou na beira do buraco
        const hit = moveBody(e, e.vx, 0);
        const ahead = e.vx > 0 ? Math.floor((e.x + e.w + 1) / T) : Math.floor((e.x - 1) / T);
        const below = Math.floor((e.y + e.h + 2) / T);
        if (hit.x || (e.vy === 0 && !isSolid(ahead, below))) e.vx = -e.vx;
        if (e.type === 'skeleton') {
          e.shoot--;
          const dx = player.x - e.x;
          if (e.shoot <= 0 && Math.abs(dx) < 150) {
            e.shoot = Math.round(120 - hardness() * 60);
            shots.push({ x: e.x + 5, y: e.y + 2, vx: Math.sign(dx) * 1.6, vy: -3, enemy: true, bone: true, life: 160 });
          }
        }
      }
      if (e.type !== 'bat') {
        e.vy = Math.min(e.vy + 0.35, 6);
        if (moveBody(e, 0, e.vy).y) e.vy = 0;
        if (e.y > ROWS * T) e.dead = true;
      }
      if (touches(e, '~') && e.type !== 'bat') e.dead = true;
    }
    enemies = enemies.filter(e => !e.dead);
  }

  // Pisou em cima? Se não, o inimigo machuca
  function enemyContacts() {
    const p = player;
    for (const e of enemies) {
      if (!overlap(p, e)) continue;
      const fromAbove = p.vy > 0 && p.y + p.h - p.vy <= e.y + 4;
      if (fromAbove) {
        killEnemy(e, '#fff');
        p.vy = keys.jump ? -6.2 : -4;
        beep(660, 0.06, 'square');
      } else if (e.stun <= 0) hurtPlayer(e.x + e.w / 2);
    }
    enemies = enemies.filter(e => !e.dead);
  }

  function killEnemy(e, color) {
    e.dead = true;
    burst(e.x + e.w / 2, e.y + e.h / 2, color, 12);
    const r = Math.random();
    if (r < 0.15) pickups.push({ type: 'heart', x: e.x + e.w / 2 - 4, y: e.y, vy: -3, life: 600 });
    else if (r < 0.55) pickups.push({ type: 'gem', x: e.x + e.w / 2 - 4, y: e.y, vy: -3, life: 600 });
  }

  // ── Chefão ────────────────────────────────────────────────
  function startBoss() {
    bossStarted = true;
    for (let y = 5; y <= 9; y++) setTile(ARENA_X - 1, y, 'T');   // a porta fecha atrás de você
    const b = lv.bossAt;
    const hp = Math.min(30 + Math.round(lv.n * 0.6), 300);
    boss = { x: b.x * T, y: b.y * T, w: 28, h: 30, hp, maxHp: hp, t: 0, shoot: 90, summon: 300, swoop: 0, hurt: 0, stun: 0, homeY: b.y * T };
    say(lv.n === BOSS_EVERY ? 'O Rei Sombrio! Atire nele ou pule na cabeça quando ele descer!' : 'O Rei Sombrio voltou, mais forte!');
    beep(110, 0.4, 'sawtooth');
  }

  function updateBoss() {
    if (!boss) return;
    const b = boss;
    if (b.hurt > 0) b.hurt--;
    if (b.stun > 0) { b.stun--; return; }
    b.t++;
    const fast = b.hp < b.maxHp / 2;
    const left = ARENA_X * T + 4, right = (lv.width - 1) * T - b.w - 4;
    if (b.swoop > 0) {
      // Desce até o chão: hora de pisar na cabeça
      b.swoop--;
      b.y = Math.min(b.y + 2, 10 * T - b.h);
      if (b.swoop === 0) b.t = 0;
    } else {
      b.x = (left + right) / 2 + Math.sin(b.t / (fast ? 45 : 70)) * (right - left) / 2;
      b.y += (b.homeY + Math.sin(b.t / 30) * 8 - b.y) * 0.08;
      b.shoot--;
      if (b.shoot <= 0) {
        const f = hardness();
        b.shoot = Math.round((fast ? 75 : 105) - f * 35);
        const base = Math.atan2(player.y - b.y, player.x - b.x);
        const n = (fast ? 7 : 5) + Math.floor(f * 4);
        for (let i = 0; i < n; i++) {
          const a = base + (i - (n - 1) / 2) * 0.25;
          shots.push({ x: b.x + b.w / 2, y: b.y + b.h - 6, vx: Math.cos(a) * 1.6, vy: Math.sin(a) * 1.6, enemy: true, dark: true, life: 240 });
        }
        beep(140, 0.12, 'sawtooth');
      }
      if (b.t % (fast ? 260 : 340) === 0) b.swoop = 100;
      if (fast) {
        b.summon--;
        if (b.summon <= 0 && enemies.length < 4) {
          b.summon = 360;
          enemies.push(makeEnemy('bat', b.x - 10, b.y + 20), makeEnemy('bat', b.x + b.w + 10, b.y + 20));
        }
      }
    }
    if (overlap(player, b)) {
      const fromAbove = player.vy > 0 && player.y + player.h - player.vy <= b.y + 6;
      if (fromAbove) { damageBoss(4, '#fff'); player.vy = -6; }
      else hurtPlayer(b.x + b.w / 2);
    }
  }

  function damageBoss(dmg, color) {
    if (!boss || boss.hurt > 0) return;
    boss.hp -= dmg; boss.hurt = 10;
    burst(boss.x + boss.w / 2, boss.y + boss.h / 2, color, 8);
    beep(220, 0.05, 'square');
    if (boss.hp <= 0) bossDefeated();
  }

  function bossDefeated() {
    burst(boss.x + boss.w / 2, boss.y + boss.h / 2, '#b06cff', 40); burst(boss.x + boss.w / 2, boss.y + boss.h / 2, '#ffd23a', 30);
    boss = null; enemies = []; shots = [];
    meta.gems += BOSS_GEMS;   // prêmio do chefão em Moeda Elemental
    levelClear('CHEFÃO DERROTADO!');
  }

  // ── Tiros ─────────────────────────────────────────────────
  function fire() {
    if (player.cd > 0) return;
    const el = ELEMS[player.elem];
    player.cd = cdOf(player.elem);
    const b = charB();
    const sx = player.x + player.w / 2 + player.face * 6, sy = player.y + 5;
    // Tiro triplo do Ultra Divino: um reto e dois abertos
    for (const vyOff of b.triple ? [0, -1.1, 1.1] : [0]) {
      const arc = player.elem === 'gelo';   // a bola de gelo cai num arco
      shots.push({ x: sx, y: sy, vx: player.face * el.speed, vy: (arc ? -2.2 : 0) + vyOff, grav: arc ? 0.13 : 0,
        elem: player.elem, life: 90, pierce: !!b.pierce });
    }
    beep({ agua: 520, fogo: 300, gelo: 880, raio: 1200 }[player.elem], 0.06, player.elem === 'raio' ? 'square' : 'triangle');
  }

  function updateShots() {
    for (const s of shots) {
      if (s.grav || s.bone) s.vy += s.grav || 0.12;
      s.x += s.vx; s.y += s.vy; s.life--;
      if (s.life <= 0) continue;
      const tx = Math.floor(s.x / T), ty = Math.floor(s.y / T), ch = tileAt(tx, ty);
      if (!s.enemy) {
        if (ch === '~') { if (s.elem === 'gelo') freeze(tx, ty, Math.sign(s.vx) || 1); else burst(s.x, s.y, '#6cb4ff', 4); s.life = 0; continue; }
        if (SOLID.has(ch)) { hitTile(s, tx, ty, ch); s.life = 0; continue; }
        for (const e of enemies) {
          if (e.dead || s.x < e.x - 2 || s.x > e.x + e.w + 2 || s.y < e.y - 2 || s.y > e.y + e.h + 2) continue;
          if (s.pierce) {
            s.hits = s.hits || new Set();
            if (s.hits.has(e)) continue;
            s.hits.add(e);
          } else s.life = 0;
          damageEnemy(e, s);
          if (!s.pierce) break;
        }
        enemies = enemies.filter(e => !e.dead);
        if (boss && s.life > 0 && s.x > boss.x && s.x < boss.x + boss.w && s.y > boss.y && s.y < boss.y + boss.h) {
          boss.hurt = 0;
          damageBoss(dmgOf(s.elem), ELEMS[s.elem].color);
          if (s.elem === 'gelo' && boss) boss.stun = 20;
          s.life = 0;
        }
      } else {
        if (SOLID.has(ch)) { s.life = 0; continue; }
        if (s.x > player.x && s.x < player.x + player.w && s.y > player.y && s.y < player.y + player.h) { hurtPlayer(s.x - s.vx * 4); s.life = 0; }
      }
      if (s.y > ROWS * T + 20 || s.x < camX - 40 || s.x > camX + W + 40) s.life = 0;
    }
    shots = shots.filter(s => s.life > 0);
  }

  function damageEnemy(e, s) {
    e.hp -= dmgOf(s.elem); e.hurt = 8;
    if (s.elem === 'gelo') e.stun = 150;
    burst(s.x, s.y, ELEMS[s.elem].color, 6);
    beep(330, 0.05, 'square');
    if (e.hp <= 0) killEnemy(e, ELEMS[s.elem].color);
  }

  // Fogo queima arbusto, raio quebra pedra; o resto do grudado vai junto, um por um
  function hitTile(s, tx, ty, ch) {
    const cx = tx * T + 8, cy = ty * T + 8;
    if (ch === 'b' && s.elem === 'fogo') {
      spread(tx, ty, 'b', (x, y) => { burst(x * T + 8, y * T + 8, '#ff8a2a', 10); burst(x * T + 8, y * T + 8, '#ffd23a', 5); beep(180, 0.1, 'sawtooth'); });
    } else if (ch === 'r') {
      spread(tx, ty, 'r', (x, y) => { burst(x * T + 8, y * T + 8, '#999', 10); burst(x * T + 8, y * T + 8, '#ffe94a', 5); beep(90, 0.12, 'square'); });
    } else {
      burst(s.x - s.vx, s.y - s.vy, ELEMS[s.elem].color, 4);
    }
  }
  function spread(tx, ty, ch, fx) {
    if (tileAt(tx, ty) !== ch) return;
    setTile(tx, ty, ' ');
    fx(tx, ty);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) setTimeout(() => spread(tx + dx, ty + dy, ch, fx), 120);
  }

  // Gelo na água: vira uma ponte de 6 blocos, que começa do lado de quem atirou
  function freeze(tx, ty, dir) {
    let top = ty;
    while (tileAt(tx, top - 1) === '~') top--;
    for (let k = -3; k <= 2; k++) if (tileAt(tx + k * dir, top) === '~') setTile(tx + k * dir, top, 'I');
    burst(tx * T + 8, top * T + 4, '#e8fbff', 12);
    beep(1300, 0.08, 'sine');
  }

  // Bateu a cabeça num bloco
  function bumpBlock(tx, ty) {
    const ch = tileAt(tx, ty);
    if (ch === '?') {
      setTile(tx, ty, 'U');
      pickups.push({ type: 'pop', x: tx * T + 4, y: ty * T - 6, vy: -3.5, life: 26 });
      meta.coins++;
      beep(990, 0.08, 'triangle');
    } else if (ch === 'C') {
      setTile(tx, ty, 'U');
      heartBlocks.push(levelIdx + ':' + tx + ':' + ty);
      chestHearts++; player.maxHp = maxHpNow(); player.hp = player.maxHp;
      burst(tx * T + 8, ty * T, '#ff3a4a', 16);
      say('Bloco de coração: +1 coração! Agora você tem ' + player.maxHp + '.');
      beep(660, 0.1, 'triangle'); setTimeout(() => beep(880, 0.15, 'triangle'), 110);
      writeSave();
    } else beep(140, 0.04, 'square');
  }

  // ── Jogador ───────────────────────────────────────────────
  function hurtPlayer(fromX) {
    if (player.inv > 0 || state !== 'play') return;
    player.hp--; player.inv = 80;
    player.vx = (player.x + player.w / 2 < fromX ? -1 : 1) * 2.5; player.vy = -3;
    burst(player.x + 5, player.y + 7, '#ff4040', 8);
    beep(120, 0.15, 'sawtooth');
    if (player.hp <= 0) die();
  }
  function die() {
    if (state !== 'play') return;
    state = 'dead'; stateTimer = 0; player.hp = 0;
    beep(200, 0.15, 'triangle'); setTimeout(() => beep(150, 0.15, 'triangle'), 150); setTimeout(() => beep(100, 0.3, 'triangle'), 300);
  }

  function updatePlayer() {
    const p = player;
    if (p.cd > 0) p.cd--;
    if (p.inv > 0) p.inv--;
    const mx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    const top = 2.0 * walkSpeed() / 1.35;
    p.vx += (mx * top - p.vx) * (p.onGround ? 0.25 : 0.12);
    if (mx) { p.face = mx; if (p.onGround) p.walk++; }
    // Pulo com "tempo de perdão": dá pra pular logo depois de sair da beira
    p.coyote = p.onGround ? 6 : Math.max(0, p.coyote - 1);
    if (keys.jumpPressed) { p.jumpBuf = 7; keys.jumpPressed = false; }
    else if (p.jumpBuf > 0) p.jumpBuf--;
    if (p.jumpBuf > 0 && p.coyote > 0) {
      p.vy = -6.0; p.coyote = 0; p.jumpBuf = 0; p.onGround = false;
      beep(380, 0.05, 'square');
    }
    if (!keys.jump && p.vy < -2.2) p.vy = -2.2;   // soltar o botão = pulo baixinho
    p.vy = Math.min(p.vy + 0.35, 7);
    const hx = moveBody(p, p.vx, 0);
    if (hx.x) p.vx = 0;
    const hy = moveBody(p, 0, p.vy);
    p.onGround = false;
    if (hy.y) {
      if (p.vy > 0) p.onGround = true;
      else {
        // Bateu a cabeça: bloco ? ou de coração
        const cx = Math.floor((p.x + p.w / 2) / T);
        const tx = isSolid(cx, hy.y.ty) ? cx : hy.y.tx;
        bumpBlock(tx, hy.y.ty);
      }
      p.vy = 0;
    }
    if (p.x < 0) p.x = 0;
    if (p.x > lv.width * T - p.w) p.x = lv.width * T - p.w;

    // Caiu no buraco ou na água
    if (p.y > ROWS * T + 10) { die(); return; }
    if (touches(p, '~')) { burst(p.x + 5, p.y + p.h, '#6cb4ff', 14); die(); return; }
    if (touches(p, '^')) { hurtPlayer(p.x + p.w / 2 + (p.vx > 0 ? 8 : -8)); p.vy = -5; }

    // Coisas pra pegar no mapa
    for (const ch of ['o', 'h', 'K', 'P']) {
      const t = touches(p, ch);
      if (!t) continue;
      if (ch === 'o') { setTile(t.tx, t.ty, ' '); meta.coins++; burst(t.tx * T + 8, t.ty * T + 8, '#ffd23a', 6); beep(990, 0.06, 'triangle'); }
      else if (ch === 'h') { setTile(t.tx, t.ty, ' '); p.hp = Math.min(p.maxHp, p.hp + 1); beep(700, 0.06, 'triangle'); }
      else if (ch === 'K') {
        setTile(t.tx, t.ty, 'k');
        checkpoint = { x: t.tx, y: t.ty };
        say('Checkpoint! Se cair, você volta daqui.');
        beep(784, 0.1, 'triangle');
        writeSave();
      } else if (ch === 'P') { levelClear(); return; }
    }
    if (lv.bossAt && !bossStarted && p.x > ARENA_X * T + 8) startBoss();
    if (keys.attack) fire();
  }

  let clearGems = 0, clearMsg = '';
  function levelClear(msg) {
    clearGems = levelGems(levelIdx + 1);
    meta.coins += clearGems;
    clearMsg = msg || 'FASE ' + (levelIdx + 1) + ' COMPLETA!';
    if (levelIdx + 1 >= MAX_LEVEL) { state = 'win'; stateTimer = 0; writeSave(); return; }
    state = 'clear'; stateTimer = 0;
    beep(523, 0.12, 'triangle'); setTimeout(() => beep(659, 0.12, 'triangle'), 130); setTimeout(() => beep(784, 0.12, 'triangle'), 260); setTimeout(() => beep(1046, 0.3, 'triangle'), 390);
    levelIdx++;
    checkpoint = null;
    writeSave();
  }

  function updatePickups() {
    for (const p of pickups) {
      p.life--;
      if (p.type === 'pop') { p.y += p.vy; p.vy += 0.25; continue; }   // gema que pula do bloco ?
      p.vy = Math.min((p.vy || 0) + 0.3, 5);
      const body = { x: p.x, y: p.y, w: 8, h: 8 };
      if (moveBody(body, 0, p.vy).y) p.vy = 0;
      p.y = body.y;
      if (overlap(player, body)) {
        p.life = 0;
        if (p.type === 'heart') player.hp = Math.min(player.maxHp, player.hp + 1);
        else meta.coins++;
        beep(p.type === 'heart' ? 700 : 990, 0.06, 'triangle');
      }
    }
    pickups = pickups.filter(p => p.life > 0);
  }

  // ── Efeitos ───────────────────────────────────────────────
  function burst(x, y, color, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, sp = 0.5 + Math.random() * 1.8;
      parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 20 + Math.random() * 20, color });
    }
  }
  function say(msg) { toast = msg; toastTimer = 220; }


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
    if (levelTitleTimer > 0) levelTitleTimer--;
    for (const p of parts) { p.x += p.vx; p.y += p.vy; p.vx *= 0.92; p.vy *= 0.92; p.life--; }
    parts = parts.filter(p => p.life > 0);
    if (state === 'play') {
      updatePlayer();
      if (state !== 'play') return;
      updateEnemies();
      enemyContacts();
      updateBoss();
      updateShots();
      updatePickups();
      // A câmera segue você pela fase
      const want = clamp(player.x - 130, 0, lv.width * T - W);
      camX += (want - camX) * 0.15;
    } else if (state === 'dead') {
      stateTimer++;
      if (stateTimer > 100) {
        startLevel();   // volta do começo da fase (ou do checkpoint) com a vida cheia
        player.inv = 60;
        state = 'play';
      }
    } else if (state === 'clear') {
      stateTimer++;
      if (stateTimer > 150) { startLevel(); state = 'play'; }
    } else if (state === 'win') {
      stateTimer++;
    }
  }

  // ── Desenho ───────────────────────────────────────────────
  function px(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); }
  const hash = (x, y) => ((x * 73856093) ^ (y * 19349663)) >>> 0;

  const THEMES = {
    campo:    { sky: ['#6cc4ff', '#bfe9ff'], hill: '#7fcf5a', far: '#a8e08a', top: '#4fb83a', dirt: '#a0662e', dirtDark: '#7a4a1e' },
    floresta: { sky: ['#2e5a3a', '#6a9a5a'], hill: '#2a6a2a', far: '#3f7f3a', top: '#3a9a2a', dirt: '#6b4423', dirtDark: '#4a2c14' },
    gelo:     { sky: ['#9fd8ff', '#e8f6ff'], hill: '#dff2fb', far: '#c4e6f5', top: '#ffffff', dirt: '#8fb8d0', dirtDark: '#6a95b0' },
    montanha: { sky: ['#ff9a5a', '#ffd08a'], hill: '#8a6a5a', far: '#b08a6a', top: '#9a9a9a', dirt: '#6a6a72', dirtDark: '#4a4a52' },
    pedra:    { sky: null, hill: '#6a6a72', far: '#8a8a92', top: '#a8a8b0', dirt: '#6a6a72', dirtDark: '#4a4a52' },
    castelo:  { sky: ['#1a0f2e', '#3a1f5c'], hill: '#2a1a40', far: '#24163a', top: '#7d7f8c', dirt: '#5d5f6a', dirtDark: '#45474f' },
  };

  function drawBackground() {
    const th = THEMES[lv.theme];
    const g = ctx.createLinearGradient(0, HUD, 0, H);
    const sky = lv.sky || th.sky;
    g.addColorStop(0, sky[0]); g.addColorStop(1, sky[1]);
    ctx.fillStyle = g; ctx.fillRect(0, HUD, W, H - HUD);
    // Morros ao fundo andam mais devagar (parallax)
    for (const [color, speed, base, size] of [[th.far, 0.2, 130, 70], [th.hill, 0.45, 150, 50]]) {
      ctx.fillStyle = color;
      const off = (camX * speed) % 160;
      for (let i = -1; i < 4; i++) {
        const cx = i * 160 - off + 80;
        for (let k = 0; k < size; k += 4) {
          const w = Math.sqrt(size * size - k * k) * 1.4;
          ctx.fillRect(Math.round(cx - w / 2), HUD + base - k, Math.round(w), 4);
        }
      }
    }
    if (lv.theme === 'campo' || lv.theme === 'gelo') {
      // Nuvens
      for (let i = 0; i < 4; i++) {
        const x = ((i * 113 - camX * 0.1) % 400 + 400) % 400 - 40, y = HUD + 18 + (i % 2) * 22;
        px(x, y, 30, 8, '#fff'); px(x + 6, y - 5, 16, 6, '#fff');
      }
    }
    if (lv.theme === 'castelo') for (let i = 0; i < 20; i++) px((i * 97 - camX * 0.05 + 400) % W, HUD + (i * 53) % 120, 1, 1, '#8a7ab0');
  }

  function drawTile(ch, tx, ty) {
    const x = Math.round(tx * T - camX), y = ty * T + HUD;
    const th = THEMES[lv.theme];
    switch (ch) {
      case '#': {
        const topOpen = !SOLID.has(tileAt(tx, ty - 1)) && tileAt(tx, ty - 1) !== '~';
        px(x, y, T, T, th.dirt);
        const h = hash(tx, ty);
        px(x + h % 12, y + 6 + (h >> 4) % 8, 2, 2, th.dirtDark); px(x + (h >> 8) % 12, y + 4 + (h >> 12) % 10, 2, 1, th.dirtDark);
        if (topOpen) { px(x, y, T, 5, th.top); px(x, y + 5, T, 1, th.dirtDark); for (let i = 0; i < 4; i++) px(x + (h >> i * 3) % 14, y + 5, 2, 2, th.top); }
        break;
      }
      case 'B':
        px(x, y, T, T, '#c0582a');
        px(x, y + 7, T, 1, '#6a2a10'); px(x, y + 15, T, 1, '#6a2a10');
        px(x + 7, y, 1, 7, '#6a2a10'); px(x + 3, y + 8, 1, 7, '#6a2a10'); px(x + 12, y + 8, 1, 7, '#6a2a10');
        px(x, y, T, 1, '#e88a5a');
        break;
      case 'T':
        px(x, y, T, T, '#7d7f8c');
        px(x, y + 7, T, 1, '#5d5f6a'); px(x, y + 15, T, 1, '#5d5f6a');
        px(x + 7, y, 1, 7, '#5d5f6a'); px(x + 3, y + 8, 1, 7, '#5d5f6a'); px(x + 12, y + 8, 1, 7, '#5d5f6a');
        px(x, y, T, 1, '#9fa1ad');
        break;
      case '?': case 'C': {
        const glow = Math.floor(frame / 10) % 3;
        px(x, y, T, T, '#8a5a00'); px(x + 1, y + 1, 14, 14, ['#ffb000', '#ffc830', '#ffd860'][glow]);
        px(x + 2, y + 2, 1, 1, '#8a5a00'); px(x + 13, y + 2, 1, 1, '#8a5a00'); px(x + 2, y + 13, 1, 1, '#8a5a00'); px(x + 13, y + 13, 1, 1, '#8a5a00');
        if (ch === '?') { px(x + 5, y + 3, 6, 2, '#fff'); px(x + 10, y + 5, 2, 3, '#fff'); px(x + 7, y + 8, 3, 2, '#fff'); px(x + 7, y + 11, 3, 2, '#fff'); }
        else heart(x + 4, y + 5, true);
        break;
      }
      case 'U':
        px(x, y, T, T, '#5a3a10'); px(x + 1, y + 1, 14, 14, '#9a6a30');
        px(x + 2, y + 2, 1, 1, '#5a3a10'); px(x + 13, y + 2, 1, 1, '#5a3a10'); px(x + 2, y + 13, 1, 1, '#5a3a10'); px(x + 13, y + 13, 1, 1, '#5a3a10');
        break;
      case 'b':
        px(x + 1, y, 14, 16, '#3f9d36'); px(x, y + 2, 16, 12, '#3f9d36');
        px(x + 3, y + 3, 3, 3, '#2b6f25'); px(x + 10, y + 7, 3, 3, '#2b6f25'); px(x + 5, y + 11, 3, 3, '#2b6f25');
        px(x + 4, y + 1, 4, 1, '#6cc95e');
        break;
      case 'r':
        px(x, y, T, T, '#8d8d8d'); px(x, y, T, 2, '#a5a5a5');
        px(x + 7, y + 1, 1, 5, '#3a3a3a'); px(x + 5, y + 6, 2, 1, '#3a3a3a'); px(x + 5, y + 7, 1, 4, '#3a3a3a'); px(x + 6, y + 11, 3, 1, '#3a3a3a');
        px(x, y + 15, T, 1, '#5a5a5a');
        break;
      case 'I':
        px(x, y, T, T, '#bfeaff'); px(x + 2, y + 3, 7, 1, '#fff'); px(x + 9, y + 9, 4, 1, '#fff'); px(x, y + 15, T, 1, '#94d3ef');
        break;
      case '~': {
        const surface = tileAt(tx, ty - 1) !== '~';
        px(x, y, T, T, '#2f7fd6');
        if (surface) {
          const o = Math.floor(frame / 8 + tx * 3) % 8;
          px(x, y, T, 3, '#6cb4ff'); px(x + o, y + 1, 4, 1, '#fff');
        }
        break;
      }
      case '^':
        for (let i = 0; i < 4; i++) { px(x + i * 4 + 1, y + 10, 3, 6, '#c8c8d0'); px(x + i * 4 + 2, y + 6, 1, 4, '#e8e8f0'); }
        break;
      case 'o': {
        const bob = Math.round(Math.sin(frame / 12 + tx) * 1.5);
        gemPx(x + 4, y + 5 + bob);
        break;
      }
      case 'h': heart(x + 4, y + 5 + Math.round(Math.sin(frame / 12) * 1.5), true); break;
      case 'K': case 'k': {
        px(x + 7, y - 16, 2, 32, '#ddd');
        const up = ch === 'k';
        px(x + 9, y - 16 + (up ? 0 : 14), 8, 6, up ? '#2fd15a' : '#ff5a5a');
        break;
      }
      case 'P': {
        // Bandeira grande do fim da fase
        px(x + 7, y - 6 * T + 4, 2, 6 * T + 12, '#eee');
        px(x + 5, y - 6 * T, 6, 5, '#ffd23a');
        const wave = Math.floor(frame / 10) % 2;
        px(x + 9, y - 6 * T + 8, 14, 9 + wave, '#2fd15a'); px(x + 13, y - 6 * T + 10, 5, 4, '#fff');
        px(x + 2, y + 12, 12, 4, '#7d7f8c');
        break;
      }
    }
  }

  const RAINBOW = ['#ff4a4a', '#ffb02e', '#ffe94a', '#7ddf64', '#5ccfff', '#b06cff'];

  const rainbow = k => RAINBOW[(Math.floor(frame / 6) + k) % RAINBOW.length];
  function drawHero(g, x, y, skinId, elem, dx, dy, step) {
    const s = skinOf(skinId), el = ELEMS[elem], rar = s.rar;
    const p = (a, b, w, h, c) => { g.fillStyle = c; g.fillRect(a, b, w, h); };
    const ultra = rar === 'ultra';
    const mine = ultra ? null : ELEMS[s.elem];           // cor do elemento do personagem
    const hair = ultra ? rainbow(0) : s.hair;
    p(x - 5, y + 6, 10, 2, 'rgba(0,0,0,0.25)');
    // Capa (lendário pra cima), atrás do corpo
    if (rar === 'lenda' || rar === 'divino' || ultra) {
      const cape = ultra ? rainbow(2) : rar === 'divino' ? '#ffd23a' : mine.dark;
      p(x - 6, y - 3, 12, 9, cape);
      if (dy < 0) p(x - 5, y - 3, 10, 9, cape);
    }
    p(x - 4, y + 3, 3, 4 - step, s.pants); p(x + 1, y + 3, 3, 3 + step, s.pants);   // pernas
    if (dy >= 0 || !(rar === 'lenda' || rar === 'divino' || ultra)) {
      p(x - 5, y - 3, 10, 7, el.color); p(x - 5, y + 2, 10, 1, el.dark);           // roupa da cor do tiro
    }
    p(x - 4, y - 9, 8, 6, s.skin);                                                  // rosto
    p(x - 5, y - 10, 10, 3, hair);                                                  // cabelo
    if (dy < 0) p(x - 4, y - 9, 8, 4, hair);
    else {
      if (dx > 0) { p(x + 1, y - 7, 1, 2, '#000'); p(x + 3, y - 7, 1, 2, '#000'); }
      else if (dx < 0) { p(x - 4, y - 7, 1, 2, '#000'); p(x - 2, y - 7, 1, 2, '#000'); }
      else { p(x - 3, y - 7, 1, 2, '#000'); p(x + 2, y - 7, 1, 2, '#000'); }
    }
    // Faixa na testa (super raro e lendário)
    if (rar === 'super' || rar === 'lenda') p(x - 5, y - 9, 10, 1, mine.color);
    // Auréola (divino dourada, ultra divino arco-íris)
    if (rar === 'divino' || ultra) {
      const halo = ultra ? rainbow(4) : '#ffe94a';
      p(x - 4, y - 14, 8, 1, halo); p(x - 5, y - 13, 1, 1, halo); p(x + 4, y - 13, 1, 1, halo);
    }
    // Brilhinhos em volta do ultra divino
    if (ultra) for (let i = 0; i < 3; i++) {
      const a = frame / 12 + i * 2.1;
      p(Math.round(x + Math.cos(a) * 9), Math.round(y - 3 + Math.sin(a) * 9), 1, 1, rainbow(i * 2));
    }
    // Cajado com a ponta da cor do elemento
    const sx = x + (dx < 0 ? -7 : 6), sy = y - 2;
    p(sx, sy - 6, 1, 10, '#8a5a2a'); p(sx - 1, sy - 8, 3, 3, el.color);
  }


  function drawPlayer() {
    const p = player;
    if (p.inv > 0 && Math.floor(p.inv / 4) % 2 === 0) return;
    const step = !p.onGround ? 1 : p.walk % 16 < 8 ? 0 : 1;
    // O herói é desenhado com o pé na base da caixa
    drawHero(ctx, Math.round(p.x + p.w / 2 - camX), Math.round(p.y + p.h - 8) + HUD, meta.skin, p.elem, p.face, 0, step);
  }

  function drawEnemy(e) {
    const x = Math.round(e.x - camX), y = Math.round(e.y) + HUD;
    if (x < -20 || x > W + 20) return;
    const flash = e.hurt > 0 && e.hurt % 4 < 2, ice = e.stun > 0;
    if (e.type === 'slime') {
      const sq = Math.floor(frame / 10 + e.x) % 2;
      const c = flash ? '#fff' : ice ? '#bff2ff' : '#55d655';
      px(x, y + 2 + sq, 12, 8 - sq, c); px(x + 2, y + sq, 8, 2, c);
      const eye = e.vx < 0 ? 2 : 6;
      px(x + eye, y + 4, 2, 2, '#000'); px(x + eye + 3, y + 4, 2, 2, '#000');
      px(x + 2, y + 2 + sq, 2, 1, '#b6ffb6');
    } else if (e.type === 'bat') {
      const wing = Math.floor(frame / 5) % 2;
      const c = flash ? '#fff' : ice ? '#bff2ff' : '#7a3fb0';
      px(x + 3, y + 1, 6, 6, c);
      px(x - 2, y + wing * 3, 5, 3, c); px(x + 9, y + wing * 3, 5, 3, c);
      px(x + 4, y + 3, 1, 1, '#ff3030'); px(x + 7, y + 3, 1, 1, '#ff3030');
    } else {
      const c = flash ? '#ff8080' : ice ? '#bff2ff' : '#ecebe2';
      px(x + 1, y, 8, 6, c); px(x + (e.vx < 0 ? 2 : 5), y + 2, 2, 2, '#000');
      px(x + 2, y + 6, 6, 5, c); px(x + 2, y + 7, 6, 1, '#888'); px(x + 2, y + 9, 6, 1, '#888');
      const st = Math.floor(frame / 12) % 2;
      px(x + 2, y + 11, 2, 3 - st, c); px(x + 6, y + 11, 2, 2 + st, c);
    }
  }

  function drawBoss() {
    if (!boss) return;
    const b = boss, x = Math.round(b.x - camX), y = Math.round(b.y) + HUD;
    const flash = b.hurt > 0 && b.hurt % 4 < 2;
    const body = flash ? '#fff' : b.stun > 0 ? '#bff2ff' : '#3a1f5c';
    px(x, y + 10, 28, 20, body);                              // capa
    px(x + 4, y, 20, 12, flash ? '#fff' : '#5a3a8a');         // cabeça
    px(x + 8, y + 4, 4, 3, '#ff3030'); px(x + 16, y + 4, 4, 3, '#ff3030');
    px(x + 4, y - 6, 20, 5, '#ffd23a');                        // coroa
    px(x + 4, y - 9, 3, 3, '#ffd23a'); px(x + 12, y - 10, 4, 4, '#ffd23a'); px(x + 21, y - 9, 3, 3, '#ffd23a');
    px(x + 13, y - 5, 2, 2, '#ff3030');
    if (b.swoop > 0 && frame % 10 < 5) px(x + 10, y - 16, 8, 3, '#fff');   // aviso: dá pra pisar!
    // Barra de vida
    px(60, HUD + 4, 200, 6, '#000'); px(61, HUD + 5, 198 * Math.max(0, b.hp) / b.maxHp, 4, '#b06cff');
  }

  function drawShot(s) {
    const x = Math.round(s.x - camX), y = Math.round(s.y) + HUD;
    if (s.enemy) {
      if (s.bone) { px(x - 3, y - 1, 6, 2, '#ecebe2'); px(x - 4, y - 2, 2, 4, '#ecebe2'); px(x + 2, y - 2, 2, 4, '#ecebe2'); }
      else { px(x - 3, y - 3, 6, 6, '#1a0a2a'); px(x - 2, y - 2, 4, 4, '#b06cff'); }
      return;
    }
    const el = ELEMS[s.elem];
    if (s.elem === 'raio') { px(x - 4, y - 1, 8, 2, el.color); px(x - 1, y - 3, 2, 6, el.color); px(x, y, 1, 1, '#fff'); }
    else { px(x - 3, y - 3, 6, 6, el.dark); px(x - 2, y - 2, 4, 4, el.color); px(x - 1, y - 2, 2, 1, '#fff'); }
    if (frame % 2) parts.push({ x: s.x, y: s.y, vx: 0, vy: 0, life: 8, color: el.color });
  }

  // Gema Elemental em pixel: topo reto e ponta embaixo
  function gemPx(x, y) {
    px(x + 1, y, 5, 1, '#fff3a0'); px(x, y + 1, 7, 2, '#ffd23a'); px(x + 1, y + 3, 5, 1, '#e0a000');
    px(x + 2, y + 4, 3, 1, '#c98a00'); px(x + 3, y + 5, 1, 1, '#a86a00'); px(x + 2, y + 1, 1, 1, '#fff');
  }
  function heart(x, y, full) {
    const c = full ? '#ff3a4a' : '#3a1a20';
    px(x + 1, y, 2, 1, c); px(x + 4, y, 2, 1, c); px(x, y + 1, 7, 2, c); px(x + 1, y + 3, 5, 1, c); px(x + 2, y + 4, 3, 1, c); px(x + 3, y + 5, 1, 1, c);
  }

  function drawHud() {
    px(0, 0, W, HUD, '#10141f');
    px(0, HUD - 1, W, 1, '#2a3350');
    for (let i = 0; i < player.maxHp; i++) heart(4 + i * 9, 5, i < player.hp);
    // Gemas Elementais
    const cx = 4 + player.maxHp * 9 + 6;
    gemPx(cx, 4);
    ctx.fillStyle = '#fff'; ctx.font = '8px monospace'; ctx.textBaseline = 'top'; ctx.textAlign = 'left';
    ctx.fillText('x' + meta.coins, cx + 8, 4);
    ctx.fillStyle = '#8a93b8';
    ctx.fillText('FASE ' + (levelIdx + 1), cx + 44, 4);
    // Elemento do seu personagem
    const el = ELEMS[player.elem];
    px(W - 64, 2, 60, 12, '#2a3350'); px(W - 63, 3, 58, 10, '#10141f');
    px(W - 60, 5, 7, 6, el.color); px(W - 59, 6, 2, 2, '#fff');
    ctx.fillStyle = el.color; ctx.fillText(el.name, W - 50, 4);
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
    $('m-coins').textContent = meta.coins;   // Gemas Elementais
    $('m-gems').textContent = meta.gems;
    paintName($('m-user'), meta.user ? meta.user.nome : '', '👤 ');
    renderFriends();
    if (menuPage === 'main') {
      heroCanvas($('hero'), meta.skin, player.elem, HERO_DIRS[heroTurn % 4]);
      $('m-skin').textContent = skinOf(meta.skin).name.toUpperCase();
      loadSave();
      const run = started ? { v: 3, level: levelIdx } : save;
      $('m-progress').textContent = !run ? 'Nova aventura' : `Fase ${(run.v === 3 ? run.level || 0 : 0) + 1} de ${MAX_LEVEL}`;
      $('m-play').textContent = started ? 'CONTINUAR' : 'JOGAR';
    } else if (menuPage === 'skins') renderSkins();
    else if (menuPage === 'shop') renderShop();
    else if (menuPage === 'user') renderUser();
  }

  function card(sel) {
    const d = document.createElement('div');
    d.className = 'card' + (sel ? ' sel' : '');
    return d;
  }
  // Ícone de Gema (gema) ou de Moeda Elemental (moeda) com o valor do lado
  const ICON = kind => `<i class="ic ic-${kind}"></i>`;
  function priced(node, label, kind, n) {
    node.innerHTML = (label ? label + ' ' : '') + ICON(kind) + ' ' + n;
    return node;
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
    for (const r of Object.keys(RARITY)) {
      const R = RARITY[r];
      const head = el('div', R.name + ' · GRÁTIS', 'rar-head rar-' + r);
      if (R.price) priced(head, R.name + ' ·', 'gema', R.price);
      grid.appendChild(head);
      for (const s of SKINS.filter(c => c.rar === r)) {
        const have = meta.skins.includes(s.id), on = meta.skin === s.id, price = priceOf(s);
        const c = el('canvas'); c.width = c.height = 32;
        heroCanvas(c, s.id, s.elem === 'all' ? player.elem : s.elem);
        const btn = el('button', on ? 'USANDO' : 'USAR', on ? 'cyan' : have ? 'green' : 'orange');
        if (!on && !have) priced(btn, '', 'gema', price);
        btn.disabled = on || (!have && meta.coins < price);
        btn.addEventListener('click', () => {
          if (!have) { meta.coins -= price; meta.skins.push(s.id); }
          meta.skin = s.id;
          if (started) { player.maxHp = maxHpNow(); player.hp = Math.min(player.hp, player.maxHp); player.elem = elemOf(meta.skin); }
          writeMeta(); renderMenu();
        });
        const d = card(on);
        d.classList.add('rar-' + r);
        const list = el('ul', null, 'perks');
        for (const t of perks(s)) list.appendChild(el('li', t));
        d.append(el('span', R.name, 'rar-tag'), c, el('b', s.name), el('small', 'Elemento: ' + ELEM_NAME[s.elem]), list, btn);
        grid.appendChild(d);
      }
    }
  }

  // Loja com 3 abas: melhorias do personagem, recursos elementais e cor do nome
  let shopTab = 'melhorias';
  const SHOP_TABS = [['melhorias', 'MELHORIAS'], ['gemas', 'RECURSOS ELEMENTAIS'], ['cores', 'COR DO NOME']];
  function renderShop() {
    const tabs = $('shop-tabs');
    tabs.innerHTML = '';
    for (const [id, label] of SHOP_TABS) {
      const b = el('button', label, 'tab' + (shopTab === id ? ' on' : ''));
      b.addEventListener('click', () => { shopTab = id; renderShop(); });
      tabs.appendChild(b);
    }
    const grid = $('shop-grid');
    grid.innerHTML = '';
    if (shopTab === 'melhorias') shopUpgrades(grid);
    else if (shopTab === 'gemas') shopGems(grid);
    else shopColors(grid);
  }

  function shopUpgrades(grid) {
    for (const u of UPGRADES) {
      const lvl = meta.up[u.id], max = u.prices.length, price = u.prices[lvl];
      const btn = el('button', 'MÁXIMO', lvl >= max ? 'cyan' : 'orange');
      if (lvl < max) priced(btn, 'COMPRAR', 'gema', price);
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

  function shopGems(grid) {
    const group = (title, packs, give, pay) => {
      grid.appendChild(el('div', title, 'rar-head shop-head'));
      for (const pk of packs) {
        const amount = pk[give === 'moeda' ? 'gems' : 'coins'];
        const wallet = pay === 'gema' ? meta.coins : meta.gems;
        const btn = priced(el('button', null, 'orange'), 'COMPRAR', pay, pk.price);
        btn.disabled = wallet < pk.price;
        btn.addEventListener('click', () => {
          if (pay === 'gema') { meta.coins -= pk.price; meta.gems += amount; }
          else { meta.gems -= pk.price; meta.coins += amount; }
          writeMeta(); renderMenu();
        });
        const d = card(false);
        if (pk.tag) d.appendChild(el('span', pk.tag, 'deal'));
        const big = el('div', null, 'icon');
        big.innerHTML = `<i class="ic ic-${give} big"></i>`;
        d.append(big, el('b', amount + (give === 'moeda' ? ' Moedas Elementais' : ' Gemas Elementais')), btn);
        grid.appendChild(d);
      }
    };
    group('MOEDA ELEMENTAL', GEM_PACKS, 'moeda', 'gema');
    group('GEMA ELEMENTAL', COIN_PACKS, 'gema', 'moeda');
    grid.appendChild(el('small', 'O chefão dá ' + BOSS_GEMS + ' Moedas Elementais quando você vence.', 'shop-note'));
  }

  function shopColors(grid) {
    for (const c of NAME_COLORS) {
      const have = meta.colors.includes(c.id), on = meta.nameColor === c.id;
      const btn = el('button', on ? 'USANDO' : 'USAR', on ? 'cyan' : have ? 'green' : 'purple');
      if (!on && !have) priced(btn, '', 'moeda', c.price);
      btn.disabled = on || (!have && meta.gems < c.price);
      btn.addEventListener('click', () => {
        if (!have) { meta.gems -= c.price; meta.colors.push(c.id); }
        meta.nameColor = c.id;
        writeMeta(); renderMenu();
        syncUser();
      });
      const d = card(on);
      const sample = el('div', null, 'name-sample');
      paintName(sample, meta.user ? meta.user.nome : 'Seu nome', '', c.id);
      d.append(sample, el('b', c.name), el('small', have ? 'Sua' : 'Custa ' + c.price + ' Moedas Elementais'), btn);
      grid.appendChild(d);
    }
  }

  // Escreve um nome com a cor escolhida (o arco-íris é animado pelo CSS)
  function paintName(node, nome, prefix, colorId) {
    const c = colorOf(colorId || meta.nameColor);
    node.textContent = nome ? (prefix || '') + nome : '';
    node.classList.toggle('rainbow-name', c.color === 'rainbow');
    node.style.color = c.color === 'rainbow' ? '' : c.color;
  }

  // Atualiza o usuário no servidor (por exemplo depois de trocar a cor do nome)
  function syncUser() {
    if (!meta.user) return;
    fetch('/api/conta/', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: meta.user.email, nome: meta.user.nome, cor: meta.nameColor }) }).catch(() => {});
  }

  // Usuário: e-mail e nome, guardados neste aparelho e no servidor do site
  const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  let playAfterUser = false;   // veio do JOGAR sem usuário: depois de salvar, já começa
  function renderUser() {
    $('u-email').value = meta.user ? meta.user.email : '';
    $('u-name').value = meta.user ? meta.user.nome : '';
    $('u-msg').textContent = playAfterUser ? 'Coloque seu usuário pra ficar online e jogar!' : '';
    $('u-msg').className = '';
  }
  // Na primeira vez, mostra o COMO JOGAR antes de começar
  let playAfterHelp = false;
  function startPlaying() {
    if (!meta.seenHelp) { playAfterHelp = true; showPage('help'); return; }
    if (started) setState('play');
    else { loadSave(); newGame(!!save); }
  }
  $('user-form').addEventListener('submit', async e => {
    e.preventDefault();
    const email = $('u-email').value.trim().toLowerCase(), nome = $('u-name').value.trim().slice(0, 40);
    const msg = $('u-msg');
    if (!EMAIL_OK.test(email)) { msg.textContent = 'E-mail errado. O @ fica no meio, assim: seunome@gmail.com'; msg.className = 'err'; return; }
    if (!nome) { msg.textContent = 'Escreva o nome como você quer ficar.'; msg.className = 'err'; return; }
    msg.textContent = 'Salvando...'; msg.className = '';
    const before = meta.user;
    meta.user = { email, nome };
    writeMeta();
    try {
      const r = await fetch('/api/conta/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, nome, cor: meta.nameColor }) });
      const data = await r.json().catch(() => ({}));
      if (r.status === 409) {   // nome de outra pessoa: não troca
        meta.user = before; writeMeta();
        msg.textContent = data.error; msg.className = 'err';
        return;
      }
      if (!r.ok) throw new Error(data.error || 'erro');
      msg.textContent = 'Pronto, ' + nome + '! Você está online. 👋'; msg.className = 'ok';
    } catch (err) {
      msg.textContent = 'Salvo neste aparelho. O servidor não respondeu agora; tenta de novo mais tarde.'; msg.className = 'err';
    }
    paintName($('m-user'), nome, '👤 ');
    renderFriends();
    if (playAfterUser) {
      playAfterUser = false;
      setTimeout(() => { showPage('main'); startPlaying(); }, 1200);
    }
  });

  // Sem usuário não fica online: o JOGAR leva antes pra tela de usuário
  $('m-play').addEventListener('click', () => {
    if (!meta.user) { playAfterUser = true; showPage('user'); return; }
    startPlaying();
  });

  $('help-ok').addEventListener('click', () => {
    meta.seenHelp = true;
    writeMeta();
    showPage('main');
    if (playAfterHelp) { playAfterHelp = false; startPlaying(); }
  });

  // Caixa de amigos: todo mundo que tem usuário, quem está jogando agora primeiro (bolinha verde).
  // O jogo avisa o servidor que você está online a cada 25 segundos e pega a lista na mesma hora
  let friends = [];
  function renderFriends() {
    const list = $('friends-list');
    list.innerHTML = '';
    if (!meta.user) {
      const li = el('li', 'Coloque seu usuário pra ficar online', 'friends-hint');
      li.addEventListener('click', () => showPage('user'));
      list.appendChild(li);
      return;
    }
    for (const f of friends) {
      const li = el('li', null, f.online ? 'friend-on' : 'friend-off');
      paintName(li, f.nome, '', f.cor);
      list.appendChild(li);
    }
    if (!friends.length) list.appendChild(el('li', 'Ninguém mais tem usuário ainda', 'friends-empty'));
  }

  async function heartbeat() {
    if (!meta.user || document.hidden) return;
    try {
      const r = await fetch('/api/conta/', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'online', email: meta.user.email }) });
      if (!r.ok) return;
      const data = await r.json();
      friends = data.jogadores || [];
      if (state === 'title') renderFriends();
    } catch (err) { /* sem internet: tenta de novo daqui a pouco */ }
  }
  setInterval(heartbeat, 25000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) heartbeat(); });
  setTimeout(heartbeat, 500);

  $('menu-btn').addEventListener('click', () => {
    if (state !== 'play' && state !== 'win') return;
    if (state === 'win') state = 'play';
    writeSave();
    showPage('main');
    setState('title');
  });


  function draw() {
    if (state === 'title' || !lv) { px(0, 0, W, H, '#10141f'); return; }
    drawBackground();
    const c0 = Math.max(0, Math.floor(camX / T) - 1), c1 = Math.min(lv.width - 1, Math.floor((camX + W) / T) + 1);
    // Bandeiras primeiro (o mastro passa por trás dos blocos)
    for (let ty = 0; ty < ROWS; ty++) for (let tx = c0; tx <= c1; tx++) {
      const ch = grid[ty][tx];
      if (ch === 'P' || ch === 'K' || ch === 'k') drawTile(ch, tx, ty);
    }
    for (let ty = 0; ty < ROWS; ty++) for (let tx = c0; tx <= c1; tx++) {
      const ch = grid[ty][tx];
      if (ch !== ' ' && ch !== 'P' && ch !== 'K' && ch !== 'k') drawTile(ch, tx, ty);
    }
    for (const p of pickups) {
      const x = Math.round(p.x - camX), y = Math.round(p.y) + HUD;
      if (p.type === 'heart') heart(x, y, true);
      else gemPx(x, y);
    }
    for (const e of enemies) drawEnemy(e);
    drawBoss();
    drawPlayer();
    for (const s of shots) drawShot(s);
    for (const p of parts) px(Math.round(p.x - camX), Math.round(p.y) + HUD, 2, 2, p.color);
    drawHud();
    if (levelTitleTimer > 0 && state === 'play') {
      drawText('FASE ' + (levelIdx + 1), HUD + 26, '#fff', 10);
      drawText(lv.name, HUD + 40, '#ffd23a', 12);
    }
    if (toastTimer > 0) {
      const lines = wrap(toast, 46);
      const top = H - 14 - lines.length * 10;
      ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(8, top - 6, W - 16, lines.length * 10 + 6);
      lines.forEach((l, i) => drawText(l, top + i * 10, '#fff', 8));
    }
    if (state === 'dead') {
      ctx.fillStyle = `rgba(0,0,0,${Math.min(0.7, stateTimer / 50)})`; ctx.fillRect(0, 0, W, H);
      drawText('Ops! Tente de novo', H / 2, '#ff6a6a', 14);
    }
    if (state === 'clear') {
      ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 0, W, H);
      drawText(clearMsg, H / 2 - 12, '#ffd23a', 16);
      drawText('+' + clearGems + ' Gemas Elementais', H / 2 + 12, '#fff', 9);
      if (clearMsg.startsWith('CHEFÃO')) drawText('+' + BOSS_GEMS + ' Moedas Elementais', H / 2 + 26, '#9fe0ff', 8);
    }
    if (state === 'win') {
      ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 0, W, H);
      drawText('VOCÊ ZEROU!', H / 2 - 30, '#ffd23a', 20);
      drawText('Passou das ' + MAX_LEVEL + ' fases!', H / 2, '#fff', 9);
      drawText('Você é uma lenda do Reino Elemental!', H / 2 + 14, '#fff', 9);
      if (stateTimer > 90) drawText(isTouch ? 'Toque pra jogar de novo desde a fase 1' : 'Aperte ESPAÇO pra jogar de novo desde a fase 1', H / 2 + 44, '#8a93b8', 8);
    }
  }

  // Depois de vencer, recomeça na fase 1 com todos os poderes
  function replayFromStart() {
    levelIdx = 0; checkpoint = null;
    startLevel(); state = 'play';
    writeSave();
  }

  // ── Controles ─────────────────────────────────────────────
  // Pular: Espaço, ↑ ou W · Atacar: J, K, Z ou clique · Trocar elemento: Q ou E
  const keys = { left: false, right: false, jump: false, jumpPressed: false, attack: false };
  const KEYMAP = {
    ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
    Space: 'jump', ArrowUp: 'jump', KeyW: 'jump',
    KeyJ: 'attack', KeyK: 'attack', KeyZ: 'attack', KeyF: 'attack',
  };
  addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT') return;   // digitando no e-mail ou no nome
    if (state === 'title') { if (menuPage === 'main' && (e.code === 'Enter' || e.code === 'Space')) { e.preventDefault(); $('m-play').click(); } return; }
    if (state === 'win' && stateTimer > 90 && (e.code === 'Space' || e.code === 'Enter')) { e.preventDefault(); replayFromStart(); return; }
    const k = KEYMAP[e.code];
    if (k) {
      e.preventDefault();
      if (k === 'jump' && !keys.jump) keys.jumpPressed = true;
      keys[k] = true;
    }
    if (state !== 'play' || e.repeat) return;
  });
  addEventListener('keyup', e => { const k = KEYMAP[e.code]; if (k) keys[k] = false; });
  addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

  // Mouse: clicar no jogo atira
  canvas.addEventListener('mousedown', () => {
    if (state === 'win' && stateTimer > 90) { replayFromStart(); return; }
    keys.attack = true;
  });
  addEventListener('mouseup', () => { keys.attack = false; });

  // Celular: setinhas ◀ ▶ na esquerda e PULAR / ATACAR / TROCAR na direita
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (isTouch) document.body.classList.add('touch');

  // Botão de segurar (pular e atacar) e de tocar (trocar)
  function holdButton(id, key) {
    const b = document.getElementById(id);
    b.addEventListener('touchstart', e => {
      e.preventDefault(); b.classList.add('on');
      if (state === 'win' && stateTimer > 90) { replayFromStart(); return; }
      if (key === 'jump' && !keys.jump) keys.jumpPressed = true;
      keys[key] = true;
    }, { passive: false });
    const end = e => { e.preventDefault(); b.classList.remove('on'); keys[key] = false; };
    b.addEventListener('touchend', end, { passive: false });
    b.addEventListener('touchcancel', end, { passive: false });
  }
  holdButton('btn-left', 'left');
  holdButton('btn-right', 'right');
  holdButton('btn-jump', 'jump');
  holdButton('btn-attack', 'attack');

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
  if (location.hash === '#debug') window.av = {
    player, meta, keys, makeLevel, showPage, setState, newGame, startLevel, update, fire, tileAt,
    get state() { return state; }, get level() { return levelIdx; }, set level(v) { levelIdx = v; checkpoint = null; },
    get enemies() { return enemies; }, get boss() { return boss; }, get shots() { return shots; }, get camX() { return camX; },
  };
})();
