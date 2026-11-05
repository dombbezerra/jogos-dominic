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

const ONLINE_SECS = 75;   // sem sinal por mais que isso, a pessoa sai do "online"
const nomeKey = (n) => n.trim().toLowerCase();

// Todo mundo que tem usuário, com quem está jogando agora primeiro (sem precisar adicionar).
// Só nome, cor e online: o e-mail dos outros nunca sai daqui
async function listarJogadores(email) {
  const now = Date.now();
  const [, onlineEmails, todos] = await redis(['ZREMRANGEBYSCORE', 'aventura:online', 0, now - ONLINE_SECS * 1000],
    ['ZRANGE', 'aventura:online', 0, -1], ['SMEMBERS', 'aventura:users']);
  const on = new Set(onlineEmails || []);
  const outros = (todos || []).filter((e) => e !== email).slice(0, 80);
  if (!outros.length) return [];
  const users = await redis(...outros.map((e) => ['GET', 'aventura:user:' + e]));
  return outros.map((e, i) => {
    if (!users[i]) return null;
    const u = JSON.parse(users[i]);
    return { nome: u.nome, cor: u.cor || 'branco', foto: u.foto || 'skin:gotinha', online: on.has(e) };
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
    if (body.action === 'admin-lista' || body.action === 'admin-apagar') {
      if (!isAdmin(req)) return res.status(401).json({ error: 'Entre com o login da Base Secreta.' });
      let [todos] = await redis(['SMEMBERS', 'aventura:users']);
      let users = (todos || []).length ? await redis(...todos.map((e) => ['GET', 'aventura:user:' + e])) : [];
      if (body.action === 'admin-apagar') {
        // Procura pelo nome exato em todos (usuários antigos podem não estar na lista de nomes)
        const nome = String(body.nome || '');
        const alvos = todos.filter((e, i) => users[i] && JSON.parse(users[i]).nome === nome);
        if (!alvos.length) return res.status(404).json({ error: 'Não achei esse usuário.' });
        const [dono] = await redis(['HGET', 'aventura:nomes', nomeKey(nome)]);
        const cmds = alvos.flatMap((e) => [['DEL', 'aventura:user:' + e], ['DEL', 'aventura:save:' + e], ['SREM', 'aventura:users', e], ['ZREM', 'aventura:online', e]]);
        if (alvos.includes(dono)) cmds.push(['HDEL', 'aventura:nomes', nomeKey(nome)]);
        await redis(...cmds);
        users = users.filter((raw, i) => !alvos.includes(todos[i]));
      }
      const lista = users.filter(Boolean).map((raw) => { const u = JSON.parse(raw); return { nome: u.nome, cor: u.cor || 'branco' }; })
        .sort((a, b) => a.nome.localeCompare(b.nome));
      return res.status(200).json({ usuarios: lista });
    }

    const email = String(body.email || '').trim().toLowerCase().slice(0, 120);
    if (!EMAIL_OK.test(email)) return res.status(400).json({ error: 'E-mail inválido.' });
    const action = body.action || 'salvar';

    // Sinal de "estou jogando" + lista de amigos (o jogo chama a cada pouco)
    if (action === 'online') {
      const [raw] = await redis(['GET', 'aventura:user:' + email]);
      if (!raw) return res.status(404).json({ error: 'Usuário não encontrado.' });
      const u = JSON.parse(raw);
      // Usuários de antes da lista de nomes entram nela aqui (se o nome ainda estiver livre)
      await redis(['ZADD', 'aventura:online', Date.now(), email], ['HSETNX', 'aventura:nomes', nomeKey(u.nome), email]);
      return res.status(200).json({ jogadores: await listarJogadores(email) });
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
      const txt = JSON.stringify(dados || null);
      if (!dados || typeof dados !== 'object' || txt.length > 50000) return res.status(400).json({ error: 'Dados inválidos.' });
      const [exists] = await redis(['EXISTS', 'aventura:user:' + email]);
      if (!exists) return res.status(404).json({ error: 'Usuário não encontrado.' });
      await redis(['SET', 'aventura:save:' + email, txt]);
      return res.status(200).json({ ok: true });
    }
    if (action === 'carregarJogo') {
      const [raw] = await redis(['GET', 'aventura:save:' + email]);
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
    const user = { email, nome, cor, foto, criado: prev ? prev.criado : Date.now(), atualizado: Date.now() };
    const cmds = [['SET', key, JSON.stringify(user)], ['SADD', 'aventura:users', email], ['HSET', 'aventura:nomes', nomeKey(nome), email]];
    if (prev && nomeKey(prev.nome) !== nomeKey(nome)) cmds.push(['HDEL', 'aventura:nomes', nomeKey(prev.nome)]);   // trocou de nome
    await redis(...cmds);
    return res.status(200).json({ ok: true, nome, novo: !prev });
  } catch (e) {
    return res.status(500).json({ error: 'Erro no servidor.' });
  }
};
