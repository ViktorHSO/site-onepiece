/* Oficina de cartazes: prévia ao vivo e download em PNG desenhado num canvas */
(function (OP) {
  const nome = document.getElementById('c-nome');
  const valor = document.getElementById('c-valor');
  const arquivo = document.getElementById('c-foto');
  const modelo = document.getElementById('c-modelo');
  const previa = document.getElementById('previa');
  const botao = document.getElementById('baixar');

  let foto = null; // data URL da imagem escolhida

  const numeroDigitado = () => {
    const so = valor.value.replace(/\D/g, '').slice(0, 13);
    return so ? Number(so) : null;
  };

  function atualizar() {
    const dados = {
      id: 1,
      nome: nome.value.trim() || OP.t('semNome'),
      recompensa: numeroDigitado(),
      foto,
      cargo: modelo.value === 'marinha' ? OP.t('oficial') : modelo.value === 'governo' ? OP.t('agente') : null,
    };
    previa.innerHTML = '';
    const c = OP.cartaz(dados, { tag: 'div', variante: modelo.value });
    c.style.setProperty('--giro', '0deg');
    previa.appendChild(c);
  }

  // Formata enquanto digita: 1500000 -> 1.500.000
  valor.addEventListener('input', () => {
    const n = numeroDigitado();
    valor.value = n == null ? '' : n.toLocaleString(OP.local);
    atualizar();
  });
  nome.addEventListener('input', atualizar);
  modelo.addEventListener('change', atualizar);

  arquivo.addEventListener('change', () => {
    const f = arquivo.files[0];
    if (!f) return;
    const leitor = new FileReader();
    leitor.onload = () => { foto = leitor.result; atualizar(); };
    leitor.readAsDataURL(f);
  });

  /* ---------- Download: desenha o cartaz num canvas ---------- */

  const CORES = {
    procurado: { papel: '#e6cf98', tinta: '#2b1d10' },
    marinha: { papel: '#e8eef2', tinta: '#183a56' },
    governo: { papel: '#d8c7a4', tinta: '#2b1d10' },
  };
  const TEXTOS = {
    procurado: [OP.t('procurado'), OP.t('vivoOuMorto'), OP.t('marinha')],
    marinha: [OP.t('marinhaTitulo'), OP.t('fichaOficial'), OP.t('qg')],
    governo: [OP.t('dossie'), OP.t('governoMundial'), OP.t('maryGeoise')],
  };

  function carregarImagem(src) {
    return new Promise((ok, falha) => {
      const img = new Image();
      img.onload = () => ok(img);
      img.onerror = falha;
      img.src = src;
    });
  }

  // Escreve o texto diminuindo a fonte até caber na largura
  function textoQueCabe(ctx, texto, x, y, largura, tamanho, familia) {
    let t = tamanho;
    do { ctx.font = `${t}px ${familia}`; t -= 2; } while (ctx.measureText(texto).width > largura && t > 10);
    ctx.fillText(texto, x, y);
  }

  async function baixar() {
    const tipo = modelo.value;
    const { papel, tinta } = CORES[tipo];
    const [titulo, meio, rodape] = TEXTOS[tipo].map((t) => t.toUpperCase());
    const W = 900, H = 1280, M = 60;
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');
    await document.fonts.ready;
    const RYE = "'Rye', Georgia, serif";

    // papel com manchas leves
    ctx.fillStyle = papel; ctx.fillRect(0, 0, W, H);
    const g = ctx.createRadialGradient(W * 0.3, H * 0.2, 50, W * 0.3, H * 0.2, W);
    g.addColorStop(0, 'rgba(255,255,255,.25)'); g.addColorStop(1, 'rgba(120,80,20,.22)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = tinta; ctx.textAlign = 'center';
    textoQueCabe(ctx, titulo, W / 2, 190, W - 2 * M, 170, RYE);

    // moldura da foto (4:3)
    const fx = M, fy = 240, fw = W - 2 * M, fh = fw * 0.75;
    ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(fx, fy, fw, fh);
    if (foto) {
      const img = await carregarImagem(foto);
      const escala = Math.max(fw / img.width, fh / img.height);
      const sw = fw / escala, sh = fh / escala;
      ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, fx, fy, fw, fh);
    } else {
      ctx.fillStyle = 'rgba(43,29,16,.3)';
      textoQueCabe(ctx, OP.iniciais(nome.value || '?') || '?', W / 2, fy + fh / 2 + 70, fw, 200, RYE);
    }
    ctx.lineWidth = 8; ctx.strokeStyle = tinta; ctx.strokeRect(fx, fy, fw, fh);

    ctx.fillStyle = tinta;
    textoQueCabe(ctx, meio, W / 2, fy + fh + 90, W - 2 * M, 60, RYE);
    textoQueCabe(ctx, (nome.value.trim() || OP.t('semNome')).toUpperCase(), W / 2, fy + fh + 200, W - 2 * M, 96, RYE);

    if (tipo === 'procurado') {
      const n = numeroDigitado();
      const texto = n == null ? OP.t('semRecompensa') : `฿ ${n.toLocaleString(OP.local)} –`;
      textoQueCabe(ctx, texto, W / 2, fy + fh + 300, W - 2 * M, 84, 'Georgia, serif');
    }

    if (tipo === 'governo') {
      // carimbo vermelho por cima da foto
      ctx.save();
      ctx.translate(W / 2, fy + fh * 0.55);
      ctx.rotate(-0.3);
      ctx.strokeStyle = ctx.fillStyle = 'rgba(179,32,42,.8)';
      ctx.lineWidth = 8;
      ctx.font = `110px ${RYE}`;
      const carimbo = OP.t('sigiloso').toUpperCase();
      const tw = ctx.measureText(carimbo).width;
      ctx.strokeRect(-tw / 2 - 30, -100, tw + 60, 140);
      ctx.fillText(carimbo, 0, 10);
      ctx.restore();
      ctx.fillStyle = tinta;
    }

    ctx.textAlign = 'right';
    textoQueCabe(ctx, rodape, W - M, H - 50, W / 2, 40, RYE);

    const link = document.createElement('a');
    link.download = `${OP.idioma === 'en' ? 'poster' : 'cartaz'}-${(nome.value || 'procurado').toLowerCase().replace(/[^a-z0-9]+/gi, '-')}.png`;
    link.href = cv.toDataURL('image/png');
    link.click();
  }

  botao.addEventListener('click', () => {
    baixar().catch((e) => {
      console.error(e);
      botao.insertAdjacentHTML('afterend', `<span class="oficina__erro">${OP.t('erroImagem')}</span>`);
    });
  });

  atualizar();
})(window.OP);
