// =========================================
// JOGO DO DOMINIC — estilo Brawl Stars
// =========================================
// Mexa nos números pra customizar.

// ----- CONFIGS GERAIS -----
const VELOCIDADE_TIRO = 9;
const VELOCIDADE_INIMIGO = 0.9;
const TAMANHO_JOGADOR = 28;
const TAMANHO_INIMIGO = 28;
const TEMPO_ENTRE_INIMIGOS = 55;
const HP_INIMIGO = 2;
const TEMPO_RECARGA_BASE = 25;       // tempo pra recarregar 1 munição (menor = mais rápido)
const COOLDOWN_TIRO_SEGURADO = 6;    // intervalo entre tiros quando segura o botão
const SUPER_NECESSARIO = 5;
const VELOCIDADE_TIRO_SUPER = 11;
const TAMANHO_TIRO_SUPER = 18;
const DANO_SUPER = 5;
const COR_TIRO = '#ffff00';
const COR_SUPER = '#ff00ff';
const MOEDAS_POR_KILL = 2;

// ----- PERSONAGENS (brawlers) -----
const PERSONAGENS = [
  { id: 'azul',     nome: 'ÁGUA',     cor: '#33ccff', vida: 5, velocidade: 4, dano: 1, municao: 3, custo: 0,   descricao: 'Fluido e equilibrado', tipo: 'agua' },
  { id: 'roxo',     nome: 'VENENO',   cor: '#88ee22', vida: 8, velocidade: 3, dano: 1, municao: 3, custo: 50,  descricao: 'Tóxico, muita vida', tipo: 'veneno' },
  { id: 'verde',    nome: 'RAIO',     cor: '#ffee00', vida: 3, velocidade: 6, dano: 1, municao: 4, custo: 100, descricao: 'Elétrico e veloz', tipo: 'raio' },
  { id: 'vermelho', nome: 'FOGO',     cor: '#ff5511', vida: 4, velocidade: 4, dano: 2, municao: 2, custo: 200, descricao: 'Quente e poderoso', tipo: 'fogo' },
  { id: 'gelo',     nome: 'GELO',     cor: '#aaeeff', vida: 4, velocidade: 4, dano: 1, municao: 5, custo: 150, descricao: 'Atira muito', tipo: 'gelo' },
  { id: 'trovao',   nome: 'TROVÃO',   cor: '#9966ff', vida: 6, velocidade: 3, dano: 3, municao: 2, custo: 250, descricao: 'Dano explosivo', tipo: 'trovao' },
  { id: 'magma',    nome: 'MAGMA',    cor: '#ff7733', vida: 7, velocidade: 3, dano: 2, municao: 3, custo: 175, descricao: 'Lava densa e durável', tipo: 'magma' },
  { id: 'praga',    nome: 'PRAGA',    cor: '#6633aa', vida: 8, velocidade: 3, dano: 3, municao: 2, custo: 300, descricao: 'Veneno mortal', tipo: 'praga' },
  { id: 'vento',    nome: 'VENTO',    cor: '#ccddee', vida: 3, velocidade: 7, dano: 1, municao: 4, custo: 175, descricao: 'Leve e velocíssimo', tipo: 'vento' },
  { id: 'furacao',  nome: 'FURACÃO',  cor: '#5588aa', vida: 5, velocidade: 5, dano: 2, municao: 3, custo: 350, descricao: 'Tempestade rodopiante', tipo: 'furacao' },
  { id: 'luz',      nome: 'LUZ',      cor: '#ffee44', vida: 6, velocidade: 5, dano: 2, municao: 3, custo: 275, descricao: 'Sol radiante', tipo: 'luz' },
  { id: 'lua',      nome: 'LUA',      cor: '#e0e8ff', vida: 5, velocidade: 4, dano: 1, municao: 4, custo: 200, descricao: 'Calma e brilhante', tipo: 'lua' },
  { id: 'lunar',    nome: 'LUNAR',    cor: '#aaaaff', vida: 7, velocidade: 4, dano: 2, municao: 3, custo: 350, descricao: 'Poder cósmico', tipo: 'lunar' },
  { id: 'solar',    nome: 'SOLAR',    cor: '#ff6611', vida: 5, velocidade: 5, dano: 3, municao: 2, custo: 400, descricao: 'Sol explosivo', tipo: 'solar' },
];

// ----- MODOS DE JOGO (eventos) -----
const MODOS = [
  { id: 'sobrevivencia', nome: 'SOBREVIVÊNCIA', icone: '🎯', cor: '#22cc55', descricao: 'Inimigos sem fim. Sobreviva o máximo!', disponivel: true },
  { id: 'tempo',         nome: 'CONTRA O TEMPO', icone: '⏰', cor: '#ff9933', descricao: '60 segundos. Faça o máximo de pontos!', disponivel: true },
  { id: 'chefao',        nome: 'CHEFÃO',        icone: '👹', cor: '#aa3355', descricao: 'Lute contra chefões enormes!', disponivel: true },
];
function getModo(id) { return MODOS.find(m => m.id === id); }

// ----- PACOTES DE GEMAS VERDES (compra com moedas) -----
const PACOTES_GEMAS = [
  { id: 'gema_p', gemas: 10,  custo: 100, etiqueta: '' },
  { id: 'gema_m', gemas: 30,  custo: 250, etiqueta: 'OFERTA!' },
  { id: 'gema_g', gemas: 100, custo: 700, etiqueta: 'MEGA!' },
];

// ----- PACOTES DE MOEDAS (compra com gemas) -----
const PACOTES_MOEDAS = [
  { id: 'moeda_p', moedas: 100,  custo: 5,  etiqueta: '' },
  { id: 'moeda_m', moedas: 300,  custo: 12, etiqueta: 'OFERTA!' },
  { id: 'moeda_g', moedas: 1000, custo: 30, etiqueta: 'MEGA!' },
];

// ----- ITENS DA LOJA (melhorias permanentes) -----
const ITENS_LOJA = [
  { id: 'vidaExtra',     nome: '+1 Vida',         icone: '❤',  custoBase: 50,  efeito: '+1 vida máxima', max: 5 },
  { id: 'municaoExtra',  nome: '+1 Munição',      icone: '🎯', custoBase: 75,  efeito: '+1 munição máxima', max: 3 },
  { id: 'recargaRapida', nome: 'Recarga Rápida',  icone: '⚡', custoBase: 100, efeito: '-10% tempo recarga', max: 5 },
];

// ----- ESTADO PERSISTENTE (salva no navegador) -----
function carregarSalvo() {
  try {
    const dados = JSON.parse(localStorage.getItem('jogoDominic') || '{}');
    return {
      moedas: dados.moedas || 0,
      personagemAtual: dados.personagemAtual || 'azul',
      desbloqueados: dados.desbloqueados || ['azul', 'gelo'],
      melhorias: dados.melhorias || { vidaExtra: 0, municaoExtra: 0, recargaRapida: 0 },
      melhorPontuacao: dados.melhorPontuacao || 0,
      modoAtual: dados.modoAtual || 'sobrevivencia',
      recordeTempo: dados.recordeTempo || 0,
      mutado: dados.mutado || false,
      gemas: dados.gemas || 0,
      recordeChefao: dados.recordeChefao || 0,
    };
  } catch (e) {
    return { moedas: 0, personagemAtual: 'azul', desbloqueados: ['azul', 'gelo'], melhorias: { vidaExtra: 0, municaoExtra: 0, recargaRapida: 0 }, melhorPontuacao: 0, modoAtual: 'sobrevivencia', recordeTempo: 0, mutado: false, gemas: 0, recordeChefao: 0 };
  }
}
function salvar() {
  localStorage.setItem('jogoDominic', JSON.stringify(salvo));
}
let salvo = carregarSalvo();
// Reset único de moedas para todos os jogadores (uma vez só)
if (!localStorage.getItem('moedasReset_v1')) {
  salvo.moedas = 0;
  localStorage.setItem('moedasReset_v1', '1');
  localStorage.setItem('jogoDominic', JSON.stringify(salvo));
}
// Reset único: deixa só ÁGUA + GELO desbloqueados
if (!localStorage.getItem('desbloqueadosReset_v1')) {
  salvo.desbloqueados = ['azul', 'gelo'];
  if (!['azul', 'gelo'].includes(salvo.personagemAtual)) salvo.personagemAtual = 'azul';
  localStorage.setItem('desbloqueadosReset_v1', '1');
  localStorage.setItem('jogoDominic', JSON.stringify(salvo));
}

function getPersonagem(id) { return PERSONAGENS.find(p => p.id === id); }
function getCustoItem(item) { return Math.round(item.custoBase * Math.pow(1.5, salvo.melhorias[item.id])); }

// ----- TELA -----
const tela = document.getElementById('tela');
const ctx = tela.getContext('2d');
const placar = document.getElementById('placar');

// ----- ESTADO DO JOGO -----
let estado = 'menu'; // 'menu' | 'personagens' | 'loja' | 'countdown' | 'jogando' | 'gameOver'
let jogador;
let tiros = [];
let inimigos = [];
let pontos = 0;
let moedasGanhas = 0;
let contadorInimigos = 0;
let mouse = { x: 0, y: 0 };
let teclas = {};
let pausado = false;
let tremor = 0;
let segurandoTiro = false;     // segurando o botão/dedo pra atirar continuamente
let cooldownTiro = 0;          // espera entre tiros enquanto segura
let timerCountdown = 0;
let timerPartida = 0; // pra modo "tempo"
let ondaChefao = 1;   // qual chefão está enfrentando (modo "chefao")
const SEGUNDOS_TEMPO = 60;
let mensagemTemp = ''; // mensagem temporária (ex: "Sem moedas!")
let mensagemTimer = 0;
let lojaAba = 'melhorias'; // 'melhorias' | 'gemas' | 'moedas'

// ----- BOTÕES (sistema genérico) -----
// Cada tela popula esse array a cada frame; clicar verifica todos.
let botoes = [];
function btn(x, y, w, h, texto, acao, opcoes = {}) {
  botoes.push({ x, y, w, h, texto, acao, ...opcoes });
}
function mouseSobre(b) {
  return mouse.x >= b.x - b.w/2 && mouse.x <= b.x + b.w/2 &&
         mouse.y >= b.y - b.h/2 && mouse.y <= b.y + b.h/2;
}
function desenharBotao(b) {
  const hover = mouseSobre(b);
  const cor = b.desabilitado ? '#666' : (hover ? (b.corHover || '#ffe066') : (b.cor || '#ffcc00'));
  // sombra
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(b.x - b.w/2 + 4, b.y - b.h/2 + 5, b.w, b.h);
  // botão
  ctx.fillStyle = cor;
  ctx.fillRect(b.x - b.w/2, b.y - b.h/2, b.w, b.h);
  ctx.strokeStyle = b.corBorda || '#aa8800';
  ctx.lineWidth = 3;
  ctx.strokeRect(b.x - b.w/2, b.y - b.h/2, b.w, b.h);
  // texto
  ctx.fillStyle = b.corTexto || '#1a1a2e';
  ctx.font = b.fonte || 'bold 22px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(b.texto, b.x, b.y);
  ctx.textBaseline = 'alphabetic';
}

// ----- BOTÃO DE PAUSA -----
const botaoPausa = document.getElementById('botao-pausa');
botaoPausa.style.display = 'none';
function alternarPausa() {
  if (estado !== 'jogando') return;
  pausado = !pausado;
  botaoPausa.textContent = pausado ? '▶' : '⏸';
}
botaoPausa.addEventListener('click', (e) => { e.stopPropagation(); alternarPausa(); });

// ----- INPUT -----
window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  teclas[k] = true;
  if (k === 'p') alternarPausa();
  if (k === 'q' && estado === 'jogando') tentarSuper();
  if (k === 'escape' && (estado === 'personagens' || estado === 'loja' || estado === 'eventos')) estado = 'menu';
});
window.addEventListener('keyup', (e) => { teclas[e.key.toLowerCase()] = false; });

// converte coords do display (CSS) pra coords internas do canvas
function pegarCoord(clientX, clientY) {
  const rect = tela.getBoundingClientRect();
  const sx = tela.width / rect.width;
  const sy = tela.height / rect.height;
  return { x: (clientX - rect.left) * sx, y: (clientY - rect.top) * sy };
}

tela.addEventListener('mousemove', (e) => {
  const c = pegarCoord(e.clientX, e.clientY);
  mouse.x = c.x; mouse.y = c.y;
  let sobre = false;
  for (const b of botoes) { if (mouseSobre(b)) { sobre = true; break; } }
  tela.style.cursor = sobre ? 'pointer' : (estado === 'jogando' ? 'crosshair' : 'default');
});

tela.addEventListener('click', (e) => {
  const c = pegarCoord(e.clientX, e.clientY);
  mouse.x = c.x; mouse.y = c.y;
  for (const b of botoes) {
    if (mouseSobre(b) && !b.desabilitado) { b.acao(); return; }
  }
  // tiros agora são tratados via mousedown/mouseup (segurar pra atirar continuamente)
});

// segurar mouse pra atirar continuamente
tela.addEventListener('mousedown', (e) => {
  const c = pegarCoord(e.clientX, e.clientY);
  mouse.x = c.x; mouse.y = c.y;
  // se está em algum botão, ignora (deixa o click handler tratar)
  for (const b of botoes) { if (mouseSobre(b)) return; }
  if (estado === 'jogando' && !pausado) {
    segurandoTiro = true;
    cooldownTiro = 0; // atira já no primeiro frame
  }
});
tela.addEventListener('mouseup',    () => { segurandoTiro = false; });
tela.addEventListener('mouseleave', () => { segurandoTiro = false; });

// suporte básico a touch (mobile/tablet)
tela.addEventListener('touchstart', (e) => {
  if (!e.touches[0]) return;
  e.preventDefault();
  const t = e.touches[0];
  const c = pegarCoord(t.clientX, t.clientY);
  mouse.x = c.x; mouse.y = c.y;
  for (const b of botoes) {
    if (mouseSobre(b) && !b.desabilitado) { b.acao(); return; }
  }
  if (estado === 'jogando' && !pausado) {
    segurandoTiro = true;
    cooldownTiro = 0;
  }
}, { passive: false });

tela.addEventListener('touchmove', (e) => {
  if (!e.touches[0]) return;
  e.preventDefault();
  const t = e.touches[0];
  const c = pegarCoord(t.clientX, t.clientY);
  mouse.x = c.x; mouse.y = c.y;
}, { passive: false });

tela.addEventListener('touchend',    () => { segurandoTiro = false; });
tela.addEventListener('touchcancel', () => { segurandoTiro = false; });

// ----- INICIAR PARTIDA -----
function iniciarPartida() {
  const p = getPersonagem(salvo.personagemAtual);
  jogador = {
    x: tela.width / 2,
    y: tela.height / 2,
    vidas: p.vida + salvo.melhorias.vidaExtra,
    vidasMax: p.vida + salvo.melhorias.vidaExtra,
    velocidade: p.velocidade,
    dano: p.dano,
    municao: p.municao + salvo.melhorias.municaoExtra,
    municaoMax: p.municao + salvo.melhorias.municaoExtra,
    contadorRecarga: 0,
    superCarga: 0,
    cor: p.cor,
    tipo: p.tipo,
  };
  tiros = [];
  inimigos = [];
  pontos = 0;
  moedasGanhas = 0;
  contadorInimigos = 0;
  pausado = false;
  tremor = 0;
  timerPartida = SEGUNDOS_TEMPO * 60; // só usado no modo "tempo"
  ondaChefao = 1;
  if (salvo.modoAtual === 'chefao') spawnarChefao();
  botaoPausa.textContent = '⏸';
  botaoPausa.style.display = 'flex';
  estado = 'countdown';
  timerCountdown = 60 * 4; // 3, 2, 1, VAI!
}

