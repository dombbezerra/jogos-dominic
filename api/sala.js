// Salas pra jogar online de dois (Formiga Pula-Pula no App de Amigos).
// Só serve pra os dois celulares se acharem: depois o jogo vai direto de um pro outro.
// POST {acao:'criar', oferta}            → { sala: '1234' }
// POST {acao:'responder', sala, resposta} → { ok: true }
// GET  ?sala=1234&ler=oferta|resposta     → { dado } (ou dado: null se ainda não tem)
const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const DURA = 600;          // a sala some depois de 10 minutos
const MAXIMO = 12000;      // tamanho máximo do recado

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

const chave = (sala, qual) => 'sala:pula:' + sala + ':' + qual;
const codigoOk = (s) => /^\d{4}$/.test(String(s || ''));

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    if (req.method === 'GET') {
      const { sala, ler } = req.query || {};
      if (!codigoOk(sala) || !['oferta', 'resposta'].includes(ler)) return res.status(400).json({ erro: 'sala' });
      const [dado] = await redis(['GET', chave(sala, ler)]);
      return res.status(200).json({ dado: dado || null });
    }
    if (req.method !== 'POST') return res.status(405).json({ erro: 'metodo' });
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    if (body.acao === 'criar') {
      const oferta = String(body.oferta || '');
      if (!oferta || oferta.length > MAXIMO) return res.status(400).json({ erro: 'oferta' });
      // sorteia um código livre
      for (let i = 0; i < 8; i++) {
        const sala = String(1000 + Math.floor(Math.random() * 9000));
        const [ok] = await redis(['SET', chave(sala, 'oferta'), oferta, 'EX', DURA, 'NX']);
        if (ok) return res.status(200).json({ sala });
      }
      return res.status(503).json({ erro: 'cheio' });
    }
    if (body.acao === 'responder') {
      const resposta = String(body.resposta || '');
      if (!codigoOk(body.sala) || !resposta || resposta.length > MAXIMO) return res.status(400).json({ erro: 'resposta' });
      const [tem] = await redis(['EXISTS', chave(body.sala, 'oferta')]);
      if (!tem) return res.status(404).json({ erro: 'nao-existe' });
      // só o primeiro amigo entra
      const [ok] = await redis(['SET', chave(body.sala, 'resposta'), resposta, 'EX', DURA, 'NX']);
      return ok ? res.status(200).json({ ok: true }) : res.status(409).json({ erro: 'cheia' });
    }
    return res.status(400).json({ erro: 'acao' });
  } catch (e) {
    return res.status(500).json({ erro: 'servidor' });
  }
};
