// Dominic FC — futebol no estilo FC Mobile: cartas de jogadores (nota 60 a 130), pacotes, meu time e partida 7 contra 7
(() => {
  const $ = id => document.getElementById(id);
  const canvas = $('game');
  const ctx = canvas.getContext('2d');
  let W = 480;   // a largura acompanha a tela (celular deitado é mais comprido); a altura é fixa
  const H = 300;

  // Perfil: ?perfil=teste guarda tudo separado (aba de teste)
  const PERFIL = (new URLSearchParams(location.search).get('perfil') || '').replace(/[^a-z0-9]/gi, '').slice(0, 20);
  const KEY = 'dominicFC' + (PERFIL ? ':' + PERFIL : '');
  if (PERFIL) $('back-link').href = '../index.html?perfil=' + PERFIL;

  // ── Cartas ────────────────────────────────────────────────
  const FACES = ['😀', '😎', '🤠', '🧐', '😤', '🥶', '😄', '🦁', '🐯', '🦊', '🐺', '🤖', '👽', '🥷', '🧙', '🐲'];
  // Posições (sigla e nome), igual no FC
  const POSITIONS = [['PD', 'Ponta-direita'], ['PE', 'Ponta-esquerda'], ['ATA', 'Atacante'], ['ZAG', 'Zagueiro'],
    ['LE', 'Lateral esquerdo'], ['LD', 'Lateral direito'], ['GOL', 'Goleiro']];
  const POS = POSITIONS.map(p => p[0]);
  const MIN_R = 60, MAX_R = 130;
  // Acima de 130 é ULTRA RARA (só as cartas especiais, não sai em pacote)
  const TIERS = [[131, 'ultra', 'ULTRA RARA'], [120, 'lenda', 'LENDA'], [105, 'elite', 'ELITE'], [90, 'ouro', 'OURO'], [75, 'prata', 'PRATA'], [0, 'bronze', 'BRONZE']];
  const tierOf = r => TIERS.find(t => r >= t[0]);
  const pick = a => a[Math.floor(Math.random() * a.length)];

  const SPECIALS = [];   // álbum de todo mundo: vem do album.js quando ele está no site (desligado por enquanto)
  const ALBUM = [['brasil', '🇧🇷 BRASIL'], ['argentina', '🇦🇷 ARGENTINA'], ['portugal', '🇵🇹 PORTUGAL'], ['franca', '🇫🇷 FRANÇA'],
    ['inglaterra', '🏴 INGLATERRA'], ['espanha', '🇪🇸 ESPANHA'], ['lendas', '🏆 LENDAS'], ['bolaouro', '🥇 BOLA DE OURO']];   // LENDAS: aposentados; BOLA DE OURO: evento
  const ALBUM_PRIZE = 1500;   // completou uma seleção: ganha moedas
  // Os craques do álbum: os do jogo e os que você adicionou (➕)
  // O mesmo jogador (mesma chave) do seu álbum vale mais que o de todo mundo (ex.: o nome de verdade, no seu)
  const allSpecials = () => {
    const mine = (data && data.custom) || [], keys = new Set(mine.map(c => c.key));
    return SPECIALS.filter(sp => !keys.has(sp.key)).concat(mine);
  };
  const BADGES = { brasil: ['🇧🇷', 'Brasil'], argentina: ['🇦🇷', 'Argentina'], portugal: ['🇵🇹', 'Portugal'], franca: ['🇫🇷', 'França'], inglaterra: ['🏴', 'Inglaterra'], espanha: ['🇪🇸', 'Espanha'], lendas: ['🏆', 'Lendas'], bolaouro: ['🥇', 'Bola de Ouro'] };
  for (const [key, nome, pos, r, face, album, time] of window.ALBUM_FC || [])
    SPECIALS.push({ key, nome, pos, r, face, album, time: time || undefined, club: BADGES[album][1], badge: BADGES[album][0] });
  // ── Evento BOLA DE OURO (novembro e dezembro): ganha 🥇 jogando e troca pelas cartas douradas ──
  const EVENTO = { fim: new Date(2026, 11, 31, 23, 59, 59).getTime() };   // 31 de dezembro de 2026
  const EVENT_CARDS = [
    { key: 'evento-bola-kane', nome: 'Harry Kane', pos: 'ATA', r: 131, face: '😀', time: 'Bola de Ouro 2026', ouro: true, preco: 50 },
    { key: 'evento-bola-kaka', nome: 'Kaká', pos: 'ATA', r: 130, face: '😄', time: 'Bola de Ouro 2007', ouro: true, preco: 30 },
    { key: 'evento-bola-ronaldo', nome: 'Ronaldo Fenômeno', pos: 'ATA', r: 131, face: '😁', time: 'Bola de Ouro 2002', ouro: true, preco: 45 },
    { key: 'evento-bola-messi', nome: 'Messi', pos: 'PD', r: 131, face: '😎', time: 'Bola de Ouro 2023', ouro: true, preco: 45 },
    { key: 'evento-bola-cr7', nome: 'Cristiano Ronaldo', pos: 'ATA', r: 131, face: '😤', time: 'Bola de Ouro 2017', ouro: true, preco: 45 },
    { key: 'evento-bola-ronaldinho', nome: 'Ronaldinho Gaúcho', pos: 'PE', r: 130, face: '😆', time: 'Bola de Ouro 2005', ouro: true, preco: 40 },
    { key: 'evento-bola-zidane', nome: 'Zidane', pos: 'ATA', r: 130, face: '🙂', time: 'Bola de Ouro 1998', ouro: true, preco: 40 },
    { key: 'evento-bola-dembele', nome: 'Dembélé', pos: 'PD', r: 130, face: '😃', time: 'Bola de Ouro 2025', ouro: true, preco: 40 },
    { key: 'evento-bola-rivaldo', nome: 'Rivaldo', pos: 'PE', r: 129, face: '😊', time: 'Bola de Ouro 1999', ouro: true, preco: 35 },
    { key: 'evento-bola-benzema', nome: 'Benzema', pos: 'ATA', r: 129, face: '😌', time: 'Bola de Ouro 2022', ouro: true, preco: 35 },
    { key: 'evento-bola-rodri', nome: 'Rodri', pos: 'ZAG', r: 129, face: '🤓', time: 'Bola de Ouro 2024', ouro: true, preco: 35 },
    { key: 'evento-bola-cannavaro', nome: 'Cannavaro', pos: 'ZAG', r: 129, face: '😏', time: 'Bola de Ouro 2006', ouro: true, preco: 35 },
    // 🥈 Segundo lugar desses anos (bola de prata)
    { key: 'evento-prata-mbappe', nome: 'Mbappé', pos: 'ATA', r: 128, face: '😁', time: '2º Bola de Ouro 2026', prata: true, preco: 30 },
    { key: 'evento-prata-yamal', nome: 'Lamine Yamal', pos: 'PD', r: 128, face: '😎', time: '2º Bola de Ouro 2025', prata: true, preco: 30 },
    { key: 'evento-prata-vini', nome: 'Vini Júnior', pos: 'PE', r: 128, face: '😃', time: '2º Bola de Ouro 2024', prata: true, preco: 30 },
    { key: 'evento-prata-haaland', nome: 'Haaland', pos: 'ATA', r: 127, face: '🤖', time: '2º Bola de Ouro 2023', prata: true, preco: 30 },
    { key: 'evento-prata-mane', nome: 'Sadio Mané', pos: 'PE', r: 127, face: '😊', time: '2º Bola de Ouro 2022', prata: true, preco: 30 },
    { key: 'evento-prata-messi', nome: 'Messi', pos: 'PD', r: 128, face: '🙂', time: '2º Bola de Ouro 2017', prata: true, preco: 30 },
    { key: 'evento-prata-cr7', nome: 'Cristiano Ronaldo', pos: 'ATA', r: 128, face: '😏', time: '2º Bola de Ouro 2007', prata: true, preco: 30 },
    { key: 'evento-prata-buffon', nome: 'Buffon', pos: 'GOL', r: 127, face: '🧤', time: '2º Bola de Ouro 2006', prata: true, preco: 30 },
    { key: 'evento-prata-lampard', nome: 'Lampard', pos: 'ATA', r: 127, face: '😄', time: '2º Bola de Ouro 2005', prata: true, preco: 30 },
    { key: 'evento-prata-robertocarlos', nome: 'Roberto Carlos', pos: 'LE', r: 128, face: '💪', time: '2º Bola de Ouro 2002', prata: true, preco: 30 },
    { key: 'evento-prata-beckham', nome: 'Beckham', pos: 'PD', r: 127, face: '😉', time: '2º Bola de Ouro 1999', prata: true, preco: 30 },
    { key: 'evento-prata-suker', nome: 'Šuker', pos: 'ATA', r: 127, face: '😌', time: '2º Bola de Ouro 1998', prata: true, preco: 30 },
    // 🥉 Terceiro lugar desses anos (bola de bronze)
    { key: 'evento-bronze-yamal', nome: 'Lamine Yamal', pos: 'PD', r: 127, face: '🤩', time: '3º Bola de Ouro 2026', bronze: true, preco: 20 },
    { key: 'evento-bronze-vitinha', nome: 'Vitinha', pos: 'PE', r: 126, face: '🙂', time: '3º Bola de Ouro 2025', bronze: true, preco: 20 },
    { key: 'evento-bronze-bellingham', nome: 'Bellingham', pos: 'ATA', r: 127, face: '😎', time: '3º Bola de Ouro 2024', bronze: true, preco: 20 },
    { key: 'evento-bronze-mbappe', nome: 'Mbappé', pos: 'ATA', r: 127, face: '😃', time: '3º Bola de Ouro 2023', bronze: true, preco: 20 },
    { key: 'evento-bronze-debruyne', nome: 'De Bruyne', pos: 'PD', r: 126, face: '🧐', time: '3º Bola de Ouro 2022', bronze: true, preco: 20 },
    { key: 'evento-bronze-neymar', nome: 'Neymar', pos: 'PE', r: 127, face: '😜', time: '3º Bola de Ouro 2017', bronze: true, preco: 20 },
    { key: 'evento-bronze-messi', nome: 'Messi', pos: 'PD', r: 127, face: '😊', time: '3º Bola de Ouro 2007', bronze: true, preco: 20 },
    { key: 'evento-bronze-henry', nome: 'Thierry Henry', pos: 'ATA', r: 127, face: '😏', time: '3º Bola de Ouro 2006', bronze: true, preco: 20 },
    { key: 'evento-bronze-gerrard', nome: 'Gerrard', pos: 'ATA', r: 126, face: '💪', time: '3º Bola de Ouro 2005', bronze: true, preco: 20 },
    { key: 'evento-bronze-kahn', nome: 'Oliver Kahn', pos: 'GOL', r: 126, face: '😤', time: '3º Bola de Ouro 2002', bronze: true, preco: 20 },
    { key: 'evento-bronze-shevchenko', nome: 'Shevchenko', pos: 'ATA', r: 126, face: '😄', time: '3º Bola de Ouro 1999', bronze: true, preco: 20 },
    { key: 'evento-bronze-ronaldo', nome: 'Ronaldo Fenômeno', pos: 'ATA', r: 127, face: '😁', time: '3º Bola de Ouro 1998', bronze: true, preco: 20 },
  ];
  for (const ec of EVENT_CARDS) SPECIALS.push(Object.assign({ album: 'bolaouro', club: 'Bola de Ouro', badge: ec.prata ? '🥈' : ec.bronze ? '🥉' : '🥇', evento: true }, ec));
  const eventoAtivo = () => Date.now() < EVENTO.fim;
  // Nome que aparece: o que você escreveu no ✏️, ou o da carta
  const nameOf = c => (data.renames && data.renames[c.key || c.id]) || c.nome;
  let data;
  // Conta de iniciante: começa só com 500 moedas e nenhuma carta
  // (táticas e times já vêm vazios, senão vinham os da conta pela nuvem)
  const jogoNovo = () => ({ coins: 500, cards: [], team: SLOTS.map(() => null), next: 1, played: 0, wins: 0, semFalsas: true,
    tactics: [0, 1, 2].map(() => ({ nome: '', team: SLOTS.map(() => null) })), tactic: 0, clubs: [], renames: {}, myClub: '' });

  function load() {
    loading = true;
    try { data = JSON.parse(localStorage.getItem(KEY)); } catch (e) { data = null; }
    if (!data || !Array.isArray(data.cards)) {
      data = jogoNovo();
      save();
    }
    // Sem cartas inventadas: só ficam as cartas dos jogadores do álbum
    if (!data.semFalsas) {
      data.cards = data.cards.filter(c => c.key || c.criada);
      data.semFalsas = true;
    }
    // Time de antes (5 vagas): cada um vai pra vaga da posição dele, ou pra primeira livre
    if (!data.team || data.team.length !== SLOTS.length) {
      const ids = (data.team || []).filter(id => cardById(id));
      data.team = SLOTS.map(() => null);
      for (const id of ids) {
        const c = cardById(id);
        let i = SLOTS.findIndex((sl, k) => sl.pos === c.pos && !data.team[k]);
        if (i < 0) i = data.team.findIndex((x, k) => !x && !SLOTS[k].gk);
        if (i >= 0) data.team[i] = id;
      }
    }
    data.team = data.team.map(id => cardById(id) ? id : null);
    const novos = takeNovos();
    save();
    loading = false;
    if (novos) save();   // chegaram jogadores: isso é mudança de verdade
  }
  // Jogadores que chegaram de fora (guardados em <KEY>:novos): entram no álbum sem atrapalhar quem está jogando
  function takeNovos() {
    let novos;
    try { novos = JSON.parse(localStorage.getItem(KEY + ':novos')); } catch (e) { novos = null; }
    if (!Array.isArray(novos) || !novos.length) return false;
    data.custom = data.custom || [];
    const have = new Set(data.custom.map(c => c.key));
    for (const c of novos) if (c && c.key && !have.has(c.key)) data.custom.push(c);
    try { localStorage.removeItem(KEY + ':novos'); } catch (e) { /* ok */ }
    return true;
  }
  // Chegaram jogadores novos enquanto o jogo está aberto (outra aba): junta na hora
  addEventListener('storage', e => { if (e.key === KEY + ':novos' && e.newValue && takeNovos()) { save(); render(); } });
  let loading = false, synced = false;
  function save() {
    if (data.tactics && data.tactics[data.tactic]) data.tactics[data.tactic].team = data.team;
    // Só conta como mudança depois de ver a versão da conta (senão um aparelho novo passava por cima)
    if (!loading && synced) { data.updatedAt = Date.now(); schedulePush(); }
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* sem salvar */ }
  }

  // ── Salvo na conta (a mesma da Aventura Elemental): aparece igual no celular e no computador ──
  const ACCT_KEY = 'aventuraConta' + (PERFIL ? ':' + PERFIL : '');
  function conta() { try { const m = JSON.parse(localStorage.getItem(ACCT_KEY)); return m && m.user; } catch (e) { return null; } }
  async function contaApi(body) {
    const r = await fetch('/api/conta/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    return r.ok ? r.json() : null;
  }
  function setCloud(txt) { const el = $('cloud'); if (el) el.textContent = txt; }
  let pushT = null;
  function schedulePush() {
    clearTimeout(pushT);
    pushT = setTimeout(push, 1500);
  }
  async function push() {
    const u = conta();
    if (!u) return;
    if (!data.updatedAt) { data.updatedAt = Date.now(); try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* ok */ } }
    setCloud('☁️ salvando...');
    const r = await contaApi({ action: 'salvarFC', email: u.email, dados: data }).catch(() => null);
    setCloud(r ? '☁️ salvo na conta ' + u.nome : '☁️ não deu pra salvar agora');
  }
  // Ao abrir: se a conta tem uma versão mais nova (de outro aparelho), usa ela
  // Junta dois saves sem perder jogador do álbum: fica a versão mais nova de cada um,
  // menos os que foram tirados (removedKeys). Times e táticas vêm do outro se faltarem
  function mergeFC(base, other) {
    if (!other) return base;
    const removed = new Set([...(base.removedKeys || []), ...(other.removedKeys || [])]);
    const byKey = new Map();
    for (const c of other.custom || []) byKey.set(c.key, c);
    for (const c of base.custom || []) byKey.set(c.key, c);
    base.custom = [...byKey.values()].filter(c => !removed.has(c.key));
    base.removedKeys = [...removed];
    for (const k of ['clubs', 'tactics', 'tactic', 'renames', 'myClub']) if (base[k] == null && other[k] != null) base[k] = other[k];
    return base;
  }
  async function syncFC() {
    const u = conta();
    if (!u) { synced = true; setCloud('☁️ entre na Aventura Elemental com seu e-mail pra salvar online'); return; }
    const r = await contaApi({ action: 'carregarFC', email: u.email }).catch(() => null);
    if (!r) { setCloud('☁️ sem internet agora'); return; }
    const remote = r.dados;
    synced = true;
    // O que está guardado no aparelho é de outra conta (trocou de conta), ou de quem jogou sem conta
    // e a conta já tem jogo: não mistura nada. Usa o da conta, ou começa do zero se a conta não tem jogo
    if (data.dono !== u.email && (data.dono || remote)) {
      const meu = remote || jogoNovo();
      meu.dono = u.email;
      try { localStorage.setItem(KEY, JSON.stringify(meu)); } catch (e) { /* ok */ }
      load(); fillClubList(); render();
      if (remote) setCloud('☁️ carregado da conta ' + u.nome); else save();
      return;
    }
    data.dono = u.email;
    if (remote && (remote.updatedAt || 0) > (data.updatedAt || 0)) {
      const merged = mergeFC(remote, data);
      merged.dono = u.email;
      try { localStorage.setItem(KEY, JSON.stringify(merged)); } catch (e) { /* ok */ }
      load(); fillClubList(); render();
      setCloud('☁️ carregado da conta ' + u.nome);
    } else if (!remote || (data.updatedAt || 0) > (remote.updatedAt || 0)) { mergeFC(data, remote); save(); push(); }
    else setCloud('☁️ salvo na conta ' + u.nome);
  }
  const cardById = id => data.cards.find(c => c.id === id);

  // Time de 7: goleiro, laterais e zagueiro atrás; pontas e atacante na frente.
  // home = lugar no campo (x e y de 0 a 1, pra quem ataca pra direita; y pequeno = lado esquerdo)
  const SLOTS = [
    { label: 'GOL', pos: 'GOL', gk: true, home: [0.02, 0.5] },
    { label: 'LD', pos: 'LD', home: [0.24, 0.82] },
    { label: 'ZAG', pos: 'ZAG', home: [0.17, 0.5] },
    { label: 'LE', pos: 'LE', home: [0.24, 0.18] },
    { label: 'PD', pos: 'PD', att: true, home: [0.6, 0.84] },
    { label: 'ATA', pos: 'ATA', att: true, home: [0.7, 0.5] },
    { label: 'PE', pos: 'PE', att: true, home: [0.6, 0.16] },
  ];
  // Na posição certa joga 100%; fora dela joga menos (goleiro na linha ou de linha no gol, bem menos)
  const effR = (card, slot) => !card ? 40 : Math.round(card.r * (card.pos === SLOTS[slot].pos ? 1 : SLOTS[slot].gk || card.pos === 'GOL' ? 0.7 : 0.9));
  const teamOvr = () => Math.round(data.team.reduce((s, id, i) => s + effR(cardById(id), i), 0) / SLOTS.length);

  function cardEl(c, extra) {
    // o jogador do álbum manda (nome, rosto, time, nota): o seu álbum primeiro, depois o de todo mundo
    const al = c.key && data && ((data.custom || []).find(x => x.key === c.key) || SPECIALS.find(x => x.key === c.key));
    if (al) c = Object.assign({}, c, { nome: al.nome, face: al.face, time: al.time, pos: al.pos, r: al.r });
    const t = tierOf(c.r);
    const d = document.createElement('div');
    d.className = 'card t-' + t[1] + (extra ? ' ' + extra : '');
    d.innerHTML = '<div class="rt"></div><div class="ps"></div><div class="badge"></div><div class="face"></div><div><div class="nm"></div><div class="tier"></div></div>';
    if (c.club) { d.classList.add('special'); d.querySelector('.badge').textContent = c.badge || ''; }
    d.querySelector('.rt').textContent = c.r;
    d.querySelector('.ps').textContent = c.pos;
    d.querySelector('.face').textContent = c.face;
    const ev = c.key && SPECIALS.find(x => x.key === c.key && (x.ouro || x.prata || x.bronze));
    if (c.ouro || c.prata || c.bronze || ev) {   // carta do evento: bola de ouro (1º), de prata (2º) ou de bronze (3º) embaixo do rosto
      const lugar = (c.prata || (ev && ev.prata)) ? 'prata' : (c.bronze || (ev && ev.bronze)) ? 'bronze' : 'ouro';
      d.classList.add('t-bola' + lugar);
      d.querySelector('.face').appendChild(Object.assign(document.createElement('div'), { className: { ouro: 'gold-ball', prata: 'silver-ball', bronze: 'bronze-ball' }[lugar], textContent: '⚽' }));
    }
    d.querySelector('.nm').textContent = nameOf(c);
    d.querySelector('.tier').textContent = c.time || c.club || t[2];
    const cl = c.time && findClub(c.time);
    if (cl && cl.logo) { d.querySelector('.tier').textContent = ''; d.querySelector('.tier').appendChild(logoImg(cl, 'card-logo')); }
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

  // ADM: quem tem o nome Dominic. Pacotes de graça e coroa
  const isAdm = () => (data.nome || '').trim().toLowerCase() === 'dominic';
  // ADM tem todas as cartas do álbum: o que faltar entra nas suas cartas
  function admGetsAll() {
    if (!isAdm()) return;
    const have = new Set(data.cards.map(c => c.key).filter(Boolean));
    let got = false;
    for (const sp of allSpecials()) if (!have.has(sp.key)) {
      data.cards.push({ id: data.next++, key: sp.key, nome: sp.nome, pos: sp.pos, r: sp.r, face: sp.face, club: sp.club, badge: sp.badge, time: sp.time });
      got = true;
    }
    if (got) save();
  }
  function renderDiff() {
    const cur = data.diff || (isTouch ? 'celular' : 'computador');
    document.querySelectorAll('.diff-btn').forEach(b => b.classList.toggle('on', b.dataset.diff === cur));
  }
  document.querySelectorAll('.diff-btn').forEach(b => b.addEventListener('click', () => { data.diff = b.dataset.diff; save(); renderDiff(); beep(b.dataset.diff === 'celular' ? 660 : 520, 0.08, 'triangle'); }));
  function render() {
    admGetsAll();
    renderDiff();
    document.body.classList.toggle('adm', isAdm());
    $('name-tag').textContent = data.nome ? (isAdm() ? '👑 ' : '👤 ') + data.nome : '✍️ Seu nome';
    $('coins').textContent = isAdm() ? '∞' : data.coins;
    $('ovr').textContent = $('ovr2').textContent = teamOvr();
    $('n-cards').textContent = data.cards.length + ' cartas';
    if (page === 'team') { renderTactics(); renderTeam(); renderClubs(); }
    if (page === 'packs') renderPacks();
    if (page === 'cards') renderCards();
    if (page === 'album') renderAlbum();
    if (page === 'evento') renderEvento();
    $('evento-tile').style.display = eventoAtivo() ? '' : 'none';
    $('evento-tempo').textContent = tempoEvento();
    if (page === 'name') { $('name-input').value = data.nome || ''; $('name-msg').textContent = ''; }
  }

  function renderTeam() {
    const pitch = $('pitch');
    pitch.innerHTML = '';
    // De cima pra baixo: ataque, defesa, goleiro
    for (const line of [[6, 5, 4], [3, 2, 1], [0]]) {   // de cima pra baixo: PE ATA PD / LE ZAG LD / GOL
      const row = document.createElement('div');
      row.className = 'line';
      for (const i of line) {
        const slot = document.createElement('div');
        slot.className = 'slot' + (picking === i ? ' picking' : '');
        const c = cardById(data.team[i]);
        const ce = c ? cardEl(c) : Object.assign(document.createElement('div'), { className: 'card slot-empty', textContent: '+' });
        ce.addEventListener('click', () => { picking = picking === i ? -1 : i; renderTeam(); });
        const lab = document.createElement('div');
        lab.className = 'slot-label';
        lab.textContent = SLOTS[i].label + (c && effR(c, i) < c.r ? ' (fora da posição)' : c ? '' : ' (vazio)');
        slot.append(ce, lab);
        row.appendChild(slot);
      }
      pitch.appendChild(row);
    }
    const list = $('team-pick');
    list.innerHTML = '';
    if (picking < 0) { $('team-hint').textContent = 'Toque num jogador do campo pra trocar.'; return; }
    $('team-hint').textContent = 'Escolha quem entra no ' + SLOTS[picking].label + ':';
    if (!data.cards.length) { $('team-hint').textContent = 'Você ainda não tem jogadores. Abra pacotes ou crie no 📒 ÁLBUM!'; return; }
    // Primeiro os da posição da vaga (do melhor pro pior), depois os outros
    const pos = SLOTS[picking].pos, posName = (POSITIONS.find(p => p[0] === pos) || [pos, pos])[1];
    const others = data.cards.filter(c => c.id !== data.team[picking]);
    const same = others.filter(c => c.pos === pos).sort((a, b) => b.r - a.r);
    const rest = others.filter(c => c.pos !== pos).sort((a, b) => effR(b, picking) - effR(a, picking));
    const head = t => { const h = document.createElement('div'); h.className = 'pick-head'; h.textContent = t; list.appendChild(h); };
    head(same.length ? '⭐ ' + posName.toUpperCase() + ' (' + same.length + ')' : 'Nenhum ' + posName.toLowerCase() + ' ainda');
    // Separado por país (na ordem do álbum); quem não tem país vai no fim
    const order = c => { const i = ALBUM.findIndex(([id]) => BADGES[id][1] === c.club); return i < 0 ? 99 : i; };
    same.sort((a, b) => order(a) - order(b) || b.r - a.r);
    let lastCountry;
    for (const c of [...same, null, ...rest]) {
      if (c === null) { if (rest.length) head('Outras posições (jogam pior aqui)'); lastCountry = undefined; continue; }
      if (c.pos === pos && c.club !== lastCountry) {
        lastCountry = c.club;
        const sub = document.createElement('div');
        sub.className = 'pick-country';
        sub.textContent = c.club ? (c.badge || '') + ' ' + c.club : 'Sem país';
        list.appendChild(sub);
      }
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
    // Bronze: um time inteiro pra começar, com os mais fracos do álbum (1 de cada posição)
    { id: 'bronze', name: 'Pacote Bronze', ico: '🟫', price: 300, n: 7, team: true, min: 60, max: 88, bg: 'linear-gradient(135deg,#c07a3a,#7a4a1a)' },
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
      b.querySelector('small').textContent = p.team ? 'Um time de iniciantes: os 7 mais fracos do álbum, 1 de cada posição' : p.n + ' jogadores de nota ' + p.min + ' a ' + p.max + (p.best ? ' (1 garantido de ' + p.best[0] + '+)' : '');
      b.querySelector('.price').textContent = '🪙 ' + p.price;
      b.disabled = !isAdm() && data.coins < p.price;
      b.addEventListener('click', () => openPack(p));
      list.appendChild(b);
    }
    $('pack-msg').textContent = 'Ganhe moedas jogando partidas! Vitória: 200 · Empate: 100 · Derrota: 50 · Gol: +20';
  }
  // Os pacotes dão os jogadores que você criou no álbum (os de nota baixa saem mais)
  // Conta sem álbum (jogador novo): o pacote cria jogadores com nomes inventados, pra dar pra começar a jogar
  const FIRST = ['Léo', 'Davi', 'Rafa', 'Gui', 'Theo', 'Enzo', 'Juca', 'Beto', 'Caio', 'Duda', 'Tito', 'Nico', 'Lipe', 'Vini', 'Kauã', 'Bento', 'Iago', 'Zeca', 'Maxi', 'Rudi'];
  const LAST = ['Raio', 'Bala', 'Foguete', 'Trovão', 'Muralha', 'Furacão', 'Canhão', 'Mágico', 'Flecha', 'Tigre', 'Gelo', 'Chama', 'Onda', 'Cometa', 'Dragão', 'Faísca', 'Paredão', 'Tanque'];
  function inventCard(min, max, pos) {
    const r = Math.min(MAX_R, min + Math.floor((max - min + 1) * Math.pow(Math.random(), 1.6)));   // as notas baixas saem mais
    return { id: data.next++, nome: pick(FIRST) + ' ' + pick(LAST), pos: pos || pick(POS), r, face: pick(FACES) };
  }
  function drawCard(min, max, pos) {
    let pool = allSpecials().filter(sp => !sp.evento);   // carta de evento só na loja do evento
    if (!pool.length) return inventCard(min, max, pos);
    if (pos && pool.some(sp => sp.pos === pos)) pool = pool.filter(sp => sp.pos === pos);   // pacote de time: essa posição
    let ok = pool.filter(sp => sp.r >= min && sp.r <= max);
    if (!ok.length) {   // nenhum nessa faixa: vem o de nota mais perto
      const d = sp => sp.r < min ? min - sp.r : sp.r > max ? sp.r - max : 0;
      const best = Math.min(...pool.map(d));
      ok = pool.filter(sp => d(sp) === best);
    }
    const w = ok.map(sp => Math.pow(1.04, MAX_R - sp.r));
    let x = Math.random() * w.reduce((a, b) => a + b, 0), i = 0;
    while (i < ok.length - 1 && (x -= w[i]) > 0) i++;
    const sp = ok[i];
    return { id: data.next++, key: sp.key, nome: sp.nome, pos: sp.pos, r: sp.r, face: sp.face, club: sp.club, badge: sp.badge, time: sp.time };
  }
  function openPack(p) {
    if (!isAdm()) {   // o ADM abre de graça
      if (data.coins < p.price) return;
      data.coins -= p.price;
    }
    const got = [];
    if (p.team) for (const sl of SLOTS) got.push(drawCard(p.min, p.max, sl.pos));
    else for (let i = 0; i < p.n; i++) got.push(i === 0 && p.best ? drawCard(p.best[0], p.best[1]) : drawCard(p.min, p.max));
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
        const val = Math.round(c.r * 0.3);   // vender vale pouco: senão comprar pacote e vender dava lucro
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

  // ── 3 táticas: cada uma guarda um time (data.team é o da tática escolhida) ──
  let editingTac = -1;
  function ensureTactics() {
    if (!Array.isArray(data.tactics) || data.tactics.length !== 3) {
      data.tactics = [0, 1, 2].map(i => ({ nome: '', team: i === 0 ? data.team.slice() : SLOTS.map(() => null) }));
      data.tactic = 0;
    }
    if (!(data.tactic >= 0 && data.tactic < 3)) data.tactic = 0;   // tática escolhida perdida: volta pra primeira
    data.tactics[data.tactic].team = data.team;   // a tática escolhida usa o time de agora
  }
  function renderTactics() {
    ensureTactics();
    const box = $('tactics');
    box.innerHTML = '';
    data.tactics.forEach((t, i) => {
      if (editingTac === i) {   // escrevendo o nome
        const w = document.createElement('div');
        w.className = 'tac-input';
        const inp = document.createElement('input');
        inp.maxLength = 20; inp.placeholder = 'Nome da tática'; inp.value = t.nome;
        const ok = document.createElement('button');
        ok.textContent = 'OK';
        const done = () => { t.nome = inp.value.trim().slice(0, 20); editingTac = -1; save(); renderTactics(); };
        ok.addEventListener('click', done);
        inp.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') done(); });
        w.append(inp, ok);
        box.appendChild(w);
        setTimeout(() => inp.focus(), 0);
        return;
      }
      const b = document.createElement('button');
      b.className = 'tac' + (data.tactic === i ? ' on' : '');
      const filled = t.team.filter(Boolean).length;
      b.textContent = t.nome || 'Tática ' + (i + 1);
      const sm = document.createElement('small');
      sm.textContent = filled + '/' + SLOTS.length + ' jogadores';
      const ed = document.createElement('span');
      ed.className = 'tac-edit';
      ed.textContent = '✏️';
      b.append(sm, ed);
      b.addEventListener('click', e => {
        if (e.target === ed || !t.nome) { editingTac = i; renderTactics(); if (e.target === ed) return; }   // primeira vez: pede o nome
        if (data.tactic !== i) {
          data.tactics[data.tactic].team = data.team;
          data.tactic = i;
          data.team = t.team.map(id => cardById(id) ? id : null);
          picking = -1;
          save(); render();
        }
      });
      box.appendChild(b);
    });
  }

  // ── Times: pesquisa; se não achar, cria time novo ──
  const CLUB_BADGES = ['⚽', '🔴', '🔵', '🟢', '🟡', '🟣', '⚫', '⚪', '🦁', '🐍', '🦅', '🐟', '🐯', '⭐'];
  const findClub = nome => (data.clubs || []).find(c => c.nome.toLowerCase() === nome.trim().toLowerCase());
  function addClub(nome) {
    nome = nome.trim().slice(0, 24);
    const found = findClub(nome);
    if (found) return found.nome;
    data.clubs = data.clubs || [];
    data.clubs.push({ nome, badge: pick(CLUB_BADGES) });
    save(); fillClubList();
    return nome;
  }
  function fillClubList() {
    $('clubs-dl').innerHTML = '';
    for (const c of data.clubs || []) { const o = document.createElement('option'); o.value = c.nome; $('clubs-dl').appendChild(o); }
  }
  const myClub = () => findClub(data.myClub || '');
  // Escudo: o que você montou no 🎨, ou o emoji
  function logoImg(cl, cls) {
    if (!cl.logo) return document.createTextNode(cl.badge);
    const im = new Image();
    im.src = cl.logo; im.className = cls || 'logo'; im.alt = cl.nome;
    return im;
  }
  // 🎨 Personalizar escudo: 2 cores, um desenho e um símbolo
  const CREST_COLORS = ['#ffffff', '#111111', '#e02020', '#1a4ad0', '#2fb060', '#ffd23a', '#ff8a1a', '#8a2ab0', '#5ccfff', '#8a1a1a', '#0a2a6a', '#a9b2c3'];
  const CREST_PATS = [['liso', '⬛'], ['listras', '║'], ['faixas', '☰'], ['metade', '◧'], ['diagonal', '◩'], ['xadrez', '▦'], ['cruz', '✚'], ['borda', '▣']];
  const CREST_SYMS = ['', '⭐', '🦁', '🐟', '👑', '⚡', '🔥', '🦅', '🐍', '⚽', '🐯', '🐉', '🛡️', '🏰', '🌙', '💎', '🐺', '🦈'];
  let crest = null;
  function drawCrest(g, size, st) {
    const z = size / 64;
    g.clearRect(0, 0, size, size);
    g.save(); g.scale(z, z);
    // Formato de escudo
    const shape = () => { g.beginPath(); g.moveTo(8, 6); g.lineTo(56, 6); g.lineTo(56, 34); g.quadraticCurveTo(56, 52, 32, 60); g.quadraticCurveTo(8, 52, 8, 34); g.closePath(); };
    shape(); g.fillStyle = st.c1; g.fill();
    g.save(); shape(); g.clip();
    g.fillStyle = st.c2;
    if (st.pat === 'listras') for (let x = 8; x < 56; x += 12) g.fillRect(x + 6, 0, 6, 64);
    else if (st.pat === 'faixas') for (let y = 6; y < 64; y += 12) g.fillRect(0, y + 6, 64, 6);
    else if (st.pat === 'metade') g.fillRect(32, 0, 32, 64);
    else if (st.pat === 'diagonal') { g.beginPath(); g.moveTo(8, 60); g.lineTo(56, 6); g.lineTo(56, 64); g.closePath(); g.fill(); }
    else if (st.pat === 'xadrez') for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) if ((x + y) % 2) g.fillRect(x * 8, y * 8, 8, 8);
    else if (st.pat === 'cruz') { g.fillRect(27, 0, 10, 64); g.fillRect(0, 24, 64, 10); }
    else if (st.pat === 'borda') { g.lineWidth = 8; g.strokeStyle = st.c2; shape(); g.stroke(); }
    g.restore();
    shape(); g.lineWidth = 3; g.strokeStyle = '#000'; g.stroke();
    if (st.sym) { g.font = '26px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(st.sym, 32, 32); }
    g.restore();
  }
  function crestButtons(boxId, items, key, label) {
    const box = $(boxId);
    box.innerHTML = '';
    for (const it of items) {
      const v = Array.isArray(it) ? it[0] : it;
      const b = document.createElement('button');
      if (key === 'c1' || key === 'c2') b.style.background = v;
      else b.textContent = Array.isArray(it) ? it[1] : (v || '∅');
      if (crest.st[key] === v) b.className = 'on';
      b.addEventListener('click', () => { crest.st[key] = v; renderCrest(); });
      box.appendChild(b);
    }
  }
  function renderCrest() {
    crestButtons('crest-c1', CREST_COLORS, 'c1'); crestButtons('crest-c2', CREST_COLORS, 'c2');
    crestButtons('crest-pat', CREST_PATS, 'pat'); crestButtons('crest-sym', CREST_SYMS, 'sym');
    drawCrest($('crest-prev').getContext('2d'), 128, crest.st);
  }
  function openCrest(cl) {
    crest = { cl, st: Object.assign({ c1: '#ffffff', c2: '#111111', pat: 'listras', sym: '⭐' }, cl.crest || {}) };
    $('crest-title').textContent = '🎨 ESCUDO DO ' + cl.nome.toUpperCase();
    renderCrest();
    $('crest').classList.add('on');
  }
  $('crest-cancel').addEventListener('click', () => $('crest').classList.remove('on'));
  $('crest-save').addEventListener('click', () => {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 64;
    drawCrest(cv.getContext('2d'), 64, crest.st);
    crest.cl.crest = crest.st;
    crest.cl.logo = cv.toDataURL('image/png');
    save(); render();
    $('crest').classList.remove('on');
    $('club-msg').textContent = '🎨 Escudo do ' + crest.cl.nome + ' pronto!';
  });

  function renderClubs() {
    const c = myClub();
    const now = $('club-now');
    now.innerHTML = '';
    if (c) now.append(logoImg(c, 'logo-big'), document.createTextNode(' ' + c.nome));
    else now.textContent = 'Escolha o nome do seu time 👇';
    const chips = $('club-chips');
    chips.innerHTML = '';
    for (const cl of data.clubs || []) {
      const chip = document.createElement('span');
      chip.className = 'chip';
      const b = document.createElement('button');
      b.append(logoImg(cl), document.createTextNode(' ' + cl.nome));
      if (c && c.nome === cl.nome) b.className = 'on';
      b.addEventListener('click', () => { data.myClub = cl.nome; save(); renderClubs(); });
      const paint = document.createElement('button');
      paint.className = 'paint';
      paint.textContent = '🎨';
      paint.title = 'Personalizar o escudo';
      paint.addEventListener('click', () => openCrest(cl));
      // 🗑️ apagar o time (toca duas vezes)
      const del = document.createElement('button');
      del.className = 'del';
      del.textContent = '🗑️';
      del.addEventListener('click', () => {
        if (del.dataset.armed !== '1') { del.dataset.armed = '1'; del.textContent = 'Apagar?'; setTimeout(() => { del.dataset.armed = ''; del.textContent = '🗑️'; }, 3000); return; }
        data.clubs = data.clubs.filter(x => x !== cl);
        if (data.myClub === cl.nome) data.myClub = null;
        save(); fillClubList(); render();
        $('club-msg').textContent = '🗑️ ' + cl.nome + ' foi apagado.';
      });
      chip.append(b, paint, del);
      chips.appendChild(chip);
    }
  }
  $('club-go').addEventListener('click', () => {
    const v = $('club-search').value.trim();
    if (!v) { $('club-msg').textContent = 'Escreva o nome do time!'; return; }
    const isNew = !findClub(v);
    data.myClub = addClub(v);
    save(); renderClubs();
    $('club-search').value = '';
    $('club-msg').textContent = isNew ? '✨ Time novo criado: ' + data.myClub + '! Agora monte o escudo 🎨' : '✅ Agora você joga com o ' + data.myClub + '!';
    if (isNew) openCrest(findClub(data.myClub));
  });
  $('club-search').addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') $('club-go').click(); });

  // Cada nome é um jogo separado: nome novo começa como iniciante (500 moedas);
  // voltar pra um nome que já jogou traz o jogo dele de volta. O álbum é o mesmo pra todos
  const chaveNome = n => (n || '').trim().toLowerCase();
  function trocarNome(v) {
    const de = chaveNome(data.nome), para = chaveNome(v);
    if (!de || de === para) { data.nome = v; return; }
    const outros = data.outros || {};
    const atual = Object.assign({}, data);
    delete atual.outros;
    if (!data.outros) atual.principal = true;   // o jogo de antes de ter nomes separados é o principal
    outros[de] = atual;
    // O ADM sem jogo guardado volta pro jogo principal
    const k = para in outros ? para : para === 'dominic' ? Object.keys(outros).find(x => outros[x].principal) : null;
    const meu = k ? outros[k] : jogoNovo();
    if (k) delete outros[k];
    const novo = Object.assign(meu, { nome: v, outros, custom: data.custom, removedKeys: data.removedKeys, dono: data.dono, updatedAt: Date.now() });
    try { localStorage.setItem(KEY, JSON.stringify(novo)); } catch (e) { /* ok */ }
    load();
  }
  $('name-save').addEventListener('click', () => {
    const v = $('name-input').value.trim().slice(0, 20);
    if (!v) { $('name-msg').textContent = 'Escreva seu nome!'; return; }
    trocarNome(v);
    save(); fillClubList(); render();
    $('name-msg').textContent = isAdm() ? '👑 Bem-vindo, ADM! Pacotes de graça liberados.' : '✅ Pronto, ' + v + '!';
  });
  $('name-input').addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') $('name-save').click(); });

  // Quanto falta pro evento acabar
  function tempoEvento() {
    const ms = EVENTO.fim - Date.now();
    if (ms <= 0) return 'O evento acabou!';
    const d = Math.floor(ms / 864e5), h = Math.floor(ms / 36e5) % 24;
    return 'Acaba em ' + d + ' dias e ' + h + ' horas';
  }
  function renderEvento() {
    $('evento-bolas').textContent = data.bolas || 0;
    $('evento-tempo2').textContent = tempoEvento();
    const list = $('evento-cards');
    list.innerHTML = '';
    const have = new Set(data.cards.map(c => c.key));
    // Separado: primeiro os campeões (🥇), depois o segundo (🥈) e o terceiro lugar (🥉)
    const lugar = ec => ec.prata ? 1 : ec.bronze ? 2 : 0;
    let lastGroup;
    for (const ec of [...EVENT_CARDS].sort((a, b) => lugar(a) - lugar(b))) {
      const group = ['🥇 CAMPEÕES', '🥈 SEGUNDO LUGAR', '🥉 TERCEIRO LUGAR'][lugar(ec)];
      if (group !== lastGroup) { lastGroup = group; list.appendChild(Object.assign(document.createElement('div'), { className: 'pick-head evento-group', textContent: group })); }
      const w = document.createElement('div');
      w.className = 'evento-item';
      w.appendChild(cardEl(SPECIALS.find(x => x.key === ec.key)));
      const b = document.createElement('button');
      const got = have.has(ec.key);
      b.className = 'evento-buy';
      b.textContent = got ? '✅ JÁ É SUA' : 'TROCAR 🥇 ' + ec.preco;
      b.disabled = got || !eventoAtivo() || (data.bolas || 0) < ec.preco;
      b.addEventListener('click', () => {
        const sp = SPECIALS.find(x => x.key === ec.key);
        data.bolas -= ec.preco;
        data.cards.push({ id: data.next++, key: sp.key, nome: sp.nome, pos: sp.pos, r: sp.r, face: sp.face, club: sp.club, badge: sp.badge, time: sp.time });
        save(); render();
        beep(1046, 0.4, 'triangle');
      });
      w.appendChild(b);
      list.appendChild(w);
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
      const full = players.length > 0 && got === players.length;
      h.textContent = title + '  ' + got + '/' + players.length + (full ? '  ✅' : '');
      const row = document.createElement('div');
      row.className = 'album-row';
      for (const sp of players) {
        if (have.has(sp.key)) row.appendChild(withRemove(cardEl(sp), sp));
        else row.appendChild(withRemove(cardEl(sp, 'album-missing'), sp));   // ainda não tem: aparece apagadinho
      }
      if (!players.length) row.appendChild(Object.assign(document.createElement('div'), { className: 'hint', textContent: 'Ainda sem jogadores.' }));
      sec.append(h, row);
      list.appendChild(sec);
      // Completou a seleção pela primeira vez: prêmio!
      if (full && !data.albumDone.includes(id)) {
        data.albumDone.push(id);
        data.coins += ALBUM_PRIZE;
        save();
        $('album-msg').textContent = '🎉 Você completou ' + title + '! Ganhou 🪙 ' + ALBUM_PRIZE;
        beep(1046, 0.4, 'triangle');
      }
    }
    $('coins').textContent = isAdm() ? '∞' : data.coins;
  }

  // Jogador que você criou: tem 🗑️ pra tirar do álbum
  function withRemove(el, sp) {
    if (!sp.custom || !isAdm()) return el;   // só o ADM tira jogador do álbum
    const w = document.createElement('div');
    w.className = 'album-slot';
    const b = document.createElement('button');
    b.className = 'album-del';
    b.textContent = '🗑️';
    b.addEventListener('click', () => {
      if (b.dataset.armed !== '1') { b.dataset.armed = '1'; b.textContent = 'Tirar?'; setTimeout(() => { b.dataset.armed = ''; b.textContent = '🗑️'; }, 3000); return; }
      data.custom = data.custom.filter(x => x.key !== sp.key);
      (data.removedKeys = data.removedKeys || []).push(sp.key);   // senão a conta devolvia ele
      save(); render();
    });
    w.append(el, b);
    return w;
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
  const FX0 = 24, FY0 = 34, FY1 = 286;          // campo
  let FX1 = W - 24;
  // Tela cheia: o campo estica pro formato da tela (sem esticar o desenho)
  function fitScreen() {
    const a = innerWidth / Math.max(1, innerHeight);
    if (!M) { W = Math.round(clamp(H * a, 420, 720)); FX1 = W - 24; canvas.width = W; }
    document.body.classList.toggle('portrait', a < 1);
  }
  addEventListener('resize', fitScreen);
  // Durante a partida a tela não rola nem dá zoom com os dedos
  document.addEventListener('touchmove', e => { if (M) e.preventDefault(); }, { passive: false });
  document.addEventListener('gesturestart', e => e.preventDefault());
  document.addEventListener('dblclick', e => { if (M) e.preventDefault(); });
  const MIDY = (FY0 + FY1) / 2, GOAL_H = 70;
  const GY0 = MIDY - GOAL_H / 2, GY1 = MIDY + GOAL_H / 2;   // boca do gol
  const MATCH_FRAMES = 60 * 120;                            // 2 minutos
  const CLUBS = ['Dragões FC', 'Raio Azul', 'Tubarões do Mar', 'Fênix United', 'Leões de Gelo', 'Trovão SC', 'Cometa EC', 'Lobos da Noite', 'Atlético Vulcão', 'Real Furacão'];
  const HOME = SLOTS.map(sl => sl.home);
  const ATA_SLOT = SLOTS.findIndex(sl => sl.pos === 'ATA');

  let M = null;   // a partida
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const norm01 = r => clamp((r - MIN_R) / (MAX_R - MIN_R), 0, 1.15);

  // Mais fácil: o time do computador é um pouco mais lento, rouba menos e o goleiro dele pega menos
  // Dificuldade (interruptor no menu): no celular o computador joga um pouco melhor
  const DIFFS = { computador: { speed: 0.88, tackle: 0.5, reach: 0.88 }, celular: { speed: 0.92, tackle: 0.6, reach: 0.9 } };
  const EASY = () => DIFFS[data.diff] || DIFFS[isTouch ? 'celular' : 'computador'];
  const PACE = 0.68;   // ritmo do FC Mobile: todo mundo corre mais devagar
  function makePlayer(team, slot, rating, card) {
    const k = norm01(rating), cpu = team === 1;
    return {
      team, slot, gk: slot === 0, r: rating, card, x: 0, y: 0, vx: 0, vy: 0, face: team === 0 ? 0 : Math.PI,
      speed: (1.0 + k * 0.9) * PACE * (cpu ? EASY().speed : 1), power: (5 + k * 3.2) * 0.85, err: Math.max(0.03, 0.24 - k * 0.19),
      tackle: (0.01 + k * 0.022) * (cpu ? EASY().tackle : 1.3), reach: (11 + k * 11) * (cpu ? EASY().reach : 1),
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
      if (attacking) fx += SLOTS[p.slot].att ? 0.18 : 0.08;
      fy = lerp(fy, (M.ball.y - FY0) / (FY1 - FY0), 0.25);
    }
    fx = clamp(fx, 0.02, 0.95);
    const x = p.team === 0 ? FX0 + fx * (FX1 - FX0) : FX1 - fx * (FX1 - FX0);
    return { x, y: FY0 + fy * (FY1 - FY0) };
  }

  function startMatch() {
    fitScreen();
    // No celular, entra em tela cheia (esconde a barra do navegador)
    if (isTouch && document.documentElement.requestFullscreen && !document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
    const myOvr = teamOvr();
    const opp = clamp(myOvr + Math.floor(Math.random() * 9) - 8, MIN_R, MAX_R);   // adversário um pouco mais fraco que você
    const players = [];
    data.team.forEach((id, i) => { const c = cardById(id); players.push(makePlayer(0, i, effR(c, i), c)); });
    for (let i = 0; i < SLOTS.length; i++) players.push(makePlayer(1, i, clamp(opp + Math.floor(Math.random() * 9) - 4, MIN_R, MAX_R), null));
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
    const taker = M.players.find(p => p.team === team && p.slot === ATA_SLOT);
    taker.x = W / 2 + (team === 0 ? -8 : 8); taker.y = MIDY;
    b.owner = taker;
    M.me = M.players.find(p => p.team === 0 && p.slot === ATA_SLOT);
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
    if (window.FC3D) FC3D.stop();
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
    // Seu time passa igual FC Mobile: a bola vai certinha no colega
    kick(p, best.x + best.vx * 10, best.y + best.vy * 10, clamp(2.2 + d / 45, 2.6, 5.5), p.team === 0 ? 0 : p.err * 0.5);
    if (p.team === 0) { M.passTo = best; M.passT = 90; }
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
      // Quem vai receber o passe corre sozinho pra bola
      if (p === M.passTo && !b.owner) { moveTo(p, b.x, b.y, true); continue; }
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
        if (p.cd === 0 && (toGoal < 90 && Math.random() < 0.008 || toGoal < 40)) shoot(p, (Math.random() - 0.5) * 1.6, 0.3 + Math.random() * 0.5);
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
      if (pressed.shoot && me.lunge <= 0) { me.lunge = 22; beep(160, 0.08, 'square'); }   // CARRINHO: desliza pra roubar a bola
      if (pressed.pass) {   // troca pro jogador mais perto da bola
        const near = M.players.filter(p => p.team === 0 && !p.gk && p !== me).sort((p, q) => dist(p, b) - dist(q, b))[0];
        if (near) { M.me = near; M.switchCd = 30; }
      }
    }
    pressed.pass = pressed.shoot = false;
    // Botões igual FC Mobile: com a bola é PASSE/CHUTE; sem a bola é TROCAR/CARRINHO
    const ataque = b.owner === me;
    if (M.labels !== ataque) {
      M.labels = ataque;
      $('b-shoot').textContent = ataque ? 'CHUTE' : 'CARRINHO';
      $('b-pass').textContent = ataque ? 'PASSE' : 'TROCAR';
    }

    // Movimento
    for (const p of M.players) {
      p.x = clamp(p.x + p.vx, FX0 + 4, FX1 - 4); p.y = clamp(p.y + p.vy, FY0 + 4, FY1 - 4);
      if (Math.hypot(p.vx, p.vy) > 0.2) p.face = Math.atan2(p.vy, p.vx);
    }
    // A bola vai colada no pé de quem tem
    if (b.owner) {
      M.passTo = null;
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
      // Passe do seu time: a bola vai entortando pro colega e não para no meio do caminho
      const rec = M.passTo;
      if (rec && M.passT-- > 0) {
        const a = Math.atan2(rec.y - b.y, rec.x - b.x), v = Math.max(Math.hypot(b.vx, b.vy), 2.2);
        b.vx = lerp(b.vx, Math.cos(a) * v, 0.15); b.vy = lerp(b.vy, Math.sin(a) * v, 0.15);
        if (dist(rec, b) < 16) { b.owner = rec; rec.cd = 0; M.passTo = null; }
      } else M.passTo = null;
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
          const d = dist(p, b) - (p.lunge > 0 ? 6 : 0);   // no carrinho alcança mais longe
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
    const prize = { win: 200, draw: 100, loss: 50 }[res] + a * 20;   // menos moedas: igual FC Mobile, demora pra ficar rico
    data.coins += prize; data.played++; if (res === 'win') data.wins++;
    // Evento: vitória dá 3 🥇, empate 1, e cada gol mais 1
    const bolas = eventoAtivo() ? ({ win: 3, draw: 1, loss: 0 }[res] + a) : 0;
    data.bolas = (data.bolas || 0) + bolas;
    save();
    $('main-msg').textContent = (res === 'win' ? '🏆 Vitória' : res === 'draw' ? '🤝 Empate' : '😢 Derrota') + ` ${a} x ${c} contra ${M.opp}! Você ganhou 🪙 ${prize}` + (bolas ? ` e 🥇 ${bolas}` : '');
    M = null;
    document.body.classList.remove('in-match');
    if (window.FC3D) FC3D.stop();
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
  const scoreLogo = new Image();   // escudo do seu time no placar
  function draw() {
    const in3d = M && window.FC3D && document.body.classList.contains('mode3d');
    if (in3d) { ctx.clearRect(0, 0, W, H); FC3D.render(M); }   // 3D: aqui só o placar
    else { ctx.fillStyle = '#0b1a2e'; ctx.fillRect(0, 0, W, H); }
    if (!M) return;
    if (!in3d) {
      drawField();
      const b = M.ball;
      for (const p of M.players) drawPlayer(p);
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(b.x + 1, b.y + 3, 3, 1.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(b.x, b.y, 3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
    // Placar
    const min = Math.min(90, Math.floor(M.t / MATCH_FRAMES * 90));
    ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(W / 2 - 120, 4, 240, 24);
    ctx.font = 'bold 13px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const mc = myClub();
    if (mc && mc.logo) { scoreLogo.src !== mc.logo && (scoreLogo.src = mc.logo); if (scoreLogo.complete) ctx.drawImage(scoreLogo, W / 2 - 86, 6, 20, 20); }
    else { ctx.fillStyle = '#9fc8ff'; ctx.font = 'bold 10px Arial'; ctx.fillText(data.myClub || 'VOCÊ', W / 2 - 75, 16); ctx.font = 'bold 13px Arial'; }
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

  // 3D pra todo mundo. Carrega o three.js (o mesmo do Mundo de Blocos) na primeira vez; se não der, joga em 2D
  const mode3d = () => true;
  function loadScript(src) {
    return new Promise((ok, fail) => { const sc = document.createElement('script'); sc.src = src; sc.onload = ok; sc.onerror = fail; document.head.appendChild(sc); });
  }
  async function play() {
    if (mode3d() && !window.FC3D) {
      $('main-msg').textContent = '⏳ Carregando o estádio 3D...';
      try { if (!window.THREE) await loadScript('../mundo-blocos/three.min.js'); await loadScript('game3d.js?v=2'); }
      catch (e) { $('main-msg').textContent = 'Não deu pra carregar o 3D. Jogando no normal.'; }
      $('main-msg').textContent = '';
    }
    startMatch();
    if (mode3d() && window.FC3D) {
      try {
        FC3D.start({ W, H, FX0, FX1, FY0, FY1, MIDY, GY0, GY1 });
        document.body.classList.add('mode3d');
      } catch (e) { document.body.classList.remove('mode3d'); }   // aparelho sem 3D: fica no 2D
    }
  }
  $('go-play').addEventListener('click', play);

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
  fillClubList();
  show('main');
  syncFC();
  document.addEventListener('visibilitychange', () => { if (!document.hidden && !M) syncFC(); });

  // Só pra testar pelo console: abrir com #debug
  if (location.hash === '#debug') window.fc = { get M() { return M; }, get data() { return data; }, startMatch, save, render, updateMatch, keys, btn, pressed };
})();