function temposRecarga() {
  return Math.max(15, TEMPO_RECARGA_BASE - salvo.melhorias.recargaRapida * 5);
}

// ----- AÇÕES DE COMPRA / SELEÇÃO -----
function comprarPersonagem(id) {
  const p = getPersonagem(id);
  if (salvo.desbloqueados.includes(id)) {
    salvo.personagemAtual = id;
    mostrarMensagem(p.nome + ' selecionado!');
  } else if (salvo.moedas >= p.custo) {
    salvo.moedas -= p.custo;
    salvo.desbloqueados.push(id);
    salvo.personagemAtual = id;
    mostrarMensagem('Comprou ' + p.nome + '!');
  } else {
    mostrarMensagem('Moedas insuficientes!');
  }
  salvar();
}

function comprarMelhoria(item) {
  if (salvo.melhorias[item.id] >= item.max) {
    mostrarMensagem('Já está no nível máximo!');
    return;
  }
  const custo = getCustoItem(item);
  if (salvo.moedas >= custo) {
    salvo.moedas -= custo;
    salvo.melhorias[item.id] += 1;
    mostrarMensagem('Comprou ' + item.nome + '!');
    salvar();
  } else {
    mostrarMensagem('Moedas insuficientes!');
  }
}

function comprarPacoteGemas(pacote) {
  if (salvo.moedas >= pacote.custo) {
    salvo.moedas -= pacote.custo;
    salvo.gemas += pacote.gemas;
    mostrarMensagem('+' + pacote.gemas + ' gemas verdes!');
    salvar();
  } else {
    mostrarMensagem('Moedas insuficientes!');
  }
}

function comprarPacoteMoedas(pacote) {
  if (salvo.gemas >= pacote.custo) {
    salvo.gemas -= pacote.custo;
    salvo.moedas += pacote.moedas;
    mostrarMensagem('+' + pacote.moedas + ' moedas!');
    salvar();
  } else {
    mostrarMensagem('Gemas insuficientes!');
  }
}

function mostrarMensagem(txt) {
  mensagemTemp = txt;
  mensagemTimer = 90;
}

// ----- TIRO NORMAL -----
function atirar() {
  if (jogador.municao <= 0) return;
  jogador.municao -= 1;
  const dx = mouse.x - jogador.x, dy = mouse.y - jogador.y;
  const d = Math.sqrt(dx*dx + dy*dy) || 1;
  tiros.push({
    x: jogador.x, y: jogador.y,
    dx: (dx/d)*VELOCIDADE_TIRO, dy: (dy/d)*VELOCIDADE_TIRO,
    raio: 6, dano: jogador.dano, super: false,
    tipo: jogador.tipo,
    cor: jogador.cor,
    nascido: Date.now(),
    rastro: [],
  });
}

// ----- SUPER -----
function tentarSuper() {
  if (estado !== 'jogando' || pausado) return;
  if (jogador.superCarga < SUPER_NECESSARIO) return;
  jogador.superCarga = 0;
  const dx = mouse.x - jogador.x, dy = mouse.y - jogador.y;
  const d = Math.sqrt(dx*dx + dy*dy) || 1;
  tiros.push({
    x: jogador.x, y: jogador.y,
    dx: (dx/d)*VELOCIDADE_TIRO_SUPER, dy: (dy/d)*VELOCIDADE_TIRO_SUPER,
    raio: TAMANHO_TIRO_SUPER, dano: DANO_SUPER, super: true,
    tipo: jogador.tipo,
    cor: jogador.cor,
    nascido: Date.now(),
    rastro: [],
  });
}

// ----- ATUALIZAÇÕES DO JOGO -----
function moverJogador() {
  const v = jogador.velocidade;
  if (teclas['w'] || teclas['arrowup'])    jogador.y -= v;
  if (teclas['s'] || teclas['arrowdown'])  jogador.y += v;
  if (teclas['a'] || teclas['arrowleft'])  jogador.x -= v;
  if (teclas['d'] || teclas['arrowright']) jogador.x += v;
  jogador.x = Math.max(TAMANHO_JOGADOR/2, Math.min(tela.width  - TAMANHO_JOGADOR/2, jogador.x));
  jogador.y = Math.max(TAMANHO_JOGADOR/2, Math.min(tela.height - TAMANHO_JOGADOR/2, jogador.y));
}
function recarregar() {
  if (jogador.municao < jogador.municaoMax) {
    jogador.contadorRecarga += 1;
    if (jogador.contadorRecarga >= temposRecarga()) {
      jogador.municao += 1;
      jogador.contadorRecarga = 0;
    }
  } else {
    jogador.contadorRecarga = 0;
  }
}
function criarInimigo() {
  const lado = Math.floor(Math.random() * 4);
  let x, y;
  if (lado === 0) { x = Math.random() * tela.width;  y = -20; }
  if (lado === 1) { x = tela.width + 20;             y = Math.random() * tela.height; }
  if (lado === 2) { x = Math.random() * tela.width;  y = tela.height + 20; }
  if (lado === 3) { x = -20;                         y = Math.random() * tela.height; }
  inimigos.push({ x, y, hp: HP_INIMIGO, hpMax: HP_INIMIGO, flash: 0, seed: Math.random() * 1000, tamanho: TAMANHO_INIMIGO });
}

// chefão: grande, lento, vida alta
function spawnarChefao() {
  // aparece dentro da tela em um dos 4 cantos (longe do jogador)
  const lado = Math.floor(Math.random() * 4);
  let x, y;
  if (lado === 0) { x = 100;             y = 100; }              // canto superior esquerdo
  if (lado === 1) { x = tela.width - 100; y = 100; }             // canto superior direito
  if (lado === 2) { x = 100;             y = tela.height - 150; } // canto inferior esquerdo
  if (lado === 3) { x = tela.width - 100; y = tela.height - 150; } // canto inferior direito
  const hp = 8 + ondaChefao * 4;
  inimigos.push({ x, y, hp, hpMax: hp, flash: 0, seed: Math.random() * 1000, tamanho: 80, boss: true });
}
function moverInimigos() {
  for (const inimigo of inimigos) {
    const dx = jogador.x - inimigo.x, dy = jogador.y - inimigo.y;
    const d = Math.sqrt(dx*dx + dy*dy) || 1;
    inimigo.x += (dx/d) * VELOCIDADE_INIMIGO;
    inimigo.y += (dy/d) * VELOCIDADE_INIMIGO;
    if (inimigo.flash > 0) inimigo.flash -= 1;
  }
}
function moverTiros() {
  for (const t of tiros) {
    // guarda últimas posições pra rastro
    t.rastro.push({ x: t.x, y: t.y });
    if (t.rastro.length > 6) t.rastro.shift();
    t.x += t.dx; t.y += t.dy;
  }
  tiros = tiros.filter(t => t.x > -50 && t.x < tela.width + 50 && t.y > -50 && t.y < tela.height + 50);
}
function verificarColisoes() {
  for (let i = inimigos.length - 1; i >= 0; i--) {
    const tamI = inimigos[i].tamanho || TAMANHO_INIMIGO;
    for (let j = tiros.length - 1; j >= 0; j--) {
      const dx = inimigos[i].x - tiros[j].x, dy = inimigos[i].y - tiros[j].y;
      if (Math.sqrt(dx*dx + dy*dy) < tamI/2 + tiros[j].raio) {
        inimigos[i].hp -= tiros[j].dano;
        inimigos[i].flash = 6;
        const eraSuper = tiros[j].super;
        const eraBoss = inimigos[i].boss;
        if (!eraSuper) tiros.splice(j, 1);
        if (inimigos[i].hp <= 0) {
          inimigos.splice(i, 1);
          if (eraBoss) {
            pontos += 100;
            moedasGanhas += 15;
          } else {
            pontos += 10;
            moedasGanhas += MOEDAS_POR_KILL;
          }
          jogador.superCarga = Math.min(SUPER_NECESSARIO, jogador.superCarga + 1);
        } else {
          jogador.superCarga = Math.min(SUPER_NECESSARIO, jogador.superCarga + 1);
        }
        break;
      }
    }
  }
  for (let i = inimigos.length - 1; i >= 0; i--) {
    const tamI = inimigos[i].tamanho || TAMANHO_INIMIGO;
    const dx = inimigos[i].x - jogador.x, dy = inimigos[i].y - jogador.y;
    if (Math.sqrt(dx*dx + dy*dy) < (tamI + TAMANHO_JOGADOR) / 2) {
      const eraBoss = inimigos[i].boss;
      // chefão não morre encostando — só dá dano e empurra o jogador um pouco pra trás
      if (eraBoss) {
        const d = Math.sqrt(dx*dx + dy*dy) || 1;
        jogador.x -= (dx/d) * 30;
        jogador.y -= (dy/d) * 30;
        jogador.vidas -= 2;
      } else {
        inimigos.splice(i, 1);
        jogador.vidas -= 1;
      }
      tremor = 12;
      if (jogador.vidas <= 0) finalizarPartida();
    }
  }
}
function finalizarPartida() {
  estado = 'gameOver';
  botaoPausa.style.display = 'none';
  // adicionar moedas ganhas ao salvo
  salvo.moedas += moedasGanhas;
  // recorde por modo
  if (salvo.modoAtual === 'tempo') {
    if (pontos > salvo.recordeTempo) salvo.recordeTempo = pontos;
  } else if (salvo.modoAtual === 'chefao') {
    if (pontos > salvo.recordeChefao) salvo.recordeChefao = pontos;
  } else {
    if (pontos > salvo.melhorPontuacao) salvo.melhorPontuacao = pontos;
  }
  salvar();
}

// ----- SAIR DA PARTIDA (volta pro menu, guarda as moedas) -----
function sairPartida() {
  salvo.moedas += moedasGanhas;
  if (salvo.modoAtual === 'tempo') {
    if (pontos > salvo.recordeTempo) salvo.recordeTempo = pontos;
  } else if (salvo.modoAtual === 'chefao') {
    if (pontos > salvo.recordeChefao) salvo.recordeChefao = pontos;
  } else {
    if (pontos > salvo.melhorPontuacao) salvo.melhorPontuacao = pontos;
  }
  salvar();
  pausado = false;
  estado = 'menu';
  botaoPausa.style.display = 'none';
  botaoPausa.textContent = '⏸';
}

// ----- DESENHAR -----
function desenhar() {
  botoes = []; // limpa botões da tela atual

  // tremor de tela
  ctx.save();
  if (tremor > 0 && estado === 'jogando') {
    ctx.translate((Math.random()-0.5)*tremor, (Math.random()-0.5)*tremor);
    tremor -= 1;
  }
  ctx.clearRect(-50, -50, tela.width + 100, tela.height + 100);

  // fundo gradiente bonito em todas as telas
  desenharFundo();

  if (estado === 'menu') desenharMenu();
  else if (estado === 'personagens') desenharPersonagens();
  else if (estado === 'eventos') desenharEventos();
  else if (estado === 'loja') desenharLoja();
  else if (estado === 'jogando' || estado === 'countdown' || estado === 'gameOver') desenharPartida();

  ctx.restore();

  // overlays
  if (estado === 'countdown') desenharCountdown();
  if (estado === 'gameOver') desenharGameOver();
  if (pausado && estado === 'jogando') desenharPausado();
  if (mensagemTimer > 0) {
    desenharMensagem();
    mensagemTimer -= 1;
  }
}

function desenharFundo() {
  if (estado === 'jogando' || estado === 'countdown' || estado === 'gameOver') {
    ctx.fillStyle = '#0f0f1e';
    ctx.fillRect(0, 0, tela.width, tela.height);
  } else {
    const grad = ctx.createRadialGradient(tela.width/2, tela.height/2, 50, tela.width/2, tela.height/2, 600);
    grad.addColorStop(0, '#2a1a4e');
    grad.addColorStop(1, '#0f0f1e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, tela.width, tela.height);
  }
}

// ----- TELA: MENU PRINCIPAL -----
function desenharMenu() {
  // título
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffcc00';
  ctx.font = 'bold 56px Arial';
  ctx.fillText('LUTA', tela.width/2, 110);
  ctx.font = 'bold 76px Arial';
  ctx.fillStyle = '#ff66cc';
  ctx.fillText('ELEMENTAL', tela.width/2, 185);

  // moedas + gemas no canto
  desenharMoedas(tela.width - 250, 30);
  desenharGemasContador(tela.width - 100, 30);

  // melhor pontuação
  if (salvo.melhorPontuacao > 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('🏆 Recorde: ' + salvo.melhorPontuacao, 20, 40);
  }

  // personagem atual no centro
  const p = getPersonagem(salvo.personagemAtual);
  const px = tela.width/2, py = 290;
  // plataforma
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(px, py + 50, 70, 18, 0, 0, Math.PI*2);
  ctx.fill();
  // personagem (visual baseado no tipo)
  desenharPersonagemVisual(px, py, 80, p, true);
  // nome do personagem
  ctx.fillStyle = 'white';
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(p.nome, px, py + 90);
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '14px Arial';
  ctx.fillText(p.descricao, px, py + 110);

  // mostrar evento atual (texto pequeno acima do botão jogar)
  const modo = getModo(salvo.modoAtual);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = '13px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Modo: ' + modo.icone + ' ' + modo.nome, tela.width/2, tela.height - 130);

  // 4 botões: Personagens, Eventos, Jogar, Loja
  btn(120, tela.height - 80, 175, 65, 'PERSONAGENS', () => { estado = 'personagens'; }, { fonte: 'bold 14px Arial', cor: '#66ccff', corHover: '#99ddff', corBorda: '#225577' });
  btn(305, tela.height - 80, 175, 65, modo.icone + ' EVENTOS',     () => { estado = 'eventos'; },     { fonte: 'bold 15px Arial', cor: '#cc66ff', corHover: '#dd99ff', corBorda: '#552288' });
  btn(495, tela.height - 80, 195, 80, 'JOGAR',       () => { iniciarPartida(); },     { fonte: 'bold 28px Arial', cor: '#22cc55', corHover: '#33dd66', corBorda: '#117733', corTexto: 'white' });
  btn(680, tela.height - 80, 175, 65, 'LOJA',        () => { estado = 'loja'; },      { fonte: 'bold 18px Arial', cor: '#ff9933', corHover: '#ffaa55', corBorda: '#883300' });

  for (const b of botoes) desenharBotao(b);
}

function desenharMoedas(x, y) {
  ctx.fillStyle = '#ffcc00';
  ctx.beginPath();
  ctx.arc(x, y, 14, 0, Math.PI*2);
  ctx.fill();
  ctx.strokeStyle = '#aa8800';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#aa8800';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('$', x, y + 1);
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = 'white';
  ctx.font = 'bold 22px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(salvo.moedas, x + 22, y + 8);
}

