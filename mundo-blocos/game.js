(() => {
  'use strict';

  // ── Mundo ─────────────────────────────────────────────────
  const W = 96, D = 96, H = 48, CS = 16;       // tamanho do mundo e dos chunks
  const NCX = W / CS, NCZ = D / CS;
  const SAVE_KEY = 'mundo-blocos-save';
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  const AIR = 0, GRASS = 1, DIRT = 2, STONE = 3, SAND = 4, WOOD = 5, LEAVES = 6,
        PLANKS = 7, COBBLE = 8, GLASS = 9, BRICK = 10, BEDROCK = 11,
        SNOW = 12, GOLD = 13, DIAMOND = 14, WOOL_W = 15, WOOL_R = 16, WOOL_B = 17,
        WOOL_Y = 18, WOOL_G = 19, WOOL_K = 20, GRAVEL = 21,
        CRAFT = 22, BOOKS = 23, CHEST = 24, FURNACE = 25, LAMP = 26, DOOR = 27, DOOR_TOP = 28,
        BED = 29, TABLE = 30, CHAIR = 31, TORCH = 32, CARPET = 33, FENCE = 34;

  // Tapetes coloridos: o primeiro (vermelho) é o CARPET, os outros vêm depois do 34
  const CARPET_COLORS = [
    { name: 'vermelho', color: [190, 45, 40] },
    { name: 'vermelho escuro', color: [115, 25, 25] },
    { name: 'laranja', color: [235, 125, 35] },
    { name: 'amarelo', color: [245, 205, 50] },
    { name: 'verde claro', color: [125, 205, 65] },
    { name: 'verde', color: [70, 145, 45] },
    { name: 'verde escuro', color: [35, 85, 30] },
    { name: 'azul claro', color: [110, 175, 230] },
    { name: 'azul', color: [50, 85, 190] },
    { name: 'azul escuro', color: [25, 35, 105] },
    { name: 'roxo', color: [125, 55, 175] },
  ];
  const CARPETS = CARPET_COLORS.map((c, i) => (i === 0 ? CARPET : 34 + i));

  // Índices das texturas no atlas (8x8 de 16px)
  const ATL = 8;
  const T = {
    grassTop: 0, grassSide: 1, dirt: 2, stone: 3, sand: 4, woodSide: 5, woodTop: 6, leaves: 7,
    planks: 8, cobble: 9, glass: 10, brick: 11, bedrock: 12, snow: 13, gold: 14, diamond: 15,
    woolW: 16, woolR: 17, woolB: 18, woolY: 19, woolG: 20, woolK: 21, gravel: 22, craftTop: 23,
    craftSide: 24, books: 25, chestTop: 26, chestSide: 27, chestFront: 28, furnaceFront: 29,
    furnaceSide: 30, lamp: 31, doorTop: 32, doorBottom: 33, torch: 34, bedTop: 35, bedSide: 36,
    carpet0: 37,   // + 11 cores de tapete (37 a 47)
  };

  // Formatos que não são cubo, em 1/16 de bloco. A frente aponta pra +z (vira pro jogador ao colocar)
  const SHAPES = {
    door:     [[0, 0, 0, 16, 16, 3]],
    doorOpen: [[0, 0, 0, 3, 16, 16]],
    bed:      [[0, 0, 0, 16, 9, 16]],
    table:    [[0, 13, 0, 16, 16, 16], [1, 0, 1, 3, 13, 3], [13, 0, 1, 15, 13, 3], [1, 0, 13, 3, 13, 15], [13, 0, 13, 15, 13, 15]],
    chair:    [[2, 6, 2, 14, 8, 14], [2, 0, 2, 4, 6, 4], [12, 0, 2, 14, 6, 4], [2, 0, 12, 4, 6, 14], [12, 0, 12, 14, 6, 14], [2, 8, 2, 14, 20, 4]],
    torch:    [[7, 0, 7, 9, 10, 9]],
    carpet:   [[0, 0, 0, 16, 1, 16]],
    fence:    [[6, 0, 6, 10, 16, 10], [0, 6, 7, 16, 9, 9], [0, 12, 7, 16, 15, 9]],
  };
  const CUBE = [[0, 0, 0, 16, 16, 16]];

  // tex: [cima, baixo, lados]
  const BLOCKS = {
    [GRASS]:    { name: 'Grama', tex: [T.grassTop, T.dirt, T.grassSide] },
    [DIRT]:     { name: 'Terra', tex: [T.dirt, T.dirt, T.dirt] },
    [STONE]:    { name: 'Pedra', tex: [T.stone, T.stone, T.stone] },
    [SAND]:     { name: 'Areia', tex: [T.sand, T.sand, T.sand] },
    [WOOD]:     { name: 'Tronco', tex: [T.woodTop, T.woodTop, T.woodSide] },
    [LEAVES]:   { name: 'Folhas', tex: [T.leaves, T.leaves, T.leaves] },
    [PLANKS]:   { name: 'Tábuas', tex: [T.planks, T.planks, T.planks] },
    [COBBLE]:   { name: 'Pedregulho', tex: [T.cobble, T.cobble, T.cobble] },
    [GLASS]:    { name: 'Vidro', tex: [T.glass, T.glass, T.glass] },
    [BRICK]:    { name: 'Tijolos', tex: [T.brick, T.brick, T.brick] },
    [BEDROCK]:  { name: 'Rocha-mãe', tex: [T.bedrock, T.bedrock, T.bedrock] },
    [SNOW]:     { name: 'Neve', tex: [T.snow, T.snow, T.snow] },
    [GOLD]:     { name: 'Bloco de ouro', tex: [T.gold, T.gold, T.gold] },
    [DIAMOND]:  { name: 'Bloco de diamante', tex: [T.diamond, T.diamond, T.diamond] },
    [WOOL_W]:   { name: 'Lã branca', tex: [T.woolW, T.woolW, T.woolW] },
    [WOOL_R]:   { name: 'Lã vermelha', tex: [T.woolR, T.woolR, T.woolR] },
    [WOOL_B]:   { name: 'Lã azul', tex: [T.woolB, T.woolB, T.woolB] },
    [WOOL_Y]:   { name: 'Lã amarela', tex: [T.woolY, T.woolY, T.woolY] },
    [WOOL_G]:   { name: 'Lã verde', tex: [T.woolG, T.woolG, T.woolG] },
    [WOOL_K]:   { name: 'Lã preta', tex: [T.woolK, T.woolK, T.woolK] },
    [GRAVEL]:   { name: 'Cascalho', tex: [T.gravel, T.gravel, T.gravel] },
    [CRAFT]:    { name: 'Mesa de trabalho', tex: [T.craftTop, T.planks, T.craftSide] },
    [BOOKS]:    { name: 'Estante de livros', tex: [T.planks, T.planks, T.books] },
    [CHEST]:    { name: 'Baú', tex: [T.chestTop, T.chestTop, T.chestSide], front: T.chestFront },
    [FURNACE]:  { name: 'Fornalha', tex: [T.furnaceSide, T.furnaceSide, T.furnaceSide], front: T.furnaceFront },
    [LAMP]:     { name: 'Lâmpada', tex: [T.lamp, T.lamp, T.lamp], bright: true },
    [DOOR]:     { name: 'Porta', tex: [T.planks, T.planks, T.doorBottom], shape: 'door' },
    [DOOR_TOP]: { name: 'Porta', tex: [T.planks, T.planks, T.doorTop], shape: 'door' },
    [BED]:      { name: 'Cama', tex: [T.bedTop, T.planks, T.bedSide], shape: 'bed' },
    [TABLE]:    { name: 'Mesa', tex: [T.planks, T.planks, T.planks], shape: 'table' },
    [CHAIR]:    { name: 'Cadeira', tex: [T.planks, T.planks, T.planks], shape: 'chair' },
    [TORCH]:    { name: 'Tocha', tex: [T.torch, T.torch, T.torch], shape: 'torch', solid: false, bright: true },
    [FENCE]:    { name: 'Cerca', tex: [T.planks, T.planks, T.planks], shape: 'fence' },
  };

  CARPET_COLORS.forEach((c, i) => {
    const t = T.carpet0 + i;
    BLOCKS[CARPETS[i]] = { name: `Tapete ${c.name}`, tex: [t, t, t], shape: 'carpet', solid: false, carpet: c.color };
  });

  // Armaduras: peça 0 capacete, 1 peitoral, 2 calça, 3 botas
  const ARMOR_PIECES = ['Capacete', 'Peitoral', 'Calça', 'Botas'];
  const ARMOR_MATS = [
    { name: 'de couro', color: [140, 90, 50] },
    { name: 'de ferro', color: [212, 212, 218] },
    { name: 'de ouro', color: [245, 205, 60] },
    { name: 'de diamante', color: [80, 220, 220] },
    { name: 'de netherite', color: [72, 64, 68] },
  ];

  const CATEGORIES = [
    { name: 'Blocos', items: [GRASS, DIRT, STONE, COBBLE, SAND, GRAVEL, WOOD, PLANKS, LEAVES, GLASS,
                              BRICK, SNOW, GOLD, DIAMOND, WOOL_W, WOOL_R, WOOL_B, WOOL_Y, WOOL_G, WOOL_K] },
    { name: 'Coisas de casa', items: [CRAFT, BOOKS, CHEST, FURNACE, LAMP, DOOR, BED, TABLE, CHAIR, TORCH, FENCE, ...CARPETS] },
    { name: 'Armadura', armor: true },
  ];

  const isTransparent = id => id === AIR || id === LEAVES || id === GLASS || !!(BLOCKS[id] && BLOCKS[id].shape);
  const isDoor = id => id === DOOR || id === DOOR_TOP;

  let world = new Uint8Array(W * H * D);
  let meta = new Uint8Array(W * H * D);   // virada (0-3) e porta aberta (+4)
  let seed = 1;
  const idx = (x, y, z) => x + z * W + y * W * D;
  const inside = (x, y, z) => x >= 0 && y >= 0 && z >= 0 && x < W && y < H && z < D;
  function getBlock(x, y, z) {
    if (y < 0) return BEDROCK;
    return inside(x, y, z) ? world[idx(x, y, z)] : AIR;
  }
  // Para colisão: fora do mapa (nos lados) é parede invisível
  function isSolid(x, y, z) {
    if (y < 0 || x < 0 || z < 0 || x >= W || z >= D) return true;
    if (y >= H) return false;
    const i = idx(x, y, z), id = world[i];
    if (id === AIR || BLOCKS[id].solid === false) return false;
    if (isDoor(id) && (meta[i] & 4)) return false;
    return true;
  }

  // ── Geração do terreno ────────────────────────────────────
  function hash2(ix, iz) {
    let h = Math.imul(ix, 374761393) + Math.imul(iz, 668265263) + Math.imul(seed, 1442695041);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }
  function vnoise(x, z) {
    const ix = Math.floor(x), iz = Math.floor(z);
    let fx = x - ix, fz = z - iz;
    fx = fx * fx * (3 - 2 * fx); fz = fz * fz * (3 - 2 * fz);
    const a = hash2(ix, iz), b = hash2(ix + 1, iz), c = hash2(ix, iz + 1), d = hash2(ix + 1, iz + 1);
    return (a + (b - a) * fx) + ((c + (d - c) * fx) - (a + (b - a) * fx)) * fz;
  }
  const fbm = (x, z) => vnoise(x / 32, z / 32) * 0.6 + vnoise(x / 14, z / 14) * 0.3 + vnoise(x / 6, z / 6) * 0.1;

  function mulberry32(a) {
    return () => {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function generate(newSeed) {
    seed = newSeed;
    world = new Uint8Array(W * H * D);
    meta = new Uint8Array(W * H * D);
    const heights = new Int16Array(W * D);
    for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
      const h = Math.floor(8 + fbm(x, z) * 24);
      heights[x + z * W] = h;
      for (let y = 0; y <= h; y++) {
        let b;
        if (y === 0) b = BEDROCK;
        else if (y < h - 3) b = STONE;
        else if (h <= 14) b = SAND;
        else if (h >= 28 && y === h) b = SNOW;
        else b = y === h ? GRASS : DIRT;
        world[idx(x, y, z)] = b;
      }
    }
    // Árvores
    const rnd = mulberry32(seed);
    for (let z = 3; z < D - 3; z++) for (let x = 3; x < W - 3; x++) {
      const h = heights[x + z * W];
      if (world[idx(x, h, z)] !== GRASS || rnd() > 0.012) continue;
      const trunk = 4 + Math.floor(rnd() * 2);
      const top = h + trunk;
      if (top + 2 >= H) continue;
      for (let y = top - 2; y <= top + 1; y++) {
        const r = y >= top ? 1 : 2;
        for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
          if (Math.abs(dx) === r && Math.abs(dz) === r && (y === top + 1 || rnd() < 0.5)) continue;
          if (world[idx(x + dx, y, z + dz)] === AIR) world[idx(x + dx, y, z + dz)] = LEAVES;
        }
      }
      for (let y = h + 1; y <= top; y++) world[idx(x, y, z)] = WOOD;
      world[idx(x, h, z)] = DIRT;
    }
  }

  function surfaceY(x, z) {
    for (let y = H - 1; y >= 0; y--) if (world[idx(x, y, z)] !== AIR) return y + 1;
    return H;
  }

  // ── Salvar / carregar (RLE + base64 no localStorage) ──────
  function encode(arr) {
    const out = [];
    for (let i = 0; i < arr.length;) {
      const v = arr[i]; let n = 1;
      while (n < 255 && i + n < arr.length && arr[i + n] === v) n++;
      out.push(v, n); i += n;
    }
    let s = '';
    for (let i = 0; i < out.length; i += 8192) s += String.fromCharCode.apply(null, out.slice(i, i + 8192));
    return btoa(s);
  }
  function decode(b64) {
    const s = atob(b64), w = new Uint8Array(W * H * D);
    let p = 0;
    for (let i = 0; i < s.length; i += 2) {
      const v = s.charCodeAt(i), n = s.charCodeAt(i + 1);
      w.fill(v, p, p + n); p += n;
    }
    if (p !== w.length) throw new Error('save inválido');
    return w;
  }
  function save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        v: 2, seed, data: encode(world), meta: encode(meta), slot, hotbar, armor,
        p: [player.pos.x, player.pos.y, player.pos.z, player.yaw, 0, player.fly],
      }));
    } catch (e) { /* sem armazenamento: tudo bem, só não salva */ }
  }
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (!s || (s.v !== 1 && s.v !== 2)) return false;
      world = decode(s.data);
      meta = s.meta ? decode(s.meta) : new Uint8Array(W * H * D);
      seed = s.seed;
      if (s.v === 2) {
        slot = s.slot || 0;
        if (Array.isArray(s.hotbar)) hotbar = s.hotbar.slice(0, 9).map(id => (BLOCKS[id] ? id : null));
        if (Array.isArray(s.armor)) armor = s.armor.slice(0, 4).map(m => (ARMOR_MATS[m] ? m : -1));
      }
      player.pos.set(s.p[0], s.p[1], s.p[2]);
      player.yaw = s.p[3]; player.pitch = 0; player.fly = !!s.p[5];
      return true;
    } catch (e) { return false; }
  }

  // ── Texturas (desenhadas no canvas, estilo pixel) ─────────
  const atlas = document.createElement('canvas');
  atlas.width = atlas.height = ATL * 16;
  const actx = atlas.getContext('2d');
  const trnd = mulberry32(12345);

  function tile(i, fn) {
    const ox = (i % ATL) * 16, oy = Math.floor(i / ATL) * 16;
    const img = actx.createImageData(16, 16);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const [r, g, b, a = 255] = fn(x, y);
      const k = (x + y * 16) * 4;
      img.data[k] = r; img.data[k + 1] = g; img.data[k + 2] = b; img.data[k + 3] = a;
    }
    actx.putImageData(img, ox, oy);
  }
  const vary = (c, amt) => { const f = 1 + (trnd() - 0.5) * amt; return c.map(v => Math.max(0, Math.min(255, v * f))); };

  const grassCol = [95, 159, 53], dirtCol = [134, 96, 67], plankCol = [162, 130, 78], stoneCol = [125, 125, 125];
  const plankPix = (x, y) => {
    const board = Math.floor(y / 4);
    if (y % 4 === 3 || (x === (board % 2 ? 4 : 12))) return vary([110, 86, 50], 0.1);
    return vary(plankCol, 0.12);
  };
  const wool = c => (x, y) => vary(c, (x + y) % 3 === 0 ? 0.2 : 0.1);

  tile(T.grassTop, () => vary(grassCol, 0.3));
  const grassEdge = Array.from({ length: 16 }, () => 3 + Math.floor(trnd() * 3));
  tile(T.grassSide, (x, y) => y < grassEdge[x] ? vary(grassCol, 0.3) : vary(dirtCol, 0.35));
  tile(T.dirt, () => vary(dirtCol, 0.35));
  tile(T.stone, () => vary(stoneCol, 0.25));
  tile(T.sand, () => vary([219, 207, 163], 0.12));
  tile(T.woodSide, (x) => vary(x % 4 === 0 ? [80, 62, 38] : [104, 82, 50], 0.15));
  tile(T.woodTop, (x, y) => {
    const d = Math.floor(Math.hypot(x - 7.5, y - 7.5));
    if (d >= 7) return vary([104, 82, 50], 0.15);
    return vary(d % 2 ? [176, 141, 87] : [150, 116, 66], 0.08);
  });
  tile(T.leaves, () => trnd() < 0.18 ? [0, 0, 0, 0] : vary([58, 128, 38], 0.4));
  tile(T.planks, plankPix);
  tile(T.cobble, (x, y) => {
    const n = vnoise(x / 3 + 50, y / 3 + 50);
    return n > 0.75 || n < 0.2 ? vary([80, 80, 80], 0.2) : vary([130, 130, 130], 0.25);
  });
  tile(T.glass, (x, y) => {
    if (x === 0 || y === 0 || x === 15 || y === 15) return [220, 240, 250, 255];
    if ((x === y + 3 || x === y + 4) && x > 4 && x < 10) return [255, 255, 255, 255];
    return [0, 0, 0, 0];
  });
  tile(T.brick, (x, y) => {
    const row = Math.floor(y / 4);
    const mortar = y % 4 === 3 || (x + (row % 2 ? 4 : 0)) % 8 === 7;
    return mortar ? vary([180, 175, 165], 0.08) : vary([150, 70, 55], 0.18);
  });
  tile(T.bedrock, () => vary(trnd() < 0.5 ? [50, 50, 50] : [90, 90, 90], 0.3));
  tile(T.snow, () => vary([240, 246, 252], 0.05));
  tile(T.gold, (x, y) => (x === 0 || y === 0) ? [255, 240, 150] : (x === 15 || y === 15) ? [190, 140, 30] : vary([245, 205, 60], 0.1));
  tile(T.diamond, (x, y) => (x === 0 || y === 0) ? [200, 255, 255] : (x === 15 || y === 15) ? [40, 150, 150] : vary([90, 220, 220], 0.12));
  tile(T.woolW, wool([235, 235, 235]));
  tile(T.woolR, wool([180, 45, 40]));
  tile(T.woolB, wool([50, 70, 175]));
  tile(T.woolY, wool([240, 200, 50]));
  tile(T.woolG, wool([90, 160, 40]));
  tile(T.woolK, wool([30, 30, 34]));
  tile(T.gravel, () => { const r = trnd(); return r < 0.3 ? vary([90, 85, 80], 0.2) : r < 0.6 ? vary([150, 140, 130], 0.2) : vary([120, 115, 110], 0.2); });
  tile(T.craftTop, (x, y) => (x === 0 || y === 0 || x === 15 || y === 15 || x === 5 || x === 10 || y === 5 || y === 10)
    ? vary([90, 60, 35], 0.1) : vary([180, 140, 90], 0.1));
  tile(T.craftSide, (x, y) => {
    if (y < 3) return vary([90, 60, 35], 0.1);
    if (x >= 3 && x <= 4 && y >= 5 && y <= 13) return [110, 80, 45];        // cabo
    if (x >= 1 && x <= 6 && y >= 4 && y <= 5) return [140, 140, 140];      // martelo
    if (x >= 10 && x <= 11 && y >= 5 && y <= 13) return [110, 80, 45];
    if (x >= 9 && x <= 12 && y >= 4 && y <= 6) return [170, 170, 175];     // serrote
    return plankPix(x, y);
  });
  const bookCols = [[150, 40, 40], [40, 80, 150], [60, 130, 60], [170, 140, 40], [110, 60, 140]];
  const bookOf = Array.from({ length: 16 }, () => bookCols[Math.floor(trnd() * bookCols.length)]);
  tile(T.books, (x, y) => {
    if (y < 2 || y > 13 || y === 7 || y === 8) return vary(plankCol, 0.1);
    if (x % 3 === 2) return [50, 35, 20];
    return vary(bookOf[(x + (y > 7 ? 7 : 0)) % 16], 0.1);
  });
  const chestCol = [165, 110, 45];
  tile(T.chestTop, (x, y) => (x === 0 || y === 0 || x === 15 || y === 15) ? [80, 50, 20] : vary(chestCol, 0.1));
  tile(T.chestSide, (x, y) => (x === 0 || x === 15 || y === 0 || y === 15 || y === 5) ? [80, 50, 20] : vary(chestCol, 0.1));
  tile(T.chestFront, (x, y) => {
    if (x >= 7 && x <= 8 && y >= 4 && y <= 7) return [200, 200, 205];
    return (x === 0 || x === 15 || y === 0 || y === 15 || y === 5) ? [80, 50, 20] : vary(chestCol, 0.1);
  });
  tile(T.furnaceSide, (x, y) => (x === 0 || y === 0 || x === 15 || y === 15) ? [80, 80, 80] : vary(stoneCol, 0.2));
  tile(T.furnaceFront, (x, y) => {
    if (x >= 4 && x <= 11 && y >= 8 && y <= 13) return y >= 12 ? vary([255, 140, 30], 0.2) : [30, 25, 25];
    if (x >= 4 && x <= 11 && y >= 2 && y <= 3) return [60, 60, 60];
    return (x === 0 || y === 0 || x === 15 || y === 15) ? [80, 80, 80] : vary(stoneCol, 0.2);
  });
  tile(T.lamp, (x, y) => (x % 5 === 0 || y % 5 === 0) ? [190, 150, 70] : vary([255, 230, 140], 0.08));
  tile(T.doorTop, (x, y) => {
    if (x === 0 || x === 15 || y === 0) return [90, 65, 35];
    if (x >= 3 && x <= 12 && y >= 3 && y <= 11) return (x === 7 || x === 8 || y === 7) ? [90, 65, 35] : [175, 215, 235];
    return vary([150, 115, 65], 0.08);
  });
  tile(T.doorBottom, (x, y) => {
    if (x === 0 || x === 15 || y === 15) return [90, 65, 35];
    if (x >= 11 && x <= 12 && y >= 1 && y <= 2) return [200, 200, 205];   // maçaneta
    if ((x === 3 || x === 12) && y >= 5 && y <= 12) return [110, 80, 45];
    if ((y === 5 || y === 12) && x >= 3 && x <= 12) return [110, 80, 45];
    return vary([150, 115, 65], 0.08);
  });
  tile(T.torch, (x, y) => {
    if (x < 7 || x > 8) return [0, 0, 0, 0];
    if (y < 6) return [0, 0, 0, 0];
    if (y <= 8) return y === 6 ? [255, 230, 120] : [255, 150, 40];
    return [110, 80, 40];
  });
  tile(T.bedTop, (x, y) => (y < 5 && x > 0 && x < 15) ? vary([240, 240, 240], 0.05) : vary([180, 45, 40], 0.1));
  CARPET_COLORS.forEach((c, i) => tile(T.carpet0 + i, wool(c.color)));
  tile(T.bedSide, (x, y) => y < 12 ? vary([180, 45, 40], 0.1) : vary(plankCol, 0.1));

  // ── Três.js ───────────────────────────────────────────────
  const renderer = new THREE.WebGLRenderer({ antialias: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  const SKY = 0x87ceeb;
  scene.background = new THREE.Color(SKY);
  scene.fog = new THREE.Fog(SKY, 35, 80);

  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.05, 200);
  camera.rotation.order = 'YXZ';

  const texture = new THREE.CanvasTexture(atlas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  if ('SRGBColorSpace' in THREE) texture.colorSpace = THREE.SRGBColorSpace;
  else { texture.encoding = THREE.sRGBEncoding; renderer.outputEncoding = THREE.sRGBEncoding; }

  const blockMat = new THREE.MeshBasicMaterial({ map: texture, vertexColors: true, alphaTest: 0.5 });

  // Faces do cubo. u/v dizem de qual eixo vem a coordenada da textura (e se é invertida)
  const FACES = [
    { dir: [-1, 0, 0], shade: 0.8,  u: [2, 0], v: [1, 0], corners: [[0, 1, 0], [0, 0, 0], [0, 1, 1], [0, 0, 1]] },
    { dir: [1, 0, 0],  shade: 0.8,  u: [2, 1], v: [1, 0], corners: [[1, 1, 1], [1, 0, 1], [1, 1, 0], [1, 0, 0]] },
    { dir: [0, -1, 0], shade: 0.5,  u: [0, 0], v: [2, 1], corners: [[1, 0, 1], [0, 0, 1], [1, 0, 0], [0, 0, 0]] },
    { dir: [0, 1, 0],  shade: 1.0,  u: [0, 1], v: [2, 0], corners: [[0, 1, 1], [1, 1, 1], [0, 1, 0], [1, 1, 0]] },
    { dir: [0, 0, -1], shade: 0.65, u: [0, 1], v: [1, 0], corners: [[1, 0, 0], [0, 0, 0], [1, 1, 0], [0, 1, 0]] },
    { dir: [0, 0, 1],  shade: 0.65, u: [0, 0], v: [1, 0], corners: [[0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]] },
  ];
  // As cores de vértice são lineares; corrige pra que o sombreado pareça o certo na tela
  for (const f of FACES) f.lin = Math.pow(f.shade, 2.2);
  // Pra onde a frente aponta, conforme a virada (0-3)
  const FRONT = [[0, 0, 1], [1, 0, 0], [0, 0, -1], [-1, 0, 0]];

  // Gira uma caixa em volta do centro do bloco, de 90 em 90 graus
  function rotBox(b, r) {
    let [x0, y0, z0, x1, y1, z1] = b;
    for (let i = 0; i < r; i++) [x0, x1, z0, z1] = [z0, z1, 16 - x1, 16 - x0];
    return [x0, y0, z0, x1, y1, z1];
  }

  const chunkMeshes = [];
  const dirty = new Set();

  function buildChunk(cx, cz) {
    const pos = [], uv = [], col = [], ind = [];
    const E = 0.002;
    for (let y = 0; y < H; y++) for (let z = cz * CS; z < cz * CS + CS; z++) for (let x = cx * CS; x < cx * CS + CS; x++) {
      const i = idx(x, y, z), id = world[i];
      if (id === AIR) continue;
      const def = BLOCKS[id], m = meta[i], rot = m & 3;
      let boxes = CUBE;
      if (def.shape) {
        const shape = isDoor(id) && (m & 4) ? SHAPES.doorOpen : SHAPES[def.shape];
        boxes = shape.map(b => rotBox(b, rot));
      }
      for (const b of boxes) {
        for (const f of FACES) {
          if (!def.shape) {
            const n = getBlock(x + f.dir[0], y + f.dir[1], z + f.dir[2]);
            const show = n === AIR || (isTransparent(n) && (n !== id || id === LEAVES));
            if (!show) continue;
          }
          let t = f.dir[1] === 1 ? def.tex[0] : f.dir[1] === -1 ? def.tex[1] : def.tex[2];
          if (def.front && f.dir[0] === FRONT[rot][0] && f.dir[2] === FRONT[rot][2]) t = def.front;
          const tx = t % ATL, ty = Math.floor(t / ATL);
          const shade = def.bright ? 1 : f.lin;
          const base = pos.length / 3;
          for (const c of f.corners) {
            const p = [c[0] ? b[3] : b[0], c[1] ? b[4] : b[1], c[2] ? b[5] : b[2]];
            pos.push(x + p[0] / 16, y + p[1] / 16, z + p[2] / 16);
            let u = p[f.u[0]] / 16, v = p[f.v[0]] / 16;
            if (f.u[1]) u = 1 - u;
            if (f.v[1]) v = 1 - v;
            u = Math.min(1 - E, Math.max(E, u)); v = Math.min(1 - E, Math.max(E, v));
            uv.push((tx + u) / ATL, 1 - (ty + 1 - v) / ATL);
            col.push(shade, shade, shade);
          }
          ind.push(base, base + 1, base + 2, base + 2, base + 1, base + 3);
        }
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    geo.setIndex(ind);
    geo.computeBoundingSphere();

    const k = cx + cz * NCX;
    if (chunkMeshes[k]) {
      chunkMeshes[k].geometry.dispose();
      chunkMeshes[k].geometry = geo;
    } else {
      chunkMeshes[k] = new THREE.Mesh(geo, blockMat);
      scene.add(chunkMeshes[k]);
    }
  }
  function buildAll() {
    for (let cz = 0; cz < NCZ; cz++) for (let cx = 0; cx < NCX; cx++) buildChunk(cx, cz);
    dirty.clear();
  }
  function markDirty(x, z) {
    const cx = Math.floor(x / CS), cz = Math.floor(z / CS);
    const add = (a, b) => { if (a >= 0 && b >= 0 && a < NCX && b < NCZ) dirty.add(a + b * NCX); };
    add(cx, cz);
    if (x % CS === 0) add(cx - 1, cz);
    if (x % CS === CS - 1) add(cx + 1, cz);
    if (z % CS === 0) add(cx, cz - 1);
    if (z % CS === CS - 1) add(cx, cz + 1);
  }
  function setBlock(x, y, z, id, m = 0) {
    if (!inside(x, y, z)) return;
    world[idx(x, y, z)] = id;
    meta[idx(x, y, z)] = m;
    markDirty(x, z);
    saveSoon();
  }

  // Contorno do bloco que você está mirando
  const highlight = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(1.004, 1.004, 1.004)),
    new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.6 })
  );
  highlight.visible = false;
  scene.add(highlight);

  // Nuvens
  const clouds = new THREE.Group();
  const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, fog: false });
  const crnd = mulberry32(777);
  for (let i = 0; i < 18; i++) {
    const c = new THREE.Mesh(new THREE.BoxGeometry(6 + crnd() * 12, 1.5, 5 + crnd() * 10), cloudMat);
    c.position.set(crnd() * 200 - 50, H + 10 + crnd() * 4, crnd() * 200 - 50);
    clouds.add(c);
  }
  scene.add(clouds);

  // ── Jogador ───────────────────────────────────────────────
  const PW = 0.3, PH = 1.8, EYE = 1.62, EPS = 1e-4;
  const GRAVITY = 28, JUMP = 8.6, WALK = 4.6, RUN = 7, FLY = 11;
  const player = {
    pos: new THREE.Vector3(), vel: new THREE.Vector3(),
    yaw: 0, pitch: 0, onGround: false, fly: false, walk: 0,
  };
  let hotbar = Array(9).fill(null);   // começa vazia: você escolhe no inventário
  let armor = [-1, -1, -1, -1];      // material de cada peça (-1 = nada)
  let slot = 0;
  let thirdPerson = false;

  function collides(p) {
    const x0 = Math.floor(p.x - PW + EPS), x1 = Math.floor(p.x + PW - EPS);
    const y0 = Math.floor(p.y + EPS), y1 = Math.floor(p.y + PH - EPS);
    const z0 = Math.floor(p.z - PW + EPS), z1 = Math.floor(p.z + PW - EPS);
    for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
      if (isSolid(x, y, z)) return true;
    }
    return false;
  }
  // Move num eixo; se bater, chega o mais perto possível e retorna true
  function moveAxis(axis, amount) {
    if (amount === 0) return false;
    const steps = Math.ceil(Math.abs(amount) / 0.25);
    const d = amount / steps;
    for (let i = 0; i < steps; i++) {
      player.pos[axis] += d;
      if (collides(player.pos)) {
        player.pos[axis] -= d;
        let dd = d;
        for (let k = 0; k < 6; k++) {
          dd /= 2;
          player.pos[axis] += dd;
          if (collides(player.pos)) player.pos[axis] -= dd;
        }
        return true;
      }
    }
    return false;
  }

  function spawn() {
    const x = Math.floor(W / 2), z = Math.floor(D / 2);
    player.pos.set(x + 0.5, surfaceY(x, z), z + 0.5);
    player.vel.set(0, 0, 0);
    player.yaw = 0; player.pitch = 0; player.fly = false;
  }

  // ── Boneco (aparece na câmera de trás, com a armadura) ────
  const SKIN = 0xe0ad87, SHIRT = 0x1fa7a7, PANTS = 0x3c3ca0, SHOES = 0x4a4a4a, HAIR = 0x5a3a20;
  const figure = new THREE.Group();
  const boxMesh = (w, h, d, color) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ color }));
  // Membros giram pelo topo: o pivô fica no ombro / quadril
  function limb(w, h, d, color, x, y) {
    const pivot = new THREE.Group();
    pivot.position.set(x, y, 0);
    const m = boxMesh(w, h, d, color);
    m.position.y = -h / 2;
    pivot.add(m);
    figure.add(pivot);
    return pivot;
  }
  const S = PH / 32;   // 1 "pixel" do boneco (32 pixels de altura)
  const head = boxMesh(8 * S, 8 * S, 8 * S, SKIN); head.position.y = 28 * S; figure.add(head);
  const hair = boxMesh(8.4 * S, 2 * S, 8.4 * S, HAIR); hair.position.y = 31.2 * S; figure.add(hair);
  const body = boxMesh(8 * S, 12 * S, 4 * S, SHIRT); body.position.y = 18 * S; figure.add(body);
  const armL = limb(4 * S, 12 * S, 4 * S, SKIN, -6 * S, 24 * S);
  const armR = limb(4 * S, 12 * S, 4 * S, SKIN, 6 * S, 24 * S);
  const legL = limb(4 * S, 12 * S, 4 * S, PANTS, -2 * S, 12 * S);
  const legR = limb(4 * S, 12 * S, 4 * S, PANTS, 2 * S, 12 * S);
  for (const leg of [legL, legR]) {
    const shoe = boxMesh(4.1 * S, 2 * S, 4.1 * S, SHOES); shoe.position.y = -11 * S; leg.add(shoe);
  }
  for (const arm of [armL, armR]) {
    const sleeve = boxMesh(4.1 * S, 4 * S, 4.1 * S, SHIRT); sleeve.position.y = -2 * S; arm.add(sleeve);
  }
  // Peças de armadura (um pouco maiores que o corpo)
  const armorMeshes = [[], [], [], []];
  function armorBox(piece, parent, w, h, d, y) {
    const m = boxMesh(w * S, h * S, d * S, 0xffffff);
    m.position.y = y * S;
    parent.add(m);
    armorMeshes[piece].push(m);
  }
  armorBox(0, figure, 9, 5, 9, 30);           // capacete
  armorBox(0, figure, 9, 4, 1, 26);           // laterais do capacete (atrás)
  armorMeshes[0][1].position.z = -4.2 * S;
  armorBox(1, figure, 9, 12.5, 5, 18);        // peitoral
  armorBox(1, armL, 4.8, 5, 4.8, -2);
  armorBox(1, armR, 4.8, 5, 4.8, -2);
  armorBox(2, legL, 4.6, 8, 4.6, -4);         // calça
  armorBox(2, legR, 4.6, 8, 4.6, -4);
  armorBox(3, legL, 4.8, 3.5, 4.8, -10.5);    // botas
  armorBox(3, legR, 4.8, 3.5, 4.8, -10.5);
  scene.add(figure);
  figure.visible = false;

  function updateArmorLook() {
    armorMeshes.forEach((list, piece) => {
      const mat = ARMOR_MATS[armor[piece]];
      for (const m of list) {
        m.visible = !!mat;
        if (mat) m.material.color.setRGB(mat.color[0] / 255, mat.color[1] / 255, mat.color[2] / 255).convertSRGBToLinear();
      }
    });
    drawPreview();
  }

  // ── Mirar blocos (raycast em grade) ───────────────────────
  function raycast(o, dir, maxDist) {
    let x = Math.floor(o.x), y = Math.floor(o.y), z = Math.floor(o.z);
    const sx = Math.sign(dir.x), sy = Math.sign(dir.y), sz = Math.sign(dir.z);
    const tdx = sx ? Math.abs(1 / dir.x) : Infinity;
    const tdy = sy ? Math.abs(1 / dir.y) : Infinity;
    const tdz = sz ? Math.abs(1 / dir.z) : Infinity;
    let tmx = sx > 0 ? (x + 1 - o.x) * tdx : sx < 0 ? (o.x - x) * tdx : Infinity;
    let tmy = sy > 0 ? (y + 1 - o.y) * tdy : sy < 0 ? (o.y - y) * tdy : Infinity;
    let tmz = sz > 0 ? (z + 1 - o.z) * tdz : sz < 0 ? (o.z - z) * tdz : Infinity;
    let nx = 0, ny = 0, nz = 0, t = 0;
    while (t <= maxDist) {
      if (inside(x, y, z) && world[idx(x, y, z)] !== AIR) return { x, y, z, nx, ny, nz };
      if (tmx < tmy && tmx < tmz) { x += sx; t = tmx; tmx += tdx; nx = -sx; ny = 0; nz = 0; }
      else if (tmy < tmz) { y += sy; t = tmy; tmy += tdy; nx = 0; ny = -sy; nz = 0; }
      else { z += sz; t = tmz; tmz += tdz; nx = 0; ny = 0; nz = -sz; }
    }
    return null;
  }

  let target = null;
  let camDist = 0;
  const lookDir = new THREE.Vector3(), eye = new THREE.Vector3();
  const pointer = new THREE.Vector2();   // posição do cursor na tela (-1 a 1)
  let hasPointer = false;
  const ray = new THREE.Raycaster();

  function placeCamera() {
    eye.set(player.pos.x, player.pos.y + EYE, player.pos.z);
    camera.rotation.set(player.pitch, player.yaw, 0);
    camDist = 0;
    if (thirdPerson) {
      // Câmera atrás do jogador, chegando mais perto se tiver bloco no caminho
      lookDir.set(0, 0, -1).applyEuler(camera.rotation);
      const want = 4;
      for (let d = 0.2; d <= want; d += 0.1) {
        const px = eye.x - lookDir.x * d, py = eye.y - lookDir.y * d, pz = eye.z - lookDir.z * d;
        if (isSolid(Math.floor(px), Math.floor(py), Math.floor(pz)) && py < H) break;
        camDist = Math.max(0, d - 0.15);
      }
      camera.position.copy(eye).addScaledVector(lookDir, -camDist);
    } else {
      camera.position.copy(eye);
    }
    camera.updateMatrixWorld();
  }

  function updateTarget() {
    placeCamera();
    // No computador mira onde o cursor está (igual ao Contra-Ataque); no celular, o centro da tela
    if (hasPointer && !isTouch) {
      ray.setFromCamera(pointer, camera);
      lookDir.copy(ray.ray.direction);
    } else {
      camera.getWorldDirection(lookDir);
    }
    target = raycast(camera.position, lookDir, 7 + camDist);
    highlight.visible = !!target;
    if (target) highlight.position.set(target.x + 0.5, target.y + 0.5, target.z + 0.5);
  }

  // Virada do bloco: a frente fica olhando pro jogador
  function facingMeta() {
    const lx = -Math.sin(player.yaw), lz = -Math.cos(player.yaw);
    if (Math.abs(lx) > Math.abs(lz)) return lx > 0 ? 3 : 1;
    return lz > 0 ? 2 : 0;
  }

  function breakBlock() {
    updateTarget();
    if (!target) return;
    const { x, y, z } = target, id = world[idx(x, y, z)];
    if (id === BEDROCK) return;
    setBlock(x, y, z, AIR);
    // A porta tem duas partes: some as duas juntas
    if (id === DOOR && getBlock(x, y + 1, z) === DOOR_TOP) setBlock(x, y + 1, z, AIR);
    if (id === DOOR_TOP && getBlock(x, y - 1, z) === DOOR) setBlock(x, y - 1, z, AIR);
    updateTarget();
  }
  function blocksPlayer(x, y, z) {
    const p = player.pos;
    return x + 1 > p.x - PW && x < p.x + PW && z + 1 > p.z - PW && z < p.z + PW && y + 1 > p.y && y < p.y + PH;
  }
  function placeBlock() {
    updateTarget();
    if (!target) return;
    const hit = world[idx(target.x, target.y, target.z)];
    // Clicar numa porta abre/fecha em vez de colocar bloco
    if (isDoor(hit)) {
      const by = hit === DOOR_TOP ? target.y - 1 : target.y;
      for (const yy of [by, by + 1]) {
        if (isDoor(getBlock(target.x, yy, target.z))) {
          const i = idx(target.x, yy, target.z);
          meta[i] ^= 4;
          markDirty(target.x, target.z);
        }
      }
      saveSoon();
      return;
    }
    const id = hotbar[slot];
    if (id == null) { toast('Escolha um bloco no 🎒'); return; }
    const x = target.x + target.nx, y = target.y + target.ny, z = target.z + target.nz;
    if (!inside(x, y, z) || world[idx(x, y, z)] !== AIR) return;
    const solid = BLOCKS[id].solid !== false;
    if (solid && blocksPlayer(x, y, z)) return;
    const m = facingMeta();
    if (id === DOOR) {
      if (!inside(x, y + 1, z) || world[idx(x, y + 1, z)] !== AIR || blocksPlayer(x, y + 1, z)) return;
      setBlock(x, y, z, DOOR, m);
      setBlock(x, y + 1, z, DOOR_TOP, m);
    } else {
      setBlock(x, y, z, id, m);
    }
    updateTarget();
  }

  // ── Ícones ────────────────────────────────────────────────
  const rgb = c => `rgb(${c[0]},${c[1]},${c[2]})`;
  const ARMOR_MASKS = [
    ['........', '..####..', '.######.', '.##..##.', '.#....#.', '........', '........', '........'],
    ['.##..##.', '########', '########', '.######.', '.######.', '.######.', '.######.', '........'],
    ['.######.', '.######.', '.##..##.', '.##..##.', '.##..##.', '.##..##.', '.##..##.', '........'],
    ['........', '........', '........', '.##..##.', '.##..##.', '.##..##.', '###..###', '........'],
  ];
  const SHAPE_ICONS = {
    [DOOR]: g => { g('#966a3c', 4, 0, 8, 16); g('#afd7eb', 5, 2, 6, 5); g('#5a4123', 7, 2, 1, 5); g('#c8c8cd', 10, 9, 1, 1); },
    [BED]: g => { g('#b42d28', 1, 7, 14, 4); g('#f0f0f0', 1, 6, 4, 3); g('#a2824e', 1, 11, 2, 3); g('#a2824e', 13, 11, 2, 3); },
    [TABLE]: g => { g('#a2824e', 1, 5, 14, 2); g('#7a5f38', 2, 7, 2, 8); g('#7a5f38', 12, 7, 2, 8); },
    [CHAIR]: g => { g('#a2824e', 4, 1, 2, 14); g('#a2824e', 4, 9, 8, 2); g('#7a5f38', 10, 11, 2, 4); },
    [TORCH]: g => { g('#6e5028', 7, 6, 2, 10); g('#ff9628', 6, 3, 4, 3); g('#ffe678', 7, 2, 2, 2); },
    [FENCE]: g => { g('#a2824e', 2, 2, 3, 14); g('#a2824e', 11, 2, 3, 14); g('#8a6a3e', 0, 5, 16, 2); g('#8a6a3e', 0, 10, 16, 2); },
  };
  function makeIcon(entry) {
    const c = document.createElement('canvas');
    c.width = c.height = 16;
    const g = c.getContext('2d');
    if (entry.armor) {
      const col = ARMOR_MATS[entry.mat].color;
      ARMOR_MASKS[entry.piece].forEach((row, y) => [...row].forEach((ch, x) => {
        if (ch !== '#') return;
        const edge = y === 0 || row[x - 1] !== '#' || row[x + 1] !== '#';
        g.fillStyle = rgb(edge ? col.map(v => v * 0.6) : col);
        g.fillRect(x * 2, y * 2, 2, 2);
      }));
      return c;
    }
    const id = entry.id;
    const carpet = BLOCKS[id].carpet;
    if (carpet) {
      g.fillStyle = rgb(carpet); g.fillRect(1, 10, 14, 3);
      g.fillStyle = rgb(carpet.map(v => v * 0.65)); g.fillRect(1, 13, 14, 1);
      return c;
    }
    if (SHAPE_ICONS[id]) {
      SHAPE_ICONS[id]((color, x, y, w, h) => { g.fillStyle = color; g.fillRect(x, y, w, h); });
      return c;
    }
    const t = BLOCKS[id].front != null ? BLOCKS[id].front : BLOCKS[id].tex[2];
    g.drawImage(atlas, (t % ATL) * 16, Math.floor(t / ATL) * 16, 16, 16, 0, 0, 16, 16);
    return c;
  }

  // ── HUD ───────────────────────────────────────────────────
  const hotbarEl = document.getElementById('hotbar');
  const toastEl = document.getElementById('toast');
  const infoEl = document.getElementById('info');
  const slotEls = [];
  for (let i = 0; i < 9; i++) {
    const el = document.createElement('div');
    el.className = 'slot';
    const pick = e => { e.preventDefault(); e.stopPropagation(); selectSlot(i); };
    el.addEventListener('mousedown', pick);
    el.addEventListener('touchstart', pick, { passive: false });
    hotbarEl.appendChild(el);
    slotEls.push(el);
  }
  // O último espaço (onde era a areia) abre o inventário
  const bagEl = document.createElement('div');
  bagEl.className = 'slot bag';
  bagEl.title = 'Escolher blocos (I)';
  bagEl.textContent = '🎒';
  const openBag = e => { e.preventDefault(); e.stopPropagation(); toggleInventory(); };
  bagEl.addEventListener('mousedown', openBag);
  bagEl.addEventListener('touchstart', openBag, { passive: false });
  hotbarEl.appendChild(bagEl);

  function renderHotbar() {
    slotEls.forEach((el, i) => {
      el.classList.toggle('sel', i === slot);
      el.innerHTML = '';
      if (hotbar[i] != null) el.appendChild(makeIcon({ id: hotbar[i] }));
      const num = document.createElement('span');
      num.textContent = i + 1;
      el.appendChild(num);
    });
  }
  let toastTimer = 0;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 900);
  }
  function selectSlot(i) {
    slot = (i + 9) % 9;
    renderHotbar();
    toast(hotbar[slot] != null ? BLOCKS[hotbar[slot]].name : 'Vazio');
  }
  function setFly(on) {
    player.fly = on;
    player.vel.y = 0;
    document.getElementById('b-fly').classList.toggle('on', on);
    toast(on ? 'Voando 🕊' : 'Andando');
  }
  function toggleCamera() {
    thirdPerson = !thirdPerson;
    document.getElementById('b-cam').classList.toggle('on', thirdPerson);
    toast(thirdPerson ? 'Câmera de trás' : 'Câmera normal');
  }

  // ── Inventário (modo criativo) ────────────────────────────
  const invEl = document.getElementById('inv');
  const invGrid = document.getElementById('inv-grid');
  const invTabs = document.getElementById('inv-tabs');
  const invName = document.getElementById('inv-name');
  const armorSide = document.getElementById('inv-armor');
  const armorSlotsEl = document.getElementById('armor-slots');
  const previewEl = document.getElementById('preview');
  let invOpen = false, invCat = 0;

  CATEGORIES.forEach((cat, i) => {
    const b = document.createElement('button');
    b.textContent = cat.name;
    b.addEventListener('click', () => { invCat = i; renderInventory(); });
    invTabs.appendChild(b);
  });

  function itemButton(entry, label, onPick, selected) {
    const b = document.createElement('button');
    b.className = 'item' + (selected ? ' on' : '');
    b.title = label;
    b.appendChild(makeIcon(entry));
    b.addEventListener('mouseenter', () => { invName.textContent = label; });
    b.addEventListener('click', onPick);
    return b;
  }

  function renderInventory() {
    [...invTabs.children].forEach((b, i) => b.classList.toggle('on', i === invCat));
    const cat = CATEGORIES[invCat];
    invGrid.innerHTML = '';
    armorSide.style.display = cat.armor ? '' : 'none';
    if (cat.armor) {
      ARMOR_MATS.forEach((mat, m) => ARMOR_PIECES.forEach((piece, p) => {
        const label = `${piece} ${mat.name}`;
        invGrid.appendChild(itemButton({ armor: true, piece: p, mat: m }, label, () => {
          armor[p] = armor[p] === m ? -1 : m;   // clicar de novo tira
          toast(armor[p] === m ? `Vestiu: ${label}` : `Tirou: ${label}`);
          updateArmorLook(); renderInventory(); saveSoon();
        }, armor[p] === m));
      }));
      armorSlotsEl.innerHTML = '';
      ARMOR_PIECES.forEach((piece, p) => {
        const s = document.createElement('div');
        s.className = 'aslot';
        s.title = piece;
        if (armor[p] >= 0) s.appendChild(makeIcon({ armor: true, piece: p, mat: armor[p] }));
        else s.textContent = ['🪖', '👕', '👖', '🥾'][p];
        s.addEventListener('click', () => { armor[p] = -1; updateArmorLook(); renderInventory(); saveSoon(); });
        armorSlotsEl.appendChild(s);
      });
    } else {
      for (const id of cat.items) {
        invGrid.appendChild(itemButton({ id }, BLOCKS[id].name, () => giveItem(id)));
      }
    }
  }

  // Coloca o bloco na barra: no espaço escolhido se estiver vazio, senão no primeiro vazio
  function giveItem(id) {
    let i = hotbar[slot] == null ? slot : hotbar.indexOf(null);
    if (i < 0) i = slot;
    hotbar[i] = id;
    slot = i;
    renderHotbar();
    toast(BLOCKS[id].name);
    saveSoon();
  }

  function toggleInventory(force) {
    invOpen = force !== undefined ? force : !invOpen;
    invEl.classList.toggle('hidden', !invOpen);
    keys.clear();
    if (invOpen) { renderInventory(); invName.textContent = 'Clique num item pra colocar na barra'; }
  }
  document.getElementById('inv-close').addEventListener('click', () => toggleInventory(false));
  document.getElementById('inv-clear').addEventListener('click', () => {
    hotbar = Array(9).fill(null);
    renderHotbar();
    saveSoon();
  });
  invEl.addEventListener('mousedown', e => { if (e.target === invEl) toggleInventory(false); });

  // Desenho do boneco de frente no inventário
  function drawPreview() {
    const g = previewEl.getContext('2d');
    g.clearRect(0, 0, 32, 32);
    const r = (c, x, y, w, h) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
    const hex = n => '#' + n.toString(16).padStart(6, '0');
    r(hex(SKIN), 12, 0, 8, 8); r(hex(HAIR), 12, 0, 8, 2);
    r('#222', 14, 4, 1, 1); r('#222', 17, 4, 1, 1);
    r(hex(SHIRT), 12, 8, 8, 12);
    r(hex(SKIN), 8, 8, 4, 12); r(hex(SKIN), 20, 8, 4, 12);
    r(hex(SHIRT), 8, 8, 4, 4); r(hex(SHIRT), 20, 8, 4, 4);
    r(hex(PANTS), 12, 20, 8, 10); r('#2a2a70', 15, 22, 2, 8);
    r(hex(SHOES), 12, 30, 8, 2);
    const a = (p, fn) => { if (armor[p] >= 0) fn(rgb(ARMOR_MATS[armor[p]].color)); };
    a(0, c => { r(c, 11, 0, 10, 3); r(c, 11, 3, 1, 4); r(c, 20, 3, 1, 4); });
    a(1, c => { r(c, 11, 8, 10, 12); r(c, 7, 8, 5, 5); r(c, 20, 8, 5, 5); });
    a(2, c => { r(c, 11, 20, 10, 8); r('rgba(0,0,0,.25)', 15, 22, 2, 6); });
    a(3, c => { r(c, 11, 28, 4, 4); r(c, 17, 28, 4, 4); });
  }

  // ── Controles ─────────────────────────────────────────────
  if (isTouch) document.body.classList.add('touch');
  document.getElementById('controls').innerHTML = isTouch
    ? '<b>Joystick</b> anda · <b>arrastar</b> a tela olha<br><b>⛏</b> quebra · <b>🧱</b> coloca · <b>⬆</b> pula · <b>🕊</b> voa · <b>👁</b> câmera<br>Toque no <b>🎒</b> pra escolher blocos e armaduras'
    : '<b>← →</b> giram a tela · <b>↑ ↓</b> ou <b>W S</b> anda · <b>A D</b> anda de lado<br><b>Q E</b> olham pra cima e pra baixo · <b>Espaço</b> pula · <b>Shift</b> corre<br><b>Clique esquerdo</b> quebra · <b>Clique direito</b> coloca (onde o cursor está)<br><b>🎒</b> ou <b>I</b> abre os blocos · <b>1-9</b> escolhe · <b>F</b> voa · <b>V</b> câmera de trás<br><b>P</b> ou <b>Esc</b> pausa';
  if (!isTouch) document.body.classList.add('mouse');

  const menuEl = document.getElementById('menu');
  const playBtn = document.getElementById('play');
  const canvas = renderer.domElement;
  let playing = false;
  const keys = new Set();
  const held = { break: false, place: false };
  let holdTimer = 0;
  let pitchByKeys = false;

  function startPlaying() {
    playing = true;
    menuEl.classList.add('hidden');
    document.body.classList.add('playing');
    playBtn.textContent = 'CONTINUAR';
  }
  function pause() {
    playing = false;
    keys.clear();
    held.break = held.place = false;
    invOpen = false;
    invEl.classList.add('hidden');
    menuEl.classList.remove('hidden');
    document.body.classList.remove('playing');
    save();
  }

  playBtn.addEventListener('click', startPlaying);
  document.getElementById('new-world').addEventListener('click', () => {
    if (!confirm('Criar um mundo novo? O mundo atual vai ser apagado.')) return;
    generate((Math.random() * 1e9) | 0);
    spawn();
    buildAll();
    save();
    startPlaying();
  });

  canvas.addEventListener('mousedown', e => {
    if (!playing || invOpen) return;
    if (e.button === 0) { breakBlock(); held.break = true; }
    if (e.button === 2) { placeBlock(); held.place = true; }
    holdTimer = 0.3;
  });
  window.addEventListener('mouseup', e => {
    if (e.button === 0) held.break = false;
    if (e.button === 2) held.place = false;
  });
  window.addEventListener('contextmenu', e => e.preventDefault());
  // O mouse não gira a câmera: só escolhe o bloco que vai quebrar/colocar
  window.addEventListener('mousemove', e => {
    pointer.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
    hasPointer = true;
  });
  document.addEventListener('mouseleave', () => { hasPointer = false; });
  window.addEventListener('wheel', e => {
    if (playing && !invOpen) selectSlot(slot + (e.deltaY > 0 ? 1 : -1));
  }, { passive: true });

  window.addEventListener('keydown', e => {
    if (!playing) return;
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) e.preventDefault();
    if (e.code === 'KeyI' || e.code === 'Tab') { toggleInventory(); return; }
    if (invOpen) { if (e.code === 'Escape') toggleInventory(false); return; }
    if (e.code === 'Escape' || e.code === 'KeyP') { pause(); return; }
    keys.add(e.code);
    if (/^Digit[1-9]$/.test(e.code)) selectSlot(Number(e.code.slice(5)) - 1);
    if (e.code === 'KeyF') setFly(!player.fly);
    if (e.code === 'KeyV') toggleCamera();
  });
  window.addEventListener('keyup', e => keys.delete(e.code));
  window.addEventListener('blur', () => keys.clear());

  function look(dx, dy, sens) {
    player.yaw -= dx * sens;
    player.pitch = Math.max(-1.55, Math.min(1.55, player.pitch - dy * sens));
  }

  // Touch: joystick à esquerda, arrastar à direita para olhar
  const joy = document.getElementById('joy'), knob = document.getElementById('knob');
  const touchState = { joyId: null, joyX: 0, joyY: 0, lookId: null, lx: 0, ly: 0, jump: false };
  const touchLayer = document.getElementById('touch');
  touchLayer.addEventListener('touchstart', e => {
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (t.clientX < window.innerWidth * 0.4 && touchState.joyId === null) {
        touchState.joyId = t.identifier;
        updateJoy(t);
      } else if (touchState.lookId === null) {
        touchState.lookId = t.identifier;
        touchState.lx = t.clientX; touchState.ly = t.clientY;
      }
    }
  }, { passive: false });
  touchLayer.addEventListener('touchmove', e => {
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (t.identifier === touchState.joyId) updateJoy(t);
      if (t.identifier === touchState.lookId) {
        look(t.clientX - touchState.lx, t.clientY - touchState.ly, 0.006);
        touchState.lx = t.clientX; touchState.ly = t.clientY;
      }
    }
  }, { passive: false });
  const touchEnd = e => {
    for (const t of e.changedTouches) {
      if (t.identifier === touchState.joyId) {
        touchState.joyId = null; touchState.joyX = touchState.joyY = 0;
        knob.style.transform = '';
      }
      if (t.identifier === touchState.lookId) touchState.lookId = null;
    }
  };
  touchLayer.addEventListener('touchend', touchEnd);
  touchLayer.addEventListener('touchcancel', touchEnd);
  function updateJoy(t) {
    const r = joy.getBoundingClientRect();
    let dx = t.clientX - (r.left + r.width / 2), dy = t.clientY - (r.top + r.height / 2);
    const len = Math.hypot(dx, dy), max = r.width / 2;
    if (len > max) { dx *= max / len; dy *= max / len; }
    touchState.joyX = dx / max; touchState.joyY = dy / max;
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
  }
  function touchButton(id, down, up) {
    const el = document.getElementById(id);
    el.addEventListener('touchstart', e => { e.preventDefault(); e.stopPropagation(); down(); }, { passive: false });
    el.addEventListener('touchend', e => { e.preventDefault(); e.stopPropagation(); if (up) up(); }, { passive: false });
  }
  touchButton('b-jump', () => { touchState.jump = true; }, () => { touchState.jump = false; });
  touchButton('b-break', () => { breakBlock(); held.break = true; holdTimer = 0.3; }, () => { held.break = false; });
  touchButton('b-place', () => { placeBlock(); held.place = true; holdTimer = 0.3; }, () => { held.place = false; });
  touchButton('b-fly', () => setFly(!player.fly));
  touchButton('b-cam', toggleCamera);
  touchButton('b-pause', pause);

  // ── Salvar de vez em quando ───────────────────────────────
  let saveTimer = 0;
  function saveSoon() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(save, 2000);
  }
  window.addEventListener('pagehide', save);
  document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });

  // ── Loop principal ────────────────────────────────────────
  const fwd = new THREE.Vector3(), right = new THREE.Vector3(), wish = new THREE.Vector3();
  let last = performance.now(), infoTimer = 0;

  function update(dt) {
    // Setas ← → giram a tela, Q / E olham pra cima e pra baixo (igual ao Contra-Ataque)
    const turn = (keys.has('ArrowLeft') ? 1 : 0) - (keys.has('ArrowRight') ? 1 : 0);
    if (turn) player.yaw += turn * 2.3 * dt;
    const tilt = (keys.has('KeyQ') ? 1 : 0) - (keys.has('KeyE') ? 1 : 0);
    if (tilt) { player.pitch = Math.max(-1.55, Math.min(1.55, player.pitch + tilt * 1.6 * dt)); pitchByKeys = true; }
    else if (pitchByKeys) player.pitch *= Math.pow(0.97, dt * 60);   // depois do Q / E, volta devagar para o nível

    // Direção que o jogador quer andar
    fwd.set(-Math.sin(player.yaw), 0, -Math.cos(player.yaw));
    right.set(Math.cos(player.yaw), 0, -Math.sin(player.yaw));
    wish.set(0, 0, 0);
    if (keys.has('KeyW') || keys.has('ArrowUp')) wish.add(fwd);
    if (keys.has('KeyS') || keys.has('ArrowDown')) wish.sub(fwd);
    if (keys.has('KeyD')) wish.add(right);
    if (keys.has('KeyA')) wish.sub(right);
    if (touchState.joyId !== null) {
      wish.addScaledVector(fwd, -touchState.joyY).addScaledVector(right, touchState.joyX);
    }
    if (wish.lengthSq() > 1) wish.normalize();

    const shift = keys.has('ShiftLeft') || keys.has('ShiftRight');
    const jump = keys.has('Space') || touchState.jump;
    const speed = player.fly ? FLY : shift ? RUN : WALK;

    player.vel.x = wish.x * speed;
    player.vel.z = wish.z * speed;
    if (player.fly) {
      player.vel.y = (jump ? FLY : 0) - (shift ? FLY : 0);
    } else {
      player.vel.y = Math.max(player.vel.y - GRAVITY * dt, -40);
      if (jump && player.onGround) player.vel.y = JUMP;
    }

    const ox = player.pos.x, oz = player.pos.z;
    const hitX = moveAxis('x', player.vel.x * dt);
    const hitZ = moveAxis('z', player.vel.z * dt);
    const hitY = moveAxis('y', player.vel.y * dt);
    player.onGround = hitY && player.vel.y < 0;
    if (hitY) player.vel.y = 0;
    player.walk += Math.hypot(player.pos.x - ox, player.pos.z - oz);
    // Pulo automático quando esbarra num degrau de 1 bloco
    if ((hitX || hitZ) && player.onGround && !player.fly && wish.lengthSq() > 0.1) {
      const test = player.pos.clone();
      test.y += 1.05;
      test.addScaledVector(wish, 0.3);
      if (!collides(test)) player.vel.y = JUMP;
    }
    if (player.pos.y < -10) spawn();

    // Segurar o botão continua quebrando/colocando
    if (held.break || held.place) {
      holdTimer -= dt;
      if (holdTimer <= 0) {
        if (held.break) breakBlock(); else placeBlock();
        holdTimer = 0.22;
      }
    }

    if (dirty.size) {
      for (const k of dirty) buildChunk(k % NCX, Math.floor(k / NCX));
      dirty.clear();
    }
  }

  function updateFigure() {
    figure.visible = thirdPerson;
    if (!thirdPerson) return;
    figure.position.copy(player.pos);
    figure.rotation.y = player.yaw;
    head.rotation.x = player.pitch * 0.6;
    const swing = Math.sin(player.walk * 2.2) * 0.7;
    legL.rotation.x = swing; legR.rotation.x = -swing;
    armL.rotation.x = -swing; armR.rotation.x = swing;
  }

  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (playing && !invOpen) update(dt);

    updateTarget();
    updateFigure();

    for (const c of clouds.children) {
      c.position.x += dt * 1.2;
      if (c.position.x > 150) c.position.x -= 200;
    }

    infoTimer -= dt;
    if (infoTimer <= 0) {
      infoTimer = 0.25;
      infoEl.textContent = `X ${player.pos.x.toFixed(0)}  Y ${player.pos.y.toFixed(0)}  Z ${player.pos.z.toFixed(0)}`;
    }

    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // ── Início ────────────────────────────────────────────────
  if (!load()) {
    generate((Math.random() * 1e9) | 0);
    spawn();
  } else {
    playBtn.textContent = 'CONTINUAR';
  }
  buildAll();
  renderHotbar();
  updateArmorLook();
  document.getElementById('b-fly').classList.toggle('on', player.fly);
  requestAnimationFrame(frame);
})();
