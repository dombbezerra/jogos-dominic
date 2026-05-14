import os
import sys
from http.server import BaseHTTPRequestHandler
from socketserver import ThreadingTCPServer

BASE = '/Users/dominicbezerra/Documents/Jogo'
PORT = int(os.environ.get('PORT', '8765'))

# Lê todos os arquivos do projeto uma vez na inicialização (em memória)
FILES = {}
for nome in os.listdir(BASE):
    caminho = os.path.join(BASE, nome)
    if os.path.isfile(caminho):
        with open(caminho, 'rb') as f:
            FILES['/' + nome] = f.read()

TIPOS = {
    '.html': 'text/html; charset=utf-8',
    '.js':   'application/javascript; charset=utf-8',
    '.css':  'text/css; charset=utf-8',
    '.png':  'image/png',
    '.jpg':  'image/jpeg',
    '.svg':  'image/svg+xml',
}

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        caminho = self.path.split('?', 1)[0]
        if caminho == '/':
            caminho = '/index.html'
        if caminho in FILES:
            ext = os.path.splitext(caminho)[1].lower()
            self.send_response(200)
            self.send_header('Content-Type', TIPOS.get(ext, 'application/octet-stream'))
            self.send_header('Content-Length', str(len(FILES[caminho])))
            self.send_header('Cache-Control', 'no-store')
            self.end_headers()
            self.wfile.write(FILES[caminho])
        else:
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b'404 - nao encontrado')

    def log_message(self, *args):
        pass  # silencia logs

if __name__ == '__main__':
    print(f'Servidor rodando em http://localhost:{PORT}/', flush=True)
    print(f'Arquivos carregados: {list(FILES.keys())}', flush=True)
    ThreadingTCPServer.allow_reuse_address = True
    ThreadingTCPServer(('127.0.0.1', PORT), Handler).serve_forever()