// ----- TELA: PERSONAGENS -----
function desenharPersonagens() {
  ctx.textAlign = 'center';
  ctx.fillStyle = '#66ccff';
  ctx.font = 'bold 36px Arial';
  ctx.fillText('PERSONAGENS', tela.width/2, 45);

  desenharMoedas(tela.width - 150, 30);

  // grid adapta ao número de personagens
  const total = PERSONAGENS.length;
  let colunas, cardW, cardH, espX, espY, startY;
  if (total <= 6) {
    colunas = 3; cardW = 240; cardH = 165; espX = 255; espY = 185; startY = 165;
  } else if (total <= 9) {
    colunas = 3; cardW = 240; cardH = 130; espX = 255; espY = 145; startY = 130;
  } else if (total <= 12) {
    colunas = 4; cardW = 175; cardH = 140; espX = 190; espY = 160; startY = 130;
  } else {
    // 13+ → 5 colunas, até 15 personagens em 3 linhas
    colunas = 5; cardW = 145; cardH = 130; espX = 152; espY = 150; startY = 140;
  }
  const linhas = Math.ceil(total / colunas);
  const startX = tela.width/2 - (espX * (colunas - 1)) / 2;

  for (let i = 0; i < total; i++) {
    const p = PERSONAGENS[i];
    const col = i % colunas, row = Math.floor(i / colunas);
    const cx = startX + col * espX;
    const cy = startY + row * espY;
    desenharCardPersonagem(p, cx, cy, cardW, cardH);
  }

  // botão voltar
  btn(80, tela.height - 50, 120, 50, '◀ VOLTAR', () => { estado = 'menu'; }, { fonte: 'bold 16px Arial' });
  for (const b of botoes) desenharBotao(b);
}

function desenharCardPersonagem(p, cx, cy, w, h) {
  const desbloqueado = salvo.desbloqueados.includes(p.id);
  const selecionado = salvo.personagemAtual === p.id;
  const compacto = w < 220; // layout vertical pra cards estreitos

  // fundo do card
  ctx.fillStyle = selecionado ? 'rgba(102,204,255,0.25)' : 'rgba(255,255,255,0.08)';
  ctx.fillRect(cx - w/2, cy - h/2, w, h);
  ctx.strokeStyle = selecionado ? '#66ccff' : 'rgba(255,255,255,0.2)';
  ctx.lineWidth = selecionado ? 4 : 2;
  ctx.strokeRect(cx - w/2, cy - h/2, w, h);

  if (compacto) {
    // ----- LAYOUT VERTICAL (card estreito) -----
    const iconSize = 44;
    const iconY = cy - h/2 + 30;
    if (desbloqueado) {
      desenharPersonagemVisual(cx, iconY, iconSize, p, false);
    } else {
      ctx.fillStyle = '#444';
      ctx.fillRect(cx - 22, iconY - 22, 44, 44);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.strokeRect(cx - 22, iconY - 22, 44, 44);
      ctx.fillStyle = 'white';
      ctx.font = 'bold 22px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🔒', cx, iconY);
      ctx.textBaseline = 'alphabetic';
    }
    ctx.textAlign = 'center';
    ctx.fillStyle = 'white';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(p.nome, cx, cy + 12);
    ctx.font = '10px Arial';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText('❤'+p.vida+'  ⚡'+p.velocidade+'  🔥'+p.dano, cx, cy + 28);
  } else {
    // ----- LAYOUT HORIZONTAL (card largo) -----
    const cxIcone = cx - w/2 + 60, cyIcone = cy;
    if (desbloqueado) {
      desenharPersonagemVisual(cxIcone, cyIcone, 60, p, false);
    } else {
      ctx.fillStyle = '#444';
      ctx.fillRect(cxIcone - 30, cyIcone - 30, 60, 60);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.strokeRect(cxIcone - 30, cyIcone - 30, 60, 60);
      ctx.fillStyle = 'white';
      ctx.font = 'bold 28px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🔒', cxIcone, cyIcone);
      ctx.textBaseline = 'alphabetic';
    }
    const tx = cx - w/2 + 110;
    ctx.textAlign = 'left';
    ctx.fillStyle = 'white';
    ctx.font = 'bold 20px Arial';
    ctx.fillText(p.nome, tx, cy - 35);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '12px Arial';
    ctx.fillText(p.descricao, tx, cy - 18);
    ctx.font = '13px Arial';
    ctx.fillStyle = '#22cc55';
    ctx.fillText('❤ Vida: ' + p.vida, tx, cy + 2);
    ctx.fillStyle = '#66ccff';
    ctx.fillText('⚡ Vel: ' + p.velocidade, tx, cy + 20);
    ctx.fillStyle = '#ff9933';
    ctx.fillText('🔥 Dano: ' + p.dano, tx, cy + 38);
  }

  // botão ação (mesmo nos dois layouts)
  const txtCompra = compacto ? p.custo + '💰' : 'COMPRAR (' + p.custo + ' 💰)';
  const txtSelec  = compacto ? '✓ SELEC.' : '✓ SELECIONADO';
  const txtSel2   = compacto ? 'SELECIONAR' : 'SELECIONAR';
  const fonte     = compacto ? 'bold 12px Arial' : 'bold 14px Arial';
  if (selecionado) {
    btn(cx, cy + h/2 - 22, w - 20, 30, txtSelec, () => {}, { cor: '#444', corBorda: '#222', corTexto: 'white', desabilitado: true, fonte });
  } else if (desbloqueado) {
    btn(cx, cy + h/2 - 22, w - 20, 30, txtSel2, () => comprarPersonagem(p.id), { cor: '#22cc55', corHover: '#33dd66', corBorda: '#117733', corTexto: 'white', fonte });
  } else {
    const podeComprar = salvo.moedas >= p.custo;
    btn(cx, cy + h/2 - 22, w - 20, 30, txtCompra, () => comprarPersonagem(p.id), { cor: podeComprar ? '#ffcc00' : '#666', corHover: podeComprar ? '#ffe066' : '#666', desabilitado: !podeComprar, fonte });
  }
}

// ----- TELA: EVENTOS (modos de jogo) -----
function desenharEventos() {
  ctx.textAlign = 'center';
  ctx.fillStyle = '#cc66ff';
  ctx.font = 'bold 42px Arial';
  ctx.fillText('EVENTOS', tela.width/2, 60);
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '14px Arial';
  ctx.fillText('Escolha o modo e clique JOGAR no menu', tela.width/2, 90);

  desenharMoedas(tela.width - 150, 30);

  // 3 cards lado a lado
  const cardW = 230, cardH = 280;
  const esp = 250;
  const startX = tela.width/2 - esp;

  for (let i = 0; i < MODOS.length; i++) {
    const m = MODOS[i];
    const cx = startX + i * esp;
    const cy = tela.height/2 + 10;
    desenharCardModo(m, cx, cy, cardW, cardH);
  }

  btn(80, tela.height - 50, 120, 50, '◀ VOLTAR', () => { estado = 'menu'; }, { fonte: 'bold 16px Arial' });
  for (const b of botoes) desenharBotao(b);
}

function desenharCardModo(m, cx, cy, w, h) {
  const selecionado = salvo.modoAtual === m.id;
  // fundo
  ctx.fillStyle = selecionado ? 'rgba(204,102,255,0.2)' : 'rgba(255,255,255,0.06)';
  ctx.fillRect(cx - w/2, cy - h/2, w, h);
  ctx.strokeStyle = selecionado ? '#cc66ff' : (m.disponivel ? m.cor : '#555');
  ctx.lineWidth = selecionado ? 4 : 2;
  ctx.strokeRect(cx - w/2, cy - h/2, w, h);

  // ícone gigante
  ctx.fillStyle = m.disponivel ? 'white' : '#888';
  ctx.font = 'bold 60px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(m.icone, cx, cy - 60);

  // nome
  ctx.fillStyle = m.disponivel ? m.cor : '#888';
  ctx.font = 'bold 20px Arial';
  ctx.fillText(m.nome, cx, cy - 10);

  // descrição (com quebra simples)
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = '12px Arial';
  desenharTextoMultilinha(m.descricao, cx, cy + 15, w - 30, 16);

  // recorde do modo
  if (m.id === 'sobrevivencia' && salvo.melhorPontuacao > 0) {
    ctx.fillStyle = '#ffcc00';
    ctx.font = 'bold 13px Arial';
    ctx.fillText('🏆 ' + salvo.melhorPontuacao, cx, cy + 70);
  } else if (m.id === 'tempo' && salvo.recordeTempo > 0) {
    ctx.fillStyle = '#ffcc00';
    ctx.font = 'bold 13px Arial';
    ctx.fillText('🏆 ' + salvo.recordeTempo, cx, cy + 70);
  } else if (m.id === 'chefao' && salvo.recordeChefao > 0) {
    ctx.fillStyle = '#ffcc00';
    ctx.font = 'bold 13px Arial';
    ctx.fillText('🏆 ' + salvo.recordeChefao, cx, cy + 70);
  }

  // botão selecionar / em breve
  if (!m.disponivel) {
    btn(cx, cy + h/2 - 28, w - 30, 36, 'EM BREVE', () => {}, { cor: '#666', corBorda: '#333', corTexto: 'white', desabilitado: true, fonte: 'bold 14px Arial' });
  } else if (selecionado) {
    btn(cx, cy + h/2 - 28, w - 30, 36, '✓ SELECIONADO', () => {}, { cor: '#444', corBorda: '#222', corTexto: 'white', desabilitado: true, fonte: 'bold 14px Arial' });
  } else {
    btn(cx, cy + h/2 - 28, w - 30, 36, 'SELECIONAR', () => { salvo.modoAtual = m.id; salvar(); mostrarMensagem('Modo: ' + m.nome); }, { cor: m.cor, corHover: '#ffe066', corBorda: '#aa8800', corTexto: 'white', fonte: 'bold 14px Arial' });
  }
}

// helper pra quebrar texto em várias linhas
function desenharTextoMultilinha(texto, x, y, larguraMax, alturaLinha) {
  const palavras = texto.split(' ');
  let linha = '';
  let yy = y;
  for (const palavra of palavras) {
    const teste = linha ? linha + ' ' + palavra : palavra;
    if (ctx.measureText(teste).width > larguraMax && linha) {
      ctx.fillText(linha, x, yy);
      linha = palavra;
      yy += alturaLinha;
    } else {
      linha = teste;
    }
  }
  if (linha) ctx.fillText(linha, x, yy);
}

// ----- TELA: LOJA -----
function desenharLoja() {
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ff9933';
  ctx.font = 'bold 32px Arial';
  ctx.fillText('LOJA', tela.width/2, 38);

  // contadores: moedas + gemas
  desenharMoedas(tela.width - 250, 30);
  desenharGemasContador(tela.width - 100, 30);

  // ===== ABAS =====
  const abas = [
    { id: 'melhorias', nome: '⚙ MELHORIAS', cor: '#ff9933' },
    { id: 'gemas',     nome: '💎 GEMAS',    cor: '#22cc55' },
    { id: 'moedas',    nome: '💰 MOEDAS',   cor: '#ffcc00' },
  ];
  for (let i = 0; i < abas.length; i++) {
    const a = abas[i];
    const ativo = lojaAba === a.id;
    btn(200 + i * 200, 90, 180, 42, a.nome, () => { lojaAba = a.id; }, {
      cor:       ativo ? a.cor : 'rgba(255,255,255,0.1)',
      corHover:  ativo ? a.cor : 'rgba(255,255,255,0.2)',
      corBorda:  ativo ? '#000' : 'rgba(255,255,255,0.3)',
      corTexto:  ativo ? '#1a1a2e' : 'rgba(255,255,255,0.7)',
      fonte: 'bold 16px Arial',
    });
  }

  // ===== CONTEÚDO DA ABA ATIVA =====
  const cardW = 220, cardH = 280;
  const esp = 250;
  const startX = tela.width/2 - esp;
  const cardY = tela.height/2 + 40;

  if (lojaAba === 'melhorias') {
    for (let i = 0; i < ITENS_LOJA.length; i++) {
      desenharCardItem(ITENS_LOJA[i], startX + i * esp, cardY, cardW, cardH);
    }
  } else if (lojaAba === 'gemas') {
    for (let i = 0; i < PACOTES_GEMAS.length; i++) {
      desenharCardGemas(PACOTES_GEMAS[i], startX + i * esp, cardY, cardW, cardH);
    }
  } else if (lojaAba === 'moedas') {
    for (let i = 0; i < PACOTES_MOEDAS.length; i++) {
      desenharCardMoedasPacote(PACOTES_MOEDAS[i], startX + i * esp, cardY, cardW, cardH);
    }
  }

  btn(80, tela.height - 35, 120, 50, '◀ VOLTAR', () => { estado = 'menu'; }, { fonte: 'bold 16px Arial' });
  for (const b of botoes) desenharBotao(b);
}

// card de pacote de moedas (similar ao de gemas, mas dourado)
function desenharCardMoedasPacote(pacote, cx, cy, w, h) {
  const podeComprar = salvo.gemas >= pacote.custo;

  // fundo dourado
  ctx.fillStyle = 'rgba(255,204,0,0.15)';
  ctx.fillRect(cx - w/2, cy - h/2, w, h);
  ctx.strokeStyle = '#ffcc00';
  ctx.lineWidth = 3;
  ctx.strokeRect(cx - w/2, cy - h/2, w, h);

  // moeda grande no card
  desenharMoedaGrande(cx, cy - 50, 32);

  // etiqueta
  if (pacote.etiqueta) {
    ctx.fillStyle = '#22cc55';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(pacote.etiqueta, cx, cy - h/2 + 18);
  }

  // quantidade
  ctx.fillStyle = 'white';
  ctx.font = 'bold 26px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(pacote.moedas + ' moedas', cx, cy + 10);

  // custo (em gemas)
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = '13px Arial';
  ctx.fillText('por ' + pacote.custo + ' 💎 gemas', cx, cy + 30);

  // botão de compra
  btn(cx, cy + h/2 - 22, w - 30, 32, 'COMPRAR', () => comprarPacoteMoedas(pacote), { cor: podeComprar ? '#22cc55' : '#666', corHover: podeComprar ? '#33dd66' : '#666', corTexto: 'white', desabilitado: !podeComprar, fonte: 'bold 14px Arial' });
}

// moeda grande decorativa
function desenharMoedaGrande(cx, cy, raio) {
  const grad = ctx.createRadialGradient(cx - raio*0.3, cy - raio*0.3, raio*0.1, cx, cy, raio);
  grad.addColorStop(0, '#ffe066');
  grad.addColorStop(0.7, '#ffcc00');
  grad.addColorStop(1, '#aa8800');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, raio, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#665500';
  ctx.lineWidth = 2;
  ctx.stroke();
  // símbolo $
  ctx.fillStyle = '#aa8800';
  ctx.font = 'bold ' + (raio * 1.1) + 'px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('$', cx, cy + 1);
  ctx.textBaseline = 'alphabetic';
  // brilho
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  ctx.ellipse(cx - raio*0.3, cy - raio*0.4, raio*0.25, raio*0.15, -0.4, 0, Math.PI*2);
  ctx.fill();
}

