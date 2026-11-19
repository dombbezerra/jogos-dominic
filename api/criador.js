// DOM CODE — o Claude criando jogos e páginas a partir do que a criança escreve no chat.
// Só funciona quando ANTHROPIC_API_KEY está configurada no Dokploy (o pai coloca a chave).
// Sem a chave, responde "semChave" e a página avisa.
const sdk = require('@anthropic-ai/sdk');
const Anthropic = sdk.default || sdk;

const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
// Limites pra conta não ficar cara: por aparelho (IP) por hora e pro site inteiro por dia
const POR_HORA = 15;
const POR_DIA = Number(process.env.CRIADOR_LIMITE_DIA) || 60;

async function redis(...commands) {
  const r = await fetch(REDIS_URL + '/pipeline', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + REDIS_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(commands),
  });
  if (!r.ok) throw new Error('redis ' + r.status);
  return (await r.json()).map((x) => { if (x.error) throw new Error(x.error); return x.result; });
}

const SISTEMA = `Você é o DOM CODE, o programador do site "Jogos do Dominic". Quem conversa com você são crianças brasileiras.

Seu trabalho: entender o pedido (mesmo mal escrito, com erros ou gírias) e criar ou mudar um jogo ou página.
O que você cria aparece num preview do lado do chat, então tem que funcionar sozinho, de primeira.

Regras de conversa:
- Responda em português do Brasil, curtinho (1 a 3 frases), animado e gentil.
- Diga o que você fez, como jogar (quais teclas ou toques) e sugira 1 coisa que dá pra mudar.
- Se já existe um jogo ("Código atual") e a criança pede um ajuste, mude SÓ o que ela pediu e mantenha o resto igual.
- Conteúdo sempre apropriado pra crianças: sem palavrão, sangue, violência pesada, terror forte ou conteúdo adulto; nada de pedir, mostrar ou guardar dados pessoais (nome completo, endereço, telefone, escola, senha). Se pedirem algo assim, recuse com gentileza e ofereça outra ideia.
- Pode se inspirar em estilos de jogos famosos, mas nunca copie nomes, personagens, músicas ou desenhos que têm dono. Se pedirem "o jogo X", faça um original parecido e explique isso de um jeito simples.

Regras do código:
- Um arquivo HTML completo (<!DOCTYPE html> até </html>), com CSS e JavaScript dentro dele.
- Nada de arquivos, imagens ou bibliotecas de fora: desenhe com canvas, CSS, SVG ou emojis. Sem fetch, sem formulários que mandam dados, sem links pra outros sites.
- Tem que funcionar no computador (teclado e mouse) e no celular (toque): coloque botões na tela quando o jogo usa teclas.
- Ocupe a tela toda (100vw x 100vh), sem barra de rolagem, e se ajuste quando a janela muda de tamanho.
- Capriche: cores bonitas, animações, pontuação, tela de início e de fim com "jogar de novo". Pode usar sons com Web Audio (bem baixinhos e só depois do primeiro toque).
- Textos do jogo em português do Brasil.

Formato da resposta: primeiro a mensagem curta pra criança, depois o código inteiro dentro de um bloco \`\`\`html ... \`\`\`.
Se o pedido não for pra criar ou mudar algo (ex.: só uma pergunta), responda só a mensagem, sem bloco de código.`;

const cliente = () => new Anthropic();

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(200).json({ semChave: true });
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const texto = String(body.texto || '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, 600);
    if (!texto) return res.status(400).json({ error: 'Mensagem vazia.' });

    // Limites (se o Redis estiver configurado)
    if (REDIS_URL && REDIS_TOKEN) {
      const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'x';
      const dia = new Date().toISOString().slice(0, 10);
      const [porIp, , porDia] = await redis(['INCR', 'criador:ip:' + ip], ['EXPIRE', 'criador:ip:' + ip, 3600], ['INCR', 'criador:dia:' + dia], ['EXPIRE', 'criador:dia:' + dia, 2 * 86400]);
      if (porIp > POR_HORA || porDia > POR_DIA) return res.status(200).json({ limite: true });
    }

    // Conversa: os últimos pedidos e o código de agora (pra saber o que ajustar)
    const historico = Array.isArray(body.historico) ? body.historico.slice(-6) : [];
    const atual = typeof body.atual === 'string' ? body.atual.slice(0, 60000) : '';
    const contexto = (historico.length ? 'Pedidos anteriores da criança: ' + historico.map((h) => '"' + String(h).slice(0, 300) + '"').join(', ') + '\n' : '')
      + (atual ? 'Código atual:\n```html\n' + atual + '\n```\n' : 'Ainda não tem nada criado.\n')
      + 'Pedido agora: ' + texto;

    const resposta = await cliente().beta.messages.create({
      model: 'claude-opus-5-5',
      max_tokens: 16000,
      output_config: { effort: 'low' },   // rápido e mais barato
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',   // se um filtro de segurança recusar, outro modelo tenta
      system: SISTEMA,
      messages: [{ role: 'user', content: contexto }],
    });
    if (resposta.stop_reason === 'refusal') return res.status(200).json({ resposta: 'Hmm, esse eu não posso fazer 😅 Que tal pedir outro jogo?', html: null });
    const txt = resposta.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
    const bloco = txt.match(/```html\s*([\s\S]*?)(```|$)/i);
    const html = bloco && /<\/html>/i.test(bloco[1]) ? bloco[1].trim() : null;
    const msg = (bloco ? txt.slice(0, bloco.index) : txt).trim() || (html ? 'Pronto! 🎮' : 'Hmm, não consegui terminar. Tenta pedir de novo, um pouquinho mais simples?');
    return res.status(200).json({ resposta: msg.slice(0, 800), html });
  } catch (e) {
    console.error('criador:', e && e.message);
    if (e instanceof Anthropic.AuthenticationError) return res.status(200).json({ semChave: true });
    if (e instanceof Anthropic.RateLimitError) return res.status(200).json({ limite: true });
    return res.status(200).json({ erro: true });
  }
};
