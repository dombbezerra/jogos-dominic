// ═══════════════════════════════════════════════════════════════════════════
//  NOCAUTE! — boxe cartoon anos 30 (estilo borracha-mangueira)
// ═══════════════════════════════════════════════════════════════════════════

const cv  = document.getElementById('tela');
const ctx = cv.getContext('2d');
const W = 960, H = 540;
const FLOOR = 468;                       // linha do chão do ringue

// ── Paleta sépia ──────────────────────────────────────────────────────────
const INK    = '#1a1410';
const PAPER  = '#e8d9b5';
const CREAM  = '#f6efdc';
const RED    = '#c9342b';
const BLUE   = '#2f5fa8';
const GOLD   = '#e8b53a';
const GREEN  = '#4a8b3b';
const PURPLE = '#7b4397';
const ORANGE = '#d97b28';

const isTouch = matchMedia('(hover: none) and (pointer: coarse)').matches;
if (isTouch) document.body.classList.add('touch');

// ── "Boil": tremidinha de desenho feito à mão ─────────────────────────────
let boil = 0, boilT = 0;
function bj(id) {
  const n = Math.sin(id * 127.1 + boil * 311.7) * 43758.5453;
  return ((n - Math.floor(n)) - .5) * 2.0;
}

// ── Jogo sem som ──────────────────────────────────────────────────────────
function ensureAudio() {}
const nop = () => {};
const sfx = { whoosh: nop, hit: nop, block: nop, ko: nop, bell: nop, ui: nop };

// ── Entrada ───────────────────────────────────────────────────────────────
const keys = {};
const touchBtn = { left: 0, right: 0, jab: 0, cross: 0, upper: 0, block: 0 };
const pressed = {};                       // "edge" de teclas/botões

