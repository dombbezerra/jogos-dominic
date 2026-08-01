// ═══════════════════════════════════════════════════════════════════════════
//  NOCAUTE! — MMA de desenho animado (estilo anos 30)
//  Andar: A D / ← →   •   Soco: X   •   Chute: Z   •   Defesa: S   •   Pausa: P
// ═══════════════════════════════════════════════════════════════════════════

const cv  = document.getElementById('tela');
const ctx = cv.getContext('2d');
const W = 960, H = 540;
const FLOOR = 476;

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
  return ((n - Math.floor(n)) - .5) * 1.7;
}

// ── Sem som ───────────────────────────────────────────────────────────────
const nop = () => {};
const sfx = { whoosh: nop, hit: nop, block: nop, ko: nop, bell: nop, ui: nop };

// ═══════════════════════════════════════════════════════════════════════════
//  LUTADORES
// ═══════════════════════════════════════════════════════════════════════════
// hair: 'curto' | 'moicano' | 'careca' | 'coque' | 'barba'
const FIGHTERS = [
  { id:'bruno',  nome:'BRUNO SILVA', pele:'#c08050', sombra:'#a06a3e', cabelo:'#1e1410', hair:'curto',
    calcao: BLUE,     faixa: CREAM, hp:105, scale:1.20, ai:{ react:32, aggr:.32, guard:.22, range:196 } },
  { id:'kai',    nome:'KAI TANAKA',  pele:'#dfb489', sombra:'#c2946a', cabelo:'#12100e', hair:'coque',
    calcao:'#e8e2d0', faixa: RED,   hp:115, scale:1.17, ai:{ react:22, aggr:.48, guard:.34, range:204 } },
  { id:'ivan',   nome:'IVAN PETROV', pele:'#dcab84', sombra:'#bd8b64', cabelo:'#c9a227', hair:'moicano',
    calcao: GREEN,    faixa: CREAM, hp:120, scale:1.21, ai:{ react:18, aggr:.55, guard:.40, range:206 } },
  { id:'marcus', nome:'MARCUS KING', pele:'#71472a', sombra:'#573520', cabelo:'#241a12', hair:'careca',
    calcao: GOLD,     faixa: INK,   hp:128, scale:1.24, ai:{ react:16, aggr:.58, guard:.44, range:210 } },
  { id:'tita',   nome:'TITÃ COSTA',  pele:'#cf9660', sombra:'#ae7a48', cabelo:'#7a3b1c', hair:'barba',
    calcao: PURPLE,   faixa: GOLD,  hp:152, scale:1.36, ai:{ react:11, aggr:.68, guard:.54, range:216 } },
];
const byId = id => FIGHTERS.find(f => f.id === id);

const SELECT  = ['bruno', 'kai', 'ivan', 'marcus'];
const TORNEIO = ['bruno', 'kai', 'ivan', 'marcus', 'tita'];

