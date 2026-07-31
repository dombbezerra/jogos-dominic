// ═══════════════════════════════════════════════════════════════════════════
//  NOCAUTE! — MMA de desenho animado (estilo anos 30)
//  Andar: A D / ← →   •   Soco: X   •   Chute: Z   •   Defesa: S   •   Pausa: P
// ═══════════════════════════════════════════════════════════════════════════

const cv  = document.getElementById('tela');
const ctx = cv.getContext('2d');
const W = 960, H = 540;
const FLOOR = 468;

// ── Paleta sépia ──────────────────────────────────────────────────────────
const INK    = '#1a1410';
const PAPER  = '#e8d9b5';
const CREAM  = '#f6efdc';
const RED    = '#c9342b';
const BLUE   = '#2f5fa8';
const GOLD   = '#e8b53a';
const GREEN  = '#4a8b3b';
const PURPLE = '#7b4397';

const isTouch = matchMedia('(hover: none) and (pointer: coarse)').matches;
if (isTouch) document.body.classList.add('touch');

// ── "Boil": tremidinha de desenho à mão ───────────────────────────────────
let boil = 0, boilT = 0;
function bj(id) {
  const n = Math.sin(id * 127.1 + boil * 311.7) * 43758.5453;
  return ((n - Math.floor(n)) - .5) * 2.0;
}

// ── Jogo sem som ──────────────────────────────────────────────────────────
const nop = () => {};
const sfx = { whoosh: nop, hit: nop, block: nop, ko: nop, bell: nop, ui: nop };

// ═══════════════════════════════════════════════════════════════════════════
//  LUTADORES (pessoas)
// ═══════════════════════════════════════════════════════════════════════════
// hair: 'curto' | 'moicano' | 'careca' | 'coque' | 'barba' | 'rabo'
const FIGHTERS = [
  { id:'bruno',  nome:'BRUNO SILVA', pele:'#c98a5b', cabelo:'#1e1410', hair:'curto',
    calcao: BLUE,   faixa: CREAM, hp:105, scale:1.12, ai:{ react:32, aggr:.32, guard:.22, range:200 } },
  { id:'kai',    nome:'KAI TANAKA',  pele:'#e8c39a', cabelo:'#12100e', hair:'coque',
    calcao:'#e8e2d0', faixa: RED,  hp:115, scale:1.10, ai:{ react:22, aggr:.48, guard:.34, range:212 } },
  { id:'marcus', nome:'MARCUS KING', pele:'#7a4a2c', cabelo:'#241a12', hair:'careca',
    calcao: GOLD,   faixa: INK,   hp:128, scale:1.16, ai:{ react:16, aggr:.58, guard:.44, range:220 } },
  { id:'ivan',   nome:'IVAN PETROV', pele:'#e3b088', cabelo:'#c9a227', hair:'moicano',
    calcao: GREEN,  faixa: CREAM, hp:120, scale:1.14, ai:{ react:18, aggr:.55, guard:.40, range:216 } },
  { id:'tita',   nome:'TITÃ COSTA',  pele:'#d9a06a', cabelo:'#7a3b1c', hair:'barba',
    calcao: PURPLE, faixa: GOLD,  hp:150, scale:1.30, ai:{ react:11, aggr:.68, guard:.54, range:228 } },
  { id:'nina',   nome:'NINA ROCHA',  pele:'#b9764a', cabelo:'#1b1310', hair:'rabo',
    calcao: RED,    faixa: CREAM, hp:112, scale:1.08, ai:{ react:20, aggr:.52, guard:.36, range:210 } },
];
const byId = id => FIGHTERS.find(f => f.id === id);

// quem o jogador pode escolher / ordem dos adversários
const SELECT   = ['bruno', 'kai', 'nina', 'ivan'];
const TORNEIO  = ['bruno', 'kai', 'ivan', 'marcus', 'tita'];

// ═══════════════════════════════════════════════════════════════════════════
//  GOLPES
// ═══════════════════════════════════════════════════════════════════════════
const MIN_GAP = 132;
const MOVES = {
  soco:  { wind: 6,  act: 5, rec: 12, dmg: 8,   reach: 184, cost: 11, push: 8,  stun: 15, name:'SOCO'  },
  chute: { wind: 13, act: 6, rec: 23, dmg: 15,  reach: 224, cost: 21, push: 17, stun: 27, name:'CHUTE', breaks: true },
};

// ═══════════════════════════════════════════════════════════════════════════
//  ENTRADA
// ═══════════════════════════════════════════════════════════════════════════
const keys = {};
const touchBtn = { left: 0, right: 0, soco: 0, chute: 0, block: 0 };
const pressed = {};
const lastT = { soco: 0, chute: 0 };
const fired = { soco: 0, chute: 0 };

