// Dominic FC — futebol no estilo FC Mobile: cartas de jogadores (nota 60 a 130), pacotes, meu time e partida 5 contra 5
(() => {
  const $ = id => document.getElementById(id);
  const canvas = $('game');
  const ctx = canvas.getContext('2d');
  const W = 480, H = 300;

  // Perfil: ?perfil=teste guarda tudo separado (aba de teste)
  const PERFIL = (new URLSearchParams(location.search).get('perfil') || '').replace(/[^a-z0-9]/gi, '').slice(0, 20);
  const KEY = 'dominicFC' + (PERFIL ? ':' + PERFIL : '');
  if (PERFIL) $('back-link').href = '../index.html?perfil=' + PERFIL;

  // ── Cartas ────────────────────────────────────────────────
  const FIRST = ['Léo', 'Davi', 'Rafa', 'Gui', 'Theo', 'Enzo', 'Juca', 'Beto', 'Caio', 'Duda', 'Tito', 'Nico', 'Lipe', 'Vini', 'Kauã', 'Bento', 'Iago', 'Zeca', 'Maxi', 'Rudi', 'Pedrinho', 'Lucca'];
  const LAST = ['Raio', 'Bala', 'Foguete', 'Trovão', 'Muralha', 'Furacão', 'Canhão', 'Mágico', 'Flecha', 'Tigre', 'Gelo', 'Chama', 'Onda', 'Cometa', 'Dragão', 'Faísca', 'Paredão', 'Tanque', 'Relâmpago', 'Ventania'];
  const FACES = ['😀', '😎', '🤠', '🧐', '😤', '🥶', '😄', '🦁', '🐯', '🦊', '🐺', '🤖', '👽', '🥷', '🧙', '🐲'];
  const POS = ['GOL', 'ZAG', 'MEI', 'ATA'];
  const MIN_R = 60, MAX_R = 130;
  const TIERS = [[120, 'lenda', 'LENDA'], [105, 'elite', 'ELITE'], [90, 'ouro', 'OURO'], [75, 'prata', 'PRATA'], [0, 'bronze', 'BRONZE']];
  const tierOf = r => TIERS.find(t => r >= t[0]);
  const pick = a => a[Math.floor(Math.random() * a.length)];
  // Nota sorteada: as baixas saem mais, as altas são raras
  const roll = (min, max) => min + Math.floor((max - min + 1) * Math.pow(Math.random(), 1.6));

  // Cartas especiais: o mesmo craque em times diferentes (nomes parecidos com os de verdade)
  const SPECIALS = [
    { key: 'neymaro-peixe', nome: 'Neymaro Jr', pos: 'ATA', r: 88, face: '😎', club: 'Peixe FC', badge: '⚪' },
    { key: 'neymaro-barca', nome: 'Neymaro Jr', pos: 'ATA', r: 100, face: '😎', club: 'Blaugrana FC', badge: '🔵' },
    { key: 'neymaro-paris', nome: 'Neymaro Jr', pos: 'ATA', r: 118, face: '😎', club: 'Paris Estrelas', badge: '🗼' },
    { key: 'neymaro-brasil', nome: 'Neymaro Jr', pos: 'ATA', r: 128, face: '😎', club: 'Brasil', badge: '🇧🇷', album: 'brasil' },
    // Álbum de seleções
    { key: 'vinny-brasil', nome: 'Vinny Júnior', pos: 'ATA', r: 118, face: '🕺', club: 'Brasil', badge: '🇧🇷', album: 'brasil' },
    { key: 'alissao-brasil', nome: 'Alissão', pos: 'GOL', r: 105, face: '🧤', club: 'Brasil', badge: '🇧🇷', album: 'brasil' },
    { key: 'messy-arg', nome: 'Lionel Messy', pos: 'ATA', r: 130, face: '🐐', club: 'Argentina', badge: '🇦🇷', album: 'argentina' },
    { key: 'dimariah-arg', nome: 'Di Mariah', pos: 'MEI', r: 108, face: '😁', club: 'Argentina', badge: '🇦🇷', album: 'argentina' },
    { key: 'dibu-arg', nome: 'Dibu Martinéz', pos: 'GOL', r: 104, face: '🧤', club: 'Argentina', badge: '🇦🇷', album: 'argentina' },
    { key: 'ronaldinho-por', nome: 'Cristiano Ronaldinho', pos: 'ATA', r: 127, face: '💪', club: 'Portugal', badge: '🇵🇹', album: 'portugal' },
    { key: 'fernandao-por', nome: 'Bruno Fernandão', pos: 'MEI', r: 110, face: '😏', club: 'Portugal', badge: '🇵🇹', album: 'portugal' },
    { key: 'rubem-por', nome: 'Rúbem Dias', pos: 'ZAG', r: 106, face: '🧱', club: 'Portugal', badge: '🇵🇹', album: 'portugal' },
    { key: 'mbappo-fra', nome: 'Mbappô', pos: 'ATA', r: 126, face: '🐢', club: 'França', badge: '🇫🇷', album: 'franca' },
    { key: 'grizma-fra', nome: 'Grizmã', pos: 'MEI', r: 108, face: '🥖', club: 'França', badge: '🇫🇷', album: 'franca' },
    { key: 'saliba-fra', nome: 'Salibá', pos: 'ZAG', r: 104, face: '🧱', club: 'França', badge: '🇫🇷', album: 'franca' },
    { key: 'kaine-ing', nome: 'Harry Kaine', pos: 'ATA', r: 122, face: '🎯', club: 'Inglaterra', badge: '🏴', album: 'inglaterra' },
    { key: 'bellinghao-ing', nome: 'Bellinghão', pos: 'MEI', r: 116, face: '😤', club: 'Inglaterra', badge: '🏴', album: 'inglaterra' },
    { key: 'pickfordo-ing', nome: 'Pickfordo', pos: 'GOL', r: 102, face: '🧤', club: 'Inglaterra', badge: '🏴', album: 'inglaterra' },
    { key: 'yamal-esp', nome: 'Lamine Yamalzinho', pos: 'ATA', r: 120, face: '⚡', club: 'Espanha', badge: '🇪🇸', album: 'espanha' },
    { key: 'pedri-esp', nome: 'Pedrí', pos: 'MEI', r: 112, face: '🎩', club: 'Espanha', badge: '🇪🇸', album: 'espanha' },
    { key: 'rodri-esp', nome: 'Rodrigo Rodri', pos: 'MEI', r: 114, face: '🧠', club: 'Espanha', badge: '🇪🇸', album: 'espanha' },
  ];
  const ALBUM = [['brasil', '🇧🇷 BRASIL'], ['argentina', '🇦🇷 ARGENTINA'], ['portugal', '🇵🇹 PORTUGAL'], ['franca', '🇫🇷 FRANÇA'],
    ['inglaterra', '🏴 INGLATERRA'], ['espanha', '🇪🇸 ESPANHA']];
  const ALBUM_PRIZE = 1500;
  // Os craques do álbum: os do jogo e os que você adicionou (➕)
  const allSpecials = () => SPECIALS.concat((data && data.custom) || []);
  const BADGES = { brasil: ['🇧🇷', 'Brasil'], argentina: ['🇦🇷', 'Argentina'], portugal: ['🇵🇹', 'Portugal'], franca: ['🇫🇷', 'França'], inglaterra: ['🏴', 'Inglaterra'], espanha: ['🇪🇸', 'Espanha'] };   // completou uma seleção: ganha moedas
  // Nome que aparece: o que você escreveu no ✏️, ou o da carta
  const nameOf = c => (data.renames && data.renames[c.key || c.id]) || c.nome;
  let data;
  function newCard(min, max, pos) {
    // De vez em quando sai um craque especial (os de nota alta são mais raros)
    if (!pos && Math.random() < 0.15) {
      const ok = allSpecials().filter(sp => sp.r >= min && sp.r <= max && Math.random() < 1.4 - sp.r / 130);
      if (ok.length) return Object.assign({ id: data.next++ }, pick(ok));
    }
    return { id: data.next++, r: Math.min(MAX_R, roll(min, max)), pos: pos || pick(POS), nome: pick(FIRST) + ' ' + pick(LAST), face: pick(FACES) };
  }
  function load() {
    try { data = JSON.parse(localStorage.getItem(KEY)); } catch (e) { data = null; }
    if (!data || !Array.isArray(data.cards)) {
      data = { coins: 500, cards: [], team: [], next: 1, played: 0, wins: 0 };
      // Time inicial: 5 cartas de bronze
      for (const [pos, r] of [['GOL', 62], ['ZAG', 61], ['MEI', 63], ['ATA', 64], ['ATA', 60]]) {
        const c = newCard(r, r, pos); data.cards.push(c); data.team.push(c.id);
      }
      save();
    }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* sem salvar */ } }
  const cardById = id => data.cards.find(c => c.id === id);

  // Posições do time: 1 goleiro, 2 na defesa e 2 no ataque
  const SLOTS = [{ label: 'GOL', gk: true }, { label: 'DEFESA' }, { label: 'DEFESA' }, { label: 'ATAQUE' }, { label: 'ATAQUE' }];
  // Goleiro na linha (ou jogador de linha no gol) joga pior
  const effR = (card, slot) => !card ? 40 : Math.round(card.r * ((SLOTS[slot].gk ? card.pos === 'GOL' : card.pos !== 'GOL') ? 1 : 0.7));
  const teamOvr = () => Math.round(data.team.reduce((s, id, i) => s + effR(cardById(id), i), 0) / 5);

  function cardEl(c, extra) {
    const t = tierOf(c.r);
    const d = document.createElement('div');
    d.className = 'card t-' + t[1] + (extra ? ' ' + extra : '');
    d.innerHTML = '<div class="rt"></div><div class="ps"></div><div class="badge"></div><div class="face"></div><div><div class="nm"></div><div class="tier"></div></div>';
    if (c.club) { d.classList.add('special'); d.querySelector('.badge').textContent = c.badge || ''; }
    d.querySelector('.rt').textContent = c.r;
    d.querySelector('.ps').textContent = c.pos;
    d.querySelector('.face').textContent = c.face;
    d.querySelector('.nm').textContent = nameOf(c);
    d.querySelector('.tier').textContent = c.club ? c.club : t[2];
    return d;
  }

  // ── Menu ──────────────────────────────────────────────────
  let page = 'main', picking = -1;
  function show(p) {
    page = p; picking = -1;
    document.querySelectorAll('.page').forEach(el => el.classList.toggle('on', el.id === 'page-' + p));
    render();
  }
  document.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => show(b.dataset.go)));

  function render() {
    $('coins').textContent = data.coins;
    $('ovr').textContent = $('ovr2').textContent = teamOvr();
    $('n-cards').textContent = data.cards.length + ' cartas';
    if (page === 'team') renderTeam();
    if (page === 'packs') renderPacks();
    if (page === 'cards') renderCards();
    if (page === 'album') renderAlbum();
  }

  function renderTeam() {
    const pitch = $('pitch');
    pitch.innerHTML = '';
    // De cima pra baixo: ataque, defesa, goleiro
    for (const line of [[3, 4], [1, 2], [0]]) {
      const row = document.createElement('div');
      row.className = 'line';
      for (const i of line) {
        const slot = document.createElement('div');
        slot.className = 'slot' + (picking === i ? ' picking' : '');
        const c = cardById(data.team[i]);
        const ce = cardEl(c);
        ce.addEventListener('click', () => { picking = picking === i ? -1 : i; renderTeam(); });
        const lab = document.createElement('div');
        lab.className = 'slot-label';
        lab.textContent = SLOTS[i].label + (effR(c, i) < c.r ? ' (fora da posição)' : '');
        slot.append(ce, lab);
        row.appendChild(slot);
      }
      pitch.appendChild(row);
    }
    const list = $('team-pick');
    list.innerHTML = '';
    if (picking < 0) { $('team-hint').textContent = 'Toque num jogador do campo pra trocar.'; return; }
    $('team-hint').textContent = 'Escolha quem entra no ' + SLOTS[picking].label + ':';
    const others = data.cards.filter(c => c.id !== data.team[picking]).sort((a, b) => effR(b, picking) - effR(a, picking));
    for (const c of others) {
      const where = data.team.indexOf(c.id);
      const ce = cardEl(c, where >= 0 ? 'in-team' : '');
      ce.addEventListener('click', () => {
        // Se já está no time, troca de lugar com quem sai
        if (where >= 0) data.team[where] = data.team[picking];
        data.team[picking] = c.id;
        picking = -1;
        save(); render();
      });
      list.appendChild(ce);
    }
  }

  const PACKS = [
    { id: 'bronze', name: 'Pacote Bronze', ico: '🟫', price: 300, n: 3, min: 60, max: 80, bg: 'linear-gradient(135deg,#c07a3a,#7a4a1a)' },
    { id: 'prata', name: 'Pacote Prata', ico: '⬜', price: 800, n: 3, min: 70, max: 95, bg: 'linear-gradient(135deg,#a9b2c3,#5a6a80)' },
    { id: 'ouro', name: 'Pacote Ouro', ico: '🟨', price: 2000, n: 3, min: 85, max: 112, bg: 'linear-gradient(135deg,#ffd23a,#b8860b)' },
    { id: 'lenda', name: 'Pacote Lenda', ico: '🌈', price: 6000, n: 3, min: 95, max: 130, best: [110, 130], bg: 'linear-gradient(135deg,#ff4a4a,#ffb02e,#5ccfff,#b06cff)' },
  ];
  function renderPacks() {
    const list = $('pack-list');
    list.innerHTML = '';
    for (const p of PACKS) {
      const b = document.createElement('button');
      b.className = 'pack';
      b.style.background = p.bg;
      b.innerHTML = '<div class="ico"></div><div class="nm"></div><small></small><div class="price"></div>';
      b.querySelector('.ico').textContent = p.ico;
      b.querySelector('.nm').textContent = p.name;
      b.querySelector('small').textContent = p.n + ' jogadores de nota ' + p.min + ' a ' + p.max + (p.best ? ' (1 garantido de ' + p.best[0] + '+)' : '');
      b.querySelector('.price').textContent = '🪙 ' + p.price;
      b.disabled = data.coins < p.price;
      b.addEventListener('click', () => openPack(p));
      list.appendChild(b);
    }
    $('pack-msg').textContent = 'Ganhe moedas jogando partidas! Vitória: 500 · Empate: 250 · Derrota: 100 · Gol: +50';
  }
  function openPack(p) {
    if (data.coins < p.price) return;
    data.coins -= p.price;
    const got = [];
    for (let i = 0; i < p.n; i++) got.push(i === 0 && p.best ? newCard(p.best[0], p.best[1]) : newCard(p.min, p.max));
    data.cards.push(...got);
    save();
    const out = $('reveal-cards');
    out.innerHTML = '';
    got.sort((a, b) => a.r - b.r).forEach((c, i) => { const ce = cardEl(c); ce.style.animationDelay = (i * 0.5) + 's'; out.appendChild(ce); });
    const best = Math.max(...got.map(c => c.r));
    $('reveal-title').textContent = best >= 120 ? '🌈 LENDA!!! 🌈' : best >= 105 ? '💜 ELITE! 💜' : best >= 90 ? '⭐ OURO! ⭐' : 'NOVOS JOGADORES!';
    $('reveal').classList.add('on');
    beep(best >= 105 ? 1200 : 700, 0.2, 'triangle');
    render();
  }
  $('reveal-ok').addEventListener('click', () => $('reveal').classList.remove('on'));

  function renderCards() {
    const list = $('card-list');
    list.innerHTML = '';
    for (const c of [...data.cards].sort((a, b) => b.r - a.r)) {
      const inTeam = data.team.includes(c.id);
      const wrap = document.createElement('div');
      const ce = cardEl(c, inTeam ? 'in-team' : '');
      wrap.appendChild(ce);
      const act = document.createElement('div');
      act.className = 'card-actions';
      const ed = document.createElement('button');
      ed.className = 'edit';
      ed.textContent = '✏️';
      ed.title = 'Mudar o nome (só no seu jogo)';
      ed.addEventListener('click', () => editName(c, wrap));
      act.appendChild(ed);
      wrap.appendChild(act);
      if (!inTeam) {
        const b = document.createElement('button');
        const val = Math.round(c.r * 1.2);
        b.textContent = 'VENDER 🪙' + val;
        // Primeiro toque pergunta, segundo vende
        b.addEventListener('click', () => {
          if (b.dataset.armed !== '1') { b.dataset.armed = '1'; b.textContent = 'Vender mesmo?'; setTimeout(() => { b.dataset.armed = ''; b.textContent = 'VENDER 🪙' + val; }, 3000); return; }
          data.cards = data.cards.filter(x => x.id !== c.id);
          data.coins += val;
          save(); render();
        });
        act.appendChild(b);
      }
      list.appendChild(wrap);
    }
  }

  // ✏️ Muda o nome da carta (fica guardado só neste aparelho). Vale pra todas as cartas iguais
  function editName(c, wrap) {
    const box = document.createElement('div');
    box.className = 'edit-box';
    const inp = document.createElement('input');
    inp.maxLength = 22;
    inp.value = nameOf(c);
    const ok = document.createElement('button');
    ok.textContent = 'OK';
    const done = () => {
      data.renames = data.renames || {};
      const v = inp.value.trim();
      if (v && v !== c.nome) data.renames[c.key || c.id] = v; else delete data.renames[c.key || c.id];
      save(); render();
    };
    ok.addEventListener('click', done);
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') done(); e.stopPropagation(); });
    box.append(inp, ok);
    wrap.appendChild(box);
    inp.focus(); inp.select();
  }

  // ── Álbum de seleções ──
  function renderAlbum() {
    const list = $('album-list');
    list.innerHTML = '';
    const have = new Set(data.cards.map(c => c.key).filter(Boolean));
    data.albumDone = data.albumDone || [];
    for (const [id, title] of ALBUM) {
      const players = allSpecials().filter(sp => sp.album === id);
      const got = players.filter(sp => have.has(sp.key)).length;
      const sec = document.createElement('div');
      sec.className = 'album-team';
      const h = document.createElement('div');
      h.className = 'album-title';
      h.textContent = title + '  ' + got + '/' + players.length + (got === players.length ? '  ✅' : '');
      const row = document.createElement('div');
      row.className = 'album-row';
      for (const sp of players) {
        if (have.has(sp.key)) row.appendChild(withRemove(cardEl(sp), sp));
        else row.appendChild(withRemove(cardEl(sp, 'album-missing'), sp));   // ainda não tem: aparece apagadinho
      }
      sec.append(h, row, addForm(id));
      list.appendChild(sec);
      // Completou a seleção pela primeira vez: prêmio!
      if (got === players.length && !data.albumDone.includes(id)) {
        data.albumDone.push(id);
        data.coins += ALBUM_PRIZE;
        save();
        $('album-msg').textContent = '🎉 Você completou ' + title + '! Ganhou 🪙 ' + ALBUM_PRIZE;
        beep(1046, 0.4, 'triangle');
      }
    }
    $('coins').textContent = data.coins;
  }

  // Jogador que você criou: tem 🗑️ pra tirar do álbum
  function withRemove(el, sp) {
    if (!sp.custom) return el;
    const w = document.createElement('div');
    w.className = 'album-slot';
    const b = document.createElement('button');
    b.className = 'album-del';
    b.textContent = '🗑️';
    b.addEventListener('click', () => {
      if (b.dataset.armed !== '1') { b.dataset.armed = '1'; b.textContent = 'Tirar?'; setTimeout(() => { b.dataset.armed = ''; b.textContent = '🗑️'; }, 3000); return; }
      data.custom = data.custom.filter(x => x.key !== sp.key);
      save(); render();
    });
    w.append(el, b);
    return w;
  }
  // ➕ Adicionar um jogador seu na seleção: ele passa a sair nos pacotes
  function addForm(id) {
    const wrap = document.createElement('div');
    wrap.className = 'album-add';
    const open = document.createElement('button');
    open.className = 'add-open';
    open.textContent = '➕ ADICIONAR JOGADOR';
    const form = document.createElement('div');
    form.className = 'add-form';
    form.style.display = 'none';
    form.innerHTML = '<input class="a-nome" maxlength="22" placeholder="Nome do jogador">' +
      '<select class="a-pos"><option>ATA</option><option>MEI</option><option>ZAG</option><option>GOL</option></select>' +
      '<input class="a-r" type="number" min="60" max="130" value="100" title="Nota (60 a 130)">' +
      '<select class="a-face">' + FACES.concat(['⚽', '🐐', '👑', '🔥', '⚡', '🧤']).map(f => '<option>' + f + '</option>').join('') + '</select>' +
      '<button class="a-ok">ADICIONAR</button><div class="a-msg"></div>';
    open.addEventListener('click', () => { form.style.display = form.style.display === 'none' ? 'flex' : 'none'; });
    form.querySelector('.a-nome').addEventListener('keydown', e => e.stopPropagation());
    form.querySelector('.a-ok').addEventListener('click', () => {
      const nome = form.querySelector('.a-nome').value.trim();
      const r = Math.round(Number(form.querySelector('.a-r').value));
      if (!nome) { form.querySelector('.a-msg').textContent = 'Escreva o nome!'; return; }
      if (!(r >= MIN_R && r <= MAX_R)) { form.querySelector('.a-msg').textContent = 'A nota é de 60 a 130.'; return; }
      data.custom = data.custom || [];
      data.custom.push({ key: 'meu-' + Date.now(), custom: true, nome, pos: form.querySelector('.a-pos').value, r,
        face: form.querySelector('.a-face').value, club: BADGES[id][1], badge: BADGES[id][0], album: id });
      save(); render();
    });
    wrap.append(open, form);
    return wrap;
  }

  // ── Som ───────────────────────────────────────────────────
  let audio = null;
  function beep(freq, dur, type) {
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

  // ── Partida ───────────────────────────────────────────────
  const FX0 = 24, FX1 = 456, FY0 = 34, FY1 = 286;          // campo
  const MIDY = (FY0 + FY1) / 2, GOAL_H = 70;
  const GY0 = MIDY - GOAL_H / 2, GY1 = MIDY + GOAL_H / 2;   // boca do gol
  const MATCH_FRAMES = 60 * 120;                            // 2 minutos
  const CLUBS = ['Dragões FC', 'Raio Azul', 'Tubarões do Mar', 'Fênix United', 'Leões de Gelo', 'Trovão SC', 'Cometa EC', 'Lobos da Noite', 'Atlético Vulcão', 'Real Furacão'];
  // Lugar de cada um no campo (pra quem ataca pra direita): x e y de 0 a 1
  const HOME = [[0.02, 0.5], [0.25, 0.3], [0.25, 0.7], [0.6, 0.32], [0.6, 0.68]];

  let M = null;   // a partida
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const norm01 = r => clamp((r - MIN_R) / (MAX_R - MIN_R), 0, 1.15);

  function makePlayer(team, slot, rating, card) {
    const k = norm01(rating);
    return {
      team, slot, gk: slot === 0, r: rating, card, x: 0, y: 0, vx: 0, vy: 0, face: team === 0 ? 0 : Math.PI,
      speed: 1.0 + k * 0.9, power: 5 + k * 3.2, err: Math.max(0.03, 0.24 - k * 0.19), tackle: 0.01 + k * 0.022, reach: 11 + k * 11,
      cd: 0, lunge: 0, hold: 0,
    };
  }
  function homeOf(p) {
    const [hx, hy] = HOME[p.slot];
    let fx = hx, fy = hy;
    if (!p.gk) {
      const bf = (M.ball.x - FX0) / (FX1 - FX0);   // onde a bola está (0 = gol da esquerda)
      const mine = p.team === 0 ? bf : 1 - bf;
      fx += (mine - 0.5) * 0.4;
      const attacking = M.ball.owner && M.ball.owner.team === p.team;
      if (attacking) fx += p.slot >= 3 ? 0.18 : 0.08;
      fy = lerp(fy, (M.ball.y - FY0) / (FY1 - FY0), 0.25);
    }
    fx = clamp(fx, 0.02, 0.95);
    const x = p.team === 0 ? FX0 + fx * (FX1 - FX0) : FX1 - fx * (FX1 - FX0);
    return { x, y: FY0 + fy * (FY1 - FY0) };
  }

  function startMatch() {
    const myOvr = teamOvr();
    const opp = clamp(myOvr + Math.floor(Math.random() * 11) - 4, MIN_R, MAX_R);
    const players = [];
    data.team.forEach((id, i) => { const c = cardById(id); players.push(makePlayer(0, i, effR(c, i), c)); });
    for (let i = 0; i < 5; i++) players.push(makePlayer(1, i, clamp(opp + Math.floor(Math.random() * 9) - 4, MIN_R, MAX_R), null));
    M = { players, ball: { x: W / 2, y: MIDY, vx: 0, vy: 0, owner: null }, score: [0, 0], t: 0, opp: pick(CLUBS), oppOvr: opp,
      me: null, pause: 0, msg: '', msgT: 0, charge: 0, over: false, switchCd: 0 };
    kickoff(0);
    document.body.classList.add('in-match');
    beep(880, 0.3, 'triangle');
  }
  function kickoff(team) {
    for (const p of M.players) { const h = homeOf(p); p.x = h.x; p.y = h.y; p.vx = p.vy = 0; p.cd = 0; }
    // Volta pro meio: os atacantes do time que sai ficam perto da bola
    for (const p of M.players) {
      const bf = p.team === 0 ? HOME[p.slot][0] * 0.8 : HOME[p.slot][0] * 0.8;
      p.x = p.team === 0 ? FX0 + bf * (W / 2 - FX0) : FX1 - bf * (FX1 - W / 2);
      p.y = FY0 + HOME[p.slot][1] * (FY1 - FY0);
    }
    const b = M.ball;
    b.x = W / 2; b.y = MIDY; b.vx = b.vy = 0;
    const taker = M.players.find(p => p.team === team && p.slot === 3);
    taker.x = W / 2 + (team === 0 ? -8 : 8); taker.y = MIDY;
    b.owner = taker;
    M.me = M.players.find(p => p.team === 0 && p.slot === 3);
    M.pause = 50;
  }

  // Controles
  const keys = {};
  const joy = { x: 0, y: 0 };
  const btn = { pass: false, shoot: false, sprint: false };
  const pressed = { pass: false, shoot: false };
  const KEYS = { KeyJ: 'pass', KeyK: 'shoot', Space: 'shoot', ShiftLeft: 'sprint', ShiftRight: 'sprint', KeyL: 'sprint' };
  addEventListener('keydown', e => {
    keys[e.code] = true;
    const b = KEYS[e.code];
    if (b && M) { e.preventDefault(); if (!btn[b] && b !== 'sprint') pressed[b] = true; btn[b] = true; }
    if (e.code.startsWith('Arrow') && M) e.preventDefault();
  });
  addEventListener('keyup', e => { keys[e.code] = false; const b = KEYS[e.code]; if (b) btn[b] = false; });
  addEventListener('blur', () => { for (const k in keys) keys[k] = false; for (const k in btn) btn[k] = false; });
  function inputDir() {
    let x = (keys.ArrowRight || keys.KeyD ? 1 : 0) - (keys.ArrowLeft || keys.KeyA ? 1 : 0);
    let y = (keys.ArrowDown || keys.KeyS ? 1 : 0) - (keys.ArrowUp || keys.KeyW ? 1 : 0);
    if (joy.x || joy.y) { x = joy.x; y = joy.y; }
    const l = Math.hypot(x, y);
    return l > 1 ? { x: x / l, y: y / l } : { x, y };
  }
  // Celular: joystick na esquerda e botões na direita
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (isTouch) document.body.classList.add('touch');
  const stick = $('stick'), knob = $('knob');
  let stickId = null;
  function stickMove(t) {
    const r = stick.getBoundingClientRect();
    let dx = t.clientX - (r.left + r.width / 2), dy = t.clientY - (r.top + r.height / 2);
    const l = Math.hypot(dx, dy), max = r.width / 2 - 10;
    if (l > max) { dx = dx / l * max; dy = dy / l * max; }
    joy.x = dx / max; joy.y = dy / max;
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
  }
  stick.addEventListener('touchstart', e => { e.preventDefault(); const t = e.changedTouches[0]; stickId = t.identifier; stickMove(t); }, { passive: false });
  stick.addEventListener('touchmove', e => { e.preventDefault(); for (const t of e.changedTouches) if (t.identifier === stickId) stickMove(t); }, { passive: false });
  const stickEnd = e => { for (const t of e.changedTouches) if (t.identifier === stickId) { stickId = null; joy.x = joy.y = 0; knob.style.transform = ''; } };
  stick.addEventListener('touchend', stickEnd); stick.addEventListener('touchcancel', stickEnd);
  for (const [id, b] of [['b-pass', 'pass'], ['b-shoot', 'shoot'], ['b-sprint', 'sprint']]) {
    const el = $(id);
    el.addEventListener('touchstart', e => { e.preventDefault(); el.classList.add('on'); if (b !== 'sprint') pressed[b] = true; btn[b] = true; }, { passive: false });
    const end = e => { e.preventDefault(); el.classList.remove('on'); btn[b] = false; };
    el.addEventListener('touchend', end, { passive: false }); el.addEventListener('touchcancel', end, { passive: false });
  }

  // Sair da partida (toca duas vezes)
  $('pause-btn').addEventListener('click', () => {
    const b = $('pause-btn');
    if (b.dataset.armed !== '1') { b.dataset.armed = '1'; b.textContent = 'SAIR MESMO?'; setTimeout(() => { b.dataset.armed = ''; b.textContent = 'SAIR'; }, 3000); return; }
    b.dataset.armed = ''; b.textContent = 'SAIR';
    M = null;
    document.body.classList.remove('in-match');
    show('main');
  });

  function moveTo(p, tx, ty, fast) {
    const dx = tx - p.x, dy = ty - p.y, l = Math.hypot(dx, dy);
    const sp = p.speed * (fast ? 1.12 : 0.85);
    if (l < 2) { p.vx *= 0.7; p.vy *= 0.7; return; }
    p.vx = lerp(p.vx, dx / l * Math.min(sp, l), 0.25);
    p.vy = lerp(p.vy, dy / l * Math.min(sp, l), 0.25);
  }
  const goalX = team => team === 0 ? FX1 : FX0;   // gol que o time ataca

  function kick(p, tx, ty, speed, err) {
    const b = M.ball;
    let a = Math.atan2(ty - b.y, tx - b.x) + (Math.random() - 0.5) * 2 * err;
    b.vx = Math.cos(a) * speed; b.vy = Math.sin(a) * speed;
    b.owner = null;
    p.cd = 18;
  }
  function shoot(p, aimY, charge) {
    const gx = goalX(p.team);
    const ty = clamp(MIDY + aimY * (GOAL_H / 2 - 6), GY0 + 4, GY1 - 4);
    kick(p, gx + (p.team === 0 ? 10 : -10), ty, p.power * (0.65 + 0.6 * charge), p.err * (0.7 + charge * 0.6));
    beep(220, 0.12, 'square');
  }
  // Passe pro companheiro que está mais na direção que você aponta
  function pass(p, dir) {
    const mates = M.players.filter(q => q.team === p.team && q !== p && !q.gk);
    if (!mates.length) return;
    const fa = dir && (dir.x || dir.y) ? Math.atan2(dir.y, dir.x) : p.face;
    let best = null, bs = -1e9;
    for (const q of mates) {
      const d = dist(p, q), a = Math.atan2(q.y - p.y, q.x - p.x);
      let da = Math.abs(a - fa); if (da > Math.PI) da = 2 * Math.PI - da;
      const s = -da * 60 - Math.abs(d - 90) * 0.3 + (p.team === 0 ? q.x - p.x : p.x - q.x) * 0.1;
      if (s > bs) { bs = s; best = q; }
    }
    const d = dist(p, best);
    kick(p, best.x + best.vx * 10, best.y + best.vy * 10, clamp(2.6 + d / 40, 3, 6.5), p.err * 0.5);
    beep(500, 0.05, 'triangle');
    return best;
  }

  function updateMatch() {
    const b = M.ball;
    if (M.msgT > 0) M.msgT--;
    if (M.over) { M.overT++; if (M.overT > 200) endMatch(); return; }
    if (M.pause > 0) { M.pause--; return; }
    M.t++;
    if (M.t >= MATCH_FRAMES) { M.over = true; M.overT = 0; beep(600, 0.6, 'triangle'); return; }

    // Quem você controla: quem tem a bola do seu time, ou o mais perto da bola
    if (b.owner && b.owner.team === 0 && !b.owner.gk) M.me = b.owner;
    else if (!b.owner || b.owner.team === 1) {
      if (M.switchCd > 0) M.switchCd--;
      else {
        const near = M.players.filter(p => p.team === 0 && !p.gk).sort((p, q) => dist(p, b) - dist(q, b))[0];
        if (near !== M.me && dist(near, b) + 25 < dist(M.me, b)) { M.me = near; M.switchCd = 20; }
      }
    }
    const dir = inputDir();
    const me = M.me;

    for (const p of M.players) {
      if (p.cd > 0) p.cd--;
      if (p.lunge > 0) p.lunge--;
      if (p === me) {
        const sp = me.speed * (btn.sprint ? 1.45 : 1) * (me.lunge > 0 ? 1.8 : 1);
        me.vx = lerp(me.vx, dir.x * sp, 0.3); me.vy = lerp(me.vy, dir.y * sp, 0.3);
        continue;
      }
      if (p.gk) {
        // Goleiro: fica na frente do gol acompanhando a bola
        const gx = p.team === 0 ? FX0 + 8 : FX1 - 8;
        if (b.owner === p) {
          p.hold++;
          if (p.hold > 45) { p.hold = 0; pass(p, { x: p.team === 0 ? 1 : -1, y: Math.random() - 0.5 }); }
          continue;
        }
        moveTo(p, gx + (p.team === 0 ? 1 : -1) * clamp(Math.abs(b.x - gx) * 0.08, 0, 14), clamp(b.y, GY0 - 4, GY1 + 4), true);
        continue;
      }
      if (b.owner === p) {
        // Computador com a bola: vai pro gol, chuta perto, passa se estiver marcado
        const gx = goalX(p.team);
        const tgt = { x: gx, y: MIDY + Math.sin(M.t / 40 + p.slot) * 40 };
        const foe = M.players.filter(q => q.team !== p.team).sort((q, s) => dist(q, p) - dist(s, p))[0];
        if (foe && dist(foe, p) < 28) tgt.y += (p.y < foe.y ? -1 : 1) * 40;   // drible pro lado
        moveTo(p, tgt.x, clamp(tgt.y, FY0 + 10, FY1 - 10), dist(foe, p) < 40);
        const toGoal = Math.abs(gx - p.x);
        if (p.cd === 0 && (toGoal < 110 && Math.random() < 0.02 || toGoal < 55)) shoot(p, (Math.random() - 0.5) * 1.6, 0.3 + Math.random() * 0.5);
        else if (p.cd === 0 && foe && dist(foe, p) < 18 && Math.random() < 0.04) pass(p, null);
        continue;
      }
      // Sem a bola
      const chaser = M.players.filter(q => q.team === p.team && !q.gk && q !== me).sort((q, s) => dist(q, b) - dist(s, b))[0];
      const theyHave = b.owner && b.owner.team !== p.team;
      if (p.team === 1 && p === chaser && (!b.owner || theyHave)) moveTo(p, b.x, b.y, true);
      else if (p.team === 1 && !b.owner && dist(p, b) < 50) moveTo(p, b.x, b.y, true);
      // Seu time: o companheiro mais perto ajuda a marcar quando o outro time chega perto do seu gol
      else if (p.team === 0 && p === chaser && theyHave && b.x < W / 2 + 40) moveTo(p, b.x, b.y, true);
      else if (p.team === 0 && p === chaser && !b.owner && dist(p, b) < 60) moveTo(p, b.x, b.y, true);
      else { const h = homeOf(p); moveTo(p, h.x, h.y, false); }
    }

    // Botões de quem você controla
    if (b.owner === me) {
      if (pressed.pass) { const to = pass(me, dir); if (to) { M.me = to; M.switchCd = 30; } }
      if (btn.shoot) M.charge = Math.min(1, M.charge + 1 / 40);
      else if (M.charge > 0) { shoot(me, dir.y, M.charge); M.charge = 0; }
    } else {
      M.charge = 0;
      if (pressed.shoot && me.lunge <= 0) { me.lunge = 14; beep(160, 0.06, 'square'); }   // carrinho: corre pra roubar
      if (pressed.pass) {   // troca pro jogador mais perto da bola
        const near = M.players.filter(p => p.team === 0 && !p.gk && p !== me).sort((p, q) => dist(p, b) - dist(q, b))[0];
        if (near) { M.me = near; M.switchCd = 30; }
      }
    }
    pressed.pass = pressed.shoot = false;

    // Movimento
    for (const p of M.players) {
      p.x = clamp(p.x + p.vx, FX0 + 4, FX1 - 4); p.y = clamp(p.y + p.vy, FY0 + 4, FY1 - 4);
      if (Math.hypot(p.vx, p.vy) > 0.2) p.face = Math.atan2(p.vy, p.vx);
    }
    // A bola vai colada no pé de quem tem
    if (b.owner) {
      const o = b.owner;
      b.x = o.x + Math.cos(o.face) * 7; b.y = o.y + Math.sin(o.face) * 7; b.vx = o.vx; b.vy = o.vy;
      // Roubada de bola
      for (const p of M.players) {
        if (p.team === o.team || p.cd > 0 || dist(p, o) > (p.lunge > 0 ? 13 : 10)) continue;
        const chance = (p.tackle * (p.lunge > 0 ? 6 : 1)) * (1.2 - norm01(o.r) * 0.5);
        if (Math.random() < chance) { b.owner = p; o.cd = 30; p.lunge = 0; beep(300, 0.05, 'square'); break; }
      }
    } else {
      b.x += b.vx; b.y += b.vy;
      b.vx *= 0.975; b.vy *= 0.975;
      // Gol!
      if (b.x < FX0 && b.y > GY0 && b.y < GY1) return goal(1);
      if (b.x > FX1 && b.y > GY0 && b.y < GY1) return goal(0);
      // Bate na parede (campo fechado, tipo futsal)
      if (b.x < FX0 + 2 || b.x > FX1 - 2) { b.vx *= -0.6; b.x = clamp(b.x, FX0 + 2, FX1 - 2); }
      if (b.y < FY0 + 2 || b.y > FY1 - 2) { b.vy *= -0.6; b.y = clamp(b.y, FY0 + 2, FY1 - 2); }
      const sp = Math.hypot(b.vx, b.vy);
      // Goleiro defende
      for (const p of M.players) {
        if (!p.gk || p.cd > 0 || dist(p, b) > p.reach) continue;
        const toward = p.team === 0 ? b.vx < 0 : b.vx > 0;
        if (!toward && sp > 1) continue;
        const save = clamp(0.5 + norm01(p.r) * 0.45 - (sp - 6) * 0.06, 0.15, 0.97);
        if (Math.random() < save) { b.owner = p; p.hold = 0; b.vx = b.vy = 0; M.msg = 'DEFENDEU!'; M.msgT = 50; beep(400, 0.1, 'triangle'); }
        else p.cd = 20;
        break;
      }
      // Pega a bola solta
      if (!b.owner) {
        let best = null, bd = 9;
        for (const p of M.players) {
          if (p.cd > 0 || p.gk) continue;
          const d = dist(p, b);
          if (d < bd && (sp < 5 || Math.random() < 0.3)) { bd = d; best = p; }
        }
        if (best) { b.owner = best; best.cd = 0; }
      }
    }
  }

  function goal(team) {
    M.score[team]++;
    M.msg = team === 0 ? 'GOOOOL!!!' : 'Gol do ' + M.opp;
    M.msgT = 110;
    beep(team === 0 ? 880 : 200, 0.5, 'triangle');
    if (team === 0) { setTimeout(() => beep(1046, 0.4, 'triangle'), 180); setTimeout(() => beep(1318, 0.6, 'triangle'), 360); }
    kickoff(team === 0 ? 1 : 0);
    M.pause = 110;
  }

  function endMatch() {
    const [a, c] = M.score;
    const res = a > c ? 'win' : a === c ? 'draw' : 'loss';
    const prize = { win: 500, draw: 250, loss: 100 }[res] + a * 50;
    data.coins += prize; data.played++; if (res === 'win') data.wins++;
    save();
    $('main-msg').textContent = (res === 'win' ? '🏆 Vitória' : res === 'draw' ? '🤝 Empate' : '😢 Derrota') + ` ${a} x ${c} contra ${M.opp}! Você ganhou 🪙 ${prize}`;
    M = null;
    document.body.classList.remove('in-match');
    show('main');
  }

  // ── Desenho ───────────────────────────────────────────────
  function drawField() {
    for (let i = 0; i < 12; i++) { ctx.fillStyle = i % 2 ? '#2a8a3a' : '#25803a'; ctx.fillRect(FX0 + i * (FX1 - FX0) / 12, FY0, (FX1 - FX0) / 12 + 1, FY1 - FY0); }
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 2;
    ctx.strokeRect(FX0, FY0, FX1 - FX0, FY1 - FY0);
    ctx.beginPath(); ctx.moveTo(W / 2, FY0); ctx.lineTo(W / 2, FY1); ctx.stroke();
    ctx.beginPath(); ctx.arc(W / 2, MIDY, 30, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeRect(FX0, MIDY - 60, 50, 120); ctx.strokeRect(FX1 - 50, MIDY - 60, 50, 120);
    // Gols
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(FX0 - 12, GY0, 12, GOAL_H); ctx.fillRect(FX1, GY0, 12, GOAL_H);
    ctx.strokeStyle = '#fff'; ctx.strokeRect(FX0 - 12, GY0, 12, GOAL_H); ctx.strokeRect(FX1, GY0, 12, GOAL_H);
  }
  const COLORS = [{ body: '#2a6aff', dark: '#173a8a', gk: '#ffd23a' }, { body: '#e83a3a', dark: '#8a1a1a', gk: '#7ddf64' }];
  function drawPlayer(p) {
    const c = COLORS[p.team];
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(p.x, p.y + 6, 6, 2.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = p.gk ? c.gk : c.body; ctx.strokeStyle = c.dark; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffd8a8'; ctx.beginPath(); ctx.arc(p.x + Math.cos(p.face) * 2, p.y + Math.sin(p.face) * 2, 3, 0, Math.PI * 2); ctx.fill();
    if (p === M.me) {
      ctx.fillStyle = '#ffe94a';
      ctx.beginPath(); ctx.moveTo(p.x, p.y - 10); ctx.lineTo(p.x - 4, p.y - 16); ctx.lineTo(p.x + 4, p.y - 16); ctx.fill();
      if (p.card) { ctx.font = 'bold 8px Arial'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText(p.card.nome.split(' ')[0] + ' ' + p.r, p.x, p.y - 19); }
      if (M.charge > 0) { ctx.fillStyle = '#000'; ctx.fillRect(p.x - 10, p.y + 9, 20, 3); ctx.fillStyle = M.charge > 0.8 ? '#ff4a4a' : '#ffd23a'; ctx.fillRect(p.x - 10, p.y + 9, 20 * M.charge, 3); }
    }
  }
  function draw() {
    ctx.fillStyle = '#0b1a2e'; ctx.fillRect(0, 0, W, H);
    if (!M) return;
    drawField();
    const b = M.ball;
    for (const p of M.players) drawPlayer(p);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(b.x + 1, b.y + 3, 3, 1.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(b.x, b.y, 3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // Placar
    const min = Math.min(90, Math.floor(M.t / MATCH_FRAMES * 90));
    ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(W / 2 - 120, 4, 240, 24);
    ctx.font = 'bold 13px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#9fc8ff'; ctx.fillText('VOCÊ', W / 2 - 75, 16);
    ctx.fillStyle = '#fff'; ctx.fillText(M.score[0] + '  x  ' + M.score[1], W / 2, 16);
    ctx.fillStyle = '#ffb0b0'; ctx.font = 'bold 10px Arial'; ctx.fillText(M.opp, W / 2 + 75, 16);
    ctx.fillStyle = '#ffd23a'; ctx.font = 'bold 11px Arial'; ctx.fillText(min + "'", W / 2 + 140, 16);
    if (M.msgT > 0 || M.over) {
      const txt = M.over ? 'FIM DE JOGO! ' + M.score[0] + ' x ' + M.score[1] : M.msg;
      ctx.font = 'bold 30px Arial'; ctx.lineWidth = 5; ctx.strokeStyle = '#000';
      ctx.strokeText(txt, W / 2, H / 2 - 20); ctx.fillStyle = M.msg.startsWith('GOO') || M.over ? '#ffd23a' : '#fff'; ctx.fillText(txt, W / 2, H / 2 - 20);
    }
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  }

  $('go-play').addEventListener('click', startMatch);

  // Passo fixo de 60 por segundo
  let last = performance.now(), acc = 0;
  function loop(now) {
    acc += Math.min(100, now - last); last = now;
    while (acc >= 1000 / 60) { if (M) updateMatch(); acc -= 1000 / 60; }
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  load();
  show('main');

  // Só pra testar pelo console: abrir com #debug
  if (location.hash === '#debug') window.fc = { get M() { return M; }, get data() { return data; }, startMatch, save, render, updateMatch, keys, btn, pressed };
})();