// contador de gemas (igual o de moedas, mas verde)
function desenharGemasContador(x, y) {
  // diamante verde
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#22ff66';
  ctx.beginPath();
  ctx.moveTo(0, -12);
  ctx.lineTo(8, 0);
  ctx.lineTo(0, 12);
  ctx.lineTo(-8, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#117733';
  ctx.lineWidth = 2;
  ctx.stroke();
  // brilho
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath();
  ctx.moveTo(-3, -6);
  ctx.lineTo(0, -8);
  ctx.lineTo(2, -3);
  ctx.lineTo(-2, -1);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  // número
  ctx.fillStyle = 'white';
  ctx.font = 'bold 22px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(salvo.gemas, x + 18, y + 8);
}

// card de pacote de gemas
function desenharCardGemas(pacote, cx, cy, w, h) {
  const podeComprar = salvo.moedas >= pacote.custo;

  // fundo verde
  ctx.fillStyle = 'rgba(34,204,85,0.15)';
  ctx.fillRect(cx - w/2, cy - h/2, w, h);
  ctx.strokeStyle = '#22cc55';
  ctx.lineWidth = 3;
  ctx.strokeRect(cx - w/2, cy - h/2, w, h);

  // diamante grande no card
  desenharGemaGrande(cx, cy - 40, 26);

  // etiqueta de oferta
  if (pacote.etiqueta) {
    ctx.fillStyle = '#ffcc00';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(pacote.etiqueta, cx, cy - h/2 + 18);
  }

  // quantidade
  ctx.fillStyle = 'white';
  ctx.font = 'bold 26px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(pacote.gemas + ' gemas', cx, cy + 10);

  // custo
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = '13px Arial';
  ctx.fillText('por ' + pacote.custo + ' moedas', cx, cy + 30);

  // botão de compra
  btn(cx, cy + h/2 - 22, w - 30, 32, 'COMPRAR', () => comprarPacoteGemas(pacote), { cor: podeComprar ? '#ffcc00' : '#666', corHover: podeComprar ? '#ffe066' : '#666', desabilitado: !podeComprar, fonte: 'bold 14px Arial' });
}

// gema grande (decorativa)
function desenharGemaGrande(cx, cy, tam) {
  // glow verde
  const glow = ctx.createRadialGradient(cx, cy, 1, cx, cy, tam * 1.4);
  glow.addColorStop(0, 'rgba(50,255,100,0.55)');
  glow.addColorStop(1, 'rgba(50,255,100,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, tam * 1.4, 0, Math.PI * 2);
  ctx.fill();
  // diamante (4 pontas)
  ctx.fillStyle = '#22ff66';
  ctx.beginPath();
  ctx.moveTo(cx, cy - tam);
  ctx.lineTo(cx + tam * 0.65, cy);
  ctx.lineTo(cx, cy + tam);
  ctx.lineTo(cx - tam * 0.65, cy);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#117733';
  ctx.lineWidth = 2;
  ctx.stroke();
  // facetas (linhas internas)
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx, cy - tam);
  ctx.lineTo(cx, cy + tam);
  ctx.moveTo(cx + tam * 0.65, cy);
  ctx.lineTo(cx - tam * 0.65, cy);
  ctx.stroke();
  // brilho branco
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.moveTo(cx - tam*0.2, cy - tam*0.5);
  ctx.lineTo(cx, cy - tam*0.7);
  ctx.lineTo(cx + tam*0.15, cy - tam*0.3);
  ctx.lineTo(cx - tam*0.1, cy - tam*0.15);
  ctx.closePath();
  ctx.fill();
}

function desenharCardItem(item, cx, cy, w, h) {
  const nivel = salvo.melhorias[item.id];
  const noMax = nivel >= item.max;
  const custo = getCustoItem(item);
  const podeComprar = salvo.moedas >= custo && !noMax;

  // fundo
  ctx.fillStyle = 'rgba(255,153,51,0.15)';
  ctx.fillRect(cx - w/2, cy - h/2, w, h);
  ctx.strokeStyle = '#ff9933';
  ctx.lineWidth = 3;
  ctx.strokeRect(cx - w/2, cy - h/2, w, h);

  // icone gigante
  ctx.fillStyle = 'white';
  ctx.font = 'bold 60px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(item.icone, cx, cy - 40);

  // nome
  ctx.font = 'bold 20px Arial';
  ctx.fillText(item.nome, cx, cy);

  // efeito
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = '13px Arial';
  ctx.fillText(item.efeito, cx, cy + 20);

  // nível atual
  ctx.fillStyle = '#22cc55';
  ctx.font = 'bold 14px Arial';
  ctx.fillText('Nível: ' + nivel + ' / ' + item.max, cx, cy + 45);

  // botão de compra
  if (noMax) {
    btn(cx, cy + h/2 - 28, w - 30, 36, 'NÍVEL MÁXIMO', () => {}, { cor: '#666', corBorda: '#333', corTexto: 'white', desabilitado: true, fonte: 'bold 14px Arial' });
  } else {
    btn(cx, cy + h/2 - 28, w - 30, 36, 'COMPRAR (' + custo + ' 💰)', () => comprarMelhoria(item), { cor: podeComprar ? '#ffcc00' : '#666', corHover: podeComprar ? '#ffe066' : '#666', desabilitado: !podeComprar, fonte: 'bold 13px Arial' });
  }
}

// ----- TELA: PARTIDA -----
function desenharPartida() {
  // linha de mira (só durante jogo)
  if (estado === 'jogando') {
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.moveTo(jogador.x, jogador.y);
    ctx.lineTo(mouse.x, mouse.y);
    ctx.stroke();
  }
  // jogador (visual baseado no tipo)
  desenharPersonagemVisual(jogador.x, jogador.y, TAMANHO_JOGADOR, jogador, false);
  desenharBarraVida(jogador.x, jogador.y - TAMANHO_JOGADOR/2 - 12, 36, jogador.vidas, jogador.vidasMax, '#22cc55');

  // inimigos (pedras)
  for (const inimigo of inimigos) desenharInimigo(inimigo);

  // tiros (com visual baseado no tipo)
  for (const t of tiros) desenharTiro(t);

  // HUD
  if (estado === 'jogando' || estado === 'countdown') desenharHUD();
}

// ----- VISUAL DO TIRO (baseado em t.tipo) -----
function desenharTiro(t) {
  // rastro: pequenas bolinhas de cor diminuindo
  const corBase = t.cor || COR_TIRO;
  for (let i = 0; i < t.rastro.length; i++) {
    const op = (i / t.rastro.length) * 0.5;
    const rr = t.raio * (i / t.rastro.length) * 0.8;
    ctx.globalAlpha = op;
    ctx.fillStyle = corBase;
    ctx.beginPath();
    ctx.arc(t.rastro[i].x, t.rastro[i].y, rr, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // tamanho final (super é maior)
  const r = t.raio;

  if (t.super) {
    // glow grande
    ctx.fillStyle = 'rgba(255,0,255,0.25)';
    ctx.beginPath();
    ctx.arc(t.x, t.y, r + 8, 0, Math.PI * 2);
    ctx.fill();
  }

  if (t.tipo === 'lua') {
    // pequena lua crescente
    const glow = ctx.createRadialGradient(t.x, t.y, 1, t.x, t.y, r * 1.6);
    glow.addColorStop(0, 'rgba(220,230,255,0.6)');
    glow.addColorStop(1, 'rgba(180,200,240,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(t.x, t.y, r * 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f0f4ff';
    ctx.beginPath();
    ctx.arc(t.x, t.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(t.x + r * 0.4, t.y - r * 0.1, r * 0.85, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = '#8899bb';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(t.x, t.y, r, 0, Math.PI * 2);
    ctx.stroke();
  } else if (t.tipo === 'lunar') {
    // bola roxa cósmica com estrelas
    const glow = ctx.createRadialGradient(t.x, t.y, 1, t.x, t.y, r * 1.8);
    glow.addColorStop(0, 'rgba(170,170,255,0.6)');
    glow.addColorStop(1, 'rgba(60,30,120,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(t.x, t.y, r * 1.8, 0, Math.PI * 2);
    ctx.fill();
    const grad = ctx.createRadialGradient(t.x - r*0.3, t.y - r*0.3, 1, t.x, t.y, r);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.5, t.cor || '#aaaaff');
    grad.addColorStop(1, '#5544aa');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(t.x, t.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#3a2a77';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // mini estrela girando
    ctx.fillStyle = '#fff';
    const a = (Date.now() + (t.nascido || 0)) / 80;
    const sx = t.x + Math.cos(a) * r * 0.5;
    const sy = t.y + Math.sin(a) * r * 0.5;
    ctx.beginPath();
    ctx.moveTo(sx - 2, sy);
    ctx.lineTo(sx, sy - 2);
    ctx.lineTo(sx + 2, sy);
    ctx.lineTo(sx, sy + 2);
    ctx.closePath();
    ctx.fill();
  } else if (t.tipo === 'solar') {
    // bola de fogo solar grande com glow forte
    const pulso = 0.9 + Math.sin(Date.now() / 60) * 0.1;
    const glow = ctx.createRadialGradient(t.x, t.y, 1, t.x, t.y, r * 2.2 * pulso);
    glow.addColorStop(0, 'rgba(255,200,80,0.8)');
    glow.addColorStop(0.4, 'rgba(255,100,30,0.5)');
    glow.addColorStop(1, 'rgba(180,40,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(t.x, t.y, r * 2.2, 0, Math.PI * 2);
    ctx.fill();
    // raios curtos
    ctx.save();
    ctx.translate(t.x, t.y);
    ctx.rotate((Date.now() + (t.nascido || 0)) / 30);
    ctx.fillStyle = 'rgba(255,200,40,0.85)';
    for (let i = 0; i < 6; i++) {
      ctx.save();
      ctx.rotate((i / 6) * Math.PI * 2);
      ctx.beginPath();
      ctx.moveTo(r * 0.9, -r * 0.18);
      ctx.lineTo(r * 1.5, 0);
      ctx.lineTo(r * 0.9, r * 0.18);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
    // núcleo
    const grad = ctx.createRadialGradient(t.x, t.y, 0, t.x, t.y, r);
    grad.addColorStop(0, '#ffffcc');
    grad.addColorStop(0.5, '#ffaa22');
    grad.addColorStop(1, '#cc1100');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(t.x, t.y, r, 0, Math.PI * 2);
    ctx.fill();
  } else if (t.tipo === 'luz') {
    // bola de luz com raios
    const glow = ctx.createRadialGradient(t.x, t.y, 1, t.x, t.y, r * 2);
    glow.addColorStop(0, 'rgba(255,255,180,0.8)');
    glow.addColorStop(1, 'rgba(255,200,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(t.x, t.y, r * 2, 0, Math.PI * 2);
    ctx.fill();
    // raios curtos
    ctx.save();
    ctx.translate(t.x, t.y);
    ctx.rotate((Date.now() + (t.nascido || 0)) / 50);
    ctx.fillStyle = 'rgba(255,238,68,0.85)';
    for (let i = 0; i < 6; i++) {
      ctx.save();
      ctx.rotate((i / 6) * Math.PI * 2);
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.9);
      ctx.lineTo(-r * 0.15, -r * 1.5);
      ctx.lineTo(r * 0.15, -r * 1.5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
    // núcleo
    const grad = ctx.createRadialGradient(t.x, t.y, 0, t.x, t.y, r);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.5, '#ffee66');
    grad.addColorStop(1, '#ff9900');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(t.x, t.y, r, 0, Math.PI * 2);
    ctx.fill();
  } else if (t.tipo === 'sombra') {
    // bola de trevas
    const glow = ctx.createRadialGradient(t.x, t.y, 1, t.x, t.y, r * 1.7);
    glow.addColorStop(0, 'rgba(80,40,120,0.7)');
    glow.addColorStop(1, 'rgba(20,10,40,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(t.x, t.y, r * 1.7, 0, Math.PI * 2);
    ctx.fill();
    const grad = ctx.createRadialGradient(t.x, t.y - r*0.3, 1, t.x, t.y, r);
    grad.addColorStop(0, '#5a3a7a');
    grad.addColorStop(0.6, '#2a1844');
    grad.addColorStop(1, '#0a0418');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(t.x, t.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.stroke();
    // olho amarelo no centro
    ctx.fillStyle = '#ffee00';
    ctx.beginPath();
    ctx.arc(t.x, t.y, r * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(t.x, t.y, r * 0.18, 0, Math.PI * 2);
    ctx.fill();
  } else if (t.tipo === 'cristal') {
    // diamante girando
    const glow = ctx.createRadialGradient(t.x, t.y, 1, t.x, t.y, r * 1.7);
    glow.addColorStop(0, 'rgba(255,150,210,0.55)');
    glow.addColorStop(1, 'rgba(180,60,140,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(t.x, t.y, r * 1.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.translate(t.x, t.y);
    ctx.rotate((Date.now() + (t.nascido || 0)) / 80);
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(r * 0.7, 0);
    ctx.lineTo(0, r);
    ctx.lineTo(-r * 0.7, 0);
    ctx.closePath();
    const grad = ctx.createLinearGradient(-r, -r, r, r);
    grad.addColorStop(0, '#ffccdd');
    grad.addColorStop(0.5, t.cor || '#ff66bb');
    grad.addColorStop(1, '#aa3377');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = '#660033';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // facetas
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -r); ctx.lineTo(0, r);
    ctx.moveTo(-r * 0.7, 0); ctx.lineTo(r * 0.7, 0);
    ctx.stroke();
    ctx.restore();
  } else if (t.tipo === 'planta') {
    // semente verde com folhinha
    const glow = ctx.createRadialGradient(t.x, t.y, 1, t.x, t.y, r * 1.5);
    glow.addColorStop(0, 'rgba(100,200,80,0.5)');
    glow.addColorStop(1, 'rgba(50,120,30,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(t.x, t.y, r * 1.5, 0, Math.PI * 2);
    ctx.fill();
    // semente (oval)
    ctx.fillStyle = '#aa7733';
    ctx.beginPath();
    ctx.ellipse(t.x, t.y, r * 0.7, r, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#553311';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // folhinha verde em cima
    ctx.fillStyle = '#66cc44';
    ctx.beginPath();
    ctx.ellipse(t.x, t.y - r * 0.7, r * 0.35, r * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#225511';
    ctx.lineWidth = 1;
    ctx.stroke();
  } else if (t.tipo === 'vento') {
    // rajada de ar — translúcida com linhas
    ctx.fillStyle = 'rgba(220,235,250,0.4)';
    ctx.beginPath();
    ctx.arc(t.x, t.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // espiralzinha dentro
    const ang = Date.now() / 50 + (t.nascido || 0);
    ctx.save();
    ctx.translate(t.x, t.y);
    ctx.rotate(ang);
    ctx.beginPath();
    const passos = 18;
    for (let i = 0; i <= passos; i++) {
      const a = (i / passos) * Math.PI * 3;
      const rr = (i / passos) * r * 0.85;
      const x = Math.cos(a) * rr;
      const y = Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  } else if (t.tipo === 'furacao') {
    // mini furacão girando
    const glow = ctx.createRadialGradient(t.x, t.y, 1, t.x, t.y, r * 1.7);
    glow.addColorStop(0, 'rgba(150,180,210,0.6)');
    glow.addColorStop(1, 'rgba(60,90,140,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(t.x, t.y, r * 1.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.translate(t.x, t.y);
    ctx.rotate((Date.now() + (t.nascido || 0)) / 30);
    // núcleo
    const grad = ctx.createRadialGradient(0, 0, 1, 0, 0, r);
    grad.addColorStop(0, '#cce0f0');
    grad.addColorStop(0.6, t.cor || '#5588aa');
    grad.addColorStop(1, '#1a3050');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    // espirais
    ctx.strokeStyle = 'rgba(220,235,250,0.9)';
    ctx.lineWidth = 1.5;
    for (let s = 0; s < 2; s++) {
      ctx.beginPath();
      const passos = 30;
      for (let i = 0; i <= passos; i++) {
        const a = (i / passos) * Math.PI * 4 + s * Math.PI;
        const rr = (i / passos) * r * 0.9;
        const x = Math.cos(a) * rr;
        const y = Math.sin(a) * rr;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.restore();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(t.x, t.y, r, 0, Math.PI * 2);
    ctx.stroke();
  } else if (t.tipo === 'praga') {
    // glow roxo escuro
    const glow = ctx.createRadialGradient(t.x, t.y, 1, t.x, t.y, r * 1.7);
    glow.addColorStop(0, 'rgba(140,40,180,0.6)');
    glow.addColorStop(1, 'rgba(60,15,90,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(t.x, t.y, r * 1.7, 0, Math.PI * 2);
    ctx.fill();
    // núcleo escuro
    const grad = ctx.createRadialGradient(t.x - r*0.3, t.y - r*0.3, 1, t.x, t.y, r);
    grad.addColorStop(0, '#bb88dd');
    grad.addColorStop(0.5, t.cor || '#6633aa');
    grad.addColorStop(1, '#1a0033');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(t.x, t.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0a0022';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // bolha preta dentro
    ctx.fillStyle = 'rgba(15,0,30,0.85)';
    ctx.beginPath();
    ctx.arc(t.x + r*0.15, t.y + r*0.1, r * 0.3, 0, Math.PI * 2);
    ctx.fill();
    // brilho roxo claro
    ctx.fillStyle = 'rgba(220,150,255,0.6)';
    ctx.beginPath();
    ctx.arc(t.x - r*0.3, t.y - r*0.3, r * 0.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (t.tipo === 'magma') {
    // glow vermelho-laranja
    const glow = ctx.createRadialGradient(t.x, t.y, 1, t.x, t.y, r * 1.8);
    glow.addColorStop(0, 'rgba(255,150,50,0.6)');
    glow.addColorStop(1, 'rgba(180,40,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(t.x, t.y, r * 1.8, 0, Math.PI * 2);
    ctx.fill();
    // crosta + lava brilhando dentro
    const grad = ctx.createRadialGradient(t.x - r*0.3, t.y - r*0.3, 1, t.x, t.y, r);
    grad.addColorStop(0, '#ffdd66');
    grad.addColorStop(0.5, '#ff5511');
    grad.addColorStop(0.85, '#aa2200');
    grad.addColorStop(1, '#441100');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(t.x, t.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#220800';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // rachadura brilhante no meio
    const brilho = 0.7 + Math.sin(Date.now() / 100) * 0.3;
    ctx.strokeStyle = `rgba(255,220,80,${brilho})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(t.x - r * 0.6, t.y);
    ctx.lineTo(t.x - r * 0.1, t.y - r * 0.2);
    ctx.lineTo(t.x + r * 0.2, t.y + r * 0.15);
    ctx.lineTo(t.x + r * 0.6, t.y - r * 0.1);
    ctx.stroke();
  } else if (t.tipo === 'trovao') {
    // bola de tempestade pulsando
    const pulso = 0.85 + Math.sin(Date.now() / 80) * 0.15;
    const glow = ctx.createRadialGradient(t.x, t.y, 1, t.x, t.y, r * 2.2 * pulso);
    glow.addColorStop(0, 'rgba(220,180,255,0.7)');
    glow.addColorStop(0.5, 'rgba(153,102,255,0.4)');
    glow.addColorStop(1, 'rgba(80,40,150,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(t.x, t.y, r * 2.2, 0, Math.PI * 2);
    ctx.fill();
    // núcleo escuro com brilho roxo
    const grad = ctx.createRadialGradient(t.x - r*0.3, t.y - r*0.3, 1, t.x, t.y, r);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.4, '#cc99ff');
    grad.addColorStop(1, '#3a2870');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(t.x, t.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#221144';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // raios crackleando dentro
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(t.x, t.y, r - 1, 0, Math.PI * 2);
    ctx.clip();
    const seed = (t.nascido || 0) + Math.floor(Date.now() / 60);
    for (let i = 0; i < 2; i++) {
      const a1 = (Math.sin(seed + i * 13) + 1) * Math.PI;
      const a2 = a1 + Math.PI + Math.sin(seed + i * 7) * 0.5;
      ctx.beginPath();
      ctx.moveTo(t.x + Math.cos(a1) * r, t.y + Math.sin(a1) * r);
      const mx = t.x + Math.cos((a1 + a2)/2) * r * 0.3 + Math.sin(seed + i) * 3;
      const my = t.y + Math.sin((a1 + a2)/2) * r * 0.3 + Math.cos(seed + i) * 3;
      ctx.lineTo(mx, my);
      ctx.lineTo(t.x + Math.cos(a2) * r, t.y + Math.sin(a2) * r);
      ctx.stroke();
    }
    ctx.restore();
  } else if (t.tipo === 'gelo') {
    // glow gelado
    const glow = ctx.createRadialGradient(t.x, t.y, 1, t.x, t.y, r * 1.7);
    glow.addColorStop(0, 'rgba(200,240,255,0.6)');
    glow.addColorStop(1, 'rgba(170,230,255,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(t.x, t.y, r * 1.7, 0, Math.PI * 2);
    ctx.fill();
    // cristal hexagonal
    const rot = (Date.now() / 100 + (t.nascido || 0)) * 0.05;
    ctx.save();
    ctx.translate(t.x, t.y);
    ctx.rotate(rot);
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2;
      const x = Math.cos(ang) * r;
      const y = Math.sin(ang) * r;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    const grad = ctx.createRadialGradient(-r*0.3, -r*0.3, 0, 0, 0, r);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.5, t.cor || '#aaeeff');
    grad.addColorStop(1, '#5599cc');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = '#225588';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  } else if (t.tipo === 'agua') {
    // gota d'água: círculo azul com brilho
    const grad = ctx.createRadialGradient(t.x - r*0.3, t.y - r*0.3, 1, t.x, t.y, r);
    grad.addColorStop(0, '#aaeeff');
    grad.addColorStop(0.6, t.cor || '#33ccff');
    grad.addColorStop(1, '#0077aa');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(t.x, t.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#003355';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // brilho
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath();
    ctx.arc(t.x - r*0.3, t.y - r*0.3, r * 0.3, 0, Math.PI * 2);
    ctx.fill();
  } else if (t.tipo === 'fogo') {
    // bola de fogo com glow
    const glow = ctx.createRadialGradient(t.x, t.y, 0, t.x, t.y, r * 1.8);
    glow.addColorStop(0, 'rgba(255,200,50,0.7)');
    glow.addColorStop(1, 'rgba(255,80,20,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(t.x, t.y, r * 1.8, 0, Math.PI * 2);
    ctx.fill();
    // núcleo
    const nuc = ctx.createRadialGradient(t.x, t.y, 1, t.x, t.y, r);
    nuc.addColorStop(0, '#ffffcc');
    nuc.addColorStop(0.4, '#ffcc00');
    nuc.addColorStop(0.8, '#ff5511');
    nuc.addColorStop(1, '#cc1100');
    ctx.fillStyle = nuc;
    ctx.beginPath();
    ctx.arc(t.x, t.y, r, 0, Math.PI * 2);
    ctx.fill();
  } else if (t.tipo === 'veneno') {
    // bolha verde tóxica com glow
    const glow = ctx.createRadialGradient(t.x, t.y, 1, t.x, t.y, r * 1.6);
    glow.addColorStop(0, 'rgba(136,238,34,0.5)');
    glow.addColorStop(1, 'rgba(136,238,34,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(t.x, t.y, r * 1.6, 0, Math.PI * 2);
    ctx.fill();
    const grad = ctx.createRadialGradient(t.x - r*0.3, t.y - r*0.3, 1, t.x, t.y, r);
    grad.addColorStop(0, '#ddff88');
    grad.addColorStop(0.6, t.cor || '#88ee22');
    grad.addColorStop(1, '#447711');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(t.x, t.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#225500';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // bolha branca dentro
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.arc(t.x - r*0.3, t.y - r*0.3, r * 0.25, 0, Math.PI * 2);
    ctx.fill();
  } else if (t.tipo === 'raio') {
    // faísca elétrica: glow + bola amarela + zigzags
    const glow = ctx.createRadialGradient(t.x, t.y, 1, t.x, t.y, r * 2);
    glow.addColorStop(0, 'rgba(255,255,150,0.7)');
    glow.addColorStop(1, 'rgba(255,221,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(t.x, t.y, r * 2, 0, Math.PI * 2);
    ctx.fill();
    // núcleo branco/amarelo
    const grad = ctx.createRadialGradient(t.x, t.y, 0, t.x, t.y, r);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.5, '#ffee00');
    grad.addColorStop(1, '#cc8800');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(t.x, t.y, r, 0, Math.PI * 2);
    ctx.fill();
    // mini-faíscas em volta (4 traços rápidos)
    ctx.strokeStyle = 'rgba(255,255,150,0.9)';
    ctx.lineWidth = 1.5;
    const seed = t.nascido || 0;
    for (let i = 0; i < 4; i++) {
      const ang = (Date.now() * 0.05 + seed + i * Math.PI / 2) % (Math.PI * 2);
      const x1 = t.x + Math.cos(ang) * r;
      const y1 = t.y + Math.sin(ang) * r;
      const x2 = t.x + Math.cos(ang) * (r + 5);
      const y2 = t.y + Math.sin(ang) * (r + 5);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  } else {
    // padrão: bolinha amarela
    ctx.fillStyle = t.super ? COR_SUPER : COR_TIRO;
    ctx.beginPath();
    ctx.arc(t.x, t.y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ----- VISUAL DO PERSONAGEM (baseado em p.tipo) -----
// Anima as ondas usando o tempo (Date.now)
function desenharPersonagemVisual(cx, cy, tam, p, grande) {
  const r = tam / 2;
  if (p.tipo === 'lua') {
    const t = Date.now() / 600;
    // glow azul-claro suave
    const glow = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, r * 1.4);
    glow.addColorStop(0, 'rgba(220,230,255,0.45)');
    glow.addColorStop(1, 'rgba(180,200,240,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.4, 0, Math.PI * 2);
    ctx.fill();
    // lua crescente: círculo prata com mordida (segundo círculo deslocado)
    ctx.fillStyle = '#f0f4ff';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#8899bb';
    ctx.lineWidth = grande ? 2 : 1.5;
    ctx.stroke();
    // recorta o círculo da "mordida"
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(cx + r * 0.4, cy - r * 0.1, r * 0.85, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // borda da crescente
    ctx.strokeStyle = '#8899bb';
    ctx.lineWidth = grande ? 2 : 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    // estrelinhas em volta
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + t * 0.3;
      const dist = r * 1.25;
      const sx = cx + Math.cos(a) * dist;
      const sy = cy + Math.sin(a) * dist;
      const sp = (grande ? 2.5 : 1.5);
      ctx.beginPath();
      ctx.moveTo(sx - sp, sy);
      ctx.lineTo(sx, sy - sp);
      ctx.lineTo(sx + sp, sy);
      ctx.lineTo(sx, sy + sp);
      ctx.closePath();
      ctx.fill();
    }
  } else if (p.tipo === 'lunar') {
    const t = Date.now() / 400;
    // glow roxo cósmico
    const glow = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, r * 1.6);
    glow.addColorStop(0, 'rgba(170,170,255,0.6)');
    glow.addColorStop(0.5, 'rgba(120,80,200,0.4)');
    glow.addColorStop(1, 'rgba(60,30,120,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.6, 0, Math.PI * 2);
    ctx.fill();
    // lua cheia (com sombra na borda)
    const grad = ctx.createRadialGradient(cx - r*0.3, cy - r*0.3, r*0.1, cx, cy, r);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.5, p.cor);
    grad.addColorStop(1, '#5544aa');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#3a2a77';
    ctx.lineWidth = grande ? 2 : 1.5;
    ctx.stroke();
    // crateras (manchas escuras)
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r - 1, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = 'rgba(80,60,140,0.4)';
    const crateras = [[-0.3,-0.2,0.18],[0.25,0.05,0.12],[-0.1,0.35,0.15],[0.4,-0.35,0.1]];
    for (const [dx, dy, dr] of crateras) {
      ctx.beginPath();
      ctx.arc(cx + dx * r, cy + dy * r, dr * r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    // estrelas orbitando
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + t;
      const dist = r * 1.35;
      const sx = cx + Math.cos(a) * dist;
      const sy = cy + Math.sin(a) * dist;
      const sp = (grande ? 3 : 1.8) * (0.7 + Math.sin(t * 3 + i) * 0.3);
      // estrela 4 pontas
      ctx.beginPath();
      ctx.moveTo(sx - sp, sy);
      ctx.lineTo(sx, sy - sp);
      ctx.lineTo(sx + sp, sy);
      ctx.lineTo(sx, sy + sp);
      ctx.closePath();
      ctx.fill();
    }
    // brilho
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.ellipse(cx - r*0.3, cy - r*0.4, r*0.2, r*0.12, -0.4, 0, Math.PI*2);
    ctx.fill();
  } else if (p.tipo === 'solar') {
    const t = Date.now() / 80;
    const pulso = 0.85 + Math.sin(t * 0.8) * 0.15;
    // glow vermelho-laranja gigante
    const glow = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, r * 2 * pulso);
    glow.addColorStop(0, 'rgba(255,200,80,0.8)');
    glow.addColorStop(0.5, 'rgba(255,100,30,0.5)');
    glow.addColorStop(1, 'rgba(180,40,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 2, 0, Math.PI * 2);
    ctx.fill();
    // raios chamejantes (irregulares, girando)
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(t * 0.05);
    const numRaios = 12;
    for (let i = 0; i < numRaios; i++) {
      const a = (i / numRaios) * Math.PI * 2;
      const compr = r * (1.5 + Math.sin(t * 0.3 + i) * 0.25);
      const grad2 = ctx.createLinearGradient(Math.cos(a) * r, Math.sin(a) * r, Math.cos(a) * compr, Math.sin(a) * compr);
      grad2.addColorStop(0, '#ffee44');
      grad2.addColorStop(1, 'rgba(255,80,20,0)');
      ctx.fillStyle = grad2;
      ctx.save();
      ctx.rotate(a);
      ctx.beginPath();
      ctx.moveTo(r * 0.95, -r * 0.13);
      ctx.lineTo(compr, 0);
      ctx.lineTo(r * 0.95, r * 0.13);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
    // núcleo (sol vermelho)
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    grad.addColorStop(0, '#ffffcc');
    grad.addColorStop(0.4, '#ffcc44');
    grad.addColorStop(0.8, '#ff5511');
    grad.addColorStop(1, '#aa1100');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#660000';
    ctx.lineWidth = grande ? 2 : 1.5;
    ctx.stroke();
    // manchas solares
    ctx.fillStyle = 'rgba(180,30,0,0.5)';
    const manchas = [[-0.2,-0.15,0.15],[0.3,0.2,0.1],[0.05,-0.4,0.08]];
    for (const [dx, dy, dr] of manchas) {
      ctx.beginPath();
      ctx.arc(cx + dx * r, cy + dy * r, dr * r, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (p.tipo === 'luz') {
    const t = Date.now() / 200;
    const pulso = 0.85 + Math.sin(t * 2) * 0.15;
    // halo enorme
    const glow = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, r * 1.8 * pulso);
    glow.addColorStop(0, 'rgba(255,255,180,0.7)');
    glow.addColorStop(0.5, 'rgba(255,238,68,0.4)');
    glow.addColorStop(1, 'rgba(255,200,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.8, 0, Math.PI * 2);
    ctx.fill();
    // raios saindo (giram)
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(t * 0.5);
    ctx.fillStyle = 'rgba(255,238,68,0.8)';
    const numRaios = 8;
    for (let i = 0; i < numRaios; i++) {
      const a = (i / numRaios) * Math.PI * 2;
      ctx.save();
      ctx.rotate(a);
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.95);
      ctx.lineTo(-r * 0.12, -r * 1.5);
      ctx.lineTo(r * 0.12, -r * 1.5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
    // núcleo brilhante (sol)
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.5, '#ffee88');
    grad.addColorStop(1, '#ffaa00');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#aa6600';
    ctx.lineWidth = grande ? 2 : 1.5;
    ctx.stroke();
    // brilhozinhos (sparkles) em volta
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2 + t * 0.7;
      const dist = r * 1.2;
      const sx = cx + Math.cos(a) * dist;
      const sy = cy + Math.sin(a) * dist;
      const spark = (grande ? 3 : 2);
      ctx.beginPath();
      ctx.moveTo(sx - spark, sy);
      ctx.lineTo(sx, sy - spark);
      ctx.lineTo(sx + spark, sy);
      ctx.lineTo(sx, sy + spark);
      ctx.closePath();
      ctx.fill();
    }
  } else if (p.tipo === 'sombra') {
    const t = Date.now() / 300;
    // glow roxo escuro
    const glow = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, r * 1.4);
    glow.addColorStop(0, 'rgba(80,40,120,0.6)');
    glow.addColorStop(1, 'rgba(20,10,40,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.4, 0, Math.PI * 2);
    ctx.fill();
    // corpo de sombra (forma fantasmagórica irregular)
    ctx.beginPath();
    const segs = 18;
    for (let i = 0; i <= segs; i++) {
      const ang = (i / segs) * Math.PI * 2;
      const wob = Math.sin(ang * 4 + t) * (r * 0.1) + Math.sin(ang * 7 - t * 1.3) * (r * 0.06);
      // cauda esfumaçada embaixo
      const baixo = Math.sin(ang) > 0 ? r * 0.15 * Math.sin(ang) : 0;
      const rr = r + wob + baixo;
      const x = cx + Math.cos(ang) * rr;
      const y = cy + Math.sin(ang) * rr;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    const grad = ctx.createRadialGradient(cx, cy - r*0.3, r*0.2, cx, cy, r);
    grad.addColorStop(0, '#5a3a7a');
    grad.addColorStop(0.6, '#2a1844');
    grad.addColorStop(1, '#0a0418');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = grande ? 2 : 1;
    ctx.stroke();
    // dois olhos amarelos brilhantes
    const olhoY = cy - r * 0.15;
    const olhoOff = r * 0.32;
    ctx.fillStyle = '#ffee00';
    ctx.beginPath();
    ctx.arc(cx - olhoOff, olhoY, r * 0.13, 0, Math.PI * 2);
    ctx.arc(cx + olhoOff, olhoY, r * 0.13, 0, Math.PI * 2);
    ctx.fill();
    // pupila preta
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(cx - olhoOff, olhoY, r * 0.06, 0, Math.PI * 2);
    ctx.arc(cx + olhoOff, olhoY, r * 0.06, 0, Math.PI * 2);
    ctx.fill();
    // glow nos olhos
    ctx.fillStyle = 'rgba(255,238,0,0.4)';
    ctx.beginPath();
    ctx.arc(cx - olhoOff, olhoY, r * 0.22, 0, Math.PI * 2);
    ctx.arc(cx + olhoOff, olhoY, r * 0.22, 0, Math.PI * 2);
    ctx.fill();
  } else if (p.tipo === 'cristal') {
    const t = Date.now() / 600;
    // glow rosa
    const glow = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, r * 1.4);
    glow.addColorStop(0, 'rgba(255,150,210,0.5)');
    glow.addColorStop(1, 'rgba(180,60,140,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.4, 0, Math.PI * 2);
    ctx.fill();
    // cristal facetado (losango/diamante)
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(t * 0.4);
    // corpo
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(r * 0.7, -r * 0.3);
    ctx.lineTo(r * 0.65, r * 0.6);
    ctx.lineTo(0, r);
    ctx.lineTo(-r * 0.65, r * 0.6);
    ctx.lineTo(-r * 0.7, -r * 0.3);
    ctx.closePath();
    const grad = ctx.createLinearGradient(-r, -r, r, r);
    grad.addColorStop(0, '#ffccdd');
    grad.addColorStop(0.5, p.cor);
    grad.addColorStop(1, '#aa3377');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = '#660033';
    ctx.lineWidth = grande ? 2 : 1.5;
    ctx.stroke();
    // facetas internas
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = grande ? 1.5 : 1;
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(0, r);
    ctx.moveTo(-r * 0.7, -r * 0.3);
    ctx.lineTo(r * 0.7, -r * 0.3);
    ctx.moveTo(-r * 0.65, r * 0.6);
    ctx.lineTo(r * 0.65, r * 0.6);
    ctx.stroke();
    // brilho
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath();
    ctx.moveTo(-r * 0.3, -r * 0.7);
    ctx.lineTo(0, -r * 0.85);
    ctx.lineTo(r * 0.1, -r * 0.5);
    ctx.lineTo(-r * 0.2, -r * 0.4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  } else if (p.tipo === 'planta') {
    const t = Date.now() / 400;
    // glow verde
    const glow = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, r * 1.3);
    glow.addColorStop(0, 'rgba(100,200,80,0.4)');
    glow.addColorStop(1, 'rgba(50,120,30,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.3, 0, Math.PI * 2);
    ctx.fill();
    // pétalas/folhas (4 em volta)
    ctx.save();
    ctx.translate(cx, cy);
    for (let i = 0; i < 4; i++) {
      ctx.save();
      ctx.rotate((i / 4) * Math.PI * 2 + Math.sin(t) * 0.1);
      ctx.fillStyle = i % 2 === 0 ? '#66cc44' : '#449922';
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.85, r * 0.4, r * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#225511';
      ctx.lineWidth = grande ? 1.5 : 1;
      ctx.stroke();
      // veia central
      ctx.strokeStyle = 'rgba(34,85,17,0.7)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.2);
      ctx.lineTo(0, -r * 1.4);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
    // miolo (flor central)
    ctx.fillStyle = '#ffcc44';
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#aa7700';
    ctx.lineWidth = grande ? 2 : 1.5;
    ctx.stroke();
    // pontos no miolo
    ctx.fillStyle = '#aa7700';
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const dist = r * 0.22;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * dist, cy + Math.sin(a) * dist, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (p.tipo === 'vento') {
    const t = Date.now() / 200;
    // glow leve cinza-azulado
    const glow = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, r * 1.3);
    glow.addColorStop(0, 'rgba(220,235,250,0.5)');
    glow.addColorStop(1, 'rgba(180,200,220,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.3, 0, Math.PI * 2);
    ctx.fill();
    // corpo translúcido (esfera de ar)
    ctx.fillStyle = 'rgba(220,235,250,0.45)';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = grande ? 2.5 : 1.5;
    ctx.stroke();
    // espirais de ar girando dentro
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r - 1, 0, Math.PI * 2);
    ctx.clip();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = grande ? 2 : 1.3;
    for (let s = 0; s < 2; s++) {
      ctx.beginPath();
      const passos = 30;
      for (let i = 0; i <= passos; i++) {
        const ang = (i / passos) * Math.PI * 4 + t + s * Math.PI;
        const rr = (i / passos) * r * 0.85;
        const x = cx + Math.cos(ang) * rr;
        const y = cy + Math.sin(ang) * rr;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.restore();
    // linhas de vento orbitando por fora
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = grande ? 2.5 : 1.5;
    for (let i = 0; i < 3; i++) {
      const angInicio = t * 1.5 + i * (Math.PI * 2 / 3);
      const dist = r + 6;
      ctx.beginPath();
      ctx.arc(cx, cy, dist, angInicio, angInicio + 0.6);
      ctx.stroke();
    }
  } else if (p.tipo === 'furacao') {
    const t = Date.now() / 100;
    // glow azulado escuro
    const glow = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, r * 1.5);
    glow.addColorStop(0, 'rgba(150,180,210,0.55)');
    glow.addColorStop(1, 'rgba(60,90,140,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.5, 0, Math.PI * 2);
    ctx.fill();
    // espiral grande do furacão (várias voltas)
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(t * 0.05);
    // anéis de tempestade
    for (let anel = 3; anel >= 0; anel--) {
      const rrAnel = r * (0.4 + anel * 0.2);
      const grad = ctx.createRadialGradient(0, 0, rrAnel * 0.4, 0, 0, rrAnel);
      grad.addColorStop(0, 'rgba(80,110,160,0.7)');
      grad.addColorStop(1, anel === 0 ? '#1a3050' : 'rgba(80,110,160,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, rrAnel, 0, Math.PI * 2);
      ctx.fill();
    }
    // espiral branca
    ctx.strokeStyle = 'rgba(220,235,250,0.85)';
    ctx.lineWidth = grande ? 3 : 2;
    for (let s = 0; s < 3; s++) {
      ctx.beginPath();
      const passos = 60;
      for (let i = 0; i <= passos; i++) {
        const ang = (i / passos) * Math.PI * 5 + s * (Math.PI * 2 / 3);
        const rr = (i / passos) * r * 0.95;
        const x = Math.cos(ang) * rr;
        const y = Math.sin(ang) * rr;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    // olho do furacão (centro escuro)
    ctx.fillStyle = '#0a1830';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
    // borda externa
    ctx.strokeStyle = 'rgba(150,180,210,0.6)';
    ctx.lineWidth = grande ? 2 : 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  } else if (p.tipo === 'praga') {
    const t = Date.now() / 350;
    // glow roxo escuro (sinistro)
    const glow = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, r * 1.4);
    glow.addColorStop(0, 'rgba(140,40,180,0.55)');
    glow.addColorStop(1, 'rgba(60,15,90,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.4, 0, Math.PI * 2);
    ctx.fill();

    // corpo blob escuro irregular
    ctx.beginPath();
    const segs = 24;
    for (let i = 0; i <= segs; i++) {
      const ang = (i / segs) * Math.PI * 2;
      const wob = Math.sin(ang * 3 + t) * (r * 0.07) + Math.sin(ang * 5 - t * 1.3) * (r * 0.04);
      const rr = r + wob;
      const x = cx + Math.cos(ang) * rr;
      const y = cy + Math.sin(ang) * rr;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    const grad = ctx.createRadialGradient(cx - r*0.3, cy - r*0.3, r*0.2, cx, cy, r);
    grad.addColorStop(0, '#9955cc');
    grad.addColorStop(0.6, p.cor);
    grad.addColorStop(1, '#2a0a44');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = '#1a0033';
    ctx.lineWidth = grande ? 3 : 2;
    ctx.stroke();

    // bolhas pretas borbulhando dentro (em vez de brancas)
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.85, 0, Math.PI * 2);
    ctx.clip();
    const bolhas = grande ? 6 : 4;
    for (let i = 0; i < bolhas; i++) {
      const fase = (t * 0.5 + i * 0.6) % 1;
      const bx = cx + Math.sin(i * 11.7 + t * 0.3) * r * 0.55;
      const by = cy + r - fase * r * 1.7;
      const br = (grande ? 4 : 2.5) * (0.6 + Math.sin(i * 2.1) * 0.4);
      ctx.fillStyle = 'rgba(15,0,30,0.85)';
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.fill();
      // pequeno highlight roxo dentro da bolha
      ctx.fillStyle = 'rgba(180,80,220,0.5)';
      ctx.beginPath();
      ctx.arc(bx - br*0.3, by - br*0.3, br * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // pingo escuro escorrendo
    const pingoFase = (t * 0.4) % 1;
    const py2 = cy + r + pingoFase * (r * 0.55);
    ctx.fillStyle = '#3a1155';
    ctx.beginPath();
    ctx.ellipse(cx + r * 0.3, py2, (grande ? 4 : 2.5) * (1 - pingoFase * 0.5), (grande ? 6 : 4), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1a0033';
    ctx.lineWidth = 1;
    ctx.stroke();

    // brilho roxo claro no topo
    ctx.fillStyle = 'rgba(220,150,255,0.5)';
    ctx.beginPath();
    ctx.ellipse(cx - r*0.3, cy - r*0.4, r*0.18, r*0.1, -0.4, 0, Math.PI*2);
    ctx.fill();
  } else if (p.tipo === 'magma') {
    const t = Date.now() / 400;
    // glow vermelho-laranja quente
    const glow = ctx.createRadialGradient(cx, cy, r * 0.4, cx, cy, r * 1.5);
    glow.addColorStop(0, 'rgba(255,150,50,0.5)');
    glow.addColorStop(1, 'rgba(180,40,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // crosta escura (rocha) com forma irregular
    ctx.beginPath();
    const segs = 24;
    for (let i = 0; i <= segs; i++) {
      const ang = (i / segs) * Math.PI * 2;
      const wob = Math.sin(ang * 4 + t * 0.5) * (r * 0.05) + Math.sin(ang * 7 - t * 0.3) * (r * 0.03);
      const rr = r + wob;
      const x = cx + Math.cos(ang) * rr;
      const y = cy + Math.sin(ang) * rr;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    const gradFora = ctx.createRadialGradient(cx - r*0.2, cy - r*0.2, r*0.3, cx, cy, r);
    gradFora.addColorStop(0, '#ff9944');
    gradFora.addColorStop(0.5, '#aa3300');
    gradFora.addColorStop(1, '#441100');
    ctx.fillStyle = gradFora;
    ctx.fill();
    ctx.strokeStyle = '#220800';
    ctx.lineWidth = grande ? 3 : 2;
    ctx.stroke();

    // rachaduras brilhantes (lava por dentro)
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r - 1, 0, Math.PI * 2);
    ctx.clip();
    const brilho = 0.7 + Math.sin(t * 2) * 0.3;
    ctx.strokeStyle = `rgba(255,${200 + brilho * 55},80,${brilho})`;
    ctx.lineWidth = grande ? 3 : 2;
    // rachadura 1
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.7, cy - r * 0.2);
    ctx.lineTo(cx - r * 0.2, cy + r * 0.1);
    ctx.lineTo(cx + r * 0.1, cy - r * 0.2);
    ctx.lineTo(cx + r * 0.6, cy + r * 0.05);
    ctx.stroke();
    // rachadura 2
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.4, cy + r * 0.5);
    ctx.lineTo(cx + r * 0.05, cy + r * 0.3);
    ctx.lineTo(cx + r * 0.5, cy + r * 0.6);
    ctx.stroke();
    // pontos brilhantes (lava borbulhando)
    ctx.fillStyle = `rgba(255,${180 + brilho * 75},50,${brilho})`;
    const pontos = grande ? 4 : 2;
    for (let i = 0; i < pontos; i++) {
      const px = cx + Math.sin(i * 7.3 + t) * r * 0.5;
      const py = cy + Math.cos(i * 5.1 + t * 1.2) * r * 0.4;
      const pr = (grande ? 3.5 : 2) * (0.6 + Math.sin(t * 3 + i) * 0.4);
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // pingo de lava escorrendo embaixo
    const pingoFase = (t * 0.5) % 1;
    const py2 = cy + r + pingoFase * (r * 0.5);
    ctx.fillStyle = '#ff6611';
    ctx.beginPath();
    ctx.ellipse(cx + r * 0.2, py2, (grande ? 4 : 2.5) * (1 - pingoFase * 0.5), (grande ? 6 : 4), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#aa2200';
    ctx.lineWidth = 1;
    ctx.stroke();
  } else if (p.tipo === 'trovao') {
    const t = Date.now() / 100;
    // flash periódico (relâmpago batendo)
    const flashCycle = (Date.now() % 1500) / 1500;
    const flash = flashCycle < 0.08 ? (1 - flashCycle / 0.08) : 0;

    // glow roxo escuro normal + flash branco no relâmpago
    const glowR = r * (1.4 + flash * 0.5);
    const glow = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, glowR);
    glow.addColorStop(0, `rgba(${153 + flash * 100},${102 + flash * 153},255,${0.55 + flash * 0.4})`);
    glow.addColorStop(1, 'rgba(80,40,150,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
    ctx.fill();

    // nuvem de tempestade (3 círculos sobrepostos)
    const corBase = flash > 0.3 ? '#ddccff' : '#3a2870';
    const corMeio = flash > 0.3 ? '#ffffff' : '#553399';
    const corCima = flash > 0.3 ? '#ffffff' : '#7755bb';
    ctx.fillStyle = corBase;
    ctx.beginPath();
    ctx.arc(cx - r*0.4, cy + r*0.1, r*0.65, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + r*0.4, cy + r*0.1, r*0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = corMeio;
    ctx.beginPath();
    ctx.arc(cx, cy - r*0.1, r*0.85, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = corCima;
    ctx.beginPath();
    ctx.arc(cx - r*0.1, cy - r*0.4, r*0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#221144';
    ctx.lineWidth = grande ? 2 : 1.5;
    ctx.beginPath();
    ctx.arc(cx - r*0.4, cy + r*0.1, r*0.65, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + r*0.4, cy + r*0.1, r*0.6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy - r*0.1, r*0.85, 0, Math.PI * 2);
    ctx.stroke();

    // raios saindo da nuvem por baixo (zigzag)
    ctx.strokeStyle = flash > 0.3 ? '#ffffff' : '#ffee44';
    ctx.lineWidth = grande ? 3 : 2;
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.3, cy + r * 0.4);
    ctx.lineTo(cx - r * 0.45, cy + r * 0.7);
    ctx.lineTo(cx - r * 0.25, cy + r * 0.75);
    ctx.lineTo(cx - r * 0.4, cy + r * 1.1);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + r * 0.25, cy + r * 0.45);
    ctx.lineTo(cx + r * 0.1, cy + r * 0.75);
    ctx.lineTo(cx + r * 0.3, cy + r * 0.85);
    ctx.lineTo(cx + r * 0.15, cy + r * 1.15);
    ctx.stroke();

    // faíscas em volta quando flasha
    if (flash > 0.1) {
      ctx.strokeStyle = `rgba(255,255,255,${flash})`;
      ctx.lineWidth = grande ? 2 : 1;
      for (let i = 0; i < 6; i++) {
        const ang = (i / 6) * Math.PI * 2 + t * 0.1;
        const x1 = cx + Math.cos(ang) * (r + 4);
        const y1 = cy + Math.sin(ang) * (r + 4);
        const x2 = cx + Math.cos(ang) * (r + 14);
        const y2 = cy + Math.sin(ang) * (r + 14);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    }
  } else if (p.tipo === 'gelo') {
    const t = Date.now() / 600;
    // glow gelado
    const glow = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, r * 1.4);
    glow.addColorStop(0, 'rgba(200,240,255,0.6)');
    glow.addColorStop(1, 'rgba(170,230,255,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.4, 0, Math.PI * 2);
    ctx.fill();

    // cristal hexagonal (girando devagar)
    const rot = t * 0.3;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2;
      const x = Math.cos(ang) * r;
      const y = Math.sin(ang) * r;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    const grad = ctx.createRadialGradient(-r*0.3, -r*0.3, 1, 0, 0, r);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.5, '#cceeff');
    grad.addColorStop(1, '#5599cc');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = '#225588';
    ctx.lineWidth = grande ? 3 : 2;
    ctx.stroke();
    // linhas internas do cristal (estrela)
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = grande ? 2 : 1;
    for (let i = 0; i < 3; i++) {
      const ang = (i / 3) * Math.PI;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ang) * r * 0.85, Math.sin(ang) * r * 0.85);
      ctx.lineTo(Math.cos(ang + Math.PI) * r * 0.85, Math.sin(ang + Math.PI) * r * 0.85);
      ctx.stroke();
    }
    ctx.restore();

    // flocos de neve flutuando em volta
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    const numFlocos = grande ? 5 : 3;
    for (let i = 0; i < numFlocos; i++) {
      const ang = (i / numFlocos) * Math.PI * 2 + t * 0.5;
      const dist = r * (1.2 + Math.sin(t * 2 + i) * 0.15);
      const fx = cx + Math.cos(ang) * dist;
      const fy = cy + Math.sin(ang) * dist;
      const fr = (grande ? 2.5 : 1.5);
      ctx.beginPath();
      ctx.arc(fx, fy, fr, 0, Math.PI * 2);
      ctx.fill();
    }

    // brilho central
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath();
    ctx.ellipse(cx - r*0.25, cy - r*0.3, r*0.18, r*0.1, -0.4, 0, Math.PI*2);
    ctx.fill();
  } else if (p.tipo === 'fogo') {
    const t = Date.now() / 150;
    // glow laranja/vermelho pulsando
    const pulso = 0.85 + Math.sin(t * 1.5) * 0.15;
    const glow = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, r * 1.6 * pulso);
    glow.addColorStop(0, 'rgba(255,200,50,0.7)');
    glow.addColorStop(0.5, 'rgba(255,80,20,0.4)');
    glow.addColorStop(1, 'rgba(255,80,20,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.6, 0, Math.PI * 2);
    ctx.fill();

    // chama externa (vermelho/laranja, formato de gota irregular)
    const chamaH = r * 1.4;
    ctx.beginPath();
    const segs = 20;
    for (let i = 0; i <= segs; i++) {
      const ang = (i / segs) * Math.PI * 2 - Math.PI/2; // começa em cima
      // mais alto em cima, achatado embaixo
      const fatorAlt = ang < 0 ? 1.1 : 0.9;
      const flicker = Math.sin(ang * 4 + t * 1.7) * (r * 0.06) + Math.sin(ang * 7 - t * 2.3) * (r * 0.04);
      const rr = r * fatorAlt + flicker;
      const x = cx + Math.cos(ang) * rr;
      const y = cy + Math.sin(ang) * rr * (ang < 0 ? 1.15 : 0.95);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    const gradFora = ctx.createRadialGradient(cx, cy + r * 0.2, r * 0.2, cx, cy - r * 0.2, r * 1.2);
    gradFora.addColorStop(0, '#ffee44');
    gradFora.addColorStop(0.4, '#ff8822');
    gradFora.addColorStop(1, '#cc1100');
    ctx.fillStyle = gradFora;
    ctx.fill();
    ctx.strokeStyle = '#660000';
    ctx.lineWidth = grande ? 3 : 1.5;
    ctx.stroke();

    // chama interna (mais clara, menor)
    ctx.beginPath();
    for (let i = 0; i <= segs; i++) {
      const ang = (i / segs) * Math.PI * 2 - Math.PI/2;
      const fatorAlt = ang < 0 ? 1 : 0.85;
      const flicker = Math.sin(ang * 5 + t * 2.5) * (r * 0.05);
      const rr = r * 0.55 * fatorAlt + flicker;
      const x = cx + Math.cos(ang) * rr;
      const y = cy + Math.sin(ang) * rr * (ang < 0 ? 1.1 : 1);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    const gradDentro = ctx.createRadialGradient(cx, cy, 1, cx, cy, r * 0.6);
    gradDentro.addColorStop(0, '#ffffcc');
    gradDentro.addColorStop(0.6, '#ffdd00');
    gradDentro.addColorStop(1, '#ff7700');
    ctx.fillStyle = gradDentro;
    ctx.fill();

    // brasas/fagulhas subindo
    ctx.fillStyle = '#ffcc44';
    const numBrasas = grande ? 7 : 4;
    for (let i = 0; i < numBrasas; i++) {
      const fase = (t * 0.4 + i * 0.6) % 1;
      const bx = cx + Math.sin(i * 11.7 + t * 0.2) * r * 0.5;
      const by = cy - r - fase * r * 1.4;
      const br = (grande ? 2.2 : 1.4) * (1 - fase * 0.7);
      ctx.globalAlpha = 1 - fase;
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  } else if (p.tipo === 'raio') {
    const t = Date.now() / 100;
    // pulso de glow elétrico
    const pulso = 0.8 + Math.sin(t) * 0.2;
    const glow = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 1.5 * pulso);
    glow.addColorStop(0, 'rgba(255,255,150,0.9)');
    glow.addColorStop(0.5, 'rgba(255,221,0,0.5)');
    glow.addColorStop(1, 'rgba(255,221,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // bola amarela brilhante
    const grad = ctx.createRadialGradient(cx - r*0.2, cy - r*0.2, r*0.1, cx, cy, r);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.4, '#ffee00');
    grad.addColorStop(1, '#cc8800');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#553300';
    ctx.lineWidth = grande ? 3 : 2;
    ctx.stroke();

    // raio (zigzag) dentro
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r - 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = grande ? 4 : 2.5;
    ctx.lineJoin = 'miter';
    ctx.beginPath();
    ctx.moveTo(cx + r * 0.15,  cy - r * 0.7);
    ctx.lineTo(cx - r * 0.25,  cy - r * 0.05);
    ctx.lineTo(cx + r * 0.05,  cy + r * 0.05);
    ctx.lineTo(cx - r * 0.15,  cy + r * 0.7);
    ctx.stroke();
    // contorno escuro pra destacar
    ctx.strokeStyle = '#553300';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    // faíscas saindo (linhas curtas em volta)
    ctx.strokeStyle = 'rgba(255,255,150,0.9)';
    ctx.lineWidth = grande ? 2 : 1.2;
    const numFaiscas = grande ? 6 : 4;
    for (let i = 0; i < numFaiscas; i++) {
      const seed = i * 7.3;
      const ang = (Math.sin(t * 0.3 + seed) + 1) * Math.PI + i * (Math.PI * 2 / numFaiscas);
      const tamFaisca = (grande ? 14 : 7) * (0.5 + Math.abs(Math.sin(t * 0.5 + seed)));
      const x1 = cx + Math.cos(ang) * (r + 2);
      const y1 = cy + Math.sin(ang) * (r + 2);
      // faísca em zigzag (3 segmentos)
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      let lx = x1, ly = y1;
      for (let j = 1; j <= 3; j++) {
        const passo = tamFaisca / 3;
        const desv = (j % 2 === 0 ? 1 : -1) * passo * 0.4;
        const ax = Math.cos(ang) * passo + Math.cos(ang + Math.PI/2) * desv;
        const ay = Math.sin(ang) * passo + Math.sin(ang + Math.PI/2) * desv;
        lx += ax; ly += ay;
        ctx.lineTo(lx, ly);
      }
      ctx.stroke();
    }

    // brilho central
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.ellipse(cx - r*0.3, cy - r*0.35, r*0.22, r*0.13, -0.4, 0, Math.PI * 2);
    ctx.fill();
  } else if (p.tipo === 'veneno') {
    const t = Date.now() / 400;
    // glow tóxico
    const glow = ctx.createRadialGradient(cx, cy, r * 0.4, cx, cy, r * 1.3);
    glow.addColorStop(0, 'rgba(136,238,34,0.6)');
    glow.addColorStop(1, 'rgba(136,238,34,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.3, 0, Math.PI * 2);
    ctx.fill();

    // corpo blob (forma irregular usando seno)
    ctx.beginPath();
    const segs = 24;
    for (let i = 0; i <= segs; i++) {
      const ang = (i / segs) * Math.PI * 2;
      const wob = Math.sin(ang * 3 + t) * (r * 0.07) + Math.sin(ang * 5 - t * 1.3) * (r * 0.04);
      const rr = r + wob;
      const x = cx + Math.cos(ang) * rr;
      const y = cy + Math.sin(ang) * rr;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    const grad = ctx.createRadialGradient(cx - r*0.3, cy - r*0.3, r*0.2, cx, cy, r);
    grad.addColorStop(0, '#ccff66');
    grad.addColorStop(0.6, p.cor);
    grad.addColorStop(1, '#447711');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = '#225500';
    ctx.lineWidth = grande ? 3 : 2;
    ctx.stroke();

    // bolhas animadas dentro
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.85, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    const bolhas = grande ? 5 : 3;
    for (let i = 0; i < bolhas; i++) {
      const fase = (t * 0.6 + i * 0.7) % 1;
      const bx = cx + Math.sin(i * 13.7 + t * 0.3) * r * 0.5;
      const by = cy + r - fase * r * 1.6;
      const br = (grande ? 4 : 2.2) * (0.6 + Math.sin(i * 2.1) * 0.4);
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // pingo escorrendo embaixo
    const pingoFase = (t * 0.4) % 1;
    const py2 = cy + r + pingoFase * (r * 0.5);
    ctx.fillStyle = p.cor;
    ctx.beginPath();
    ctx.ellipse(cx + r * 0.3, py2, (grande ? 4 : 2.5) * (1 - pingoFase * 0.5), (grande ? 6 : 4), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#225500';
    ctx.lineWidth = 1;
    ctx.stroke();

    // brilho no topo
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.ellipse(cx - r*0.35, cy - r*0.4, r*0.2, r*0.1, -0.4, 0, Math.PI*2);
    ctx.fill();
  } else if (p.tipo === 'agua') {
    // sombra/glow azul
    const grad = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, r * 1.1);
    grad.addColorStop(0, '#aaeeff');
    grad.addColorStop(0.6, p.cor);
    grad.addColorStop(1, '#0077aa');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#003355';
    ctx.lineWidth = grande ? 4 : 2;
    ctx.stroke();

    // ondinhas dentro (animadas)
    const t = Date.now() / 300;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r - 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = grande ? 2.5 : 1.5;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      const offsetY = cy + i * (r * 0.4);
      for (let dx = -r; dx <= r; dx += 2) {
        const wy = offsetY + Math.sin((dx + t * 8) / (r * 0.5)) * (r * 0.08);
        if (dx === -r) ctx.moveTo(cx + dx, wy);
        else ctx.lineTo(cx + dx, wy);
      }
      ctx.stroke();
    }
    ctx.restore();

    // brilho/reflexo
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.ellipse(cx - r * 0.35, cy - r * 0.4, r * 0.22, r * 0.12, -0.5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // padrão: quadrado colorido
    ctx.fillStyle = p.cor;
    ctx.fillRect(cx - r, cy - r, tam, tam);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = grande ? 4 : 2;
    ctx.strokeRect(cx - r, cy - r, tam, tam);
  }
}

// ----- VISUAL DO INIMIGO (pedra) -----
function desenharInimigo(inimigo) {
  const cx = inimigo.x, cy = inimigo.y;
  const tam = inimigo.tamanho || TAMANHO_INIMIGO;
  const r = tam / 2;
  const seed = inimigo.seed || 0;
  const flashing = inimigo.flash > 0;
  const isBoss = inimigo.boss;

  // glow vermelho pro chefão
  if (isBoss) {
    const pulse = 0.8 + Math.sin(Date.now() / 200) * 0.2;
    const bossGlow = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r * 1.5 * pulse);
    bossGlow.addColorStop(0, 'rgba(255,50,80,0.4)');
    bossGlow.addColorStop(1, 'rgba(150,20,40,0)');
    ctx.fillStyle = bossGlow;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // sombra embaixo
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + r * 0.95, r * 0.85, r * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();

  // forma irregular de pedra (define o caminho que vamos usar 2x: fill e clip)
  function pathPedra() {
    const segs = 9;
    ctx.beginPath();
    for (let i = 0; i <= segs; i++) {
      const ang = (i / segs) * Math.PI * 2;
      const var1 = Math.sin(ang * 3 + seed) * 0.18;
      const var2 = Math.cos(ang * 5 + seed * 1.7) * 0.12;
      const rr = r * (1 + var1 + var2);
      const x = cx + Math.cos(ang) * rr;
      const y = cy + Math.sin(ang) * rr;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  // preenchimento
  pathPedra();
  if (flashing) {
    ctx.fillStyle = '#ffffff';
  } else if (isBoss) {
    // chefão: mais escuro, com cor de "rocha vulcânica"
    const grad = ctx.createRadialGradient(cx - r*0.3, cy - r*0.4, r*0.15, cx, cy, r);
    grad.addColorStop(0, '#776655');
    grad.addColorStop(0.5, '#3a2a25');
    grad.addColorStop(1, '#1a0a08');
    ctx.fillStyle = grad;
  } else {
    const grad = ctx.createRadialGradient(cx - r*0.3, cy - r*0.4, r*0.15, cx, cy, r);
    grad.addColorStop(0, '#aaaaaa');
    grad.addColorStop(0.55, '#666677');
    grad.addColorStop(1, '#2a2a36');
    ctx.fillStyle = grad;
  }
  ctx.fill();
  ctx.strokeStyle = isBoss ? '#ff6622' : '#1a1a22';
  ctx.lineWidth = isBoss ? 4 : 2;
  ctx.stroke();

  // rachaduras (clipa pra não sair da pedra)
  ctx.save();
  pathPedra();
  ctx.clip();
  if (isBoss) {
    // rachaduras de LAVA brilhando vermelho/laranja
    const pulse = 0.7 + Math.sin(Date.now() / 200) * 0.3;
    ctx.strokeStyle = `rgba(255,${100 + pulse * 100},20,${pulse})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.8, cy + r * 0.1);
    ctx.lineTo(cx - r * 0.2, cy + r * 0.25);
    ctx.lineTo(cx + r * 0.4, cy - r * 0.05);
    ctx.lineTo(cx + r * 0.8, cy + r * 0.3);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.5, cy + r * 0.7);
    ctx.lineTo(cx, cy + r * 0.45);
    ctx.lineTo(cx + r * 0.6, cy + r * 0.7);
    ctx.stroke();
    // pontos quentes brilhando
    for (let i = 0; i < 4; i++) {
      const ang = i * 1.5 + seed;
      const dist = r * 0.5;
      const px = cx + Math.cos(ang) * dist;
      const py = cy + Math.sin(ang) * dist;
      ctx.fillStyle = `rgba(255,${150 + pulse * 80},30,${pulse * 0.9})`;
      ctx.beginPath();
      ctx.arc(px, py, 3 * pulse, 0, Math.PI * 2);
      ctx.fill();
    }
    // OLHOS VERMELHOS BRILHANDO (chefão!)
    const olhoY = cy - r * 0.25;
    const olhoX = r * 0.32;
    // glow dos olhos
    ctx.fillStyle = `rgba(255,40,0,${pulse * 0.5})`;
    ctx.beginPath();
    ctx.arc(cx - olhoX, olhoY, r * 0.25, 0, Math.PI * 2);
    ctx.arc(cx + olhoX, olhoY, r * 0.25, 0, Math.PI * 2);
    ctx.fill();
    // olhos vermelhos
    ctx.fillStyle = '#ff2200';
    ctx.beginPath();
    ctx.arc(cx - olhoX, olhoY, r * 0.13, 0, Math.PI * 2);
    ctx.arc(cx + olhoX, olhoY, r * 0.13, 0, Math.PI * 2);
    ctx.fill();
    // pupila amarela
    ctx.fillStyle = '#ffdd44';
    ctx.beginPath();
    ctx.arc(cx - olhoX, olhoY, r * 0.05, 0, Math.PI * 2);
    ctx.arc(cx + olhoX, olhoY, r * 0.05, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // pedra normal: rachaduras pretas e cristais azulados
    ctx.strokeStyle = flashing ? 'rgba(180,180,180,0.6)' : 'rgba(20,20,30,0.85)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - r*0.7, cy - r*0.2 + Math.sin(seed) * 4);
    ctx.lineTo(cx - r*0.1, cy + r*0.1);
    ctx.lineTo(cx + r*0.6, cy - r*0.3 + Math.cos(seed) * 4);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - r*0.4, cy + r*0.6);
    ctx.lineTo(cx + r*0.05, cy + r*0.25);
    ctx.lineTo(cx + r*0.55, cy + r*0.5);
    ctx.stroke();
    if (!flashing) {
      for (let i = 0; i < 3; i++) {
        const ang = i * 2.4 + seed;
        const dist = r * 0.45;
        const px = cx + Math.cos(ang) * dist;
        const py = cy + Math.sin(ang) * dist;
        ctx.fillStyle = 'rgba(180,200,255,0.7)';
        ctx.beginPath();
        ctx.arc(px, py, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  ctx.restore();

  // barra de vida (mais larga pro chefão)
  const barraW = isBoss ? 80 : 30;
  desenharBarraVida(cx, cy - r - 10, barraW, inimigo.hp, inimigo.hpMax, '#ff5566');
  // label CHEFÃO em cima
  if (isBoss) {
    ctx.fillStyle = '#ffcc00';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('CHEFÃO #' + ondaChefao, cx, cy - r - 20);
  }
}

function desenharBarraVida(x, y, largura, hp, hpMax, cor) {
  const altura = 5;
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(x - largura/2, y, largura, altura);
  ctx.fillStyle = cor;
  ctx.fillRect(x - largura/2, y, largura * (hp / hpMax), altura);
}

function desenharHUD() {
  // munição
  const baseX = 20, baseY = tela.height - 30;
  ctx.font = 'bold 14px Arial';
  ctx.fillStyle = 'white';
  ctx.textAlign = 'left';
  ctx.fillText('Munição', baseX, baseY - 10);
  for (let i = 0; i < jogador.municaoMax; i++) {
    const cheio = i < jogador.municao;
    ctx.fillStyle = cheio ? COR_TIRO : 'rgba(255,255,255,0.2)';
    ctx.beginPath();
    ctx.arc(baseX + 10 + i * 22, baseY + 5, 9, 0, Math.PI*2);
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  if (jogador.municao < jogador.municaoMax) {
    const px = baseX + 10 + jogador.municao * 22 - 9;
    const pw = 18 * (jogador.contadorRecarga / temposRecarga());
    ctx.fillStyle = 'rgba(255,255,0,0.4)';
    ctx.fillRect(px, baseY + 14, pw, 3);
  }

  // super
  const sx = tela.width - 180, sy = tela.height - 30;
  ctx.fillStyle = 'white';
  ctx.fillText('Super (Q)', sx, sy - 10);
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(sx, sy, 160, 14);
  const pronto = jogador.superCarga >= SUPER_NECESSARIO;
  ctx.fillStyle = pronto ? COR_SUPER : '#9966cc';
  ctx.fillRect(sx, sy, 160 * (jogador.superCarga / SUPER_NECESSARIO), 14);
  if (pronto) {
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText('PRONTO!', sx + 80, sy + 11);
  }
  ctx.strokeStyle = '#000';
  ctx.strokeRect(sx, sy, 160, 14);

  // moedas ganhas durante a partida
  ctx.fillStyle = '#ffcc00';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('💰 +' + moedasGanhas, tela.width/2, 30);

  // timer do modo "tempo"
  if (salvo.modoAtual === 'tempo') {
    const segs = Math.max(0, Math.ceil(timerPartida / 60));
    const corTimer = segs <= 10 ? '#ff3344' : 'white';
    ctx.fillStyle = corTimer;
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('⏱ ' + segs + 's', tela.width/2, 60);
  }
}

// ----- COUNTDOWN -----
function desenharCountdown() {
  const segundo = Math.ceil(timerCountdown / 60);
  let texto = segundo === 4 ? '3' : segundo === 3 ? '2' : segundo === 2 ? '1' : 'VAI!';
  const progresso = ((timerCountdown - 1) % 60) / 60;
  const escala = 1.4 - progresso * 0.4;
  ctx.save();
  ctx.translate(tela.width/2, tela.height/2);
  ctx.scale(escala, escala);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.font = 'bold 140px Arial';
  ctx.fillText(texto, 4, 6);
  ctx.fillStyle = texto === 'VAI!' ? '#22ff66' : '#ffcc00';
  ctx.fillText(texto, 0, 0);
  ctx.restore();
  ctx.textBaseline = 'alphabetic';
}

// ----- GAME OVER -----
function desenharGameOver() {
  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.fillRect(0, 0, tela.width, tela.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ff3344';
  ctx.font = 'bold 60px Arial';
  ctx.fillText('GAME OVER', tela.width/2, tela.height/2 - 100);
  ctx.fillStyle = 'white';
  ctx.font = 'bold 28px Arial';
  ctx.fillText('Pontos: ' + pontos, tela.width/2, tela.height/2 - 50);
  ctx.fillStyle = '#ffcc00';
  ctx.font = 'bold 22px Arial';
  ctx.fillText('💰 Você ganhou ' + moedasGanhas + ' moedas!', tela.width/2, tela.height/2 - 15);
  if (pontos >= salvo.melhorPontuacao && pontos > 0) {
    ctx.fillStyle = '#ffcc00';
    ctx.font = 'bold 18px Arial';
    ctx.fillText('🏆 NOVO RECORDE!', tela.width/2, tela.height/2 + 15);
  }

  btn(tela.width/2, tela.height/2 + 70,  300, 60, 'JOGAR DE NOVO', () => iniciarPartida(),    { cor: '#22cc55', corHover: '#33dd66', corBorda: '#117733', corTexto: 'white', fonte: 'bold 22px Arial' });
  btn(tela.width/2, tela.height/2 + 145, 220, 50, 'MENU',          () => { estado = 'menu'; }, { cor: '#66ccff', corHover: '#99ddff', corBorda: '#225577', fonte: 'bold 18px Arial' });
  for (const b of botoes) desenharBotao(b);
}

function desenharPausado() {
  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  ctx.fillRect(0, 0, tela.width, tela.height);
  ctx.fillStyle = '#ffcc00';
  ctx.font = 'bold 60px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('PAUSADO', tela.width/2, tela.height/2 - 60);
  ctx.fillStyle = 'white';
  ctx.font = '18px Arial';
  ctx.fillText('Aperte P ou clique no botão pra continuar', tela.width/2, tela.height/2 - 15);

  // botões: continuar e sair
  btn(tela.width/2, tela.height/2 + 40, 280, 55, '▶ CONTINUAR', () => alternarPausa(), { cor: '#22cc55', corHover: '#33dd66', corBorda: '#117733', corTexto: 'white', fonte: 'bold 20px Arial' });
  btn(tela.width/2, tela.height/2 + 110, 280, 55, '🏠 SAIR PRO MENU', () => sairPartida(), { cor: '#ff6666', corHover: '#ff8888', corBorda: '#aa2222', corTexto: 'white', fonte: 'bold 18px Arial' });
  for (const b of botoes) desenharBotao(b);
}

function desenharMensagem() {
  const op = Math.min(1, mensagemTimer / 30);
  ctx.fillStyle = `rgba(0,0,0,${0.7 * op})`;
  const w = 400, h = 50;
  ctx.fillRect(tela.width/2 - w/2, tela.height/2 - 200 - h/2, w, h);
  ctx.fillStyle = `rgba(255,255,255,${op})`;
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(mensagemTemp, tela.width/2, tela.height/2 - 200);
  ctx.textBaseline = 'alphabetic';
}

// ----- ATUALIZAR PLACAR -----
function atualizarPlacar() {
  if (estado === 'menu') placar.textContent = '🏆 Recorde: ' + salvo.melhorPontuacao + ' | 💰 ' + salvo.moedas + ' moedas';
  else if (estado === 'personagens') placar.textContent = 'Escolha seu personagem (ESC pra voltar)';
  else if (estado === 'eventos') placar.textContent = 'Escolha o modo de jogo (ESC pra voltar)';
  else if (estado === 'loja') placar.textContent = 'Compre melhorias com suas moedas (ESC pra voltar)';
  else if (estado === 'jogando' || estado === 'countdown') placar.textContent = 'Pontos: ' + pontos + ' | Vidas: ' + jogador.vidas + ' / ' + jogador.vidasMax;
  else if (estado === 'gameOver') placar.textContent = 'Game Over — clique pra continuar';
}

// ----- LOOP -----
function loop() {
  if (estado === 'jogando' && !pausado) {
    moverJogador();
    recarregar();
    moverTiros();
    moverInimigos();
    verificarColisoes();
    // tiro automático enquanto segura o botão/dedo
    if (cooldownTiro > 0) cooldownTiro -= 1;
    if (segurandoTiro && cooldownTiro <= 0) {
      atirar();
      cooldownTiro = COOLDOWN_TIRO_SEGURADO;
    }
    if (salvo.modoAtual === 'chefao') {
      // sem inimigos comuns; spawnar próximo chefão quando o atual morrer
      if (inimigos.length === 0) {
        ondaChefao++;
        spawnarChefao();
      }
    } else {
      contadorInimigos++;
      if (contadorInimigos >= TEMPO_ENTRE_INIMIGOS) {
        criarInimigo();
        contadorInimigos = 0;
      }
    }
    // modo "tempo": diminui o timer e termina ao zerar
    if (salvo.modoAtual === 'tempo') {
      timerPartida -= 1;
      if (timerPartida <= 0) finalizarPartida();
    }
  } else if (estado === 'countdown') {
    timerCountdown -= 1;
    if (timerCountdown <= 0) estado = 'jogando';
  }
  desenhar();
  atualizarPlacar();
  requestAnimationFrame(loop);
}

loop();
