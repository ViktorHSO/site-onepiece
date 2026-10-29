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

  // Se a foto não carregar, o cartaz volta a mostrar as iniciais
  document.addEventListener('error', (e) => {
    const img = e.target;
    if (!(img instanceof HTMLImageElement) || !img.dataset.nome) return;
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

  // variante: "procurado" (padrão), "marinha" (ficha de oficial) ou "governo" (dossiê secreto)
  const VARIANTE = {
    procurado: { titulo: OP.t('procurado'), meio: OP.t('vivoOuMorto'), rodape: OP.t('marinha') },
    marinha: { titulo: OP.t('marinhaTitulo'), meio: OP.t('fichaOficial'), rodape: OP.t('qg') },
    governo: { titulo: OP.t('dossie'), meio: OP.t('governoMundial'), rodape: OP.t('maryGeoise') },
  };

  OP.cartaz = function (p, { tag = 'button', variante = 'procurado' } = {}) {
    const v = VARIANTE[variante] || VARIANTE.procurado;
    const el = document.createElement(tag);
    el.className = `cartaz cartaz--${variante}`;
    if (variante === 'governo') el.dataset.carimbo = OP.t('sigiloso');
    el.style.setProperty('--giro', OP.inclinacao(p.id) + 'deg');
    if (tag === 'button') {
      el.type = 'button';
      el.setAttribute('aria-label', OP.t('verDetalhes', { nome: p.nome }));
    }
    const foto = p.foto
      ? `<img src="${OP.esc(OP.srcFoto(p.foto))}" alt="" loading="lazy" width="260" height="190" data-nome="${OP.esc(p.nome)}" referrerpolicy="no-referrer">`
      : `<span class="cartaz__sem-foto" aria-hidden="true">${OP.esc(OP.iniciais(p.nome))}</span>`;
    let valor;
    if (variante !== 'procurado') {
      valor = p.cargo ? `<span class="cartaz__valor cartaz__valor--vazio">${OP.esc(p.cargo)}</span>` : '';
    } else if (p.recompensa != null) {
      valor = `<span class="cartaz__valor">${OP.esc(OP.numero(p.recompensa))} –</span>`;
    } else {
      valor = `<span class="cartaz__valor cartaz__valor--vazio">${OP.t('semRecompensa')}</span>`;
    }
    el.innerHTML = `
      <span class="cartaz__titulo" aria-hidden="true">${v.titulo}</span>
      <span class="cartaz__foto">${foto}</span>
      <span class="cartaz__vivo" aria-hidden="true">${v.meio}</span>
      <span class="cartaz__nome">${OP.esc(p.nome)}</span>
      ${valor}
      <span class="cartaz__marinha" aria-hidden="true">${v.rodape}</span>`;
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
    janela.querySelector('.janela__conteudo').innerHTML = html;
    janela.setAttribute('aria-label', titulo || OP.t('detalhes'));
    document.body.classList.add('sem-rolagem');
    janela.showModal();
  };

  OP.fichaPersonagem = function (p) {
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
        <div class="ficha__cartaz">${OP.cartaz(p, { tag: 'div' }).outerHTML}</div>
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
