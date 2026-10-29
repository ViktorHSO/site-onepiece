/* Página de tripulações: tabela com capitão e membros tirados dos personagens */
(function (OP) {
  const alvo = document.getElementById('lista');
  const contagem = document.getElementById('contagem');
  const fNome = document.getElementById('f-nome');
  const fStatus = document.getElementById('f-status');
  const fOrdem = document.getElementById('f-ordem');

  let todas = [];
  let membrosPorTripulacao = new Map();

  const simplificar = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  function capitao(t) {
    const membros = membrosPorTripulacao.get(t.id) || [];
    const cap = membros.find((p) => p.cargoOriginal === 'captain');
    return cap ? cap.nome : '—';
  }

  function desenhar() {
    const busca = simplificar(fNome.value.trim());
    let lista = todas.filter((t) => {
      if (busca && !simplificar(`${t.nome} ${t.nomeOriginal} ${t.nomeJapones}`).includes(busca)) return false;
      if (fStatus.value && t.statusId !== fStatus.value) return false;
      return true;
    });

    if (fOrdem.value === 'recompensa') lista.sort((a, b) => (b.recompensaTotal ?? -1) - (a.recompensaTotal ?? -1));
    if (fOrdem.value === 'membros') lista.sort((a, b) => (b.membros ?? -1) - (a.membros ?? -1));
    if (fOrdem.value === 'nome') lista.sort((a, b) => a.nome.localeCompare(b.nome, OP.local));

    contagem.textContent = lista.length === 1 ? OP.t('umaTripulacao') : OP.t('tripulacoesN', { n: OP.numero(lista.length) });

    if (!lista.length) {
      alvo.innerHTML = `<p class="aviso">${OP.t('nadaTripulacao')}</p>`;
      return;
    }

    alvo.innerHTML = `
      <table>
        <caption class="so-leitor">${OP.t('oqTripulacoes')}</caption>
        <thead>
          <tr>
            <th scope="col">${OP.t('nome')}</th>
            <th scope="col">${OP.t('capitao')}</th>
            <th scope="col" class="numero">${OP.t('membros')}</th>
            <th scope="col" class="numero">${OP.t('recompensaTotal')}</th>
            <th scope="col">${OP.t('situacao')}</th>
          </tr>
        </thead>
        <tbody>
          ${lista.map((t) => `
            <tr>
              <td>
                <button type="button" class="link-botao" data-id="${t.id}">${OP.esc(t.nome)}</button>
                ${t.yonko ? `<span class="coroa" title="${OP.t('imperador')}"> ♛<span class="so-leitor"> ${OP.t('imperadorCurto')}</span></span>` : ''}
                ${t.nomeJapones ? `<br><small>${OP.esc(t.nomeJapones)}</small>` : ''}
              </td>
              <td>${OP.esc(capitao(t))}</td>
              <td class="numero">${t.membros != null ? OP.numero(t.membros) : '—'}</td>
              <td class="numero">${t.recompensaTotal != null ? OP.esc(OP.berries(t.recompensaTotal)) : '—'}</td>
              <td>${OP.esc(t.status)}</td>
            </tr>`).join('')}
        </tbody>
      </table>`;
  }

  function abrir(id) {
    const t = todas.find((x) => x.id === id);
    const membros = membrosPorTripulacao.get(id) || [];
    OP.abrirJanela(`
      <h2>${OP.esc(t.nome)}</h2>
      <p>${t.nomeJapones ? OP.esc(OP.t('emJapones', { n: t.nomeJapones })) + ' ' : ''}${OP.esc(OP.t('situacaoX', { s: t.status.toLowerCase() }))}${t.recompensaTotal ? ' ' + OP.esc(OP.t('recompensaSomada', { v: OP.berries(t.recompensaTotal) })) : ''}</p>
      <h3>${OP.t('membrosNaApi', { n: membros.length })}</h3>
      ${membros.length
        ? `<ul class="membros">${membros.map((p) => `<li>${OP.esc(p.nome)}${p.cargo ? ` <small>(${OP.esc(p.cargo)})</small>` : ''}</li>`).join('')}</ul>
           <p class="acoes-janela"><a class="botao" href="personagens.html?tripulacao=${t.id}">${OP.t('verCartazes')}</a></p>`
        : `<p>${OP.t('semMembros')}</p>`}`, t.nome);
  }

  async function iniciar() {
    OP.carregando(alvo, OP.t('contandoBandos'));
    try {
      const [tripulacoes, personagens] = await Promise.all([OP.api.tripulacoes(), OP.api.personagens()]);
      todas = tripulacoes;
      membrosPorTripulacao = new Map();
      personagens.forEach((p) => {
        if (!p.tripulacao) return;
        if (!membrosPorTripulacao.has(p.tripulacao.id)) membrosPorTripulacao.set(p.tripulacao.id, []);
        membrosPorTripulacao.get(p.tripulacao.id).push(p);
      });
      desenhar();
    } catch (erro) {
      OP.erro(alvo, OP.t('oqTripulacoes'), erro, iniciar);
    }
  }

  let espera;
  fNome.addEventListener('input', () => { clearTimeout(espera); espera = setTimeout(desenhar, 150); });
  fStatus.addEventListener('change', desenhar);
  fOrdem.addEventListener('change', desenhar);
  alvo.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-id]');
    if (b) abrir(Number(b.dataset.id));
  });

  iniciar();
})(window.OP);