addEventListener('keydown', e => {
  if (!keys[e.code]) pressed[e.code] = true;
  keys[e.code] = true;
  if (['Space','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.code)) e.preventDefault();

  if (e.code === 'KeyP') { if (state === 'fight') paused = !paused; return; }
  if (paused) return;
  if (state !== 'fight') advance(e.code);
});
addEventListener('keyup', e => { keys[e.code] = false; });

function bindTouch(id, prop) {
  const el = document.getElementById(id);
  if (!el) return;
  const on  = e => { e.preventDefault(); touchBtn[prop] = 1; if (!paused && state !== 'fight') advance(prop === 'left' ? 'ArrowLeft' : prop === 'right' ? 'ArrowRight' : 'KeyX'); };
  const off = e => { e.preventDefault(); touchBtn[prop] = 0; };
  el.addEventListener('touchstart', on,  { passive: false });
  el.addEventListener('touchend',   off, { passive: false });
  el.addEventListener('touchcancel',off, { passive: false });
  el.addEventListener('mousedown',  on);
  el.addEventListener('mouseup',    off);
  el.addEventListener('mouseleave', off);
}
bindTouch('t-left','left'); bindTouch('t-right','right');
bindTouch('t-soco','soco'); bindTouch('t-chute','chute'); bindTouch('t-block','block');

const pauseBtn = document.getElementById('t-pause');
if (pauseBtn) {
  const tog = e => { e.preventDefault(); if (state === 'fight') paused = !paused; };
  pauseBtn.addEventListener('touchstart', tog, { passive: false });
  pauseBtn.addEventListener('mousedown', tog);
}
cv.addEventListener('pointerdown', () => { if (!paused && state !== 'fight') advance('KeyX'); });

const held = {
  left:  () => keys.KeyA || keys.ArrowLeft  || touchBtn.left,
  right: () => keys.KeyD || keys.ArrowRight || touchBtn.right,
  block: () => keys.KeyS || keys.ArrowDown  || keys.ShiftLeft || touchBtn.block,
};
function pollAttacks() {
  fired.soco  = (pressed.KeyX || (touchBtn.soco  && !lastT.soco))  ? 1 : 0;
  fired.chute = (pressed.KeyZ || (touchBtn.chute && !lastT.chute)) ? 1 : 0;
  lastT.soco = touchBtn.soco; lastT.chute = touchBtn.chute;
  for (const k in pressed) delete pressed[k];
}

// ═══════════════════════════════════════════════════════════════════════════
//  ESTADO
// ═══════════════════════════════════════════════════════════════════════════
let state = 'title';           // title | select | intro | fight | ko | win | gameover
let paused = false;
let msg = '', msgSub = '', msgT = 0;
let shake = 0, hitStop = 0, slowmo = 0;
const fx = [];
let player, foe, foeIdx = 0, pickIdx = 0;

function makeFighter(look, o) {
  return {
    look, nome: look.nome, x: o.x, dir: o.dir, isPlayer: !!o.isPlayer,
    hpMax: look.hp * (o.isPlayer ? 1.15 : 1), hp: look.hp * (o.isPlayer ? 1.15 : 1),
    st: 100, state: 'idle', t: 0, move: null, hitDone: false,
    vx: 0, bob: Math.random() * 6, flash: 0, scale: look.scale,
    ai: o.isPlayer ? null : look.ai, aiTimer: 0, aiPlan: null, stunFor: 14,
  };
}

function startTournament() {
  foeIdx = 0;
  player = makeFighter(byId(SELECT[pickIdx]), { x: 330, dir: 1, isPlayer: true });
  nextFight();
}
function nextFight() {
  // pula quem o jogador escolheu
  while (TORNEIO[foeIdx] === player.look.id) foeIdx++;
  const look = byId(TORNEIO[foeIdx]);
  foe = makeFighter(look, { x: 630, dir: -1 });
  player.x = 330;
  player.hp = Math.min(player.hpMax, player.hp + 40);
  player.st = 100; player.state = 'idle'; player.t = 0;
  state = 'intro'; msgT = 0;
  msg = 'LUTA ' + (foeIdx + 1); msgSub = look.nome;
}
function advance(code) {
  if (state === 'title') { state = 'select'; msgT = 0; }
  else if (state === 'select') {
    if (code === 'ArrowLeft'  || code === 'KeyA') { pickIdx = (pickIdx + SELECT.length - 1) % SELECT.length; return; }
    if (code === 'ArrowRight' || code === 'KeyD') { pickIdx = (pickIdx + 1) % SELECT.length; return; }
    if (msgT > 12) startTournament();
  }
  else if (state === 'intro' && msgT > 40) state = 'fight';
  else if (state === 'ko' && msgT > 70) {
    if (player.hp <= 0) { state = 'gameover'; msgT = 0; }
    else if (foeIdx >= TORNEIO.length - 1) { state = 'win'; msgT = 0; }
    else { foeIdx++; nextFight(); }
  }
  else if ((state === 'gameover' || state === 'win') && msgT > 50) { state = 'title'; msgT = 0; }
}

// ═══════════════════════════════════════════════════════════════════════════
//  COMBATE
// ═══════════════════════════════════════════════════════════════════════════
const busy = f => ['soco','chute','hit','down','ko'].includes(f.state);
const gap  = () => Math.abs(player.x - foe.x);

function tryMove(f, key) {
  const m = MOVES[key];
  if (busy(f) || f.st < m.cost) return false;
  f.state = key; f.move = m; f.t = 0; f.hitDone = false; f.st -= m.cost;
  return true;
}

function resolveHit(att, def) {
  const m = att.move;
  if (gap() > m.reach) return;
  const blocking = def.state === 'block' && !m.breaks;

  if (blocking) {
    def.hp -= m.dmg * .18;
    def.st = Math.max(0, def.st - m.cost * .55);
    def.x += att.dir * m.push * .4;
    spark(def.x - def.dir * 46, FLOOR - 170, 6, GOLD);
    shake = Math.max(shake, 3);
  } else {
    def.hp -= m.dmg;
    def.flash = 8;
    def.state = 'hit'; def.t = 0; def.stunFor = m.stun;
    def.x += att.dir * m.push;
    spark(def.x - def.dir * 52, FLOOR - 180, 12, RED);
    popup(def.x, FLOOR - 250, m.breaks ? 'POW!' : 'BAM!');
    shake = Math.max(shake, m.breaks ? 15 : 9);
    hitStop = m.breaks ? 7 : 4;

    if (def.hp <= 0) {
      def.hp = 0; def.state = 'down'; def.t = 0;
      shake = 22; slowmo = 60;
      state = 'ko'; msgT = 0;
      msg = 'NOCAUTE!'; msgSub = (def.isPlayer ? foe.nome : player.nome) + ' venceu';
      for (let i = 0; i < 24; i++) spark(def.x, FLOOR - 180, 1, i % 2 ? GOLD : CREAM);
    }
  }
  def.x = Math.max(150, Math.min(810, def.x));
}

function spark(x, y, n, col) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, s = 2 + Math.random() * 6;
    fx.push({ k:'p', x, y, vx: Math.cos(a)*s, vy: Math.sin(a)*s - 2, life: 22 + Math.random()*14, col });
  }
}
function popup(x, y, txt) { fx.push({ k:'t', x, y, txt, life: 34, vy: -1.4 }); }

