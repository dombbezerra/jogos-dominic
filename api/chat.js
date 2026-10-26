// Base Secreta — API do chat entre Felipe e Dominique.
// Guarda as mensagens num Redis (Upstash) conectado ao projeto no Vercel.
const crypto = require('crypto');

const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const SECRET = process.env.CHAT_SECRET || REDIS_TOKEN || '';

const MAX_MSGS = 1000;
const MAX_LEN = 2000;
const TOKEN_DAYS = 60;

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

// As senhas ficam só nas variáveis de ambiente do Vercel, nunca no código
const hashEnv = (k) => (process.env[k] ? sha256(process.env[k]) : '');
const USERS = {
  felipe: { name: 'Felipe', hash: hashEnv('CHAT_SENHA_FELIPE') },
  dominique: { name: 'Dominique', hash: hashEnv('CHAT_SENHA_DOMINIQUE') },
};
USERS.dominic = USERS.dominique;

const hmac = (s) => crypto.createHmac('sha256', SECRET).update(s).digest('hex');

function safeEqual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

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

function makeToken(user) {
  const exp = Date.now() + TOKEN_DAYS * 864e5;
  const body = user + '.' + exp;
  return body + '.' + hmac(body);
}

function checkToken(token) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) return null;
  const [user, exp, sig] = parts;
  if (!USERS[user] || Number(exp) < Date.now()) return null;
  return safeEqual(sig, hmac(user + '.' + exp)) ? USERS[user].name : null;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex');
  if (!REDIS_URL || !REDIS_TOKEN) {
    return res.status(503).json({ error: 'Banco de dados não configurado no Vercel.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const action = req.method === 'GET' ? 'poll' : body.action;
    const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'x';

    if (action === 'login') {
      const failKey = 'chat:fail:' + ip;
      const [fails] = await redis(['GET', failKey]);
      if (Number(fails) >= 8) {
        return res.status(429).json({ error: 'Muitas tentativas. Espere 15 minutos.' });
      }
      const key = String(body.name || '').trim().toLowerCase();
      const u = USERS[key];
      if (!u || !u.hash || !safeEqual(sha256(String(body.password || '')), u.hash)) {
        await redis(['INCR', failKey], ['EXPIRE', failKey, 900]);
        return res.status(401).json({ error: 'Nome ou senha errados.' });
      }
      await redis(['DEL', failKey]);
      const id = u.name.toLowerCase();
      return res.status(200).json({ token: makeToken(id), name: u.name });
    }

    const auth = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    const me = checkToken(auth);
    if (!me) return res.status(401).json({ error: 'Sessão expirada. Entre de novo.' });

    if (action === 'send') {
      const text = String(body.text || '').trim().slice(0, MAX_LEN);
      if (!text) return res.status(400).json({ error: 'Mensagem vazia.' });
      const [id] = await redis(['INCR', 'chat:seq']);
      const msg = { id, from: me, text, ts: Date.now() };
      await redis(['RPUSH', 'chat:msgs', JSON.stringify(msg)], ['LTRIM', 'chat:msgs', -MAX_MSGS, -1]);
      return res.status(200).json({ message: msg });
    }

    if (action === 'poll') {
      const since = Number((req.query && req.query.since) || body.since || 0);
      const [seq] = await redis(['GET', 'chat:seq']);
      const last = Number(seq || 0);
      if (last <= since) return res.status(200).json({ messages: [], last, me });
      const [raw] = await redis(['LRANGE', 'chat:msgs', 0, -1]);
      const messages = raw.map((s) => JSON.parse(s)).filter((m) => m.id > since);
      return res.status(200).json({ messages, last, me });
    }

    return res.status(400).json({ error: 'Ação inválida.' });
  } catch (e) {
    return res.status(500).json({ error: 'Erro no servidor.' });
  }
};
