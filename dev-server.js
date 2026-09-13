// Servidor de desenvolvimento local que imita o comportamento das
// Netlify Functions (netlify/functions/*.js) + arquivos estáticos.
// Uso: node dev-server.js  (lê .env.local automaticamente)
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// carrega .env.local manualmente (sem depender de pacote externo)
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) process.env[m[1]] = m[2];
  }
}

const PORT = 8765;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
};

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(body);
}

async function handleApi(apiName, req, res, parsedUrl) {
  const modPath = path.join(ROOT, 'netlify', 'functions', `${apiName}.js`);
  delete require.cache[require.resolve(modPath)];
  const mod = require(modPath);

  let rawBody = '';
  if (req.method === 'POST') {
    req.on('data', (chunk) => (rawBody += chunk));
    await new Promise((resolve) => req.on('end', resolve));
  }

  const event = {
    httpMethod: req.method,
    queryStringParameters: parsedUrl.query,
    body: rawBody || null,
    headers: req.headers,
  };

  try {
    const result = await mod.handler(event, {});
    res.writeHead(result.statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(result.body);
  } catch (err) {
    console.error(err);
    sendJson(res, 500, { error: 'Erro interno no servidor de desenvolvimento.' });
  }
}

function serveStatic(filePath, res) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  if (pathname.startsWith('/api/')) {
    const apiName = pathname.replace('/api/', '').replace(/\/$/, '');
    await handleApi(apiName, req, res, parsedUrl);
    return;
  }

  if (pathname.endsWith('/')) pathname += 'index.html';
  const filePath = path.join(ROOT, pathname);

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stat) => {
    if (!err && stat.isFile()) {
      serveStatic(filePath, res);
    } else {
      // tenta path/index.html (rotas tipo /contrato-17 sem barra final)
      serveStatic(path.join(filePath, 'index.html'), res);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Dev server rodando em http://localhost:${PORT}`);
  console.log(`FLEVOPAY_SECRET_KEY carregada: ${process.env.FLEVOPAY_SECRET_KEY ? 'sim' : 'NAO'}`);
});
