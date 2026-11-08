// Roube um Animal — servidor do jogo: até 8 pessoas por servidor (cada uma com seu cercadinho).
// Cada jogador manda onde está e quais bichos tem a cada ~1,5s; a esteira é a mesma pra todo mundo
// (sai do relógio), e a compra passa por aqui pra só uma pessoa conseguir comprar cada bicho.
const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

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

const MAX = 8;              // pessoas por servidor
const SUMIU = 15000;        // sem sinal por 15s: saiu
const PASSO_ESTEIRA = 2200; // um bicho novo na esteira a cada 2,2s (igual no jogo)

// Nome: só letras, números e espaço, até 14 letras, sem palavrão
const PALAVROES = ['porra', 'caralho', 'merda', 'bosta', 'puta', 'puto', 'fdp', 'vsf', 'vtnc', 'tnc', 'pqp', 'cu', 'cuzao', 'buceta', 'piroca',
  'foda', 'fodase', 'foder', 'arrombado', 'viado', 'otario', 'idiota', 'imbecil', 'desgraca', 'cacete', 'babaca', 'retardado', 'corno',
  'vagabundo', 'vagabunda', 'piranha', 'safado', 'sexo', 'pinto', 'rola', 'xota', 'punheta', 'pau', 'bunda', 'burro', 'lixo', 'feio', 'gordo'];
function limpaNome(n) {
  const t = String(n || '').replace(/[^\p{L}\p{N} ]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 14);
  const ruim = t.split(' ').some((w) => {
    const x = w.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/(.)\1+/g, '$1');
    return PALAVROES.includes(x) || PALAVROES.includes(x.replace(/s$/, ''));
  });
  return t.length >= 2 && !ruim ? t : 'Jogador';
}
const limpaId = (v) => (typeof v === 'string' && /^[a-z0-9]{6,16}$/.test(v) ? v : null);
const limpaSlots = (s) => (Array.isArray(s) ? s.slice(0, 10).map((v) => (typeof v === 'string' && /^[a-z-]{1,24}\*?$/.test(v) ? v : '')) : []);
const num = (v, max) => Math.max(0, Math.min(max, Math.round(Number(v) || 0)));

// Tudo do "sync" numa vez só (um comando): escolhe o servidor e o cercadinho, guarda você e devolve os outros
const SYNC_LUA = `
local id, st, now, sala, maxj, sumiu, passo = ARGV[1], ARGV[2], tonumber(ARGV[3]), tonumber(ARGV[4]), tonumber(ARGV[5]), tonumber(ARGV[6]), tonumber(ARGV[7])
local function vivos(k)
  local all = redis.call('HGETALL', k)
  local out = {}
  for i = 1, #all, 2 do
    local p = cjson.decode(all[i + 1])
    if now - p.t > sumiu then redis.call('HDEL', k, all[i]) else out[#out + 1] = p end
  end
  return out
end
local function acha(l) for _, p in ipairs(l) do if p.id == id then return p end end return nil end
local lista = nil
if sala > 0 then
  local l = vivos('roube:s:' .. sala)
  if acha(l) or #l < maxj then lista = l else sala = 0 end
end
if sala == 0 then
  for s = 1, 50 do
    local l = vivos('roube:s:' .. s)
    if acha(l) or #l < maxj then sala = s; lista = l; break end
  end
end
if not lista then return cjson.encode({ cheio = true }) end
local antes = acha(lista)
local base = 0
if antes then base = antes.base else
  local usado = {}
  for _, p in ipairs(lista) do usado[p.base] = true end
  while usado[base] do base = base + 1 end
end
local eu = cjson.decode(st)
eu.id = id; eu.t = now; eu.base = base
local k = 'roube:s:' .. sala
redis.call('HSET', k, id, cjson.encode(eu))
redis.call('EXPIRE', k, 120)
local outros = {}
for _, p in ipairs(lista) do if p.id ~= id then outros[#outros + 1] = p end end
local kc = 'roube:c:' .. sala
local cs = redis.call('HGETALL', kc)
local compras = {}
local nmin = math.floor(now / passo) - 40
for i = 1, #cs, 2 do
  if tonumber(cs[i]) < nmin then redis.call('HDEL', kc, cs[i]) else compras[cs[i]] = cs[i + 1] end
end
return cjson.encode({ sala = sala, base = base, jogadores = outros, compras = compras })
`;

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });
  if (!REDIS_URL || !REDIS_TOKEN) return res.status(500).json({ error: 'Servidor sem banco.' });
  let body = req.body || {};
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }   // sendBeacon chega como texto
  const id = limpaId(body.id);
  if (!id) return res.status(400).json({ error: 'id inválido' });
  const sala = num(body.sala, 50);
  try {
    if (body.acao === 'sync') {
      const st = JSON.stringify({ nome: limpaNome(body.nome), x: num(body.x, 5000), y: num(body.y, 5000), s: limpaSlots(body.s) });
      const agora = Date.now();
      const [out] = await redis(['EVAL', SYNC_LUA, '0', id, st, String(agora), String(sala), String(MAX), String(SUMIU), String(PASSO_ESTEIRA)]);
      const r = JSON.parse(out);
      if (r.cheio) return res.status(503).json({ error: 'Todos os servidores estão cheios.' });
      r.agora = agora;
      return res.status(200).json(r);
    }
    if (body.acao === 'compra') {
      // só dá pra comprar um bicho que está passando na esteira agora
      const n = Math.floor(Number(body.n)), atual = Math.floor(Date.now() / PASSO_ESTEIRA);
      if (!sala || !(n <= atual && n >= atual - 30)) return res.status(400).json({ error: 'Esse bicho já passou.' });
      const kc = 'roube:c:' + sala;
      const [ok, , dono] = await redis(['HSETNX', kc, String(n), id + '|' + limpaNome(body.nome)], ['EXPIRE', kc, 120], ['HGET', kc, String(n)]);
      return res.status(200).json({ ok: ok === 1, dono: String(dono || '').split('|')[1] || null });
    }
    if (body.acao === 'sai') {
      if (sala) await redis(['HDEL', 'roube:s:' + sala, id]);
      return res.status(200).json({ ok: true });
    }
    return res.status(400).json({ error: 'Ação desconhecida.' });
  } catch (e) {
    return res.status(500).json({ error: 'Erro no servidor.' });
  }
};