addEventListener('keydown', e => {
  if (!keys[e.code]) pressed[e.code] = true;
  keys[e.code] = true;
  if (['Space','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.code)) e.preventDefault();
  ensureAudio();
  if (state !== 'fight') advance();
});
addEventListener('keyup', e => { keys[e.code] = false; });

function bindTouch(id, prop) {
  const el = document.getElementById(id);
  if (!el) return;
  const on  = e => { e.preventDefault(); ensureAudio(); touchBtn[prop] = 1; if (state !== 'fight') advance(); };
  const off = e => { e.preventDefault(); touchBtn[prop] = 0; };
  el.addEventListener('touchstart', on,  { passive: false });
  el.addEventListener('touchend',   off, { passive: false });
  el.addEventListener('touchcancel',off, { passive: false });
  el.addEventListener('mousedown',  on);
  el.addEventListener('mouseup',    off);
  el.addEventListener('mouseleave', off);
}
bindTouch('t-left','left'); bindTouch('t-right','right'); bindTouch('t-jab','jab');
bindTouch('t-cross','cross'); bindTouch('t-upper','upper'); bindTouch('t-block','block');

cv.addEventListener('pointerdown', () => { ensureAudio(); if (state !== 'fight') advance(); });

const held = {
  left:  () => keys.KeyA || keys.ArrowLeft  || touchBtn.left,
  right: () => keys.KeyD || keys.ArrowRight || touchBtn.right,
  block: () => keys.KeyS || keys.ArrowDown  || keys.ShiftLeft || touchBtn.block,
};
// disparos de soco (só na transição de solto → apertado)
const fired = { jab: 0, cross: 0, upper: 0 };
function pollAttacks() {
  fired.jab   = (pressed.KeyJ || pressed.KeyZ || (touchBtn.jab   && !lastT.jab))   ? 1 : 0;
  fired.cross = (pressed.KeyK || pressed.KeyX || (touchBtn.cross && !lastT.cross)) ? 1 : 0;
  fired.upper = (pressed.KeyL || pressed.KeyC || (touchBtn.upper && !lastT.upper)) ? 1 : 0;
  lastT.jab = touchBtn.jab; lastT.cross = touchBtn.cross; lastT.upper = touchBtn.upper;
  for (const k in pressed) delete pressed[k];
}
const lastT = { jab: 0, cross: 0, upper: 0 };

// ═══════════════════════════════════════════════════════════════════════════
//  GOLPES
// ═══════════════════════════════════════════════════════════════════════════
const MIN_GAP = 132;          // não deixa os dois se atravessarem
const MOVES = {
  jab:   { wind: 4,  act: 4, rec: 9,  dmg: 4.5, reach: 176, cost: 7,  push: 4,  stun: 10, name: 'JAB' },
  cross: { wind: 9,  act: 5, rec: 16, dmg: 9.5, reach: 190, cost: 14, push: 10, stun: 18, name: 'DIRETO' },
  upper: { wind: 14, act: 6, rec: 24, dmg: 16,  reach: 158, cost: 22, push: 16, stun: 30, name: 'UPPER', breaks: true },
};

// ── Lutadores ─────────────────────────────────────────────────────────────
const ROSTER = [
  { id:'balao', name:'BALÃO BILL',   body: BLUE,   trim: CREAM,  head:'balloon', hp: 100, ai:{ react: 34, aggr: .30, guard: .22, range: 160 }, taunt:'Devagar, mas pesado.' },
  { id:'tigre', name:'TIGRE TONI',   body: ORANGE, trim: '#3a2a18', head:'cat',  hp: 115, ai:{ react: 20, aggr: .52, guard: .38, range: 175 }, taunt:'Rápido feito relâmpago!' },
  { id:'rei',   name:'REI DO RINGUE',body: PURPLE, trim: GOLD,   head:'king',    hp: 140, ai:{ react: 12, aggr: .68, guard: .52, range: 190 }, taunt:'Ninguém nunca o derrubou.' },
];

function makeFighter(cfg) {
  return {
    x: cfg.x, dir: cfg.dir, isPlayer: !!cfg.isPlayer,
    name: cfg.name, body: cfg.body, trim: cfg.trim, head: cfg.head,
    hpMax: cfg.hp, hp: cfg.hp, st: 100,
    state: 'idle', t: 0, move: null, hitDone: false,
    vx: 0, bob: Math.random() * 6, flash: 0, downs: 0,
    ai: cfg.ai || null, aiTimer: 0, aiPlan: null, scale: cfg.scale || 1.12,
  };
}

let player, foe, foeIdx = 0;

// ═══════════════════════════════════════════════════════════════════════════
//  ESTADO DO JOGO
// ═══════════════════════════════════════════════════════════════════════════
let state = 'title';        // title | intro | fight | ko | win | gameover
let msg = '', msgSub = '', msgT = 0;
let shake = 0, hitStop = 0, slowmo = 0;
const fx = [];              // faíscas, estrelas, textos "POW!"
let bellT = 0;

function startTournament() {
  foeIdx = 0;
  player = makeFighter({ x: 330, dir: 1, isPlayer: true, name: 'COPO', body: RED, trim: CREAM, head: 'cup', hp: 100 });
  nextFight();
}
function nextFight() {
  const c = ROSTER[foeIdx];
  foe = makeFighter({ x: 630, dir: -1, name: c.name, body: c.body, trim: c.trim, head: c.head, hp: c.hp, ai: c.ai, scale: c.id === 'rei' ? 1.3 : 1.12 });
  player.x = 330; player.hp = Math.min(player.hpMax, player.hp + 35); player.st = 100;
  player.state = 'idle'; player.t = 0; player.downs = 0;
  state = 'intro'; msgT = 0;
  msg = 'LUTA ' + (foeIdx + 1); msgSub = c.name;
  sfx.bell();
}
function advance() {
  if (state === 'title')      { startTournament(); sfx.ui(); }
  else if (state === 'intro' && msgT > 40) { state = 'fight'; sfx.bell(); }
  else if (state === 'ko' && msgT > 70) {
    if (player.hp <= 0) { state = 'gameover'; msg = 'DERROTA'; msgSub = 'aperte para tentar de novo'; msgT = 0; }
    else if (foeIdx >= ROSTER.length - 1) { state = 'win'; msg = 'CAMPEÃO!'; msgSub = 'você limpou o ringue'; msgT = 0; }
    else { foeIdx++; nextFight(); }
  }
  else if ((state === 'gameover' || state === 'win') && msgT > 50) { state = 'title'; msgT = 0; sfx.ui(); }
}

// ═══════════════════════════════════════════════════════════════════════════
//  COMBATE
// ═══════════════════════════════════════════════════════════════════════════
const busy = f => ['jab','cross','upper','hit','down','ko'].includes(f.state);

function tryMove(f, key) {
  const m = MOVES[key];
  if (busy(f) || f.st < m.cost) return false;
  f.state = key; f.move = m; f.t = 0; f.hitDone = false;
  f.st -= m.cost;
  sfx.whoosh();
  return true;
}

function gap() { return Math.abs(player.x - foe.x); }

function resolveHit(att, def) {
  const m = att.move;
  if (gap() > m.reach) return;

  const blocking = def.state === 'block' && !m.breaks;
  let dmg = m.dmg;

  if (blocking) {
    dmg *= .18;
    def.st = Math.max(0, def.st - m.cost * .55);
    sfx.block();
    spark(def.x - def.dir * 46, FLOOR - 150, 6, GOLD);
    def.x += att.dir * m.push * .4;
    shake = Math.max(shake, 3);
  } else {
    def.hp -= dmg;
    def.flash = 8;
    def.state = 'hit'; def.t = 0;
    def.stunFor = m.stun;
    def.x += att.dir * m.push;
    sfx.hit();
    spark(def.x - def.dir * 52, FLOOR - 160, 12, RED);
    popup(def.x, FLOOR - 230, m === MOVES.upper ? 'POW!' : m === MOVES.cross ? 'BAM!' : 'PAF!');
    shake = Math.max(shake, m === MOVES.upper ? 16 : m === MOVES.cross ? 10 : 6);
    hitStop = m === MOVES.upper ? 8 : 4;

    if (def.hp <= 0) {
      def.hp = 0; def.state = 'down'; def.t = 0; def.downs++;
      sfx.ko();
      shake = 22; slowmo = 60;
      state = 'ko'; msgT = 0;
      msg = 'NOCAUTE!'; msgSub = def.isPlayer ? foe.name + ' venceu' : player.name + ' venceu';
      for (let i = 0; i < 24; i++) spark(def.x, FLOOR - 170, 1, i % 2 ? GOLD : CREAM);
    }
  }
  // limita ao ringue
  def.x = Math.max(150, Math.min(810, def.x));
}

function spark(x, y, n, col) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, s = 2 + Math.random() * 6;
    fx.push({ k: 'p', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 2, life: 22 + Math.random() * 14, col });
  }
}
function popup(x, y, txt) { fx.push({ k: 't', x, y, txt, life: 34, vy: -1.4 }); }

