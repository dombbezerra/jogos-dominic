// Aventura Elemental — usuário (e-mail, nome e cor do nome) e quem está online agora.
// Guarda tudo no Redis (Upstash) do Vercel.
const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const SECRET = process.env.CHAT_SECRET || REDIS_TOKEN || '';
const crypto = require('crypto');

// Login da Base Secreta (o mesmo token da página de avisos): só Felipe e Dominic gerenciam usuários
const ADMINS = { felipe: 'Felipe', dominique: 'Dominic', dominic: 'Dominic' };
function isAdmin(req) {
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [user, exp, sig] = parts;
  if (!ADMINS[user] || Number(exp) < Date.now()) return false;
  const want = Buffer.from(crypto.createHmac('sha256', SECRET).update(user + '.' + exp).digest('hex')), got = Buffer.from(sig);
  return want.length === got.length && crypto.timingSafeEqual(want, got);
}

const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_POR_HORA = 30;
const CORES = ['branco', 'verde', 'azul', 'vermelho', 'laranja', 'roxo', 'rosa', 'dourado', 'arcoiris'];

async function redis(...commands) {
  const r = await fetch(REDIS_URL + '/pipeline', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + REDIS_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(commands),
  });
  if (!r.ok) throw new Error('redis ' + r.status);
  const out = await r.json();
  return out.map((x) => {
    if (x.error) throw new Error(x.error);
    return x.result;
  });
}

// ── Chat de amigos: só entra quem o ADM convidou (na página de avisos). Escreve livre, mas com filtro ──
const CHAT_GIFS = ['rindo', 'fogo', 'festa', 'joinha', 'oculos', 'caveira', 'coracao', 'trofeu', 'raio', 'chorando', 'susto', 'danca'];
// GIFs comprados na loja: só manda quem tem (está no progresso salvo da conta)
const GIFS_LOJA = ['dragao', 'foguete', 'alien', 'robo', 'unicornio', 'coroa', 'diamante', 'ninja',
  'rindoarco', 'fogoarco', 'coracaoarco', 'joinhaarco', 'estrelaarco', 'oculosarco', 'arcoiris', 'dragaoarco', 'coroaarco'];
const PALAVROES = ['porra', 'caralho', 'merda', 'bosta', 'puta', 'puto', 'putaria', 'fdp', 'vsf', 'vtnc', 'tnc', 'pqp', 'cu', 'cuzao', 'buceta', 'piroca',
  'foda', 'fodase', 'foder', 'fudeu', 'arrombado', 'arrombada', 'viado', 'otario', 'otaria', 'idiota', 'imbecil', 'desgraca', 'desgracado', 'cacete',
  'babaca', 'retardado', 'retardada', 'corno', 'vagabundo', 'vagabunda', 'piranha', 'safado', 'safada', 'sexo', 'nude', 'nudes', 'pinto', 'rola',
  'xota', 'xoxota', 'punheta', 'pau', 'peito', 'bunda', 'burro', 'burra', 'lixo', 'nojento', 'nojenta', 'feio', 'feia', 'gordo', 'gorda', 'odeio', 'matar', 'morre'];