function stepFighter(f, opp) {
  f.t++; f.bob += .09;
  if (f.flash > 0) f.flash--;
  f.dir = f.x < opp.x ? 1 : -1;

  const rest = (f.state === 'idle' || f.state === 'walk');
  f.st = Math.min(100, f.st + (rest ? .55 : .16));

  if (f.state === 'soco' || f.state === 'chute') {
    const m = f.move;
    if (f.t > m.wind && f.t <= m.wind + m.act && !f.hitDone) { f.hitDone = true; resolveHit(f, opp); }
    if (f.t >= m.wind + m.act + m.rec) { f.state = 'idle'; f.t = 0; }
  } else if (f.state === 'hit') {
    if (f.t >= f.stunFor) { f.state = 'idle'; f.t = 0; }
  } else if (f.state === 'down') {
    if (f.t > 90) { f.state = 'ko'; f.t = 0; }
  }

  f.x += f.vx; f.vx *= .8;
  f.x = Math.max(150, Math.min(810, f.x));
}

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

  if (fired.chute) tryMove(f, 'chute');
  else if (fired.soco) tryMove(f, 'soco');
}

function controlFoe() {
  const f = foe, a = f.ai;
  if (busy(f)) return;
  f.aiTimer--;

  const d = gap();
  const pAtk = player.state === 'soco' || player.state === 'chute';

  if (pAtk && player.t <= player.move.wind + 1 && d < player.move.reach + 10) {
    if (Math.random() < a.guard) { f.state = 'block'; f.t = 0; f.aiTimer = 10; return; }
  }
  if (f.state === 'block' && !pAtk) { f.state = 'idle'; f.t = 0; }
  if (f.state === 'block') return;

  if (f.aiTimer > 0) {
    if (f.aiPlan === 'in'  && d > MIN_GAP + 12) { f.x += f.dir * 3.0; f.state = 'walk'; }
    if (f.aiPlan === 'out' && d < 330)          { f.x -= f.dir * 2.6; f.state = 'walk'; }
    f.x = Math.max(150, Math.min(810, f.x));
    if (Math.abs(player.x - f.x) < MIN_GAP) f.x = player.x + (f.x > player.x ? MIN_GAP : -MIN_GAP);
    return;
  }

  const r = Math.random();
  if (d <= a.range && r < a.aggr) {
    if (f.st > 24 && Math.random() < .42) tryMove(f, 'chute');
    else tryMove(f, 'soco');
    f.aiTimer = a.react;
  } else if (d > a.range) { f.aiPlan = 'in';  f.aiTimer = 14 + Math.random() * a.react; }
  else if (r < .18)       { f.aiPlan = 'out'; f.aiTimer = 12 + Math.random() * 16; }
  else                    { f.aiPlan = null;  f.aiTimer = 8 + Math.random() * a.react; f.state = 'idle'; }
}

// ═══════════════════════════════════════════════════════════════════════════
//  DESENHO
// ═══════════════════════════════════════════════════════════════════════════
function ink(w) { ctx.strokeStyle = INK; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; }

function blob(x, y, rx, ry, fill, lw) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = fill; ctx.fill();
  if (lw !== 0) { ink(lw || 5); ctx.stroke(); }
}
function hose(x1, y1, cx, cy, x2, y2, col, w) {
  ctx.beginPath();
  ctx.moveTo(x1, y1); ctx.quadraticCurveTo(cx, cy, x2, y2);
  ink(w + 8); ctx.stroke();
  ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke();
}

