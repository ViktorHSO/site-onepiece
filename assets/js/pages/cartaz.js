/*
 * Oficina de cartazes.
 *
 * O cartaz é desenhado inteiro num <canvas> (o desenho fica em cartaz-arte.js):
 * a prévia na tela e a imagem baixada são o mesmo desenho, então a foto sai
 * exatamente onde foi posta.
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
  const A = OP.arteCartaz;
  const W = A.W, H = A.H;

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
      return A.reduzir(img);
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  function aplicarTom() { estado.fotoTom = A.tom(estado.foto, estado.tom); }

  const dados = () => ({
    tipo: campos.modelo.value, nome: campos.nome.value, recompensa: numeroDigitado(), foto: estado.fotoTom,
    zoom: estado.zoom, px: estado.px, py: estado.py, fonte: estado.fonte, papel: estado.papel, semente: estado.semente,
  });
  const caixaDaFoto = () => A.caixa(dados());

  let pedido = 0;
  function redesenhar() {
    if (pedido) return;
    pedido = requestAnimationFrame(() => { pedido = 0; desenhar(); });
  }

  function desenhar() {
    A.desenhar(ctx, dados());
    const titulo = { procurado: OP.t('procurado'), marinha: OP.t('marinhaTitulo'), governo: OP.t('dossie') }[campos.modelo.value];
    tela.setAttribute('aria-label', `${titulo}: ${campos.nome.value.trim() || OP.t('semNome')}`);
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

  const carregarFonte = A.carregarFonte;

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
      await navigator.share({ files: [arquivo], title: OP.t('procurado') });
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
  A.fontesProntas().catch(() => {}).then(desenhar);
  // pré-carrega as outras fontes para a troca ser instantânea
  setTimeout(() => Object.keys(A.FONTES).forEach(carregarFonte), 800);
})(window.OP);