const semAcento = (t) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const juntar = (t) => t.replace(/(.)\1+/g, '$1');   // letras repetidas viram uma só
const PALAVROES_J = PALAVROES.map(juntar);
// Troca palavrão por ***, e não deixa passar telefone, e-mail, link nem endereço
function filtrar(texto) {
  let t = String(texto || '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, 200);
  t = t.replace(/(?:\d[\s.\-()]*){7,}/g, '🚫');                                   // telefone
  t = t.replace(/\S+@\S+/g, '🚫');                                                  // e-mail
  t = t.replace(/(https?:\/\/|www\.)\S*|\S+\.(com|br|net|org|gg|me|io|tv|app)\b\S*/gi, '🚫');   // link
  t = t.replace(/\b(rua|avenida|av\.|endere[cç]o|whats\S*|zap|insta\S*|tiktok|telefone|celular|cpf|senha)\b/gi, '🚫');
  return t.replace(/[\p{L}\p{N}]+/gu, (w) => {
    const n = juntar(semAcento(w));   // "merdaaa" vira "merda"
    return PALAVROES_J.some((p) => n === p || n === p + 's') ? '*'.repeat(w.length) : w;
  });
}

// No Gmail, ponto não conta: dom.bbezerra.@gmail.com e dombbezerra@gmail.com são o mesmo e-mail.
// Então a conta fica guardada no jeito "sem ponto", e quem digitar com ou sem ponto cai na mesma conta
function canon(e) {
  const [local, dom] = e.split('@');
  if (dom === 'gmail.com' || dom === 'googlemail.com') return local.split('+')[0].replace(/\./g, '') + '@gmail.com';
  return e;
}
async function emailDaConta(raw) {
  const e = canon(raw);
  const [existe] = await redis(['EXISTS', 'aventura:user:' + e]);
  if (existe) return e;
  // Conta antiga guardada com ponto: muda pro jeito novo (uma vez só)
  const [todos] = await redis(['SMEMBERS', 'aventura:users']);
  const velho = (todos || []).find((x) => x !== e && canon(x) === e);
  if (!velho) return e;
  const [user, save, membro] = await redis(['GET', 'aventura:user:' + velho], ['GET', 'aventura:save:' + velho], ['SISMEMBER', 'aventura:chat:membros', velho]);
  if (!user) return e;
  const u = JSON.parse(user);
  u.email = e;
  const cmds = [['SET', 'aventura:user:' + e, JSON.stringify(u)], ['DEL', 'aventura:user:' + velho], ['SREM', 'aventura:users', velho],
    ['SADD', 'aventura:users', e], ['HSET', 'aventura:nomes', nomeKey(u.nome), e], ['ZREM', 'aventura:online', velho]];
  if (save) cmds.push(['SET', 'aventura:save:' + e, save], ['DEL', 'aventura:save:' + velho]);
  if (membro) cmds.push(['SREM', 'aventura:chat:membros', velho], ['SADD', 'aventura:chat:membros', e]);
  await redis(...cmds);
  return e;
}

// Nada comprado some: um aparelho velho (ou com o jogo antigo guardado) não apaga o que a conta já tinha.
// Se o aparelho está sem alguma coisa que a conta tem, ele está atrasado: fica o maior de cada coisa
const ITENS = ['skins', 'avatars', 'frames', 'colors', 'codes', 'gifs', 'pets'];
function protegerSave(novo, velho) {
  const a = (velho && velho.meta) || null, b = novo.meta;
  if (!a || !b || typeof b !== 'object') return false;
  const atrasado = ITENS.some((k) => (a[k] || []).some((x) => !(b[k] || []).includes(x)));
  for (const k of ITENS) b[k] = [...new Set([...(a[k] || []), ...(b[k] || [])])];
  b.up = Object.assign({}, a.up, b.up);
  for (const k in a.up || {}) b.up[k] = Math.max(a.up[k] || 0, (b.up || {})[k] || 0);
  if (!atrasado) return false;
  for (const k of ['coins', 'gems']) b[k] = Math.max(a[k] || 0, b[k] || 0);
  for (const k of ['skin', 'nameColor', 'avatar', 'frame']) if (a[k] != null) b[k] = a[k];
  b.seenHelp = !!(a.seenHelp || b.seenHelp);
  if (velho.save && (!novo.save || (velho.save.level || 0) > (novo.save.level || 0))) novo.save = velho.save;
  novo.atualizado = Date.now();   // os aparelhos puxam a versão juntada
  b.updatedAt = novo.atualizado;
  return true;
}

// ADM: a conta precisa estar marcada (na página de avisos) E estar com o nome de ADM.
// Trocou o nome pra outro, deixa de ser ADM até voltar pro nome
const NOMES_ADM = ['endrick'];
const admPeloNome = (raw) => !!raw && NOMES_ADM.includes(nomeKey(JSON.parse(raw).nome));
async function ehAdm(email) {
  const [marcado, raw] = await redis(['SISMEMBER', 'aventura:adm', email], ['GET', 'aventura:user:' + email]);
  return !!marcado && admPeloNome(raw);
}

const ONLINE_SECS = 75;   // sem sinal por mais que isso, a pessoa sai do "online"
const nomeKey = (n) => n.trim().toLowerCase();

// Todo mundo que tem usuário, com quem está jogando agora primeiro (sem precisar adicionar).
// Só nome, cor e online: o e-mail dos outros nunca sai daqui
async function listarJogadores(email) {
  const now = Date.now();
  const [, onlineEmails, todos, ocultos] = await redis(['ZREMRANGEBYSCORE', 'aventura:online', 0, now - ONLINE_SECS * 1000],
    ['ZRANGE', 'aventura:online', 0, -1], ['SMEMBERS', 'aventura:users'], ['SMEMBERS', 'aventura:ocultos']);
  // Conta de teste (oculta): não aparece pra ninguém e não vê ninguém
  const oc = new Set(ocultos || []);
  if (oc.has(email)) return [];
  const on = new Set(onlineEmails || []);
  const outros = (todos || []).filter((e) => e !== email && !oc.has(e)).slice(0, 80);
  if (!outros.length) return [];
  const users = await redis(...outros.map((e) => ['GET', 'aventura:user:' + e]));
  return outros.map((e, i) => {
    if (!users[i]) return null;
    const u = JSON.parse(users[i]);
    return { nome: u.nome, cor: u.cor || 'branco', foto: u.foto || 'skin:gotinha', moldura: u.moldura || 'nenhuma', online: on.has(e) };
  }).filter(Boolean).sort((x, y) => (y.online - x.online) || x.nome.localeCompare(y.nome));
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });
  if (!REDIS_URL || !REDIS_TOKEN) return res.status(503).json({ error: 'Banco de dados não configurado no Vercel.' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};

    // Página de avisos: ver todos os usuários e apagar pelo nome (precisa do login)
    if (['admin-lista', 'admin-apagar', 'admin-chat', 'admin-adm', 'admin-limpar-chat', 'admin-oculto'].includes(body.action)) {
      // Login da Base Secreta pode tudo. Conta de ADM (marcada pelo login) só vê a lista e convida pro chat
      let ok = isAdmin(req);
      if (!ok && ['admin-lista', 'admin-chat', 'admin-limpar-chat'].includes(body.action) && EMAIL_OK.test(String(body.email || ''))) {
        ok = await ehAdm(canon(String(body.email).trim().toLowerCase()));
      }
      if (!ok) return res.status(401).json({ error: 'Entre com o login da Base Secreta.' });
      // Apagar todas as conversas do chat (os aparelhos limpam a tela sozinhos)
      if (body.action === 'admin-limpar-chat') {
        const [ultimo] = await redis(['GET', 'aventura:chat:id']);
        await redis(['DEL', 'aventura:chat:msgs'], ['SET', 'aventura:chat:limpo', Number(ultimo) || 0]);
        return res.status(200).json({ ok: true });
      }
      let [todos, membros, adms] = await redis(['SMEMBERS', 'aventura:users'], ['SMEMBERS', 'aventura:chat:membros'], ['SMEMBERS', 'aventura:adm']);
      let users = (todos || []).length ? await redis(...todos.map((e) => ['GET', 'aventura:user:' + e])) : [];
      if (body.action === 'admin-apagar') {
        // Procura pelo nome exato em todos (usuários antigos podem não estar na lista de nomes)
        const nome = String(body.nome || '');
        const alvos = todos.filter((e, i) => users[i] && JSON.parse(users[i]).nome === nome);
        if (!alvos.length) return res.status(404).json({ error: 'Não achei esse usuário.' });
        const [dono] = await redis(['HGET', 'aventura:nomes', nomeKey(nome)]);
        const cmds = alvos.flatMap((e) => [['DEL', 'aventura:user:' + e], ['DEL', 'aventura:save:' + e], ['SREM', 'aventura:users', e], ['ZREM', 'aventura:online', e]]);
        if (alvos.includes(dono)) cmds.push(['HDEL', 'aventura:nomes', nomeKey(nome)]);
        cmds.push(...alvos.map((e) => ['SREM', 'aventura:chat:membros', e]));
        await redis(...cmds);
        users = users.filter((raw, i) => !alvos.includes(todos[i]));
        todos = todos.filter((e) => !alvos.includes(e));
      }
      // Marcar (ou desmarcar) uma conta como ADM, pelo nome
      adms = new Set(adms || []);
      if (body.action === 'admin-adm') {
        const i = users.findIndex((raw) => raw && JSON.parse(raw).nome === String(body.nome || ''));
        if (i < 0) return res.status(404).json({ error: 'Não achei esse usuário.' });
        if (body.adm) { await redis(['SADD', 'aventura:adm', todos[i]]); adms.add(todos[i]); }
        else { await redis(['SREM', 'aventura:adm', todos[i]]); adms.delete(todos[i]); }
      }
      // Conta de teste: some da caixa de amigos de todo mundo (só com o login da Base Secreta)
      if (body.action === 'admin-oculto') {
        const i = users.findIndex((raw) => raw && JSON.parse(raw).nome === String(body.nome || ''));
        if (i < 0) return res.status(404).json({ error: 'Não achei esse usuário.' });
        await redis([body.oculto ? 'SADD' : 'SREM', 'aventura:ocultos', todos[i]]);
      }
      // Convidar pro chat (ou tirar), pelo nome
      membros = new Set(membros || []);
      if (body.action === 'admin-chat') {
        const i = users.findIndex((raw) => raw && JSON.parse(raw).nome === String(body.nome || ''));
        if (i < 0) return res.status(404).json({ error: 'Não achei esse usuário.' });
        if (body.convidar) { await redis(['SADD', 'aventura:chat:membros', todos[i]]); membros.add(todos[i]); }
        else { await redis(['SREM', 'aventura:chat:membros', todos[i]]); membros.delete(todos[i]); }
      }
      const lista = users.map((raw, i) => { if (!raw) return null; const u = JSON.parse(raw); return { nome: u.nome, cor: u.cor || 'branco', chat: membros.has(todos[i]) || (adms.has(todos[i]) && admPeloNome(raw)), adm: adms.has(todos[i]) && admPeloNome(raw) }; })
        .filter(Boolean)
        .sort((a, b) => a.nome.localeCompare(b.nome));
      return res.status(200).json({ usuarios: lista });
    }

    const rawEmail = String(body.email || '').trim().toLowerCase().slice(0, 120);
    if (!EMAIL_OK.test(rawEmail)) return res.status(400).json({ error: 'E-mail inválido.' });
    const email = await emailDaConta(rawEmail);
    const action = body.action || 'salvar';

    // Sinal de "estou jogando" + lista de amigos (o jogo chama a cada pouco)
    if (action === 'online') {
      const [raw] = await redis(['GET', 'aventura:user:' + email]);
      if (!raw) return res.status(404).json({ error: 'Usuário não encontrado.' });
      const u = JSON.parse(raw);
      // Usuários de antes da lista de nomes entram nela aqui (se o nome ainda estiver livre)
      await redis(['ZADD', 'aventura:online', Date.now(), email], ['HSETNX', 'aventura:nomes', nomeKey(u.nome), email]);
      const adm = await ehAdm(email);
      return res.status(200).json({ jogadores: await listarJogadores(email), adm: !!adm });
    }

    // Chat de amigos (só convidados)
    if (action === 'chatLer' || action === 'chatEnviar') {
      const [membro, raw, marcado, oculto] = await redis(['SISMEMBER', 'aventura:chat:membros', email], ['GET', 'aventura:user:' + email],
        ['SISMEMBER', 'aventura:adm', email], ['SISMEMBER', 'aventura:ocultos', email]);
      const adm = !!marcado && admPeloNome(raw);
      if (!(membro || adm || oculto) || !raw) return res.status(200).json({ membro: false });
      // Conta de teste: tem um chat só dela, sem ninguém
      const sala = oculto ? 'aventura:chat:msgs:teste:' + email : 'aventura:chat:msgs';
      if (action === 'chatEnviar') {
        const texto = filtrar(body.texto);
        let gif = CHAT_GIFS.includes(body.gif) || GIFS_LOJA.includes(body.gif) ? body.gif : null;
        if (gif && GIFS_LOJA.includes(gif) && !adm) {
          const [save] = await redis(['GET', 'aventura:save:' + email]);
          const tem = save && ((JSON.parse(save).meta || {}).gifs || []).includes(gif);
          if (!tem) return res.status(403).json({ error: 'Esse GIF é da loja. Compre lá primeiro!' });
        }
        if (!texto && !gif) return res.status(400).json({ error: 'Mensagem vazia.' });
        const [ok] = await redis(['SET', 'aventura:chat:rl:' + email, '1', 'PX', 1200, 'NX']);
        if (!ok) return res.status(429).json({ error: 'Calma! Espera um pouquinho.' });
        const u = JSON.parse(raw);
        const [id] = await redis(['INCR', 'aventura:chat:id']);
        const msg = { id, nome: u.nome, cor: u.cor || 'branco', foto: u.foto || 'skin:gotinha', moldura: u.moldura || 'nenhuma', texto, gif, t: Date.now() };
        await redis(['RPUSH', sala, JSON.stringify(msg)], ['LTRIM', sala, -100, -1]);
      }
      const [lista, limpo] = await redis(['LRANGE', sala, 0, -1], ['GET', oculto ? 'aventura:chat:limpo:teste' : 'aventura:chat:limpo']);
      const desde = Number(body.desde) || 0;
      return res.status(200).json({ membro: true, limpo: Number(limpo) || 0, msgs: (lista || []).map((m) => JSON.parse(m)).filter((m) => m.id > desde) });
    }

    // ── Jogar junto: convite e "aperto de mão" entre os dois aparelhos (depois eles conversam direto) ──
    if (action === 'convidar') {
      const [eu, outro] = await redis(['GET', 'aventura:user:' + email], ['HGET', 'aventura:nomes', nomeKey(String(body.para || ''))]);
      if (!eu) return res.status(404).json({ error: 'Usuário não encontrado.' });
      if (!outro || outro === email) return res.status(404).json({ error: 'Não achei esse amigo.' });
      const sala = crypto.randomBytes(6).toString('hex');
      const me = JSON.parse(eu);
      await redis(['SET', 'aventura:convite:' + outro, JSON.stringify({ sala, de: me.nome, cor: me.cor || 'branco' }), 'EX', 45],
        ['SET', 'aventura:sala:' + sala + ':host', email, 'EX', 300]);
      return res.status(200).json({ sala });
    }
    if (action === 'convites') {
      const [raw] = await redis(['GET', 'aventura:convite:' + email]);
      return res.status(200).json({ convite: raw ? JSON.parse(raw) : null });
    }
    const salaOk = (v) => /^[0-9a-f]{12}$/.test(String(v || ''));
    if (action === 'responder') {
      if (!salaOk(body.sala)) return res.status(400).json({ error: 'Sala inválida.' });
      const cmds = [['DEL', 'aventura:convite:' + email]];
      if (!body.aceitar) cmds.push(['SET', 'aventura:sala:' + body.sala + ':recusado', '1', 'EX', 60]);
      await redis(...cmds);
      return res.status(200).json({ ok: true });
    }
    if (action === 'sinal' || action === 'lerSinal') {
      const tipo = body.tipo === 'offer' ? 'offer' : 'answer';
      if (!salaOk(body.sala)) return res.status(400).json({ error: 'Sala inválida.' });
      const key = 'aventura:sala:' + body.sala + ':' + tipo;
      if (action === 'sinal') {
        const sdp = String(body.sdp || '');
        if (!sdp || sdp.length > 20000) return res.status(400).json({ error: 'Sinal inválido.' });
        await redis(['SET', key, sdp, 'EX', 300]);
        return res.status(200).json({ ok: true });
      }
      const [sdp, recusado] = await redis(['GET', key], ['GET', 'aventura:sala:' + body.sala + ':recusado']);
      return res.status(200).json({ sdp: sdp || null, recusado: !!recusado });
    }

    // Progresso do jogo na nuvem: o mesmo e-mail em outro aparelho traz as mesmas gemas, personagens e fase
    if (action === 'salvarJogo') {
      const dados = body.dados;
      if (!dados || typeof dados !== 'object' || JSON.stringify(dados).length > 50000) return res.status(400).json({ error: 'Dados inválidos.' });
      const [exists, oldRaw] = await redis(['EXISTS', 'aventura:user:' + email], ['GET', 'aventura:save:' + email]);
      if (!exists) return res.status(404).json({ error: 'Usuário não encontrado.' });
      const juntou = protegerSave(dados, oldRaw ? JSON.parse(oldRaw) : null);
      await redis(['SET', 'aventura:save:' + email, JSON.stringify(dados)]);
      return res.status(200).json({ ok: true, juntou });
    }
    if (action === 'carregarJogo') {
      const [raw] = await redis(['GET', 'aventura:save:' + email]);
      return res.status(200).json({ dados: raw ? JSON.parse(raw) : null });
    }

    // Dominic FC: cartas, álbum, times e táticas da conta (o mesmo e-mail em todo aparelho)
    if (action === 'salvarFC') {
      const txt = JSON.stringify(body.dados || null);
      if (!body.dados || typeof body.dados !== 'object' || txt.length > 600000) return res.status(400).json({ error: 'Dados inválidos.' });
      const [exists] = await redis(['EXISTS', 'aventura:user:' + email]);
      if (!exists) return res.status(404).json({ error: 'Usuário não encontrado.' });
      await redis(['SET', 'aventura:fc:' + email, txt]);
      return res.status(200).json({ ok: true });
    }
    if (action === 'carregarFC') {
      const [raw] = await redis(['GET', 'aventura:fc:' + email]);
      return res.status(200).json({ dados: raw ? JSON.parse(raw) : null });
    }

    // Apagar o próprio usuário (sai da lista de nomes e de quem está online)
    if (action === 'apagar') {
      const [raw] = await redis(['GET', 'aventura:user:' + email]);
      if (!raw) return res.status(404).json({ error: 'Usuário não encontrado.' });
      const u = JSON.parse(raw);
      await redis(['DEL', 'aventura:user:' + email], ['DEL', 'aventura:save:' + email], ['SREM', 'aventura:users', email],
        ['HDEL', 'aventura:nomes', nomeKey(u.nome)], ['ZREM', 'aventura:online', email]);
      return res.status(200).json({ ok: true });
    }

    // Salvar usuário (e-mail, nome e cor do nome)
    const nome = String(body.nome || '').trim().slice(0, 40);
    const cor = CORES.includes(body.cor) ? body.cor : 'branco';
    const foto = /^(skin|bicho):[a-z]{1,20}$/.test(String(body.foto || '')) ? body.foto : 'skin:gotinha';
    const moldura = /^[a-z]{1,12}$/.test(String(body.moldura || '')) ? body.moldura : 'nenhuma';
    if (!nome) return res.status(400).json({ error: 'Falta o nome.' });

    // Evita alguém mandando milhares de cadastros
    const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'x';
    const rlKey = 'aventura:rl:' + ip;
    const [count] = await redis(['INCR', rlKey], ['EXPIRE', rlKey, 3600]);
    if (count > MAX_POR_HORA) return res.status(429).json({ error: 'Muitas tentativas. Tente mais tarde.' });

    const key = 'aventura:user:' + email;
    const [old, dono] = await redis(['GET', key], ['HGET', 'aventura:nomes', nomeKey(nome)]);
    if (dono && dono !== email) return res.status(409).json({ error: 'Esse nome já é de outra pessoa. Escolha outro!' });
    const prev = old ? JSON.parse(old) : null;
    const user = { email, nome, cor, foto, moldura, criado: prev ? prev.criado : Date.now(), atualizado: Date.now() };
    const cmds = [['SET', key, JSON.stringify(user)], ['SADD', 'aventura:users', email], ['HSET', 'aventura:nomes', nomeKey(nome), email]];
    if (prev && nomeKey(prev.nome) !== nomeKey(nome)) cmds.push(['HDEL', 'aventura:nomes', nomeKey(prev.nome)]);   // trocou de nome
    await redis(...cmds);
    return res.status(200).json({ ok: true, nome, novo: !prev });
  } catch (e) {
    return res.status(500).json({ error: 'Erro no servidor.' });
  }
};
