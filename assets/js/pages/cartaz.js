/*
 * Oficina de cartazes.
 *
 * O cartaz é desenhado inteiro num <canvas>: a prévia na tela e a imagem
 * baixada são o mesmo desenho, então a foto sai exatamente onde foi posta.
 *
 * Camadas, de baixo para cima:
 *   papel (cor + fibras + manchas + bordas queimadas + dobras)
 *   foto (com tom sépia / preto e branco e um pouco do papel por cima)
 *   tinta (todo o texto, molduras e enfeites, com falhas de impressão)
 *   carimbo e prego
 * A borda do papel é rasgada e fica transparente no PNG.
 */
(function (OP) {
  const $ = (id) => document.getElementById(id);
  const tela = $('tela');
  const ctx = tela.getContext('2d');
  const W = tela.width, H = tela.height;

  const campos = {
    nome: $('c-nome'), valor: $('c-valor'), modelo: $('c-modelo'), arquivo: $('c-foto'),
    zoom: $('c-zoom'), x: $('c-x'), y: $('c-y'),
  };
  const estado = {
    foto: null,        // canvas com a foto já reduzida
    fotoTom: null,     // a mesma foto com o tom aplicado
    tom: 'sepia', fonte: 'Rye', papel: 2, semente: 7,
    zoom: 1, px: 0, py: 0,
  };

  /* ---------- Sorteio com semente: o mesmo número dá o mesmo desgaste ---------- */

  function sorteio(semente) {
    let a = semente >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const novaTela = (w = W, h = H) => {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  };

  /* ---------- Cores e textos de cada tipo ---------- */

  const TIPOS = {
    procurado: { papel: ['#f1dfae', '#e3c78a', '#c9a565'], tinta: '#2a1a0c', carimbo: '#9e2a22' },
    marinha: { papel: ['#eef1ee', '#dfe4df', '#c5cdc6'], tinta: '#15304a', carimbo: '#1f4f86' },
    governo: { papel: ['#e9d8b0', '#d6be8a', '#b99c66'], tinta: '#1b1712', carimbo: '#a3161f' },
  };

  const TEXTO = {
    pt: {
      procurado: ['PROCURADO', 'VIVO OU MORTO', 'MARINHA'],
      marinha: ['MARINHA', 'FICHA DE OFICIAL', 'QUARTEL-GENERAL'],
      governo: ['DOSSIÊ', 'GOVERNO MUNDIAL', 'MARY GEOISE'],
      letra: {
        procurado: ['Qualquer informação que leve à captura deste pirata', 'deve ser levada à base da Marinha mais próxima.', 'A recompensa será paga em berries, sem perguntas.'],
        marinha: ['Registro oficial de serviço. Este documento pertence', 'ao arquivo do Quartel-General da Marinha e não', 'pode ser copiado nem levado para fora da base.'],
        governo: ['Acesso restrito por ordem do Governo Mundial.', 'O conteúdo deste dossiê não existe oficialmente.', 'Quem ler sem autorização será investigado.'],
      },
      cargo: { marinha: 'OFICIAL', governo: 'AGENTE' },
      carimbo: { procurado: 'MARINHA', marinha: 'ARQUIVO', governo: 'SIGILOSO' },
      semRecompensa: 'SEM RECOMPENSA',
    },
    en: {
      procurado: ['WANTED', 'DEAD OR ALIVE', 'MARINE'],
      marinha: ['MARINES', 'OFFICER RECORD', 'HEADQUARTERS'],
      governo: ['DOSSIER', 'WORLD GOVERNMENT', 'MARY GEOISE'],
      letra: {
        procurado: ['Any information leading to the capture of this pirate', 'must be brought to the nearest Marine base.', 'The reward will be paid in berries, no questions asked.'],
        marinha: ['Official service record. This document belongs to', 'the archive of Marine Headquarters and may not', 'be copied or taken outside the base.'],
        governo: ['Restricted access by order of the World Government.', 'The contents of this dossier do not officially exist.', 'Anyone reading it without clearance will be investigated.'],
      },
      cargo: { marinha: 'OFFICER', governo: 'AGENT' },
      carimbo: { procurado: 'MARINE', marinha: 'ARCHIVE', governo: 'CLASSIFIED' },
      semRecompensa: 'NO BOUNTY',
    },
  }[OP.idioma];

  // tamanho que cada fonte precisa para ocupar a mesma largura (algumas são mais largas)
  const FONTES = {
    'Rye': { css: "'Rye', Georgia, serif", escala: 1 },
    'Pirata One': { css: "'Pirata One', Georgia, serif", escala: 1.25 },
    'IM Fell English SC': { css: "'IM Fell English SC', Georgia, serif", escala: 1.15 },
    'Uncial Antiqua': { css: "'Uncial Antiqua', Georgia, serif", escala: 1 },
    'Grenze Gotisch': { css: "'Grenze Gotisch', Georgia, serif", escala: 1.2, peso: 700 },
  };
  const NUMEROS = "'IM Fell DW Pica', Georgia, serif";

  /* ---------- Geometria do cartaz ---------- */

  const M = 92;                                   // margem da moldura
  const FOTO = { x: 160, y: 372, w: W - 320, h: 640 };

  /* ---------- Papel (só muda com a semente, o tipo e o desgaste) ---------- */

  let cachePapel = { chave: '', borda: null, papel: null, fibras: null, falhas: null };

  // Contorno rasgado: pontos ao longo das quatro bordas com mordidas irregulares
  function bordaRasgada(rnd, desgaste) {
    const pts = [];
    const fundo = 10 + desgaste * 7;
    const passo = 7;
    const mordidas = [];
    for (let i = 0; i < 2 + desgaste * 2; i++) mordidas.push({ lado: Math.floor(rnd() * 4), pos: 0.1 + rnd() * 0.8, tam: 30 + rnd() * 40 * desgaste, larg: 0.03 + rnd() * 0.05 });
    const morde = (lado, t) => mordidas.reduce((acc, m) => {
      if (m.lado !== lado) return acc;
      const d = Math.abs(t - m.pos) / m.larg;
      return d < 1 ? acc + m.tam * (1 - d * d) : acc;
    }, 0);
    const margem = 16;
    let r = 0;
    const tremor = () => { r = r * 0.55 + (rnd() - 0.5) * fundo; return Math.abs(r) + rnd() * fundo * 0.4; };
    for (let x = margem; x < W - margem; x += passo) pts.push([x, margem + tremor() + morde(0, x / W)]);
    for (let y = margem; y < H - margem; y += passo) pts.push([W - margem - tremor() - morde(1, y / H), y]);
    for (let x = W - margem; x > margem; x -= passo) pts.push([x, H - margem - tremor() - morde(2, x / W)]);
    for (let y = H - margem; y > margem; y -= passo) pts.push([margem + tremor() + morde(3, y / H), y]);
    const p = new Path2D();
    pts.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y)));
    p.closePath();
    return p;
  }

  function montarPapel() {
    const tipo = TIPOS[campos.modelo.value] || TIPOS.procurado;
    const chave = `${campos.modelo.value}|${estado.semente}|${estado.papel}`;
    if (cachePapel.chave === chave) return cachePapel;
    const rnd = sorteio(estado.semente * 97 + estado.papel);
    const d = estado.papel; // 1 a 3
    const borda = bordaRasgada(rnd, d);
    const c = novaTela();
    const g = c.getContext('2d');
    g.save();
    g.clip(borda);

    // cor de base com luz desigual
    const [claro, medio, escuro] = tipo.papel;
    const base = g.createLinearGradient(0, 0, W, H);
    base.addColorStop(0, claro); base.addColorStop(0.55, medio); base.addColorStop(1, escuro);
    g.fillStyle = base; g.fillRect(0, 0, W, H);
    const luz = g.createRadialGradient(W * 0.42, H * 0.32, 60, W * 0.42, H * 0.32, W * 0.95);
    luz.addColorStop(0, 'rgba(255,250,230,.45)'); luz.addColorStop(1, 'rgba(255,250,230,0)');
    g.fillStyle = luz; g.fillRect(0, 0, W, H);

    // manchas de umidade e de café
    for (let i = 0; i < 6 + d * 5; i++) {
      const x = rnd() * W, y = rnd() * H, r = 40 + rnd() * 200;
      const m = g.createRadialGradient(x, y, r * 0.1, x, y, r);
      const a = (0.04 + rnd() * 0.07) * d;
      m.addColorStop(0, `rgba(110,70,25,${a})`); m.addColorStop(0.7, `rgba(110,70,25,${a * 0.5})`); m.addColorStop(1, 'rgba(110,70,25,0)');
      g.fillStyle = m;
      g.beginPath(); g.ellipse(x, y, r, r * (0.6 + rnd() * 0.5), rnd() * 3, 0, Math.PI * 2); g.fill();
    }
    for (let i = 0; i < d - 1; i++) { // anel de caneca
      const x = 200 + rnd() * (W - 400), y = 200 + rnd() * (H - 400), r = 70 + rnd() * 40;
      g.strokeStyle = 'rgba(100,60,20,.16)'; g.lineWidth = 5 + rnd() * 5;
      g.beginPath(); g.arc(x, y, r, rnd() * 2, rnd() * 2 + 5.2); g.stroke();
      g.lineWidth = 2; g.strokeStyle = 'rgba(100,60,20,.1)';
      g.beginPath(); g.arc(x + 3, y + 2, r - 7, 0, Math.PI * 2); g.stroke();
    }

    // dobras: o papel ficou guardado dobrado em quatro
    const dobra = (x1, y1, x2, y2) => {
      const ang = Math.atan2(y2 - y1, x2 - x1) + Math.PI / 2;
      const ox = Math.cos(ang) * 3, oy = Math.sin(ang) * 3;
      g.lineWidth = 2.5;
      g.strokeStyle = `rgba(70,40,10,${0.12 + d * 0.05})`;
      g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
      g.strokeStyle = `rgba(255,250,235,${0.35 + d * 0.05})`;
      g.beginPath(); g.moveTo(x1 + ox, y1 + oy); g.lineTo(x2 + ox, y2 + oy); g.stroke();
      const sombra = g.createLinearGradient(x1 - ox * 12, y1 - oy * 12, x1 + ox * 12, y1 + oy * 12);
      sombra.addColorStop(0, 'rgba(70,40,10,0)'); sombra.addColorStop(0.5, `rgba(70,40,10,${0.05 * d})`); sombra.addColorStop(1, 'rgba(70,40,10,0)');
      g.strokeStyle = sombra; g.lineWidth = 70;
      g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
    };
    if (d >= 2) dobra(W / 2 + (rnd() - 0.5) * 30, 0, W / 2 + (rnd() - 0.5) * 30, H);
    dobra(0, H * 0.52 + (rnd() - 0.5) * 40, W, H * 0.52 + (rnd() - 0.5) * 40);

    // borda queimada / escurecida pelo tempo, por dentro do rasgo
    g.shadowColor = `rgba(70,35,8,${0.45 + d * 0.15})`;
    g.shadowBlur = 40 + d * 25;
    g.lineWidth = 30;
    g.strokeStyle = `rgba(90,50,15,${0.25 + d * 0.15})`;
    g.stroke(borda);
    g.shadowBlur = 0;
    g.lineWidth = 3;
    g.strokeStyle = `rgba(60,30,8,${0.35 + d * 0.1})`;
    g.stroke(borda);
    g.restore();

    // fibras do papel (camada à parte, aplicada por cima da foto também)
    const fibras = novaTela(W / 2, H / 2);
    const fg = fibras.getContext('2d');
    const img = fg.createImageData(fibras.width, fibras.height);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = rnd();
      const tom = v > 0.5 ? 255 : 60;
      img.data[i] = tom; img.data[i + 1] = tom * 0.85; img.data[i + 2] = tom * 0.6;
      img.data[i + 3] = Math.abs(v - 0.5) * 40 * (0.6 + d * 0.25);
    }
    fg.putImageData(img, 0, 0);
    fg.strokeStyle = 'rgba(90,60,25,.12)'; fg.lineWidth = 0.6;
    for (let i = 0; i < 900; i++) {
      const x = rnd() * fibras.width, y = rnd() * fibras.height, a = rnd() * Math.PI, l = 3 + rnd() * 10;
      fg.beginPath(); fg.moveTo(x, y); fg.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); fg.stroke();
    }

    // falhas da tinta: pontinhos que "comem" a impressão
    const falhas = novaTela(W / 2, H / 2);
    const kg = falhas.getContext('2d');
    kg.fillStyle = '#000';
    for (let i = 0; i < 2500 * d; i++) {
      const r = rnd() < 0.92 ? rnd() * 1.1 : 1 + rnd() * 2.4;
      kg.globalAlpha = 0.3 + rnd() * 0.7;
      kg.beginPath(); kg.arc(rnd() * falhas.width, rnd() * falhas.height, r, 0, Math.PI * 2); kg.fill();
    }

    cachePapel = { chave, borda, papel: c, fibras, falhas };
    return cachePapel;
  }

  /* ---------- Foto ---------- */

  // reduz fotos de celular (12 MP ou mais) para não pesar a memória
  async function lerFoto(arquivo) {
    const url = URL.createObjectURL(arquivo);
    try {
      const img = await new Promise((ok, falha) => {
        const i = new Image();
        i.onload = () => ok(i);
        i.onerror = falha;
        i.src = url;
      });
      const lado = 1600;
      const k = Math.min(1, lado / Math.max(img.naturalWidth, img.naturalHeight));
      const c = novaTela(Math.round(img.naturalWidth * k), Math.round(img.naturalHeight * k));
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      return c;
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  // sépia e preto e branco feitos à mão (o ctx.filter não existe em todo navegador)
  function aplicarTom() {
    if (!estado.foto) { estado.fotoTom = null; return; }
    const src = estado.foto;
    const c = novaTela(src.width, src.height);
    const g = c.getContext('2d');
    g.drawImage(src, 0, 0);
    if (estado.tom !== 'cor') {
      const dados = g.getImageData(0, 0, c.width, c.height);
      const p = dados.data;
      for (let i = 0; i < p.length; i += 4) {
        let l = 0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2];
        l = Math.max(0, Math.min(255, (l - 128) * 1.15 + 128)); // um pouco mais de contraste
        if (estado.tom === 'pb') { p[i] = p[i + 1] = p[i + 2] = l; }
        else { p[i] = Math.min(255, l * 1.02 + 34); p[i + 1] = Math.min(255, l * 0.9 + 24); p[i + 2] = l * 0.7 + 12; }
      }
      g.putImageData(dados, 0, 0);
    }
    estado.fotoTom = c;
  }

  // Onde a foto fica dentro da moldura: zoom 1 cobre a moldura toda,
  // px/py (-1 a 1) andam até a beira da foto
  function caixaDaFoto() {
    const f = estado.fotoTom;
    const cobre = Math.max(FOTO.w / f.width, FOTO.h / f.height) * estado.zoom;
    const w = f.width * cobre, h = f.height * cobre;
    const folgaX = (w - FOTO.w) / 2, folgaY = (h - FOTO.h) / 2;
    return {
      x: FOTO.x - folgaX - estado.px * folgaX,
      y: FOTO.y - folgaY - estado.py * folgaY,
      w, h, folgaX, folgaY,
    };
  }

  /* ---------- Desenho ---------- */

  // escreve centralizado diminuindo a fonte até caber
  function texto(g, t, x, y, larg, tam, familia, { peso = 400, espaco = 0, alinhar = 'center' } = {}) {
    let s = tam;
    const aplicar = () => {
      g.font = `${peso} ${s}px ${familia}`;
      if ('letterSpacing' in g) g.letterSpacing = `${espaco * s}px`;
    };
    aplicar();
    while (g.measureText(t).width > larg && s > 12) { s -= 2; aplicar(); }
    g.textAlign = alinhar;
    g.fillText(t, x, y);
    if ('letterSpacing' in g) g.letterSpacing = '0px';
    return s;
  }

  function enfeiteCanto(g, x, y, sx, sy) {
    g.save();
    g.translate(x, y); g.scale(sx, sy);
    g.beginPath();
    g.moveTo(0, 46); g.lineTo(0, 0); g.lineTo(46, 0);
    g.moveTo(12, 34); g.quadraticCurveTo(12, 12, 34, 12);
    g.stroke();
    g.beginPath(); g.arc(22, 22, 5, 0, Math.PI * 2); g.fill();
    g.restore();
  }

  function estrela(g, x, y, r) {
    g.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const rr = i % 2 ? r * 0.45 : r;
      g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    g.closePath(); g.fill();
  }

  // Tudo o que é tinta vai numa camada só, para receber as falhas de impressão
  function desenharTinta(tipoNome, cor) {
    const c = novaTela();
    const g = c.getContext('2d');
    const fonte = FONTES[estado.fonte] || FONTES.Rye;
    const [titulo, meio] = TEXTO[tipoNome];
    g.fillStyle = cor; g.strokeStyle = cor;
    g.textBaseline = 'alphabetic';

    // moldura dupla com cantos
    g.lineWidth = 7; g.strokeRect(M, M, W - 2 * M, H - 2 * M);
    g.lineWidth = 2.5; g.strokeRect(M + 16, M + 16, W - 2 * M - 32, H - 2 * M - 32);
    g.lineWidth = 3;
    const c1 = M + 30;
    enfeiteCanto(g, c1, c1, 1, 1); enfeiteCanto(g, W - c1, c1, -1, 1);
    enfeiteCanto(g, c1, H - c1, 1, -1); enfeiteCanto(g, W - c1, H - c1, -1, -1);

    // título
    texto(g, titulo, W / 2, 312, W - 2 * M - 120, 210 * fonte.escala, fonte.css, { peso: fonte.peso || 400, espaco: 0.04 });

    // moldura da foto
    g.lineWidth = 12; g.strokeRect(FOTO.x - 6, FOTO.y - 6, FOTO.w + 12, FOTO.h + 12);
    g.lineWidth = 3; g.strokeRect(FOTO.x - 22, FOTO.y - 22, FOTO.w + 44, FOTO.h + 44);
    if (!estado.fotoTom) {
      g.globalAlpha = 0.18;
      texto(g, OP.iniciais(campos.nome.value || '?') || '?', W / 2, FOTO.y + FOTO.h / 2 + 110, FOTO.w - 80, 320, fonte.css);
      g.globalAlpha = 1;
    }

    // "vivo ou morto" entre fios e estrelas
    const ym = FOTO.y + FOTO.h + 108;
    const tm = texto(g, meio, W / 2, ym, 640, 76 * fonte.escala, fonte.css, { peso: fonte.peso || 400, espaco: 0.06 });
    const meia = Math.min(320, g.measureText(meio).width / 2) + 40;
    g.lineWidth = 3;
    [[M + 60, W / 2 - meia], [W / 2 + meia, W - M - 60]].forEach(([a, b]) => {
      g.beginPath(); g.moveTo(a, ym - tm * 0.32); g.lineTo(b, ym - tm * 0.32); g.stroke();
      g.beginPath(); g.moveTo(a + 20, ym - tm * 0.32 + 10); g.lineTo(b - 20, ym - tm * 0.32 + 10); g.stroke();
    });
    estrela(g, M + 46, ym - tm * 0.28, 12); estrela(g, W - M - 46, ym - tm * 0.28, 12);

    // nome
    const nome = (campos.nome.value.trim() || OP.t('semNome')).toUpperCase();
    texto(g, nome, W / 2, ym + 150, W - 2 * M - 120, 136 * fonte.escala, fonte.css, { peso: fonte.peso || 400, espaco: 0.03 });

    // recompensa (ou cargo)
    const yv = ym + 282;
    if (tipoNome === 'procurado') {
      const n = numeroDigitado();
      const t = n == null ? TEXTO.semRecompensa : `${n.toLocaleString(OP.local)}-`;
      const familia = estado.fonte === 'IM Fell English SC' || estado.fonte === 'Uncial Antiqua' ? FONTES.Rye.css : fonte.css;
      const s = texto(g, t, W / 2 + (n == null ? 0 : 40), yv, W - 2 * M - 240, 118 * (familia === fonte.css ? fonte.escala : 1), familia, { peso: fonte.peso || 400, espaco: 0.02 });
      if (n != null) {
        g.font = `${fonte.peso || 400} ${s}px ${familia}`;
        const larg = g.measureText(t).width;
        g.font = `${s * 0.95}px Georgia, serif`;
        g.textAlign = 'right';
        g.fillText('฿', W / 2 + 40 - larg / 2 - 16, yv);
      }
    } else {
      texto(g, TEXTO.cargo[tipoNome], W / 2, yv, 700, 92 * fonte.escala, fonte.css, { peso: fonte.peso || 400, espaco: 0.12 });
    }

    // letras miúdas
    g.globalAlpha = 0.85;
    TEXTO.letra[tipoNome].forEach((linha, i) => texto(g, linha, W / 2, yv + 58 + i * 30, W - 2 * M - 180, 25, NUMEROS));
    g.globalAlpha = 1;
    if (tipoNome === 'governo') { // tarjas pretas de censura
      const r = sorteio(estado.semente);
      for (let i = 0; i < 3; i++) g.fillRect(W / 2 - 330 + r() * 420, yv + 37 + i * 30, 90 + r() * 120, 26);
    }

    // rodapé
    texto(g, TEXTO[tipoNome][2], W - M - 70, H - M - 36, 520, 46 * fonte.escala, fonte.css, { peso: fonte.peso || 400, alinhar: 'right', espaco: 0.08 });
    g.font = `26px ${NUMEROS}`; g.textAlign = 'left';
    g.fillText(`Nº ${String(1000 + (estado.semente * 7919) % 9000)}`, M + 92, H - M - 40);
    return c;
  }

  // carimbo redondo genérico com uma âncora
  function carimbo(g, x, y, r, cor, palavra, giro) {
    g.save();
    g.translate(x, y); g.rotate(giro);
    g.strokeStyle = cor; g.fillStyle = cor;
    g.globalAlpha = 0.78;
    g.lineWidth = 7; g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.stroke();
    g.lineWidth = 3; g.beginPath(); g.arc(0, 0, r - 16, 0, Math.PI * 2); g.stroke();
    // âncora
    g.lineWidth = 7; g.lineCap = 'round';
    g.beginPath(); g.moveTo(0, -r * 0.42); g.lineTo(0, r * 0.36); g.stroke();
    g.beginPath(); g.moveTo(-r * 0.22, -r * 0.22); g.lineTo(r * 0.22, -r * 0.22); g.stroke();
    g.beginPath(); g.arc(0, -r * 0.5, r * 0.09, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.arc(0, r * 0.02, r * 0.36, Math.PI * 0.15, Math.PI * 0.85); g.stroke();
    // palavra em volta
    g.font = `${r * 0.2}px ${NUMEROS}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    const letras = palavra.split('');
    const arco = Math.min(Math.PI * 1.1, letras.length * 0.22);
    letras.forEach((l, i) => {
      g.save();
      g.rotate(-arco / 2 + (arco * (i + 0.5)) / letras.length);
      g.fillText(l, 0, -r + 34);
      g.restore();
    });
    g.restore();
  }

  function carimboRetangular(g, x, y, cor, palavra, giro) {
    g.save();
    g.translate(x, y); g.rotate(giro);
    g.strokeStyle = cor; g.fillStyle = cor; g.globalAlpha = 0.75;
    g.font = `150px ${FONTES.Rye.css}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    const tw = g.measureText(palavra).width;
    g.lineWidth = 10; g.strokeRect(-tw / 2 - 40, -100, tw + 80, 200);
    g.lineWidth = 4; g.strokeRect(-tw / 2 - 24, -84, tw + 48, 168);
    g.fillText(palavra, 0, 8);
    g.restore();
  }

  function prego(g, x, y) {
    g.save();
    g.fillStyle = 'rgba(0,0,0,.35)';
    g.beginPath(); g.ellipse(x + 8, y + 10, 22, 16, 0, 0, Math.PI * 2); g.fill();
    const cab = g.createRadialGradient(x - 6, y - 6, 2, x, y, 20);
    cab.addColorStop(0, '#d9d4cc'); cab.addColorStop(0.5, '#7d766c'); cab.addColorStop(1, '#3a342d');
    g.fillStyle = cab;
    g.beginPath(); g.arc(x, y, 18, 0, Math.PI * 2); g.fill();
    // rasguinhos em volta do furo
    g.strokeStyle = 'rgba(60,30,10,.5)'; g.lineWidth = 2;
    [[-30, 6], [26, 14], [6, 30]].forEach(([dx, dy]) => { g.beginPath(); g.moveTo(x + dx * 0.6, y + dy * 0.6); g.lineTo(x + dx, y + dy); g.stroke(); });
    g.restore();
  }

  function clipe(g, x, y) {
    g.save();
    g.strokeStyle = '#8c949c'; g.lineWidth = 7; g.lineCap = 'round';
    g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 8; g.shadowOffsetY = 4;
    g.beginPath();
    g.moveTo(x, y + 170); g.lineTo(x, y + 20); g.arc(x + 22, y + 20, 22, Math.PI, 0); g.lineTo(x + 44, y + 150);
    g.arc(x + 28, y + 150, 16, 0, Math.PI); g.lineTo(x + 12, y + 50);
    g.stroke();
    g.restore();
  }

  let pedido = 0;
  function redesenhar() {
    if (pedido) return;
    pedido = requestAnimationFrame(() => { pedido = 0; desenhar(); });
  }

  function desenhar() {
    const tipoNome = campos.modelo.value in TIPOS ? campos.modelo.value : 'procurado';
    const tipo = TIPOS[tipoNome];
    const p = montarPapel();
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(p.papel, 0, 0);

    ctx.save();
    ctx.clip(p.borda);

    // foto: fica "impressa" no papel (multiply) e com as fibras por cima
    if (estado.fotoTom) {
      const b = caixaDaFoto();
      ctx.save();
      ctx.beginPath(); ctx.rect(FOTO.x, FOTO.y, FOTO.w, FOTO.h); ctx.clip();
      ctx.globalAlpha = 0.94;
      ctx.drawImage(estado.fotoTom, b.x, b.y, b.w, b.h);
      // o papel aparece um pouco através da tinta da foto
      ctx.globalCompositeOperation = 'multiply';
      ctx.globalAlpha = 0.28;
      ctx.drawImage(p.papel, FOTO.x, FOTO.y, FOTO.w, FOTO.h, FOTO.x, FOTO.y, FOTO.w, FOTO.h);
      ctx.restore();
    }

    // fibras do papel por cima de tudo que está impresso
    ctx.globalAlpha = 1;
    ctx.drawImage(p.fibras, 0, 0, W, H);

    // tinta com falhas
    const tinta = desenharTinta(tipoNome, tipo.tinta);
    const tg = tinta.getContext('2d');
    tg.globalCompositeOperation = 'destination-out';
    tg.drawImage(p.falhas, 0, 0, W, H);
    ctx.globalAlpha = 0.93;
    ctx.drawImage(tinta, 0, 0);
    ctx.globalAlpha = 1;

    // carimbos
    const r = sorteio(estado.semente + 3);
    if (tipoNome === 'governo') carimboRetangular(ctx, W / 2, FOTO.y + FOTO.h * 0.7, tipo.carimbo, TEXTO.carimbo.governo, -0.22 + r() * 0.1);
    else carimbo(ctx, FOTO.x + FOTO.w - 80, FOTO.y + FOTO.h - 40, 100, tipo.carimbo, TEXTO.carimbo[tipoNome], -0.3 + r() * 0.5);
    ctx.restore();

    // prego ou clipe
    if (tipoNome === 'procurado') prego(ctx, W / 2, 62);
    else clipe(ctx, 150, 30);

    tela.setAttribute('aria-label', `${TEXTO[tipoNome][0]}: ${campos.nome.value.trim() || OP.t('semNome')}`);
  }

  /* ---------- Campos ---------- */

  const numeroDigitado = () => {
    const so = campos.valor.value.replace(/\D/g, '').slice(0, 13);
    return so ? Number(so) : null;
  };

  campos.valor.addEventListener('input', () => {
    const n = numeroDigitado();
    campos.valor.value = n == null ? '' : n.toLocaleString(OP.local);
    redesenhar();
  });
  campos.nome.addEventListener('input', redesenhar);
  campos.modelo.addEventListener('change', () => {
    $('campo-valor').hidden = campos.modelo.value !== 'procurado';
    redesenhar();
  });

  const aviso = (id, msg) => { const el = $(id); el.textContent = msg || ''; el.hidden = !msg; };

  campos.arquivo.addEventListener('change', async () => {
    const f = campos.arquivo.files[0];
    if (!f) return;
    aviso('aviso-foto', '');
    try {
      estado.foto = await lerFoto(f);
    } catch (e) {
      aviso('aviso-foto', OP.t(/heic|heif/i.test(f.type + f.name) ? 'cartaz.heic' : 'cartaz.fotoRuim'));
      return;
    }
    estado.zoom = 1; estado.px = 0; estado.py = 0;
    sincronizarFaixas();
    aplicarTom();
    $('ajustes').hidden = false;
    tela.classList.add('oficina__tela--foto');
    redesenhar();
  });

  function sincronizarFaixas() {
    campos.zoom.value = estado.zoom;
    campos.x.value = estado.px;
    campos.y.value = estado.py;
  }
  campos.zoom.addEventListener('input', () => { estado.zoom = Number(campos.zoom.value); redesenhar(); });
  campos.x.addEventListener('input', () => { estado.px = Number(campos.x.value); redesenhar(); });
  campos.y.addEventListener('input', () => { estado.py = Number(campos.y.value); redesenhar(); });
  $('centralizar').addEventListener('click', () => { estado.zoom = 1; estado.px = 0; estado.py = 0; sincronizarFaixas(); redesenhar(); });

  document.querySelectorAll('input[name="tom"]').forEach((r) => r.addEventListener('change', () => { estado.tom = r.value; aplicarTom(); redesenhar(); }));
  document.querySelectorAll('input[name="papel"]').forEach((r) => r.addEventListener('change', () => { estado.papel = Number(r.value); redesenhar(); }));
  document.querySelectorAll('input[name="fonte"]').forEach((r) => r.addEventListener('change', async () => {
    estado.fonte = r.value;
    await carregarFonte(r.value);
    redesenhar();
  }));
  $('desgaste').addEventListener('click', () => { estado.semente = Math.floor(Math.random() * 1e6); redesenhar(); });

  async function carregarFonte(nome) {
    const f = FONTES[nome];
    if (!document.fonts || !f) return;
    try { await document.fonts.load(`${f.peso || 400} 100px '${nome}'`); } catch (e) { /* sem a fonte, fica a reserva */ }
  }

  /* ---------- Arrastar e zoom direto no cartaz ---------- */

  const toques = new Map();
  let inicio = null;

  // posição do ponteiro em unidades do canvas
  const noCanvas = (e) => {
    const r = tela.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
  };

  function mover(dx, dy) {
    const b = caixaDaFoto();
    if (b.folgaX > 0) estado.px = Math.max(-1, Math.min(1, estado.px - dx / b.folgaX));
    if (b.folgaY > 0) estado.py = Math.max(-1, Math.min(1, estado.py - dy / b.folgaY));
  }

  function mudarZoom(novo) {
    estado.zoom = Math.max(1, Math.min(4, novo));
  }

  tela.addEventListener('pointerdown', (e) => {
    if (!estado.fotoTom) return;
    tela.setPointerCapture(e.pointerId);
    toques.set(e.pointerId, noCanvas(e));
    inicio = { zoom: estado.zoom, dist: distancia() };
    tela.classList.add('oficina__tela--arrastando');
  });
  tela.addEventListener('pointermove', (e) => {
    if (!toques.has(e.pointerId)) return;
    const antes = toques.get(e.pointerId);
    const agora = noCanvas(e);
    toques.set(e.pointerId, agora);
    if (toques.size === 1) mover(agora.x - antes.x, agora.y - antes.y);
    else if (toques.size === 2 && inicio.dist) mudarZoom(inicio.zoom * (distancia() / inicio.dist));
    sincronizarFaixas();
    redesenhar();
  });
  const soltar = (e) => {
    toques.delete(e.pointerId);
    inicio = { zoom: estado.zoom, dist: distancia() };
    if (!toques.size) tela.classList.remove('oficina__tela--arrastando');
  };
  tela.addEventListener('pointerup', soltar);
  tela.addEventListener('pointercancel', soltar);
  function distancia() {
    const [a, b] = [...toques.values()];
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
  }
  tela.addEventListener('wheel', (e) => {
    if (!estado.fotoTom) return;
    e.preventDefault();
    mudarZoom(estado.zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08));
    sincronizarFaixas();
    redesenhar();
  }, { passive: false });

  /* ---------- Baixar ---------- */

  const nomeArquivo = () => `${OP.idioma === 'en' ? 'wanted' : 'cartaz'}-${(campos.nome.value || 'procurado').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'pirata'}.png`;

  const gerarArquivo = () => new Promise((ok, falha) => {
    desenhar();
    tela.toBlob((blob) => (blob ? ok(blob) : falha(new Error('toBlob'))), 'image/png');
  });

  // iPhone e navegadores dentro de apps (Instagram, WhatsApp) ignoram o download
  const ehIOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const dentroDeApp = /Instagram|FBAN|FBAV|WhatsApp|Line\/|TikTok|Twitter/i.test(navigator.userAgent);

  function mostrarParaSalvar(blob) {
    const img = $('salvar-img');
    if (img.dataset.url) URL.revokeObjectURL(img.dataset.url);
    img.dataset.url = URL.createObjectURL(blob);
    img.src = img.dataset.url;
    $('salvar').showModal();
  }
  $('salvar-fechar').addEventListener('click', () => $('salvar').close());

  async function compartilhar(blob) {
    const arquivo = new File([blob], nomeArquivo(), { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [arquivo] })) {
      await navigator.share({ files: [arquivo], title: TEXTO.procurado[0] });
      return true;
    }
    return false;
  }

  $('baixar').addEventListener('click', async () => {
    aviso('aviso-baixar', '');
    const botao = $('baixar');
    botao.disabled = true;
    try {
      const blob = await gerarArquivo();
      if (ehIOS || dentroDeApp) {
        // no iPhone o menu de compartilhar tem "Salvar imagem"; se não der, mostra a imagem
        try { if (await compartilhar(blob)) return; } catch (e) { if (e.name === 'AbortError') return; }
        mostrarParaSalvar(blob);
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = nomeArquivo();
      link.hidden = true;
      document.body.appendChild(link); // o Firefox só baixa se o link estiver na página
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      aviso('aviso-baixar', OP.t('cartaz.baixado', { arquivo: nomeArquivo() }));
    } catch (e) {
      console.error(e);
      aviso('aviso-baixar', OP.t('erroImagem').trim());
    } finally {
      botao.disabled = false;
    }
  });

  if (navigator.canShare && navigator.canShare({ files: [new File([''], 'x.png', { type: 'image/png' })] })) {
    const b = $('compartilhar');
    b.hidden = false;
    b.addEventListener('click', async () => {
      try { await compartilhar(await gerarArquivo()); } catch (e) { if (e.name !== 'AbortError') aviso('aviso-baixar', OP.t('erroImagem').trim()); }
    });
  }

  /* ---------- Começo ---------- */

  $('campo-valor').hidden = campos.modelo.value !== 'procurado';
  desenhar();
  // as fontes do Google chegam depois: redesenha quando estiverem prontas
  Promise.all([carregarFonte('Rye'), document.fonts ? document.fonts.load(`40px 'IM Fell DW Pica'`) : null])
    .catch(() => {}).then(desenhar);
  // pré-carrega as outras fontes para a troca ser instantânea
  setTimeout(() => Object.keys(FONTES).forEach(carregarFonte), 800);
})(window.OP);
