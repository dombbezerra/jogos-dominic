// Salas pra jogar online de dois (Formiga Pula-Pula no App de Amigos).
// Só serve pra os dois celulares se acharem: depois o jogo vai direto de um pro outro.
// POST {acao:'procurar', oferta}          → { entrar: '1234', oferta } se tem alguém esperando, ou { esperar: '1234' }
// POST {acao:'responder', sala, resposta} → { ok: true }
// GET  ?sala=1234&ler=resposta            → { dado } (quem espera pergunta isso e avisa que ainda está lá)
const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const DURA = 600;          // a sala some depois de 10 minutos
const VIVO = 8;            // quem espera precisa dar sinal de vida a cada poucos segundos
const MAXIMO = 12000;      // tamanho máximo do recado
const FILA = 'sala:pula:fila';

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

// Tudo de uma vez só no Redis (assim dois que chegam juntos não ficam os dois esperando):
// pega alguém da fila que ainda está esperando; se não tem ninguém, entra na fila
const PROCURAR = `
local s = redis.call('LPOP', KEYS[1])
while s do
  local o = redis.call('GET', 'sala:pula:' .. s .. ':oferta')
  if o and redis.call('EXISTS', 'sala:pula:' .. s .. ':vivo') == 1 and redis.call('EXISTS', 'sala:pula:' .. s .. ':resposta') == 0 then
    return {'entrar', s, o}
  end
  s = redis.call('LPOP', KEYS[1])
end
if redis.call('SET', 'sala:pula:' .. ARGV[1] .. ':oferta', ARGV[2], 'EX', ARGV[3], 'NX') then
  redis.call('SET', 'sala:pula:' .. ARGV[1] .. ':vivo', '1', 'EX', ARGV[4])
  redis.call('RPUSH', KEYS[1], ARGV[1])
  redis.call('EXPIRE', KEYS[1], ARGV[3])
  return {'esperar', ARGV[1]}
end
return nil`;

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    if (req.method === 'GET') {
      const { sala, ler } = req.query || {};
      if (!codigoOk(sala) || ler !== 'resposta') return res.status(400).json({ erro: 'sala' });
      const [dado] = await redis(['GET', chave(sala, 'resposta')], ['SET', chave(sala, 'vivo'), '1', 'EX', VIVO]);
      return res.status(200).json({ dado: dado || null });
    }
    if (req.method !== 'POST') return res.status(405).json({ erro: 'metodo' });
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    if (body.acao === 'procurar') {
      const oferta = String(body.oferta || '');
      if (!oferta || oferta.length > MAXIMO) return res.status(400).json({ erro: 'oferta' });
      for (let i = 0; i < 8; i++) {
        const sala = String(1000 + Math.floor(Math.random() * 9000));
        const [r] = await redis(['EVAL', PROCURAR, 1, FILA, sala, oferta, DURA, VIVO]);
        if (r && r[0] === 'entrar') return res.status(200).json({ entrar: r[1], oferta: r[2] });
        if (r && r[0] === 'esperar') return res.status(200).json({ esperar: r[1] });
      }
      return res.status(503).json({ erro: 'cheio' });
    }
    if (body.acao === 'responder') {
      const resposta = String(body.resposta || '');
      if (!codigoOk(body.sala) || !resposta || resposta.length > MAXIMO) return res.status(400).json({ erro: 'resposta' });
      const [ok] = await redis(['SET', chave(body.sala, 'resposta'), resposta, 'EX', DURA, 'NX']);
      return ok ? res.status(200).json({ ok: true }) : res.status(409).json({ erro: 'cheia' });
    }
    return res.status(400).json({ erro: 'acao' });
  } catch (e) {
    return res.status(500).json({ erro: 'servidor' });
  }
};
