/*
 * Desenho dos cartazes (papel envelhecido, tinta, carimbo e prego) num canvas.
 * Usado pela oficina (pages/cartaz.html) e pelos cartazes da página inicial.
 *
 * OP.arteCartaz.desenhar(ctx, dados) desenha no tamanho do canvas, em qualquer
 * resolução: as medidas internas são de um cartaz de 1200 x 1700.
 *
 * dados = { tipo: 'procurado' | 'marinha' | 'governo', nome, recompensa (número ou null),
 *           foto (canvas já com o tom, ou null), zoom, px, py, fonte, papel (1 a 3), semente }
 *
 * Camadas, de baixo para cima:
 *   papel (cor + fibras + manchas + bordas queimadas + dobras)
 *   foto (com tom sépia / preto e branco e um pouco do papel por cima)
 *   tinta (todo o texto, molduras e enfeites, com falhas de impressão)
 *   carimbo e prego
 * A borda do papel é rasgada e fica transparente no PNG.
 */
window.OP = window.OP || {};

(function (OP) {
  const W = 1200, H = 1700;
  const PADRAO = { soPapel: false, tipo: 'procurado', nome: '', recompensa: null, foto: null, zoom: 1, px: 0, py: 0, fonte: 'Rye', papel: 2, semente: 7 };
  let atual = PADRAO;

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
    for (let i = 0; i < 2 + desgaste * 2; i++) mordidas.push({ lado: Math.floor(rnd() * 4), pos: 0.1 + rnd() * 0.8, tam: 16 + rnd() * Math.min(36, 14 * desgaste), larg: 0.03 + rnd() * 0.05 }); // rasgos param antes da moldura, nunca chegam no texto
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

  function montarPapel(k = 1) {
    const tipo = TIPOS[atual.tipo] || TIPOS.procurado;
    const chave = `${atual.tipo}|${atual.semente}|${atual.papel}|${k}`;
    if (cachePapel.chave === chave) return cachePapel;
    const rnd = sorteio(atual.semente * 97 + atual.papel);
    const d = atual.papel; // 1 a 3
    const borda = bordaRasgada(rnd, d);
    // tudo é gerado no tamanho em que o cartaz vai aparecer (k = escala)
    const c = novaTela(Math.ceil(W * k), Math.ceil(H * k));
    const g = c.getContext('2d');
    g.scale(k, k);
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
    g.shadowBlur = (40 + d * 25) * k;
    g.lineWidth = 30;
    g.strokeStyle = `rgba(90,50,15,${0.25 + d * 0.15})`;
    g.stroke(borda);
    g.shadowBlur = 0;
    g.lineWidth = 3;
    g.strokeStyle = `rgba(60,30,8,${0.35 + d * 0.1})`;
    g.stroke(borda);
    g.restore();

    // fibras do papel (camada à parte, aplicada por cima da foto também)
    const fibras = novaTela(Math.ceil((W / 2) * Math.min(1, k * 1.4)), Math.ceil((H / 2) * Math.min(1, k * 1.4)));
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
    for (let i = 0; i < 900 * Math.min(1, k * 1.4); i++) {
      const x = rnd() * fibras.width, y = rnd() * fibras.height, a = rnd() * Math.PI, l = 3 + rnd() * 10;
      fg.beginPath(); fg.moveTo(x, y); fg.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); fg.stroke();
    }

    // falhas da tinta: pontinhos que "comem" a impressão
    const falhas = novaTela(Math.ceil((W / 2) * Math.min(1, k * 1.4)), Math.ceil((H / 2) * Math.min(1, k * 1.4)));
    const kg = falhas.getContext('2d');
    kg.fillStyle = '#000';
    for (let i = 0; i < 2500 * d * Math.min(1, k * 1.4) ** 2; i++) {
      const r = rnd() < 0.92 ? rnd() * 1.1 : 1 + rnd() * 2.4;
      kg.globalAlpha = 0.3 + rnd() * 0.7;
      kg.beginPath(); kg.arc(rnd() * falhas.width, rnd() * falhas.height, r, 0, Math.PI * 2); kg.fill();
    }

    cachePapel = { chave, borda, papel: c, fibras, falhas };
    return cachePapel;
  }

  /* ---------- Foto ---------- */

  // sépia e preto e branco feitos à mão (o ctx.filter não existe em todo navegador)
  function aplicarTom(src, tom) {
    if (!src) return null;
    const c = novaTela(src.width, src.height);
    const g = c.getContext('2d');
    g.drawImage(src, 0, 0);
    if (tom !== 'cor') {
      const dados = g.getImageData(0, 0, c.width, c.height);
      const p = dados.data;
      for (let i = 0; i < p.length; i += 4) {
        let l = 0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2];
        l = Math.max(0, Math.min(255, (l - 128) * 1.15 + 128)); // um pouco mais de contraste
        if (tom === 'pb') { p[i] = p[i + 1] = p[i + 2] = l; }
        else { p[i] = Math.min(255, l * 1.02 + 34); p[i + 1] = Math.min(255, l * 0.9 + 24); p[i + 2] = l * 0.7 + 12; }
      }
      g.putImageData(dados, 0, 0);
    }
    return c;
  }

  // Onde a foto fica dentro da moldura: zoom 1 cobre a moldura toda,
  // px/py (-1 a 1) andam até a beira da foto
  function caixaDaFoto(atual) {
    const f = atual.foto;
    const cobre = Math.max(FOTO.w / f.width, FOTO.h / f.height) * atual.zoom;
    const w = f.width * cobre, h = f.height * cobre;
    const folgaX = (w - FOTO.w) / 2, folgaY = (h - FOTO.h) / 2;
    return {
      x: FOTO.x - folgaX - atual.px * folgaX,
      y: FOTO.y - folgaY - atual.py * folgaY,
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
  function desenharTinta(tipoNome, cor, k = 1) {
    const c = novaTela(Math.ceil(W * k), Math.ceil(H * k));
    const g = c.getContext('2d');
    g.scale(k, k);
    const fonte = FONTES[atual.fonte] || FONTES.Rye;
    const [titulo, meio] = TEXTO[tipoNome];
    // soPapel: só o que não depende de idioma nem de personagem (vira imagem estática do site)
    const so = !!atual.soPapel;
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
    if (!so) texto(g, titulo, W / 2, 312, W - 2 * M - 120, 210 * fonte.escala, fonte.css, { peso: fonte.peso || 400, espaco: 0.04 });

    // moldura da foto
    g.lineWidth = 12; g.strokeRect(FOTO.x - 6, FOTO.y - 6, FOTO.w + 12, FOTO.h + 12);
    g.lineWidth = 3; g.strokeRect(FOTO.x - 22, FOTO.y - 22, FOTO.w + 44, FOTO.h + 44);
    if (!atual.foto && !so) {
      g.globalAlpha = 0.18;
      texto(g, OP.iniciais(atual.nome || '?') || '?', W / 2, FOTO.y + FOTO.h / 2 + 110, FOTO.w - 80, 320, fonte.css);
      g.globalAlpha = 1;
    }

    // "vivo ou morto" entre fios e estrelas
    const ym = FOTO.y + FOTO.h + 108;
    const tm = so ? 70 : texto(g, meio, W / 2, ym, 640, 76 * fonte.escala, fonte.css, { peso: fonte.peso || 400, espaco: 0.06 });
    const meia = so ? 310 : Math.min(320, g.measureText(meio).width / 2) + 40;
    g.lineWidth = 3;
    [[M + 60, W / 2 - meia], [W / 2 + meia, W - M - 60]].forEach(([a, b]) => {
      g.beginPath(); g.moveTo(a, ym - tm * 0.32); g.lineTo(b, ym - tm * 0.32); g.stroke();
      g.beginPath(); g.moveTo(a + 20, ym - tm * 0.32 + 10); g.lineTo(b - 20, ym - tm * 0.32 + 10); g.stroke();
    });
    estrela(g, M + 46, ym - tm * 0.28, 12); estrela(g, W - M - 46, ym - tm * 0.28, 12);

    if (so) { // letras miúdas viram rabiscos ilegíveis, que servem para qualquer idioma
      const r = sorteio(atual.semente + 9);
      const yl = ym + 282 + 46;
      g.globalAlpha = 0.55; g.lineWidth = 3; g.lineCap = 'round';
      for (let i = 0; i < 3; i++) {
        const larg = (i === 2 ? 520 : 760) - r() * 60;
        let x = W / 2 - larg / 2;
        while (x < W / 2 + larg / 2) {
          const pal = 12 + r() * 40;
          g.beginPath(); g.moveTo(x, yl + i * 30 + 6); g.lineTo(Math.min(x + pal, W / 2 + larg / 2), yl + i * 30 + 6); g.stroke();
          x += pal + 9;
        }
      }
      g.globalAlpha = 1;
      g.font = `26px ${NUMEROS}`; g.textAlign = 'left';
      g.fillText(`Nº ${String(1000 + (atual.semente * 7919) % 9000)}`, M + 92, H - M - 40);
      return c;
    }

    // nome
    const nome = (atual.nome.trim() || OP.t('semNome')).toUpperCase();
    texto(g, nome, W / 2, ym + 150, W - 2 * M - 120, 136 * fonte.escala, fonte.css, { peso: fonte.peso || 400, espaco: 0.03 });

    // recompensa (ou cargo)
    const yv = ym + 282;
    if (tipoNome === 'procurado') {
      const n = atual.recompensa;
      const t = n == null ? TEXTO.semRecompensa : `${n.toLocaleString(OP.local)}-`;
      const familia = atual.fonte === 'IM Fell English SC' || atual.fonte === 'Uncial Antiqua' ? FONTES.Rye.css : fonte.css;
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
      const r = sorteio(atual.semente);
      for (let i = 0; i < 3; i++) g.fillRect(W / 2 - 330 + r() * 420, yv + 37 + i * 30, 90 + r() * 120, 26);
    }

    // rodapé
    texto(g, TEXTO[tipoNome][2], W - M - 70, H - M - 36, 520, 46 * fonte.escala, fonte.css, { peso: fonte.peso || 400, alinhar: 'right', espaco: 0.08 });
    g.font = `26px ${NUMEROS}`; g.textAlign = 'left';
    g.fillText(`Nº ${String(1000 + (atual.semente * 7919) % 9000)}`, M + 92, H - M - 40);
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
    if (!palavra) { // sem palavra: estrelinhas em volta (serve para qualquer idioma)
      for (let i = 0; i < 7; i++) {
        const a = -Math.PI * 0.55 + (i * Math.PI * 1.1) / 6 - Math.PI / 2 + Math.PI / 2;
        estrela(g, Math.sin(a) * (r - 30), -Math.cos(a) * (r - 30), 7);
      }
      g.restore();
      return;
    }
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

  function desenhar(ctx, dados) {
    atual = { ...PADRAO, ...dados };
    const tipoNome = atual.tipo in TIPOS ? atual.tipo : 'procurado';
    atual.tipo = tipoNome;
    const tipo = TIPOS[tipoNome];
    const k = Math.min(1, ctx.canvas.width / W);
    const p = montarPapel(k);
    ctx.save();
    ctx.setTransform(ctx.canvas.width / W, 0, 0, ctx.canvas.height / H, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(p.papel, 0, 0, W, H);

    ctx.save();
    ctx.clip(p.borda);

    // foto: fica "impressa" no papel (multiply) e com as fibras por cima
    if (atual.foto) {
      const b = caixaDaFoto(atual);
      ctx.save();
      ctx.beginPath(); ctx.rect(FOTO.x, FOTO.y, FOTO.w, FOTO.h); ctx.clip();
      ctx.globalAlpha = 0.94;
      ctx.drawImage(atual.foto, b.x, b.y, b.w, b.h);
      // o papel aparece um pouco através da tinta da foto
      ctx.globalCompositeOperation = 'multiply';
      ctx.globalAlpha = 0.28;
      ctx.drawImage(p.papel, FOTO.x * k, FOTO.y * k, FOTO.w * k, FOTO.h * k, FOTO.x, FOTO.y, FOTO.w, FOTO.h);
      ctx.restore();
    }

    // fibras do papel por cima de tudo que está impresso
    ctx.globalAlpha = 1;
    ctx.drawImage(p.fibras, 0, 0, W, H);

    // tinta com falhas
    const tinta = desenharTinta(tipoNome, tipo.tinta, k);
    const tg = tinta.getContext('2d');
    tg.globalCompositeOperation = 'destination-out';
    tg.setTransform(1, 0, 0, 1, 0, 0);
    tg.drawImage(p.falhas, 0, 0, tinta.width, tinta.height);
    ctx.globalAlpha = 0.93;
    ctx.drawImage(tinta, 0, 0, W, H);
    ctx.globalAlpha = 1;

    // carimbos
    const r = sorteio(atual.semente + 3);
    if (tipoNome === 'governo' && !atual.soPapel) carimboRetangular(ctx, W / 2, FOTO.y + FOTO.h * 0.7, tipo.carimbo, TEXTO.carimbo.governo, -0.22 + r() * 0.1);
    else if (tipoNome !== 'governo') carimbo(ctx, FOTO.x + FOTO.w - 80, FOTO.y + FOTO.h - 40, 100, tipo.carimbo, atual.soPapel ? '' : TEXTO.carimbo[tipoNome], -0.3 + r() * 0.5);
    ctx.restore();

    // prego ou clipe
    if (tipoNome === 'procurado') prego(ctx, W / 2, 62);
    else clipe(ctx, 150, 30);
    ctx.restore();
  }

  async function carregarFonte(nome) {
    const f = FONTES[nome];
    if (!document.fonts || !f) return;
    try { await document.fonts.load(`${f.peso || 400} 100px '${nome}'`); } catch (e) { /* sem a fonte, fica a reserva */ }
  }

  // espera as fontes que o desenho usa (a escolhida e a das letras miúdas)
  const fontesProntas = (nome = 'Rye') => Promise.all([
    carregarFonte(nome),
    document.fonts ? document.fonts.load("40px 'IM Fell DW Pica'").catch(() => {}) : null,
  ]);

  // Uma foto (imagem ou canvas) reduzida para no máximo `lado` px, pronta para receber o tom
  function reduzir(img, lado = 1600) {
    const w0 = img.naturalWidth || img.width, h0 = img.naturalHeight || img.height;
    const k = Math.min(1, lado / Math.max(w0, h0));
    const c = novaTela(Math.round(w0 * k), Math.round(h0 * k));
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return c;
  }

  OP.arteCartaz = { W, H, FOTO, FONTES, TIPOS, desenhar, tom: aplicarTom, caixa: caixaDaFoto, carregarFonte, fontesProntas, reduzir, novaTela };
})(window.OP);
