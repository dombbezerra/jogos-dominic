// Monta Emoji: as partes e o desenho do emoji. Usado no jogo Monta Emoji e no chat da Aventura (figurinhas)
(() => {
  const INK = '#3b2414';

  // ── As partes. Cada uma vem de um emoji (o "de" aparece no cantinho do botão) ──
  // Emoji de verdade desenhado dentro do emoji (x, y = meio dele; vira = espelhado)
  const EMO = 'Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif';
  const g = (ch, x, y, s, rot = 0, vira = false) =>
    `<text transform="translate(${x} ${y}) rotate(${rot}) scale(${vira ? -1 : 1} 1)" font-size="${s}" text-anchor="middle" dominant-baseline="central" font-family="${EMO}">${ch}</text>`;
  const par = (ch, s = 34, dy = 0) => g(ch, 72, 88 + dy, s) + g(ch, 128, 88 + dy, s);
  const heart = (x, y, s, c = '#ff2d55') => `<path transform="translate(${x} ${y}) scale(${s})" d="M0 6 C-10 -6 -22 4 0 20 C22 4 10 -6 0 6Z" fill="${c}"/>`;
  const star = (x, y, r) => { let p = ''; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; p += (i ? 'L' : 'M') + (x + Math.cos(a) * rr).toFixed(1) + ' ' + (y + Math.sin(a) * rr).toFixed(1); } return `<path d="${p}Z" fill="#ffb800" stroke="#e08a00" stroke-width="2" stroke-linejoin="round"/>`; };
  const line = (d, w = 6, c = INK) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const espiral = (x, y) => line(`M${x} ${y} m-2 0 a2 2 0 1 1 4 0 a5 5 0 1 1 -10 0 a8 8 0 1 1 16 0 a11 11 0 1 1 -22 0`, 3.5);

  // Rosto: cor clara (meio) e escura (borda). forma: redondo, robo (quadrado) ou orelhas de bicho
  const ROSTOS = [
    { id: 'amarelo', nome: 'Amarelo', de: '😀', c1: '#ffe36b', c2: '#f5a623' },
    { id: 'vermelho', nome: 'Bravo', de: '😡', c1: '#ff8a6b', c2: '#d9302a' },
    { id: 'verde', nome: 'Enjoado', de: '🤢', c1: '#bfe88a', c2: '#5da130' },
    { id: 'azul', nome: 'Congelado', de: '🥶', c1: '#a8e2ff', c2: '#3c8fe0' },
    { id: 'roxo', nome: 'Diabinho', de: '😈', c1: '#c9a2ff', c2: '#7a45c7' },
    { id: 'rosa', nome: 'Apaixonado', de: '🥰', c1: '#ffc2dc', c2: '#e8679a' },
    { id: 'laranja', nome: 'Abóbora', de: '🎃', c1: '#ffc27a', c2: '#e8781f' },
    { id: 'branco', nome: 'Fantasma', de: '👻', c1: '#ffffff', c2: '#b9c2d6' },
    { id: 'dourado', nome: 'Ouro', de: '🥇', c1: '#fff3a0', c2: '#c98a00' },
    { id: 'chocolate', nome: 'Chocolate', de: '🍫', c1: '#c08a5a', c2: '#6b3f1f' },
    { id: 'arcoiris', nome: 'Arco-íris', de: '🌈', arco: true, c1: '#ffe36b', c2: '#7a45c7' },
    { id: 'robo', nome: 'Robô', de: '🤖', c1: '#e6edf5', c2: '#7b8aa0', forma: 'robo' },
    { id: 'alien', nome: 'Alien', de: '👽', c1: '#d5f7a0', c2: '#6cbf3a', forma: 'alien' },
    { id: 'gato', nome: 'Gato', de: '🐱', c1: '#ffd28a', c2: '#e0902f', forma: 'gato' },
    { id: 'urso', nome: 'Urso', de: '🐻', c1: '#d9a571', c2: '#8a5a2e', forma: 'urso' },
    { id: 'coelho', nome: 'Coelho', de: '🐰', c1: '#ffffff', c2: '#c7c2d6', forma: 'coelho' },
    { id: 'porco', nome: 'Porquinho', de: '🐷', c1: '#ffc7d6', c2: '#ec7f9e', forma: 'porco' },
    { id: 'sapo', nome: 'Sapo', de: '🐸', c1: '#a6e86a', c2: '#3f9a2a', forma: 'sapo' },
  ];

  const OLHOS = [
    { id: 'normal', nome: 'Normal', de: '😀', svg: () => `<ellipse cx="72" cy="88" rx="9" ry="14" fill="${INK}"/><ellipse cx="128" cy="88" rx="9" ry="14" fill="${INK}"/>` },
    { id: 'coracao', nome: 'Coração', de: '😍', svg: () => heart(72, 80, 1.2) + heart(128, 80, 1.2) },
    { id: 'estrela', nome: 'Estrela', de: '🤩', svg: () => star(72, 88, 17) + star(128, 88, 17) },
    { id: 'oculos', nome: 'Óculos escuro', de: '😎', svg: () => `<path d="M40 76 H160 V84 H152 C150 104 132 108 120 104 C110 100 106 92 104 84 H96 C94 92 90 100 80 104 C68 108 50 104 48 84 H40Z" fill="#14141f"/><path d="M58 84 l10 0" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity="0.7"/><path d="M114 84 l10 0" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity="0.7"/>` },
    { id: 'piscando', nome: 'Piscando', de: '😉', svg: () => `<ellipse cx="72" cy="88" rx="9" ry="14" fill="${INK}"/>` + line('M114 92 Q128 80 142 92') },
    { id: 'rindo', nome: 'Rindo', de: '😆', svg: () => line('M60 78 L80 88 L60 98') + line('M140 78 L120 88 L140 98') },
    { id: 'dormindo', nome: 'Dormindo', de: '😴', svg: () => line('M58 88 Q72 98 86 88') + line('M114 88 Q128 98 142 88') },
    { id: 'feliz', nome: 'Feliz', de: '😊', svg: () => line('M58 92 Q72 78 86 92') + line('M114 92 Q128 78 142 92') },
    { id: 'arregalado', nome: 'Assustado', de: '😳', svg: () => `<circle cx="72" cy="88" r="17" fill="#fff" stroke="${INK}" stroke-width="3"/><circle cx="72" cy="90" r="7" fill="${INK}"/><circle cx="128" cy="88" r="17" fill="#fff" stroke="${INK}" stroke-width="3"/><circle cx="128" cy="90" r="7" fill="${INK}"/>` },
    { id: 'fofo', nome: 'Fofinho', de: '🥺', svg: () => `<circle cx="72" cy="90" r="16" fill="${INK}"/><circle cx="66" cy="84" r="6" fill="#fff"/><circle cx="77" cy="96" r="3" fill="#fff"/><circle cx="128" cy="90" r="16" fill="${INK}"/><circle cx="122" cy="84" r="6" fill="#fff"/><circle cx="133" cy="96" r="3" fill="#fff"/>` },
    { id: 'marejado', nome: 'Emocionado', de: '🥹', svg: () => `<circle cx="72" cy="90" r="16" fill="${INK}"/><circle cx="66" cy="84" r="6" fill="#fff"/><circle cx="128" cy="90" r="16" fill="${INK}"/><circle cx="122" cy="84" r="6" fill="#fff"/><path d="M58 104 Q72 112 86 104 M114 104 Q128 112 142 104" stroke="#4fb8ff" stroke-width="5" fill="none" stroke-linecap="round"/>` },
    { id: 'tonto', nome: 'Tonto', de: '😵', svg: () => line('M62 78 L82 98 M82 78 L62 98') + line('M118 78 L138 98 M138 78 L118 98') },
    { id: 'espiral', nome: 'Hipnotizado', de: '😵‍💫', svg: () => espiral(72, 88) + espiral(128, 88) },
    { id: 'dinheiro', nome: 'Dinheiro', de: '🤑', svg: () => `<text x="72" y="104" font-size="40" font-weight="900" text-anchor="middle" fill="#1fa84a" font-family="Arial Black, Arial">$</text><text x="128" y="104" font-size="40" font-weight="900" text-anchor="middle" fill="#1fa84a" font-family="Arial Black, Arial">$</text>` },
    { id: 'revirando', nome: 'Revirando', de: '🙄', svg: () => `<circle cx="72" cy="88" r="15" fill="#fff" stroke="${INK}" stroke-width="3"/><circle cx="72" cy="79" r="7" fill="${INK}"/><circle cx="128" cy="88" r="15" fill="#fff" stroke="${INK}" stroke-width="3"/><circle cx="128" cy="79" r="7" fill="${INK}"/>` },
    { id: 'traco', nome: 'Sem paciência', de: '😑', svg: () => line('M58 88 H86', 7) + line('M114 88 H142', 7) },
    { id: 'desconfiado', nome: 'Desconfiado', de: '😒', svg: () => `<path d="M56 86 H88 Q86 102 72 102 Q58 102 56 86Z M112 86 H144 Q142 102 128 102 Q114 102 112 86Z" fill="#fff" stroke="${INK}" stroke-width="3"/><circle cx="78" cy="92" r="6" fill="${INK}"/><circle cx="134" cy="92" r="6" fill="${INK}"/>` + line('M54 86 H90 M110 86 H146', 5) },
    { id: 'maluco', nome: 'Maluco', de: '🤪', svg: () => `<circle cx="70" cy="86" r="20" fill="#fff" stroke="${INK}" stroke-width="3"/><circle cx="74" cy="80" r="8" fill="${INK}"/><circle cx="130" cy="92" r="11" fill="#fff" stroke="${INK}" stroke-width="3"/><circle cx="128" cy="95" r="5" fill="${INK}"/>` },
    { id: 'zoando', nome: 'Zoando', de: '😜', svg: () => line('M58 92 Q72 80 86 92') + `<circle cx="128" cy="88" r="16" fill="#fff" stroke="${INK}" stroke-width="3"/><circle cx="130" cy="88" r="7" fill="${INK}"/>` },
    { id: 'gatinho', nome: 'Olho de gato', de: '😼', svg: () => `<ellipse cx="72" cy="88" rx="15" ry="13" fill="#ffd23f" stroke="${INK}" stroke-width="3"/><ellipse cx="72" cy="88" rx="3.5" ry="11" fill="${INK}"/><ellipse cx="128" cy="88" rx="15" ry="13" fill="#ffd23f" stroke="${INK}" stroke-width="3"/><ellipse cx="128" cy="88" rx="3.5" ry="11" fill="${INK}"/>` },
    { id: 'alienolho', nome: 'Alien', de: '👽', svg: () => `<path d="M48 76 Q80 74 88 98 Q60 106 48 76Z M152 76 Q120 74 112 98 Q140 106 152 76Z" fill="#111"/><circle cx="64" cy="84" r="4" fill="#fff"/><circle cx="136" cy="84" r="4" fill="#fff"/>` },
    { id: 'robolho', nome: 'Robô', de: '🤖', svg: () => `<rect x="56" y="76" width="32" height="24" rx="5" fill="#1c2a3a"/><rect x="62" y="82" width="20" height="12" rx="3" fill="#3fe0d0"/><rect x="112" y="76" width="32" height="24" rx="5" fill="#1c2a3a"/><rect x="118" y="82" width="20" height="12" rx="3" fill="#3fe0d0"/>` },
    { id: 'bravo', nome: 'Bravo', de: '😤', svg: () => `<path d="M58 82 L86 90 Q84 102 72 102 Q60 102 58 82Z M142 82 L114 90 Q116 102 128 102 Q140 102 142 82Z" fill="${INK}"/>` },
    // Olhos que são emojis de verdade
    { id: 'e-coracao', nome: 'Corações', de: '❤️', svg: () => par('❤️', 32) },
    { id: 'e-fogo', nome: 'Fogo', de: '🔥', svg: () => par('🔥', 34) },
    { id: 'e-diamante', nome: 'Diamante', de: '💎', svg: () => par('💎', 32) },
    { id: 'e-estrela', nome: 'Estrelinha', de: '🌟', svg: () => par('🌟', 34) },
    { id: 'e-bola', nome: 'Bola', de: '⚽', svg: () => par('⚽', 30) },
    { id: 'e-olho', nome: 'Olhão', de: '👁️', svg: () => par('👁️', 34) },
    { id: 'e-espiral', nome: 'Redemoinho', de: '🌀', svg: () => par('🌀', 32) },
    { id: 'e-raio', nome: 'Raio', de: '⚡', svg: () => par('⚡', 34) },
    { id: 'e-flor', nome: 'Flor', de: '🌸', svg: () => par('🌸', 32) },
    { id: 'e-rosquinha', nome: 'Rosquinha', de: '🍩', svg: () => par('🍩', 30) },
    { id: 'e-alvo', nome: 'Alvo', de: '🎯', svg: () => par('🎯', 30) },
    { id: 'e-lua', nome: 'Lua', de: '🌙', svg: () => par('🌙', 32) },
    { id: 'e-sol', nome: 'Sol', de: '☀️', svg: () => par('☀️', 32) },
    { id: 'e-neve', nome: 'Gelo', de: '❄️', svg: () => par('❄️', 30) },
    { id: 'e-caveira', nome: 'Caveira', de: '💀', svg: () => par('💀', 30) },
    { id: 'e-moeda', nome: 'Moeda', de: '🪙', svg: () => par('🪙', 30) },
    { id: 'e-sinuca', nome: 'Bola 8', de: '🎱', svg: () => par('🎱', 30) },
    { id: 'e-trevo', nome: 'Trevo', de: '🍀', svg: () => par('🍀', 32) },
    { id: 'e-planeta', nome: 'Planeta', de: '🪐', svg: () => par('🪐', 32) },
    { id: 'e-pizza', nome: 'Pizza', de: '🍕', svg: () => par('🍕', 30) },
    { id: 'e-olhos', nome: 'Olhinhos', de: '👀', svg: () => g('👀', 100, 88, 54) },
    { id: 'e-mascara', nome: 'Máscara', de: '🥽', svg: () => g('🥽', 100, 88, 74) },
  ];

  const NARIZES = [
    { id: 'nenhum', nome: 'Nenhum', de: '🚫', svg: () => '' },
    { id: 'simples', nome: 'Narizinho', de: '👃', svg: () => line('M100 104 Q94 118 104 120', 4) },
    { id: 'palhaco', nome: 'Palhaço', de: '🤡', svg: () => `<circle cx="100" cy="114" r="13" fill="#ff2d3a" stroke="#b5121f" stroke-width="2"/><circle cx="95" cy="109" r="4" fill="#fff" opacity="0.7"/>` },
    { id: 'porco', nome: 'Porco', de: '🐷', svg: () => `<ellipse cx="100" cy="116" rx="18" ry="13" fill="#ff9bb8" stroke="#d9668a" stroke-width="3"/><ellipse cx="93" cy="116" rx="3.5" ry="5" fill="#b5476a"/><ellipse cx="107" cy="116" rx="3.5" ry="5" fill="#b5476a"/>` },
    { id: 'cachorro', nome: 'Cachorro', de: '🐶', svg: () => `<path d="M86 108 Q100 102 114 108 Q112 122 100 124 Q88 122 86 108Z" fill="#222"/><ellipse cx="96" cy="109" rx="4" ry="2" fill="#fff" opacity="0.6"/>` },
    { id: 'gato', nome: 'Gatinho', de: '🐱', svg: () => `<path d="M92 110 H108 L100 120Z" fill="#ff8fb0" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>` + line('M84 118 L52 112 M84 122 L52 126 M116 118 L148 112 M116 122 L148 126', 2.5) },
    { id: 'pinoquio', nome: 'Pinóquio', de: '🤥', svg: () => `<path d="M100 106 L176 112 Q180 116 176 120 L100 122Z" fill="#e8a76a" stroke="#a8692f" stroke-width="3" stroke-linejoin="round"/>` },
    { id: 'coelho', nome: 'Coelhinho', de: '🐰', svg: () => `<path d="M94 110 H106 Q104 118 100 118 Q96 118 94 110Z" fill="#ff8fb0"/>` + line('M88 116 L60 110 M88 120 L60 124 M112 116 L140 110 M112 120 L140 124', 2) },
    { id: 'urso', nome: 'Ursinho', de: '🐻', svg: () => `<ellipse cx="100" cy="122" rx="24" ry="17" fill="#f3d9b5" stroke="#b07c49" stroke-width="2"/><ellipse cx="100" cy="112" rx="9" ry="6" fill="#3b2414"/>` },
    { id: 'bolinha', nome: 'Bolinha', de: '🔴', svg: () => `<circle cx="100" cy="114" r="7" fill="#ff7a8a"/>` },
  ];

  const BOCAS = [
    { id: 'sorriso', nome: 'Sorriso', de: '🙂', svg: () => line('M66 134 Q100 160 134 134', 7) },
    { id: 'dentes', nome: 'Dentes', de: '😀', svg: () => `<path d="M58 128 H142 Q138 168 100 168 Q62 168 58 128Z" fill="${INK}"/><path d="M62 129 H138 Q137 140 135 143 H65 Q63 140 62 129Z" fill="#fff"/>` },
    { id: 'sorrisao', nome: 'Sorrisão', de: '😁', svg: () => `<path d="M48 124 Q100 128 152 124 Q146 166 100 166 Q54 166 48 124Z" fill="#fff" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/><path d="M52 144 Q100 150 148 144 M74 128 V164 M100 129 V166 M126 128 V164" stroke="${INK}" stroke-width="3" fill="none"/>` },
    { id: 'gargalhada', nome: 'Gargalhada', de: '😂', svg: () => `<path d="M52 124 H148 Q144 176 100 176 Q56 176 52 124Z" fill="${INK}"/><path d="M56 125 H144 Q143 133 141 136 H59 Q57 133 56 125Z" fill="#fff"/><path d="M74 166 Q100 146 126 166 Q114 176 100 176 Q86 176 74 166Z" fill="#ff6b8a"/>` },
    { id: 'lingua', nome: 'Língua', de: '😛', svg: () => line('M64 132 Q100 156 136 132', 7) + `<path d="M84 144 Q84 172 100 172 Q116 172 116 144Z" fill="#ff6b8a" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><path d="M100 148 V164" stroke="#d94a6a" stroke-width="3" stroke-linecap="round"/>` },
    { id: 'gostoso', nome: 'Delícia', de: '😋', svg: () => line('M64 134 Q100 158 136 134', 7) + `<path d="M108 144 Q126 142 124 160 Q110 162 108 144Z" fill="#ff6b8a" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>` },
    { id: 'debochado', nome: 'Debochado', de: '😏', svg: () => line('M74 146 Q110 150 134 128', 7) },
    { id: 'o', nome: 'Surpreso', de: '😮', svg: () => `<ellipse cx="100" cy="146" rx="15" ry="19" fill="${INK}"/>` },
    { id: 'grito', nome: 'Grito', de: '😱', svg: () => `<ellipse cx="100" cy="150" rx="20" ry="30" fill="${INK}"/><ellipse cx="100" cy="166" rx="12" ry="9" fill="#ff6b8a"/>` },
    { id: 'triste', nome: 'Triste', de: '😢', svg: () => line('M70 154 Q100 132 130 154', 7) },
    { id: 'chorando', nome: 'Chorando', de: '😭', svg: () => `<path d="M62 160 Q100 118 138 160 Z" fill="${INK}"/><path d="M80 156 Q100 140 120 156Z" fill="#ff6b8a"/>` },
    { id: 'nervoso', nome: 'Nervoso', de: '😬', svg: () => `<rect x="58" y="130" width="84" height="30" rx="12" fill="#fff" stroke="${INK}" stroke-width="5"/><path d="M58 145 H142 M79 130 V160 M100 130 V160 M121 130 V160" stroke="${INK}" stroke-width="3"/>` },
    { id: 'reto', nome: 'Sem graça', de: '😐', svg: () => line('M72 146 H128', 7) },
    { id: 'tremido', nome: 'Tonto', de: '🥴', svg: () => line('M64 146 Q74 136 84 146 T104 146 T124 146 T140 142', 6) },
    { id: 'babando', nome: 'Babando', de: '🤤', svg: () => line('M64 134 Q100 158 136 134', 7) + `<path d="M118 146 Q114 168 120 174 Q128 168 122 146Z" fill="#7fd0ff" stroke="#1f7fd0" stroke-width="2"/>` },
    { id: 'cansado', nome: 'Calorão', de: '🥵', svg: () => `<path d="M68 132 Q100 128 132 132 Q128 156 100 156 Q72 156 68 132Z" fill="${INK}"/><path d="M84 146 Q84 178 100 178 Q116 178 116 146Z" fill="#ff6b8a" stroke="${INK}" stroke-width="3"/>` },
    { id: 'beijo', nome: 'Beijinho', de: '😗', svg: () => `<path d="M94 132 Q110 136 100 144 Q112 150 96 158" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>` },
    { id: 'ziper', nome: 'Zíper', de: '🤐', svg: () => line('M62 146 H138', 6) + `<path d="M70 140 V152 M80 140 V152 M90 140 V152 M100 140 V152 M110 140 V152 M120 140 V152 M130 140 V152" stroke="${INK}" stroke-width="3"/><rect x="132" y="138" width="10" height="16" rx="2" fill="#c9c9d6" stroke="${INK}" stroke-width="2"/>` },
    { id: 'vampiro', nome: 'Vampiro', de: '🧛', svg: () => line('M64 134 Q100 158 136 134', 7) + `<path d="M78 141 L84 158 L89 145Z M122 141 L116 158 L111 145Z" fill="#fff" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>` },
    { id: 'dentuco', nome: 'Dentuço', de: '🐰', svg: () => line('M66 134 Q100 152 134 134', 7) + `<rect x="88" y="141" width="11" height="16" rx="2" fill="#fff" stroke="${INK}" stroke-width="2.5"/><rect x="101" y="141" width="11" height="16" rx="2" fill="#fff" stroke="${INK}" stroke-width="2.5"/>` },
    { id: 'monstro', nome: 'Monstro', de: '👹', svg: () => `<path d="M56 130 Q100 176 144 130 Z" fill="${INK}"/><path d="M60 131 L68 146 L76 132 L86 150 L96 133 L106 150 L116 133 L126 148 L134 132 L140 131Z" fill="#fff"/>` },
    { id: 'e-labios', nome: 'Lábios', de: '👄', svg: () => g('👄', 100, 146, 46) },
    { id: 'e-pirulito', nome: 'Pirulito', de: '🍭', svg: () => line('M64 134 Q100 156 136 134', 7) + g('🍭', 140, 140, 40, 30) },
  ];

  const SOBRANCELHAS = [
    { id: 'nenhuma', nome: 'Nenhuma', de: '🚫', svg: () => '' },
    { id: 'bravo', nome: 'Bravo', de: '😠', svg: () => line('M54 58 L88 72', 7) + line('M146 58 L112 72', 7) },
    { id: 'desconfiado', nome: 'Desconfiado', de: '🤨', svg: () => line('M56 66 L88 66', 7) + line('M112 60 Q128 48 146 56', 7) },
    { id: 'preocupado', nome: 'Preocupado', de: '😟', svg: () => line('M56 70 L86 58', 7) + line('M144 70 L114 58', 7) },
    { id: 'feliz', nome: 'Feliz', de: '😊', svg: () => line('M56 64 Q72 52 88 62', 7) + line('M112 62 Q128 52 144 64', 7) },
    { id: 'grossa', nome: 'Grossona', de: '🧔', svg: () => `<path d="M52 62 Q72 50 92 60 L90 70 Q72 62 54 72Z M148 62 Q128 50 108 60 L110 70 Q128 62 146 72Z" fill="${INK}"/>` },
    { id: 'monocelha', nome: 'Monocelha', de: '🗿', svg: () => line('M54 64 Q78 54 100 64 Q122 54 146 64', 8) },
    { id: 'surpreso', nome: 'Lá em cima', de: '😲', svg: () => line('M58 54 Q72 44 86 54', 6) + line('M114 54 Q128 44 142 54', 6) },
    { id: 'triste', nome: 'Tristinho', de: '🥲', svg: () => line('M58 60 Q74 64 86 72', 6) + line('M142 60 Q126 64 114 72', 6) },
  ];

  const CHAPEUS = [
    { id: 'nenhum', nome: 'Nenhum', de: '🚫', svg: () => '' },
    { id: 'coroa', nome: 'Coroa', de: '👑', svg: () => `<path d="M58 34 L66 4 L84 22 L100 0 L116 22 L134 4 L142 34Z" fill="#ffc81e" stroke="#c98a00" stroke-width="4" stroke-linejoin="round"/><circle cx="100" cy="24" r="5" fill="#ff2d55"/><circle cx="78" cy="28" r="4" fill="#3fa0ff"/><circle cx="122" cy="28" r="4" fill="#3fa0ff"/>` },
    { id: 'festa', nome: 'Festa', de: '🥳', svg: () => `<path d="M76 34 L104 -10 L128 34Z" fill="#7a5cf0" stroke="#3b2a8f" stroke-width="3" stroke-linejoin="round"/><path d="M90 16 L112 18 M84 26 L120 28" stroke="#ffd23f" stroke-width="5" stroke-linecap="round"/><circle cx="104" cy="-10" r="7" fill="#ff5d8f"/>` },
    { id: 'cartola', nome: 'Cartola', de: '🎩', svg: () => `<rect x="70" y="-14" width="60" height="44" rx="4" fill="#1c1c2a"/><rect x="70" y="16" width="60" height="9" fill="#e0304a"/><rect x="52" y="28" width="96" height="10" rx="5" fill="#1c1c2a"/>` },
    { id: 'aureola', nome: 'Auréola', de: '😇', svg: () => `<ellipse cx="100" cy="14" rx="44" ry="11" fill="none" stroke="#ffd23f" stroke-width="7"/>` },
    { id: 'chifres', nome: 'Chifres', de: '😈', svg: () => `<path d="M44 46 Q34 18 46 6 Q50 28 70 38Z M156 46 Q166 18 154 6 Q150 28 130 38Z" fill="#7a45c7" stroke="#4a2486" stroke-width="3" stroke-linejoin="round"/>` },
    { id: 'bone', nome: 'Boné', de: '🧢', svg: () => `<path d="M42 54 Q42 6 100 6 Q158 6 158 54Z" fill="#2f6fe0"/><path d="M138 50 Q176 46 186 58 L140 60Z" fill="#1f4fb0"/><circle cx="100" cy="8" r="5" fill="#1f4fb0"/>` },
    { id: 'unicornio', nome: 'Chifre de unicórnio', de: '🦄', svg: () => `<path d="M88 30 L100 -26 L112 30Z" fill="#fff2a8" stroke="#e0b030" stroke-width="3" stroke-linejoin="round"/><path d="M92 18 L108 12 M95 4 L106 0 M97 -10 L103 -12" stroke="#e0b030" stroke-width="3"/>` },
    { id: 'orelhagato', nome: 'Orelhas de gato', de: '😺', svg: () => `<path d="M34 52 L40 -2 L78 26Z M166 52 L160 -2 L122 26Z" fill="#2a2a3a"/><path d="M44 40 L46 12 L66 28Z M156 40 L154 12 L134 28Z" fill="#ff8fb0"/>` },
    { id: 'orelhacoelho', nome: 'Orelhas de coelho', de: '🐇', svg: () => `<ellipse cx="74" cy="-6" rx="13" ry="38" fill="#fff" stroke="#c7c2d6" stroke-width="3"/><ellipse cx="74" cy="-4" rx="6" ry="28" fill="#ffb3c9"/><ellipse cx="126" cy="-6" rx="13" ry="38" fill="#fff" stroke="#c7c2d6" stroke-width="3"/><ellipse cx="126" cy="-4" rx="6" ry="28" fill="#ffb3c9"/>` },
    { id: 'lacinho', nome: 'Lacinho', de: '🎀', svg: () => g('🎀', 140, 24, 52, 20) },
    { id: 'e-formatura', nome: 'Formatura', de: '🎓', svg: () => g('🎓', 100, 10, 92) },
    { id: 'e-sol', nome: 'Chapéu de sol', de: '👒', svg: () => g('👒', 100, 12, 108) },
    { id: 'e-capacete', nome: 'Capacete', de: '⛑️', svg: () => g('⛑️', 100, 20, 104) },
    { id: 'e-militar', nome: 'Militar', de: '🪖', svg: () => g('🪖', 100, 18, 108) },
    { id: 'e-fone', nome: 'Fone', de: '🎧', svg: () => `<path d="M14 112 Q10 -2 100 -2 Q190 -2 186 112" fill="none" stroke="#2a2a3a" stroke-width="13" stroke-linecap="round"/><path d="M20 96 Q18 8 100 8" fill="none" stroke="#fff" stroke-width="3" opacity="0.25"/><rect x="-2" y="86" width="30" height="58" rx="13" fill="#ff4a5a" stroke="#2a2a3a" stroke-width="5"/><rect x="172" y="86" width="30" height="58" rx="13" fill="#ff4a5a" stroke="#2a2a3a" stroke-width="5"/><rect x="4" y="94" width="8" height="26" rx="4" fill="#fff" opacity="0.4"/>` },
    { id: 'e-cogumelo', nome: 'Cogumelo', de: '🍄', svg: () => g('🍄', 100, 2, 90) },
    { id: 'e-flor', nome: 'Flor', de: '🌻', svg: () => g('🌻', 146, 20, 56, 15) },
    { id: 'e-ovo', nome: 'Ovo frito', de: '🍳', svg: () => g('🍳', 100, 10, 80) },
    { id: 'e-gelo', nome: 'Sorvete', de: '🍦', svg: () => g('🍦', 100, 0, 72, 180) },
    { id: 'e-mago', nome: 'Varinha', de: '🪄', svg: () => g('🪄', 150, 6, 60, -10) },
  ];

  // Cabelo: separado da cabeça, pra dar pra usar junto com chapéu, fone...
  const CABELOS = [
    { id: 'nenhum', nome: 'Nenhum', de: '🚫', svg: () => '' },
    { id: 'espetado', nome: 'Espetado', de: '⚡', svg: () => `<path d="M30 70 L36 34 L52 46 L56 8 L76 32 L92 -4 L104 28 L124 -2 L132 30 L152 10 L150 44 L170 36 L168 72 Q100 30 30 70Z" fill="#2a1a10"/>` },
    { id: 'cacheado', nome: 'Cacheado', de: '🧑‍🦱', svg: () => [[40, 54, 18], [54, 32, 20], [78, 18, 22], [104, 14, 22], [128, 20, 21], [150, 34, 19], [162, 56, 16], [100, 36, 18], [70, 40, 16], [132, 42, 16]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#3b2414"/>`).join('') },
    { id: 'moicano', nome: 'Moicano', de: '🤘', svg: () => `<path d="M84 34 L80 -14 L92 4 L96 -20 L106 2 L114 -14 L116 34Z" fill="#ff2d75" stroke="#b5124f" stroke-width="2" stroke-linejoin="round"/>` },
    { id: 'franja', nome: 'Franjinha', de: '💇', svg: () => `<path d="M24 92 Q20 10 100 14 Q180 10 176 92 Q168 56 150 50 Q140 64 120 56 Q104 68 84 56 Q66 66 52 52 Q32 60 24 92Z" fill="#f0c040" stroke="#b58a10" stroke-width="2"/>` },
    { id: 'liso', nome: 'Liso comprido', de: '👩', svg: () => `<path d="M16 150 Q6 4 100 6 Q194 4 184 150 L166 150 Q170 70 144 46 Q100 64 56 46 Q30 70 34 150Z" fill="#6b3f1f"/>` },
    { id: 'coque', nome: 'Coque', de: '👱‍♀️', svg: () => `<circle cx="100" cy="-2" r="24" fill="#8a4a1f"/><path d="M24 84 Q26 12 100 12 Q174 12 176 84 Q152 38 100 38 Q48 38 24 84Z" fill="#8a4a1f"/>` },
    { id: 'chiquinha', nome: 'Maria-chiquinha', de: '👧', svg: () => `<ellipse cx="10" cy="86" rx="20" ry="34" fill="#3b2414"/><ellipse cx="190" cy="86" rx="20" ry="34" fill="#3b2414"/><path d="M24 84 Q26 12 100 12 Q174 12 176 84 Q152 38 100 38 Q48 38 24 84Z" fill="#3b2414"/>` + g('🎀', 22, 46, 26, -20) + g('🎀', 178, 46, 26, 20) },
    { id: 'blackpower', nome: 'Black power', de: '🧑🏿‍🦱', svg: () => [[26, 74, 24], [32, 40, 28], [58, 14, 30], [100, 4, 32], [142, 14, 30], [168, 40, 28], [174, 74, 24]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#24160c"/>`).join('') },
    { id: 'topete', nome: 'Topete', de: '🕺', svg: () => `<path d="M40 70 Q36 18 90 10 Q160 -4 172 34 Q150 22 128 30 Q140 44 130 52 Q100 30 70 40 Q50 48 40 70Z" fill="#2a1a10"/>` },
    { id: 'loiro', nome: 'Loiro arrepiado', de: '👱', svg: () => `<path d="M26 72 L22 30 L44 40 L46 2 L70 26 L84 -12 L100 20 L118 -12 L130 24 L156 2 L156 40 L178 30 L174 72 Q100 30 26 72Z" fill="#ffd23f" stroke="#c99a00" stroke-width="2" stroke-linejoin="round"/>` },
    { id: 'azul', nome: 'Colorido', de: '💙', svg: () => `<path d="M24 90 Q18 8 100 10 Q182 8 176 90 Q166 50 142 46 Q132 60 112 50 Q100 62 84 50 Q66 62 56 46 Q32 54 24 90Z" fill="#3fa0ff" stroke="#1f6fd0" stroke-width="2"/><path d="M60 28 Q100 14 140 28" stroke="#ff5d8f" stroke-width="8" fill="none" stroke-linecap="round"/>` },
    { id: 'careca', nome: 'Careca brilhando', de: '👨‍🦲', svg: () => `<ellipse cx="80" cy="34" rx="22" ry="9" fill="#fff" opacity="0.8"/>` + star(116, 26, 7) },
  ];

  // Mãos: aparecem embaixo, dos dois lados (a da esquerda é espelhada)
  const mao = (ch, dois = true, s = 50) => () => g(ch, 172, 174, s) + (dois ? g(ch, 28, 174, s, 0, true) : '');
  const MAOS = [
    { id: 'nenhuma', nome: 'Nenhuma', de: '🚫', svg: () => '' },
    { id: 'joinha', nome: 'Joinha', de: '👍', svg: mao('👍') },
    { id: 'tchau', nome: 'Tchau', de: '👋', svg: mao('👋', false) },
    { id: 'paz', nome: 'Paz', de: '✌️', svg: mao('✌️') },
    { id: 'rock', nome: 'Rock', de: '🤘', svg: mao('🤘') },
    { id: 'palmas', nome: 'Palmas', de: '👏', svg: () => g('👏', 100, 184, 54) },
    { id: 'viva', nome: 'Viva', de: '🙌', svg: mao('🙌', false, 56) },
    { id: 'dedos', nome: 'Dedos cruzados', de: '🤞', svg: mao('🤞') },
    { id: 'ok', nome: 'Ok', de: '👌', svg: mao('👌') },
    { id: 'liga', nome: 'Me liga', de: '🤙', svg: mao('🤙') },
    { id: 'forte', nome: 'Muque', de: '💪', svg: mao('💪') },
    { id: 'mao', nome: 'Mão aberta', de: '🖐️', svg: mao('🖐️') },
    { id: 'reza', nome: 'Por favor', de: '🙏', svg: () => g('🙏', 100, 184, 54) },
    { id: 'soco', nome: 'Soquinho', de: '👊', svg: mao('👊') },
    { id: 'teamo', nome: 'Te amo', de: '🤟', svg: mao('🤟') },
    { id: 'coracao', nome: 'Coração', de: '🫶', svg: () => g('🫶', 100, 184, 56) },
    { id: 'aponta', nome: 'Apontando', de: '👉', svg: mao('👉', false) },
    { id: 'cima', nome: 'Pra cima', de: '☝️', svg: mao('☝️', false) },
    { id: 'pensando', nome: 'Pensando', de: '🤔', svg: () => g('🫲', 120, 168, 50, -30) },
    { id: 'abraco', nome: 'Abraço', de: '🤗', svg: mao('🤲', false, 64) },
    { id: 'selfie', nome: 'Selfie', de: '🤳', svg: mao('🤳', false) },
    { id: 'escrevendo', nome: 'Escrevendo', de: '✍️', svg: mao('✍️', false) },
  ];

  // Extras: coisas em volta (pode escolher várias). 'baixo' = fica embaixo dos olhos e da boca
  const flut = (ch, x, y, s, rot = 0) => () => g(ch, x, y, s, rot);
  const EXTRAS = [
    { id: 'bochecha', nome: 'Bochecha', de: '😊', baixo: true, svg: () => `<ellipse cx="54" cy="122" rx="14" ry="9" fill="#ff7aa2" opacity="0.6"/><ellipse cx="146" cy="122" rx="14" ry="9" fill="#ff7aa2" opacity="0.6"/>` },
    { id: 'sardas', nome: 'Sardas', de: '🧒', baixo: true, svg: () => [[50, 112], [58, 120], [46, 124], [150, 112], [142, 120], [154, 124]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="#a0602a" opacity="0.8"/>`).join('') },
    { id: 'lagrimas', nome: 'Lágrimas', de: '😭', svg: () => `<path d="M50 100 Q42 116 50 124 Q58 116 50 100Z M150 100 Q142 116 150 124 Q158 116 150 100Z" fill="#4fb8ff" stroke="#1f7fd0" stroke-width="2"/>` },
    { id: 'cachoeira', nome: 'Choro cachoeira', de: '🥲', svg: () => `<path d="M64 100 Q60 140 50 186 L66 186 Q72 140 76 100Z M136 100 Q140 140 150 186 L134 186 Q128 140 124 100Z" fill="#7fd0ff" opacity="0.85"/>` },
    { id: 'suor', nome: 'Suor', de: '😅', svg: () => `<path d="M160 40 Q148 62 160 70 Q172 62 160 40Z" fill="#7fd0ff" stroke="#1f7fd0" stroke-width="2"/>` },
    { id: 'nerd', nome: 'Óculos nerd', de: '🤓', svg: () => `<circle cx="72" cy="88" r="22" fill="rgba(255,255,255,0.25)" stroke="#2a2a3a" stroke-width="6"/><circle cx="128" cy="88" r="22" fill="rgba(255,255,255,0.25)" stroke="#2a2a3a" stroke-width="6"/><path d="M94 86 H106" stroke="#2a2a3a" stroke-width="6"/>` },
    { id: 'monoculo', nome: 'Monóculo', de: '🧐', svg: () => `<circle cx="128" cy="88" r="22" fill="rgba(255,255,255,0.25)" stroke="#c98a00" stroke-width="5"/><path d="M146 102 Q160 140 150 170" fill="none" stroke="#c98a00" stroke-width="2"/>` },
    { id: 'pirata', nome: 'Tapa-olho', de: '🏴‍☠️', svg: () => `<path d="M30 60 L170 104" stroke="#111" stroke-width="5"/><ellipse cx="128" cy="90" rx="22" ry="20" fill="#111"/>` },
    { id: 'bigode', nome: 'Bigode', de: '🥸', svg: () => `<path d="M100 122 Q84 112 66 120 Q56 126 58 134 Q72 124 100 130 Q128 124 142 134 Q144 126 134 120 Q116 112 100 122Z" fill="#5a3416"/>` },
    { id: 'barba', nome: 'Barba', de: '🧔', svg: () => `<path d="M28 120 Q34 196 100 196 Q166 196 172 120 Q160 150 136 158 Q100 136 64 158 Q40 150 28 120Z" fill="#5a3416"/>` },
    { id: 'band', nome: 'Curativo', de: '🤕', svg: () => `<g transform="rotate(-25 140 58)"><rect x="118" y="50" width="44" height="16" rx="6" fill="#f5c79a" stroke="#c98a5a" stroke-width="2"/><rect x="133" y="50" width="14" height="16" fill="#e8b080"/></g>` },
    { id: 'mascara', nome: 'Máscara', de: '😷', svg: () => `<path d="M54 120 Q100 110 146 120 L140 158 Q100 172 60 158Z" fill="#f2f6ff" stroke="#9aa6c0" stroke-width="3"/><path d="M66 132 Q100 126 134 132 M68 144 Q100 140 132 144" stroke="#c6cfe2" stroke-width="3" fill="none"/><path d="M54 122 L28 110 M146 122 L172 110" stroke="#9aa6c0" stroke-width="3"/>` },
    { id: 'batom', nome: 'Marca de beijo', de: '💋', svg: flut('💋', 150, 128, 28, 20) },
    { id: 'brilho', nome: 'Brilhinhos', de: '✨', svg: () => star(18, 40, 10) + star(184, 150, 12) + star(176, 30, 7) },
    { id: 'zzz', nome: 'Soninho', de: '💤', svg: flut('💤', 168, 20, 40) },
    { id: 'raiva', nome: 'Raiva', de: '💢', svg: flut('💢', 162, 36, 38) },
    { id: 'pergunta', nome: 'Dúvida', de: '❓', svg: flut('❓', 176, 30, 40, 15) },
    { id: 'exclamacao', nome: 'Susto', de: '❗', svg: flut('❗', 176, 30, 40, 15) },
    { id: 'musica', nome: 'Musiquinha', de: '🎵', svg: () => g('🎵', 20, 60, 34, -15) + g('🎶', 182, 74, 30, 10) },
    { id: 'coracoes', nome: 'Coraçõezinhos', de: '💕', svg: () => g('❤️', 22, 40, 26, -20) + g('💕', 180, 26, 30, 15) + g('💖', 186, 120, 24) },
    { id: 'tonto', nome: 'Estrelinhas tontas', de: '💫', svg: () => g('💫', 40, 10, 30) + g('⭐', 100, -6, 26) + g('💫', 160, 10, 30) },
    { id: 'fogo', nome: 'Pegando fogo', de: '🔥', svg: () => g('🔥', 62, 6, 46, -15) + g('🔥', 100, -6, 54) + g('🔥', 138, 6, 46, 15) },
    { id: 'raio', nome: 'Raios', de: '⚡', svg: () => g('⚡', 18, 70, 38, -20) + g('⚡', 184, 70, 38, 20) },
    { id: 'arcoiris', nome: 'Arco-íris', de: '🌈', svg: flut('🌈', 100, -4, 110) },
    { id: 'bolhas', nome: 'Bolhas', de: '🫧', svg: () => g('🫧', 22, 150, 34) + g('🫧', 180, 40, 28) },
    { id: 'gotas', nome: 'Respingos', de: '💦', svg: flut('💦', 20, 40, 36, -10) },
    { id: 'flor', nome: 'Flor na orelha', de: '🌸', svg: flut('🌸', 26, 72, 40) },
    { id: 'borboleta', nome: 'Borboleta', de: '🦋', svg: flut('🦋', 30, 14, 40, -15) },
    { id: 'abelha', nome: 'Abelhinha', de: '🐝', svg: flut('🐝', 178, 100, 32, 15) },
    { id: 'pensamento', nome: 'Pensando', de: '💭', svg: flut('💭', 172, 6, 50) },
    { id: 'fala', nome: 'Falando', de: '💬', svg: flut('💬', 176, 14, 46) },
    { id: 'cem', nome: '100', de: '💯', svg: flut('💯', 176, 168, 40, 10) },
    { id: 'bola', nome: 'Bola', de: '⚽', svg: flut('⚽', 24, 172, 38) },
    { id: 'trofeu', nome: 'Troféu', de: '🏆', svg: flut('🏆', 176, 170, 42) },
    { id: 'diamante', nome: 'Diamante', de: '💎', svg: flut('💎', 178, 160, 34) },
    { id: 'estrelao', nome: 'Estrelona', de: '🌟', svg: flut('🌟', 24, 24, 40, -10) },
    { id: 'pizza', nome: 'Pizza', de: '🍕', svg: flut('🍕', 178, 160, 40, 20) },
    { id: 'sorvete', nome: 'Sorvete', de: '🍦', svg: flut('🍦', 24, 160, 42, -15) },
    { id: 'balao', nome: 'Balão', de: '🎈', svg: () => g('🎈', 184, 10, 46, 10) },
    { id: 'presente', nome: 'Presente', de: '🎁', svg: flut('🎁', 22, 168, 38) },
    { id: 'mapa', nome: 'Planeta', de: '🪐', svg: flut('🪐', 22, 30, 38) },
  ];

  const CATS = [
    { id: 'rosto', nome: 'ROSTO', lista: ROSTOS, dica: 'Escolha a cor e o jeito do rosto.' },
    { id: 'olhos', nome: 'OLHOS', lista: OLHOS, dica: 'De qual emoji você quer os olhos?' },
    { id: 'nariz', nome: 'NARIZ', lista: NARIZES, dica: 'Quer um nariz?' },
    { id: 'boca', nome: 'BOCA', lista: BOCAS, dica: 'De qual emoji você quer a boca?' },
    { id: 'sobrancelha', nome: 'SOBRANCELHA', lista: SOBRANCELHAS, dica: 'Sobrancelha muda a cara toda!' },
    { id: 'cabelo', nome: 'CABELO', lista: CABELOS, dica: 'Escolha o cabelo. Dá pra usar junto com chapéu e fone!' },
    { id: 'chapeu', nome: 'CABEÇA', lista: CHAPEUS, dica: 'Chapéu, fone ou orelhas.' },
    { id: 'maos', nome: 'MÃOS', lista: MAOS, dica: 'O que as mãos estão fazendo?' },
    { id: 'extras', nome: 'EXTRAS', lista: EXTRAS, dica: 'Pode escolher vários! Toque de novo pra tirar.', varios: true },
  ];
  const byId = (lista, id) => lista.find(p => p.id === id) || lista[0];

  // ── O emoji montado ──
  let uid = 0;
  // O formato da cabeça (com as orelhas de bicho atrás)
  function cabeca(r, fill) {
    const borda = `stroke="${r.c2}" stroke-width="3"`;
    const orelhas = {
      gato: `<path d="M34 60 L38 6 L84 34Z M166 60 L162 6 L116 34Z" fill="${fill}" ${borda}/><path d="M46 46 L48 20 L70 34Z M154 46 L152 20 L130 34Z" fill="#ff9bb8"/>`,
      urso: `<circle cx="42" cy="36" r="24" fill="${fill}" ${borda}/><circle cx="158" cy="36" r="24" fill="${fill}" ${borda}/><circle cx="42" cy="36" r="12" fill="${r.c2}" opacity="0.6"/><circle cx="158" cy="36" r="12" fill="${r.c2}" opacity="0.6"/>`,
      coelho: `<ellipse cx="70" cy="-2" rx="15" ry="42" fill="${fill}" ${borda}/><ellipse cx="130" cy="-2" rx="15" ry="42" fill="${fill}" ${borda}/><ellipse cx="70" cy="0" rx="7" ry="30" fill="#ffb3c9"/><ellipse cx="130" cy="0" rx="7" ry="30" fill="#ffb3c9"/>`,
      porco: `<path d="M30 54 L34 14 L70 32Z M170 54 L166 14 L130 32Z" fill="${fill}" ${borda}/>`,
      sapo: `<circle cx="66" cy="38" r="26" fill="${fill}" ${borda}/><circle cx="134" cy="38" r="26" fill="${fill}" ${borda}/>`,
    }[r.forma] || '';
    let forma;
    if (r.forma === 'robo') forma = `<rect x="20" y="24" width="160" height="164" rx="34" fill="${fill}" ${borda}/><path d="M100 24 V2" stroke="${r.c2}" stroke-width="5"/><circle cx="100" cy="0" r="8" fill="#ff4a5a"/><rect x="8" y="88" width="14" height="40" rx="5" fill="${r.c2}"/><rect x="178" y="88" width="14" height="40" rx="5" fill="${r.c2}"/>`;
    else if (r.forma === 'alien') forma = `<path d="M100 18 C170 18 190 80 170 130 C150 180 120 194 100 194 C80 194 50 180 30 130 C10 80 30 18 100 18Z" fill="${fill}" ${borda}/>`;
    else forma = `<circle cx="100" cy="104" r="84" fill="${fill}" ${borda}/>`;
    return orelhas + forma;
  }
  function desenha(e) {
    const r = byId(ROSTOS, e.rosto), id = 'g' + (uid++);
    const fill = `url(#${id})`;
    const grad = r.arco
      ? `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff5d5d"/><stop offset="0.2" stop-color="#ffb02e"/><stop offset="0.4" stop-color="#ffe36b"/><stop offset="0.6" stop-color="#5fe08a"/><stop offset="0.8" stop-color="#5cb8ff"/><stop offset="1" stop-color="#b06cff"/></linearGradient>`
      : `<radialGradient id="${id}" cx="40%" cy="35%" r="70%"><stop offset="0%" stop-color="${r.c1}"/><stop offset="100%" stop-color="${r.c2}"/></radialGradient>`;
    const extras = EXTRAS.filter(x => (e.extras || []).includes(x.id));
    const baixo = extras.filter(x => x.baixo), cima = extras.filter(x => !x.baixo);
    return `<svg viewBox="-12 -30 224 240" xmlns="http://www.w3.org/2000/svg">
      <defs>${grad}</defs>
      <ellipse cx="104" cy="196" rx="70" ry="9" fill="#000" opacity="0.12"/>
      ${cabeca(r, fill)}
      <ellipse cx="74" cy="52" rx="26" ry="14" fill="#fff" opacity="0.35"/>
      ${baixo.map(x => x.svg()).join('')}
      ${byId(SOBRANCELHAS, e.sobrancelha).svg()}
      ${byId(OLHOS, e.olhos).svg()}
      ${byId(NARIZES, e.nariz).svg()}
      ${byId(BOCAS, e.boca).svg()}
      ${cima.map(x => x.svg()).join('')}
      ${byId(CABELOS, e.cabelo || (CABELOS.some(h => h.id === e.chapeu) ? e.chapeu : 'nenhum')).svg()}
      ${byId(CHAPEUS, e.chapeu).svg()}
      ${byId(MAOS, e.maos).svg()}
    </svg>`;
  }

  // Só deixa passar um emoji com partes que existem (pra guardar e mandar no chat)
  function limpa(e) {
    if (!e || typeof e !== 'object') return null;
    const out = {};
    for (const c of CATS) {
      if (c.varios) out.extras = (Array.isArray(e.extras) ? e.extras : []).filter(id => c.lista.some(p => p.id === id)).slice(0, 50);
      else out[c.id] = c.lista.some(p => p.id === e[c.id]) ? e[c.id] : c.lista[0].id;
    }
    if (!e.cabelo && CABELOS.some(h => h.id === e.chapeu)) { out.cabelo = e.chapeu; out.chapeu = 'nenhum'; }
    return out;
  }
  window.MontaEmoji = { CATS, desenha, limpa, ROSTOS, OLHOS, NARIZES, BOCAS, SOBRANCELHAS, CABELOS, CHAPEUS, MAOS, EXTRAS };
})();
