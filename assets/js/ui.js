/*
 * Peças de interface usadas em todas as páginas:
 * menu, janela de detalhes, cartaz de procurado e mensagens de erro.
 */
window.OP = window.OP || {};

(function (OP) {
  // Caminho até a raiz do site ("." na home, ".." dentro de /pages)
  const RAIZ = document.body.dataset.raiz || '.';
  OP.caminho = (arquivo) => `${RAIZ}/${arquivo}`;

  // Endereço de uma foto: links completos (AniList, upload) ficam como estão
  OP.srcFoto = (foto) => (/^(https?:|data:)/.test(foto) ? foto : OP.caminho(foto));

  // Retrato de quem não tem foto: uma silhueta com interrogação, como nos cartazes antigos
  const SILHUETA = '<svg viewBox="0 0 220 160" aria-hidden="true"><path d="M110 22c-21 0-36 16-36 38 0 15 7 27 17 34-27 6-49 22-57 46h152c-8-24-30-40-57-46 10-7 17-19 17-34 0-22-15-38-36-38z"/><text x="110" y="76" text-anchor="middle">?</text></svg>';
  const semFotoCartaz = () => `<span class="cartaz__sem-foto" aria-hidden="true">${SILHUETA}</span>`;

  // Se a foto não carregar, o cartaz mostra a silhueta (e as outras listas, as iniciais)
  document.addEventListener('error', (e) => {
    const img = e.target;
    if (!(img instanceof HTMLImageElement) || !img.dataset.nome) return;
    if (img.closest('.cartaz__foto')) {
      img.insertAdjacentHTML('afterend', semFotoCartaz());
      img.remove();
      return;
    }
    const span = document.createElement('span');
    span.className = img.dataset.classe ?? 'cartaz__sem-foto';
    span.setAttribute('aria-hidden', 'true');
    span.textContent = OP.iniciais(img.dataset.nome);
    img.replaceWith(span);
  }, true);

  // Escapa texto vindo da API antes de colocar em HTML
  OP.esc = (texto) =>
    String(texto ?? '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    })[c]);

  OP.berries = (valor) =>
    valor == null ? OP.t('semRecompensaFicha') : '฿ ' + valor.toLocaleString(OP.local);

  OP.numero = (valor) => valor.toLocaleString(OP.local);

  // Inclinação "aleatória" mas fixa para cada cartaz, como papel pregado à mão
  OP.inclinacao = (id) => (((id * 37) % 7) - 3) * 0.6;

  /* ---------- Cartaz de procurado ---------- */

  // cartazes que já vêm escritos no HTML (o do Luffy na abertura)
  document.querySelectorAll('.cartaz').forEach((el) => OP.ajustarCartaz?.(el));

  // variante: "procurado" (padrão), "marinha" (ficha de oficial) ou "governo" (dossiê secreto)
  const VARIANTE = {
    procurado: { titulo: OP.t('procurado'), meio: OP.t('vivoOuMorto'), rodape: OP.t('marinha') },
    marinha: { titulo: OP.t('marinhaTitulo'), meio: OP.t('fichaOficial'), rodape: OP.t('qg') },
    governo: { titulo: OP.t('dossie'), meio: OP.t('governoMundial'), rodape: OP.t('maryGeoise') },
  };

  // Papel envelhecido já pronto (gerado com o cartaz-arte.js no modo "só papel"):
  // o texto e a foto vão por cima em HTML, então o cartaz aparece na hora
  const PAPEIS = { procurado: 4, marinha: 2, governo: 2 };

  // Largura de cada letra da fonte Rye (em milésimos do tamanho da fonte), para
  // calcular o tamanho que faz cada texto caber sem precisar esperar a fonte carregar
  const RYE_LETRAS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZÀÁÂÃÄÇÈÉÊËÍÎÏÑÒÓÔÕÖÚÛÜ .,-'&!?:()/";
  const RYE_LARG = [714,451,634,608,695,628,713,610,687,713,712,743,645,776,704,660,719,840,438,602,752,660,1022,810,769,695,769,758,613,737,756,692,1055,672,663,697,712,712,712,712,712,645,704,704,704,704,438,438,438,810,769,769,769,769,769,756,756,756,244,331,342,420,284,833,414,573,331,386,386,399];
  const larguraRye = (texto, espaco) => [...texto.toUpperCase()].reduce((soma, ch) => {
    const i = RYE_LETRAS.indexOf(ch);
    return soma + (i < 0 ? 0.72 : RYE_LARG[i] / 1000) + espaco;
  }, 0);

  // Tamanho (em % da largura do cartaz) para o texto caber em `cabe`, sem passar de `max`
  const TEXTOS_DO_CARTAZ = [
    ['.cartaz__titulo', 0.04, 76, 15],
    ['.cartaz__vivo', 0.07, 66, 5.6],
    ['.cartaz__nome', 0.03, 78, 10.5],
    ['.cartaz__valor', 0.02, 76, 9.2],
    ['.cartaz__marinha', 0.08, 40, 3.6],
  ];
  OP.ajustarCartaz = (el) => {
    TEXTOS_DO_CARTAZ.forEach(([sel, espaco, cabe, max]) => {
      const span = el.querySelector(sel);
      if (!span) return;
      // o ฿ da recompensa vem da Georgia e tem uma folguinha depois
      const extra = span.classList.contains('cartaz__valor') && !span.classList.contains('cartaz__valor--vazio') ? 0.82 : 0;
      const w = larguraRye(span.textContent.trim(), espaco) + extra;
      span.style.setProperty('--tam', Math.min(max, cabe / Math.max(w, 0.1)).toFixed(2) + 'cqi');
    });
  };

  // Enquadra a foto da AniList no quadro do cartaz com o rosto no centro.
  // O quadro tem 880 x 640 (proporção 1,375) no desenho de 1200 x 1700.
  // Fotos de corpo inteiro ganham zoom até o rosto ocupar cerca de metade da altura.
  const QUADRO = 880 / 640;
  OP.enquadrar = (img, id) => {
    const [fy, fh, fx = 0.5] = (OP.ROSTO_ANILIST && OP.ROSTO_ANILIST[id]) || [0.3, 0.38, 0.5];
    const aplicar = () => {
      const prop = img.naturalWidth ? img.naturalHeight / img.naturalWidth : 1.5;
      const cobre = Math.max(1, (1 / QUADRO) / prop); // largura mínima para cobrir o quadro
      const zoom = Math.min(2.6, Math.max(cobre, 0.55 / (QUADRO * fh * prop)));
      const larg = zoom;                 // em larguras do quadro
      const alt = zoom * prop;           // em larguras do quadro
      const altQuadro = 1 / QUADRO;
      const esq = Math.min(0, Math.max(1 - larg, 0.5 - fx * larg));
      const topo = Math.min(0, Math.max(altQuadro - alt, 0.44 * altQuadro - fy * alt));
      img.classList.add('cartaz__foto--enquadrada');
      img.style.setProperty('width', `${(larg * 100).toFixed(2)}%`);
      img.style.setProperty('left', `${(esq * 100).toFixed(2)}%`);
      img.style.setProperty('top', `${((topo / altQuadro) * 100).toFixed(2)}%`);
    };
    aplicar();
    if (!img.complete) img.addEventListener('load', aplicar, { once: true });
  };

  OP.cartaz = function (p, { tag = 'button', variante = 'procurado' } = {}) {
    const v = VARIANTE[variante] || VARIANTE.procurado;
    if (!VARIANTE[variante]) variante = 'procurado';
    const el = document.createElement(tag);
    el.className = `cartaz cartaz--${variante}`;
    if (variante === 'governo') el.dataset.carimbo = OP.t('sigiloso');
    el.style.setProperty('--giro', OP.inclinacao(p.id) + 'deg');
    if (tag === 'button') {
      el.type = 'button';
      el.setAttribute('aria-label', OP.t('verDetalhes', { nome: p.nome }));
    }
    const papel = OP.caminho(`assets/img/cartaz/${variante}-${(Math.abs(p.id || 0) % PAPEIS[variante]) + 1}.webp`);
    const foto = p.foto
      ? `<img src="${OP.esc(OP.srcFoto(p.foto))}" alt="" loading="lazy" decoding="async" width="260" height="190" data-nome="${OP.esc(p.nome)}" referrerpolicy="no-referrer">`
      : semFotoCartaz();
    let valor;
    if (variante !== 'procurado') {
      valor = p.cargo ? `<span class="cartaz__valor cartaz__valor--vazio">${OP.esc(p.cargo)}</span>` : '';
    } else if (p.recompensa != null) {
      valor = `<span class="cartaz__valor">${OP.esc(OP.numero(p.recompensa))}-</span>`;
    } else {
      valor = `<span class="cartaz__valor cartaz__valor--vazio">${OP.t('semRecompensa')}</span>`;
    }
    el.innerHTML = `
      <img class="cartaz__papel" src="${papel}" alt="" width="720" height="1020" decoding="async">
      <span class="cartaz__foto">${foto}</span>
      <span class="cartaz__tinta">
        <span class="cartaz__titulo" aria-hidden="true">${v.titulo}</span>
        <span class="cartaz__vivo" aria-hidden="true">${v.meio}</span>
        <span class="cartaz__nome">${OP.esc(p.nome)}</span>
        ${valor}
        <span class="cartaz__marinha" aria-hidden="true">${v.rodape}</span>
      </span>`;
    OP.ajustarCartaz(el);
    const img = el.querySelector('.cartaz__foto img');
    if (img && /anilist/.test(img.src)) OP.enquadrar(img, p.id);
    return el;
  };


  OP.iniciais = function (nome) {
    return String(nome).split(/\s+/).filter((p) => /^[A-Za-zÀ-ú]/.test(p)).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
  };

  /* ---------- Desenho de fruta quando a API não tem imagem ---------- */

  const COR_FRUTA = {
    Paramecia: '#8e5bb5', Logia: '#d9822b', Zoan: '#3f8f5a',
    SMILE: '#c4473a', Clone: '#5a6f85',
  };

  OP.desenhoFruta = function (fruta) {
    const cor = COR_FRUTA[fruta.familia] || '#7a6a4f';
    return `
      <svg class="fruta-desenho" viewBox="0 0 100 100" role="img" aria-label="${OP.esc(OP.t('semImagemDe', { nome: fruta.nome }))}">
        <path d="M50 20 C46 10 40 8 34 9" stroke="#3e5b2b" stroke-width="4" fill="none" stroke-linecap="round"/>
        <circle cx="50" cy="58" r="34" fill="${cor}"/>
        <g fill="none" stroke="rgba(255,255,255,.55)" stroke-width="3" stroke-linecap="round">
          <path d="M34 50 a6 6 0 1 1 6 6 a10 10 0 1 1 -10 -10"/>
          <path d="M60 44 a5 5 0 1 1 5 5 a8 8 0 1 1 -8 -8"/>
          <path d="M52 74 a5 5 0 1 1 5 5 a8 8 0 1 1 -8 -8"/>
        </g>
      </svg>`;
  };

  /* ---------- Janela de detalhes (usa <dialog>, nativo do navegador) ---------- */

  let janela;
  OP.abrirJanela = function (html, titulo) {
    if (!janela) {
      janela = document.createElement('dialog');
      janela.className = 'janela';
      janela.innerHTML = `
        <button type="button" class="janela__fechar" aria-label="${OP.t('fechar')}">×</button>
        <div class="janela__conteudo"></div>`;
      document.body.appendChild(janela);
      janela.querySelector('.janela__fechar').addEventListener('click', () => janela.close());
      // Clicar fora do conteúdo fecha
      janela.addEventListener('click', (e) => { if (e.target === janela) janela.close(); });
      janela.addEventListener('close', () => document.body.classList.remove('sem-rolagem'));
    }
    const conteudo = janela.querySelector('.janela__conteudo');
    conteudo.innerHTML = html;
    // cartazes entram como elementos (não como texto), para manter o enquadramento da foto
    conteudo.querySelectorAll('[data-cartaz]').forEach((vaga) => {
      const p = cartazesPendentes.get(vaga.dataset.cartaz);
      cartazesPendentes.delete(vaga.dataset.cartaz);
      if (p) vaga.appendChild(OP.cartaz(p, { tag: 'div' }));
    });
    janela.setAttribute('aria-label', titulo || OP.t('detalhes'));
    document.body.classList.add('sem-rolagem');
    janela.showModal();
  };

  const cartazesPendentes = new Map();
  let proximaVaga = 0;

  OP.fichaPersonagem = function (p) {
    const vaga = `c${++proximaVaga}`;
    cartazesPendentes.set(vaga, p);
    const linhas = [
      [OP.t('tripulacao'), p.tripulacao ? p.tripulacao.nome : OP.t('nenhuma')],
      [OP.t('funcao'), p.cargo || '—'],
      [OP.t('fruta'), p.fruta ? `${p.fruta.nome} (${p.fruta.tipo})` : OP.t('naoComeu')],
      [OP.t('recompensa'), OP.berries(p.recompensa)],
      [OP.t('idade'), p.idade || '—'],
      [OP.t('altura'), p.altura || '—'],
      [OP.t('situacao'), p.status],
    ];
    return `
      <div class="ficha">
        <div class="ficha__cartaz" data-cartaz="${vaga}"></div>
        <div>
          <h2 class="ficha__nome">${OP.esc(p.nome)}</h2>
          ${p.apelido ? `<p class="ficha__apelido">${OP.esc(OP.t('conhecidoComo', { apelido: p.apelido }))}</p>` : ''}
          <dl class="ficha__dados">
            ${linhas.map(([k, v]) => `<dt>${k}</dt><dd>${OP.esc(v)}</dd>`).join('')}
          </dl>
        </div>
      </div>`;
  };

  /* ---------- Fruta: item da lista e ficha ---------- */

  function imagemFruta(f) {
    return f.imagem
      ? `<img src="${OP.esc(f.imagem)}" alt="" loading="lazy">`
      : OP.desenhoFruta(f);
  }

  OP.itemFruta = function (f) {
    const li = document.createElement('li');
    li.innerHTML = `
      <button type="button" class="fruta">
        <span class="fruta__imagem">${imagemFruta(f)}</span>
        <span>
          <span class="fruta__nome">${OP.esc(f.nome)}</span>
          ${f.nomeIngles && f.nomeIngles !== f.nome ? `<span class="fruta__sub">${OP.esc(f.nomeIngles)}</span>` : ''}
          <span class="selo selo--${OP.esc(f.familia)}">${OP.esc(f.tipo)}</span>
        </span>
      </button>`;
    li.querySelector('button').addEventListener('click', () => OP.abrirFruta(f));
    return li;
  };

  OP.abrirFruta = async function (f) {
    OP.abrirJanela(`
      <div class="fruta-detalhe">
        <div class="fruta-detalhe__imagem">${imagemFruta(f)}</div>
        <div>
          <h2>${OP.esc(f.nome)}</h2>
          <p><span class="selo selo--${OP.esc(f.familia)}">${OP.esc(f.tipo)}</span></p>
          <p>${OP.esc(f.descricao || OP.t('semDescricaoFruta'))}</p>
          ${f.traduzida ? `<p class="nota">${OP.t('traducaoNota')}</p>` : ''}
          <h3>${OP.t('quemComeu')}</h3>
          <p id="comeu">${OP.t('procurandoPersonagens')}</p>
        </div>
      </div>`, f.nome);
    const alvo = document.getElementById('comeu');
    try {
      const donos = (await OP.api.personagens()).filter((p) => p.fruta && p.fruta.id === f.id);
      alvo.textContent = donos.length
        ? donos.map((p) => p.nome).join(', ')
        : OP.t('ninguemLigado');
    } catch (erro) {
      alvo.textContent = OP.t('erroPersonagens');
    }
  };

  /* ---------- Estados de carregamento e erro ---------- */

  OP.carregando = function (alvo, texto) {
    alvo.innerHTML = `<p class="aviso aviso--carregando">${OP.esc(texto)}</p>`;
  };

  OP.erro = function (alvo, oQue, erro, tentarDeNovo) {
    console.error(erro);
    alvo.innerHTML = `
      <div class="aviso aviso--erro">
        <p>${OP.esc(OP.t('erroCarregar', { oque: oQue }))} ${OP.esc(erro.message || '')}.</p>
        <p>${OP.t('confiraConexao')}</p>
        <button type="button" class="botao">${OP.t('tentarDeNovo')}</button>
      </div>`;
    alvo.querySelector('button').addEventListener('click', tentarDeNovo);
  };

  /* ---------- Menu ---------- */

  function iniciarMenu() {
    const botao = document.querySelector('.menu-botao');
    const menu = document.getElementById('menu');
    if (!botao || !menu) return;
    botao.addEventListener('click', () => {
      const aberto = botao.getAttribute('aria-expanded') === 'true';
      botao.setAttribute('aria-expanded', String(!aberto));
      menu.classList.toggle('aberto', !aberto);
    });
  }

  // Os formulários de filtro não enviam nada: Enter não recarrega a página
  document.querySelectorAll('form').forEach((f) => f.addEventListener('submit', (e) => e.preventDefault()));

  iniciarMenu();
  const ano = document.getElementById('ano');
  if (ano) ano.textContent = new Date().getFullYear();
})(window.OP);
