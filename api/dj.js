// DJ IA — a inteligência do Claude criando as músicas do Estúdio de Música.
// Só funciona quando ANTHROPIC_API_KEY está configurada no Vercel (o pai coloca a chave).
// Sem a chave, responde "semChave" e o site usa o robozinho de sempre.
const sdk = require('@anthropic-ai/sdk');
const Anthropic = sdk.default || sdk;

const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
// Limites pra conta não ficar cara: por aparelho (IP) por hora e pro site inteiro por dia
const POR_HORA = 30;
const POR_DIA = Number(process.env.DJ_LIMITE_DIA) || 150;

async function redis(...commands) {
  const r = await fetch(REDIS_URL + '/pipeline', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + REDIS_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(commands),
  });
  if (!r.ok) throw new Error('redis ' + r.status);
  return (await r.json()).map((x) => { if (x.error) throw new Error(x.error); return x.result; });
}

const SISTEMA = `Você é o DJ IA, o produtor musical do site "Jogos do Dominic". Quem conversa com você são crianças brasileiras.

Seu trabalho: entender o pedido (mesmo mal escrito, com erros, gírias ou sons tipo "tchum tchá pá pum") e criar ou mudar uma música.
A música é tocada por um sintetizador do site, então você descreve ela em JSON (nunca áudio).

Regras de conversa:
- Responda em português do Brasil, curtinho (1 a 3 frases), animado e gentil, como um amigo produtor.
- Diga o que você fez e sugira 1 coisa que dá pra mudar.
- Se a criança mandar "atual" (uma música que já existe) e pedir um ajuste ("mais pesado", "muda a melodia", "coloca letra"), mude SÓ o que ela pediu e mantenha o resto igual.
- Conteúdo sempre apropriado pra crianças: sem palavrão, violência, conteúdo adulto, nada de pedir ou repetir dados pessoais (nome completo, endereço, telefone, escola). Se pedirem algo assim, recuse com gentileza e ofereça outra ideia.
- Você pode se inspirar no estilo de músicas famosas (ritmo, clima, instrumentos), mas nunca copie a letra ou a melodia de uma música que tem dono. Se pedirem "a música X", faça uma original no mesmo estilo e explique isso de um jeito simples.
- A letra (campo "letra") é falada por uma voz de robô em cima da batida: escreva pedaços curtos (2 a 5 palavras cada, de 2 a 8 pedaços), divertidos e apropriados. Use letra só quando pedirem letra ou quando combinar muito; se não, deixe null.

Como montar a música (o JSON):
- 4 compassos que repetem; cada compasso tem 16 passos (0 a 15). A melodia tem 64 passos.
- "estilo": funk, mandelao, rave, trap, eletronica, rock, game, lofi, samba, bossa, forro, mpb ou pop.
- "escala": maior, menor ou dorico. "raiz": tom de -5 a 6 (0 = Dó).
- "prog": 4 graus da escala (0 a 6), um acorde por compasso. Ex.: [0,5,2,6] em menor, [0,4,5,3] em maior.
- "melodia": 64 itens, cada um null (silêncio) ou um grau da escala de -2 a 9 (0 = nota da raiz). Faça uma melodia de verdade: um motivo que repete com variação, notas do acorde nos tempos fortes (passos 0, 4, 8, 12), respiros (null), e um final que fecha bonito. Não encha todos os passos.
- "bateria": passos (0-15) de "bumbo", "caixa", "palma", "chimbal" e "tambor" (tamborzão do funk). Use [] pra não tocar.
- "baixoPassos": passos (0-15) em que o baixo toca a nota do acorde. "baixo": "808" (grave que treme, funk/trap), "synth", "suave", "gamer", "violao7" (samba) ou "".
- "lead" (instrumento da melodia): piano, pluck, synth, gamer, sino, guitarra, cavaco ou sanfona.
- "pad": acordes longos de fundo (true/false). "pesado": 0 a 3 (força do grave). "bpm": 70 a 170.
- "voz": true se a voz fala alguma coisa; "palavra": o que ela fala quando não tem letra (ex: "Vai!").
- "capa": um emoji e duas cores hex pro degradê. "titulo": um nome criativo e curto.
- "humor": "", "triste", "alegre", "terror" ou "epico".

Responda SOMENTE com um objeto JSON neste formato, sem texto antes ou depois:
{"resposta": "...", "musica": {"titulo":"","estilo":"","humor":"","bpm":120,"raiz":0,"escala":"menor","prog":[0,5,2,6],"lead":"synth","pad":true,"baixo":"808","pesado":1,"bateria":{"bumbo":[],"caixa":[],"palma":[],"chimbal":[],"tambor":[]},"baixoPassos":[],"melodia":[...64 itens...],"voz":false,"palavra":"Vai!","letra":null,"capa":{"emoji":"🔥","c1":"#ff5d3a","c2":"#7a1a5a"}}}`;

const cliente = () => new Anthropic();

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(200).json({ semChave: true });
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const texto = String(body.texto || '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, 400);
    if (!texto) return res.status(400).json({ error: 'Mensagem vazia.' });

    // Limites (se o Redis estiver configurado)
    if (REDIS_URL && REDIS_TOKEN) {
      const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'x';
      const dia = new Date().toISOString().slice(0, 10);
      const [porIp, , porDia] = await redis(['INCR', 'dj:ip:' + ip], ['EXPIRE', 'dj:ip:' + ip, 3600], ['INCR', 'dj:dia:' + dia], ['EXPIRE', 'dj:dia:' + dia, 2 * 86400]);
      if (porIp > POR_HORA || porDia > POR_DIA) return res.status(200).json({ limite: true });
    }

    // Conversa: os últimos pedidos e a música de agora (pra saber o que ajustar)
    const historico = Array.isArray(body.historico) ? body.historico.slice(-6) : [];
    const atual = body.atual && typeof body.atual === 'object' ? JSON.stringify(body.atual).slice(0, 6000) : null;
    const contexto = (historico.length ? 'Pedidos anteriores da criança: ' + historico.map((h) => '"' + String(h).slice(0, 200) + '"').join(', ') + '\n' : '')
      + (atual ? 'Música atual (JSON): ' + atual + '\n' : 'Ainda não tem música.\n')
      + 'Pedido agora: ' + texto;

    const resposta = await cliente().beta.messages.create({
      model: 'claude-opus-5-5',
      max_tokens: 6000,
      output_config: { effort: 'low' },   // conversa rápida e barata
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',   // se um filtro de segurança recusar, outro modelo tenta
      system: SISTEMA,
      messages: [{ role: 'user', content: contexto }],
    });
    if (resposta.stop_reason === 'refusal') return res.status(200).json({ resposta: 'Hmm, esse pedido eu não posso fazer 😅 Que tal pedir outro estilo de música?', musica: null });
    const txt = resposta.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
    const ini = txt.indexOf('{'), fim = txt.lastIndexOf('}');
    if (ini < 0 || fim < ini) throw new Error('sem json');
    const dados = JSON.parse(txt.slice(ini, fim + 1));
    return res.status(200).json({ resposta: String(dados.resposta || '').slice(0, 600), musica: dados.musica || null });
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) return res.status(200).json({ semChave: true });
    if (e instanceof Anthropic.RateLimitError) return res.status(200).json({ limite: true });
    return res.status(200).json({ erro: true });
  }
};
