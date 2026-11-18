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
// Foto do chat: um emoji desta lista ou um emoji montado no Monta Emoji
const FOTOS_CHAT = ['😀', '😎', '🤩', '😜', '🥳', '😇', '🤠', '👻', '🤖', '👽', '😈', '🤡', '🐶', '🐱', '🦊', '🐼', '🐸', '🦁', '🐯', '🐵',
  '🦄', '🐲', '🦖', '🐙', '🦈', '⚽', '🏆', '🎮', '🚀', '⭐', '🔥', '💎', '👑', '🌈', '⚡', '🍕', '🍩', '🎃', '❄️', '💀'];
function limparFotoChat(f) {
  if (!f || typeof f !== 'object') return null;
  if (FOTOS_CHAT.includes(f.e)) return { e: f.e };
  const m = limparEmoji(f.m);
  return m ? { m } : null;
}
// Emoji do Monta Emoji (figurinha): só os nomes das partes, cada um curtinho
const PARTES_EMOJI = ['rosto', 'olhos', 'nariz', 'boca', 'sobrancelha', 'cabelo', 'chapeu', 'maos'];
function limparEmoji(e) {
  if (!e || typeof e !== 'object') return null;
  const ok = (v) => typeof v === 'string' && /^[a-z0-9-]{1,24}$/.test(v);
  const out = {};
  for (const k of PARTES_EMOJI) if (ok(e[k])) out[k] = e[k];
  out.extras = Array.isArray(e.extras) ? e.extras.filter(ok).slice(0, 50) : [];
  return out.rosto ? out : null;
}
// ── Notificação de mensagem nova no celular (Web Push, o mesmo jeito do api/push.js) ──
// O aviso vai sem texto; o celular acorda e busca a mensagem na fila dele (api/push.js ?ultima=1&ep=...)
const b64url = (buf) => Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
function vapidKeys() {
  const ecdh = crypto.createECDH('prime256v1');
  ecdh.setPrivateKey(crypto.createHmac('sha256', SECRET).update('vapid-v1').digest());
  const pub = ecdh.getPublicKey();
  const key = crypto.createPrivateKey({
    format: 'jwk',
    key: { kty: 'EC', crv: 'P-256', d: b64url(ecdh.getPrivateKey()), x: b64url(pub.subarray(1, 33)), y: b64url(pub.subarray(33)) },
  });
  return { pub: b64url(pub), key };
}
async function pushTo(endpoint, vapid) {
  const aud = new URL(endpoint).origin;
  const head = b64url(JSON.stringify({ typ: 'JWT', alg: 'ES256' }));
  const body = b64url(JSON.stringify({ aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: 'https://jogos-dominic.vercel.app' }));
  const sig = crypto.sign('sha256', Buffer.from(head + '.' + body), { key: vapid.key, dsaEncoding: 'ieee-p1363' });
  const r = await fetch(endpoint, {
    method: 'POST',
    headers: { TTL: '86400', Urgency: 'high', Authorization: `vapid t=${head}.${body}.${b64url(sig)}, k=${vapid.pub}`, 'Content-Length': '0' },
  });
  return r.status;
}
const filaAviso = (endpoint) => 'push:para:' + crypto.createHash('sha256').update(endpoint).digest('hex').slice(0, 32);
// Avisa os celulares dessas pessoas (se der erro, a mensagem já foi mandada do mesmo jeito)
async function avisarChat(emails, aviso) {
  try {
    if (!emails.length) return;
    const listas = await redis(...emails.map((e) => ['SMEMBERS', 'aventura:chat:subs:' + e]));
    const alvos = [];
    emails.forEach((e, i) => (listas[i] || []).forEach((ep) => alvos.push([e, ep])));
    if (!alvos.length) return;
    const msg = JSON.stringify({ ...aviso, quando: Date.now() });
    await redis(...alvos.flatMap(([, ep]) => [['RPUSH', filaAviso(ep), msg], ['LTRIM', filaAviso(ep), -5, -1], ['EXPIRE', filaAviso(ep), 3600]]));
    const vapid = vapidKeys();
    const mortos = [];
    await Promise.all(alvos.map(async ([e, ep]) => {
      try { const st = await pushTo(ep, vapid); if (st === 404 || st === 410) mortos.push(['SREM', 'aventura:chat:subs:' + e, ep]); } catch (err) { /* um celular com erro não para os outros */ }
    }));
    if (mortos.length) await redis(...mortos);
  } catch (err) { /* sem aviso, tudo bem */ }
}