// ── Passo de um lutador ───────────────────────────────────────────────────
function stepFighter(f, opp) {
  f.t++; f.bob += .09;
  if (f.flash > 0) f.flash--;
  f.dir = f.x < opp.x ? 1 : -1;

  // fôlego
  const rest = (f.state === 'idle' || f.state === 'walk');
  f.st = Math.min(100, f.st + (rest ? .55 : .16));

  switch (f.state) {
    case 'jab': case 'cross': case 'upper': {
      const m = f.move;
      if (f.t > m.wind && f.t <= m.wind + m.act && !f.hitDone) {
        f.hitDone = true;
        resolveHit(f, opp);
      }
      if (f.t >= m.wind + m.act + m.rec) { f.state = 'idle'; f.t = 0; }
      break;
    }
    case 'hit':
      if (f.t >= (f.stunFor || 14)) { f.state = 'idle'; f.t = 0; }
      break;
    case 'down':
      if (f.t > 90) { f.state = 'ko'; f.t = 0; }
      break;
    case 'block':
      f.st = Math.min(100, f.st + .05);
      break;
  }

  // atrito / empurrão
  f.x += f.vx; f.vx *= .8;
  f.x = Math.max(150, Math.min(810, f.x));
}

// ── Controle do jogador ───────────────────────────────────────────────────
function controlPlayer() {
  const f = player;
  if (busy(f)) return;

  if (held.block()) { if (f.state !== 'block') { f.state = 'block'; f.t = 0; } }
  else if (f.state === 'block') { f.state = 'idle'; f.t = 0; }

  if (f.state === 'block') return;

  let mv = 0;
  if (held.left())  mv -= 1;
  if (held.right()) mv += 1;
  if (mv) {
    const nx = f.x + mv * 3.4;
    if (Math.abs(nx - foe.x) > MIN_GAP) { f.x = nx; f.state = 'walk'; }
  } else if (f.state === 'walk') f.state = 'idle';
  f.x = Math.max(150, Math.min(810, f.x));

  if (fired.upper) tryMove(f, 'upper');
  else if (fired.cross) tryMove(f, 'cross');
  else if (fired.jab) tryMove(f, 'jab');
}

