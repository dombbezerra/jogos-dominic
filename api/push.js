// Notificações de "jogo novo" no celular (Web Push).
// GET  ?chave=1          → chave pública pro navegador se inscrever
// GET  ?ultima=1         → última mensagem (o service worker busca quando chega o aviso)
// GET  ?status=1         → quantos aparelhos ligaram os avisos (só o número)
// POST {action:'inscrever', sub}            → guarda o aparelho que permitiu
// POST {action:'enviar', titulo, texto, url} → manda pra todos (pela página /avisos/, com o login da Base Secreta)
const crypto = require('crypto');

const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const SECRET = process.env.CHAT_SECRET || REDIS_TOKEN || '';
const SUBS_KEY = 'push:subs';
const LAST_KEY = 'push:ultima';

const hmac = (s) => crypto.createHmac('sha256', SECRET).update(s).digest('hex');
const b64url = (buf) => Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

// Chave VAPID tirada do segredo que já existe no Vercel (não precisa configurar nada novo)
function vapidKeys() {
  const ecdh = crypto.createECDH('prime256v1');
  ecdh.setPrivateKey(crypto.createHmac('sha256', SECRET).update('vapid-v1').digest());
  const pub = ecdh.getPublicKey();   // 65 bytes: 0x04 + x + y
  const key = crypto.createPrivateKey({
    format: 'jwk',
    key: { kty: 'EC', crv: 'P-256', d: b64url(ecdh.getPrivateKey()), x: b64url(pub.subarray(1, 33)), y: b64url(pub.subarray(33)) },
  });
  return { pub: b64url(pub), key };
}

// Login da Base Secreta (o mesmo token do chat). Renova a cada envio, pra não pedir senha de novo
function freshToken(userKey) {
  const exp = Date.now() + 365 * 864e5;
  const body = userKey + '.' + exp;
  return body + '.' + hmac(body);
}
const CHAT_USERS = { felipe: 'Felipe', dominique: 'Dominic', dominic: 'Dominic' };
function checkToken(token) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) return null;
  const [user, exp, sig] = parts;
  if (!CHAT_USERS[user] || Number(exp) < Date.now()) return null;
  const want = Buffer.from(hmac(user + '.' + exp)), got = Buffer.from(sig);
  return want.length === got.length && crypto.timingSafeEqual(want, got) ? CHAT_USERS[user] : null;
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

// Avisa um aparelho (sem conteúdo: o celular acorda e busca a mensagem em ?ultima=1)
async function pushTo(endpoint, vapid) {
  const aud = new URL(endpoint).origin;
  const head = b64url(JSON.stringify({ typ: 'JWT', alg: 'ES256' }));
  const body = b64url(JSON.stringify({ aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: 'https://jogos-dominic.vercel.app' }));
  const sig = crypto.sign('sha256', Buffer.from(head + '.' + body), { key: vapid.key, dsaEncoding: 'ieee-p1363' });
  const jwt = head + '.' + body + '.' + b64url(sig);
  const r = await fetch(endpoint, {
    method: 'POST',
    headers: { TTL: '86400', Urgency: 'normal', Authorization: `vapid t=${jwt}, k=${vapid.pub}`, 'Content-Length': '0' },
  });
  return r.status;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!REDIS_URL || !REDIS_TOKEN) return res.status(503).json({ error: 'Banco de dados não configurado no Vercel.' });
  try {
    if (req.method === 'GET') {
      if (req.query && req.query.chave) return res.status(200).json({ chave: vapidKeys().pub });
      if (req.query && req.query.status) { const [n] = await redis(['SCARD', SUBS_KEY]); return res.status(200).json({ aparelhos: n || 0 }); }
      const [last] = await redis(['GET', LAST_KEY]);
      return res.status(200).json(last ? JSON.parse(last) : { titulo: 'Jogos do Dominic', texto: 'Tem novidade nos jogos!', url: '/' });
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};

    if (body.action === 'inscrever') {
      const sub = body.sub || {};
      const endpoint = String(sub.endpoint || '');
      if (!/^https:\/\//.test(endpoint) || endpoint.length > 1000) return res.status(400).json({ error: 'Inscrição inválida.' });
      await redis(['SADD', SUBS_KEY, endpoint]);
      return res.status(200).json({ ok: true });
    }

    if (body.action === 'enviar') {
      const auth = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
      const quem = checkToken(auth);
      if (!quem) return res.status(401).json({ error: 'Só o Felipe e o Dominic podem enviar avisos.' });
      const token = freshToken(auth.split('.')[0]);
      const msg = {
        titulo: String(body.titulo || 'Jogos do Dominic').slice(0, 60),
        texto: String(body.texto || 'Tem jogo novo! Vem jogar 🎮').slice(0, 200),
        url: String(body.url || '/').slice(0, 200),
        quando: Date.now(),
      };
      await redis(['SET', LAST_KEY, JSON.stringify(msg)]);
      const [subs] = await redis(['SMEMBERS', SUBS_KEY]);
      const vapid = vapidKeys();
      let ok = 0;
      const dead = [];
      await Promise.all((subs || []).map(async (ep) => {
        try {
          const st = await pushTo(ep, vapid);
          if (st >= 200 && st < 300) ok++;
          else if (st === 404 || st === 410) dead.push(ep);   // aparelho que desinstalou ou bloqueou
        } catch (e) { /* um aparelho com erro não para os outros */ }
      }));
      if (dead.length) await redis(['SREM', SUBS_KEY, ...dead]);
      return res.status(200).json({ ok: true, enviados: ok, total: (subs || []).length, token });
    }

    return res.status(400).json({ error: 'Ação inválida.' });
  } catch (e) {
    return res.status(500).json({ error: 'Erro no servidor.' });
  }
};