// Ligação de voz: os tipos de recado que um aparelho manda pro outro
const SINAIS = ['liga', 'aceita', 'recusa', 'atendida', 'ocupado', 'oferta', 'resposta', 'desliga'];
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
// Troca palavrão por ***, e não deixa passar telefone, e-mail nem endereço (link pode)
const palavrao = (w) => { const n = juntar(semAcento(w)); return PALAVROES_J.some((p) => n === p || n === p + 's'); };   // "merdaaa" vira "merda"
function filtrar(texto) {
  let t = String(texto || '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, 300);
  // Links podem passar (o chat pergunta antes de abrir): guarda eles à parte pra os filtros abaixo não estragarem
  const links = [];
  t = t.replace(/(?:https?:\/\/|www\.)\S+|\S+\.(?:com|br|net|org|gg|me|io|tv|app)\b\S*/gi, (l) => { links.push(l); return '\u0001' + (links.length - 1) + '\u0001'; });
  t = t.replace(/(?:\d[\s.\-()]*){7,}/g, '🚫');                                   // telefone
  t = t.replace(/\S+@\S+/g, '🚫');                                                  // e-mail
  t = t.replace(/\b(rua|avenida|av\.|endere[cç]o|whats\S*|zap|insta\S*|tiktok|telefone|celular|cpf|senha)\b/gi, '🚫');
  t = t.replace(/[\p{L}\p{N}]+/gu, (w) => (palavrao(w) ? '*'.repeat(w.length) : w));
  // link com e-mail ou palavrão continua bloqueado
  return t.replace(/\u0001(\d+)\u0001/g, (_, i) => {
    const l = links[i];
    return /@/.test(l) || (l.match(/[\p{L}\p{N}]+/gu) || []).some(palavrao) ? '🚫' : l;
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
const NOMES_ADM = ['endrick', 'dominic'];   // o Dominic (a conta também precisa estar marcada como ADM)
const admPeloNome = (raw) => !!raw && NOMES_ADM.includes(nomeKey(JSON.parse(raw).nome));

// Contatos do chat: quem foi convidado + os ADMs (contas de teste escondidas ficam de fora)
// Cada um tem um número só do chat, pra ninguém ver o e-mail dos outros
const idChat = (email) => crypto.createHmac('sha256', SECRET).update('chat:' + email).digest('hex').slice(0, 12);
// Quem o Dominic tirou de todos os chats (pelo nome da conta ou do chat)
const FORA_DO_CHAT = ['endrick', 'endrik'];
const foraPeloNome = (raw) => { const u = JSON.parse(raw); return FORA_DO_CHAT.includes(nomeKey(u.nome || '')) || FORA_DO_CHAT.includes(nomeKey(u.nomeChat || '')); };
const cmdsFora = () => [['HMGET', 'aventura:nomes', ...FORA_DO_CHAT], ['HMGET', 'aventura:nomesChat', ...FORA_DO_CHAT]];
const juntaFora = (a, b) => new Set([...(a || []), ...(b || [])].filter(Boolean));
async function contatosChat() {
  const [membros, adms, ocultos, fora1, fora2] = await redis(['SMEMBERS', 'aventura:chat:membros'], ['SMEMBERS', 'aventura:adm'], ['SMEMBERS', 'aventura:ocultos'], ...cmdsFora());
  const fora = juntaFora(fora1, fora2);
  const oc = new Set([...(ocultos || []), ...fora]), convidado = new Set(membros || []);
  const emails = [...new Set([...(membros || []), ...(adms || [])])].filter((e) => !oc.has(e));
  const raws = emails.length ? await redis(...emails.map((e) => ['GET', 'aventura:user:' + e])) : [];
  return emails.map((e, i) => ({ email: e, raw: raws[i] })).filter((c) => c.raw && !foraPeloNome(c.raw) && (convidado.has(c.email) || admPeloNome(c.raw)));
}
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
        const amigos = body.sala === 'amigos';   // a sala do App de Amigos apaga só ela
        await redis(['DEL', amigos ? 'aventura:chat:amigos:msgs' : 'aventura:chat:msgs'], ['SET', amigos ? 'aventura:chat:amigos:limpo' : 'aventura:chat:limpo', Number(ultimo) || 0]);
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
    if (action === 'chatLer' || action === 'chatEnviar' || action === 'chatAudio' || action === 'chatFoto' || action === 'chatSinal' || action === 'chatContatos' || action === 'chatAvisos') {
      const [membro, raw, marcado, oculto, fora1, fora2] = await redis(['SISMEMBER', 'aventura:chat:membros', email], ['GET', 'aventura:user:' + email],
        ['SISMEMBER', 'aventura:adm', email], ['SISMEMBER', 'aventura:ocultos', email], ...cmdsFora());
      const adm = !!marcado && admPeloNome(raw);
      if (!(membro || adm || oculto) || !raw) return res.status(200).json({ membro: false });
      if (juntaFora(fora1, fora2).has(email) || foraPeloNome(raw)) return res.status(200).json({ membro: false });
      // Conta de teste: tem um chat só dela, sem ninguém
      // Sala do App de Amigos: conversa separada da Base Secreta
      const amigos = body.sala === 'amigos';
      const sala = oculto ? 'aventura:chat:msgs:teste:' + email : amigos ? 'aventura:chat:amigos:msgs' : 'aventura:chat:msgs';
      // Conversa só entre dois amigos (no App de Amigos)
      const meuId = idChat(email);
      let conversa = sala, outro = null;
      if (body.com && amigos && !oculto) {
        outro = (await contatosChat()).find((c) => idChat(c.email) === String(body.com));
        if (!outro) return res.status(404).json({ error: 'Esse amigo não está mais no chat.' });
        conversa = 'aventura:chat:amigos:dm:' + [meuId, idChat(outro.email)].sort().join(':');
      }
      // Ligar os avisos: guarda este celular na conta (até 5 celulares)
      if (action === 'chatAvisos') {
        const endpoint = String((body.sub && body.sub.endpoint) || '');
        if (!/^https:\/\//.test(endpoint) || endpoint.length > 1000) return res.status(400).json({ error: 'Não deu pra ligar os avisos.' });
        const chave = 'aventura:chat:subs:' + email;
        const [antes] = await redis(['SMEMBERS', chave]);
        const velhos = (antes || []).filter((x) => x !== endpoint);
        const cmds = [['SADD', chave, endpoint]];
        if (velhos.length >= 5) cmds.push(['SREM', chave, ...velhos.slice(0, velhos.length - 4)]);
        await redis(...cmds);
        return res.status(200).json({ ok: true });
      }
      if (action === 'chatContatos') {
        const contatos = amigos && !oculto ? (await contatosChat()).filter((c) => c.email !== email).map((c) => {
          const u = JSON.parse(c.raw);
          return { id: idChat(c.email), nome: u.nomeChat || u.nome, cor: u.cor || 'branco', fotoChat: u.fotoChat || null };
        }) : [];
        return res.status(200).json({ membro: true, eu: meuId, contatos });
      }
      // Ver uma foto do chat (fica guardada 30 dias)
      if (action === 'chatFoto') {
        const id = String(body.id || '');
        if (!/^[a-z0-9]{6,40}$/.test(id)) return res.status(400).json({ error: 'Foto inválida.' });
        const [f] = await redis(['GET', 'aventura:chat:foto:' + id]);
        if (!f) return res.status(404).json({ error: 'Essa foto já sumiu.' });
        return res.status(200).json(JSON.parse(f));
      }
      // Ligação: os recados entre os aparelhos (quem liga, quem atende...) ficam 2 minutos na sala
      if (action === 'chatSinal') {
        const tipo = String(body.tipo || '');
        if (!SINAIS.includes(tipo)) return res.status(400).json({ error: 'Sinal inválido.' });
        const u = JSON.parse(raw);
        const sinal = { de: String(body.cliente || '').slice(0, 20), para: body.para ? String(body.para).slice(0, 20) : null, tipo,
          paraAmigo: body.paraAmigo ? String(body.paraAmigo).slice(0, 20) : null,
          dados: body.dados == null ? null : String(body.dados).slice(0, 20000), nome: u.nomeChat || u.nome, t: Date.now() };
        const [n] = await redis(['INCR', 'aventura:chat:sinal:id']);
        await redis(['RPUSH', sala + ':sinais', JSON.stringify({ n, ...sinal })], ['LTRIM', sala + ':sinais', -60, -1], ['EXPIRE', sala + ':sinais', 120]);
        return res.status(200).json({ ok: true, n });
      }
      // Ouvir um áudio do chat (fica guardado 7 dias)
      if (action === 'chatAudio') {
        const id = String(body.id || '');
        if (!/^[a-z0-9]{6,40}$/.test(id)) return res.status(400).json({ error: 'Áudio inválido.' });
        const [a] = await redis(['GET', 'aventura:chat:audio:' + id]);
        if (!a) return res.status(404).json({ error: 'Esse áudio já sumiu.' });
        return res.status(200).json(JSON.parse(a));
      }
      if (action === 'chatEnviar') {
        const texto = filtrar(body.texto);
        let gif = CHAT_GIFS.includes(body.gif) || GIFS_LOJA.includes(body.gif) ? body.gif : null;
        if (gif && GIFS_LOJA.includes(gif) && !adm) {
          const [save] = await redis(['GET', 'aventura:save:' + email]);
          const tem = save && ((JSON.parse(save).meta || {}).gifs || []).includes(gif);
          if (!tem) return res.status(403).json({ error: 'Esse GIF é da loja. Compre lá primeiro!' });
        }
        const emoji = limparEmoji(body.emoji);   // figurinha do Monta Emoji
        // Foto: já vem pequena do aparelho (JPEG), guardada à parte por 30 dias
        let foto = null;
        if (body.foto && typeof body.foto === 'object') {
          const dados = String(body.foto.dados || '');
          if (!/^[A-Za-z0-9+/=]+$/.test(dados) || dados.length > 700000) return res.status(400).json({ error: 'Foto muito grande ou inválida.' });
          const lado = (v) => Math.max(1, Math.min(4000, Math.round(Number(v) || 1)));
          foto = { id: crypto.randomBytes(9).toString('hex'), w: lado(body.foto.w), h: lado(body.foto.h) };
          await redis(['SET', 'aventura:chat:foto:' + foto.id, JSON.stringify({ dados, tipo: 'image/jpeg' }), 'EX', 30 * 24 * 3600]);
        }
        // Áudio: até 20 segundos, guardado à parte (a mensagem só leva o número dele)
        let audio = null;
        if (body.audio && typeof body.audio === 'object') {
          const dados = String(body.audio.dados || ''), tipo = String(body.audio.tipo || '');
          if (!/^audio\/(webm|mp4|ogg|mpeg|aac)/.test(tipo) || !/^[A-Za-z0-9+/=]+$/.test(dados) || dados.length > 600000) return res.status(400).json({ error: 'Áudio muito grande ou inválido.' });
          audio = { id: crypto.randomBytes(9).toString('hex'), dur: Math.max(1, Math.min(20, Math.round(Number(body.audio.dur) || 1))) };
          await redis(['SET', 'aventura:chat:audio:' + audio.id, JSON.stringify({ dados, tipo }), 'EX', 7 * 24 * 3600]);
        }
        if (!texto && !gif && !emoji && !audio && !foto) return res.status(400).json({ error: 'Mensagem vazia.' });
        const [ok] = await redis(['SET', 'aventura:chat:rl:' + email, '1', 'PX', 1200, 'NX']);
        if (!ok) return res.status(429).json({ error: 'Calma! Espera um pouquinho.' });
        const u = JSON.parse(raw);
        const [id] = await redis(['INCR', 'aventura:chat:id']);
        const msg = { id, nome: u.nomeChat || u.nome, cor: u.cor || 'branco', foto: u.foto || 'skin:gotinha', moldura: u.moldura || 'nenhuma', fotoChat: u.fotoChat || null, texto, gif, emoji, audio, imagem: foto, t: Date.now() };
        await redis(['RPUSH', conversa, JSON.stringify(msg)], ['LTRIM', conversa, -100, -1]);
        // Notificação pra quem está na conversa (menos quem mandou). Conta de teste não avisa ninguém
        if (!oculto) {
          const para = outro ? [outro.email] : (await contatosChat()).map((c) => c.email).filter((e) => e !== email);
          const resumo = texto || (foto ? '📷 Foto' : audio ? '🎤 Áudio' : '😀 Figurinha');
          await avisarChat(para, {
            titulo: outro ? msg.nome : amigos ? '💬 App de Amigos' : '💬 Chat de Amigos',
            texto: outro ? resumo : msg.nome + ': ' + resumo,
            url: '/chat/' + (amigos ? '?sala=amigos' + (outro ? '&com=' + meuId : '') : ''),
          });
        }
      }
      const chaveLimpo = conversa !== sala ? conversa + ':limpo' : oculto ? 'aventura:chat:limpo:teste' : amigos ? 'aventura:chat:amigos:limpo' : 'aventura:chat:limpo';
      const [lista, limpo, sinais, sinalUltimo] = await redis(['LRANGE', conversa, 0, -1], ['GET', chaveLimpo],
        ['LRANGE', sala + ':sinais', 0, -1], ['GET', 'aventura:chat:sinal:id']);
      const desde = Number(body.desde) || 0;
      // Recados de ligação pra este aparelho (na primeira olhada só pega o número, pra não tocar ligação velha)
      const cliente = String(body.cliente || ''), sinalDesde = Number(body.sinalDesde) || 0;
      const meus = cliente && sinalDesde ? (sinais || []).map((x) => JSON.parse(x)).filter((x) => x.n > sinalDesde && x.de !== cliente && (!x.para || x.para === cliente) && (!x.paraAmigo || x.paraAmigo === meuId)) : [];
      return res.status(200).json({ membro: true, limpo: Number(limpo) || 0, msgs: (lista || []).map((m) => JSON.parse(m)).filter((m) => m.id > desde),
        sinais: meus, sinalUltimo: Number(sinalUltimo) || 0 });
    }

    // Foto do chat (escolhida no PERSONALIZAR do chat)
    if (action === 'fotoChat') {
      const [raw] = await redis(['GET', 'aventura:user:' + email]);
      if (!raw) return res.status(404).json({ error: 'Usuário não encontrado.' });
      const u = JSON.parse(raw);
      if (!body.ler) {   // ler: só devolve a foto e o nome de agora
        u.fotoChat = limparFotoChat(body.fotoChat);
        const cmds = [];
        // Nome só do chat (a conta continua com o nome dela; o ADM continua ADM)
        if (typeof body.nomeChat === 'string') {
          const novo = filtrar(body.nomeChat).trim().slice(0, 20);
          const k = novo ? nomeKey(novo) : '';
          if (k && k !== nomeKey(u.nome)) {
            const [dono1, dono2] = await redis(['HGET', 'aventura:nomes', k], ['HGET', 'aventura:nomesChat', k]);
            if ((dono1 && dono1 !== email) || (dono2 && dono2 !== email)) return res.status(409).json({ error: 'Esse nome já é de outra pessoa. Escolha outro!' });
          }
          if (u.nomeChat && nomeKey(u.nomeChat) !== k) cmds.push(['HDEL', 'aventura:nomesChat', nomeKey(u.nomeChat)]);
          if (k && k !== nomeKey(u.nome)) { u.nomeChat = novo; cmds.push(['HSET', 'aventura:nomesChat', k, email]); }
          else delete u.nomeChat;
        }
        cmds.push(['SET', 'aventura:user:' + email, JSON.stringify(u)]);
        await redis(...cmds);
      }
      return res.status(200).json({ ok: true, fotoChat: u.fotoChat, cor: u.cor || 'branco', nome: u.nome, nomeChat: u.nomeChat || null });
    }

    // Figurinhas: os emojis do Monta Emoji que a pessoa guardou pra mandar no chat (até 40, a mais nova primeiro)
    if (action === 'figurinhas') {
      const [raw, lista] = await redis(['GET', 'aventura:user:' + email], ['GET', 'aventura:figurinhas:' + email]);
      if (!raw) return res.status(404).json({ error: 'Usuário não encontrado.' });
      let figs = lista ? JSON.parse(lista) : [];
      let mudou = false;
      const nova = limparEmoji(body.salvar);
      if (nova) { figs.unshift(nova); figs = figs.slice(0, 40); mudou = true; }
      const tira = Number(body.apagar);
      if (body.apagar != null && tira >= 0 && tira < figs.length) { figs.splice(tira, 1); mudou = true; }
      if (mudou) await redis(['SET', 'aventura:figurinhas:' + email, JSON.stringify(figs)]);
      return res.status(200).json({ figurinhas: figs });
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
      const dados = body.dados;
      if (!dados || typeof dados !== 'object' || JSON.stringify(dados).length > 600000) return res.status(400).json({ error: 'Dados inválidos.' });
      const [exists, oldRaw] = await redis(['EXISTS', 'aventura:user:' + email], ['GET', 'aventura:fc:' + email]);
      if (!exists) return res.status(404).json({ error: 'Usuário não encontrado.' });
      // Nenhum jogador do álbum some (só os marcados em removedKeys): um aparelho atrasado não apaga nada
      const old = oldRaw ? JSON.parse(oldRaw) : null;
      if (old && Array.isArray(old.custom)) {
        const removed = new Set([...(old.removedKeys || []), ...(dados.removedKeys || [])]);
        const byKey = new Map();
        for (const c of old.custom) byKey.set(c.key, c);
        for (const c of dados.custom || []) byKey.set(c.key, c);
        dados.custom = [...byKey.values()].filter((c) => !removed.has(c.key));
        dados.removedKeys = [...removed];
        for (const k of ['clubs', 'tactics', 'tactic', 'renames', 'myClub']) if (dados[k] == null && old[k] != null) dados[k] = old[k];
      }
      // Cada nome é um jogo (outros): um aparelho atrasado não apaga o jogo dos outros nomes
      if (old) {
        const ch = (n) => String(n || '').trim().toLowerCase();
        const outros = Object.assign({}, old.outros || {}, dados.outros || {});
        if (old.nome && ch(old.nome) !== ch(dados.nome) && !(dados.outros && dados.outros[ch(old.nome)])) {
          const antigo = Object.assign({}, old);
          delete antigo.outros;
          outros[ch(old.nome)] = antigo;
        }
        delete outros[ch(dados.nome)];
        if (Object.keys(outros).length) dados.outros = outros;
      }
      await redis(['SET', 'aventura:fc:' + email, JSON.stringify(dados)]);
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
    if (prev && prev.fotoChat) user.fotoChat = prev.fotoChat;   // a foto e o nome do chat continuam
    if (prev && prev.nomeChat) user.nomeChat = prev.nomeChat;
    const cmds = [['SET', key, JSON.stringify(user)], ['SADD', 'aventura:users', email], ['HSET', 'aventura:nomes', nomeKey(nome), email]];
    if (prev && nomeKey(prev.nome) !== nomeKey(nome)) cmds.push(['HDEL', 'aventura:nomes', nomeKey(prev.nome)]);   // trocou de nome
    await redis(...cmds);
    return res.status(200).json({ ok: true, nome, novo: !prev });
  } catch (e) {
    return res.status(500).json({ error: 'Erro no servidor.' });
  }
};
