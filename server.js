// Servidor dos Jogos do Dominic (Dokploy): mostra os jogos e roda a pasta api/ do mesmo jeito que a Vercel.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const RAIZ = __dirname;
const PORTA = Number(process.env.PORT) || 3000;
const ESCONDIDO = /^\/(api|node_modules|\.git)(\/|$)|^\/(server\.js|Dockerfile|package(-lock)?\.json|\.[^/]*)$/;

const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json', '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.mp4': 'video/mp4', '.webm': 'video/webm',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.md': 'text/markdown; charset=utf-8',
};

// Jeito da Vercel: res.status(200).json({...}) e res.send(...)
http.ServerResponse.prototype.status = function (c) { this.statusCode = c; return this; };
http.ServerResponse.prototype.json = function (o) {
  if (!this.getHeader('Content-Type')) this.setHeader('Content-Type', 'application/json; charset=utf-8');
  this.end(JSON.stringify(o));
  return this;
};
http.ServerResponse.prototype.send = function (b) {
  if (b && typeof b === 'object' && !Buffer.isBuffer(b)) return this.json(b);
  this.end(b);
  return this;
};

function lerCorpo(req) {
  return new Promise((ok, erro) => {
    const partes = [];
    let tam = 0;
    req.on('data', (p) => { tam += p.length; if (tam > 5e6) { erro(new Error('grande')); req.destroy(); } else partes.push(p); });
    req.on('end', () => ok(Buffer.concat(partes).toString('utf8')));
    req.on('error', erro);
  });
}

// Banco próprio (Dokploy): com REDIS_URL, este servidor faz o papel do Upstash em /_banco/pipeline,
// só pra dentro dele mesmo. Assim os arquivos da pasta api/ continuam iguais aos da Vercel.
let banco = null;
if (process.env.REDIS_URL && !process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
  const Redis = require('ioredis');
  banco = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: 2 });
  banco.on('error', (e) => console.error('banco:', e.message));
  process.env.KV_REST_API_URL = 'http://127.0.0.1:' + PORTA + '/_banco';
}

async function rodaBanco(req, res) {
  const daqui = ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress);
  if (!daqui || req.headers.authorization !== 'Bearer ' + process.env.KV_REST_API_TOKEN) return naoAchou(res);
  const comandos = JSON.parse(await lerCorpo(req));
  const saida = await banco.pipeline(comandos.map((c) => ['call', ...c.map(String)])).exec();
  res.status(200).json(saida.map(([e, r]) => (e ? { error: e.message } : { result: r })));
}

const funcoes = {};
async function rodaApi(nome, req, res, url) {
  const arq = path.join(RAIZ, 'api', nome + '.js');
  if (!/^[a-z0-9-]+$/.test(nome) || !fs.existsSync(arq)) return res.status(404).json({ error: 'Não encontrado.' });
  funcoes[nome] = funcoes[nome] || require(arq);
  req.query = Object.fromEntries(url.searchParams);
  const texto = await lerCorpo(req);
  const tipo = req.headers['content-type'] || '';
  req.body = texto;
  if (/json/.test(tipo)) { try { req.body = texto ? JSON.parse(texto) : {}; } catch (e) { return res.status(400).json({ error: 'JSON inválido.' }); } }
  else if (/x-www-form-urlencoded/.test(tipo)) req.body = Object.fromEntries(new URLSearchParams(texto));
  else if (!texto) req.body = undefined;
  await funcoes[nome](req, res);
}

function serveArquivo(req, res, url) {
  let p;
  try { p = decodeURIComponent(url.pathname); } catch (e) { return res.status(400).end(); }
  if (p.includes('\0') || ESCONDIDO.test(p)) return naoAchou(res);
  let arq = path.join(RAIZ, path.normalize(p));
  if (!arq.startsWith(RAIZ)) return naoAchou(res);
  let st = fs.statSync(arq, { throwIfNoEntry: false });
  if (st && st.isDirectory()) {
    if (!p.endsWith('/')) return redireciona(res, p + '/' + url.search);
    arq = path.join(arq, 'index.html');
    st = fs.statSync(arq, { throwIfNoEntry: false });
  } else if (!st && fs.existsSync(arq + '.html')) {
    arq += '.html';
    st = fs.statSync(arq);
  } else if (st && p.endsWith('.html')) {
    // cleanUrls: /pagina.html vira /pagina/
    return redireciona(res, p.replace(/(index)?\.html$/, '') + url.search);
  }
  if (!st || !st.isFile()) return naoAchou(res);
  const ext = path.extname(arq).toLowerCase();
  res.setHeader('Content-Type', TIPOS[ext] || 'application/octet-stream');
  res.setHeader('Content-Length', st.size);
  if (/\.(html|js|css|json)$/.test(arq) || !path.extname(p)) res.setHeader('Cache-Control', 'no-cache, must-revalidate');
  if (req.method === 'HEAD') return res.end();
  fs.createReadStream(arq).pipe(res);
}

function redireciona(res, para) { res.writeHead(308, { Location: para }); res.end(); }
function naoAchou(res) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('Não encontrado'); }

http.createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  try {
    const url = new URL(req.url, 'http://x');
    if (banco && url.pathname === '/_banco/pipeline' && req.method === 'POST') return await rodaBanco(req, res);
    const api = url.pathname.match(/^\/api\/([^/]+)\/?$/);
    if (api) return await rodaApi(api[1], req, res, url);
    if (req.method !== 'GET' && req.method !== 'HEAD') return res.status(405).end();
    serveArquivo(req, res, url);
  } catch (e) {
    console.error(req.method, req.url, e);
    if (!res.headersSent) res.status(500).json({ error: 'Erro no servidor.' });
    else res.end();
  }
}).listen(PORTA, () => console.log('Jogos do Dominic na porta ' + PORTA));
