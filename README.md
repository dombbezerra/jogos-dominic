# Jogos do Dominic

Coleção de 3 mini-jogos web feitos em HTML5 + Canvas, com tela de menu inicial e suporte mobile.

## Jogos

- **Luta Elemental** — Combate top-down com poderes elementais
- **Aventura Elemental** — Plataforma estilo Mario com 1000 fases de pedra e chefão a cada 10
- **Space Shooter** — Shoot 'em up espacial
- **Mundo de Blocos** — Mundo 3D de blocos estilo Minecraft

## Rodar localmente

Como são arquivos estáticos, basta abrir `index.html` no navegador. Ou rode um servidor:

```bash
python3 -m http.server 8000
```

Depois acesse http://localhost:8000

## Publicar (servidor do Dom no Dokploy)

É só fazer `git push` na branch `main`: o Dokploy (https://painel.dominicbezerra.com.br) monta o `Dockerfile` e publica sozinho em **https://jogos.dominicbezerra.com.br**.

- O `server.js` mostra os jogos e roda a pasta `api/`.
- O banco é o Redis do próprio Dokploy (variável `REDIS_URL`).

## Controles

Todos os jogos suportam **teclado** (no desktop) e **touch** (no celular). Os controles touch aparecem automaticamente em telas pequenas.
