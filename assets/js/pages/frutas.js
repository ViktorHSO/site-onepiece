/* Página de Frutas do Diabo */
(function (OP) {
  const POR_VEZ = 30;
  const lista = document.getElementById('lista');
  const contagem = document.getElementById('contagem');
  const botaoMais = document.getElementById('mais');
  const fNome = document.getElementById('f-nome');
  const fTipo = document.getElementById('f-tipo');
  const fImagem = document.getElementById('f-imagem');

  let todas = [];
  let filtradas = [];
  let mostrando = POR_VEZ;

  const simplificar = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  function filtrar() {
    const busca = simplificar(fNome.value.trim());
    filtradas = todas.filter((f) => {
      if (busca && !simplificar(`${f.nome} ${f.nomeIngles}`).includes(busca)) return false;
      if (fTipo.value && f.familia !== fTipo.value) return false;
      if (fImagem.value === 'sim' && !f.imagem) return false;
      return true;
    });
    mostrando = POR_VEZ;
    desenhar();
  }

  function desenhar() {
    const total = filtradas.length;
    contagem.textContent = total === 1 ? OP.t('umaFruta') : OP.t('frutasEncontradas', { n: OP.numero(total) });
    lista.innerHTML = '';
    if (!total) {
      lista.innerHTML = `<li class="aviso">${OP.t('nadaFruta')}</li>`;
    }
    filtradas.slice(0, mostrando).forEach((f) => lista.appendChild(OP.itemFruta(f)));
    botaoMais.hidden = mostrando >= total;
  }

  async function iniciar() {
    OP.carregando(lista, OP.t('bauFrutas'));
    try {
      todas = await OP.api.frutas();
      filtrar();
    } catch (erro) {
      OP.erro(lista, OP.t('oqFrutas'), erro, iniciar);
    }
  }

  let espera;
  fNome.addEventListener('input', () => { clearTimeout(espera); espera = setTimeout(filtrar, 150); });
  fTipo.addEventListener('change', filtrar);
  fImagem.addEventListener('change', filtrar);
  botaoMais.addEventListener('click', () => { mostrando += POR_VEZ; desenhar(); });

  iniciar();
})(window.OP);