// ── Luva com UFC escrito ──────────────────────────────────────────────────
function glove(x, y, r, col, dir) {
  blob(x, y, r, r * .94, col, 5);
  // polegar
  blob(x - dir * r * .55, y + r * .45, r * .34, r * .3, col, 4);
  // brilho
  ctx.beginPath();
  ctx.ellipse(x - r * .32, y - r * .38, r * .26, r * .16, -.5, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.fill();
  // UFC
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(dir * .12);
  ctx.font = `900 ${(r * .58) | 0}px Arial, Helvetica, sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineWidth = Math.max(2.5, r * .16); ctx.strokeStyle = INK; ctx.lineJoin = 'round';
  ctx.strokeText('UFC', 0, r * .1);
  ctx.fillStyle = CREAM;
  ctx.fillText('UFC', 0, r * .1);
  ctx.restore();
  ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
}

// ── Cabelo ────────────────────────────────────────────────────────────────
function drawHair(f, hx, hy, s) {
  const L = f.look, c = L.cabelo, d = f.dir;
  ctx.fillStyle = c;
  switch (L.hair) {
    case 'careca':
      ctx.beginPath();
      ctx.ellipse(hx - 8 * s, hy - 18 * s, 9 * s, 5 * s, -.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.fill();
      break;
    case 'moicano':
      ctx.beginPath();
      ctx.moveTo(hx - 7 * s, hy - 30 * s);
      ctx.quadraticCurveTo(hx, hy - 62 * s, hx + 7 * s, hy - 30 * s);
      ctx.closePath(); ctx.fillStyle = c; ctx.fill(); ink(4); ctx.stroke();
      break;
    case 'coque':
      blob(hx - d * 4 * s, hy - 36 * s, 12 * s, 11 * s, c, 4);
      capHair(hx, hy, s, c);
      break;
    case 'rabo':
      hose(hx - d * 22 * s, hy - 20 * s, hx - d * 46 * s, hy - 16 * s, hx - d * 44 * s, hy + 20 * s, c, 11 * s);
      capHair(hx, hy, s, c);
      break;
    case 'barba':
      capHair(hx, hy, s, c);
      ctx.beginPath();
      ctx.moveTo(hx - 27 * s, hy + 4 * s);
      ctx.quadraticCurveTo(hx, hy + 46 * s, hx + 27 * s, hy + 4 * s);
      ctx.quadraticCurveTo(hx, hy + 22 * s, hx - 27 * s, hy + 4 * s);
      ctx.closePath(); ctx.fillStyle = c; ctx.fill(); ink(4); ctx.stroke();
      break;
    default:
      capHair(hx, hy, s, c);
  }
}
function capHair(hx, hy, s, c) {
  ctx.beginPath();
  ctx.ellipse(hx, hy - 6 * s, 29 * s, 30 * s, 0, Math.PI * 1.06, Math.PI * 1.94);
  ctx.closePath();
  ctx.fillStyle = c; ctx.fill(); ink(4); ctx.stroke();
}

// ── Cabeça humana ─────────────────────────────────────────────────────────
function drawHead(f, hx, hy, s) {
  const L = f.look, d = f.dir;
  const dead = f.state === 'down' || f.state === 'ko';
  const hurt = f.flash > 0 || f.state === 'hit';
  const atk  = f.state === 'soco' || f.state === 'chute';

  // orelhas
  blob(hx - 28 * s, hy + 4 * s, 6 * s, 8 * s, L.pele, 4);
  blob(hx + 28 * s, hy + 4 * s, 6 * s, 8 * s, L.pele, 4);
  // rosto
  blob(hx, hy, 27 * s, 31 * s, hurt && f.flash % 4 < 2 ? '#ffffff' : L.pele, 5);
  drawHair(f, hx, hy, s);

  // olhos
  const ex = 11 * s, ey = -2 * s;
  [-1, 1].forEach(k => {
    const x = hx + k * ex;
    blob(x, hy + ey, 7.5 * s, dead ? 7.5 * s : 8.5 * s, CREAM, 3);
    if (dead) {
      ink(3.4); ctx.beginPath();
      ctx.moveTo(x - 5*s, hy + ey - 5*s); ctx.lineTo(x + 5*s, hy + ey + 5*s);
      ctx.moveTo(x + 5*s, hy + ey - 5*s); ctx.lineTo(x - 5*s, hy + ey + 5*s);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(x + d * 2.6 * s, hy + ey + (hurt ? 2 : 1) * s, 3.6 * s, 0, Math.PI * 2);
      ctx.fillStyle = INK; ctx.fill();
    }
  });
  // sobrancelhas (bravas quando ataca)
  if (!dead) {
    ink(4);
    [-1, 1].forEach(k => {
      const x = hx + k * ex;
      ctx.beginPath();
      ctx.moveTo(x - 7 * s, hy + ey - (atk ? 13 : 12) * s);
      ctx.lineTo(x + 7 * s, hy + ey - (atk ? (k === d ? 8 : 15) : 11) * s);
      ctx.stroke();
    });
  }
  // nariz
  ink(3.5);
  ctx.beginPath();
  ctx.moveTo(hx + d * 2 * s, hy + 4 * s);
  ctx.quadraticCurveTo(hx + d * 8 * s, hy + 11 * s, hx + d * 1 * s, hy + 12 * s);
  ctx.stroke();
  // boca / protetor bucal
  if (dead || hurt) {
    blob(hx + d * 2 * s, hy + 21 * s, 8 * s, 7 * s, '#5a1c16', 3.5);
  } else if (atk) {
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(hx - 10 * s, hy + 16 * s, 20 * s, 9 * s, 3 * s)
                  : ctx.rect(hx - 10 * s, hy + 16 * s, 20 * s, 9 * s);
    ctx.fillStyle = '#ffffff'; ctx.fill(); ink(3.5); ctx.stroke();
  } else {
    ink(3.8);
    ctx.beginPath();
    ctx.moveTo(hx - 8 * s, hy + 20 * s);
    ctx.quadraticCurveTo(hx + d * 2 * s, hy + 24 * s, hx + 8 * s, hy + 20 * s);
    ctx.stroke();
  }
}

// ── Poses ─────────────────────────────────────────────────────────────────
function extOf(f) {
  const m = f.move;
  let e = 0;
  if (f.t <= m.wind) e = -0.32 * (f.t / m.wind);
  else if (f.t <= m.wind + m.act) e = (f.t - m.wind) / m.act;
  else e = 1 - (f.t - m.wind - m.act) / m.rec;
  return Math.max(-0.4, Math.min(1, e));
}

function glovePose(f) {
  const d = f.dir, s = f.scale;
  const chestY = FLOOR - 168 * s;
  let lead = { x: f.x + d * 34 * s, y: chestY - 28 * s + Math.sin(f.bob) * 3 };
  let rear = { x: f.x + d *  4 * s, y: chestY - 16 * s + Math.sin(f.bob + 1) * 3 };

  if (f.state === 'block') {
    lead = { x: f.x + d * 24 * s, y: chestY - 40 * s };
    rear = { x: f.x + d *  2 * s, y: chestY - 36 * s };
  } else if (f.state === 'soco') {
    const e = extOf(f);
    rear = { x: f.x + d * (10 + MOVES.soco.reach * .70 * e) * s, y: chestY - 26 * s };
  } else if (f.state === 'chute') {
    // braços abrem para equilibrar o chute
    const e = Math.max(0, extOf(f));
    lead = { x: f.x + d * (30 - 16 * e) * s, y: chestY - (28 + 10 * e) * s };
    rear = { x: f.x - d * (6 + 34 * e) * s,  y: chestY - (16 + 22 * e) * s };
  } else if (f.state === 'hit') {
    lead = { x: f.x - d * 12 * s, y: chestY + 6 * s };
    rear = { x: f.x - d * 34 * s, y: chestY + 16 * s };
  }
  return { lead, rear, chestY };
}

function legPose(f) {
  const d = f.dir, s = f.scale;
  const hipY = FLOOR - 112 * s;
  let front = { x: d * 24 * s, y: FLOOR - 10 };
  let back  = { x: -d * 26 * s, y: FLOOR - 10 };

  if (f.state === 'chute') {
    const e = Math.max(0, extOf(f));
    back = { x: d * (10 + MOVES.chute.reach * .60 * e) * s, y: FLOOR - 10 - 150 * s * e };
    front = { x: -d * 4 * s, y: FLOOR - 10 };
  } else if (f.state === 'walk') {
    const sw = Math.sin(f.bob * 2.2) * 12 * s;
    front = { x: d * 24 * s + sw, y: FLOOR - 10 };
    back  = { x: -d * 26 * s - sw, y: FLOOR - 10 };
  } else if (f.state === 'block') {
    front = { x: d * 16 * s, y: FLOOR - 10 };
    back  = { x: -d * 30 * s, y: FLOOR - 10 };
  }
  return { front, back, hipY };
}

// ── Lutador ───────────────────────────────────────────────────────────────
function drawFighter(f, id) {
  const L = f.look, s = f.scale, d = f.dir;
  const down = f.state === 'down' || f.state === 'ko';

  ctx.save();
  ctx.translate(f.x + bj(id), bj(id + 40));

  // sombra
  ctx.beginPath();
  ctx.ellipse(0, FLOOR + 4, 56 * s, 12, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(26,20,16,.28)'; ctx.fill();

  if (down) {                                  // caído
    ctx.translate(0, FLOOR - 48);
    ctx.rotate(-d * Math.PI / 2.2);
    ctx.translate(0, -(FLOOR - 48));
  }

  const bounce = down ? 0 : Math.sin(f.bob) * 4;
  const g = glovePose(f), lp = legPose(f);
  const chestY = g.chestY + bounce;
  g.lead.y += bounce; g.rear.y += bounce;
  const hipY = lp.hipY + bounce;

  // ── pernas
  [['back', -1], ['front', 1]].forEach(([k, side]) => {
    const p = lp[k];
    const kneeX = (p.x + side * d * 6 * s) * .55;
    hose(side * d * 12 * s, hipY, kneeX, (hipY + p.y) / 2 + 6, p.x, p.y, L.pele, 16 * s);
    // luva de pé / bandagem
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(f.state === 'chute' && k === 'back' ? d * -.5 : 0);
    blob(0, 0, 20 * s, 10 * s, INK, 4);
    ctx.restore();
  });

  // ── calção
  ctx.beginPath();
  ctx.moveTo(-36 * s, chestY + 44 * s);
  ctx.lineTo( 36 * s, chestY + 44 * s);
  ctx.lineTo( 42 * s, hipY + 12 * s);
  ctx.lineTo(  0,     hipY + 2 * s);
  ctx.lineTo(-42 * s, hipY + 12 * s);
  ctx.closePath();
  ctx.fillStyle = L.calcao; ctx.fill(); ink(5); ctx.stroke();
  ctx.beginPath();
  ctx.rect(-38 * s, chestY + 36 * s, 76 * s, 12 * s);
  ctx.fillStyle = L.faixa; ctx.fill(); ink(4); ctx.stroke();

  // ── tronco
  const squash = f.state === 'hit' ? 1.1 : (f.state === 'soco' || f.state === 'chute' ? .95 : 1);
  blob(0, chestY + 12, 38 * s * squash, 48 * s / squash,
       f.flash > 0 && f.flash % 4 < 2 ? '#ffffff' : L.pele, 6);
  // peitoral
  ink(3.4);
  ctx.beginPath();
  ctx.moveTo(-16 * s, chestY - 6 * s);
  ctx.quadraticCurveTo(0, chestY + 8 * s, 16 * s, chestY - 6 * s);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, chestY + 6 * s); ctx.lineTo(0, chestY + 30 * s);
  ctx.stroke();

  // córner vermelho = jogador, córner azul = adversário
  const luva = f.isPlayer ? RED : BLUE;

  // ── braço de trás
  hose(-d * 20 * s, chestY - 6, (g.rear.x - f.x) * .5 - d * 12, chestY + 16, g.rear.x - f.x, g.rear.y, L.pele, 13 * s);
  glove(g.rear.x - f.x, g.rear.y, 21 * s, luva, d);

  // ── cabeça
  drawHead(f, 0, chestY - 52 * s, s);

  // ── braço da frente
  hose(d * 22 * s, chestY - 8, (g.lead.x - f.x) * .5 + d * 10, chestY + 12, g.lead.x - f.x, g.lead.y, L.pele, 13 * s);
  glove(g.lead.x - f.x, g.lead.y, 22 * s, luva, d);

  if (f.state === 'block') {
    ctx.globalAlpha = .3;
    blob(d * 30 * s, chestY - 14 * s, 34 * s, 48 * s, GOLD, 4);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

// ═══════════════════════════════════════════════════════════════════════════
//  CENÁRIO
// ═══════════════════════════════════════════════════════════════════════════
const crowd = [];
for (let i = 0; i < 46; i++)
  crowd.push({ x: 20 + Math.random() * 920, y: 130 + Math.random() * 105, r: 16 + Math.random() * 12, ph: Math.random() * 6 });
let flashT = 0, flashX = 0, flashY = 0;

function drawArena(tmm) {
  const gr = ctx.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, '#3a2a1c'); gr.addColorStop(.45, '#6b4f36'); gr.addColorStop(1, '#3a2a1c');
  ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);

  for (let i = 0; i < 3; i++) {
    const x = 200 + i * 280;
    const g2 = ctx.createRadialGradient(x, -60, 10, x, 300, 380);
    g2.addColorStop(0, 'rgba(255,236,180,.30)'); g2.addColorStop(1, 'rgba(255,236,180,0)');
    ctx.fillStyle = g2;
    ctx.beginPath(); ctx.moveTo(x, -40); ctx.lineTo(x - 200, 420); ctx.lineTo(x + 200, 420); ctx.closePath(); ctx.fill();
  }

  crowd.forEach(c => {
    const b = Math.sin(tmm * .004 + c.ph) * 4;
    ctx.beginPath(); ctx.arc(c.x, c.y + b, c.r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(20,14,10,.72)'; ctx.fill();
    ctx.beginPath(); ctx.ellipse(c.x, c.y + c.r * 1.5 + b, c.r * 1.25, c.r, 0, Math.PI, 0); ctx.fill();
  });
  if (flashT > 0) {
    ctx.globalAlpha = flashT / 8; ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(flashX, flashY, 26, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1; flashT--;
  } else if (Math.random() < .02) { flashT = 8; flashX = Math.random() * W; flashY = 130 + Math.random() * 105; }

  // lona
  ctx.beginPath();
  ctx.moveTo(60, FLOOR); ctx.lineTo(900, FLOOR); ctx.lineTo(985, H); ctx.lineTo(-25, H); ctx.closePath();
  ctx.fillStyle = '#c9b58c'; ctx.fill(); ink(6); ctx.stroke();
  ctx.save(); ctx.clip();
  ctx.strokeStyle = 'rgba(26,20,16,.10)'; ctx.lineWidth = 14;
  for (let i = -2; i < 14; i++) { ctx.beginPath(); ctx.moveTo(60 + i * 70, FLOOR); ctx.lineTo(-25 + i * 82, H); ctx.stroke(); }
  ctx.restore();

  // octógono: cordas/grade de fundo
  [0, 1, 2].forEach(i => {
    const y = FLOOR - 40 - i * 44;
    ctx.beginPath(); ctx.moveTo(50, y); ctx.lineTo(910, y);
    ink(9); ctx.stroke();
    ctx.strokeStyle = [RED, CREAM, BLUE][i]; ctx.lineWidth = 5; ctx.stroke();
  });
  [50, 910].forEach(x => {
    ctx.beginPath(); ctx.rect(x - 11, FLOOR - 182, 22, 190);
    ctx.fillStyle = GOLD; ctx.fill(); ink(5); ctx.stroke();
    blob(x, FLOOR - 190, 15, 15, RED, 5);
  });
}

function grainVignette() {
  const g = ctx.createRadialGradient(W/2, H/2, H*.34, W/2, H/2, H*.95);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(20,12,6,.62)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = .05; ctx.fillStyle = '#000';
  for (let i = 0; i < 90; i++) ctx.fillRect(Math.random()*W, Math.random()*H, 2, 2);
  ctx.globalAlpha = .035; ctx.fillStyle = '#fff';
  for (let i = 0; i < 60; i++) ctx.fillRect(Math.random()*W, Math.random()*H, 2, 2);
  ctx.globalAlpha = 1;
  if (Math.random() < .12) {
    ctx.globalAlpha = .10; ctx.fillStyle = '#fff';
    ctx.fillRect(Math.random() * W, 0, 1.5, H); ctx.globalAlpha = 1;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  HUD / TELAS
// ═══════════════════════════════════════════════════════════════════════════
function bar(x, y, w, h, pct, col, label, right) {
  ctx.beginPath(); ctx.rect(x, y, w, h);
  ctx.fillStyle = 'rgba(26,20,16,.7)'; ctx.fill(); ink(4); ctx.stroke();
  const iw = Math.max(0, (w - 8) * Math.max(0, pct));
  ctx.beginPath();
  ctx.rect(right ? x + 4 + (w - 8 - iw) : x + 4, y + 4, iw, h - 8);
  ctx.fillStyle = col; ctx.fill();
  if (label) {
    ctx.font = 'bold 15px Georgia, serif';
    ctx.fillStyle = CREAM; ctx.textAlign = right ? 'right' : 'left';
    ctx.fillText(label, right ? x + w : x, y - 8);
    ctx.textAlign = 'left';
  }
}
function drawHUD() {
  bar(30, 44, 350, 26, player.hp / player.hpMax, RED, player.nome, false);
  bar(30, 78, 260, 14, player.st / 100, GOLD, '', false);
  bar(580, 44, 350, 26, foe.hp / foe.hpMax, BLUE, foe.nome, true);
  bar(670, 78, 260, 14, foe.st / 100, GOLD, '', true);
}

function cardText(big, small, t) {
  ctx.fillStyle = 'rgba(18,11,6,.46)'; ctx.fillRect(0, 0, W, H);
  ctx.save();
  const w = 620, h = 162, x = (W - w) / 2, y = 40;
  ctx.translate(0, Math.sin(t * .06) * 3);
  ctx.beginPath(); ctx.rect(x, y, w, h);
  ctx.fillStyle = PAPER; ctx.fill(); ink(7); ctx.stroke();
  ctx.beginPath(); ctx.rect(x + 12, y + 12, w - 24, h - 24); ink(3); ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = INK; ctx.font = 'bold 58px Georgia, serif';
  ctx.fillText(big, W / 2, y + 80);
  ctx.font = 'italic 23px Georgia, serif'; ctx.fillStyle = '#5c4633';
  ctx.fillText(small, W / 2, y + 124);
  ctx.textAlign = 'left';
  ctx.restore();
}

function blink(t, txt, y) {
  ctx.textAlign = 'center';
  ctx.font = 'bold 24px Georgia, serif';
  ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.lineJoin = 'round';
  ctx.strokeText(txt, W / 2, y);
  ctx.fillStyle = Math.floor(t / 20) % 2 ? GOLD : CREAM;
  ctx.fillText(txt, W / 2, y);
  ctx.textAlign = 'left';
}

function drawTitle(t) {
  ctx.textAlign = 'center';
  ctx.save();
  ctx.translate(W / 2, 152 + Math.sin(t * .05) * 6);
  ctx.font = 'bold 92px Georgia, serif';
  ctx.lineWidth = 14; ctx.strokeStyle = INK; ctx.lineJoin = 'round';
  ctx.strokeText('NOCAUTE!', 0, 0);
  const g = ctx.createLinearGradient(0, -60, 0, 20);
  g.addColorStop(0, GOLD); g.addColorStop(1, RED);
  ctx.fillStyle = g; ctx.fillText('NOCAUTE!', 0, 0);
  ctx.restore();

  ctx.font = 'italic 25px Georgia, serif'; ctx.fillStyle = PAPER;
  ctx.fillText('MMA de desenho animado', W / 2, 206);

  // painel dos controles
  const bx = W / 2 - 250, by = 236, bw = 500, bh = 150;
  ctx.beginPath(); ctx.rect(bx, by, bw, bh);
  ctx.fillStyle = 'rgba(18,11,6,.62)'; ctx.fill(); ink(4); ctx.stroke();
  ctx.font = '20px Georgia, serif'; ctx.fillStyle = CREAM;
  const lines = isTouch
    ? ['◀ ▶  andar', 'SOCO  •  CHUTE', 'DEFESA  segurar   •   ⏸  pausa']
    : ['A D  ou  ← →   andar', 'X  soco        Z  chute', 'S  defesa (segurar)      P  pausa'];
  lines.forEach((s, i) => ctx.fillText(s, W / 2, by + 44 + i * 36));

  blink(t, isTouch ? 'toque para começar' : 'aperte qualquer tecla', 446);
  ctx.textAlign = 'left';
}

// ── Tela de escolha de lutador ────────────────────────────────────────────
const selDummies = SELECT.map((id, i) => {
  const f = makeFighter(byId(id), { x: 0, dir: 1, isPlayer: true });
  f.scale = .78; f.bob = i * 1.7;
  return f;
});
function drawSelect(t) {
  ctx.fillStyle = 'rgba(18,11,6,.42)'; ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.font = 'bold 44px Georgia, serif';
  ctx.lineWidth = 10; ctx.strokeStyle = INK; ctx.lineJoin = 'round';
  ctx.strokeText('ESCOLHA SEU LUTADOR', W / 2, 78);
  ctx.fillStyle = GOLD; ctx.fillText('ESCOLHA SEU LUTADOR', W / 2, 78);
  blink(t, isTouch ? '◀ ▶ escolher  •  SOCO confirma' : '← → escolher  •  X confirma', 116);

  const step = W / (SELECT.length + 1);
  selDummies.forEach((f, i) => {
    const on = i === pickIdx;
    f.x = step * (i + 1);
    f.bob += on ? .1 : .04;
    f.state = 'idle';
    if (on) {                                  // holofote no escolhido
      const g = ctx.createRadialGradient(f.x, FLOOR - 120, 10, f.x, FLOOR, 190);
      g.addColorStop(0, 'rgba(255,236,180,.32)'); g.addColorStop(1, 'rgba(255,236,180,0)');
      ctx.fillStyle = g; ctx.fillRect(f.x - 200, 120, 400, 400);
    }
    ctx.globalAlpha = on ? 1 : .55;
    drawFighter(f, 10 + i);
    ctx.globalAlpha = 1;

    ctx.font = on ? 'bold 21px Georgia, serif' : '18px Georgia, serif';
    ctx.lineWidth = 6; ctx.strokeStyle = INK;
    ctx.strokeText(f.nome, f.x, FLOOR + 44);
    ctx.fillStyle = on ? GOLD : PAPER;
    ctx.fillText(f.nome, f.x, FLOOR + 44);
    if (on) {
      ctx.font = 'bold 32px Georgia, serif';
      ctx.lineWidth = 7; ctx.strokeStyle = INK;
      const ay = 252 + Math.sin(t * .12) * 5;
      ctx.strokeText('▼', f.x, ay);
      ctx.fillStyle = GOLD; ctx.fillText('▼', f.x, ay);
    }
  });
  ctx.textAlign = 'left';
}

// ═══════════════════════════════════════════════════════════════════════════
//  LAÇO
// ═══════════════════════════════════════════════════════════════════════════
let acc = 0, last = performance.now(), tm = 0;

function stepGame() {
  tm++;
  boilT++; if (boilT >= 5) { boilT = 0; boil++; }
  msgT++;
  if (shake > 0) shake *= .86;
  if (hitStop > 0) { hitStop--; return; }
  if (slowmo > 0) { slowmo--; if (tm % 2) return; }

  pollAttacks();

  if (state === 'fight') {
    controlPlayer(); controlFoe();
    stepFighter(player, foe); stepFighter(foe, player);
  } else if (state === 'ko') {
    stepFighter(player, foe); stepFighter(foe, player);
    if (msgT > 150) advance();
  }

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

  if (state === 'title') { grainVignette(); drawTitle(tm); ctx.restore(); return; }
  if (state === 'select') { grainVignette(); drawSelect(tm); ctx.restore(); return; }

  const order = player.x < foe.x ? [player, foe] : [foe, player];
  drawFighter(order[0], 1);
  drawFighter(order[1], 2);

  ctx.beginPath(); ctx.moveTo(-20, H - 16); ctx.lineTo(W + 20, H - 24);
  ink(13); ctx.stroke();
  ctx.strokeStyle = RED; ctx.lineWidth = 7; ctx.stroke();

  fx.forEach(p => {
    if (p.k === 'p') {
      ctx.globalAlpha = Math.min(1, p.life / 16);
      blob(p.x, p.y, 6, 6, p.col, 3);
      ctx.globalAlpha = 1;
    } else {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(Math.sin(p.life * .3) * .12);
      ctx.font = 'bold 52px Georgia, serif'; ctx.textAlign = 'center';
      ctx.lineWidth = 10; ctx.strokeStyle = INK; ctx.lineJoin = 'round';
      ctx.globalAlpha = Math.min(1, p.life / 14);
      ctx.strokeText(p.txt, 0, 0);
      ctx.fillStyle = GOLD; ctx.fillText(p.txt, 0, 0);
      ctx.globalAlpha = 1; ctx.textAlign = 'left';
      ctx.restore();
    }
  });

  grainVignette();
  drawHUD();

  if (state === 'intro') {
    cardText(msg, msgSub, tm);
    if (msgT > 40) blink(tm, isTouch ? 'toque para lutar' : 'aperte para lutar', 516);
  }
  if (state === 'ko')       cardText(msg, msgSub, tm);
  if (state === 'gameover') { cardText('DERROTA', 'aperte para voltar', tm); }
  if (state === 'win')      { cardText('CAMPEÃO!', 'você limpou o octógono', tm); }

  if (paused) {
    ctx.fillStyle = 'rgba(18,11,6,.66)'; ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.font = 'bold 76px Georgia, serif';
    ctx.lineWidth = 12; ctx.strokeStyle = INK; ctx.lineJoin = 'round';
    ctx.strokeText('PAUSA', W / 2, H / 2);
    ctx.fillStyle = GOLD; ctx.fillText('PAUSA', W / 2, H / 2);
    ctx.font = '22px Georgia, serif'; ctx.fillStyle = CREAM;
    ctx.fillText(isTouch ? 'toque em ⏸ para voltar' : 'aperte P para voltar', W / 2, H / 2 + 48);
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
  while (acc >= STEP && guard++ < 5) { if (!paused) stepGame(); acc -= STEP; }
  render();
}
requestAnimationFrame(frame);
