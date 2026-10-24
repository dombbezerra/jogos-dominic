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
        FLOWER_YELLOW = 56, COAL_ORE = 57, IRON_ORE = 58, GOLD_ORE = 59, DIAMOND_ORE = 60,
        BED_HEAD = 61,   // cabeceira da cama (a CAMA é o pé)
        // 62 a 121: concreto, concreto em pó e lã nas 20 cores (veja DECOR_COLORS)
        FLOWER_POT = 122, LANTERN = 123, PAINTING = 124, PUMPKIN = 125;
  // Quadros: o primeiro (montanha) é o PAINTING, os outros vêm depois do 125
  const PAINTING_ART = ['Montanha', 'Pôr do sol', 'Praia', 'Noite estrelada', 'Floresta', 'Arco-íris', 'Flor', 'Monstrinho'];
  const PAINTINGS = PAINTING_ART.map((n, i) => (i === 0 ? PAINTING : 125 + i));
  const BANNERS = Array.from({ length: 20 }, (n, i) => 133 + i);   // uma bandeirinha pra cada cor de DECOR_COLORS
  const VINE = 153, LAMP_POST = 154, LAMP_POST_TOP = 155, BUSH = 156, PATH = 157;
  // Diversão
  const SLIME = 158, SPEED = 159, NOTE = 160, CAKE = 161, GIFT = 162;
  const NEON_COLORS = [
    { name: 'vermelha', color: [255, 70, 70] }, { name: 'laranja', color: [255, 150, 50] },
    { name: 'amarela', color: [255, 230, 80] }, { name: 'verde', color: [90, 240, 110] },
    { name: 'azul', color: [80, 160, 255] }, { name: 'roxa', color: [180, 100, 255] },
    { name: 'rosa', color: [255, 120, 200] }, { name: 'branca', color: [245, 245, 255] },
  ];
  const NEONS = NEON_COLORS.map((c, i) => 163 + i);   // 163 a 170
  const IRON_BLOCK = 171;
  const NOTE_NAMES = ['Dó', 'Ré', 'Mi', 'Fá', 'Sol', 'Lá', 'Si', 'Dó', 'Ré', 'Mi', 'Fá', 'Sol', 'Lá', 'Si', 'Dó'];

  // 20 cores pra decorar: concreto, concreto em pó e lã
  const DECOR_COLORS = [
    { name: 'branco', color: [236, 238, 240] }, { name: 'cinza claro', color: [160, 160, 155] },
    { name: 'cinza', color: [85, 90, 95] }, { name: 'preto', color: [22, 24, 28] },
    { name: 'marrom', color: [100, 62, 35] }, { name: 'bege', color: [215, 190, 145] },
    { name: 'vermelho', color: [170, 35, 35] }, { name: 'vinho', color: [105, 20, 40] },
    { name: 'laranja', color: [230, 105, 15] }, { name: 'amarelo', color: [245, 195, 30] },
    { name: 'verde claro', color: [105, 180, 35] }, { name: 'verde', color: [70, 95, 35] },
    { name: 'verde-água', color: [75, 190, 160] }, { name: 'ciano', color: [20, 125, 140] },
    { name: 'azul claro', color: [55, 155, 215] }, { name: 'azul', color: [45, 50, 145] },
    { name: 'azul-marinho', color: [20, 25, 70] }, { name: 'roxo', color: [100, 32, 155] },
    { name: 'magenta', color: [170, 50, 160] }, { name: 'rosa', color: [215, 100, 145] },
  ];
  const CONCRETE = DECOR_COLORS.map((c, i) => 62 + i);
  const POWDER = DECOR_COLORS.map((c, i) => 82 + i);
  const WOOLS = DECOR_COLORS.map((c, i) => 102 + i);

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
    coalOre: 63, ironOre: 64, goldOre: 65, diamondOre: 66, bedFoot: 67,
    concrete0: 68, powder0: 88, wool0: 108,   // 20 cores de cada (até 127)
    potSide: 128, potTop: 129, lantern: 130, painting: 131, pumpkinSide: 132, pumpkinTop: 133, pumpkinFace: 134,
    painting1: 135,   // + os outros quadros (135 a 141)
    banner0: 142,     // + 20 bandeirinhas (142 a 161)
    vine: 162, lampPost: 163, lampPostTop: 164, bush: 165, pathTop: 166,
    slime: 167, speedTop: 168, speedSide: 169, noteSide: 170, noteTop: 171, cakeTop: 172, cakeSide: 173,
    giftSide: 174, giftTop: 175, neon0: 176,   // + 8 luzes coloridas (176 a 183)
    ironBlock: 184,
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
    pot:      [[5, 0, 5, 11, 6, 11], [7, 6, 7, 9, 10, 9], [6, 10, 6, 10, 13, 10]],
    lantern:  [[5, 0, 5, 11, 7, 11], [6, 7, 6, 10, 9, 10]],
    painting: [[0, 0, 0, 16, 16, 1]],
    banner:   [[7, 0, 7, 9, 16, 9], [1, 15, 7, 15, 16, 9], [2, 3, 7.5, 14, 15, 8.5]],
    post:     [[6, 0, 6, 10, 2, 10], [7, 2, 7, 9, 16, 9]],
    postTop:  [[7, 0, 7, 9, 10, 9], [5, 10, 5, 11, 15, 11], [4, 15, 4, 12, 16, 12]],
    bush:     [[1, 0, 1, 15, 13, 15]],
    gift:     [[2, 0, 2, 14, 12, 14]],
    cake:     [[1, 0, 1, 15, 8, 15]],
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
    [BED]:      { name: 'Cama', tex: [T.bedFoot, T.planks, T.bedSide], shape: 'bed' },
    [BED_HEAD]: { name: 'Cama', tex: [T.bedTop, T.planks, T.bedSide], shape: 'bed' },
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
  DECOR_COLORS.forEach((c, i) => {
    BLOCKS[CONCRETE[i]] = { name: `Concreto ${c.name}`, tex: Array(3).fill(T.concrete0 + i) };
    BLOCKS[POWDER[i]] = { name: `Concreto em pó ${c.name}`, tex: Array(3).fill(T.powder0 + i) };
    BLOCKS[WOOLS[i]] = { name: `Lã ${c.name}`, tex: Array(3).fill(T.wool0 + i) };
  });
  Object.assign(BLOCKS, {
    [FLOWER_POT]: { name: 'Vaso de flor', tex: [T.potTop, T.potSide, T.potSide], shape: 'pot', solid: false },
    [LANTERN]: { name: 'Lanterna', tex: [T.lantern, T.lantern, T.lantern], shape: 'lantern', solid: false, bright: true },
    [PUMPKIN]: { name: 'Abóbora de Halloween', tex: [T.pumpkinTop, T.pumpkinTop, T.pumpkinSide], front: T.pumpkinFace, bright: true },
  });
  DECOR_COLORS.forEach((c, i) => {
    const t = T.banner0 + i;
    BLOCKS[BANNERS[i]] = { name: `Bandeirinha ${c.name}`, tex: [T.planks, t, t], shape: 'banner', solid: false, art: t };
  });
  BLOCKS[IRON_BLOCK] = { name: 'Bloco de ferro', tex: [T.ironBlock, T.ironBlock, T.ironBlock] };
  NEON_COLORS.forEach((c, i) => { BLOCKS[NEONS[i]] = { name: `Luz ${c.name}`, tex: Array(3).fill(T.neon0 + i), bright: true }; });
  BLOCKS[VINE] = { name: 'Folhagem de parede', tex: [T.vine, T.vine, T.vine], shape: 'painting', solid: false, art: T.vine };
  Object.assign(BLOCKS, {
    [LAMP_POST]: { name: 'Poste de luz', tex: [T.woolK, T.woolK, T.lampPost], shape: 'post', solid: false },
    [LAMP_POST_TOP]: { name: 'Poste de luz', tex: [T.woolK, T.woolK, T.lampPostTop], shape: 'postTop', solid: false, bright: true },
    [BUSH]: { name: 'Arbusto', tex: [T.bush, T.bush, T.bush], shape: 'bush' },
    [PATH]: { name: 'Caminho de pedras', tex: [T.pathTop, T.dirt, T.grassSide] },
    [SLIME]: { name: 'Trampolim', tex: [T.slime, T.slime, T.slime] },
    [SPEED]: { name: 'Pista rápida', tex: [T.speedTop, T.speedSide, T.speedSide] },
    [NOTE]: { name: 'Caixa de música', tex: [T.noteTop, T.noteSide, T.noteSide] },
    [CAKE]: { name: 'Bolo', tex: [T.cakeTop, T.cakeSide, T.cakeSide], shape: 'cake', solid: false },
    [GIFT]: { name: 'Presente', tex: [T.giftTop, T.giftSide, T.giftSide], shape: 'gift' },
  });
  PAINTING_ART.forEach((art, i) => {
    const t = i === 0 ? T.painting : T.painting1 + i - 1;
    BLOCKS[PAINTINGS[i]] = { name: `Quadro: ${art}`, tex: [t, t, t], shape: 'painting', solid: false, art: t };
  });
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

  // Armas: ficam na barra como itens com número a partir de 200 (não são blocos)
  const TOOL_BASE = 200;
  const TOOLS = [
    { name: 'Espada', damage: [2, 3, 3, 4, 5] },
    { name: 'Picareta', damage: [1, 2, 2, 2, 3] },
  ];
  const toolId = (type, mat) => TOOL_BASE + type * 10 + mat;
  const isTool = id => id >= TOOL_BASE && TOOLS[Math.floor((id - TOOL_BASE) / 10)] && ARMOR_MATS[(id - TOOL_BASE) % 10];
  const toolOf = id => ({ type: Math.floor((id - TOOL_BASE) / 10), mat: (id - TOOL_BASE) % 10 });
  // Ovos: colocam um bicho no mundo. Também ficam na barra, com número a partir de 300
  const EGG_BASE = 300;
  const EGG_TYPES = ['porco', 'vaca', 'ovelha', 'galinha', 'coguvaca', 'morcego', 'aldeao', 'golem', 'golemNeve',
                     'zumbi', 'esqueleto', 'creeper', 'enderman'];
  const EGGS = EGG_TYPES.map((t, i) => EGG_BASE + i);
  const isEgg = id => id >= EGG_BASE && id < EGG_BASE + EGG_TYPES.length;
  const eggType = id => EGG_TYPES[id - EGG_BASE];
  const itemName = id => {
    if (isTool(id)) { const t = toolOf(id); return `${TOOLS[t.type].name} ${ARMOR_MATS[t.mat].name}`; }
    if (isEgg(id)) return `Ovo de ${MOBS[eggType(id)].name.toLowerCase()}`;
    return BLOCKS[id].name;
  };
  const validItem = id => (BLOCKS[id] || isTool(id) || isEgg(id) ? id : null);

  const CATEGORIES = [
    { name: 'Blocos', items: [GRASS, DIRT, STONE, COBBLE, SAND, SANDSTONE, GRAVEL, WOOD, PLANKS, LEAVES,
                              GLASS, BRICK, SNOW, ICE, MYCELIUM, GOLD, IRON_BLOCK, DIAMOND, COAL_ORE, IRON_ORE, GOLD_ORE,
                              DIAMOND_ORE] },
    { name: 'Natureza', items: [WATER, FLOWER_RED, FLOWER_YELLOW, SHROOM_RED, SHROOM_BROWN, CACTUS,
                                MUSH_STEM, MUSH_RED, MUSH_BROWN] },
    { name: 'Coisas de casa', items: [CRAFT, BOOKS, CHEST, FURNACE, LAMP, DOOR, BED, TABLE, CHAIR, TORCH, FENCE, ...CARPETS] },
    { name: 'Armadura', armor: true },
    { name: 'Decorações', items: [FLOWER_POT, LANTERN, PUMPKIN, VINE, LAMP_POST, BUSH, PATH, ...PAINTINGS, ...BANNERS, ...CONCRETE, ...POWDER, ...WOOLS] },
    { name: 'Diversão', items: [SLIME, SPEED, NOTE, CAKE, GIFT, ...NEONS] },
    { name: 'Bichos', items: EGGS },
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

  // ── Vilas ─────────────────────────────────────────────────
  // O mundo é dividido em quadrados de 80 blocos e mais ou menos metade tem uma vila:
  // um poço no meio, casinhas em volta com a porta virada pro poço e caminhos ligando tudo
  const VCELL = 80, VRAD = 24;
  const villageCache = new Map();
  const HOUSE_SLOTS = [[-12, -3], [11, -5], [-3, -13], [3, 12], [-12, 10], [12, 8], [10, -15]];
  function villageIn(gx, gz) {
    const k = gx + ',' + gz;
    if (villageCache.has(k)) return villageCache.get(k);
    let v = null;
    if (settings.villages && settings.type !== 'flat' && hash(gx, 7, gz, 90) < 0.5) {
      const x = gx * VCELL + 26 + Math.floor(hash(gx, 8, gz, 91) * 28);
      const z = gz * VCELL + 26 + Math.floor(hash(gx, 9, gz, 92) * 28);
      const { h, biome } = colInfo(x, z);
      if (biome !== 'cogumelo' && h <= 40 && !(settings.water && h <= SEA) && inWorld(x >> 4, z >> 4)) {
        v = { key: k, x, z, h, desert: biome === 'deserto', houses: [] };
        HOUSE_SLOTS.forEach(([dx, dz], i) => {
          if (hash(gx, 10 + i, gz, 93) < 0.25) return;
          const hx = x + dx + Math.floor(hash(gx, 20 + i, gz, 94) * 3) - 1;
          const hz = z + dz + Math.floor(hash(gx, 30 + i, gz, 95) * 3) - 1;
          const hy = colInfo(hx, hz).h;
          if (Math.abs(hy - h) > 5 || (settings.water && hy < SEA) || !inWorld(hx >> 4, hz >> 4)) return;
          const ddx = x - hx, ddz = z - hz;
          const dir = Math.abs(ddx) > Math.abs(ddz) ? (ddx > 0 ? 1 : 3) : (ddz > 0 ? 0 : 2);
          v.houses.push({ x: hx, z: hz, y: hy, dir });
        });
        if (v.houses.length < 2) v = null;
      }
    }
    villageCache.set(k, v);
    return v;
  }
  // Vilas que encostam no retângulo (x0, z0) - (x1, z1)
  function villagesNear(x0, z0, x1, z1) {
    const out = [];
    for (let gz = Math.floor((z0 - VRAD) / VCELL); gz <= Math.floor((z1 + VRAD) / VCELL); gz++)
      for (let gx = Math.floor((x0 - VRAD) / VCELL); gx <= Math.floor((x1 + VRAD) / VCELL); gx++) {
        const v = villageIn(gx, gz);
        if (v && v.x + VRAD >= x0 && v.x - VRAD <= x1 && v.z + VRAD >= z0 && v.z - VRAD <= z1) out.push(v);
      }
    return out;
  }
  function buildVillage(v, blocks, meta, x0, z0) {
    const set = (x, y, z, id, m = 0) => {
      const lx = x - x0, lz = z - z0;
      if (lx < 0 || lz < 0 || lx >= CS || lz >= CS || y < 1 || y >= H) return;
      const i = CI(lx, y, lz);
      if (blocks[i] === BEDROCK) return;
      blocks[i] = id; meta[i] = m;
    };
    const get = (x, y, z) => {
      const lx = x - x0, lz = z - z0;
      return lx < 0 || lz < 0 || lx >= CS || lz >= CS || y < 0 ? -1 : blocks[CI(lx, y, lz)];
    };
    const pathId = v.desert ? SANDSTONE : PATH;
    const pathAt = (x, z) => {
      if (x < x0 || z < z0 || x >= x0 + CS || z >= z0 + CS) return;
      const y = colInfo(x, z).h;
      if (settings.water && y < SEA) return;
      set(x, y, z, pathId);
      for (let k = 1; k <= 3; k++) set(x, y + k, z, AIR);
    };
    // Pracinha e caminhos do poço até a porta de cada casa
    for (let dx = -3; dx <= 4; dx++) for (let dz = -3; dz <= 4; dz++) pathAt(v.x + dx, v.z + dz);
    for (const hs of v.houses) {
      const [fx, , fz] = FRONT[hs.dir];
      const tx = hs.x + fx * 3, tz = hs.z + fz * 3;
      const sx = Math.sign(tx - v.x) || 1, sz = Math.sign(tz - v.z) || 1;
      for (let x = v.x; x !== tx + sx; x += sx) { pathAt(x, v.z); pathAt(x, v.z + 1); }
      for (let z = v.z; z !== tz + sz; z += sz) { pathAt(tx, z); pathAt(tx + 1, z); }
    }
    // Poço
    const y = v.h;
    for (let dx = -1; dx <= 2; dx++) for (let dz = -1; dz <= 2; dz++) {
      const x = v.x + dx, z = v.z + dz, edge = dx === -1 || dx === 2 || dz === -1 || dz === 2;
      for (let k = 1; k <= 4; k++) set(x, y - k, z, edge || k === 4 ? COBBLE : WATER);
      set(x, y, z, edge ? COBBLE : WATER);
      for (let k = 1; k <= 2; k++) set(x, y + k, z, (dx === -1 || dx === 2) && (dz === -1 || dz === 2) ? FENCE : AIR);
      set(x, y + 3, z, COBBLE);
    }
    // Postes de luz na pracinha
    for (const [dx, dz] of [[-3, -3], [4, 4]]) {
      const x = v.x + dx, z = v.z + dz, py = colInfo(x, z).h;
      set(x, py + 1, z, LAMP_POST); set(x, py + 2, z, LAMP_POST_TOP);
    }
    for (const hs of v.houses) buildHouse(hs, v, set, get);
  }
  // Casinha 5x5 com telhado. Montada "de frente" (porta pro +z) e girada pro lado do poço
  function buildHouse(hs, v, set, get) {
    const { x: hx, z: hz, y: fy, dir } = hs;
    const wall = v.desert ? SANDSTONE : PLANKS, post = v.desert ? SANDSTONE : WOOD, roof = v.desert ? SANDSTONE : BRICK;
    const R = (lx, lz) => dir === 0 ? [lx, lz] : dir === 1 ? [lz, -lx] : dir === 2 ? [-lx, -lz] : [-lz, lx];
    const at = (lx, y, lz, id, m = 0) => { const [rx, rz] = R(lx, lz); set(hx + rx, y, hz + rz, id, (m + dir) % 4); };
    for (let lx = -3; lx <= 3; lx++) for (let lz = -3; lz <= 3; lz++) {
      for (let y = fy + 1; y <= fy + 8; y++) at(lx, y, lz, AIR);
      if (Math.abs(lx) > 2 || Math.abs(lz) > 2) continue;
      // Alicerce até o chão, se a casa ficou num barranco
      const [rx, rz] = R(lx, lz);
      for (let y = fy - 1; y > fy - 8; y--) {
        const b = get(hx + rx, y, hz + rz);
        if (b !== AIR && b !== WATER && b !== LEAVES) break;
        at(lx, y, lz, COBBLE);
      }
      const edge = Math.abs(lx) === 2 || Math.abs(lz) === 2, corner = Math.abs(lx) === 2 && Math.abs(lz) === 2;
      at(lx, fy, lz, edge ? COBBLE : PLANKS);
      if (edge) for (let y = fy + 1; y <= fy + 3; y++) at(lx, y, lz, corner ? post : wall);
    }
    // Telhado
    if (v.desert) {
      for (let lx = -2; lx <= 2; lx++) for (let lz = -2; lz <= 2; lz++) at(lx, fy + 4, lz, roof);
    } else {
      for (let s = 0; s <= 3; s++) for (let lx = s - 3; lx <= 3 - s; lx++) for (let lz = s - 3; lz <= 3 - s; lz++) at(lx, fy + 4 + s, lz, roof);
    }
    // Janelas, porta e um degrau na frente
    at(-2, fy + 2, 0, GLASS); at(2, fy + 2, 0, GLASS); at(0, fy + 2, -2, GLASS);
    at(0, fy + 1, 2, DOOR); at(0, fy + 2, 2, DOOR_TOP);
    at(0, fy, 3, v.desert ? SANDSTONE : COBBLE);
    // Móveis: cama, mesa com cadeira, baú e tocha
    at(-1, fy + 1, -1, BED_HEAD); at(-1, fy + 1, 0, BED);
    at(1, fy + 1, -1, TABLE); at(1, fy + 1, 0, CHAIR, 2);
    at(-1, fy + 1, 1, CHEST); at(1, fy + 1, 1, TORCH);
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
    const vNear = villagesNear(x0 - 3, z0 - 3, x0 + CS + 2, z0 + CS + 2);
    for (let z = z0 - 3; z < z0 + CS + 3; z++) for (let x = x0 - 3; x < x0 + CS + 3; x++) {
      if (vNear.some(v => Math.abs(x - v.x) < VRAD && Math.abs(z - v.z) < VRAD)) continue;   // sem árvore na vila
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
    for (const v of vNear) buildVillage(v, blocks, meta, x0, z0);
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
        mobs: mobs.filter(m => m.kept && !m.dead).map(m => [m.type, +m.pos.x.toFixed(2), +m.pos.y.toFixed(2), +m.pos.z.toFixed(2)]),
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
  tile(T.ironBlock, (x, y) => (x === 0 || y === 0) ? [245, 245, 248] : (x === 15 || y === 15) ? [150, 150, 158]
    : y % 5 === 2 ? [195, 195, 200] : vary([222, 222, 228], 0.05));
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
  tile(T.bedTop, (x, y) => (x === 0 || x === 15 || y === 0 || y === 15) ? vary([180, 45, 40], 0.1)
    : (x === 1 || x === 14 || y === 1 || y === 14) ? [205, 205, 210] : vary([242, 242, 242], 0.04));
  DECOR_COLORS.forEach((c, i) => {
    tile(T.concrete0 + i, () => vary(c.color, 0.04));
    tile(T.powder0 + i, () => trnd() < 0.25 ? vary(c.color.map(v => Math.min(255, v * 1.18 + 12)), 0.1) : vary(c.color, 0.14));
    tile(T.wool0 + i, wool(c.color));
  });
  const terracotta = [160, 85, 55];
  tile(T.potSide, (x, y) => {
    if (y >= 10 && x >= 5 && x <= 10) return y === 10 ? vary([120, 62, 40], 0.05) : vary(terracotta, 0.06);
    if (y >= 6 && x >= 7 && x <= 8) return [60, 140, 40];                               // cabinho
    if (y >= 3 && y <= 5 && x >= 6 && x <= 9) return (y === 4 && (x === 7 || x === 8)) ? [250, 220, 60] : [215, 45, 60];   // flor
    return [0, 0, 0, 0];
  });
  tile(T.potTop, (x, y) => (x >= 6 && x <= 9 && y >= 6 && y <= 9) ? [215, 45, 60] : vary([80, 55, 35], 0.15));
  tile(T.lantern, (x, y) => (x === 5 || x === 10 || y === 9 || y === 15 || y === 7 || y === 8) && x >= 5 && x <= 10
    ? [55, 55, 65] : (x > 5 && x < 10 && y > 9) ? vary([255, 200, 90], 0.1) : (x > 5 && x < 10) ? [70, 70, 80] : [0, 0, 0, 0]);
  tile(T.painting, (x, y) => {
    if (x === 0 || x === 15 || y === 0 || y === 15) return [110, 75, 40];             // moldura
    if (y > 10) return vary([70, 150, 60], 0.1);                                      // grama
    if (Math.hypot(x - 11, y - 4) < 2.2) return [250, 220, 80];                       // sol
    if (y > 6 && Math.abs(x - 5) < y - 6) return vary([120, 120, 130], 0.08);          // montanha
    return vary([120, 185, 235], 0.05);                                               // céu
  });
  // Desenhos dos quadros (a borda de 1 pixel é a moldura)
  const framed = fn => (x, y) => (x === 0 || x === 15 || y === 0 || y === 15) ? [110, 75, 40] : fn(x, y);
  const ART = [
    // Pôr do sol: céu laranja e rosa, sol metade no mar
    framed((x, y) => {
      if (y >= 9) return (Math.hypot(x - 7.5, 9 - y) < 3 && (y === 10 || y === 12)) ? [255, 190, 90] : vary([40, 70, 140], 0.08);
      if (Math.hypot(x - 7.5, y - 9) < 3.2) return [255, 210, 70];
      return y < 4 ? [200, 90, 140] : y < 7 ? [240, 120, 80] : [250, 170, 70];
    }),
    // Praia: céu, mar, areia e um coqueiro
    framed((x, y) => {
      if ((x === 11 || x === 12) && y >= 5 && y <= 11) return [120, 80, 40];               // tronco
      if (y >= 3 && y <= 5 && x >= 8 && x <= 15 && Math.abs(x - 11.5) + Math.abs(y - 4) * 2 < 5) return [50, 150, 50];   // folhas
      if (y >= 11) return vary([235, 210, 140], 0.06);
      if (y >= 8) return vary([40, 150, 200], 0.08);
      if (x <= 4 && y <= 4 && Math.hypot(x - 3, y - 3) < 1.8) return [255, 230, 90];
      return [140, 205, 245];
    }),
    // Noite estrelada: céu escuro, lua e estrelas
    framed((x, y) => {
      if (Math.hypot(x - 11, y - 4) < 2.4 && Math.hypot(x - 12, y - 3.4) >= 1.8) return [245, 240, 200];
      if (y >= 12) return vary([25, 60, 35], 0.1);
      if ((x * 7 + y * 13) % 17 === 0) return [255, 255, 220];
      return vary([18, 25, 70], 0.08);
    }),
    // Floresta: árvores na grama
    framed((x, y) => {
      for (const tx of [3, 8, 12]) {
        if (Math.abs(x - tx) <= 2 - (y < 5 ? 1 : 0) && y >= 3 && y <= 8) return vary([35, 110, 40], 0.15);
        if (x === tx && y >= 9 && y <= 11) return [100, 70, 35];
      }
      if (y >= 12) return vary([80, 160, 60], 0.1);
      return [150, 210, 240];
    }),
    // Arco-íris
    framed((x, y) => {
      const d = Math.hypot(x - 7.5, y - 14);
      const cols = [[220, 50, 50], [240, 140, 40], [245, 220, 60], [80, 180, 70], [60, 120, 220], [130, 70, 190]];
      const k = Math.floor(11 - d);
      if (k >= 0 && k < cols.length && y < 14) return cols[k];
      return y >= 13 ? [90, 170, 70] : [160, 215, 245];
    }),
    // Flor grande
    framed((x, y) => {
      if (Math.hypot(x - 7.5, y - 5.5) < 1.6) return [250, 210, 60];
      for (const [px, py] of [[7.5, 2.8], [7.5, 8.2], [4.8, 5.5], [10.2, 5.5]]) if (Math.hypot(x - px, y - py) < 1.9) return [230, 80, 130];
      if ((x === 7 || x === 8) && y >= 8) return [60, 140, 50];
      if (y === 11 && x >= 9 && x <= 11) return [70, 160, 60];
      return [245, 235, 210];
    }),
    // Monstrinho verde
    framed((x, y) => {
      const eye = y >= 4 && y <= 6 && ((x >= 3 && x <= 5) || (x >= 10 && x <= 12));
      const mouth = (y >= 7 && y <= 9 && x >= 6 && x <= 9) || (y >= 10 && y <= 12 && ((x >= 5 && x <= 6) || (x >= 9 && x <= 10)));
      return eye || mouth ? [25, 30, 25] : vary([90, 175, 70], 0.18);
    }),
  ];
  ART.forEach((fn, i) => tile(T.painting1 + i, fn));
  // Bandeirinha: pano colorido pendurado num mastro de madeira, com a ponta em "V" embaixo
  DECOR_COLORS.forEach((c, i) => tile(T.banner0 + i, (x, y) => {
    if (y === 0 && x >= 1 && x <= 14) return [110, 80, 45];                     // travessa
    if (y >= 1 && y <= 12 && x >= 2 && x <= 13) {
      if (y >= 11 && Math.abs(x - 7.5) < (y - 9.5) * 1.6) return x === 7 || x === 8 ? [120, 85, 45] : [0, 0, 0, 0];
      if (x === 2 || x === 13 || y === 1) return c.color.map(v => v * 0.7);    // barrinha
      if (y >= 5 && y <= 6) return c.color.map(v => Math.min(255, v * 0.6 + 100));   // listra
      return vary(c.color, 0.06);
    }
    if (x === 7 || x === 8) return [120, 85, 45];                              // mastro
    return [0, 0, 0, 0];
  }));
  // Poste de luz: haste de ferro escuro; no topo, uma lanterna acesa com telhadinho
  const iron = [45, 45, 52];
  tile(T.lampPost, (x, y) => ((x === 7 || x === 8) || (y >= 14 && x >= 6 && x <= 9)) ? vary(iron, 0.1) : [0, 0, 0, 0]);
  tile(T.lampPostTop, (x, y) => {
    if (y === 0 && x >= 4 && x <= 11) return iron;                                   // telhadinho
    if (y >= 1 && y <= 6 && x >= 5 && x <= 10) return (x === 5 || x === 10 || y === 1 || y === 6) ? iron : vary([255, 215, 110], 0.08);
    if (y > 6 && (x === 7 || x === 8)) return vary(iron, 0.1);
    return [0, 0, 0, 0];
  });
  tile(T.bush, () => trnd() < 0.08 ? [0, 0, 0, 0] : vary(trnd() < 0.5 ? [50, 120, 40] : [35, 95, 30], 0.18));
  // ── Diversão ──
  tile(T.slime, (x, y) => (x === 0 || y === 0 || x === 15 || y === 15) ? [70, 150, 60]
    : (x >= 4 && x <= 11 && y >= 4 && y <= 11) ? vary([150, 230, 120], 0.05) : vary([110, 200, 90], 0.05));
  tile(T.speedTop, (x, y) => {
    const c = (y + 16 - Math.abs(x - 7.5) * 1.2) % 8;   // setinhas (chevrons)
    return c < 2.2 ? [255, 210, 40] : vary([45, 45, 50], 0.1);
  });
  tile(T.speedSide, (x, y) => y < 3 ? ((x + y) % 4 < 2 ? [255, 210, 40] : [30, 30, 30]) : vary([60, 60, 65], 0.1));
  tile(T.noteSide, (x, y) => {
    if (x === 0 || y === 0 || x === 15 || y === 15) return [70, 45, 25];
    const note = (x >= 6 && x <= 8 && y >= 9 && y <= 11) || (x === 8 && y >= 3 && y <= 10) || (x >= 9 && x <= 10 && y >= 3 && y <= 4);
    return note ? [30, 20, 15] : vary([125, 80, 45], 0.08);
  });
  tile(T.noteTop, (x, y) => (x === 0 || y === 0 || x === 15 || y === 15) ? [70, 45, 25]
    : (x % 3 === 1 && y % 3 === 1) ? [40, 28, 18] : vary([125, 80, 45], 0.08));
  tile(T.cakeTop, (x, y) => [[4, 4], [11, 4], [7, 8], [4, 12], [11, 12]].some(([cx, cy]) => Math.abs(x - cx) <= 0 && Math.abs(y - cy) <= 0)
    ? [210, 30, 40] : vary([248, 245, 240], 0.03));
  tile(T.cakeSide, (x, y) => {
    if (y < 8) return [0, 0, 0, 0];
    if (y <= 9) return vary([248, 245, 240], 0.03);                    // cobertura
    if (y === 12) return vary([200, 40, 60], 0.08);                     // recheio
    return vary([225, 180, 120], 0.06);                                 // massa
  });
  tile(T.giftSide, (x, y) => y < 4 ? [0, 0, 0, 0] : (x === 7 || x === 8 || y === 9) ? [250, 215, 60] : vary([210, 40, 50], 0.06));
  tile(T.giftTop, (x, y) => {
    const bow = Math.abs(Math.abs(x - 7.5) - Math.abs(y - 7.5)) < 1 && Math.abs(x - 7.5) < 4;   // laço
    return (x === 7 || x === 8 || y === 7 || y === 8 || bow) ? [250, 215, 60] : vary([210, 40, 50], 0.06);
  });
  NEON_COLORS.forEach((c, i) => tile(T.neon0 + i, (x, y) => {
    const d = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5));
    if (d > 7) return c.color.map(v => v * 0.55);
    return vary(c.color.map(v => Math.min(255, v + (7 - d) * 6)), 0.04);
  }));
  // Caminho: pedras redondinhas no meio da grama
  tile(T.pathTop, (x, y) => {
    for (const [cx, cy, r] of [[4, 4, 3], [11, 5, 2.6], [5, 11, 2.8], [12, 12, 2.4]]) {
      if (Math.hypot(x - cx, y - cy) < r) return vary(Math.hypot(x - cx, y - cy) > r - 1 ? [110, 110, 105] : [150, 148, 140], 0.1);
    }
    return vary(grassCol, 0.3);
  });
  // Folhagem: folhinhas e cipós com buracos, pra ficar grudada na parede
  tile(T.vine, (x, y) => {
    const stem = (x + Math.floor(y / 3)) % 5 === 0;
    if (stem) return vary([45, 100, 35], 0.1);
    return trnd() < 0.42 ? [0, 0, 0, 0] : vary(trnd() < 0.5 ? [60, 140, 45] : [40, 115, 35], 0.15);
  });
  const pumpkin = [220, 120, 25];
  tile(T.pumpkinSide, (x) => vary(x % 4 === 0 ? [185, 95, 20] : pumpkin, 0.08));
  tile(T.pumpkinTop, (x, y) => (x >= 7 && x <= 8 && y >= 7 && y <= 8) ? [90, 70, 30] : vary(pumpkin, 0.08));
  tile(T.pumpkinFace, (x, y) => {
    const eye = (y >= 4 && y <= 6) && ((x >= 3 && x <= 5) || (x >= 10 && x <= 12));
    const mouth = (y >= 10 && y <= 12 && x >= 3 && x <= 12) && !(y === 10 && (x === 5 || x === 10));
    return eye || mouth ? [255, 225, 80] : vary(x % 4 === 0 ? [185, 95, 20] : pumpkin, 0.08);
  });
  tile(T.bedFoot, (x, y) => (x === 0 || x === 15) ? vary([150, 35, 30], 0.1) : y % 5 === 4 ? vary([160, 38, 34], 0.08) : vary([185, 45, 40], 0.1));
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
  // Cores do céu: em cima (TOP) e perto do horizonte (HOR), de dia e de noite, e as do pôr do sol
  const SKY_DAY = new THREE.Color(0x9fd4f2), SKY_NIGHT = new THREE.Color(0x10163a);
  const TOP_DAY = new THREE.Color(0x4f9be0), TOP_NIGHT = new THREE.Color(0x04060f);
  const SUNSET_ORANGE = new THREE.Color(0xff7a2e), SUNSET_PINK = new THREE.Color(0xe0628f), SUNSET_PURPLE = new THREE.Color(0x4b3a7a);
  const SUNSET_GLOW = new THREE.Color(0xffc060), CLOUD_SUNSET = new THREE.Color(0xff9a7a);
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
        if (id === CAKE) {
          // O bolo guarda no meta quantas fatias já foram comidas
          emitBox(buf, x, y, z, [1 + m * 2, 0, 1, 15, 8, 15], def, 0, null);
          continue;
        }
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

  // Céu em degradê: uma bola grande em volta da câmera, pintada pelo shader
  const skyUniforms = {
    top: { value: new THREE.Color() }, horizon: { value: new THREE.Color() },
    sunDir: { value: new THREE.Vector3(1, 0, 0) }, sunset: { value: 0 },
    orange: { value: SUNSET_ORANGE }, pink: { value: SUNSET_PINK }, purple: { value: SUNSET_PURPLE }, glow: { value: SUNSET_GLOW },
  };
  const skyDome = new THREE.Mesh(new THREE.SphereGeometry(210, 32, 16), new THREE.ShaderMaterial({
    uniforms: skyUniforms, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      uniform vec3 top, horizon, sunDir, orange, pink, purple, glow;
      uniform float sunset;
      varying vec3 vDir;
      void main() {
        vec3 dir = normalize(vDir);
        float h = dir.y;
        vec3 col = mix(horizon, top, smoothstep(-0.05, 0.55, h));
        // Pôr do sol: faixa colorida perto do horizonte, mais forte do lado do sol
        float toward = max(dot(dir, sunDir), 0.0);
        float band = 1.0 - smoothstep(0.0, 0.5, abs(h));
        col = mix(col, purple, sunset * smoothstep(0.2, 0.8, h) * 0.45);
        col = mix(col, pink, sunset * band * (0.35 + 0.4 * toward));
        col = mix(col, orange, sunset * band * pow(toward, 2.5));
        col += glow * sunset * pow(toward, 40.0) * 0.8;
        gl_FragColor = vec4(pow(col, vec3(1.0 / 2.2)), 1.0);   // cor linear -> tela
      }`,
  }));
  skyDome.renderOrder = -1;
  scene.add(skyDome);

  // Brilho em volta do sol (um círculo que vai sumindo nas bordas)
  const glowTex = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.35, 'rgba(255,255,255,.35)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad; g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  })();

  // Sol, lua e estrelas
  const sky = new THREE.Group();
  const sun = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), new THREE.MeshBasicMaterial({ color: 0xfff2a0, fog: false }));
  const sunGlow = new THREE.Mesh(new THREE.PlaneGeometry(70, 70), new THREE.MeshBasicMaterial({
    map: glowTex, color: 0xffd080, transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending,
  }));
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
  sky.add(sunGlow, sun, moon, new THREE.Points(starGeo, starMat));
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
    pos: new THREE.Vector3(), vel: new THREE.Vector3(), knock: new THREE.Vector3(), hw: PW, hh: PH,
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
    // Moradores da vila e golens (o de ferro e o de neve protegem você dos monstros)
    aldeao: { name: 'Aldeão', hw: 0.3, hh: 1.95, hp: 5, speed: 0.9, npc: true, build: villagerModel },
    golem: { name: 'Golem de ferro', hw: 0.7, hh: 2.7, hp: 30, speed: 0.9, npc: true, guard: 'iron', build: ironGolemModel },
    golemNeve: { name: 'Golem de neve', hw: 0.35, hh: 1.9, hp: 4, speed: 1.2, npc: true, guard: 'snow', build: snowGolemModel },
    // Monstros: só de noite, no mundo normal, no modo Sobrevivência
    zumbi: { name: 'Zumbi', hw: 0.3, hh: 1.8, hp: 6, speed: 2.1, hostile: true,
      build: () => humanoid({ h: 1.8, skin: 0x5f9e4a, shirt: 0x2f8f9a, pants: 0x46407e, eyes: 0x111111, limb: 4, armsForward: true }) },
    esqueleto: { name: 'Esqueleto', hw: 0.3, hh: 1.85, hp: 5, speed: 2.0, hostile: true,
      build: () => humanoid({ h: 1.85, skin: 0xd8d8d0, shirt: 0xc8c8c0, pants: 0xd0d0c8, eyes: 0x222222, limb: 2, armsForward: true, bow: true }) },
    enderman: { name: 'Enderman', hw: 0.3, hh: 2.9, hp: 10, speed: 2.6, hostile: true,
      build: () => humanoid({ h: 2.9, skin: 0x161616, shirt: 0x161616, pants: 0x161616, eyes: 0xc070ff, limb: 2, legH: 30, armH: 30 }) },
    creeper: { name: 'Creeper', hw: 0.3, hh: 1.6, hp: 5, speed: 1.9, hostile: true, build: () => {
      const g = new THREE.Group(), mats = [];
      const part = (w, h, d, color) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), litMat(color)); mats.push(m.material); return m; };
      const P = 1.7 / 26;
      const body = part(8 * P, 12 * P, 4 * P, 0x4caf50); body.position.y = 12 * P; g.add(body);
      for (const [x, y] of [[-2, 3], [2, -2], [-1, -4]]) { const spot = part(3 * P, 3 * P, 4.1 * P, 0x2e7d32); spot.position.set(x * P, y * P, 0); body.add(spot); }
      const head = part(8 * P, 8 * P, 8 * P, 0x5cbf5c); head.position.y = 22 * P; g.add(head);
      const face = (w, h, x, y) => { const f = part(w * P, h * P, 0.3 * P, 0x111111); f.position.set(x * P, y * P, 4.05 * P); head.add(f); };
      face(2, 2, -2, 1); face(2, 2, 2, 1); face(2, 3, 0, -1.5); face(1, 2, -1.5, -2.5); face(1, 2, 1.5, -2.5);
      const legs = [];
      for (const [sx, sz] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) {
        const pivot = new THREE.Group(); pivot.position.set(sx * 2 * P, 6 * P, sz * 4 * P);
        const leg = part(4 * P, 6 * P, 4 * P, 0x4caf50); leg.position.y = -3 * P;
        pivot.add(leg); g.add(pivot); legs.push(pivot);
      }
      return { group: g, legs, mats, wings: [] };
    } },
  };
  function rig() {
    const g = new THREE.Group(), mats = [];
    const part = (w, h, d, color) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), litMat(color)); mats.push(m.material); return m; };
    return { g, mats, part };
  }
  // Aldeão: narigão, roupão até o joelho e braços cruzados
  const ROBES = [0x6b4a2e, 0xe4e4dc, 0x4f7a34, 0x7b3f8c, 0x2d5f9a];
  function villagerModel() {
    const { g, mats, part } = rig();
    const P = 1.95 / 34, skin = 0xbd8b6e, robe = ROBES[Math.floor(Math.random() * ROBES.length)];
    const legs = [];
    for (const sx of [-1, 1]) {
      const pivot = new THREE.Group(); pivot.position.set(sx * 2 * P, 12 * P, 0);
      const leg = part(4 * P, 12 * P, 4 * P, 0x4a3a2a); leg.position.y = -6 * P;
      pivot.add(leg); g.add(pivot); legs.push(pivot);
    }
    const body = part(8 * P, 12 * P, 6 * P, robe); body.position.y = 18 * P; g.add(body);
    const skirt = part(8.4 * P, 6 * P, 6.4 * P, robe); skirt.position.y = 9 * P; g.add(skirt);
    const arms = part(10 * P, 4 * P, 4 * P, skin); arms.position.set(0, 20 * P, 4 * P); g.add(arms);
    const head = part(8 * P, 10 * P, 8 * P, skin); head.position.y = 29 * P; g.add(head);
    const nose = part(2 * P, 4 * P, 2 * P, 0xa8765a); nose.position.set(0, -2 * P, 5 * P); head.add(nose);
    const brow = part(8 * P, 1 * P, 0.3 * P, 0x3a2a1a); brow.position.set(0, 2.5 * P, 4.05 * P); head.add(brow);
    for (const sx of [-1, 1]) { const e = part(2 * P, 1 * P, 0.3 * P, 0x2d6b2d); e.position.set(sx * 2 * P, 1 * P, 4.1 * P); head.add(e); }
    return { group: g, legs, mats, wings: [] };
  }
  // Golem de ferro: grandão, braços compridos e cipós no peito
  function ironGolemModel() {
    const { g, mats, part } = rig();
    const P = 2.7 / 40, iron = 0xd6d0c4, vine = 0x4f8a34;
    const legs = [];
    for (const sx of [-1, 1]) {
      const pivot = new THREE.Group(); pivot.position.set(sx * 3.5 * P, 13 * P, 0);
      const leg = part(6 * P, 13 * P, 5 * P, iron); leg.position.y = -6.5 * P;
      pivot.add(leg); g.add(pivot); legs.push(pivot);
    }
    const waist = part(9 * P, 5 * P, 6 * P, iron); waist.position.y = 15.5 * P; g.add(waist);
    const chest = part(18 * P, 12 * P, 11 * P, iron); chest.position.y = 24 * P; g.add(chest);
    for (const [x, y, h] of [[-5, 2, 8], [4, -1, 6]]) { const v = part(2 * P, h * P, 11.2 * P, vine); v.position.set(x * P, y * P, 0); chest.add(v); }
    const head = part(8 * P, 10 * P, 8 * P, iron); head.position.set(0, 35 * P, 1.5 * P); g.add(head);
    const nose = part(2 * P, 4 * P, 2 * P, 0xc0b8aa); nose.position.set(0, -2 * P, 5 * P); head.add(nose);
    for (const sx of [-1, 1]) { const e = part(2 * P, 1.2 * P, 0.3 * P, 0x9a2020); e.position.set(sx * 2 * P, 1.5 * P, 4.05 * P); head.add(e); }
    for (const sx of [-1, 1]) {
      const pivot = new THREE.Group(); pivot.position.set(sx * 11 * P, 29 * P, 0);
      const arm = part(4 * P, 30 * P, 6 * P, iron); arm.position.y = -14 * P;
      pivot.add(arm); g.add(pivot); legs.push(pivot);   // os braços balançam junto com as pernas
    }
    return { group: g, legs, mats, wings: [] };
  }
  // Golem de neve: duas bolas de neve, cabeça de abóbora e bracinhos de graveto
  function snowGolemModel() {
    const { g, mats, part } = rig();
    const P = 1.9 / 30;
    const low = part(12 * P, 12 * P, 12 * P, 0xf4f8fb); low.position.y = 6 * P; g.add(low);
    const mid = part(10 * P, 10 * P, 10 * P, 0xeaf0f5); mid.position.y = 17 * P; g.add(mid);
    const head = part(8 * P, 8 * P, 8 * P, 0xdc7819); head.position.y = 26 * P; g.add(head);
    const face = (w, h, x, y) => { const f = part(w * P, h * P, 0.3 * P, 0x2a1a08); f.position.set(x * P, y * P, 4.05 * P); head.add(f); };
    face(2, 2, -2, 1); face(2, 2, 2, 1); face(6, 1.5, 0, -2);
    for (const sx of [-1, 1]) { const a = part(1 * P, 12 * P, 1 * P, 0x6b4a2a); a.position.set(sx * 9 * P, 19 * P, 0); a.rotation.z = -sx * 1.0; g.add(a); }
    return { group: g, legs: [], mats, wings: [] };
  }

  // Monstro em pé (zumbi, esqueleto, enderman). Medidas em "pixels" do Minecraft; a frente aponta pra +z
  function humanoid(o) {
    const g = new THREE.Group(), mats = [];
    const part = (w, h, d, color) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), litMat(color)); mats.push(m.material); return m; };
    const legH = o.legH || 12, armH = o.armH || 12, L = o.limb;
    const P = o.h / (legH + 20);
    const head = part(8 * P, 8 * P, 8 * P, o.skin); head.position.y = (legH + 16) * P; g.add(head);
    for (const sx of [-1, 1]) { const e = part(2 * P, 1.2 * P, 0.3 * P, o.eyes); e.position.set(sx * 2 * P, 0.3 * P, 4.05 * P); head.add(e); }
    const body = part(8 * P, 12 * P, 4 * P, o.shirt); body.position.y = (legH + 6) * P; g.add(body);
    const limb = (color, x, y, len, forward) => {
      const pivot = new THREE.Group(); pivot.position.set(x, y, 0);
      const m = part(L * P, len * P, L * P, color); m.position.y = -len / 2 * P; pivot.add(m);
      if (forward) pivot.rotation.x = -Math.PI / 2;   // braços esticados pra frente
      g.add(pivot);
      return pivot;
    };
    const armL = limb(o.skin, -(4 + L / 2) * P, (legH + 11) * P, armH, o.armsForward);
    limb(o.skin, (4 + L / 2) * P, (legH + 11) * P, armH, o.armsForward);
    if (o.bow) { const bow = part(1 * P, 1 * P, 12 * P, 0x7a5230); bow.position.set(0, -armH * P, 0); bow.rotation.x = Math.PI / 2; armL.add(bow); }
    const legs = [limb(o.pants, -L / 2 * P, legH * P, legH), limb(o.pants, L / 2 * P, legH * P, legH)];
    return { group: g, legs, mats, wings: [] };
  }

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
    return m;
  }
  function removeMob(i) {
    const m = mobs[i];
    scene.remove(m.group);
    m.group.traverse(o => { if (o.geometry) o.geometry.dispose(); });
    for (const mat of m.mats) { litMats.delete(mat); mat.dispose(); }
    mobs.splice(i, 1);
  }
  function clearMobs() {
    while (mobs.length) removeMob(mobs.length - 1);
    for (const a of arrows) { scene.remove(a.mesh); a.mesh.geometry.dispose(); }
    arrows.length = 0;
    for (const f of blasts) { scene.remove(f.mesh); f.mesh.geometry.dispose(); }
    blasts.length = 0;
    for (const b of snowballs) { scene.remove(b.mesh); b.mesh.geometry.dispose(); }
    snowballs.length = 0;
    villagesAwake.clear();
  }
  // Monstros aparecem de noite no mundo normal. No Criativo só andam por aí;
  // no Sobrevivência atacam (empurram, atiram flecha e o creeper explode).
  const monstersOn = () => settings && settings.type === 'normal';
  const monstersAttack = () => settings && settings.mode === 'survival';

  // Monstro te acertou: empurrão e a tela pisca vermelho (não tem vida, então ninguém morre)
  function hurtPlayer(force, from) {
    const away = new THREE.Vector3(player.pos.x - from.x, 0, player.pos.z - from.z);
    if (away.lengthSq() < 1e-4) away.set(1, 0, 0);
    player.knock.copy(away.normalize()).multiplyScalar(force);
    if (!player.fly) player.vel.y = Math.max(player.vel.y, 5);
    if (seated) standUp();
    const flash = $('hurt');
    flash.classList.remove('on'); void flash.offsetWidth; flash.classList.add('on');
  }

  // Flechas do esqueleto
  const arrows = [];
  const arrowMat = new THREE.MeshBasicMaterial({ color: 0x8a6a40 });
  function shootArrow(m) {
    const from = new THREE.Vector3(m.pos.x, m.pos.y + 1.5, m.pos.z);
    const to = new THREE.Vector3(player.pos.x, player.pos.y + 1.2, player.pos.z);
    const dist = from.distanceTo(to);
    const vel = to.sub(from).normalize().multiplyScalar(18);
    vel.y += dist * 0.25;   // mira um pouco pra cima por causa da queda
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.6), arrowMat);
    mesh.position.copy(from);
    scene.add(mesh);
    arrows.push({ mesh, pos: from, vel, life: 5 });
  }
  function updateArrows(dt) {
    for (let i = arrows.length - 1; i >= 0; i--) {
      const a = arrows[i];
      a.vel.y -= 9 * dt;
      a.pos.addScaledVector(a.vel, dt);
      a.life -= dt;
      a.mesh.position.copy(a.pos);
      a.mesh.lookAt(a.pos.x + a.vel.x, a.pos.y + a.vel.y, a.pos.z + a.vel.z);
      const p = player.pos;
      const hit = Math.abs(a.pos.x - p.x) < PW + 0.15 && Math.abs(a.pos.z - p.z) < PW + 0.15 && a.pos.y > p.y && a.pos.y < p.y + PH;
      if (hit) hurtPlayer(6, a.pos.clone().sub(a.vel));
      if (hit || a.life <= 0 || isSolid(Math.floor(a.pos.x), Math.floor(a.pos.y), Math.floor(a.pos.z))) {
        scene.remove(a.mesh); a.mesh.geometry.dispose();
        arrows.splice(i, 1);
      }
    }
  }

  // Bicho levando dano de um golem
  function damageMob(o, dmg, from, force) {
    o.hp -= dmg; o.hurt = 0.35;
    const away = new THREE.Vector3(o.pos.x - from.x, 0, o.pos.z - from.z);
    if (away.lengthSq() < 1e-4) away.set(1, 0, 0);
    o.knock.copy(away.normalize()).multiplyScalar(force);
    o.vel.y = Math.max(o.vel.y, 6);
    o.fuse = 0;
    if (o.hp <= 0) o.dead = true;
  }
  // Bolas de neve do golem de neve
  const snowballs = [];
  const snowMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  function throwSnowball(m, foe) {
    const from = new THREE.Vector3(m.pos.x, m.pos.y + 1.3, m.pos.z);
    const to = new THREE.Vector3(foe.pos.x, foe.pos.y + foe.hh * 0.6, foe.pos.z);
    const dist = from.distanceTo(to);
    const vel = to.sub(from).normalize().multiplyScalar(16);
    vel.y += dist * 0.3;
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.22), snowMat);
    mesh.position.copy(from);
    scene.add(mesh);
    snowballs.push({ mesh, pos: from, vel, life: 3 });
  }
  function updateSnowballs(dt) {
    for (let i = snowballs.length - 1; i >= 0; i--) {
      const b = snowballs[i];
      b.vel.y -= 9 * dt;
      b.pos.addScaledVector(b.vel, dt);
      b.life -= dt;
      b.mesh.position.copy(b.pos);
      const hit = mobs.find(o => MOBS[o.type].hostile && !o.dead && Math.abs(o.pos.x - b.pos.x) < o.hw + 0.2
        && Math.abs(o.pos.z - b.pos.z) < o.hw + 0.2 && b.pos.y > o.pos.y && b.pos.y < o.pos.y + o.hh);
      if (hit) damageMob(hit, 1, b.pos.clone().sub(b.vel), 5);
      if (hit || b.life <= 0 || isSolid(Math.floor(b.pos.x), Math.floor(b.pos.y), Math.floor(b.pos.z))) {
        scene.remove(b.mesh); b.mesh.geometry.dispose();
        snowballs.splice(i, 1);
      }
    }
  }
  // Quando você chega perto de uma vila, os aldeões e o golem de ferro aparecem
  const villagesAwake = new Map();
  function wakeVillages() {
    if (!settings.villages) return;
    const px = player.pos.x, pz = player.pos.z;
    for (const [k, v] of villagesAwake) if (Math.hypot(v.x - px, v.z - pz) > 85) villagesAwake.delete(k);
    for (const v of villagesNear(px - 56, pz - 56, px + 56, pz + 56)) {
      if (villagesAwake.has(v.key) || Math.hypot(v.x - px, v.z - pz) > 56) continue;
      if (!chunks.has(ckey(v.x >> 4, v.z >> 4))) continue;
      villagesAwake.set(v.key, v);
      for (const hs of v.houses) {
        const [fx, , fz] = FRONT[hs.dir];
        const x = hs.x + fx * 4, z = hs.z + fz * 4, y = groundSpot(x, z, 2);
        if (y != null) spawnMob('aldeao', x + 0.5, y, z + 0.5).home = v;
      }
      const gy = groundSpot(v.x + 4, v.z - 1, 3);
      if (gy != null) spawnMob('golem', v.x + 4.5, gy, v.z - 0.5).home = v;
    }
  }

  // Explosão do creeper: empurra tudo em volta e abre buraco só em bloco natural (não estraga construção)
  const NATURAL = new Set([GRASS, DIRT, STONE, SAND, GRAVEL, SNOW, LEAVES, SANDSTONE, MYCELIUM, ICE, CACTUS,
    COAL_ORE, IRON_ORE, GOLD_ORE, DIAMOND_ORE, FLOWER_RED, FLOWER_YELLOW, SHROOM_RED, SHROOM_BROWN]);
  const blasts = [];
  const blastMat = new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.8, depthWrite: false, fog: false });
  function explode(pos) {
    const R = 2.6, cx = Math.floor(pos.x), cy = Math.floor(pos.y + 0.5), cz = Math.floor(pos.z);
    for (let x = cx - 3; x <= cx + 3; x++) for (let y = cy - 3; y <= cy + 3; y++) for (let z = cz - 3; z <= cz + 3; z++) {
      if (Math.hypot(x + 0.5 - pos.x, y + 0.5 - pos.y - 0.5, z + 0.5 - pos.z) > R) continue;
      if (NATURAL.has(getBlock(x, y, z))) setBlock(x, y, z, AIR);
    }
    const d = Math.hypot(player.pos.x - pos.x, player.pos.y - pos.y, player.pos.z - pos.z);
    if (d < 6) { hurtPlayer(16 * (1 - d / 6) + 4, pos); if (!player.fly) player.vel.y = 9; }
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), blastMat.clone());
    mesh.position.set(pos.x, pos.y + 0.8, pos.z);
    scene.add(mesh);
    blasts.push({ mesh, t: 0 });
    toast('BUM! 💥');
  }
  function updateBlasts(dt) {
    for (let i = blasts.length - 1; i >= 0; i--) {
      const f = blasts[i];
      f.t += dt;
      f.mesh.scale.setScalar(1 + f.t * 10);
      f.mesh.material.opacity = Math.max(0, 0.8 - f.t * 2.2);
      if (f.t > 0.4) { scene.remove(f.mesh); f.mesh.geometry.dispose(); f.mesh.material.dispose(); blasts.splice(i, 1); }
    }
  }

  // Lugar de chão com espaço livre em cima (pra monstro nascer ou enderman se teletransportar)
  function groundSpot(x, z, room) {
    if (!inWorld(x >> 4, z >> 4) || !chunks.has(ckey(x >> 4, z >> 4))) return null;
    let y = H - 1;
    while (y > 0 && getBlock(x, y, z) === AIR) y--;
    const top = getBlock(x, y, z);
    if (top === WATER || top === LEAVES || !isSolid(x, y, z)) return null;
    for (let k = 1; k <= room; k++) if (getBlock(x, y + k, z) !== AIR) return null;
    return y + 1;
  }
  let zombieTimer = 0;
  function trySpawnMonster() {
    if (mobs.filter(m => MOBS[m.type].hostile).length >= 8) return;
    const r = Math.random();
    const type = r < 0.35 ? 'zumbi' : r < 0.6 ? 'esqueleto' : r < 0.85 ? 'creeper' : 'enderman';
    const a = Math.random() * Math.PI * 2, d = 16 + Math.random() * 16;
    const x = Math.floor(player.pos.x + Math.cos(a) * d), z = Math.floor(player.pos.z + Math.sin(a) * d);
    const y = groundSpot(x, z, type === 'enderman' ? 3 : 2);
    if (y != null) spawnMob(type, x + 0.5, y, z + 0.5);
  }

  let spawnTimer = 0, villageTimer = 0;
  function trySpawn() {
    const land = mobs.filter(m => !MOBS[m.type].fly && !MOBS[m.type].hostile && !MOBS[m.type].npc && !m.kept).length;
    const bats = mobs.filter(m => MOBS[m.type].fly).length;
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
    zombieTimer -= dt;
    if (monstersOn() && isNight() && zombieTimer <= 0) { zombieTimer = 2.5; trySpawnMonster(); }
    const daytime = !settings.daynight || (time > 0.02 && time < 0.48);
    villageTimer -= dt;
    if (villageTimer <= 0) { villageTimer = 2; wakeVillages(); }
    updateArrows(dt);
    updateBlasts(dt);
    updateSnowballs(dt);
    for (let i = mobs.length - 1; i >= 0; i--) {
      const m = mobs[i], def = MOBS[m.type];
      if (m.dead) { removeMob(i); toast(`${def.name} derrotado! 💪`); continue; }
      const dx = m.pos.x - player.pos.x, dz = m.pos.z - player.pos.z;
      const loaded = chunks.has(ckey(Math.floor(m.pos.x) >> 4, Math.floor(m.pos.z) >> 4));
      // Bicho que você colocou (ovo ou golem montado) não some: fica parado esperando você voltar
      if (m.kept) { if (!loaded) continue; }
      else if (dx * dx + dz * dz > 75 * 75 || !loaded) { removeMob(i); continue; }
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
        let sp = null;   // null = anda como bicho normal
        if (def.hostile) {
          // De manhã os monstros pegam fogo e somem
          if (daytime && !m.kept && Math.random() < dt * 0.6) { removeMob(i); continue; }
          const pdx = player.pos.x - m.pos.x, pdz = player.pos.z - m.pos.z, dist = Math.hypot(pdx, pdz);
          const toPlayer = Math.atan2(pdx, pdz);
          m.attack = (m.attack || 0) - dt;
          const close = Math.abs(player.pos.y - m.pos.y) < 1.8;
          if (m.type === 'zumbi' && dist < 18) {
            m.yaw = toPlayer; sp = def.speed;
            if (monstersAttack() && dist < 1.3 && close && m.attack <= 0) { m.attack = 1; hurtPlayer(7, m.pos); }
            if (dist < 1.5) sp = 0;   // chega perto e para
          } else if (m.type === 'esqueleto' && dist < 20) {
            // Fica de longe e atira
            m.yaw = toPlayer;
            sp = dist > 10 ? def.speed : 0;
            if (dist < 5) { m.yaw = toPlayer + Math.PI; sp = def.speed; }
            if (monstersAttack() && dist < 16 && m.attack <= 0) { m.attack = 2.2; shootArrow(m); m.yaw = toPlayer; }
          } else if (m.type === 'creeper' && dist < 16) {
            // Chega perto, pisca e explode
            m.yaw = toPlayer;
            m.fuse = monstersAttack() && dist < 3 && close ? (m.fuse || 0) + dt : Math.max(0, (m.fuse || 0) - dt);
            sp = m.fuse > 0 || dist < 2 ? 0 : def.speed;
            if (m.fuse >= 1.5) { explode(m.pos); removeMob(i); continue; }
          } else if (m.type === 'enderman') {
            // Anda por aí e se teletransporta; se você bater nele, vem atrás de você
            m.tele = (m.tele == null ? 4 + Math.random() * 8 : m.tele) - dt;
            if (m.angry && dist < 30) {
              m.yaw = toPlayer; sp = def.speed;
              if (monstersAttack() && dist < 1.4 && close && m.attack <= 0) { m.attack = 1; hurtPlayer(9, m.pos); }
              if (dist < 1.6) sp = 0;
            }
            if (m.tele <= 0) {
              m.tele = 6 + Math.random() * 8;
              const base = m.angry ? player.pos : m.pos;
              for (let k = 0; k < 8; k++) {
                const tx = Math.floor(base.x + (Math.random() - 0.5) * 12), tz = Math.floor(base.z + (Math.random() - 0.5) * 12);
                const ty = groundSpot(tx, tz, 3);
                if (ty != null) { m.pos.set(tx + 0.5, ty, tz + 0.5); m.vel.set(0, 0, 0); break; }
              }
            }
          }
        }
        if (def.guard) {
          // Golem: vai atrás do monstro mais perto. O de ferro bate, o de neve joga bola de neve
          let foe = null, best = def.guard === 'snow' ? 12 : 16;
          for (const o of mobs) {
            if (!MOBS[o.type].hostile || o.dead) continue;
            const d = Math.hypot(o.pos.x - m.pos.x, o.pos.z - m.pos.z);
            if (d < best) { best = d; foe = o; }
          }
          m.attack = (m.attack || 0) - dt;
          if (foe) {
            m.yaw = Math.atan2(foe.pos.x - m.pos.x, foe.pos.z - m.pos.z);
            if (def.guard === 'iron') {
              sp = best > 2 ? def.speed * 1.8 : 0;
              if (best < 2.7 && Math.abs(foe.pos.y - m.pos.y) < 2.5 && m.attack <= 0) {
                m.attack = 1.2; m.swing = 0.35;
                damageMob(foe, 6, m.pos, 11);
              }
            } else {
              sp = best > 7 ? def.speed : 0;
              if (m.attack <= 0) { m.attack = 1; throwSnowball(m, foe); }
            }
          }
        }
        if (sp === null && m.timer <= 0) {
          m.timer = 2 + Math.random() * 4;
          m.walking = Math.random() < 0.6;
          m.yaw = Math.random() * Math.PI * 2;
          // Aldeão e golem não vão longe da vila
          if (m.home && Math.hypot(m.home.x - m.pos.x, m.home.z - m.pos.z) > 15) {
            m.yaw = Math.atan2(m.home.x - m.pos.x, m.home.z - m.pos.z);
            m.walking = true;
          }
        }
        if (sp === null) sp = m.flee > 0 ? def.speed * 2.5 : m.walking ? def.speed : 0;
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
        if (m.swing > 0) { m.swing -= dt; m.legs[2].rotation.x = m.legs[3].rotation.x = -1.9; }   // golem levanta os braços
      }
      m.knock.multiplyScalar(Math.pow(0.03, dt));
      m.group.position.copy(m.pos);
      m.group.rotation.y = m.yaw;
    }
  }
  // Bicho machucado fica vermelho por um instante
  const HURT = new THREE.Color(1, 0.1, 0.1);
  function tintMobs() {
    for (const m of mobs) {
      if (m.hurt > 0) for (const mat of m.mats) mat.color.lerp(HURT, 0.6);
      else if (m.fuse > 0 && Math.floor(m.fuse * 8) % 2) for (const mat of m.mats) mat.color.setRGB(1, 1, 1);
    }
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
        if (b !== AIR && b !== WATER) {
          const c = chunks.get(ckey(x >> 4, z >> 4));
          return { x, y, z, nx, ny, nz, t, meta: c ? c.meta[CI(x & 15, y, z & 15)] : 0 };
        }
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
    eye.set(player.pos.x, player.pos.y + (seated ? EYE_SEATED : EYE), player.pos.z);
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
    if (hasPointer && !isTouch && !mouseLook()) {
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
    const held = hotbar[slot];
    m.hp -= isTool(held) ? TOOLS[toolOf(held).type].damage[toolOf(held).mat] : 1;
    m.hurt = 0.35; m.flee = 3;
    const away = new THREE.Vector3(m.pos.x - player.pos.x, 0, m.pos.z - player.pos.z).normalize();
    m.knock.copy(away).multiplyScalar(6);
    m.yaw = Math.atan2(away.x, away.z);
    if (!def.fly) m.vel.y = 5;
    if (def.hostile) { m.flee = 0; m.angry = true; m.fuse = 0; }   // monstro não foge; enderman fica bravo
    if (m.hp <= 0) { removeMob(i); toast(def.hostile ? `${def.name} derrotado! 💪` : `${def.name} sumiu! 💨`); }
    return true;
  }

  function breakBlock() {
    swingHand();
    updateTarget();
    if (hitMob()) return;
    if (!target) return;
    const { x, y, z } = target, id = getBlock(x, y, z);
    if (id === BEDROCK) return;
    setBlock(x, y, z, AIR);
    // A porta tem duas partes: some as duas juntas
    if (id === DOOR && getBlock(x, y + 1, z) === DOOR_TOP) setBlock(x, y + 1, z, AIR);
    if (id === DOOR_TOP && getBlock(x, y - 1, z) === DOOR) setBlock(x, y - 1, z, AIR);
    if (id === LAMP_POST && getBlock(x, y + 1, z) === LAMP_POST_TOP) setBlock(x, y + 1, z, AIR);
    if (id === LAMP_POST_TOP && getBlock(x, y - 1, z) === LAMP_POST) setBlock(x, y - 1, z, AIR);
    // A cama também: pé e cabeceira somem juntos
    if (id === BED || id === BED_HEAD) {
      const [fx, , fz] = FRONT[target.meta & 3], s = id === BED ? -1 : 1;
      const ox = x + fx * s, oz = z + fz * s;
      if (getBlock(ox, y, oz) === (id === BED ? BED_HEAD : BED)) setBlock(ox, y, oz, AIR);
    }
    updateTarget();
  }
  // Dormir: só de noite. A tela escurece e você acorda de manhã
  const isNight = () => settings.daynight && time > 0.5 && time < 0.98;
  let sleeping = false;
  function sleep() {
    if (sleeping) return;
    if (!settings.daynight) { toast('Neste mundo é sempre dia ☀️'); return; }
    if (!isNight()) { toast('Você só pode dormir de noite 🌙'); return; }
    sleeping = true;
    held.place = false;
    const el = $('sleep');
    el.classList.add('on');
    setTimeout(() => {
      time = 0.01;   // nascer do sol
      saveSoon();
    }, 1500);
    setTimeout(() => {
      el.classList.remove('on');
      sleeping = false;
      toast('Bom dia! ☀️');
    }, 2200);
  }
  // Caixa de música, bolo e presente: clicar com o botão direito usa
  let audio = null;
  function playNote(n) {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      const freq = 261.63 * Math.pow(2, [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19, 21, 23, 24][n] / 12);
      const osc = audio.createOscillator(), gain = audio.createGain(), t = audio.currentTime;
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
      osc.connect(gain).connect(audio.destination);
      osc.start(t); osc.stop(t + 0.7);
    } catch (e) { /* sem som: tudo bem */ }
  }
  function useFun(id, x, y, z) {
    const c = chunks.get(ckey(x >> 4, z >> 4));
    const i = CI(x & 15, y, z & 15);
    if (id === NOTE) {
      // Cada clique sobe uma nota (depois do último Dó volta pro começo)
      c.meta[i] = (c.meta[i] + 1) % NOTE_NAMES.length;
      c.modified = c.saveDirty = true;
      playNote(c.meta[i]);
      toast(`♪ ${NOTE_NAMES[c.meta[i]]}`);
      saveSoon();
    } else if (id === CAKE) {
      const bites = c.meta[i] + 1;
      if (bites >= 7) { setBlock(x, y, z, AIR); toast('Acabou o bolo! 😋'); }
      else { setBlock(x, y, z, CAKE, bites); toast('Nham! 🍰'); }
    } else if (id === GIFT) {
      const all = CATEGORIES.filter(cat => cat.items).flatMap(cat => cat.items).filter(it => it !== GIFT);
      const prize = all[Math.floor(Math.random() * all.length)];
      setBlock(x, y, z, AIR);
      giveItem(prize);
      toast(`🎁 Você ganhou: ${itemName(prize)}!`);
    }
  }
  // Sentar na cadeira: o quadril fica no assento e o jogador olha pra frente da cadeira
  const EYE_SEATED = 1.5, HIP = 0.675;
  let seated = null;
  function sitDown(x, y, z) {
    const c = chunks.get(ckey(x >> 4, z >> 4));
    const [fx, , fz] = FRONT[c.meta[CI(x & 15, y, z & 15)] & 3];
    seated = { x, y, z, fx, fz };
    player.fly = false;
    $('b-fly').classList.remove('on');
    document.body.classList.remove('flying');
    player.vel.set(0, 0, 0);
    player.pos.set(x + 0.5, y + 0.5 - HIP, z + 0.5);
    player.yaw = Math.atan2(-fx, -fz);
    keys.clear();
    toast(isTouch ? 'Sentado 🪑  ⬆ levanta' : 'Sentado 🪑  Espaço levanta');
  }
  function standUp() {
    const { x, y, z, fx, fz } = seated;
    seated = null;
    // Levanta na frente da cadeira; se tiver algo ali (a mesa), tenta os lados e atrás
    for (const [dx, dz] of [[fx, fz], [fz, -fx], [-fz, fx], [-fx, -fz]]) {
      player.pos.set(x + dx + 0.5, y, z + dz + 0.5);
      if (!collides(player.pos, PW, PH)) { player.vel.set(0, 0, 0); return; }
    }
    player.pos.set(x + 0.5, y + 1, z + 0.5);
    unstick();
  }
  // Se o jogador ficou dentro de um bloco, procura o lugar livre mais perto (primeiro pra cima)
  function unstick() {
    player.vel.set(0, 0, 0);
    if (!collides(player.pos, PW, PH)) return;
    const bx = Math.floor(player.pos.x), by = Math.floor(player.pos.y), bz = Math.floor(player.pos.z);
    const tries = [];
    for (let r = 0; r <= 3; r++) for (let dy = -1; dy <= 4; dy++) for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) {
      if (Math.max(Math.abs(dx), Math.abs(dz)) === r) tries.push([dx, dy, dz]);
    }
    for (const [dx, dy, dz] of tries) {
      player.pos.set(bx + dx + 0.5, by + dy, bz + dz + 0.5);
      if (!collides(player.pos, PW, PH) && isSolid(bx + dx, by + dy - 1, bz + dz)) return;
    }
    dropToGround();
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
    // Clicar na cama é dormir
    if (hit === BED || hit === BED_HEAD) { sleep(); return; }
    if (hit === NOTE || hit === CAKE || hit === GIFT) { useFun(hit, target.x, target.y, target.z); return; }
    if (hit === CHAIR && !seated) { sitDown(target.x, target.y, target.z); return; }
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
    if (isTool(id)) return;   // arma não se coloca no chão
    if (isEgg(id)) {
      const type = eggType(id);
      const ex = target.x + target.nx, ey = target.y + target.ny, ez = target.z + target.nz;
      const m = spawnMob(type, ex + 0.5, ey + (MOBS[type].fly ? 0.3 : 0), ez + 0.5);
      m.kept = true;
      m.yaw = Math.atan2(player.pos.x - m.pos.x, player.pos.z - m.pos.z);
      swingHand();
      saveSoon();
      return;
    }
    const x = target.x + target.nx, y = target.y + target.ny, z = target.z + target.nz;
    if (!canFill(x, y, z)) return;
    if (BLOCKS[id].solid !== false && blocksPlayer(x, y, z)) return;
    const m = facingMeta();
    if (id === DOOR) {
      if (!canFill(x, y + 1, z) || blocksPlayer(x, y + 1, z)) return;
      setBlock(x, y, z, DOOR, m);
      setBlock(x, y + 1, z, DOOR_TOP, m);
    } else if (id === LAMP_POST) {
      // O poste tem 2 blocos de altura
      if (!canFill(x, y + 1, z)) { toast('Não cabe o poste aqui'); return; }
      setBlock(x, y, z, LAMP_POST, m);
      setBlock(x, y + 1, z, LAMP_POST_TOP, m);
    } else if (id === BED) {
      // A cama tem 2 blocos: o pé fica perto de você e a cabeceira vai pra frente
      const hx = x - FRONT[m][0], hz = z - FRONT[m][2];
      if (!canFill(hx, y, hz) || blocksPlayer(hx, y, hz)) { toast('Não cabe a cama aqui'); return; }
      setBlock(x, y, z, BED, m);
      setBlock(hx, y, hz, BED_HEAD, m);
    } else {
      setBlock(x, y, z, id, id === CAKE || id === NOTE ? 0 : m);
      if (id === PUMPKIN) buildGolem(x, y, z);
    }
    updateTarget();
  }
  // Abóbora em cima de 2 blocos de neve vira golem de neve; em cima de um T de bloco de ferro, golem de ferro
  function buildGolem(x, y, z) {
    const born = (type, msg) => {
      const m = spawnMob(type, x + 0.5, y - 2, z + 0.5);
      m.kept = true;
      m.yaw = Math.atan2(player.pos.x - m.pos.x, player.pos.z - m.pos.z);
      toast(msg);
      saveSoon();
    };
    if (getBlock(x, y - 1, z) === SNOW && getBlock(x, y - 2, z) === SNOW) {
      for (let k = 0; k <= 2; k++) setBlock(x, y - k, z, AIR);
      born('golemNeve', 'Nasceu um golem de neve! ☃️');
      return;
    }
    if (getBlock(x, y - 1, z) !== IRON_BLOCK || getBlock(x, y - 2, z) !== IRON_BLOCK) return;
    for (const [ax, az] of [[1, 0], [0, 1]]) {
      if (getBlock(x + ax, y - 1, z + az) !== IRON_BLOCK || getBlock(x - ax, y - 1, z - az) !== IRON_BLOCK) continue;
      for (let k = 0; k <= 2; k++) setBlock(x, y - k, z, AIR);
      setBlock(x + ax, y - 1, z + az, AIR); setBlock(x - ax, y - 1, z - az, AIR);
      born('golem', 'Nasceu um golem de ferro! 🛡️');
      return;
    }
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
    [BED]: g => { g('#b42d28', 0, 7, 16, 4); g('#f0f0f0', 0, 5, 5, 4); g('#a2824e', 0, 11, 2, 3); g('#a2824e', 14, 11, 2, 3); },
    [TABLE]: g => { g('#a2824e', 1, 5, 14, 2); g('#7a5f38', 2, 7, 2, 8); g('#7a5f38', 12, 7, 2, 8); },
    [CHAIR]: g => { g('#a2824e', 4, 1, 2, 14); g('#a2824e', 4, 9, 8, 2); g('#7a5f38', 10, 11, 2, 4); },
    [TORCH]: g => { g('#6e5028', 7, 6, 2, 10); g('#ff9628', 6, 3, 4, 3); g('#ffe678', 7, 2, 2, 2); },
    [LAMP_POST]: g => { g('#2d2d34', 7, 5, 2, 11); g('#2d2d34', 6, 14, 4, 2); g('#2d2d34', 4, 0, 8, 1); g('#2d2d34', 5, 1, 6, 5); g('#ffd76e', 6, 2, 4, 3); },
    [FENCE]: g => { g('#a2824e', 2, 2, 3, 14); g('#a2824e', 11, 2, 3, 14); g('#8a6a3e', 0, 5, 16, 2); g('#8a6a3e', 0, 10, 16, 2); },
    [WATER]: g => { g('#7a7a80', 3, 4, 10, 11); g('#2d5fc8', 4, 6, 8, 8); g('#5a5a60', 2, 3, 12, 2); },
  };
  // Plantas usam o próprio desenho da textura como ícone
  const SPRITE_ICONS = { [FLOWER_RED]: T.flowerRed, [FLOWER_YELLOW]: T.flowerYellow, [SHROOM_RED]: T.shroomRed, [SHROOM_BROWN]: T.shroomBrown,
                         [FLOWER_POT]: T.potSide, [LANTERN]: T.lantern };
  for (const id of [...PAINTINGS, ...BANNERS, VINE]) SPRITE_ICONS[id] = BLOCKS[id].art;
  SPRITE_ICONS[PATH] = T.pathTop;
  const TOOL_MASKS = [
    ['..............BB', '.............BLB', '............BLB.', '...........BLB..', '..........BLB...',
     '.........BLB....', '........BLB.....', '...G...BLB......', '...GG.BLB.......', '....GGLB........',
     '....HGG.........', '...HH.GG........', '..HH...G........', '.HH.............', 'OH..............', ''],
    ['.....BBBBB......', '...BBLLLLLBB....', '..BLLBBHBBLLB...', '.BLB...HH..BLB..', '.BB....HH...BB..',
     '......HH........', '......HH........', '.....HH.........', '.....HH.........', '....HH..........',
     '....HH..........', '...HH...........', '...HH...........', '..HH............', '..H.............', ''],
  ];
  function drawTool(g, id) {
    const { type, mat } = toolOf(id), col = ARMOR_MATS[mat].color;
    const colors = { B: col.map(v => v * 0.6), L: col, O: col, G: [70, 50, 30], H: [120, 85, 45] };
    TOOL_MASKS[type].forEach((row, y) => [...row].forEach((ch, x) => {
      if (!colors[ch]) return;
      g.fillStyle = rgb(colors[ch].map(Math.round));
      g.fillRect(x, y, 1, 1);
    }));
  }
  const EGG_COLORS = {
    porco: ['#f0a0a0', '#d86a6a'], vaca: ['#443626', '#b5b5b5'], ovelha: ['#e7e7e7', '#ffb5b5'], galinha: ['#a8a8a8', '#e02020'],
    coguvaca: ['#a00f10', '#c8c8c8'], morcego: ['#4c3e30', '#141414'], aldeao: ['#563c33', '#bd8b72'], golem: ['#d8d2c6', '#74a332'],
    golemNeve: ['#f0f8fb', '#e08a2a'], zumbi: ['#00afaf', '#799c65'], esqueleto: ['#c1c1c1', '#494949'], creeper: ['#0da70b', '#111111'],
    enderman: ['#161616', '#8a3ab0'],
  };
  function drawEgg(g, id) {
    const [base, spot] = EGG_COLORS[eggType(id)];
    for (let y = 1; y < 16; y++) for (let x = 0; x < 16; x++) {
      const ry = y < 9 ? 7.5 : 6;
      if (((x - 7.5) / 5.4) ** 2 + ((y - 9) / ry) ** 2 > 1) continue;
      const sx = x >> 1, sy = y >> 1;
      g.fillStyle = (sx * 5 + sy * 3) % 7 === 0 ? spot : base;
      g.fillRect(x, y, 1, 1);
    }
    g.fillStyle = 'rgba(255,255,255,.45)'; g.fillRect(5, 4, 2, 2);
  }
  function makeIcon(entry) {
    const c = document.createElement('canvas');
    c.width = c.height = 16;
    const g = c.getContext('2d');
    if (entry.id != null && isTool(entry.id)) { drawTool(g, entry.id); return c; }
    if (entry.id != null && isEgg(entry.id)) { drawEgg(g, entry.id); return c; }
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

  // Arma na mão, no canto da tela
  const handEl = $('hand');
  function updateHand() {
    const id = hotbar[slot];
    handEl.innerHTML = '';
    if (id != null && (isTool(id) || isEgg(id))) handEl.appendChild(makeIcon({ id }));
  }
  function swingHand() {
    handEl.classList.remove('swing');
    void handEl.offsetWidth;   // reinicia a animação
    handEl.classList.add('swing');
  }
  function renderHotbar() {
    updateHand();
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
    toast(hotbar[slot] != null ? itemName(hotbar[slot]) : 'Vazio');
  }
  function setFly(on) {
    if (on && settings && settings.mode === 'survival') { toast('No modo Sobrevivência não dá pra voar'); return; }
    player.fly = on;
    player.vel.y = 0;
    $('b-fly').classList.toggle('on', on);
    document.body.classList.toggle('flying', on);
    toast(on ? (isTouch ? 'Voando 🕊  ⬆ sobe · ⬇ desce' : 'Voando 🕊  Espaço sobe · Shift desce') : 'Andando');
  }
  function toggleCamera() {
    thirdPerson = !thirdPerson;
    $('b-cam').classList.toggle('on', thirdPerson);
    toast(thirdPerson ? 'Câmera de trás' : 'Câmera normal');
  }

  // ── Inventário (modo criativo) ────────────────────────────
  const invEl = $('inv'), invGrid = $('inv-grid'), invTabs = $('inv-tabs'), invName = $('inv-name');
  const armorSide = $('inv-armor'), armorSlotsEl = $('armor-slots'), previewEl = $('preview');
  let invOpen = false, invCat = 0, armorView = 'armor';

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
    if (cat.armor && armorView === 'weapons') {
      const back = document.createElement('button');
      back.className = 'item special';
      back.textContent = '← Armaduras';
      back.addEventListener('click', () => { armorView = 'armor'; renderInventory(); });
      invGrid.appendChild(back);
      ARMOR_MATS.forEach((mat, m) => TOOLS.forEach((tool, t) => {
        const id = toolId(t, m);
        invGrid.appendChild(itemButton({ id }, itemName(id), () => giveItem(id)));
      }));
    }
    if (cat.armor) {
      if (armorView === 'armor') ARMOR_MATS.forEach((mat, m) => ARMOR_PIECES.forEach((piece, p) => {
        const label = `${piece} ${mat.name}`;
        invGrid.appendChild(itemButton({ armor: true, piece: p, mat: m }, label, () => {
          armor[p] = armor[p] === m ? -1 : m;   // clicar de novo tira
          toast(armor[p] === m ? `Vestiu: ${label}` : `Tirou: ${label}`);
          updateArmorLook(); renderInventory(); saveSoon();
        }, armor[p] === m));
      }));
      if (armorView === 'armor') {
        const weapons = document.createElement('button');
        weapons.className = 'item special';
        weapons.textContent = '⚔️ Armas';
        weapons.title = 'Espadas e picaretas';
        weapons.addEventListener('click', () => { armorView = 'weapons'; renderInventory(); });
        invGrid.appendChild(weapons);
      }
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
      for (const id of cat.items) invGrid.appendChild(itemButton({ id }, itemName(id), () => giveItem(id)));
    }
  }

  // Coloca o bloco na barra: no espaço escolhido se estiver vazio, senão no primeiro vazio
  function giveItem(id) {
    let i = hotbar[slot] == null ? slot : hotbar.indexOf(null);
    if (i < 0) i = slot;
    hotbar[i] = id;
    slot = i;
    renderHotbar();
    toast(itemName(id));
    saveSoon();
  }

  function toggleInventory(force) {
    invOpen = force !== undefined ? force : !invOpen;
    invEl.classList.toggle('hidden', !invOpen);
    if (!invOpen && document.activeElement && document.activeElement.blur) document.activeElement.blur();
    keys.clear();
    if (invOpen) { renderInventory(); invName.textContent = 'Clique num item pra colocar na barra'; }
    // No controle com mouse, solta o cursor pra clicar nos itens e prende de novo ao fechar
    if (invOpen && locked()) document.exitPointerLock();
    if (!invOpen && playing) lockMouse();
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
    ? '<b>Joystick</b> anda · <b>arrastar</b> a tela olha<br><b>⛏</b> quebra · <b>🧱</b> coloca (na cama, dorme) · <b>⬆</b> pula · <b>🕊</b> voa (⬆ sobe, ⬇ desce) · <b>👁</b> câmera<br>Toque no <b>🎒</b> pra escolher blocos e armaduras'
    : '<b>← →</b> giram a tela · <b>↑ ↓</b> ou <b>W S</b> anda · <b>A D</b> anda de lado<br><b>Q E</b> olham pra cima e pra baixo · <b>R</b> olha reto · <b>Espaço</b> pula (e nada) · <b>Shift</b> corre<br><b>Clique esquerdo</b> quebra (e bate nos bichos) · <b>Clique direito</b> coloca (na cama dorme, na cadeira senta)<br><b>🎒</b> ou <b>I</b> abre os blocos · <b>1-9</b> escolhe · <b>F</b> ou <b>Espaço 2x</b> voa (Espaço sobe, Shift desce) · <b>V</b> câmera de trás<br><b>P</b> ou <b>Esc</b> pausa';
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
      d.innerHTML = `<b></b><span>${w.type === 'flat' ? 'Plano' : 'Normal'} · ${w.mode === 'survival' ? 'Sobrevivência' : 'Criativo'} · ${when}</span>`;
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
    villages: v => `Vilas: ${v ? 'Sim' : 'Não'}`,
    daynight: v => `Dia e noite: ${v ? 'Sim' : 'Sempre dia'}`,
    infinite: v => `Tamanho: ${v ? 'Infinito' : 'Pequeno'}`,
  };
  function resetCreate() {
    opts = { type: 'normal', mode: 'creative', control: 'arrows', caves: true, water: true, animals: true, villages: true, daynight: true, infinite: true };
    $('c-name').value = 'Novo mundo' + (worldList().length ? ' ' + (worldList().length + 1) : '');
    $('c-seed').value = '';
    renderCreate();
  }
  function renderCreate() {
    $('c-type').textContent = `Tipo de mundo: ${opts.type === 'flat' ? 'Plano' : 'Normal'}`;
    $('c-mode').textContent = `Modo de jogo: ${opts.mode === 'survival' ? 'Sobrevivência' : 'Criativo'}`;
    $('c-control').textContent = controlLabel(opts.control);
    $('c-desc').textContent = (opts.type === 'flat'
      ? 'Tudo liso, sem morros, árvores nem nada. Ótimo pra construir!'
      : 'Morros, árvores, praias e biomas: floresta, deserto, neve e ilha de cogumelos.') + ' ' + (opts.mode === 'survival'
      ? (opts.type === 'flat' ? 'Sobrevivência: sem voar (monstros só aparecem no mundo normal).' : 'Sobrevivência: de noite os monstros atacam (zumbi, esqueleto, creeper e enderman), e não dá pra voar.')
      : (opts.type === 'flat' ? 'Criativo: voa à vontade.' : 'Criativo: voa, e os monstros da noite não atacam.'));
    document.querySelectorAll('[data-opt]').forEach(b => {
      const k = b.dataset.opt;
      const off = opts.type === 'flat' && (k === 'caves' || k === 'water' || k === 'villages');
      b.disabled = off;
      b.textContent = off ? OPT_LABELS[k](false) : OPT_LABELS[k](opts[k]);
    });
  }
  $('c-type').addEventListener('click', () => { opts.type = opts.type === 'flat' ? 'normal' : 'flat'; renderCreate(); });
  $('c-mode').addEventListener('click', () => { opts.mode = opts.mode === 'survival' ? 'creative' : 'survival'; renderCreate(); });
  $('c-control').addEventListener('click', () => { opts.control = opts.control === 'mouse' ? 'arrows' : 'mouse'; renderCreate(); });
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
    createWorld(name, { ...opts, caves: !flat && opts.caves, water: !flat && opts.water, villages: !flat && opts.villages, seed: s });
  });

  function resetWorldState() {
    for (const c of chunks.values()) disposeMeshes(c);
    chunks.clear();
    remesh.clear();
    villageCache.clear();
    clearMobs();
    thirdPerson = false;
    seated = null;
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
    list.push({ id, name, type: o.type, mode: o.mode, last: Date.now() });
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
    hotbar = Array.isArray(data.hotbar) ? data.hotbar.slice(0, 9).map(validItem) : Array(9).fill(null);
    while (hotbar.length < 9) hotbar.push(null);
    armor = Array.isArray(data.armor) ? data.armor.slice(0, 4).map(m => (ARMOR_MATS[m] ? m : -1)) : [-1, -1, -1, -1];
    slot = data.slot || 0;
    player.pos.set(data.p[0], data.p[1], data.p[2]);
    player.yaw = data.p[3] || 0; player.fly = !!data.p[4];
    for (const [t, x, y, z] of Array.isArray(data.mobs) ? data.mobs : []) if (MOBS[t]) spawnMob(t, x, y, z).kept = true;
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
    document.body.classList.toggle('flying', player.fly);
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
    if (locked()) document.exitPointerLock();
    document.body.classList.remove('mouselook');
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
  let lastSpace = 0;

  // Controle com mouse (igual ao Minecraft): o cursor some e mexer o mouse vira a tela
  const controlLabel = c => `Controle: ${c === 'mouse' ? 'Mouse' : 'Setinhas'}`;
  const mouseLook = () => !isTouch && settings && settings.control === 'mouse';
  const locked = () => document.pointerLockElement === canvas;
  function lockMouse() {
    if (!mouseLook() || locked()) return;
    try {
      const r = canvas.requestPointerLock();
      if (r && r.catch) r.catch(() => toast('Clique na tela pra controlar com o mouse'));
    } catch (e) { /* navegador sem suporte */ }
  }
  function applyControl() {
    document.body.classList.toggle('mouselook', !!mouseLook());
    $('p-control').textContent = controlLabel(settings && settings.control);
    if (!mouseLook() && locked()) document.exitPointerLock();
  }
  $('p-control').addEventListener('click', () => {
    if (!settings) return;
    settings.control = settings.control === 'mouse' ? 'arrows' : 'mouse';
    applyControl();
    saveWorld();
  });
  document.addEventListener('pointerlockchange', () => {
    // Apertou Esc com o mouse preso: o navegador solta o mouse, então pausa
    if (!locked() && playing && !invOpen && mouseLook()) pause();
  });

  function startPlaying() {
    // Tira o foco do botão clicado, senão o Espaço "aperta" ele de novo em vez de pular/voar
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    playing = true;
    showScreen(null);
    applyControl();
    lockMouse();
  }
  function pause() {
    if (!inGame) return;
    playing = false;
    if (locked()) document.exitPointerLock();
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
    if (mouseLook() && !locked()) { lockMouse(); return; }   // primeiro clique só prende o mouse
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
    if (locked()) { if (playing && !invOpen) look(e.movementX, e.movementY, 0.0025); return; }
    pointer.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
    hasPointer = true;
  });
  document.addEventListener('mouseleave', () => { hasPointer = false; });
  window.addEventListener('wheel', e => {
    if (playing && !invOpen) selectSlot(slot + (e.deltaY > 0 ? 1 : -1));
  }, { passive: true });

  window.addEventListener('keydown', e => {
    if (!inGame) return;
    // Atalhos com Command/Control (print, salvar...) não são do jogo. No Mac, segurando Command o
    // navegador não avisa quando você solta as outras teclas, aí o boneco ficava andando sozinho.
    if (e.metaKey || e.ctrlKey || e.code.startsWith('Meta') || e.code.startsWith('Control')) { keys.clear(); return; }
    if (!playing) { if (e.code === 'Escape' || e.code === 'KeyP') startPlaying(); return; }
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab', 'PageUp', 'PageDown'].includes(e.code)) e.preventDefault();
    if (e.code === 'KeyI' || e.code === 'Tab') { toggleInventory(); return; }
    if (invOpen) { if (e.code === 'Escape') toggleInventory(false); return; }
    if (e.code === 'Escape' || e.code === 'KeyP') { pause(); return; }
    keys.add(e.code);
    if (/^Digit[1-9]$/.test(e.code)) selectSlot(Number(e.code.slice(5)) - 1);
    if (e.code === 'KeyF') setFly(!player.fly);
    // Apertar Espaço duas vezes rápido liga/desliga o voo (igual ao Minecraft)
    if (e.code === 'Space' && !e.repeat) {
      const now = performance.now();
      if (now - lastSpace < 300) { setFly(!player.fly); lastSpace = 0; } else lastSpace = now;
    }
    if (e.code === 'KeyV') toggleCamera();
    if (e.code === 'KeyR') { player.pitch = 0; toast('Olhando reto'); }
  });
  window.addEventListener('keyup', e => {
    if (e.code.startsWith('Meta') || e.code.startsWith('Control')) keys.clear();
    else keys.delete(e.code);
  });
  window.addEventListener('blur', () => keys.clear());
  document.addEventListener('visibilitychange', () => keys.clear());

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
  touchButton('b-down', () => { touchState.down = true; }, () => { touchState.down = false; });
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
    const sunset = Math.max(0, 1 - Math.abs(sh) / 0.3);   // 1 com o sol no horizonte
    skyUniforms.horizon.value.copy(SKY_NIGHT).lerp(SKY_DAY, day);
    skyUniforms.top.value.copy(TOP_NIGHT).lerp(TOP_DAY, day);
    skyUniforms.sunset.value = sunset;
    skyUniforms.sunDir.value.set(Math.cos(ang), sh, 0).normalize();
    // A neblina no horizonte acompanha as cores do pôr do sol
    skyCol.copy(skyUniforms.horizon.value).lerp(SUNSET_PINK, sunset * 0.45).lerp(SUNSET_ORANGE, sunset * 0.25);

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
    skyDome.visible = !underwater;
    skyDome.position.copy(camera.position);

    const lit = Math.pow(light, 2.2);   // material trabalha em cor linear
    blockMat.color.setScalar(lit);
    waterMat.color.setScalar(lit);
    cloudMat.color.setRGB(1, 1, 1).lerp(CLOUD_SUNSET, sunset * 0.8).multiplyScalar(Math.max(0.15, lit));
    for (const m of litMats) m.color.copy(m.userData.base).multiplyScalar(lit);

    sky.position.copy(camera.position);
    sun.position.set(Math.cos(ang) * 150, sh * 150, 0);
    // Perto do horizonte o sol fica maior e alaranjado
    sun.scale.setScalar(1 + sunset * 0.5);
    sun.material.color.setRGB(1, 0.95, 0.63).lerp(SUNSET_ORANGE, sunset * 0.7);
    sunGlow.position.copy(sun.position).multiplyScalar(1.02);
    sunGlow.lookAt(camera.position);
    sunGlow.material.opacity = 0.35 + sunset * 0.65;
    sunGlow.material.color.setRGB(1, 0.85, 0.5).lerp(SUNSET_ORANGE, sunset * 0.6);
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
    // Setas ← → giram a tela (igual ao Contra-Ataque)
    const turn = (keys.has('ArrowLeft') ? 1 : 0) - (keys.has('ArrowRight') ? 1 : 0);
    if (turn) player.yaw += turn * 2.3 * dt;
    // Q / E (ou Page Up / Page Down) olham pra cima e pra baixo, e a tela fica onde você deixar
    const tilt = (keys.has('KeyQ') || keys.has('PageUp') ? 1 : 0) - (keys.has('KeyE') || keys.has('PageDown') ? 1 : 0);
    if (tilt) player.pitch = Math.max(-1.55, Math.min(1.55, player.pitch + tilt * 1.6 * dt));

    // Sentado na cadeira: não anda; Espaço, Shift ou tecla de andar levanta
    const standKeys = ['Space', 'ShiftLeft', 'ShiftRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown'];
    if (seated && (standKeys.some(k => keys.has(k)) || touchState.jump || touchState.joyId !== null
        || getBlock(seated.x, seated.y, seated.z) !== CHAIR)) standUp();

    if (!seated && collides(player.pos, PW, PH)) unstick();   // ficou preso dentro de um bloco

    if (!seated) {
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
      const under = getBlock(px, Math.floor(player.pos.y - 0.05), pz);
      if (under === SPEED && !player.fly) speed *= 2.2;   // pista rápida
      if (inWater && !player.fly) speed *= 0.55;

      player.vel.x = wish.x * speed;
      player.vel.z = wish.z * speed;
      if (player.fly) {
        player.vel.y = (jump ? FLY : 0) - (shift || touchState.down ? FLY : 0);
      } else if (inWater) {
        // Nadar: afunda devagar, Espaço sobe
        player.vel.y = jump ? 3.6 : Math.max(player.vel.y - 9 * dt, -2.5);
      } else {
        player.vel.y = Math.max(player.vel.y - GRAVITY * dt, -40);
        if (jump && player.onGround) player.vel.y = JUMP;
      }

      const ox = player.pos.x, oz = player.pos.z;
      const hitX = moveBody(player, 'x', (player.vel.x + player.knock.x) * dt);
      const hitZ = moveBody(player, 'z', (player.vel.z + player.knock.z) * dt);
      player.knock.multiplyScalar(Math.pow(0.02, dt));
      const hitY = moveBody(player, 'y', player.vel.y * dt);
      player.onGround = hitY && player.vel.y < 0;
      const fallSpeed = player.vel.y;
      if (hitY) player.vel.y = 0;
      // Trampolim: quica quando cai em cima, e pulando nele vai bem alto
      if (player.onGround && !player.fly && getBlock(Math.floor(player.pos.x), Math.floor(player.pos.y - 0.05), Math.floor(player.pos.z)) === SLIME) {
        if (jump) player.vel.y = 16;
        else if (fallSpeed < -4) player.vel.y = Math.min(-fallSpeed * 0.8, 20);
        if (player.vel.y > 0) player.onGround = false;
      }
      player.walk += Math.hypot(player.pos.x - ox, player.pos.z - oz);
      // Pulo automático quando esbarra num degrau de 1 bloco (e sair da água pela beirada)
      if ((hitX || hitZ) && (player.onGround || inWater) && !player.fly && wish.lengthSq() > 0.1) {
        const test = player.pos.clone();
        test.y += 1.05;
        test.addScaledVector(wish, 0.3);
        if (!collides(test, PW, PH)) player.vel.y = inWater ? 6 : JUMP;
      }
      if (player.pos.y < -10) respawn();
    }

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
    if (seated) {
      // Pernas pra frente e braços apoiados, como sentado
      legL.rotation.x = legR.rotation.x = Math.PI / 2;
      armL.rotation.x = armR.rotation.x = 0.5;
      return;
    }
    legL.rotation.x = swing; legR.rotation.x = -swing;
    armL.rotation.x = -swing; armR.rotation.x = swing;
  }

  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (inGame) {
      if (playing && !invOpen && !sleeping) update(dt);
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

  // Só pra testar: abrindo a página com #debug no endereço dá pra espiar o jogo pelo console
  if (location.hash === '#debug') {
    window.mbDebug = { mobs, player, arrows, keys, setTime: t => { time = t; }, villagesNear, getBlock, setBlock, buildGolem, give: id => { hotbar[slot] = id; renderHotbar(); }, place: () => placeBlock(), look: (y, p) => { player.yaw = y; player.pitch = p; }, step: (n = 20) => { for (let i = 0; i < n; i++) update(0.05); } };
  }

  // ── Início ────────────────────────────────────────────────
  migrateLegacy();
  renderHotbar();
  drawPreview();
  showScreen('title');
  requestAnimationFrame(frame);
})();
