/* Página de espadas: uma tabela por grau */
(function (OP) {
  const alvo = document.getElementById('lista');

  async function iniciar() {
    OP.carregando(alvo, OP.t('afiando'));
    try {
      const espadas = await OP.api.espadas();
      const grupos = new Map();
      espadas
        .sort((a, b) => a.ordem - b.ordem)
        .forEach((e) => {
          if (!grupos.has(e.grupo)) grupos.set(e.grupo, { grau: e.grau, itens: [] });
          grupos.get(e.grupo).itens.push(e);
        });

      alvo.innerHTML = '';
      grupos.forEach(({ grau, itens }, grupo) => {
        const envelope = document.createElement('div');
        envelope.className = 'tabela-envelope espadas';
        envelope.innerHTML = `
          <table>
            <caption>${OP.esc(grupo)}${grau ? `<small>${OP.esc(OP.t('grau', { g: grau }))}</small>` : ''}</caption>
            <thead><tr><th scope="col">${OP.t('nome')}</th><th scope="col">${OP.t('tipo')}</th><th scope="col">${OP.t('situacao')}</th></tr></thead>
            <tbody>
              ${itens.map((e) => `
                <tr>
                  <td><button type="button" class="link-botao" data-id="${e.id}">${OP.esc(e.nome)}</button></td>
                  <td>${OP.esc(e.tipo || '—')}</td>
                  <td>${e.destruida ? `<span class="riscado">${OP.t('quebrada')}</span>` : OP.t('inteira')}</td>
                </tr>`).join('')}
            </tbody>
          </table>`;
        alvo.appendChild(envelope);
      });

      alvo.addEventListener('click', (ev) => {
        const botao = ev.target.closest('[data-id]');
        if (!botao) return;
        const e = espadas.find((x) => x.id === Number(botao.dataset.id));
        OP.abrirJanela(`
          <h2>${OP.esc(e.nome)}</h2>
          <p><strong>${OP.esc(e.grau ? OP.t('grau', { g: e.grau }) : OP.t('semGrau'))}</strong>${e.tipo ? ', ' + OP.esc(e.tipo).toLowerCase() : ''}${e.destruida ? ', ' + OP.t('quebradaMin') : ''}</p>
          <p>${OP.esc(e.descricao || OP.t('semDescricaoEspada'))}</p>
          ${e.traduzida ? `<p class="nota">${OP.t('traducaoNota')}</p>` : ''}`, e.nome);
      });
    } catch (erro) {
      OP.erro(alvo, OP.t('oqEspadas'), erro, iniciar);
    }
  }

  iniciar();
})(window.OP);
