# Jogos do Dominic

Coleção de 3 mini-jogos web feitos em HTML5 + Canvas, com tela de menu inicial e suporte mobile.

## Jogos

- **Luta Elemental** — Combate top-down com poderes elementais
- **Pixel Futebol** — Futebol em pixel art
- **Space Shooter** — Shoot 'em up espacial

## Rodar localmente

Como são arquivos estáticos, basta abrir `index.html` no navegador. Ou rode um servidor:

```bash
python3 -m http.server 8000
```

Depois acesse http://localhost:8000

## Deploy no Vercel

### Opção 1 — pelo site (mais fácil)

1. Acesse https://vercel.com/new
2. Importe o repositório `dombbezerra/jogos-dominic`
3. Em **Framework Preset**, selecione **Other**
4. Mantenha tudo padrão e clique em **Deploy**

Pronto — o Vercel detecta o `vercel.json` e serve os arquivos estáticos.

### Opção 2 — pela CLI

```bash
npm i -g vercel
vercel login
vercel        # preview
vercel --prod # produção
```

## Controles

Todos os jogos suportam **teclado** (no desktop) e **touch** (no celular). Os controles touch aparecem automaticamente em telas pequenas.