// ═══════════════════════════════════════════════════════════════════════════
//  GOLPES
// ═══════════════════════════════════════════════════════════════════════════
const MIN_GAP = 136;
const MOVES = {
  soco:  { wind: 6,  act: 5, rec: 12, dmg: 9.5, reach: 172, cost: 11, push: 8,  stun: 15, name:'SOCO'  },
  chute: { wind: 13, act: 6, rec: 23, dmg: 18,  reach: 206, cost: 21, push: 17, stun: 27, name:'CHUTE', breaks: true },
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
  const on  = e => {
    e.preventDefault(); touchBtn[prop] = 1;
    if (!paused && state !== 'fight')
      advance(prop === 'left' ? 'ArrowLeft' : prop === 'right' ? 'ArrowRight' : 'KeyX');
  };
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
let state = 'title';
let paused = false;
let msg = '', msgSub = '', msgT = 0;
let shake = 0, hitStop = 0, slowmo = 0;
const fx = [];
let player, foe, foeIdx = 0, pickIdx = 0;

function makeFighter(look, o) {
  const hp = look.hp * (o.isPlayer ? 1.15 : 1);
  return {
    look, nome: look.nome, x: o.x, dir: o.dir, isPlayer: !!o.isPlayer,
    hpMax: hp, hp, st: 100, state: 'idle', t: 0, move: null, hitDone: false,
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
  while (TORNEIO[foeIdx] === player.look.id) foeIdx++;
  const look = byId(TORNEIO[foeIdx]);
  foe = makeFighter(look, { x: 640, dir: -1 });
  player.x = 320;
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
    spark(def.x - def.dir * 46, FLOOR - 176, 6, GOLD);
    shake = Math.max(shake, 3);
  } else {
    def.hp -= m.dmg;
    def.flash = 8;
    def.state = 'hit'; def.t = 0; def.stunFor = m.stun;
    def.x += att.dir * m.push;
    spark(def.x - def.dir * 52, FLOOR - 186, 12, RED);
    popup(def.x, FLOOR - 256, m.breaks ? 'POW!' : 'BAM!');
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

// segmento de membro com contorno (grosso perto do corpo, fino na ponta)
function seg(x1, y1, x2, y2, col, w1, w2) {
  const a = Math.atan2(y2 - y1, x2 - x1), nx = Math.sin(a), ny = -Math.cos(a);
  ctx.beginPath();
  ctx.moveTo(x1 + nx * w1, y1 + ny * w1);
  ctx.lineTo(x2 + nx * w2, y2 + ny * w2);
  ctx.arc(x2, y2, w2, a - Math.PI / 2, a + Math.PI / 2);
  ctx.lineTo(x1 - nx * w1, y1 - ny * w1);
  ctx.arc(x1, y1, w1, a + Math.PI / 2, a + Math.PI * 1.5);
  ctx.closePath();
  ctx.fillStyle = col; ctx.fill();
  ink(4.5); ctx.stroke();
}

// cinemática de 2 ossos: acha o cotovelo/joelho
function limb(sx, sy, tx, ty, l1, l2, bend) {
  const dx = tx - sx, dy = ty - sy;
  const dist = Math.hypot(dx, dy) || .001;
  const max = (l1 + l2) * .995;
  let hx = tx, hy = ty, d = dist;
  if (dist > max) { hx = sx + dx / dist * max; hy = sy + dy / dist * max; d = max; }
  const cosA = Math.max(-1, Math.min(1, (l1*l1 + d*d - l2*l2) / (2 * l1 * d)));
  const ang = Math.atan2(hy - sy, hx - sx) + bend * Math.acos(cosA);
  return { jx: sx + Math.cos(ang) * l1, jy: sy + Math.sin(ang) * l1, hx, hy };
}

// ── Luva com UFC ──────────────────────────────────────────────────────────
function glove(x, y, r, col, dir) {
  blob(x, y, r, r * .92, col, 4.5);
  blob(x - dir * r * .58, y + r * .42, r * .32, r * .28, col, 4);   // polegar
  ctx.beginPath();
  ctx.ellipse(x - r * .3, y - r * .4, r * .24, r * .14, -.5, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,.42)'; ctx.fill();
  ctx.save();
  ctx.translate(x, y); ctx.rotate(dir * .12);
  ctx.font = `900 ${Math.max(7, (r * .56) | 0)}px Arial, Helvetica, sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineWidth = Math.max(2, r * .15); ctx.strokeStyle = INK; ctx.lineJoin = 'round';
  ctx.strokeText('UFC', 0, r * .08);
  ctx.fillStyle = CREAM; ctx.fillText('UFC', 0, r * .08);
  ctx.restore();
  ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
}

// ── Cabelo ────────────────────────────────────────────────────────────────
function capHair(hx, hy, s, c, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(hx, hy - 1 * s, rx, ry, 0, Math.PI * 1.03, Math.PI * 1.97);
  ctx.closePath();
  ctx.fillStyle = c; ctx.fill(); ink(4); ctx.stroke();
}
function drawHair(f, hx, hy, s) {
  const L = f.look, c = L.cabelo, d = f.dir;
  const RX = 17 * s, RY = 20 * s;
  switch (L.hair) {
    case 'careca':
      ctx.beginPath();
      ctx.ellipse(hx - 5 * s, hy - 11 * s, 6 * s, 3.4 * s, -.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,.26)'; ctx.fill();
      break;
    case 'moicano':
      capHair(hx, hy, s, c, RX, RY * .5);
      ctx.beginPath();
      ctx.moveTo(hx - 5 * s, hy - 18 * s);
      ctx.quadraticCurveTo(hx, hy - 40 * s, hx + 5 * s, hy - 18 * s);
      ctx.closePath(); ctx.fillStyle = c; ctx.fill(); ink(3.6); ctx.stroke();
      break;
    case 'coque':
      blob(hx - d * 3 * s, hy - 24 * s, 7.5 * s, 7 * s, c, 3.6);
      capHair(hx, hy, s, c, RX, RY);
      break;
    case 'barba':
      capHair(hx, hy, s, c, RX, RY);
      ctx.beginPath();
      ctx.moveTo(hx - 16 * s, hy + 2 * s);
      ctx.quadraticCurveTo(hx, hy + 32 * s, hx + 16 * s, hy + 2 * s);
      ctx.quadraticCurveTo(hx, hy + 15 * s, hx - 16 * s, hy + 2 * s);
      ctx.closePath(); ctx.fillStyle = c; ctx.fill(); ink(3.6); ctx.stroke();
      break;
    default:
      capHair(hx, hy, s, c, RX, RY);
  }
}

// ── Cabeça ────────────────────────────────────────────────────────────────
function drawHead(f, hx, hy, s) {
  const L = f.look, d = f.dir;
  const dead = f.state === 'down' || f.state === 'ko';
  const hurt = f.flash > 0 || f.state === 'hit';
  const atk  = f.state === 'soco' || f.state === 'chute';
  const pele = (hurt && f.flash % 4 < 2) ? '#ffffff' : L.pele;

  // orelhas
  blob(hx - 16 * s, hy + 2 * s, 4 * s, 5.5 * s, pele, 3.5);
  blob(hx + 16 * s, hy + 2 * s, 4 * s, 5.5 * s, pele, 3.5);

  // crânio + mandíbula
  ctx.beginPath();
  ctx.moveTo(hx - 16 * s, hy - 2 * s);
  ctx.quadraticCurveTo(hx - 16 * s, hy - 21 * s, hx, hy - 21 * s);
  ctx.quadraticCurveTo(hx + 16 * s, hy - 21 * s, hx + 16 * s, hy - 2 * s);
  ctx.quadraticCurveTo(hx + 15 * s, hy + 12 * s, hx + d * 2 * s, hy + 18 * s);
  ctx.quadraticCurveTo(hx - 15 * s, hy + 12 * s, hx - 16 * s, hy - 2 * s);
  ctx.closePath();
  ctx.fillStyle = pele; ctx.fill(); ink(4.5); ctx.stroke();

  drawHair(f, hx, hy, s);

  // olhos
  const ex = 7.5 * s, ey = -1 * s;
  [-1, 1].forEach(k => {
    const x = hx + k * ex;
    if (dead) {
      ink(3.2); ctx.beginPath();
      ctx.moveTo(x - 4*s, hy + ey - 4*s); ctx.lineTo(x + 4*s, hy + ey + 4*s);
      ctx.moveTo(x + 4*s, hy + ey - 4*s); ctx.lineTo(x - 4*s, hy + ey + 4*s);
      ctx.stroke();
    } else {
      blob(x, hy + ey, 4.6 * s, 4 * s, CREAM, 2.6);
      ctx.beginPath();
      ctx.arc(x + d * 1.4 * s, hy + ey + .4 * s, 2.1 * s, 0, Math.PI * 2);
      ctx.fillStyle = INK; ctx.fill();
    }
  });
  // sobrancelhas
  if (!dead) {
    ink(3.4);
    [-1, 1].forEach(k => {
      const x = hx + k * ex;
      ctx.beginPath();
      ctx.moveTo(x - 4.6 * s, hy + ey - (atk ? 8.4 : 7.4) * s);
      ctx.lineTo(x + 4.6 * s, hy + ey - (atk ? (k === d ? 5 : 10) : 7) * s);
      ctx.stroke();
    });
  }
  // nariz
  ink(3);
  ctx.beginPath();
  ctx.moveTo(hx + d * 1.5 * s, hy + 2 * s);
  ctx.quadraticCurveTo(hx + d * 5.5 * s, hy + 7.5 * s, hx + d * .5 * s, hy + 8.5 * s);
  ctx.stroke();
  // boca / protetor bucal
  if (dead || hurt) {
    blob(hx + d * 1.5 * s, hy + 13.5 * s, 5 * s, 4.4 * s, '#5a1c16', 3);
  } else if (atk) {
    ctx.beginPath();
    ctx.rect(hx - 6 * s, hy + 10.5 * s, 12 * s, 5.4 * s);
    ctx.fillStyle = '#ffffff'; ctx.fill(); ink(2.8); ctx.stroke();
  } else {
    ink(3.2);
    ctx.beginPath();
    ctx.moveTo(hx - 5 * s, hy + 13 * s);
    ctx.quadraticCurveTo(hx + d * 1.5 * s, hy + 15.5 * s, hx + 5 * s, hy + 13 * s);
    ctx.stroke();
  }
}

// ── Poses ─────────────────────────────────────────────────────────────────
function extOf(f) {
  const m = f.move;
  let e = 0;
  if (f.t <= m.wind) e = -0.30 * (f.t / m.wind);
  else if (f.t <= m.wind + m.act) e = (f.t - m.wind) / m.act;
  else e = 1 - (f.t - m.wind - m.act) / m.rec;
  return Math.max(-0.4, Math.min(1, e));
}

// medidas do corpo (tudo relativo ao chão e à escala)
function body(s) {
  return {
    SHO: FLOOR - 172 * s,        // ombros
    CHEST: FLOOR - 156 * s,
    WAIST: FLOOR - 124 * s,
    HIP: FLOOR - 106 * s,
    HEAD: FLOOR - 200 * s,       // centro da cabeça
    SHW: 30 * s, WSW: 20 * s, HPW: 25 * s,
    UARM: 36 * s, FARM: 34 * s,  // braço / antebraço
    THIGH: 54 * s, SHIN: 52 * s, // coxa / canela
  };
}

function poses(f) {
  const d = f.dir, s = f.scale, B = body(s);
  const still = f.state === 'down' || f.state === 'ko';
  const bob = still ? 0 : Math.sin(f.bob) * 3;
  let lunge = 0, lean = 0;

  // guarda na altura do queixo (deixa o rosto à mostra)
  let lead = { x: d * 44 * s, y: B.SHO - 2 * s + bob };
  let rear = { x: d * 20 * s, y: B.SHO + 8 * s + bob };
  let fFoot = { x:  d * 30 * s, y: FLOOR };
  let bFoot = { x: -d * 32 * s, y: FLOOR };

  if (f.state === 'block') {
    lead = { x: d * 20 * s, y: B.SHO - 26 * s + bob };
    rear = { x: d *  2 * s, y: B.SHO - 24 * s + bob };
    fFoot = { x: d * 20 * s, y: FLOOR };
    bFoot = { x: -d * 36 * s, y: FLOOR };
  } else if (f.state === 'soco') {
    const e = extOf(f), p = Math.max(0, e);
    lunge = 34 * s * p;
    lean  = d * .07 * p;
    rear  = { x: d * (14 + 96 * e) * s, y: B.SHO - 8 * s };
    lead  = { x: d * (32 - 12 * p) * s, y: B.SHO - (2 - 2 * p) * s };
    fFoot = { x: d * (30 + 12 * p) * s, y: FLOOR };
  } else if (f.state === 'chute') {
    const e = Math.max(0, extOf(f));
    lunge = 30 * s * e;
    lean  = -d * .16 * e;
    bFoot = { x: d * (24 + 106 * e) * s, y: FLOOR - 120 * s * e };
    fFoot = { x: -d * 6 * s, y: FLOOR };
    lead  = { x: d * (34 - 24 * e) * s, y: B.SHO - (2 + 14 * e) * s };
    rear  = { x: -d * (4 + 34 * e) * s, y: B.SHO + (8 - 20 * e) * s };
  } else if (f.state === 'hit') {
    lean  = -d * .12;
    lead  = { x: -d * 12 * s, y: B.SHO + 6 * s };
    rear  = { x: -d * 32 * s, y: B.SHO + 14 * s };
    bFoot = { x: -d * 40 * s, y: FLOOR };
  } else if (f.state === 'walk') {
    const sw = Math.sin(f.bob * 2.4) * 14 * s;
    fFoot = { x:  d * 30 * s + sw, y: FLOOR - Math.max(0, Math.sin(f.bob * 2.4)) * 8 * s };
    bFoot = { x: -d * 32 * s - sw, y: FLOOR - Math.max(0, -Math.sin(f.bob * 2.4)) * 8 * s };
  }
  return { lead, rear, fFoot, bFoot, bob, lunge, lean, B };
}

// ── Lutador ───────────────────────────────────────────────────────────────
function drawFighter(f, id) {
  const L = f.look, s = f.scale, d = f.dir;
  const down = f.state === 'down' || f.state === 'ko';
  const P = poses(f), B = P.B;
  const flashing = f.flash > 0 && f.flash % 4 < 2;
  const pele = flashing ? '#ffffff' : L.pele;
  const sombra = flashing ? '#e8e8e8' : L.sombra;
  const luva = f.isPlayer ? RED : BLUE;

  ctx.save();
  ctx.translate(f.x + bj(id), bj(id + 40));

  // sombra no chão
  ctx.beginPath();
  ctx.ellipse(0, FLOOR + 4, 52 * s, 11, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(26,20,16,.28)'; ctx.fill();

  if (down) {
    ctx.translate(0, FLOOR - 40);
    ctx.rotate(-d * Math.PI / 2.15);
    ctx.translate(0, -(FLOOR - 40));
  }

  ctx.translate(d * P.lunge, 0);
  if (P.lean) { ctx.translate(0, B.HIP); ctx.rotate(P.lean); ctx.translate(0, -B.HIP); }

  const bob = P.bob;
  const SHO = B.SHO + bob, HIP = B.HIP + bob, HEAD = B.HEAD + bob;
  const WAIST = B.WAIST + bob, CHEST = B.CHEST + bob;

  // ═══ perna de trás ═══
  const bl = limb(-d * 9 * s, HIP, P.bFoot.x, P.bFoot.y - 8 * s, B.THIGH, B.SHIN, -d);
  seg(-d * 9 * s, HIP, bl.jx, bl.jy, sombra, 15 * s, 11 * s);
  seg(bl.jx, bl.jy, bl.hx, bl.hy, sombra, 11 * s, 8 * s);
  ctx.save(); ctx.translate(bl.hx, bl.hy);
  ctx.rotate(f.state === 'chute' ? -d * .55 : 0);
  blob(d * 4 * s, 6 * s, 15 * s, 7 * s, INK, 4); ctx.restore();

  // ═══ braço de trás ═══
  const ba = limb(-d * 14 * s, SHO + 4 * s, P.rear.x, P.rear.y, B.UARM, B.FARM, d);
  seg(-d * 14 * s, SHO + 4 * s, ba.jx, ba.jy, sombra, 12 * s, 9 * s);
  seg(ba.jx, ba.jy, ba.hx, ba.hy, sombra, 9 * s, 7.5 * s);

  // ═══ perna da frente ═══
  const fl = limb(d * 9 * s, HIP, P.fFoot.x, P.fFoot.y - 8 * s, B.THIGH, B.SHIN, -d);
  seg(d * 9 * s, HIP, fl.jx, fl.jy, pele, 16 * s, 12 * s);
  seg(fl.jx, fl.jy, fl.hx, fl.hy, pele, 12 * s, 8.5 * s);
  blob(fl.hx + d * 4 * s, fl.hy + 6 * s, 16 * s, 7.5 * s, INK, 4);

  // ═══ calção ═══
  ctx.beginPath();
  ctx.moveTo(-B.WSW - 2 * s, WAIST);
  ctx.lineTo( B.WSW + 2 * s, WAIST);
  ctx.quadraticCurveTo(B.HPW + 6 * s, HIP + 6 * s, B.HPW + 3 * s, HIP + 22 * s);
  ctx.lineTo(4 * s, HIP + 18 * s);
  ctx.lineTo(-4 * s, HIP + 18 * s);
  ctx.lineTo(-B.HPW - 3 * s, HIP + 22 * s);
  ctx.quadraticCurveTo(-B.HPW - 6 * s, HIP + 6 * s, -B.WSW - 2 * s, WAIST);
  ctx.closePath();
  ctx.fillStyle = L.calcao; ctx.fill(); ink(5); ctx.stroke();
  ctx.beginPath();
  ctx.rect(-B.WSW - 3 * s, WAIST - 5 * s, (B.WSW + 3 * s) * 2, 10 * s);
  ctx.fillStyle = L.faixa; ctx.fill(); ink(4); ctx.stroke();

  // ═══ tronco ═══
  const sq = f.state === 'hit' ? 1.06 : (f.state === 'soco' || f.state === 'chute' ? .97 : 1);
  ctx.beginPath();
  ctx.moveTo(-B.SHW * sq, SHO + 4 * s);
  ctx.quadraticCurveTo(-B.SHW * sq - 3 * s, CHEST + 14 * s, -B.WSW, WAIST + 2 * s);
  ctx.lineTo(B.WSW, WAIST + 2 * s);
  ctx.quadraticCurveTo(B.SHW * sq + 3 * s, CHEST + 14 * s, B.SHW * sq, SHO + 4 * s);
  ctx.quadraticCurveTo(0, SHO - 12 * s, -B.SHW * sq, SHO + 4 * s);
  ctx.closePath();
  ctx.fillStyle = pele; ctx.fill(); ink(5.5); ctx.stroke();

  // músculos
  ink(3);
  ctx.beginPath();                                   // peitoral
  ctx.moveTo(-19 * s, CHEST - 2 * s);
  ctx.quadraticCurveTo(0, CHEST + 12 * s, 19 * s, CHEST - 2 * s);
  ctx.stroke();
  ctx.beginPath();                                   // linha do abdômen
  ctx.moveTo(0, CHEST + 8 * s); ctx.lineTo(0, WAIST - 2 * s);
  ctx.stroke();
  ink(2.4);
  for (let i = 1; i <= 2; i++) {                     // gomos
    const y = CHEST + 14 * s + i * 10 * s;
    ctx.beginPath(); ctx.moveTo(-9 * s, y); ctx.lineTo(9 * s, y); ctx.stroke();
  }

  // ═══ pescoço + cabeça ═══
  ctx.beginPath();
  ctx.rect(-6.5 * s, HEAD + 12 * s, 13 * s, 18 * s);
  ctx.fillStyle = sombra; ctx.fill(); ink(4); ctx.stroke();
  drawHead(f, 0, HEAD, s);

  // ═══ luva de trás (por cima do corpo) ═══
  glove(ba.hx, ba.hy, 18 * s, luva, d);

  // ═══ braço da frente ═══
  const fa = limb(d * 16 * s, SHO + 2 * s, P.lead.x, P.lead.y, B.UARM, B.FARM, d);
  seg(d * 16 * s, SHO + 2 * s, fa.jx, fa.jy, pele, 13 * s, 10 * s);
  seg(fa.jx, fa.jy, fa.hx, fa.hy, pele, 10 * s, 8 * s);
  glove(fa.hx, fa.hy, 19 * s, luva, d);

  if (f.state === 'block') {
    ctx.globalAlpha = .28;
    blob(d * 26 * s, SHO - 4 * s, 30 * s, 46 * s, GOLD, 4);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

// ═══════════════════════════════════════════════════════════════════════════
//  CENÁRIO
// ═══════════════════════════════════════════════════════════════════════════
function drawArena(tmm) {
  const gr = ctx.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, '#3a2a1c'); gr.addColorStop(.45, '#6b4f36'); gr.addColorStop(1, '#3a2a1c');
  ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);

  for (let i = 0; i < 3; i++) {
    const x = 200 + i * 280;
    const g2 = ctx.createRadialGradient(x, -60, 10, x, 300, 380);
    g2.addColorStop(0, 'rgba(255,236,180,.30)'); g2.addColorStop(1, 'rgba(255,236,180,0)');
    ctx.fillStyle = g2;
    ctx.beginPath(); ctx.moveTo(x, -40); ctx.lineTo(x - 200, 430); ctx.lineTo(x + 200, 430); ctx.closePath(); ctx.fill();
  }

  ctx.beginPath();
  ctx.moveTo(60, FLOOR); ctx.lineTo(900, FLOOR); ctx.lineTo(985, H); ctx.lineTo(-25, H); ctx.closePath();
  ctx.fillStyle = '#c9b58c'; ctx.fill(); ink(6); ctx.stroke();
  ctx.save(); ctx.clip();
  ctx.strokeStyle = 'rgba(26,20,16,.10)'; ctx.lineWidth = 14;
  for (let i = -2; i < 14; i++) { ctx.beginPath(); ctx.moveTo(60 + i * 70, FLOOR); ctx.lineTo(-25 + i * 82, H); ctx.stroke(); }
  ctx.restore();

  [0, 1, 2].forEach(i => {
    const y = FLOOR - 42 - i * 46;
    ctx.beginPath(); ctx.moveTo(50, y); ctx.lineTo(910, y);
    ink(9); ctx.stroke();
    ctx.strokeStyle = [RED, CREAM, BLUE][i]; ctx.lineWidth = 5; ctx.stroke();
  });
  [50, 910].forEach(x => {
    ctx.beginPath(); ctx.rect(x - 11, FLOOR - 190, 22, 198);
    ctx.fillStyle = GOLD; ctx.fill(); ink(5); ctx.stroke();
    blob(x, FLOOR - 198, 15, 15, RED, 5);
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
  const w = 620, h = 158, x = (W - w) / 2, y = 34;
  ctx.translate(0, Math.sin(t * .06) * 3);
  ctx.beginPath(); ctx.rect(x, y, w, h);
  ctx.fillStyle = PAPER; ctx.fill(); ink(7); ctx.stroke();
  ctx.beginPath(); ctx.rect(x + 12, y + 12, w - 24, h - 24); ink(3); ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = INK; ctx.font = 'bold 56px Georgia, serif';
  ctx.fillText(big, W / 2, y + 78);
  ctx.font = 'italic 23px Georgia, serif'; ctx.fillStyle = '#5c4633';
  ctx.fillText(small, W / 2, y + 120);
  ctx.textAlign = 'left';
  ctx.restore();
}

function blink(t, txt, y) {
  ctx.textAlign = 'center';
  ctx.font = 'bold 23px Georgia, serif';
  ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.lineJoin = 'round';
  ctx.strokeText(txt, W / 2, y);
  ctx.fillStyle = Math.floor(t / 20) % 2 ? GOLD : CREAM;
  ctx.fillText(txt, W / 2, y);
  ctx.textAlign = 'left';
}

function drawTitle(t) {
  ctx.textAlign = 'center';
  ctx.save();
  ctx.translate(W / 2, 148 + Math.sin(t * .05) * 6);
  ctx.font = 'bold 92px Georgia, serif';
  ctx.lineWidth = 14; ctx.strokeStyle = INK; ctx.lineJoin = 'round';
  ctx.strokeText('NOCAUTE!', 0, 0);
  const g = ctx.createLinearGradient(0, -60, 0, 20);
  g.addColorStop(0, GOLD); g.addColorStop(1, RED);
  ctx.fillStyle = g; ctx.fillText('NOCAUTE!', 0, 0);
  ctx.restore();

  ctx.font = 'italic 25px Georgia, serif'; ctx.fillStyle = PAPER;
  ctx.fillText('MMA de desenho animado', W / 2, 200);

  const bx = W / 2 - 250, by = 228, bw = 500, bh = 148;
  ctx.beginPath(); ctx.rect(bx, by, bw, bh);
  ctx.fillStyle = 'rgba(18,11,6,.66)'; ctx.fill(); ink(4); ctx.stroke();
  ctx.font = '20px Georgia, serif'; ctx.fillStyle = CREAM;
  const lines = isTouch
    ? ['◀ ▶  andar', 'SOCO  •  CHUTE', 'DEFESA segurar   •   ⏸ pausa']
    : ['A D  ou  ← →   andar', 'X  soco        Z  chute', 'S  defesa (segurar)      P  pausa'];
  lines.forEach((s, i) => ctx.fillText(s, W / 2, by + 44 + i * 35));

  blink(t, isTouch ? 'toque para começar' : 'aperte qualquer tecla', 432);
  ctx.textAlign = 'left';
}

// ── Escolha de lutador ────────────────────────────────────────────────────
const selDummies = SELECT.map((id, i) => {
  const f = makeFighter(byId(id), { x: 0, dir: 1, isPlayer: true });
  f.scale = byId(id).scale * .70; f.bob = i * 1.7;
  return f;
});
function drawSelect(t) {
  ctx.fillStyle = 'rgba(18,11,6,.42)'; ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.font = 'bold 42px Georgia, serif';
  ctx.lineWidth = 10; ctx.strokeStyle = INK; ctx.lineJoin = 'round';
  ctx.strokeText('ESCOLHA SEU LUTADOR', W / 2, 72);
  ctx.fillStyle = GOLD; ctx.fillText('ESCOLHA SEU LUTADOR', W / 2, 72);
  blink(t, isTouch ? '◀ ▶ escolher  •  SOCO confirma' : '← → escolher  •  X confirma', 110);

  const step = W / (SELECT.length + 1);
  selDummies.forEach((f, i) => {
    const on = i === pickIdx;
    f.x = step * (i + 1);
    f.bob += on ? .1 : .04;
    f.state = 'idle';
    if (on) {
      const g = ctx.createRadialGradient(f.x, FLOOR - 130, 10, f.x, FLOOR, 190);
      g.addColorStop(0, 'rgba(255,236,180,.32)'); g.addColorStop(1, 'rgba(255,236,180,0)');
      ctx.fillStyle = g; ctx.fillRect(f.x - 200, 130, 400, 400);
    }
    ctx.globalAlpha = on ? 1 : .5;
    drawFighter(f, 10 + i);
    ctx.globalAlpha = 1;

    ctx.font = on ? 'bold 20px Georgia, serif' : '17px Georgia, serif';
    ctx.lineWidth = 6; ctx.strokeStyle = INK;
    ctx.strokeText(f.nome, f.x, FLOOR + 40);
    ctx.fillStyle = on ? GOLD : PAPER;
    ctx.fillText(f.nome, f.x, FLOOR + 40);
    if (on) {
      ctx.font = 'bold 30px Georgia, serif';
      ctx.lineWidth = 7; ctx.strokeStyle = INK;
      const ay = 236 + Math.sin(t * .12) * 5;
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

  if (state === 'title')  { grainVignette(); drawTitle(tm);  ctx.restore(); return; }
  if (state === 'select') { grainVignette(); drawSelect(tm); ctx.restore(); return; }

  const order = player.x < foe.x ? [player, foe] : [foe, player];
  drawFighter(order[0], 1);
  drawFighter(order[1], 2);

  ctx.beginPath(); ctx.moveTo(-20, H - 14); ctx.lineTo(W + 20, H - 22);
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
    if (msgT > 40) blink(tm, isTouch ? 'toque para lutar' : 'aperte para lutar', 522);
  }
  if (state === 'ko')       cardText(msg, msgSub, tm);
  if (state === 'gameover') cardText('DERROTA', 'aperte para voltar', tm);
  if (state === 'win')      cardText('CAMPEÃO!', 'você limpou o octógono', tm);

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