// ── Inteligência do adversário ────────────────────────────────────────────
function controlFoe() {
  const f = foe, a = f.ai;
  if (busy(f)) return;
  f.aiTimer--;

  const d = gap();
  const pAttacking = ['jab','cross','upper'].includes(player.state);

  // defende quando vê o soco chegando
  if (pAttacking && player.t <= player.move.wind + 1 && d < player.move.reach + 10) {
    if (Math.random() < a.guard) { f.state = 'block'; f.t = 0; f.aiTimer = 10; return; }
  }
  if (f.state === 'block' && !pAttacking) { f.state = 'idle'; f.t = 0; }
  if (f.state === 'block') return;

  if (f.aiTimer > 0) {
    // continua andando enquanto pensa
    if (f.aiPlan === 'in'  && d > MIN_GAP + 12) { f.x += f.dir * 3.0; f.state = 'walk'; }
    if (f.aiPlan === 'out' && d < 320)          { f.x -= f.dir * 2.6; f.state = 'walk'; }
    f.x = Math.max(150, Math.min(810, f.x));
    if (Math.abs(player.x - f.x) < MIN_GAP) f.x = player.x + (f.x > player.x ? MIN_GAP : -MIN_GAP);
    return;
  }

  // decide algo novo
  const r = Math.random();
  if (d <= a.range && r < a.aggr) {
    const s = Math.random();
    if (f.st > 25 && s < .22) tryMove(f, 'upper');
    else if (f.st > 16 && s < .58) tryMove(f, 'cross');
    else tryMove(f, 'jab');
    f.aiTimer = a.react;
  } else if (d > a.range) {
    f.aiPlan = 'in';  f.aiTimer = 14 + Math.random() * a.react;
  } else if (r < .18) {
    f.aiPlan = 'out'; f.aiTimer = 12 + Math.random() * 16;
  } else {
    f.aiPlan = null;  f.aiTimer = 8 + Math.random() * a.react;
    f.state = 'idle';
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  DESENHO — helpers estilo borracha-mangueira
// ═══════════════════════════════════════════════════════════════════════════
function ink(w) { ctx.strokeStyle = INK; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; }

function blob(x, y, rx, ry, fill, lw) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = fill; ctx.fill();
  ink(lw || 5); ctx.stroke();
}

// braço/perna de "mangueira": curva grossa com contorno
function hose(x1, y1, cx, cy, x2, y2, col, w) {
  ctx.beginPath();
  ctx.moveTo(x1, y1); ctx.quadraticCurveTo(cx, cy, x2, y2);
  ink(w + 8); ctx.stroke();
  ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke();
}

function pieEye(x, y, r, dir, angry, dead) {
  blob(x, y, r, r * 1.12, CREAM, 4);
  if (dead) {                                   // X nos olhos
    ink(4);
    ctx.beginPath();
    ctx.moveTo(x - r * .6, y - r * .6); ctx.lineTo(x + r * .6, y + r * .6);
    ctx.moveTo(x + r * .6, y - r * .6); ctx.lineTo(x - r * .6, y + r * .6);
    ctx.stroke();
    return;
  }
  ctx.beginPath();
  ctx.arc(x + dir * r * .3, y + r * .1, r * .46, 0, Math.PI * 2);
  ctx.fillStyle = INK; ctx.fill();
  if (angry) {                                  // sobrancelha braba
    ink(5);
    ctx.beginPath();
    ctx.moveTo(x - r, y - r * .95);
    ctx.lineTo(x + r * .9, y - r * (dir > 0 ? .45 : 1.3));
    ctx.stroke();
  }
}

// ── Cabeças ───────────────────────────────────────────────────────────────
function drawHead(f, hx, hy, s) {
  const dead = f.state === 'down' || f.state === 'ko';
  const hurt = f.flash > 0 || f.state === 'hit';
  const atk  = ['jab','cross','upper'].includes(f.state);
  const dir  = f.dir;

  if (f.head === 'cup') {
    // caneca: corpo cilíndrico + alça + canudo
    ctx.beginPath();
    ctx.moveTo(hx - 30*s, hy - 30*s);
    ctx.lineTo(hx - 26*s, hy + 26*s);
    ctx.quadraticCurveTo(hx, hy + 40*s, hx + 26*s, hy + 26*s);
    ctx.lineTo(hx + 30*s, hy - 30*s);
    ctx.closePath();
    ctx.fillStyle = CREAM; ctx.fill(); ink(5); ctx.stroke();
    // borda
    ctx.beginPath(); ctx.ellipse(hx, hy - 30*s, 30*s, 9*s, 0, 0, Math.PI*2);
    ctx.fillStyle = '#ffffff'; ctx.fill(); ink(5); ctx.stroke();
    // alça
    ctx.beginPath();
    ctx.arc(hx + 34*s, hy, 15*s, -Math.PI*.6, Math.PI*.6);
    ink(13); ctx.stroke(); ctx.strokeStyle = CREAM; ctx.lineWidth = 7; ctx.stroke();
    // canudo
    hose(hx + 6*s, hy - 32*s, hx + 20*s, hy - 60*s, hx + 34*s, hy - 46*s, RED, 7);
    pieEye(hx - 13*s, hy - 6*s, 10*s, dir, atk, dead);
    pieEye(hx + 11*s, hy - 6*s, 10*s, dir, atk, dead);
    // boca
    ink(4); ctx.beginPath();
    if (hurt) ctx.arc(hx + dir*4*s, hy + 16*s, 7*s, 0, Math.PI * 2);
    else if (atk) { ctx.arc(hx + dir*3*s, hy + 12*s, 9*s, .15, Math.PI - .15); }
    else ctx.arc(hx + dir*3*s, hy + 12*s, 8*s, .2, Math.PI - .2);
    ctx.fillStyle = hurt ? INK : '#7a2b22'; ctx.fill(); ctx.stroke();

  } else if (f.head === 'balloon') {
    blob(hx, hy, 36*s, 38*s, f.body, 6);
    ctx.beginPath(); ctx.moveTo(hx, hy + 38*s); ctx.lineTo(hx - 7*s, hy + 50*s); ctx.lineTo(hx + 7*s, hy + 50*s); ctx.closePath();
    ctx.fillStyle = f.body; ctx.fill(); ink(5); ctx.stroke();
    pieEye(hx - 14*s, hy - 6*s, 11*s, dir, true, dead);
    pieEye(hx + 13*s, hy - 6*s, 11*s, dir, true, dead);
    ink(5); ctx.beginPath();
    ctx.arc(hx, hy + 16*s, 11*s, hurt ? Math.PI : .1, hurt ? Math.PI*2 : Math.PI - .1);
    ctx.fillStyle = '#5a1c16'; ctx.fill(); ctx.stroke();

  } else if (f.head === 'cat') {
    // orelhas
    ctx.beginPath();
    ctx.moveTo(hx - 30*s, hy - 20*s); ctx.lineTo(hx - 38*s, hy - 54*s); ctx.lineTo(hx - 8*s, hy - 34*s);
    ctx.moveTo(hx + 30*s, hy - 20*s); ctx.lineTo(hx + 38*s, hy - 54*s); ctx.lineTo(hx + 8*s, hy - 34*s);
    ctx.fillStyle = f.body; ctx.fill(); ink(5); ctx.stroke();
    blob(hx, hy, 34*s, 32*s, f.body, 6);
    pieEye(hx - 13*s, hy - 6*s, 10*s, dir, true, dead);
    pieEye(hx + 12*s, hy - 6*s, 10*s, dir, true, dead);
    // focinho + dentes
    ink(4); ctx.beginPath();
    ctx.moveTo(hx - 16*s, hy + 12*s); ctx.quadraticCurveTo(hx, hy + 26*s, hx + 16*s, hy + 12*s);
    ctx.closePath(); ctx.fillStyle = '#5a1c16'; ctx.fill(); ctx.stroke();
    ctx.fillStyle = CREAM;
    for (let i = -1; i <= 1; i += 2) {
      ctx.beginPath();
      ctx.moveTo(hx + i*9*s, hy + 13*s); ctx.lineTo(hx + i*13*s, hy + 13*s); ctx.lineTo(hx + i*11*s, hy + 21*s);
      ctx.closePath(); ctx.fill(); ink(2.5); ctx.stroke();
    }

  } else { // king
    blob(hx, hy, 36*s, 34*s, f.body, 6);
    // coroa
    ctx.beginPath();
    ctx.moveTo(hx - 30*s, hy - 26*s);
    ctx.lineTo(hx - 30*s, hy - 52*s); ctx.lineTo(hx - 15*s, hy - 38*s);
    ctx.lineTo(hx,        hy - 58*s); ctx.lineTo(hx + 15*s, hy - 38*s);
    ctx.lineTo(hx + 30*s, hy - 52*s); ctx.lineTo(hx + 30*s, hy - 26*s);
    ctx.closePath(); ctx.fillStyle = GOLD; ctx.fill(); ink(5); ctx.stroke();
    pieEye(hx - 14*s, hy - 4*s, 11*s, dir, true, dead);
    pieEye(hx + 13*s, hy - 4*s, 11*s, dir, true, dead);
    ink(5); ctx.beginPath();
    ctx.moveTo(hx - 18*s, hy + 18*s); ctx.quadraticCurveTo(hx, hy + (hurt ? 34 : 8)*s, hx + 18*s, hy + 18*s);
    ctx.stroke();
  }
}

// ── Onde ficam as luvas ───────────────────────────────────────────────────
function glovePose(f) {
  const d = f.dir, s = f.scale;
  const chestY = FLOOR - 168 * s;
  // guarda alta de boxe: as duas luvas perto do queixo
  let lead = { x: f.x + d * 34 * s, y: chestY - 28 * s + Math.sin(f.bob) * 3 };
  let rear = { x: f.x + d *  4 * s, y: chestY - 16 * s + Math.sin(f.bob + 1) * 3 };

  if (f.state === 'block') {
    lead = { x: f.x + d * 24 * s, y: chestY - 38 * s };
    rear = { x: f.x + d *  2 * s, y: chestY - 34 * s };
  } else if (['jab','cross','upper'].includes(f.state)) {
    const m = f.move;
    let ext = 0;
    if (f.t <= m.wind) ext = -0.35 * (f.t / m.wind);                       // recolhe
    else if (f.t <= m.wind + m.act) ext = (f.t - m.wind) / m.act;          // estica
    else ext = 1 - (f.t - m.wind - m.act) / m.rec;                         // volta
    ext = Math.max(-0.4, Math.min(1, ext));
    const reach = m.reach * .74;
    if (f.state === 'upper') {
      rear = { x: f.x + d * (14 + reach * .62 * ext) * s, y: chestY + 34 * s - 104 * s * Math.max(0, ext) };
    } else if (f.state === 'cross') {
      rear = { x: f.x + d * (10 + reach * ext) * s, y: chestY - 24 * s - 6 * ext };
    } else {
      lead = { x: f.x + d * (30 + reach * ext) * s, y: chestY - 30 * s };
    }
  } else if (f.state === 'hit') {
    lead = { x: f.x - d * 12 * s, y: chestY + 6 * s };
    rear = { x: f.x - d * 34 * s, y: chestY + 16 * s };
  }
  return { lead, rear, chestY };
}

// ── Lutador completo ──────────────────────────────────────────────────────
function drawFighter(f, id) {
  const s = f.scale, d = f.dir;
  const down = f.state === 'down' || f.state === 'ko';
  const jx = bj(id), jy = bj(id + 40);

  ctx.save();
  ctx.translate(f.x + jx, jy);

  // sombra
  ctx.beginPath();
  ctx.ellipse(0, FLOOR + 4, 56 * s, 12, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(26,20,16,.28)'; ctx.fill();

  if (down) {                                    // caído: deitado
    ctx.translate(0, FLOOR - 48);
    ctx.rotate(-d * Math.PI / 2.2);
    ctx.translate(0, -(FLOOR - 48));
  }

  const bounce = down ? 0 : Math.sin(f.bob) * 4;
  const chestY = FLOOR - 168 * s + bounce;
  const g = glovePose(f);
  g.lead.y += bounce; g.rear.y += bounce;

  // ── pernas
  const legY = FLOOR;
  hose(-16 * s, FLOOR - 108 * s + bounce, -26 * s, FLOOR - 56, -22 * s, legY - 12, CREAM, 15 * s);
  hose( 16 * s, FLOOR - 108 * s + bounce,  26 * s, FLOOR - 56,  24 * s, legY - 12, CREAM, 15 * s);
  blob(-22 * s, legY - 6, 22 * s, 11 * s, INK, 4);
  blob( 24 * s, legY - 6, 22 * s, 11 * s, INK, 4);

  // ── calção
  ctx.beginPath();
  ctx.moveTo(-34 * s, FLOOR - 140 * s + bounce);
  ctx.lineTo( 34 * s, FLOOR - 140 * s + bounce);
  ctx.lineTo( 40 * s, FLOOR - 96 * s + bounce);
  ctx.lineTo(  0,     FLOOR - 108 * s + bounce);
  ctx.lineTo(-40 * s, FLOOR - 96 * s + bounce);
  ctx.closePath();
  ctx.fillStyle = f.body; ctx.fill(); ink(5); ctx.stroke();
  // faixa
  ctx.beginPath();
  ctx.rect(-36 * s, FLOOR - 148 * s + bounce, 72 * s, 12 * s);
  ctx.fillStyle = f.trim; ctx.fill(); ink(4); ctx.stroke();

  // ── tronco
  const squash = f.state === 'hit' ? 1.1 : (['jab','cross','upper'].includes(f.state) ? .94 : 1);
  blob(0, chestY + 22, 40 * s * squash, 46 * s / squash, f.flash > 0 && f.flash % 4 < 2 ? '#ffffff' : CREAM, 6);

  // ── braço de trás (atrás do corpo)
  ctx.save();
  hose(-d * 20 * s, chestY + 4, (g.rear.x - f.x) * .5 - d * 12, chestY + 22, g.rear.x - f.x, g.rear.y, CREAM, 13 * s);
  blob(g.rear.x - f.x, g.rear.y, 22 * s, 21 * s, f.body === RED ? RED : '#ffffff', 5);
  ctx.restore();

  // ── cabeça
  drawHead(f, 0, chestY - 46 * s, s);

  // ── braço da frente (na frente do corpo)
  hose(d * 24 * s, chestY + 2, (g.lead.x - f.x) * .5 + d * 10, chestY + 20, g.lead.x - f.x, g.lead.y, CREAM, 13 * s);
  blob(g.lead.x - f.x, g.lead.y, 23 * s, 22 * s, f.body === RED ? RED : '#ffffff', 5);
  // brilho na luva
  ctx.beginPath();
  ctx.ellipse(g.lead.x - f.x - 7 * s, g.lead.y - 8 * s, 6 * s, 4 * s, -.5, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fill();

  // guarda: escudinho
  if (f.state === 'block') {
    ctx.globalAlpha = .35;
    blob(d * 30 * s, chestY, 34 * s, 46 * s, GOLD, 4);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

// ═══════════════════════════════════════════════════════════════════════════
//  CENÁRIO
// ═══════════════════════════════════════════════════════════════════════════
const crowd = [];
for (let i = 0; i < 46; i++) {
  crowd.push({ x: 20 + Math.random() * 920, y: 120 + Math.random() * 110, r: 16 + Math.random() * 12, ph: Math.random() * 6 });
}
let flashT = 0, flashX = 0, flashY = 0;

function drawArena(tm) {
  // parede de fundo
  const gr = ctx.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, '#3a2a1c');
  gr.addColorStop(.45, '#6b4f36');
  gr.addColorStop(1, '#3a2a1c');
  ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);

  // holofotes
  for (let i = 0; i < 3; i++) {
    const x = 200 + i * 280;
    const g2 = ctx.createRadialGradient(x, -60, 10, x, 300, 380);
    g2.addColorStop(0, 'rgba(255,236,180,.30)');
    g2.addColorStop(1, 'rgba(255,236,180,0)');
    ctx.fillStyle = g2;
    ctx.beginPath(); ctx.moveTo(x, -40); ctx.lineTo(x - 200, 400); ctx.lineTo(x + 200, 400); ctx.closePath(); ctx.fill();
  }

  // plateia (silhuetas)
  crowd.forEach((c, i) => {
    const b = Math.sin(tm * .004 + c.ph) * 4;
    ctx.beginPath();
    ctx.arc(c.x, c.y + b, c.r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(20,14,10,.72)'; ctx.fill();
    ctx.beginPath();
    ctx.ellipse(c.x, c.y + c.r * 1.5 + b, c.r * 1.25, c.r, 0, Math.PI, 0);
    ctx.fill();
  });
  // flash de câmera
  if (flashT > 0) {
    ctx.globalAlpha = flashT / 8;
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(flashX, flashY, 26, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1; flashT--;
  } else if (Math.random() < .02) { flashT = 8; flashX = Math.random() * W; flashY = 120 + Math.random() * 110; }

  // lona do ringue
  ctx.beginPath();
  ctx.moveTo(60, FLOOR); ctx.lineTo(900, FLOOR);
  ctx.lineTo(985, H); ctx.lineTo(-25, H); ctx.closePath();
  ctx.fillStyle = '#c9b58c'; ctx.fill(); ink(6); ctx.stroke();
  // listras da lona
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(60, FLOOR); ctx.lineTo(900, FLOOR); ctx.lineTo(985, H); ctx.lineTo(-25, H); ctx.closePath();
  ctx.clip();
  ctx.strokeStyle = 'rgba(26,20,16,.10)'; ctx.lineWidth = 14;
  for (let i = -2; i < 14; i++) {
    ctx.beginPath(); ctx.moveTo(60 + i * 70, FLOOR); ctx.lineTo(-25 + i * 82, H); ctx.stroke();
  }
  ctx.restore();

  // cordas de trás
  [0, 1, 2].forEach(i => {
    const y = FLOOR - 40 - i * 42;
    ctx.beginPath(); ctx.moveTo(50, y); ctx.lineTo(910, y);
    ink(9); ctx.stroke();
    ctx.strokeStyle = [RED, CREAM, BLUE][i]; ctx.lineWidth = 5; ctx.stroke();
  });
  // postes
  [50, 910].forEach(x => {
    ctx.beginPath(); ctx.rect(x - 11, FLOOR - 178, 22, 186);
    ctx.fillStyle = GOLD; ctx.fill(); ink(5); ctx.stroke();
    blob(x, FLOOR - 186, 15, 15, RED, 5);
  });
}

function drawGrainAndVignette() {
  // vinheta
  const g = ctx.createRadialGradient(W/2, H/2, H*.34, W/2, H/2, H*.95);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(20,12,6,.62)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // granulado de filme
  ctx.globalAlpha = .05;
  ctx.fillStyle = '#000';
  for (let i = 0; i < 90; i++) ctx.fillRect(Math.random()*W, Math.random()*H, 2, 2);
  ctx.globalAlpha = .035;
  ctx.fillStyle = '#fff';
  for (let i = 0; i < 60; i++) ctx.fillRect(Math.random()*W, Math.random()*H, 2, 2);
  ctx.globalAlpha = 1;
  // risco vertical ocasional
  if (Math.random() < .12) {
    ctx.globalAlpha = .10; ctx.fillStyle = '#fff';
    ctx.fillRect(Math.random() * W, 0, 1.5, H);
    ctx.globalAlpha = 1;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  HUD
// ═══════════════════════════════════════════════════════════════════════════
function bar(x, y, w, h, pct, col, label, alignRight) {
  ctx.beginPath(); ctx.rect(x, y, w, h);
  ctx.fillStyle = 'rgba(26,20,16,.7)'; ctx.fill(); ink(4); ctx.stroke();
  const iw = Math.max(0, (w - 8) * Math.max(0, pct));
  ctx.beginPath();
  ctx.rect(alignRight ? x + 4 + (w - 8 - iw) : x + 4, y + 4, iw, h - 8);
  ctx.fillStyle = col; ctx.fill();
  ctx.font = 'bold 15px Georgia, serif';
  ctx.fillStyle = CREAM; ctx.textAlign = alignRight ? 'right' : 'left';
  ctx.fillText(label, alignRight ? x + w : x, y - 8);
}

function drawHUD() {
  bar(30, 44, 350, 26, player.hp / player.hpMax, RED,  player.name, false);
  bar(30, 78, 260, 14, player.st / 100,          GOLD, '', false);
  bar(580, 44, 350, 26, foe.hp / foe.hpMax, BLUE, foe.name, true);
  bar(670, 78, 260, 14, foe.st / 100,       GOLD, '', true);
  ctx.textAlign = 'left';
}

function cardText(big, small, tm) {
  // escurece a cena para o card virar "cartela de cinema"
  ctx.fillStyle = 'rgba(18,11,6,.46)';
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  const w = 620, h = 162, x = (W - w) / 2, y = 40;
  ctx.translate(0, Math.sin(tm * .06) * 3);
  // moldura
  ctx.beginPath(); ctx.rect(x, y, w, h);
  ctx.fillStyle = PAPER; ctx.fill(); ink(7); ctx.stroke();
  ctx.beginPath(); ctx.rect(x + 12, y + 12, w - 24, h - 24);
  ink(3); ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = INK;
  ctx.font = 'bold 58px Georgia, serif';
  ctx.fillText(big, W / 2, y + 80);
  ctx.font = 'italic 23px Georgia, serif';
  ctx.fillStyle = '#5c4633';
  ctx.fillText(small, W / 2, y + 124);
  ctx.textAlign = 'left';
  ctx.restore();
}

function drawTitle(tm) {
  ctx.textAlign = 'center';
  const bounce = Math.sin(tm * .05) * 6;
  ctx.save();
  ctx.translate(W / 2, 150 + bounce);
  ctx.font = 'bold 96px Georgia, serif';
  ctx.lineWidth = 14; ctx.strokeStyle = INK; ctx.lineJoin = 'round';
  ctx.strokeText('NOCAUTE!', 0, 0);
  const g = ctx.createLinearGradient(0, -60, 0, 20);
  g.addColorStop(0, GOLD); g.addColorStop(1, RED);
  ctx.fillStyle = g; ctx.fillText('NOCAUTE!', 0, 0);
  ctx.restore();

  ctx.font = 'italic 26px Georgia, serif';
  ctx.fillStyle = PAPER;
  ctx.fillText('boxe de desenho animado', W / 2, 210);

  // instruções
  ctx.font = '19px Georgia, serif';
  ctx.fillStyle = CREAM;
  const lines = isTouch
    ? ['◀ ▶  andar', 'JAB / DIRETO / UPPER  socar', 'DEFESA  segurar pra bloquear']
    : ['A D  ou  ← →   andar', 'J  jab      K  direto      L  upper', 'S  segurar para defender'];
  lines.forEach((t, i) => ctx.fillText(t, W / 2, 300 + i * 32));

  ctx.font = 'bold 24px Georgia, serif';
  ctx.fillStyle = Math.floor(tm / 22) % 2 ? GOLD : PAPER;
  ctx.fillText(isTouch ? 'toque para começar' : 'aperte qualquer tecla', W / 2, 440);
  ctx.textAlign = 'left';
}

// ═══════════════════════════════════════════════════════════════════════════
//  LAÇO
// ═══════════════════════════════════════════════════════════════════════════
let acc = 0, last = performance.now(), tm = 0;

function stepGame() {
  tm++;
  boilT++; if (boilT >= 5) { boilT = 0; boil++; }
  if (msgT < 1e6) msgT++;
  if (shake > 0) shake *= .86;
  if (hitStop > 0) { hitStop--; return; }
  if (slowmo > 0) { slowmo--; if (tm % 2) return; }

  pollAttacks();

  if (state === 'fight') {
    controlPlayer();
    controlFoe();
    stepFighter(player, foe);
    stepFighter(foe, player);
  } else if (state === 'ko') {
    stepFighter(player, foe);
    stepFighter(foe, player);
    if (msgT > 150) advance();
  }

  // partículas
  for (let i = fx.length - 1; i >= 0; i--) {
    const p = fx[i];
    p.life--;
    if (p.k === 'p') { p.x += p.vx; p.y += p.vy; p.vy += .34; p.vx *= .97; }
    else p.y += p.vy;
    if (p.life <= 0) fx.splice(i, 1);
  }
}

function render() {
  ctx.save();
  if (shake > .4) ctx.translate((Math.random() - .5) * shake, (Math.random() - .5) * shake);

  drawArena(tm * 16);

  if (state === 'title') {
    drawGrainAndVignette();
    drawTitle(tm);
    ctx.restore();
    return;
  }

  // ordem: quem está mais atrás desenha primeiro
  const order = player.x < foe.x ? [player, foe] : [foe, player];
  drawFighter(order[0], 1);
  drawFighter(order[1], 2);

  // corda da frente (o jogador luta "dentro" do ringue)
  ctx.beginPath(); ctx.moveTo(-20, H - 16); ctx.lineTo(W + 20, H - 24);
  ink(13); ctx.stroke();
  ctx.strokeStyle = RED; ctx.lineWidth = 7; ctx.stroke();

  // partículas
  fx.forEach(p => {
    if (p.k === 'p') {
      ctx.globalAlpha = Math.min(1, p.life / 16);
      blob(p.x, p.y, 6, 6, p.col, 3);
      ctx.globalAlpha = 1;
    } else {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(Math.sin(p.life * .3) * .12);
      ctx.font = 'bold 52px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.lineWidth = 10; ctx.strokeStyle = INK; ctx.lineJoin = 'round';
      ctx.globalAlpha = Math.min(1, p.life / 14);
      ctx.strokeText(p.txt, 0, 0);
      ctx.fillStyle = GOLD; ctx.fillText(p.txt, 0, 0);
      ctx.globalAlpha = 1; ctx.textAlign = 'left';
      ctx.restore();
    }
  });

  drawGrainAndVignette();
  drawHUD();

  if (state === 'intro')    cardText(msg, msgSub, tm);
  if (state === 'ko')       cardText(msg, msgSub, tm);
  if (state === 'gameover') cardText('DERROTA', 'aperte para voltar', tm);
  if (state === 'win')      cardText('CAMPEÃO!', 'você limpou o ringue', tm);

  if (state === 'intro' && msgT > 40) {
    ctx.textAlign = 'center';
    ctx.font = 'bold 24px Georgia, serif';
    ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.lineJoin = 'round';
    const t = isTouch ? 'toque para lutar' : 'aperte para lutar';
    ctx.strokeText(t, W / 2, 516);
    ctx.fillStyle = Math.floor(tm / 20) % 2 ? GOLD : CREAM;
    ctx.fillText(t, W / 2, 516);
    ctx.textAlign = 'left';
  }

  ctx.restore();
}

function frame(now) {
  requestAnimationFrame(frame);
  let dt = now - last; last = now;
  if (dt > 200) dt = 200;
  acc += dt;
  const STEP = 1000 / 60;
  let guard = 0;
  while (acc >= STEP && guard++ < 5) { stepGame(); acc -= STEP; }
  render();
}
requestAnimationFrame(frame);
