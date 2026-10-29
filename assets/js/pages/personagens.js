/* Página de personagens: filtros, ordenação e "mostrar mais" */
(function (OP) {
  const POR_VEZ = 24;
  const lista = document.getElementById('lista');
  const contagem = document.getElementById('contagem');
  const botaoMais = document.getElementById('mais');
  const campos = {
    nome: document.getElementById('f-nome'),
    tripulacao: document.getElementById('f-tripulacao'),
    status: document.getElementById('f-status'),
    ordem: document.getElementById('f-ordem'),
  };

  let todos = [];
  let filtrados = [];
  let mostrando = POR_VEZ;

  // Ignora acentos e maiúsculas na busca ("jinbe" acha "Jinbe")
  const simplificar = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  function preencherTripulacoes() {
    const mapa = new Map();
    todos.forEach((p) => { if (p.tripulacao) mapa.set(p.tripulacao.id, p.tripulacao.nome); });
    [...mapa.entries()]
      .sort((a, b) => a[1].localeCompare(b[1], OP.local))
      .forEach(([id, nome]) => campos.tripulacao.add(new Option(nome, id)));

    // Permite chegar filtrado vindo da página de tripulações: ?tripulacao=1
    const daUrl = new URLSearchParams(location.search).get('tripulacao');
    if (daUrl && mapa.has(Number(daUrl))) campos.tripulacao.value = daUrl;
  }

  function filtrar() {
    const busca = simplificar(campos.nome.value.trim());
    const trip = campos.tripulacao.value;
    const status = campos.status.value;

    filtrados = todos.filter((p) => {
      if (busca && !simplificar(`${p.nome} ${p.apelido || ''}`).includes(busca)) return false;
      if (trip === 'sem' && p.tripulacao) return false;
      if (trip && trip !== 'sem' && (!p.tripulacao || String(p.tripulacao.id) !== trip)) return false;
      if (status && p.statusId !== status) return false;
      return true;
    });

    if (campos.ordem.value === 'recompensa') {
      filtrados.sort((a, b) => (b.recompensa ?? -1) - (a.recompensa ?? -1));
    } else if (campos.ordem.value === 'nome') {
      filtrados.sort((a, b) => a.nome.localeCompare(b.nome, OP.local));
    }

    mostrando = POR_VEZ;
    desenhar();
  }

  function desenhar() {
    const total = filtrados.length;
    contagem.textContent = total === 1 ? OP.t('umPersonagem') : OP.t('personagensEncontrados', { n: OP.numero(total) });

    lista.innerHTML = '';
    if (!total) {
      lista.innerHTML = `<p class="aviso">${OP.t('nadaPersonagem')}</p>`;
    }
    filtrados.slice(0, mostrando).forEach((p) => {
      const cartaz = OP.cartaz(p);
      cartaz.addEventListener('click', () => OP.abrirJanela(OP.fichaPersonagem(p), p.nome));
      lista.appendChild(cartaz);
    });
    botaoMais.hidden = mostrando >= total;
  }

  async function iniciar() {
    OP.carregando(lista, OP.t('buscandoCartazes'));
    try {
      todos = await OP.api.personagens();
      preencherTripulacoes();
      filtrar();
    } catch (erro) {
      OP.erro(lista, OP.t('oqPersonagens'), erro, iniciar);
    }
  }

  let espera;
  campos.nome.addEventListener('input', () => {
    clearTimeout(espera);
    espera = setTimeout(filtrar, 150);
  });
  ['tripulacao', 'status', 'ordem'].forEach((c) => campos[c].addEventListener('change', filtrar));
  botaoMais.addEventListener('click', () => {
    mostrando += POR_VEZ;
    desenhar();
  });

  iniciar();
})(window.OP);
