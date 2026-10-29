/* Facções: preenche cada mural com os personagens escolhidos (data-ids) */
(function (OP) {
  const murais = [...document.querySelectorAll('[data-ids]')];

  async function iniciar() {
    murais.forEach((m) => OP.carregando(m, OP.t('buscandoFaccao')));
    try {
      const todos = await OP.api.personagens();
      const porId = new Map(todos.map((p) => [p.id, p]));
      murais.forEach((mural) => {
        const variante = mural.dataset.variante || 'procurado';
        mural.innerHTML = '';
        mural.dataset.ids.split(',').map(Number).forEach((id) => {
          const p = porId.get(id);
          if (!p) return; // personagem saiu da API: só não aparece
          const c = OP.cartaz(p, { variante });
          c.addEventListener('click', () => OP.abrirJanela(OP.fichaPersonagem(p), p.nome));
          mural.appendChild(c);
        });
      });
      // Os cartazes mudam a altura da página; volta para a seção pedida no link (ex.: #marinha)
      if (location.hash) {
        try { document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView(); } catch (e) { /* hash inválido */ }
      }
    } catch (erro) {
      murais.forEach((m) => { m.innerHTML = ''; });
      OP.erro(murais[0], OP.t('oqFaccoes'), erro, iniciar);
    }
  }

  iniciar();
})(window.OP);
