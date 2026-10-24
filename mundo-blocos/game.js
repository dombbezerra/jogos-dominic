(() => {
  'use strict';

  // ── Configuração ──────────────────────────────────────────
  const CS = 16, H = 64, SEA = 24;       // chunk de 16x16, altura do mundo, nível do mar
  const SMALL = 6;                        // mundo pequeno: 6x6 chunks (96x96 blocos)
  const RENDER = 4;                       // raio de chunks visíveis no mundo infinito
  const DAY_LEN = 20 * 60;                // um dia inteiro (dia + noite) em segundos
  const LIST_KEY = 'mundo-blocos-worlds', LEGACY_KEY = 'mundo-blocos-save';
  const worldKey = id => 'mundo-blocos-w-' + id;
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const $ = id => document.getElementById(id);

  const AIR = 0, GRASS = 1, DIRT = 2, STONE = 3, SAND = 4, WOOD = 5, LEAVES = 6,
        PLANKS = 7, COBBLE = 8, GLASS = 9, BRICK = 10, BEDROCK = 11,
        SNOW = 12, GOLD = 13, DIAMOND = 14, WOOL_W = 15, WOOL_R = 16, WOOL_B = 17,
        WOOL_Y = 18, WOOL_G = 19, WOOL_K = 20, GRAVEL = 21,
        CRAFT = 22, BOOKS = 23, CHEST = 24, FURNACE = 25, LAMP = 26, DOOR = 27, DOOR_TOP = 28,
        BED = 29, TABLE = 30, CHAIR = 31, TORCH = 32, CARPET = 33, FENCE = 34,
        // 35 a 44 são os tapetes coloridos
        WATER = 45, SANDSTONE = 46, CACTUS = 47, ICE = 48, MYCELIUM = 49, MUSH_STEM = 50,
        MUSH_RED = 51, MUSH_BROWN = 52, SHROOM_RED = 53, SHROOM_BROWN = 54, FLOWER_RED = 55,
        FLOWER_YELLOW = 56, COAL_ORE = 57, IRON_ORE = 58, GOLD_ORE = 59, DIAMOND_ORE = 60;

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

  // Índices das texturas no atlas (16x16 de 16px)
  const ATL = 16;
  const T = {
    grassTop: 0, grassSide: 1, dirt: 2, stone: 3, sand: 4, woodSide: 5, woodTop: 6, leaves: 7,
    planks: 8, cobble: 9, glass: 10, brick: 11, bedrock: 12, snow: 13, gold: 14, diamond: 15,
    woolW: 16, woolR: 17, woolB: 18, woolY: 19, woolG: 20, woolK: 21, gravel: 22, craftTop: 23,
    craftSide: 24, books: 25, chestTop: 26, chestSide: 27, chestFront: 28, furnaceFront: 29,
    furnaceSide: 30, lamp: 31, doorTop: 32, doorBottom: 33, torch: 34, bedTop: 35, bedSide: 36,
    carpet0: 37,   // + 11 cores de tapete (37 a 47)
    water: 48, sandstoneTop: 49, sandstoneSide: 50, cactusSide: 51, cactusTop: 52, ice: 53,
    myceliumTop: 54, myceliumSide: 55, mushStem: 56, mushRed: 57, mushBrown: 58,
    shroomRed: 59, shroomBrown: 60, flowerRed: 61, flowerYellow: 62,
    coalOre: 63, ironOre: 64, goldOre: 65, diamondOre: 66,
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
    flower:   [[7, 0, 7, 9, 8, 9], [6, 8, 6, 10, 12, 10]],
    mushroom: [[7, 0, 7, 9, 4, 9], [5, 4, 5, 11, 7, 11]],
    cactus:   [[1, 0, 1, 15, 16, 15]],
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
    [WATER]:    { name: 'Água', tex: [T.water, T.water, T.water], solid: false },
    [SANDSTONE]: { name: 'Arenito', tex: [T.sandstoneTop, T.sandstoneTop, T.sandstoneSide] },
    [CACTUS]:   { name: 'Cacto', tex: [T.cactusTop, T.cactusTop, T.cactusSide], shape: 'cactus' },
    [ICE]:      { name: 'Gelo', tex: [T.ice, T.ice, T.ice] },
    [MYCELIUM]: { name: 'Micélio', tex: [T.myceliumTop, T.dirt, T.myceliumSide] },
    [MUSH_STEM]: { name: 'Talo de cogumelo', tex: [T.mushStem, T.mushStem, T.mushStem] },
    [MUSH_RED]: { name: 'Cogumelo gigante vermelho', tex: [T.mushRed, T.mushRed, T.mushRed] },
    [MUSH_BROWN]: { name: 'Cogumelo gigante marrom', tex: [T.mushBrown, T.mushBrown, T.mushBrown] },
    [SHROOM_RED]: { name: 'Cogumelo vermelho', tex: [T.mushRed, T.mushRed, T.shroomRed], shape: 'mushroom', solid: false },
    [SHROOM_BROWN]: { name: 'Cogumelo marrom', tex: [T.mushBrown, T.mushBrown, T.shroomBrown], shape: 'mushroom', solid: false },
    [FLOWER_RED]: { name: 'Flor vermelha', tex: [T.woolR, T.woolR, T.flowerRed], shape: 'flower', solid: false },
    [FLOWER_YELLOW]: { name: 'Flor amarela', tex: [T.woolY, T.woolY, T.flowerYellow], shape: 'flower', solid: false },
    [COAL_ORE]: { name: 'Minério de carvão', tex: [T.coalOre, T.coalOre, T.coalOre] },
    [IRON_ORE]: { name: 'Minério de ferro', tex: [T.ironOre, T.ironOre, T.ironOre] },
    [GOLD_ORE]: { name: 'Minério de ouro', tex: [T.goldOre, T.goldOre, T.goldOre] },
    [DIAMOND_ORE]: { name: 'Minério de diamante', tex: [T.diamondOre, T.diamondOre, T.diamondOre] },
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
    { name: 'Blocos', items: [GRASS, DIRT, STONE, COBBLE, SAND, SANDSTONE, GRAVEL, WOOD, PLANKS, LEAVES,
                              GLASS, BRICK, SNOW, ICE, MYCELIUM, GOLD, DIAMOND, COAL_ORE, IRON_ORE, GOLD_ORE,
                              DIAMOND_ORE, WOOL_W, WOOL_R, WOOL_B, WOOL_Y, WOOL_G, WOOL_K] },
    { name: 'Natureza', items: [WATER, FLOWER_RED, FLOWER_YELLOW, SHROOM_RED, SHROOM_BROWN, CACTUS,
                                MUSH_STEM, MUSH_RED, MUSH_BROWN] },
    { name: 'Coisas de casa', items: [CRAFT, BOOKS, CHEST, FURNACE, LAMP, DOOR, BED, TABLE, CHAIR, TORCH, FENCE, ...CARPETS] },
    { name: 'Armadura', armor: true },
  ];

  const isTransparent = id => id === AIR || id === LEAVES || id === GLASS || id === WATER || !!(BLOCKS[id] && BLOCKS[id].shape);
  const isDoor = id => id === DOOR || id === DOOR_TOP;

  // ── Estado do mundo aberto ────────────────────────────────
  let current = null;              // { id, name } do mundo aberto
  let settings = null;             // opções escolhidas ao criar o mundo
  let store = { chunks: {} };      // chunks modificados, já em texto, pra salvar
  let seed = 1;
  let time = 0.05;                 // hora do dia: 0 nascer do sol, .25 meio-dia, .5 pôr do sol, .75 meia-noite
  const chunks = new Map();
  const ckey = (cx, cz) => (cx + 32768) * 65536 + (cz + 32768);
  const inWorld = (cx, cz) => settings.infinite || (cx >= 0 && cz >= 0 && cx < SMALL && cz < SMALL);
  const CI = (lx, y, lz) => lx + lz * CS + y * CS * CS;

  function getBlock(x, y, z) {
    if (y < 0) return BEDROCK;
    if (y >= H) return AIR;
    const c = chunks.get(ckey(x >> 4, z >> 4));
    return c ? c.blocks[CI(x & 15, y, z & 15)] : AIR;
  }
  // Para colisão: fora do mapa (ou chunk ainda não carregado) é parede invisível
  function isSolid(x, y, z) {
    if (y < 0) return true;
    if (y >= H) return false;
    const cx = x >> 4, cz = z >> 4;
    if (!inWorld(cx, cz)) return true;
    const c = chunks.get(ckey(cx, cz));
    if (!c) return true;
    const i = CI(x & 15, y, z & 15), id = c.blocks[i];
    if (id === AIR || BLOCKS[id].solid === false) return false;
    if (isDoor(id) && (c.meta[i] & 4)) return false;
    return true;
  }

  // ── Ruído (sempre o mesmo pra mesma semente) ──────────────
  function hash(a, b, c, salt) {
    let h = Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) + Math.imul(c | 0, 1274126177) +
            Math.imul((seed + salt * 7919) | 0, 1442695041);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }
  const smooth = t => t * t * (3 - 2 * t);
  function noise2(x, z, salt) {
    const ix = Math.floor(x), iz = Math.floor(z);
    const fx = smooth(x - ix), fz = smooth(z - iz);
    const a = hash(ix, iz, 0, salt), b = hash(ix + 1, iz, 0, salt);
    const c = hash(ix, iz + 1, 0, salt), d = hash(ix + 1, iz + 1, 0, salt);
    const top = a + (b - a) * fx;
    return top + ((c + (d - c) * fx) - top) * fz;
  }
  function noise3(x, y, z, salt) {
    const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
    const fx = smooth(x - ix), fy = smooth(y - iy), fz = smooth(z - iz);
    const l = (yy, zz) => {
      const a = hash(ix, yy, zz, salt), b = hash(ix + 1, yy, zz, salt);
      return a + (b - a) * fx;
    };
    const y0 = l(iy, iz) + (l(iy, iz + 1) - l(iy, iz)) * fz;
    const y1 = l(iy + 1, iz) + (l(iy + 1, iz + 1) - l(iy + 1, iz)) * fz;
    return y0 + (y1 - y0) * fy;
  }
  function mulberry32(a) {
    return () => {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  // ── Geração do terreno ────────────────────────────────────
  const BIOME_NAMES = { planicie: 'Planície', floresta: 'Floresta', deserto: 'Deserto', neve: 'Neve', cogumelo: 'Ilha de cogumelos' };

  // Altura do chão e bioma de uma coluna (dá pra perguntar de qualquer lugar, mesmo fora do chunk)
  function colInfo(x, z) {
    const base = noise2(x / 64, z / 64, 1) * 0.55 + noise2(x / 24, z / 24, 2) * 0.3 + noise2(x / 8, z / 8, 3) * 0.15;
    let h = 10 + base * 34;
    const m = noise2(x / 90, z / 90, 4);
    if (m > 0.62) h += (m - 0.62) * 70;   // montanhas
    h = Math.min(H - 12, Math.floor(h));
    const temp = noise2(x / 160, z / 160, 5), wet = noise2(x / 140, z / 140, 6), mush = noise2(x / 220, z / 220, 7);
    let biome;
    if (mush > 0.84) biome = 'cogumelo';
    else if (temp > 0.6 && wet < 0.55) biome = 'deserto';
    else if (temp < 0.36) biome = 'neve';
    else if (wet > 0.55) biome = 'floresta';
    else biome = 'planicie';
    return { h, biome };
  }

  function carve(x, y, z) {
    const a = noise3(x / 22, y / 14, z / 22, 60);
    if (Math.abs(a - 0.5) < 0.04 && Math.abs(noise3(x / 22, y / 14, z / 22, 61) - 0.5) < 0.06) return true;   // túneis
    return y < 30 && noise3(x / 30, y / 18, z / 30, 62) > 0.79;                                             // salões
  }

  function genChunk(cx, cz) {
    const blocks = new Uint8Array(CS * CS * H), meta = new Uint8Array(CS * CS * H);
    const x0 = cx * CS, z0 = cz * CS;
    if (settings.type === 'flat') {
      for (let lz = 0; lz < CS; lz++) for (let lx = 0; lx < CS; lx++) {
        blocks[CI(lx, 0, lz)] = BEDROCK;
        for (let y = 1; y <= 3; y++) blocks[CI(lx, y, lz)] = DIRT;
        blocks[CI(lx, 4, lz)] = GRASS;
      }
      return { blocks, meta };
    }
    const water = settings.water;
    const heights = new Int16Array(CS * CS), biomes = new Array(CS * CS);

    for (let lz = 0; lz < CS; lz++) for (let lx = 0; lx < CS; lx++) {
      const x = x0 + lx, z = z0 + lz;
      const { h, biome } = colInfo(x, z);
      heights[lx + lz * CS] = h; biomes[lx + lz * CS] = biome;
      const under = water && h < SEA;
      const beach = water && h >= SEA - 1 && h <= SEA + 1 && biome !== 'neve' && biome !== 'cogumelo';
      const gravelBed = noise2(x / 6, z / 6, 41) > 0.6;
      for (let y = 0; y <= h; y++) {
        let b;
        if (y === 0) b = BEDROCK;
        else if (y < h - 3) b = biome === 'deserto' && y >= h - 6 ? SANDSTONE : STONE;
        else if (under) b = gravelBed ? GRAVEL : SAND;
        else if (biome === 'deserto' || beach) b = SAND;
        else if (y === h) b = biome === 'neve' ? SNOW : biome === 'cogumelo' ? MYCELIUM : GRASS;
        else b = DIRT;
        if (b === STONE) {
          const r = hash(x, y, z, 50);
          if (r < 0.012 && y < 52) b = COAL_ORE;
          else if (r < 0.019 && y < 40) b = IRON_ORE;
          else if (r < 0.0215 && y < 22) b = GOLD_ORE;
          else if (r < 0.023 && y < 14) b = DIAMOND_ORE;
        }
        blocks[CI(lx, y, lz)] = b;
      }
      if (water) for (let y = h + 1; y <= SEA; y++) blocks[CI(lx, y, lz)] = biome === 'neve' && y === SEA ? ICE : WATER;
      // Cavernas (não abre buraco embaixo d'água)
      if (settings.caves) {
        const top = water && h < SEA + 2 ? h - 4 : h;
        for (let y = 1; y <= top; y++) {
          if (!carve(x, y, z)) continue;
          const i = CI(lx, y, lz);
          if (blocks[i] !== WATER && blocks[i] !== BEDROCK) blocks[i] = AIR;
        }
      }
    }

    // Árvores e cogumelos gigantes: podem atravessar a borda, então olha um pouco além do chunk
    const put = (x, y, z, id, force) => {
      const lx = x - x0, lz = z - z0;
      if (lx < 0 || lz < 0 || lx >= CS || lz >= CS || y < 1 || y >= H) return;
      const i = CI(lx, y, lz);
      if (force ? blocks[i] !== BEDROCK : blocks[i] === AIR) blocks[i] = id;
    };
    for (let z = z0 - 3; z < z0 + CS + 3; z++) for (let x = x0 - 3; x < x0 + CS + 3; x++) {
      const inside = x >= x0 && x < x0 + CS && z >= z0 && z < z0 + CS;
      const info = inside ? { h: heights[(x - x0) + (z - z0) * CS], biome: biomes[(x - x0) + (z - z0) * CS] } : colInfo(x, z);
      const { h, biome } = info;
      if ((water && h < SEA) || h + 10 >= H) continue;
      if (inside && blocks[CI(x - x0, h, z - z0)] === AIR) continue;   // caverna comeu o chão
      const r = hash(x, 0, z, 70);
      if ((biome === 'floresta' && r < 0.04) || (biome === 'planicie' && r < 0.006)) tree(x, h, z, put);
      else if (biome === 'neve' && r < 0.02) spruce(x, h, z, put);
      else if (biome === 'cogumelo' && r < 0.012) bigMushroom(x, h, z, put);
    }

    // Plantinhas, cactos e cogumelos pequenos (só na própria coluna)
    for (let lz = 0; lz < CS; lz++) for (let lx = 0; lx < CS; lx++) {
      const x = x0 + lx, z = z0 + lz, h = heights[lx + lz * CS], biome = biomes[lx + lz * CS];
      if (h + 4 < H) {
        const top = blocks[CI(lx, h, lz)], above = blocks[CI(lx, h + 1, lz)];
        const r = hash(x, 3, z, 80);
        if (above === AIR) {
          if (biome === 'deserto' && top === SAND && r < 0.01) {
            const tall = 1 + Math.floor(hash(x, 4, z, 81) * 3);
            for (let y = 1; y <= tall; y++) put(x, h + y, z, CACTUS);
          } else if (top === GRASS && r < 0.04) {
            put(x, h + 1, z, hash(x, 5, z, 82) < 0.5 ? FLOWER_RED : FLOWER_YELLOW);
          } else if (top === GRASS && biome === 'floresta' && r < 0.046) {
            put(x, h + 1, z, SHROOM_BROWN);
          } else if (top === MYCELIUM && r < 0.05) {
            put(x, h + 1, z, hash(x, 6, z, 83) < 0.5 ? SHROOM_RED : SHROOM_BROWN);
          }
        }
      }
      if (settings.caves) {
        for (let y = 2; y < h - 2; y++) {
          if (blocks[CI(lx, y, lz)] === AIR && blocks[CI(lx, y - 1, lz)] === STONE && hash(x, y, z, 84) < 0.006) {
            blocks[CI(lx, y, lz)] = SHROOM_BROWN;
          }
        }
      }
    }
    return { blocks, meta };
  }

  function tree(x, h, z, put) {
    const top = h + 4 + Math.floor(hash(x, 1, z, 71) * 2);
    for (let y = top - 2; y <= top + 1; y++) {
      const rad = y >= top ? 1 : 2;
      for (let dz = -rad; dz <= rad; dz++) for (let dx = -rad; dx <= rad; dx++) {
        if (Math.abs(dx) === rad && Math.abs(dz) === rad && (y === top + 1 || hash(x + dx, y, z + dz, 73) < 0.5)) continue;
        put(x + dx, y, z + dz, LEAVES);
      }
    }
    for (let y = h + 1; y <= top; y++) put(x, y, z, WOOD, true);
    put(x, h, z, DIRT, true);
  }
  function spruce(x, h, z, put) {
    const top = h + 5 + Math.floor(hash(x, 1, z, 71) * 3);
    const layers = [[top + 1, 0], [top, 1], [top - 1, 1], [top - 2, 2], [top - 3, 1], [top - 4, 2]];
    for (const [y, rad] of layers) for (let dz = -rad; dz <= rad; dz++) for (let dx = -rad; dx <= rad; dx++) {
      if (rad === 2 && Math.abs(dx) === 2 && Math.abs(dz) === 2) continue;
      put(x + dx, y, z + dz, LEAVES);
    }
    for (let y = h + 1; y <= top; y++) put(x, y, z, WOOD, true);
    put(x, h, z, DIRT, true);
  }
  function bigMushroom(x, h, z, put) {
    const top = h + 4 + Math.floor(hash(x, 4, z, 74) * 2);
    if (hash(x, 2, z, 72) < 0.5) {
      for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
        if (Math.abs(dx) === 2 && Math.abs(dz) === 2) continue;
        put(x + dx, top + 1, z + dz, MUSH_RED);
        if (Math.abs(dx) === 2 || Math.abs(dz) === 2) put(x + dx, top, z + dz, MUSH_RED);
      }
    } else {
      for (let dz = -3; dz <= 3; dz++) for (let dx = -3; dx <= 3; dx++) {
        if (Math.abs(dx) === 3 && Math.abs(dz) === 3) continue;
        put(x + dx, top + 1, z + dz, MUSH_BROWN);
      }
    }
    for (let y = h + 1; y <= top; y++) put(x, y, z, MUSH_STEM, true);
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
  function decode(b64, len) {
    const s = atob(b64), w = new Uint8Array(len);
    let p = 0;
    for (let i = 0; i < s.length; i += 2) {
      const v = s.charCodeAt(i), n = s.charCodeAt(i + 1);
      w.fill(v, p, p + n); p += n;
    }
    if (p !== len) throw new Error('save inválido');
    return w;
  }
  function worldList() {
    try { return JSON.parse(localStorage.getItem(LIST_KEY)) || []; } catch (e) { return []; }
  }
  function writeList(list) {
    try { localStorage.setItem(LIST_KEY, JSON.stringify(list)); } catch (e) { /* sem espaço */ }
  }
  function stash(c) {
    store.chunks[c.cx + ',' + c.cz] = { b: encode(c.blocks), m: encode(c.meta) };
    c.saveDirty = false;
  }
  function saveWorld() {
    if (!current) return;
    for (const c of chunks.values()) if (c.saveDirty) stash(c);
    try {
      localStorage.setItem(worldKey(current.id), JSON.stringify({
        v: 3, settings, time, slot, hotbar, armor, chunks: store.chunks,
        p: [player.pos.x, player.pos.y, player.pos.z, player.yaw, player.fly],
      }));
      const list = worldList(), e = list.find(w => w.id === current.id);
      if (e) { e.last = Date.now(); writeList(list); }
    } catch (e) { toast('Sem espaço pra salvar 😕'); }
  }

  // O mundo antigo (de antes da tela inicial) vira um mundo pequeno na lista
  function migrateLegacy() {
    let s;
    try { s = JSON.parse(localStorage.getItem(LEGACY_KEY)); } catch (e) { return; }
    if (!s || !s.data) return;
    try {
      const OW = 96, OH = 48, len = OW * OW * OH;
      const oldB = decode(s.data, len), oldM = s.meta ? decode(s.meta, len) : new Uint8Array(len);
      const saved = {};
      for (let cz = 0; cz < SMALL; cz++) for (let cx = 0; cx < SMALL; cx++) {
        const b = new Uint8Array(CS * CS * H), m = new Uint8Array(CS * CS * H);
        for (let y = 0; y < OH; y++) for (let lz = 0; lz < CS; lz++) for (let lx = 0; lx < CS; lx++) {
          const o = (cx * CS + lx) + (cz * CS + lz) * OW + y * OW * OW;
          b[CI(lx, y, lz)] = oldB[o]; m[CI(lx, y, lz)] = oldM[o];
        }
        saved[cx + ',' + cz] = { b: encode(b), m: encode(m) };
      }
      const id = 'antigo';
      localStorage.setItem(worldKey(id), JSON.stringify({
        v: 3, time: 0.05, slot: s.slot || 0, chunks: saved,
        settings: { type: 'normal', caves: false, water: false, animals: true, daynight: true, infinite: false, seed: s.seed || 1, legacy: true },
        hotbar: s.hotbar || Array(9).fill(null), armor: s.armor || [-1, -1, -1, -1],
        p: [s.p[0], s.p[1], s.p[2], s.p[3], !!s.p[5]],
      }));
      const list = worldList();
      list.push({ id, name: 'Meu primeiro mundo', type: 'normal', last: Date.now() });
      writeList(list);
      localStorage.removeItem(LEGACY_KEY);
    } catch (e) { /* deixa o save antigo quieto se der errado */ }
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
  const tnoise = (x, y) => { seed = 99; return noise2(x / 3 + 50, y / 3 + 50, 0); };

  const grassCol = [95, 159, 53], dirtCol = [134, 96, 67], plankCol = [162, 130, 78], stoneCol = [125, 125, 125];
  const plankPix = (x, y) => {
    const board = Math.floor(y / 4);
    if (y % 4 === 3 || (x === (board % 2 ? 4 : 12))) return vary([110, 86, 50], 0.1);
    return vary(plankCol, 0.12);
  };
  const wool = c => (x, y) => vary(c, (x + y) % 3 === 0 ? 0.2 : 0.1);
  const ore = col => () => trnd() < 0.16 ? vary(col, 0.15) : vary(stoneCol, 0.25);

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
    const n = tnoise(x, y);
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
    if (x < 7 || x > 8 || y < 6) return [0, 0, 0, 0];
    if (y <= 8) return y === 6 ? [255, 230, 120] : [255, 150, 40];
    return [110, 80, 40];
  });
  tile(T.bedTop, (x, y) => (y < 5 && x > 0 && x < 15) ? vary([240, 240, 240], 0.05) : vary([180, 45, 40], 0.1));
  CARPET_COLORS.forEach((c, i) => tile(T.carpet0 + i, wool(c.color)));
  tile(T.bedSide, (x, y) => y < 12 ? vary([180, 45, 40], 0.1) : vary(plankCol, 0.1));
  tile(T.water, () => vary([45, 95, 200], 0.15));
  tile(T.sandstoneTop, () => vary([216, 203, 155], 0.08));
  tile(T.sandstoneSide, (x, y) => y < 3 ? vary([226, 214, 168], 0.06) : y === 3 || y === 10 ? vary([190, 175, 125], 0.06) : vary([216, 203, 155], 0.08));
  tile(T.cactusSide, (x, y) => {
    if (x === 1 || x === 14) return vary([45, 95, 30], 0.1);
    if (x % 4 === 3 && y % 3 === 0) return [230, 225, 190];   // espinhos
    return vary(x % 4 === 1 ? [70, 130, 45] : [85, 150, 55], 0.1);
  });
  tile(T.cactusTop, (x, y) => (x === 1 || x === 14 || y === 1 || y === 14) ? vary([45, 95, 30], 0.1) : vary([95, 160, 60], 0.1));
  tile(T.ice, (x, y) => (x + y) % 7 === 0 ? [215, 235, 255] : vary([150, 190, 240], 0.06));
  tile(T.myceliumTop, () => trnd() < 0.12 ? vary([190, 170, 195], 0.1) : vary([115, 95, 120], 0.2));
  const mycEdge = Array.from({ length: 16 }, () => 2 + Math.floor(trnd() * 3));
  tile(T.myceliumSide, (x, y) => y < mycEdge[x] ? vary([115, 95, 120], 0.2) : vary(dirtCol, 0.35));
  tile(T.mushStem, () => vary([220, 214, 198], 0.06));
  tile(T.mushRed, () => trnd() < 0.12 ? [240, 240, 235] : vary([190, 30, 30], 0.12));
  tile(T.mushBrown, () => vary([145, 108, 80], 0.12));
  const shroom = cap => (x, y) => {
    if (y >= 9 && y <= 11 && x >= 5 && x <= 10) return (cap[0] > 170 && x === 7 && y === 10) ? [245, 245, 240] : cap;
    if (y >= 12 && x >= 7 && x <= 8) return [225, 220, 205];
    return [0, 0, 0, 0];
  };
  tile(T.shroomRed, shroom([200, 35, 35]));
  tile(T.shroomBrown, shroom([150, 110, 80]));
  const flower = (petal, middle) => (x, y) => {
    if (y >= 4 && y <= 7 && x >= 6 && x <= 9) return (y === 5 || y === 6) && (x === 7 || x === 8) ? middle : petal;
    if (y >= 8 && x >= 7 && x <= 8) return [60, 140, 40];
    return [0, 0, 0, 0];
  };
  tile(T.flowerRed, flower([210, 40, 40], [250, 220, 60]));
  tile(T.flowerYellow, flower([250, 215, 50], [230, 140, 30]));
  tile(T.coalOre, ore([35, 35, 35]));
  tile(T.ironOre, ore([215, 175, 140]));
  tile(T.goldOre, ore([250, 220, 70]));
  tile(T.diamondOre, ore([90, 230, 230]));

  // ── Three.js ──────────────────────────────────────────────
  const renderer = new THREE.WebGLRenderer({ antialias: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  const SKY_DAY = new THREE.Color(0x87ceeb), SKY_NIGHT = new THREE.Color(0x0a0e2a), SKY_SUNSET = new THREE.Color(0xf09050);
  const WATER_FOG = new THREE.Color(0x1a3a8a);
  const skyCol = new THREE.Color(0x87ceeb);
  scene.background = skyCol;
  scene.fog = new THREE.Fog(skyCol.getHex(), 35, 80);

  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.05, 240);
  camera.rotation.order = 'YXZ';

  const texture = new THREE.CanvasTexture(atlas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  if ('SRGBColorSpace' in THREE) texture.colorSpace = THREE.SRGBColorSpace;
  else { texture.encoding = THREE.sRGBEncoding; renderer.outputEncoding = THREE.sRGBEncoding; }

  const blockMat = new THREE.MeshBasicMaterial({ map: texture, vertexColors: true, alphaTest: 0.5 });
  const brightMat = new THREE.MeshBasicMaterial({ map: texture, vertexColors: true, alphaTest: 0.5 });   // não escurece à noite
  const waterMat = new THREE.MeshBasicMaterial({
    map: texture, vertexColors: true, transparent: true, opacity: 0.72, depthWrite: false, side: THREE.DoubleSide,
  });

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

  const newBuf = () => ({ pos: [], uv: [], col: [], ind: [] });
  function emitBox(buf, x, y, z, b, def, rot, show) {
    const E = 0.002;
    for (let fi = 0; fi < 6; fi++) {
      const f = FACES[fi];
      if (show && !show(f)) continue;
      let t = f.dir[1] === 1 ? def.tex[0] : f.dir[1] === -1 ? def.tex[1] : def.tex[2];
      if (def.front && f.dir[0] === FRONT[rot][0] && f.dir[2] === FRONT[rot][2]) t = def.front;
      const tx = t % ATL, ty = Math.floor(t / ATL);
      const shade = def.bright ? 1 : f.lin;
      const base = buf.pos.length / 3;
      for (const c of f.corners) {
        const p0 = c[0] ? b[3] : b[0], p1 = c[1] ? b[4] : b[1], p2 = c[2] ? b[5] : b[2];
        buf.pos.push(x + p0 / 16, y + p1 / 16, z + p2 / 16);
        const p = [p0, p1, p2];
        let u = p[f.u[0]] / 16, v = p[f.v[0]] / 16;
        if (f.u[1]) u = 1 - u;
        if (f.v[1]) v = 1 - v;
        u = Math.min(1 - E, Math.max(E, u)); v = Math.min(1 - E, Math.max(E, v));
        buf.uv.push((tx + u) / ATL, 1 - (ty + 1 - v) / ATL);
        buf.col.push(shade, shade, shade);
      }
      buf.ind.push(base, base + 1, base + 2, base + 2, base + 1, base + 3);
    }
  }
  function toGeometry(buf) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(buf.pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(buf.uv, 2));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(buf.col, 3));
    geo.setIndex(buf.ind);
    geo.computeBoundingSphere();
    return geo;
  }

  function buildChunk(c) {
    const bufs = [newBuf(), newBuf(), newBuf()];   // normal, brilhante, água
    const B = c.blocks, M = c.meta, x0 = c.cx * CS, z0 = c.cz * CS;
    const nb = (lx, y, lz) => {
      if (y < 0) return BEDROCK;
      if (y >= H) return AIR;
      if (lx >= 0 && lx < CS && lz >= 0 && lz < CS) return B[CI(lx, y, lz)];
      return getBlock(x0 + lx, y, z0 + lz);
    };
    for (let y = 0; y < H; y++) for (let lz = 0; lz < CS; lz++) for (let lx = 0; lx < CS; lx++) {
      const i = CI(lx, y, lz), id = B[i];
      if (id === AIR) continue;
      const def = BLOCKS[id], x = x0 + lx, z = z0 + lz;
      if (id === WATER) {
        const top = nb(lx, y + 1, lz) === WATER ? 16 : 14;
        emitBox(bufs[2], x, y, z, [0, 0, 0, 16, top, 16], def, 0, f => {
          const n = nb(lx + f.dir[0], y + f.dir[1], lz + f.dir[2]);
          return n === AIR || (isTransparent(n) && n !== WATER);
        });
        continue;
      }
      const buf = def.bright ? bufs[1] : bufs[0];
      const m = M[i], rot = m & 3;
      if (def.shape) {
        const shape = isDoor(id) && (m & 4) ? SHAPES.doorOpen : SHAPES[def.shape];
        for (const b of shape) emitBox(buf, x, y, z, rotBox(b, rot), def, rot, null);
      } else {
        emitBox(buf, x, y, z, CUBE[0], def, rot, f => {
          const n = nb(lx + f.dir[0], y + f.dir[1], lz + f.dir[2]);
          return n === AIR || (isTransparent(n) && (n !== id || id === LEAVES));
        });
      }
    }
    const mats = [blockMat, brightMat, waterMat];
    if (!c.meshes) {
      c.meshes = bufs.map((b, k) => {
        const mesh = new THREE.Mesh(toGeometry(b), mats[k]);
        if (k === 2) mesh.renderOrder = 1;
        scene.add(mesh);
        return mesh;
      });
    } else {
      c.meshes.forEach((mesh, k) => { mesh.geometry.dispose(); mesh.geometry = toGeometry(bufs[k]); });
    }
    c.needsMesh = false;
  }
  function disposeMeshes(c) {
    if (!c.meshes) return;
    for (const m of c.meshes) { scene.remove(m); m.geometry.dispose(); }
    c.meshes = null;
    c.needsMesh = true;
  }

  // ── Carregar chunks em volta do jogador ───────────────────
  function loadChunk(cx, cz) {
    const saved = store.chunks[cx + ',' + cz];
    let data = null;
    if (saved) {
      try { data = { blocks: decode(saved.b, CS * CS * H), meta: decode(saved.m, CS * CS * H) }; } catch (e) { data = null; }
    }
    const modified = !!data;
    if (!data) data = genChunk(cx, cz);
    const c = { cx, cz, blocks: data.blocks, meta: data.meta, modified, saveDirty: false, meshes: null, needsMesh: true };
    chunks.set(ckey(cx, cz), c);
    return c;
  }
  function neighborsReady(cx, cz) {
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = cx + dx, nz = cz + dz;
      if (inWorld(nx, nz) && !chunks.has(ckey(nx, nz))) return false;
    }
    return true;
  }
  // Lista de chunks pra carregar, do mais perto pro mais longe
  function chunkPlan(genR, meshR) {
    const pcx = Math.floor(player.pos.x / CS), pcz = Math.floor(player.pos.z / CS);
    const gen = [], mesh = [];
    const R = Math.ceil(genR);
    const range = settings.infinite
      ? { x0: pcx - R, x1: pcx + R, z0: pcz - R, z1: pcz + R }
      : { x0: 0, x1: SMALL - 1, z0: 0, z1: SMALL - 1 };
    for (let cz = range.z0; cz <= range.z1; cz++) for (let cx = range.x0; cx <= range.x1; cx++) {
      const d2 = (cx - pcx) ** 2 + (cz - pcz) ** 2;
      if (!settings.infinite || d2 <= genR * genR) gen.push([cx, cz, d2]);
      if (!settings.infinite || d2 <= meshR * meshR) mesh.push([cx, cz, d2]);
    }
    gen.sort((a, b) => a[2] - b[2]);
    mesh.sort((a, b) => a[2] - b[2]);
    return { gen, mesh };
  }
  let unloadTimer = 0;
  function streamChunks(genBudget, meshBudget, dt) {
    const plan = chunkPlan(RENDER + 1.5, RENDER + 0.5);
    for (const [cx, cz] of plan.gen) {
      if (genBudget <= 0) break;
      if (!chunks.has(ckey(cx, cz))) { loadChunk(cx, cz); genBudget--; }
    }
    for (const [cx, cz] of plan.mesh) {
      if (meshBudget <= 0) break;
      const c = chunks.get(ckey(cx, cz));
      if (c && c.needsMesh && neighborsReady(cx, cz)) { buildChunk(c); meshBudget--; }
    }
    // Longe demais: tira da memória (guardando o que foi mudado)
    unloadTimer -= dt;
    if (settings.infinite && unloadTimer <= 0) {
      unloadTimer = 1;
      const pcx = Math.floor(player.pos.x / CS), pcz = Math.floor(player.pos.z / CS);
      for (const [k, c] of chunks) {
        const d2 = (c.cx - pcx) ** 2 + (c.cz - pcz) ** 2;
        if (d2 > (RENDER + 3) ** 2) {
          if (c.saveDirty) stash(c);
          disposeMeshes(c);
          chunks.delete(k);
        } else if (d2 > (RENDER + 1.5) ** 2 && c.meshes) {
          disposeMeshes(c);
        }
      }
    }
  }

  const remesh = new Set();
  function setBlock(x, y, z, id, m = 0) {
    if (y < 0 || y >= H || !inWorld(x >> 4, z >> 4)) return;
    const c = chunks.get(ckey(x >> 4, z >> 4));
    if (!c) return;
    const i = CI(x & 15, y, z & 15);
    c.blocks[i] = id;
    c.meta[i] = m;
    c.modified = c.saveDirty = true;
    remesh.add(c);
    // Na borda, o chunk vizinho também precisa refazer as faces
    const lx = x & 15, lz = z & 15;
    const near = [];
    if (lx === 0) near.push([-1, 0]);
    if (lx === 15) near.push([1, 0]);
    if (lz === 0) near.push([0, -1]);
    if (lz === 15) near.push([0, 1]);
    for (const [dx, dz] of near) {
      const n = chunks.get(ckey(c.cx + dx, c.cz + dz));
      if (n && n.meshes) remesh.add(n);
    }
    saveSoon();
  }

  // Contorno do bloco que você está mirando
  const highlight = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(1.004, 1.004, 1.004)),
    new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.6 })
  );
  highlight.visible = false;
  scene.add(highlight);

  // Nuvens (acompanham o jogador)
  const clouds = new THREE.Group();
  const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, fog: false });
  const crnd = mulberry32(777);
  for (let i = 0; i < 22; i++) {
    const c = new THREE.Mesh(new THREE.BoxGeometry(6 + crnd() * 12, 1.5, 5 + crnd() * 10), cloudMat);
    c.position.set(crnd() * 220 - 110, H + 12 + crnd() * 4, crnd() * 220 - 110);
    clouds.add(c);
  }
  scene.add(clouds);

  // Sol, lua e estrelas
  const sky = new THREE.Group();
  const sun = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), new THREE.MeshBasicMaterial({ color: 0xfff2a0, fog: false }));
  const moon = new THREE.Mesh(new THREE.PlaneGeometry(11, 11), new THREE.MeshBasicMaterial({ color: 0xe8ecf4, fog: false }));
  const starGeo = new THREE.BufferGeometry();
  const starPos = [];
  const srnd = mulberry32(4242);
  for (let i = 0; i < 400; i++) {
    const a = srnd() * Math.PI * 2, b = Math.acos(srnd() * 2 - 1);
    starPos.push(Math.sin(b) * Math.cos(a) * 180, Math.abs(Math.cos(b)) * 180, Math.sin(b) * Math.sin(a) * 180);
  }
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
  const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false });
  sky.add(sun, moon, new THREE.Points(starGeo, starMat));
  scene.add(sky);

  // Materiais que escurecem à noite (bichos, boneco)
  const litMats = new Set();
  function litMat(color) {
    const m = new THREE.MeshBasicMaterial({ color });
    m.userData.base = m.color.clone();
    litMats.add(m);
    return m;
  }

  // ── Jogador ───────────────────────────────────────────────
  const PW = 0.3, PH = 1.8, EYE = 1.62, EPS = 1e-4;
  const GRAVITY = 28, JUMP = 8.6, WALK = 4.6, RUN = 7, FLY = 11;
  const player = {
    pos: new THREE.Vector3(), vel: new THREE.Vector3(), hw: PW, hh: PH,
    yaw: 0, pitch: 0, onGround: false, fly: false, walk: 0,
  };
  let hotbar = Array(9).fill(null);   // começa vazia: você escolhe no inventário
  let armor = [-1, -1, -1, -1];      // material de cada peça (-1 = nada)
  let slot = 0;
  let thirdPerson = false;
  let light = 1;                     // 1 de dia, mais escuro de noite

  function collides(p, hw, hh) {
    const x0 = Math.floor(p.x - hw + EPS), x1 = Math.floor(p.x + hw - EPS);
    const y0 = Math.floor(p.y + EPS), y1 = Math.floor(p.y + hh - EPS);
    const z0 = Math.floor(p.z - hw + EPS), z1 = Math.floor(p.z + hw - EPS);
    for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
      if (isSolid(x, y, z)) return true;
    }
    return false;
  }
  // Move num eixo; se bater, chega o mais perto possível e retorna true
  function moveBody(body, axis, amount) {
    if (amount === 0) return false;
    const steps = Math.ceil(Math.abs(amount) / 0.25);
    const d = amount / steps;
    for (let i = 0; i < steps; i++) {
      body.pos[axis] += d;
      if (collides(body.pos, body.hw, body.hh)) {
        body.pos[axis] -= d;
        let dd = d;
        for (let k = 0; k < 6; k++) {
          dd /= 2;
          body.pos[axis] += dd;
          if (collides(body.pos, body.hw, body.hh)) body.pos[axis] -= dd;
        }
        return true;
      }
    }
    return false;
  }

  // Onde nascer: uma coluna de terra firme perto do centro
  function findSpawnXZ() {
    if (settings.type === 'flat') return settings.infinite ? [8.5, 8.5] : [48.5, 48.5];
    const bx = settings.infinite ? 8 : 48, bz = bx;
    for (let r = 0; r < 600; r += 6) {
      for (let k = 0; k < 16; k++) {
        const a = k / 16 * Math.PI * 2;
        const x = Math.floor(bx + Math.cos(a) * r), z = Math.floor(bz + Math.sin(a) * r);
        if (!settings.infinite && (x < 2 || z < 2 || x > SMALL * CS - 3 || z > SMALL * CS - 3)) continue;
        if (!settings.water || colInfo(x, z).h > SEA) return [x + 0.5, z + 0.5];
      }
    }
    return [bx + 0.5, bz + 0.5];
  }
  // Põe o jogador em cima do chão da coluna onde ele está
  function dropToGround() {
    const x = Math.floor(player.pos.x), z = Math.floor(player.pos.z);
    let y = H - 1;
    while (y > 0 && getBlock(x, y, z) === AIR) y--;
    player.pos.y = y + 1;
    let n = 0;
    while (collides(player.pos, PW, PH) && n++ < 40) player.pos.y += 1;
    player.vel.set(0, 0, 0);
  }
  function respawn() {
    const [x, z] = findSpawnXZ();
    player.pos.set(x, H, z);
    if (chunks.has(ckey(Math.floor(x) >> 4, Math.floor(z) >> 4))) dropToGround();
  }

  // ── Boneco (aparece na câmera de trás, com a armadura) ────
  const SKIN = 0xe0ad87, SHIRT = 0x1fa7a7, PANTS = 0x3c3ca0, SHOES = 0x4a4a4a, HAIR = 0x5a3a20;
  const figure = new THREE.Group();
  const figBox = (w, h, d, color) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), litMat(color));
  // Membros giram pelo topo: o pivô fica no ombro / quadril
  function limb(w, h, d, color, x, y) {
    const pivot = new THREE.Group();
    pivot.position.set(x, y, 0);
    const m = figBox(w, h, d, color);
    m.position.y = -h / 2;
    pivot.add(m);
    figure.add(pivot);
    return pivot;
  }
  const S = PH / 32;   // 1 "pixel" do boneco (32 pixels de altura)
  const head = figBox(8 * S, 8 * S, 8 * S, SKIN); head.position.y = 28 * S; figure.add(head);
  const hair = figBox(8.4 * S, 2 * S, 8.4 * S, HAIR); hair.position.y = 31.2 * S; figure.add(hair);
  const body = figBox(8 * S, 12 * S, 4 * S, SHIRT); body.position.y = 18 * S; figure.add(body);
  const armL = limb(4 * S, 12 * S, 4 * S, SKIN, -6 * S, 24 * S);
  const armR = limb(4 * S, 12 * S, 4 * S, SKIN, 6 * S, 24 * S);
  const legL = limb(4 * S, 12 * S, 4 * S, PANTS, -2 * S, 12 * S);
  const legR = limb(4 * S, 12 * S, 4 * S, PANTS, 2 * S, 12 * S);
  for (const leg of [legL, legR]) {
    const shoe = figBox(4.1 * S, 2 * S, 4.1 * S, SHOES); shoe.position.y = -11 * S; leg.add(shoe);
  }
  for (const arm of [armL, armR]) {
    const sleeve = figBox(4.1 * S, 4 * S, 4.1 * S, SHIRT); sleeve.position.y = -2 * S; arm.add(sleeve);
  }
  // Peças de armadura (um pouco maiores que o corpo)
  const armorMeshes = [[], [], [], []];
  function armorBox(piece, parent, w, h, d, y) {
    const m = figBox(w * S, h * S, d * S, 0xffffff);
    m.position.y = y * S;
    parent.add(m);
    armorMeshes[piece].push(m);
  }
  armorBox(0, figure, 9, 5, 9, 30);           // capacete
  armorBox(0, figure, 9, 4, 1, 26);           // parte de trás do capacete
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
        if (mat) m.material.userData.base.setRGB(mat.color[0] / 255, mat.color[1] / 255, mat.color[2] / 255).convertSRGBToLinear();
      }
    });
    drawPreview();
  }

  // ── Bichos ────────────────────────────────────────────────
  const mobs = [];
  // Monta um bicho de 4 (ou 2) patas. A frente do bicho aponta pra +z
  function quad(o) {
    const g = new THREE.Group(), mats = [];
    const part = (w, h, d, color) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), litMat(color));
      mats.push(m.material);
      return m;
    };
    const [bw, bh, bl, bc] = o.body, [lw, lh, lc] = o.leg, [hw, hh, hl, hc] = o.head;
    const body = part(bw, bh, bl, bc); body.position.y = lh + bh / 2; g.add(body);
    const head = part(hw, hh, hl, hc); head.position.set(0, lh + bh * 0.85, bl / 2 + hl / 2 - 0.05); g.add(head);
    const eyeY = hh * 0.15, eyeZ = hl / 2 + 0.005;
    for (const sx of [-1, 1]) { const e = part(0.06, 0.06, 0.01, 0x1a1a1a); e.position.set(sx * hw * 0.28, eyeY, eyeZ); head.add(e); }
    const legs = [];
    const spots = o.twoLegs ? [[-1, 0], [1, 0]] : [[-1, 1], [1, 1], [-1, -1], [1, -1]];
    for (const [sx, sz] of spots) {
      const pivot = new THREE.Group();
      pivot.position.set(sx * (bw / 2 - lw / 2 - (o.twoLegs ? 0.05 : 0)), lh, sz * (bl / 2 - lw / 2));
      const leg = part(lw, lh, lw, lc); leg.position.y = -lh / 2;
      pivot.add(leg); g.add(pivot); legs.push(pivot);
    }
    if (o.extra) o.extra({ body, head, part, g });
    return { group: g, legs, mats, wings: [] };
  }
  const MOBS = {
    porco: { name: 'Porco', hw: 0.35, hh: 0.9, hp: 3, speed: 1.2, build: () => quad({
      body: [0.6, 0.5, 0.85, 0xf2a4a4], head: [0.5, 0.48, 0.45, 0xf2a4a4], leg: [0.18, 0.3, 0xe28e8e],
      extra: ({ head, part }) => { const s = part(0.24, 0.16, 0.06, 0xd77a7a); s.position.set(0, -0.08, 0.24); head.add(s); },
    }) },
    vaca: { name: 'Vaca', hw: 0.45, hh: 1.35, hp: 4, speed: 1.0, build: () => quad({
      body: [0.75, 0.65, 1.05, 0x5a3b25], head: [0.5, 0.45, 0.35, 0x5a3b25], leg: [0.22, 0.6, 0x4a3020],
      extra: ({ body, head, part }) => {
        const p = part(0.77, 0.3, 0.4, 0xeeeeee); p.position.set(0, 0.05, 0.1); body.add(p);
        for (const sx of [-1, 1]) { const h = part(0.08, 0.12, 0.08, 0xddd8c8); h.position.set(sx * 0.2, 0.26, 0); head.add(h); }
        const s = part(0.3, 0.15, 0.05, 0xd9b39b); s.position.set(0, -0.12, 0.18); head.add(s);
      },
    }) },
    coguvaca: { name: 'Vaca-cogumelo', hw: 0.45, hh: 1.35, hp: 4, speed: 1.0, build: () => quad({
      body: [0.75, 0.65, 1.05, 0xb02a20], head: [0.5, 0.45, 0.35, 0xb02a20], leg: [0.22, 0.6, 0xc9c0b0],
      extra: ({ body, head, part }) => {
        const p = part(0.77, 0.25, 0.35, 0xe8e0d8); p.position.set(0, -0.1, -0.2); body.add(p);
        for (const [x, z] of [[-0.15, 0.25], [0.18, -0.2], [0, 0]]) { const m = part(0.2, 0.12, 0.2, 0xd03030); m.position.set(x, 0.38, z); body.add(m); }
        const s = part(0.3, 0.15, 0.05, 0xd9b39b); s.position.set(0, -0.12, 0.18); head.add(s);
      },
    }) },
    ovelha: { name: 'Ovelha', hw: 0.45, hh: 1.25, hp: 3, speed: 1.0, build: () => quad({
      body: [0.75, 0.65, 0.95, 0xeeeeee], head: [0.4, 0.4, 0.4, 0xc9b9a6], leg: [0.18, 0.5, 0xc9b9a6],
      extra: ({ head, part }) => { const w = part(0.44, 0.18, 0.32, 0xeeeeee); w.position.set(0, 0.16, -0.06); head.add(w); },
    }) },
    galinha: { name: 'Galinha', hw: 0.2, hh: 0.75, hp: 2, speed: 1.4, build: () => quad({
      body: [0.35, 0.35, 0.45, 0xf5f5f5], head: [0.25, 0.32, 0.2, 0xf5f5f5], leg: [0.06, 0.3, 0xe8b030], twoLegs: true,
      extra: ({ body, head, part }) => {
        const b = part(0.14, 0.08, 0.1, 0xf0a020); b.position.set(0, 0.02, 0.14); head.add(b);
        const w = part(0.08, 0.1, 0.05, 0xd02020); w.position.set(0, -0.08, 0.12); head.add(w);
        for (const sx of [-1, 1]) { const wing = part(0.05, 0.22, 0.32, 0xe8e8e8); wing.position.set(sx * 0.2, 0, 0); body.add(wing); }
      },
    }) },
    morcego: { name: 'Morcego', hw: 0.2, hh: 0.45, hp: 1, speed: 3, fly: true, build: () => {
      const g = new THREE.Group(), mats = [];
      const part = (w, h, d, color) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), litMat(color)); mats.push(m.material); return m; };
      const b = part(0.22, 0.28, 0.2, 0x4a3a2a); b.position.y = 0.2; g.add(b);
      const h = part(0.22, 0.2, 0.2, 0x3a2a1a); h.position.y = 0.42; g.add(h);
      for (const sx of [-1, 1]) { const e = part(0.05, 0.08, 0.04, 0x3a2a1a); e.position.set(sx * 0.07, 0.56, 0); g.add(e); }
      const wings = [];
      for (const sx of [-1, 1]) {
        const pivot = new THREE.Group(); pivot.position.set(sx * 0.1, 0.28, 0);
        const w = part(0.45, 0.03, 0.3, 0x2a1e14); w.position.x = sx * 0.225;
        pivot.add(w); g.add(pivot); wings.push(pivot);
      }
      return { group: g, legs: [], mats, wings };
    } },
  };

  function spawnMob(type, x, y, z) {
    const def = MOBS[type], model = def.build();
    const m = {
      type, ...model, pos: new THREE.Vector3(x, y, z), vel: new THREE.Vector3(), knock: new THREE.Vector3(),
      hw: def.hw, hh: def.hh, hp: def.hp, yaw: Math.random() * Math.PI * 2,
      timer: Math.random() * 2, walking: false, walk: 0, hurt: 0, flee: 0, onGround: false,
    };
    m.group.position.copy(m.pos);
    scene.add(m.group);
    mobs.push(m);
  }
  function removeMob(i) {
    const m = mobs[i];
    scene.remove(m.group);
    m.group.traverse(o => { if (o.geometry) o.geometry.dispose(); });
    for (const mat of m.mats) { litMats.delete(mat); mat.dispose(); }
    mobs.splice(i, 1);
  }
  function clearMobs() { while (mobs.length) removeMob(mobs.length - 1); }

  let spawnTimer = 0;
  function trySpawn() {
    const land = mobs.filter(m => !MOBS[m.type].fly).length, bats = mobs.length - land;
    if (land < 12) {
      const a = Math.random() * Math.PI * 2, d = 14 + Math.random() * 26;
      const x = Math.floor(player.pos.x + Math.cos(a) * d), z = Math.floor(player.pos.z + Math.sin(a) * d);
      if (inWorld(x >> 4, z >> 4) && chunks.has(ckey(x >> 4, z >> 4))) {
        let y = H - 1;
        while (y > 0 && getBlock(x, y, z) === AIR) y--;
        const top = getBlock(x, y, z);
        if ((top === GRASS || top === MYCELIUM) && getBlock(x, y + 1, z) === AIR && getBlock(x, y + 2, z) === AIR) {
          const types = ['porco', 'vaca', 'ovelha', 'galinha'];
          const type = top === MYCELIUM ? 'coguvaca' : types[Math.floor(Math.random() * types.length)];
          spawnMob(type, x + 0.5, y + 1, z + 0.5);
        }
      }
    }
    // Morcegos: só em lugares fechados, embaixo da terra
    if (bats < 4 && settings.type !== 'flat') {
      const a = Math.random() * Math.PI * 2, d = 6 + Math.random() * 20;
      const x = Math.floor(player.pos.x + Math.cos(a) * d), z = Math.floor(player.pos.z + Math.sin(a) * d);
      const y = 3 + Math.floor(Math.random() * 25);
      if (chunks.has(ckey(x >> 4, z >> 4)) && getBlock(x, y, z) === AIR && getBlock(x, y + 1, z) === AIR) {
        let roof = false;
        for (let yy = y + 2; yy < y + 8; yy++) if (isSolid(x, yy, z)) { roof = true; break; }
        if (roof && colInfo(x, z).h > y + 5) spawnMob('morcego', x + 0.5, y + 0.2, z + 0.5);
      }
    }
  }

  function updateMobs(dt) {
    spawnTimer -= dt;
    if (settings.animals && spawnTimer <= 0) { spawnTimer = 1.5; trySpawn(); }
    for (let i = mobs.length - 1; i >= 0; i--) {
      const m = mobs[i], def = MOBS[m.type];
      const dx = m.pos.x - player.pos.x, dz = m.pos.z - player.pos.z;
      if (dx * dx + dz * dz > 75 * 75 || !chunks.has(ckey(Math.floor(m.pos.x) >> 4, Math.floor(m.pos.z) >> 4))) { removeMob(i); continue; }
      m.timer -= dt; m.hurt = Math.max(0, m.hurt - dt); m.flee -= dt;
      if (def.fly) {
        if (m.timer <= 0) {
          m.timer = 0.6 + Math.random();
          m.vel.set(Math.random() - 0.5, (Math.random() - 0.5) * 0.8, Math.random() - 0.5).normalize().multiplyScalar(def.speed);
          m.yaw = Math.atan2(m.vel.x, m.vel.z);
        }
        for (const ax of ['x', 'y', 'z']) if (moveBody(m, ax, (m.vel[ax] + m.knock[ax]) * dt)) m.vel[ax] *= -1;
        const flap = Math.sin(performance.now() / 50) * 0.9;
        m.wings[0].rotation.z = flap; m.wings[1].rotation.z = -flap;
      } else {
        if (m.timer <= 0) {
          m.timer = 2 + Math.random() * 4;
          m.walking = Math.random() < 0.6;
          m.yaw = Math.random() * Math.PI * 2;
        }
        const sp = m.flee > 0 ? def.speed * 2.5 : m.walking ? def.speed : 0;
        m.vel.x = Math.sin(m.yaw) * sp;
        m.vel.z = Math.cos(m.yaw) * sp;
        const inWater = getBlock(Math.floor(m.pos.x), Math.floor(m.pos.y + 0.3), Math.floor(m.pos.z)) === WATER;
        m.vel.y = inWater ? Math.min(m.vel.y + 14 * dt, 2) : Math.max(m.vel.y - GRAVITY * dt, -30);
        const hx = moveBody(m, 'x', (m.vel.x + m.knock.x) * dt);
        const hz = moveBody(m, 'z', (m.vel.z + m.knock.z) * dt);
        const hy = moveBody(m, 'y', m.vel.y * dt);
        m.onGround = hy && m.vel.y < 0;
        if (hy) m.vel.y = 0;
        if ((hx || hz) && m.onGround) m.vel.y = 7.5;   // pula degraus
        m.walk += sp * dt;
        const swing = sp > 0 ? Math.sin(m.walk * 5) * 0.6 : 0;
        m.legs.forEach((leg, k) => { leg.rotation.x = (k % 2 === (k < 2 ? 0 : 1) ? swing : -swing); });
      }
      m.knock.multiplyScalar(Math.pow(0.03, dt));
      m.group.position.copy(m.pos);
      m.group.rotation.y = m.yaw;
    }
  }
  // Bicho machucado fica vermelho por um instante
  const HURT = new THREE.Color(1, 0.1, 0.1);
  function tintMobs() {
    for (const m of mobs) if (m.hurt > 0) for (const mat of m.mats) mat.color.lerp(HURT, 0.6);
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
      if (y >= 0 && y < H) {
        const b = getBlock(x, y, z);
        if (b !== AIR && b !== WATER) return { x, y, z, nx, ny, nz, t };
      }
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
      for (let d = 0.2; d <= 4; d += 0.1) {
        const px = eye.x - lookDir.x * d, py = eye.y - lookDir.y * d, pz = eye.z - lookDir.z * d;
        if (py < H && isSolid(Math.floor(px), Math.floor(py), Math.floor(pz))) break;
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

  // Bater num bicho: ele fica vermelho, pula pra trás e foge
  function hitMob() {
    if (!mobs.length) return false;
    ray.set(camera.position, lookDir);
    ray.far = 7 + camDist;
    const hits = ray.intersectObjects(mobs.map(m => m.group), true);
    if (!hits.length || (target && hits[0].distance > target.t + 0.3)) return false;
    let o = hits[0].object;
    const i = mobs.findIndex(m => { let p = o; while (p) { if (p === m.group) return true; p = p.parent; } return false; });
    if (i < 0) return false;
    const m = mobs[i], def = MOBS[m.type];
    m.hp--; m.hurt = 0.35; m.flee = 3;
    const away = new THREE.Vector3(m.pos.x - player.pos.x, 0, m.pos.z - player.pos.z).normalize();
    m.knock.copy(away).multiplyScalar(6);
    m.yaw = Math.atan2(away.x, away.z);
    if (!def.fly) m.vel.y = 5;
    if (m.hp <= 0) { removeMob(i); toast(`${def.name} sumiu! 💨`); }
    return true;
  }

  function breakBlock() {
    updateTarget();
    if (hitMob()) return;
    if (!target) return;
    const { x, y, z } = target, id = getBlock(x, y, z);
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
  const canFill = (x, y, z) => y >= 0 && y < H && inWorld(x >> 4, z >> 4) && (getBlock(x, y, z) === AIR || getBlock(x, y, z) === WATER);
  function placeBlock() {
    updateTarget();
    if (!target) return;
    const hit = getBlock(target.x, target.y, target.z);
    // Clicar numa porta abre/fecha em vez de colocar bloco
    if (isDoor(hit)) {
      const by = hit === DOOR_TOP ? target.y - 1 : target.y;
      for (const yy of [by, by + 1]) {
        if (!isDoor(getBlock(target.x, yy, target.z))) continue;
        const c = chunks.get(ckey(target.x >> 4, target.z >> 4));
        c.meta[CI(target.x & 15, yy, target.z & 15)] ^= 4;
        c.modified = c.saveDirty = true;
        remesh.add(c);
      }
      saveSoon();
      return;
    }
    const id = hotbar[slot];
    if (id == null) { toast('Escolha um bloco no 🎒'); return; }
    const x = target.x + target.nx, y = target.y + target.ny, z = target.z + target.nz;
    if (!canFill(x, y, z)) return;
    if (BLOCKS[id].solid !== false && blocksPlayer(x, y, z)) return;
    const m = facingMeta();
    if (id === DOOR) {
      if (!canFill(x, y + 1, z) || blocksPlayer(x, y + 1, z)) return;
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
    [WATER]: g => { g('#7a7a80', 3, 4, 10, 11); g('#2d5fc8', 4, 6, 8, 8); g('#5a5a60', 2, 3, 12, 2); },
  };
  // Plantas usam o próprio desenho da textura como ícone
  const SPRITE_ICONS = { [FLOWER_RED]: T.flowerRed, [FLOWER_YELLOW]: T.flowerYellow, [SHROOM_RED]: T.shroomRed, [SHROOM_BROWN]: T.shroomBrown };
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
    let t = BLOCKS[id].front != null ? BLOCKS[id].front : BLOCKS[id].tex[2];
    let oy = 0;
    if (SPRITE_ICONS[id] != null) { t = SPRITE_ICONS[id]; oy = id === SHROOM_RED || id === SHROOM_BROWN ? -4 : 0; }
    g.drawImage(atlas, (t % ATL) * 16, Math.floor(t / ATL) * 16, 16, 16, 0, oy, 16, 16);
    return c;
  }

  // ── HUD ───────────────────────────────────────────────────
  const hotbarEl = $('hotbar'), toastEl = $('toast'), infoEl = $('info');
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
  // O último espaço abre o inventário
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
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 1100);
  }
  function selectSlot(i) {
    slot = (i + 9) % 9;
    renderHotbar();
    toast(hotbar[slot] != null ? BLOCKS[hotbar[slot]].name : 'Vazio');
  }
  function setFly(on) {
    player.fly = on;
    player.vel.y = 0;
    $('b-fly').classList.toggle('on', on);
    toast(on ? 'Voando 🕊' : 'Andando');
  }
  function toggleCamera() {
    thirdPerson = !thirdPerson;
    $('b-cam').classList.toggle('on', thirdPerson);
    toast(thirdPerson ? 'Câmera de trás' : 'Câmera normal');
  }

  // ── Inventário (modo criativo) ────────────────────────────
  const invEl = $('inv'), invGrid = $('inv-grid'), invTabs = $('inv-tabs'), invName = $('inv-name');
  const armorSide = $('inv-armor'), armorSlotsEl = $('armor-slots'), previewEl = $('preview');
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
      for (const id of cat.items) invGrid.appendChild(itemButton({ id }, BLOCKS[id].name, () => giveItem(id)));
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
  $('inv-close').addEventListener('click', () => toggleInventory(false));
  $('inv-clear').addEventListener('click', () => {
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

  // ── Telas: título, mundos, criar, carregando, pausa ───────
  const SCREENS = ['title', 'worlds', 'create', 'loading', 'pause'];
  function showScreen(name) {
    for (const s of SCREENS) $('scr-' + s).classList.toggle('hidden', s !== name);
    document.body.classList.toggle('playing', !name);
  }
  // Fundo de terra, igual às telas do Minecraft
  (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 16;
    const g = c.getContext('2d');
    g.drawImage(atlas, (T.dirt % ATL) * 16, Math.floor(T.dirt / ATL) * 16, 16, 16, 0, 0, 16, 16);
    g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(0, 0, 16, 16);
    document.documentElement.style.setProperty('--dirt', `url(${c.toDataURL()})`);
  })();

  const controlsHTML = isTouch
    ? '<b>Joystick</b> anda · <b>arrastar</b> a tela olha<br><b>⛏</b> quebra · <b>🧱</b> coloca · <b>⬆</b> pula · <b>🕊</b> voa · <b>👁</b> câmera<br>Toque no <b>🎒</b> pra escolher blocos e armaduras'
    : '<b>← →</b> giram a tela · <b>↑ ↓</b> ou <b>W S</b> anda · <b>A D</b> anda de lado<br><b>Q E</b> olham pra cima e pra baixo · <b>Espaço</b> pula (e nada) · <b>Shift</b> corre<br><b>Clique esquerdo</b> quebra (e bate nos bichos) · <b>Clique direito</b> coloca<br><b>🎒</b> ou <b>I</b> abre os blocos · <b>1-9</b> escolhe · <b>F</b> voa · <b>V</b> câmera de trás<br><b>P</b> ou <b>Esc</b> pausa';
  document.querySelectorAll('.controls').forEach(el => { el.innerHTML = controlsHTML; });
  if (isTouch) document.body.classList.add('touch');
  else document.body.classList.add('mouse');

  // Lista de mundos
  let selectedWorld = null;
  function renderWorlds() {
    const list = worldList().sort((a, b) => (b.last || 0) - (a.last || 0));
    const el = $('world-list');
    el.innerHTML = '';
    if (!list.length) el.innerHTML = '<div class="empty">Nenhum mundo ainda. Crie um!</div>';
    if (!list.find(w => w.id === selectedWorld)) selectedWorld = list.length ? list[0].id : null;
    for (const w of list) {
      const d = document.createElement('div');
      d.className = 'world' + (w.id === selectedWorld ? ' sel' : '');
      const when = w.last ? new Date(w.last).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '';
      d.innerHTML = `<b></b><span>${w.type === 'flat' ? 'Plano' : 'Normal'} · ${when}</span>`;
      d.querySelector('b').textContent = w.name;
      d.addEventListener('click', () => { selectedWorld = w.id; renderWorlds(); });
      d.addEventListener('dblclick', () => openWorld(w.id));
      el.appendChild(d);
    }
    $('w-play').disabled = $('w-delete').disabled = !selectedWorld;
  }
  $('t-play').addEventListener('click', () => { renderWorlds(); showScreen('worlds'); });
  $('w-back').addEventListener('click', () => showScreen('title'));
  $('w-play').addEventListener('click', () => { if (selectedWorld) openWorld(selectedWorld); });
  $('w-new').addEventListener('click', () => { resetCreate(); showScreen('create'); });
  $('w-delete').addEventListener('click', () => {
    const w = worldList().find(x => x.id === selectedWorld);
    if (!w || !confirm(`Apagar o mundo "${w.name}"? Não dá pra desfazer.`)) return;
    try { localStorage.removeItem(worldKey(w.id)); } catch (e) { /* nada */ }
    writeList(worldList().filter(x => x.id !== w.id));
    selectedWorld = null;
    renderWorlds();
  });

  // Criar mundo
  let opts;
  const OPT_LABELS = {
    caves: v => `Cavernas: ${v ? 'Sim' : 'Não'}`,
    water: v => `Mar e lagos: ${v ? 'Sim' : 'Não'}`,
    animals: v => `Bichos: ${v ? 'Sim' : 'Não'}`,
    daynight: v => `Dia e noite: ${v ? 'Sim' : 'Sempre dia'}`,
    infinite: v => `Tamanho: ${v ? 'Infinito' : 'Pequeno'}`,
  };
  function resetCreate() {
    opts = { type: 'normal', caves: true, water: true, animals: true, daynight: true, infinite: true };
    $('c-name').value = 'Novo mundo' + (worldList().length ? ' ' + (worldList().length + 1) : '');
    $('c-seed').value = '';
    renderCreate();
  }
  function renderCreate() {
    $('c-type').textContent = `Tipo de mundo: ${opts.type === 'flat' ? 'Plano' : 'Normal'}`;
    $('c-desc').textContent = opts.type === 'flat'
      ? 'Tudo liso, sem morros, árvores nem nada. Ótimo pra construir!'
      : 'Morros, árvores, praias e biomas: floresta, deserto, neve e ilha de cogumelos.';
    document.querySelectorAll('[data-opt]').forEach(b => {
      const k = b.dataset.opt;
      const off = opts.type === 'flat' && (k === 'caves' || k === 'water');
      b.disabled = off;
      b.textContent = off ? OPT_LABELS[k](false) : OPT_LABELS[k](opts[k]);
    });
  }
  $('c-type').addEventListener('click', () => { opts.type = opts.type === 'flat' ? 'normal' : 'flat'; renderCreate(); });
  document.querySelectorAll('[data-opt]').forEach(b => b.addEventListener('click', () => { opts[b.dataset.opt] = !opts[b.dataset.opt]; renderCreate(); }));
  $('c-cancel').addEventListener('click', () => { renderWorlds(); showScreen('worlds'); });
  $('c-create').addEventListener('click', () => {
    const name = $('c-name').value.trim() || 'Novo mundo';
    const txt = $('c-seed').value.trim();
    let s;
    if (!txt) s = (Math.random() * 2e9) | 0;
    else if (/^-?\d+$/.test(txt)) s = Number(txt) | 0;
    else { s = 0; for (const ch of txt) s = (Math.imul(s, 31) + ch.charCodeAt(0)) | 0; }
    const flat = opts.type === 'flat';
    createWorld(name, { ...opts, caves: !flat && opts.caves, water: !flat && opts.water, seed: s });
  });

  function resetWorldState() {
    for (const c of chunks.values()) disposeMeshes(c);
    chunks.clear();
    remesh.clear();
    clearMobs();
    thirdPerson = false;
    player.vel.set(0, 0, 0);
    player.pitch = 0;
  }
  function createWorld(name, o) {
    resetWorldState();
    const id = Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36);
    current = { id, name };
    settings = o; seed = o.seed;
    store = { chunks: {} };
    time = 0.05;
    hotbar = Array(9).fill(null); armor = [-1, -1, -1, -1]; slot = 0;
    player.fly = false; player.yaw = 0;
    const [x, z] = findSpawnXZ();
    player.pos.set(x, H, z);
    const list = worldList();
    list.push({ id, name, type: o.type, last: Date.now() });
    writeList(list);
    enterWorld(true);
  }
  function openWorld(id) {
    let data = null;
    try { data = JSON.parse(localStorage.getItem(worldKey(id))); } catch (e) { data = null; }
    if (!data || !data.settings) { alert('Não deu pra abrir esse mundo.'); return; }
    resetWorldState();
    const entry = worldList().find(w => w.id === id);
    current = { id, name: entry ? entry.name : 'Mundo' };
    settings = data.settings; seed = settings.seed;
    store = { chunks: data.chunks || {} };
    time = typeof data.time === 'number' ? data.time : 0.05;
    hotbar = Array.isArray(data.hotbar) ? data.hotbar.slice(0, 9).map(i => (BLOCKS[i] ? i : null)) : Array(9).fill(null);
    while (hotbar.length < 9) hotbar.push(null);
    armor = Array.isArray(data.armor) ? data.armor.slice(0, 4).map(m => (ARMOR_MATS[m] ? m : -1)) : [-1, -1, -1, -1];
    slot = data.slot || 0;
    player.pos.set(data.p[0], data.p[1], data.p[2]);
    player.yaw = data.p[3] || 0; player.fly = !!data.p[4];
    enterWorld(false);
  }
  const nextTick = () => new Promise(r => setTimeout(r, 0));
  async function enterWorld(isNew) {
    showScreen('loading');
    inGame = false;
    const bar = $('load-bar');
    bar.style.width = '0%';
    await nextTick();
    // Gera os chunks perto do jogador antes de começar
    const plan = chunkPlan(settings.infinite ? 2.5 : SMALL, settings.infinite ? 1.5 : SMALL);
    const total = plan.gen.length + plan.mesh.length;
    let done = 0;
    for (const [cx, cz] of plan.gen) {
      if (!chunks.has(ckey(cx, cz))) loadChunk(cx, cz);
      if (++done % 3 === 0) { bar.style.width = (done / total * 100) + '%'; await nextTick(); }
    }
    if (isNew) dropToGround();
    for (const [cx, cz] of plan.mesh) {
      const c = chunks.get(ckey(cx, cz));
      if (c && neighborsReady(cx, cz)) buildChunk(c);
      if (++done % 3 === 0) { bar.style.width = (done / total * 100) + '%'; await nextTick(); }
    }
    if (collides(player.pos, PW, PH)) dropToGround();
    const fogFar = settings.infinite ? RENDER * CS - 2 : 80;
    scene.fog.near = settings.infinite ? RENDER * CS * 0.5 : 35;
    scene.fog.far = fogFar;
    normalFog = [scene.fog.near, scene.fog.far];
    renderHotbar();
    updateArmorLook();
    $('b-fly').classList.toggle('on', player.fly);
    $('b-cam').classList.remove('on');
    inGame = true;
    document.body.classList.add('ingame');
    if (isNew) saveWorld();
    startPlaying();
    toast(current.name);
  }
  function exitWorld() {
    saveWorld();
    resetWorldState();
    current = null; settings = null;
    inGame = false; playing = false;
    document.body.classList.remove('ingame', 'underwater');
    renderWorlds();
    showScreen('worlds');
  }

  // ── Controles ─────────────────────────────────────────────
  const canvas = renderer.domElement;
  let inGame = false, playing = false;
  let normalFog = [35, 80];
  const keys = new Set();
  const held = { break: false, place: false };
  let holdTimer = 0;
  let pitchByKeys = false;

  function startPlaying() {
    playing = true;
    showScreen(null);
  }
  function pause() {
    if (!inGame) return;
    playing = false;
    keys.clear();
    held.break = held.place = false;
    invOpen = false;
    invEl.classList.add('hidden');
    showScreen('pause');
    saveWorld();
  }
  $('p-resume').addEventListener('click', startPlaying);
  $('p-quit').addEventListener('click', exitWorld);

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
  window.addEventListener('contextmenu', e => { if (inGame) e.preventDefault(); });
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
    if (!inGame) return;
    if (!playing) { if (e.code === 'Escape' || e.code === 'KeyP') startPlaying(); return; }
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
  const joy = $('joy'), knob = $('knob');
  const touchState = { joyId: null, joyX: 0, joyY: 0, lookId: null, lx: 0, ly: 0, jump: false };
  const touchLayer = $('touch');
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
    const el = $(id);
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
  let saveTimer = 0, autoSave = 60;
  function saveSoon() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveWorld, 3000);
  }
  window.addEventListener('pagehide', saveWorld);
  document.addEventListener('visibilitychange', () => { if (document.hidden) saveWorld(); });

  // ── Céu: dia e noite ──────────────────────────────────────
  function updateSky(dt) {
    if (settings && settings.daynight && playing) time = (time + dt / DAY_LEN) % 1;
    const t = settings && settings.daynight ? time : 0.25;
    const ang = t * Math.PI * 2, sh = Math.sin(ang);
    const day = smooth(Math.min(1, Math.max(0, (sh + 0.15) / 0.35)));
    light = 0.18 + 0.82 * day;
    skyCol.copy(SKY_NIGHT).lerp(SKY_DAY, day);
    skyCol.lerp(SKY_SUNSET, Math.max(0, 1 - Math.abs(sh) / 0.25) * 0.55);

    const underwater = inGame && getBlock(Math.floor(camera.position.x), Math.floor(camera.position.y), Math.floor(camera.position.z)) === WATER;
    document.body.classList.toggle('underwater', underwater);
    if (underwater) {
      scene.fog.color.copy(WATER_FOG).multiplyScalar(light);
      scene.fog.near = 0.5; scene.fog.far = 14;
    } else {
      scene.fog.color.copy(skyCol);
      [scene.fog.near, scene.fog.far] = normalFog;
    }
    scene.background = underwater ? scene.fog.color : skyCol;

    const lit = Math.pow(light, 2.2);   // material trabalha em cor linear
    blockMat.color.setScalar(lit);
    waterMat.color.setScalar(lit);
    cloudMat.color.setScalar(Math.max(0.15, lit));
    for (const m of litMats) m.color.copy(m.userData.base).multiplyScalar(lit);

    sky.position.copy(camera.position);
    sun.position.set(Math.cos(ang) * 150, sh * 150, 0);
    moon.position.set(-Math.cos(ang) * 150, -sh * 150, 0);
    sun.lookAt(camera.position); moon.lookAt(camera.position);
    starMat.opacity = 1 - day;

    for (const c of clouds.children) {
      c.position.x += dt * 1.2;
      const rx = c.position.x - camera.position.x, rz = c.position.z - camera.position.z;
      if (rx > 110) c.position.x -= 220; else if (rx < -110) c.position.x += 220;
      if (rz > 110) c.position.z -= 220; else if (rz < -110) c.position.z += 220;
    }
  }

  // ── Loop principal ────────────────────────────────────────
  const fwd = new THREE.Vector3(), right = new THREE.Vector3(), wish = new THREE.Vector3();
  let last = performance.now(), infoTimer = 0;

  function update(dt) {
    // Setas ← → giram a tela, Q / E olham pra cima e pra baixo (igual ao Contra-Ataque)
    const turn = (keys.has('ArrowLeft') ? 1 : 0) - (keys.has('ArrowRight') ? 1 : 0);
    if (turn) player.yaw += turn * 2.3 * dt;
    const tilt = (keys.has('KeyQ') ? 1 : 0) - (keys.has('KeyE') ? 1 : 0);
    if (tilt) { player.pitch = Math.max(-1.55, Math.min(1.55, player.pitch + tilt * 1.6 * dt)); pitchByKeys = true; }
    else if (pitchByKeys || !isTouch) player.pitch *= Math.pow(0.97, dt * 60);   // volta devagar para o nível

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
    const px = Math.floor(player.pos.x), pz = Math.floor(player.pos.z);
    const inWater = getBlock(px, Math.floor(player.pos.y + 0.4), pz) === WATER || getBlock(px, Math.floor(player.pos.y + 1.2), pz) === WATER;
    let speed = player.fly ? FLY : shift ? RUN : WALK;
    if (inWater && !player.fly) speed *= 0.55;

    player.vel.x = wish.x * speed;
    player.vel.z = wish.z * speed;
    if (player.fly) {
      player.vel.y = (jump ? FLY : 0) - (shift ? FLY : 0);
    } else if (inWater) {
      // Nadar: afunda devagar, Espaço sobe
      player.vel.y = jump ? 3.6 : Math.max(player.vel.y - 9 * dt, -2.5);
    } else {
      player.vel.y = Math.max(player.vel.y - GRAVITY * dt, -40);
      if (jump && player.onGround) player.vel.y = JUMP;
    }

    const ox = player.pos.x, oz = player.pos.z;
    const hitX = moveBody(player, 'x', player.vel.x * dt);
    const hitZ = moveBody(player, 'z', player.vel.z * dt);
    const hitY = moveBody(player, 'y', player.vel.y * dt);
    player.onGround = hitY && player.vel.y < 0;
    if (hitY) player.vel.y = 0;
    player.walk += Math.hypot(player.pos.x - ox, player.pos.z - oz);
    // Pulo automático quando esbarra num degrau de 1 bloco (e sair da água pela beirada)
    if ((hitX || hitZ) && (player.onGround || inWater) && !player.fly && wish.lengthSq() > 0.1) {
      const test = player.pos.clone();
      test.y += 1.05;
      test.addScaledVector(wish, 0.3);
      if (!collides(test, PW, PH)) player.vel.y = inWater ? 6 : JUMP;
    }
    if (player.pos.y < -10) respawn();

    // Segurar o botão continua quebrando/colocando
    if (held.break || held.place) {
      holdTimer -= dt;
      if (holdTimer <= 0) {
        if (held.break) breakBlock(); else placeBlock();
        holdTimer = 0.22;
      }
    }

    for (const c of remesh) if (chunks.has(ckey(c.cx, c.cz))) buildChunk(c);
    remesh.clear();
    streamChunks(2, 2, dt);
    updateMobs(dt);

    autoSave -= dt;
    if (autoSave <= 0) { autoSave = 60; saveWorld(); }
  }

  function updateFigure() {
    figure.visible = thirdPerson && inGame;
    if (!figure.visible) return;
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
    if (inGame) {
      if (playing && !invOpen) update(dt);
      updateTarget();
      updateFigure();
      infoTimer -= dt;
      if (infoTimer <= 0) {
        infoTimer = 0.3;
        const x = Math.floor(player.pos.x), z = Math.floor(player.pos.z);
        const biome = settings.type === 'flat' ? 'Mundo plano' : settings.legacy ? current.name : BIOME_NAMES[colInfo(x, z).biome];
        const night = settings.daynight && (time > 0.5 && time < 0.98) ? ' · 🌙 Noite' : '';
        infoEl.textContent = `X ${x}  Y ${Math.floor(player.pos.y)}  Z ${z} · ${biome}${night}`;
      }
    } else {
      // Nas telas do menu a câmera fica girando devagar no céu
      camera.position.set(0, 40, 0);
      camera.rotation.set(0.1, now / 20000, 0);
    }
    updateSky(dt);
    tintMobs();
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // ── Início ────────────────────────────────────────────────
  migrateLegacy();
  renderHotbar();
  drawPreview();
  showScreen('title');
  requestAnimationFrame(frame);
})();
