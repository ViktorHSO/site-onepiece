/* Página inicial */
(function (OP) {
  const $ = (id) => document.getElementById(id);

  /* ---------- Rota do bando (texto escrito à mão, não vem da API) ---------- */

  const SAGAS = [
    { ilha: 'praia', caps: [1, 100], pt: ['East Blue', 'Luffy sai da Vila Foosha e junta Zoro, Nami, Usopp e Sanji.'], en: ['East Blue', 'Luffy leaves Foosha Village and gathers Zoro, Nami, Usopp and Sanji.'] },
    { ilha: 'deserto', caps: [101, 217], pt: ['Alabasta', 'Vivi e Chopper entram na história, e o bando derruba o Crocodile.'], en: ['Alabasta', 'Vivi and Chopper join the story, and the crew takes down Crocodile.'] },
    { ilha: 'nuvem', caps: [218, 302], pt: ['Skypiea', 'Uma ilha acima das nuvens, governada pelo falso deus Enel.'], en: ['Skypiea', 'An island above the clouds, ruled by the false god Enel.'] },
    { ilha: 'cidade', caps: [303, 441], pt: ['Water 7 e Enies Lobby', 'O Going Merry se despede, Franky entra e o bando declara guerra ao Governo para salvar Robin.'], en: ['Water 7 and Enies Lobby', 'The Going Merry says goodbye, Franky joins, and the crew declares war on the Government to save Robin.'] },
    { ilha: 'sombra', caps: [442, 489], pt: ['Thriller Bark', 'Um navio-ilha assombrado, o Moria roubando sombras e a chegada do Brook.'], en: ['Thriller Bark', 'A haunted island-ship, Moria stealing shadows and Brook coming aboard.'] },
    { ilha: 'fortaleza', caps: [490, 597], pt: ['Guerra de Marineford', 'Sabaody, Impel Down e a guerra em que Ace morre. O bando se separa por dois anos.'], en: ['Marineford War', 'Sabaody, Impel Down and the war where Ace dies. The crew splits up for two years.'] },
    { ilha: 'bolha', caps: [598, 653], pt: ['Ilha dos Tritões', 'O reencontro depois do treino, a dez mil metros de profundidade.'], en: ['Fish-Man Island', 'The reunion after training, ten thousand meters under the sea.'] },
    { ilha: 'castelo', caps: [654, 801], pt: ['Dressrosa', 'Aliança com Law, Punk Hazard e a queda do Doflamingo.'], en: ['Dressrosa', 'The alliance with Law, Punk Hazard and Doflamingo’s fall.'] },
    { ilha: 'doce', caps: [802, 908], pt: ['Whole Cake Island', 'Zou, o resgate do Sanji e a fuga do território da Big Mom.'], en: ['Whole Cake Island', 'Zou, rescuing Sanji and escaping Big Mom’s territory.'] },
    { ilha: 'cerejeira', caps: [909, 1057], pt: ['Wano', 'Luffy desperta a fruta, vira Nika e derrota Kaido.'], en: ['Wano', 'Luffy awakens his fruit, becomes Nika and defeats Kaido.'] },
    { ilha: 'futuro', caps: [1058, 1125], pt: ['Egghead', 'A ilha do Vegapunk, a mensagem ao mundo e o ataque dos Cinco Anciões.'], en: ['Egghead', 'Vegapunk’s island, the message to the world and the Five Elders’ attack.'] },
    { ilha: 'gigante', caps: [1126, null], pt: ['Elbaf', 'A terra dos gigantes. É o arco em andamento.'], en: ['Elbaf', 'The land of giants. It is the current arc.'] },
  ];

  // Ilhas desenhadas com formas simples; muda só o detalhe de cima
  const DETALHE = {
    praia: '<path d="M60 52 q4-18 2-30" stroke="#6b4a2b" stroke-width="3" fill="none"/><path d="M62 22 q-14-4-22 6 M62 22 q12-6 22 2 M62 22 q-4-10-14-12" stroke="#2f7a4a" stroke-width="5" fill="none" stroke-linecap="round"/>',
    deserto: '<path d="M30 54 q14-20 28 0 M52 54 q12-14 24 0" fill="#d9a85b"/><circle cx="90" cy="22" r="8" fill="#f0c24b"/>',
    nuvem: '<g fill="#fff"><circle cx="45" cy="38" r="12"/><circle cx="60" cy="32" r="15"/><circle cx="76" cy="40" r="11"/></g>',
    cidade: '<g fill="#e9e1cf"><rect x="38" y="30" width="12" height="24"/><rect x="54" y="20" width="14" height="34"/><rect x="72" y="34" width="12" height="20"/></g><path d="M30 56 h60" stroke="#5aa0c8" stroke-width="3"/>',
    sombra: '<path d="M40 54 l10-26 l10 26 M58 54 l12-34 l12 34" fill="#3c3552"/><circle cx="84" cy="18" r="7" fill="#e9e1cf"/>',
    fortaleza: '<rect x="40" y="28" width="40" height="26" fill="#d9d9d9"/><path d="M40 28 v-6 h8 v6 M56 28 v-6 h8 v6 M72 28 v-6 h8 v6" fill="#d9d9d9"/>',
    bolha: '<circle cx="60" cy="36" r="22" fill="rgba(140,210,240,.45)" stroke="#bfe6f5" stroke-width="2"/><path d="M50 46 q10-14 20 0" fill="#e58fb0"/>',
    castelo: '<path d="M44 54 v-22 l6-8 l6 8 v22 M64 54 v-28 l7-10 l7 10 v28" fill="#e7b85c"/>',
    doce: '<path d="M42 54 h36 l-4-16 h-28 z" fill="#f2b6c9"/><path d="M48 38 h24 l-3-12 h-18 z" fill="#fbe2b5"/><circle cx="60" cy="22" r="4" fill="#b3202a"/>',
    cerejeira: '<path d="M60 54 v-20" stroke="#6b4a2b" stroke-width="4"/><g fill="#f4a7c0"><circle cx="50" cy="30" r="10"/><circle cx="66" cy="26" r="12"/><circle cx="72" cy="36" r="8"/></g>',
    futuro: '<ellipse cx="60" cy="38" rx="14" ry="18" fill="#f3efe2"/><path d="M40 54 h40" stroke="#7fd1c7" stroke-width="3"/>',
    gigante: '<path d="M60 54 v-26" stroke="#6b4a2b" stroke-width="8"/><circle cx="60" cy="22" r="20" fill="#3f8f5a"/>',
  };

  // Carta náutica: as ilhas alternam de lado e o caminho é desenhado por efeitos.js
  function desenharRota() {
    $('rota-lista').innerHTML = SAGAS.map((s, i) => {
      const [nome, texto] = s[OP.idioma];
      const caps = s.caps[1]
        ? OP.idioma === 'en' ? `${s.caps[0]} to ${s.caps[1]}` : `${s.caps[0]} a ${s.caps[1]}`
        : OP.idioma === 'en' ? `${s.caps[0]} onward` : `${s.caps[0]} em diante`;
      const atual = !s.caps[1];
      return `
      <li class="parada${atual ? ' parada--atual' : ''}">
        <span class="parada__medalha">
          <svg class="parada__ilha" viewBox="0 0 120 70" aria-hidden="true">
            <ellipse cx="60" cy="58" rx="46" ry="10" fill="#e6cf98"/>
            <ellipse cx="60" cy="62" rx="54" ry="7" fill="rgba(255,255,255,.18)"/>
            ${DETALHE[s.ilha]}
          </svg>
          <span class="parada__numero" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
        </span>
        <span class="parada__texto-caixa">
          <h3 class="parada__nome">${nome}</h3>
          <p class="parada__caps">${OP.t('capitulos', { c: caps })}${atual ? ` · <strong>${OP.t('arcoAtual')}</strong>` : ''}</p>
          <p class="parada__texto">${texto}</p>
        </span>
      </li>`;
    }).join('');
    document.dispatchEvent(new CustomEvent('op:rota'));
  }

  /* ---------- Jornal: manchetes que passam ---------- */

  const MANCHETES = {
    pt: [
      'Recompensa de Monkey D. Luffy chega a 3 bilhões de berries',
      'Cross Guild põe preço na cabeça dos almirantes',
      'Mensagem do Dr. Vegapunk é ouvida no mundo inteiro',
      'Bando do Chapéu de Palha é visto a caminho de Elbaf',
      'Buggy, o Palhaço, é reconhecido como Imperador',
      'Marinha reforça a vigilância em Mary Geoise',
    ],
    en: [
      'Monkey D. Luffy’s bounty reaches 3 billion berries',
      'Cross Guild puts a price on the admirals’ heads',
      'Dr. Vegapunk’s message is heard around the world',
      'Straw Hat Pirates spotted heading for Elbaf',
      'Buggy the Clown recognized as an Emperor',
      'Marines tighten security at Mary Geoise',
    ],
  };

  function montarJornal() {
    const lista = $('manchetes');
    const itens = MANCHETES[OP.idioma].map((m) => `<li>${OP.esc(m)}</li>`).join('');
    // a lista vai duas vezes para o laço da animação não ter emenda; a cópia fica escondida do leitor de tela
    lista.innerHTML = itens + itens.replaceAll('<li>', '<li aria-hidden="true">');
  }

  /* ---------- Colagem do topo ---------- */

  function montarColagem(todos) {
    const ids = [2, 5, 1]; // Zoro e Sanji atrás, Luffy na frente
    const colagem = $('colagem');
    colagem.innerHTML = '';
    ids.forEach((id, i) => {
      const p = todos.find((x) => x.id === id);
      if (!p) return;
      const c = OP.cartaz(p);
      c.classList.add(['colagem__esq', 'colagem__dir', 'colagem__frente'][i]);
      c.addEventListener('click', () => OP.abrirJanela(OP.fichaPersonagem(p), p.nome));
      colagem.appendChild(c);
    });
  }

  /* ---------- Ranking ---------- */

  function montarRanking(todos) {
    // A API tem alguns personagens repetidos; fica só a primeira aparição de cada nome
    const vistos = new Set();
    const top = todos
      .filter((p) => p.recompensa)
      .sort((a, b) => b.recompensa - a.recompensa)
      .filter((p) => !vistos.has(p.nome) && vistos.add(p.nome))
      .slice(0, 10);
    const maior = top[0].recompensa;
    const lista = $('ranking');
    lista.innerHTML = '';
    top.forEach((p, i) => {
      const li = document.createElement('li');
      li.className = 'ranking__item';
      const rosto = p.foto
        ? `<img src="${OP.esc(OP.srcFoto(p.foto))}" alt="" loading="lazy" data-nome="${OP.esc(p.nome)}" data-classe="" referrerpolicy="no-referrer">`
        : `<span>${OP.esc(OP.iniciais(p.nome))}</span>`;
      li.innerHTML = `
        <span class="ranking__pos">${i + 1}</span>
        <span class="ranking__rosto">${rosto}</span>
        <button type="button" class="ranking__nome link-botao">${OP.esc(p.nome)}</button>
        <span class="ranking__trip">${OP.esc(p.tripulacao ? p.tripulacao.nome : OP.t('semTripulacao'))}</span>
        <span class="ranking__barra"><span></span></span>
        <span class="ranking__valor">${OP.esc(OP.berries(p.recompensa))}</span>`;
      li.querySelector('.ranking__barra span').style.width = `${(p.recompensa / maior) * 100}%`;
      li.querySelector('button').addEventListener('click', () => OP.abrirJanela(OP.fichaPersonagem(p), p.nome));
      lista.appendChild(li);
    });
  }

  /* ---------- Carregamento ---------- */

  async function carregarPersonagens() {
    OP.carregando($('bando'), OP.t('pregando'));
    try {
      const todos = await OP.api.personagens();
      montarColagem(todos);
      montarRanking(todos);
      const bando = $('bando');
      bando.innerHTML = '';
      todos.filter((p) => p.tripulacao && p.tripulacao.id === 1 && p.id <= 10).forEach((p) => {
        const c = OP.cartaz(p);
        c.addEventListener('click', () => OP.abrirJanela(OP.fichaPersonagem(p), p.nome));
        bando.appendChild(c);
      });
    } catch (erro) {
      OP.erro($('bando'), OP.t('oqBando'), erro, carregarPersonagens);
      $('ranking').innerHTML = '';
    }
  }

  async function carregarNumeros() {
    try {
      const [p, t, f, e] = await Promise.all([
        OP.api.personagens(), OP.api.tripulacoes(), OP.api.frutas(), OP.api.espadas(),
      ]);
      const total = { personagens: p.length, tripulacoes: t.length, frutas: f.length, espadas: e.length };
      document.querySelectorAll('[data-contar]').forEach((dd) => {
        dd.dataset.alvo = total[dd.dataset.contar];
        OP.contar?.(dd);
      });
    } catch (erro) {
      const aviso = $('numeros-aviso');
      aviso.textContent = OP.t('semNumeros');
      aviso.hidden = false;
    }
  }

  async function carregarFrutas() {
    const alvo = $('frutas-destaque');
    OP.carregando(alvo, OP.t('bauFrutas'));
    try {
      const comImagem = (await OP.api.frutas()).filter((f) => f.imagem).slice(0, 8);
      alvo.innerHTML = '';
      comImagem.forEach((f) => alvo.appendChild(OP.itemFruta(f)));
    } catch (erro) {
      OP.erro(alvo, OP.t('oqFrutas'), erro, carregarFrutas);
    }
  }

  // Cartaz de exemplo no convite
  $('convite-cartaz').appendChild(
    OP.cartaz({ id: 3, nome: OP.t('seuNome'), recompensa: 100000000, foto: null }, { tag: 'div' })
  );

  desenharRota();
  montarJornal();
  carregarPersonagens();
  carregarNumeros();
  carregarFrutas();
})(window.OP);
