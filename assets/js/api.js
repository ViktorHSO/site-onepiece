/*
 * Acesso à API pública https://api.api-onepiece.com (v2)
 *
 * Tudo fica dentro do objeto global OP, para que nenhuma função
 * de uma página sobrescreva a de outra (era o bug da versão antiga).
 *
 * A API devolve os dados meio em inglês, meio em francês e com campos
 * aninhados (personagem.crew é um objeto). As funções "normalizar..."
 * transformam tudo num formato simples e em português antes de
 * qualquer página usar.
 */
window.OP = window.OP || {};

(function (OP) {
  const BASE = 'https://api.api-onepiece.com/v2';
  const TEMPO_LIMITE = 15000; // a lista de personagens às vezes demora

  /* ---------- Requisição com cache na sessão ---------- */

  async function buscar(caminho) {
    const chave = 'op:' + caminho;
    try {
      const salvo = sessionStorage.getItem(chave);
      if (salvo) return JSON.parse(salvo);
    } catch (e) { /* sessionStorage indisponível: segue sem cache */ }

    const controle = new AbortController();
    const timer = setTimeout(() => controle.abort(), TEMPO_LIMITE);
    try {
      const resp = await fetch(`${BASE}/${caminho}`, { signal: controle.signal });
      if (!resp.ok) throw new Error(`A API respondeu ${resp.status}`);
      const dados = await resp.json();
      try { sessionStorage.setItem(chave, JSON.stringify(dados)); } catch (e) { /* cheio */ }
      return dados;
    } catch (erro) {
      if (erro.name === 'AbortError') throw new Error('A API demorou demais para responder');
      throw erro;
    } finally {
      clearTimeout(timer);
    }
  }

  // Evita baixar a mesma lista duas vezes quando duas partes da página pedem ao mesmo tempo
  const pendentes = {};
  function buscarUmaVez(caminho) {
    if (!pendentes[caminho]) {
      pendentes[caminho] = buscar(caminho).catch((e) => {
        delete pendentes[caminho];
        throw e;
      });
    }
    return pendentes[caminho];
  }

  /* ---------- Traduções ---------- */
  // Cada tabela tem a versão em português (pt) e em inglês (en).
  // OP.idioma vem do idioma.js.

  const EN = OP.idioma === 'en';
  const escolher = (pt, en) => (EN ? en : pt);

  // Status vira um código fixo (usado nos filtros) e um rótulo no idioma da página
  const STATUS_PERSONAGEM = {
    vivant: 'vivo', living: 'vivo', alive: 'vivo',
    deceased: 'morto', dead: 'morto', mort: 'morto',
  };
  const ROTULO_STATUS = {
    vivo: escolher('Vivo', 'Alive'), morto: escolher('Morto', 'Dead'), desconhecido: escolher('Desconhecido', 'Unknown'),
    ativa: escolher('Ativa', 'Active'), inativa: escolher('Inativa', 'Inactive'), dissolvida: escolher('Dissolvida', 'Disbanded'),
  };

  const TIPO_FRUTA = {
    'paramecia': ['Paramecia', 'Paramecia'],
    'logia': ['Logia', 'Logia'],
    'zoan': ['Zoan', 'Zoan'],
    'zoan antique': ['Zoan Ancestral', 'Ancient Zoan'],
    'zoan mythique': ['Zoan Mítica', 'Mythical Zoan'],
    'smile': ['SMILE', 'SMILE'],
    'clone': ['Clone', 'Clone'],
  };
  // família: o mesmo valor nos dois idiomas, usado no filtro e nas cores
  const FAMILIA_FRUTA = {
    'paramecia': 'Paramecia', 'logia': 'Logia', 'zoan': 'Zoan', 'zoan antique': 'Zoan',
    'zoan mythique': 'Zoan', 'smile': 'SMILE', 'clone': 'Clone',
  };

  const STATUS_TRIPULACAO = {
    actif: 'ativa', assets: 'ativa', active: 'ativa',
    inactif: 'inativa', inactive: 'inativa',
    dissolved: 'dissolvida',
  };

  // Nomes como os fãs conhecem (o resto é traduzido por regra)
  const NOME_TRIPULACAO = {
    1: ['Piratas do Chapéu de Palha', 'Straw Hat Pirates'],
    2: ['Piratas do Ruivo', 'Red Hair Pirates'],
    3: ['Piratas da Alvida', 'Alvida Pirates'],
    4: ['Piratas do Buggy', 'Buggy Pirates'],
    5: ['Piratas do Roger', 'Roger Pirates'],
    6: ['Piratas do Capitão Usopp', 'Usopp Pirates'],
    7: ['Piratas do Gato Preto', 'Black Cat Pirates'],
    8: ['Armada Pirata do Don Krieg', 'Krieg Pirates'],
    10: ['Piratas do Arlong', 'Arlong Pirates'],
    16: ['Piratas do Barba Branca', 'Whitebeard Pirates'],
    21: ['Piratas do Donquixote', 'Donquixote Pirates'],
    22: ['Piratas do Barba Negra', 'Blackbeard Pirates'],
    26: ['Piratas do Sol', 'Sun Pirates'],
    32: ['Piratas do Coração', 'Heart Pirates'],
    33: ['Piratas do Kid', 'Kid Pirates'],
    44: ['Piratas das Cem Feras', 'Beasts Pirates'],
    53: ['Piratas da Big Mom', 'Big Mom Pirates'],
  };

  // Só existe em português: em inglês o site mostra o cargo como vem da API
  const CARGO = {
    'captain': 'Capitão', 'right-hand man': 'Braço direito', 'navigator': 'Navegadora',
    'sniper': 'Atirador', 'cook': 'Cozinheiro', 'doctor': 'Médico',
    'archaeologist': 'Arqueóloga', 'carpenter': 'Carpinteiro', 'musician': 'Músico',
    'helmsman': 'Timoneiro', 'officer': 'Oficial', 'resident': 'Morador',
    'subordinate': 'Subordinado', 'lieutenant': 'Tenente', 'vice-admiral': 'Vice-almirante',
    'admiral': 'Almirante', 'fleet admiral': 'Almirante de frota', 'chief admiral': 'Almirante de frota',
    'colonel': 'Coronel', 'sub-admiral': 'Contra-almirante', 'prince': 'Príncipe', 'princess': 'Princesa',
    'king': 'Rei', 'queen': 'Rainha', 'special agent': 'Agente especial',
    'fighter': 'Lutador', 'samurai': 'Samurai', 'red sheaths': 'Bainhas Vermelhas',
    'council of five deans': 'Cinco Anciões', 'bestial guard': 'Guarda bestial',
    'commander-in-chief': 'Comandante supremo', 'chief of staff': 'Chefe do Estado-Maior',
    'observer': 'Observador', 'pirate': 'Pirata',
  };

  const CATEGORIA_ESPADA = {
    'saijo ô wazamono': { nome: 'Saijo O Wazamono', grupo: ['As 12 Lâminas Supremas', 'The 12 Supreme Grade Swords'], ordem: 1 },
    'ô wazamono': { nome: 'O Wazamono', grupo: ['As 21 Grandes Lâminas', 'The 21 Great Grade Swords'], ordem: 2 },
    'ryo wazamono': { nome: 'Ryo Wazamono', grupo: ['As 50 Lâminas Habilidosas', 'The 50 Skillful Grade Swords'], ordem: 3 },
  };

  const TIPO_ESPADA = {
    'lame noire': ['Lâmina negra', 'Black blade'], 'coutelas': ['Cutelo', 'Cutlass'],
    'katana': ['Katana', 'Katana'], 'naginata': ['Naginata', 'Naginata'], 'nodachi': ['Nodachi', 'Nodachi'],
  };

  // Grafias erradas ou em francês na API, corrigidas pelo id
  const NOME_CORRIGIDO = {
    32: 'Buggy', 86: 'Benn Beckman', 247: 'Marshall D. Teach', 249: 'Shiryu',
    250: 'Van Augur', 365: 'Donquixote Doflamingo', 441: 'Koby', 59: 'Eustass Kid',
  };

  const APELIDO = {
    'barbe blanche': ['Barba Branca', 'Whitebeard'],
    'barbe noire': ['Barba Negra', 'Blackbeard'],
    'le clown': ['o Palhaço', 'the Clown'],
  };

  const DESC_PT = OP.DESCRICOES_PT || { frutas: {}, espadas: {} };

  /* ---------- Funções auxiliares ---------- */

  const limpar = (v) => (typeof v === 'string' ? v.trim() : '');
  const par = (lista) => (lista ? escolher(lista[0], lista[1]) : null);

  // "3.000.000.000" -> 3000000000 (ou null se não tiver número)
  function paraNumero(texto) {
    const so = String(texto ?? '').replace(/\D/g, '');
    return so ? Number(so) : null;
  }

  // A API mistura inglês e francês nos nomes. Estas regras cobrem os formatos mais comuns:
  // "The Kuja Pirates crew" -> "Piratas Kuja" / "Kuja Pirates"
  function traduzirNomeTripulacao(t) {
    if (NOME_TRIPULACAO[t.id]) return par(NOME_TRIPULACAO[t.id]);
    const nome = limpar(t.name);
    let m = nome.match(/^the crew of (the )?(.+)$/i);
    if (m) return escolher(`Tripulação ${m[1] ? 'do' : 'de'} ${m[2]}`, `${m[1] ? 'The ' : ''}${m[2]} crew`);
    m = nome.match(/^(?:the )?(.+?)'s crew$/i);
    if (m) return escolher('Tripulação de ' + m[1], `${m[1]}'s crew`);
    m = nome.match(/^(?:the )?(.+?) crew$/i);
    if (m) {
      const miolo = m[1].match(/^(.+?) pirates$/i);
      if (miolo) return escolher('Piratas ' + miolo[1], miolo[1] + ' Pirates');
      return escolher('Tripulação ' + m[1], m[1] + ' Pirates');
    }
    m = nome.match(/^(.+?) pirates$/i);
    if (m) return escolher('Piratas ' + m[1], m[1] + ' Pirates');
    return nome || OP.t('semNome');
  }

  // "Sakazuki / Akainu" vira nome "Sakazuki" e apelido "Akainu"
  function separarNome(p) {
    const [nome, apelido] = limpar(p.name).split(/\s*\/\s*/);
    return {
      nome: NOME_CORRIGIDO[p.id] || (nome || OP.t('semNome')).replace(/ D /g, ' D. '),
      apelido: apelido ? (par(APELIDO[apelido.toLowerCase()]) || apelido) : null,
    };
  }

  // Alturas vêm como "174cm", "2 200cm" ou "35km"
  function traduzirAltura(texto) {
    const t = limpar(texto);
    if (!t || t === '-') return null;
    if (/cm$/i.test(t)) {
      const n = paraNumero(t);
      return n ? `${n.toLocaleString(OP.local)} cm` : null;
    }
    return t;
  }

  /* ---------- Normalização ---------- */

  function normalizarPersonagem(p) {
    const idade = paraNumero(p.age);
    const statusId = STATUS_PERSONAGEM[limpar(p.status).toLowerCase()] || 'desconhecido';
    const job = limpar(p.job);
    return {
      id: p.id,
      ...separarNome(p),
      cargo: EN ? job : (CARGO[job.toLowerCase()] || job),
      cargoOriginal: job.toLowerCase(),
      idade: idade ? `${idade.toLocaleString(OP.local)} ${escolher('anos', 'years')}` : null,
      altura: traduzirAltura(p.size),
      recompensa: paraNumero(p.bounty),
      statusId,
      status: ROTULO_STATUS[statusId],
      tripulacao: p.crew ? { id: p.crew.id, nome: traduzirNomeTripulacao(p.crew) } : null,
      fruta: p.fruit ? {
        id: p.fruit.id,
        nome: limpar(p.fruit.roman_name) || limpar(p.fruit.name),
        tipo: par(TIPO_FRUTA[limpar(p.fruit.type).toLowerCase()]) || limpar(p.fruit.type),
      } : null,
      // Foto: primeiro a da pasta assets/img/personagens, depois a da AniList (js/fotos-anilist.js)
      foto: (OP.FOTOS || []).includes(p.id)
        ? `assets/img/personagens/${p.id}.webp`
        : ((OP.FOTOS_ANILIST || {})[p.id] || null),
    };
  }

  function normalizarFruta(f) {
    const chave = limpar(f.type).toLowerCase();
    const original = limpar(f.description);
    const traduzida = DESC_PT.frutas[f.id];
    return {
      id: f.id,
      nome: limpar(f.roman_name) || limpar(f.name),
      nomeIngles: limpar(f.name),
      tipo: par(TIPO_FRUTA[chave]) || limpar(f.type) || escolher('Desconhecido', 'Unknown'),
      // "Zoan Ancestral" e "Zoan Mítica" também contam como Zoan no filtro
      familia: FAMILIA_FRUTA[chave] || 'Outro',
      descricao: EN ? original : (traduzida || original),
      traduzida: !EN && Boolean(traduzida),
      // Só aceita imagens do servidor da API (evita links estranhos vindos de fora)
      imagem: /^https:\/\/images\.api-onepiece\.com\//.test(limpar(f.filename)) ? limpar(f.filename) : null,
    };
  }

  function normalizarEspada(e, indice) {
    const cat = CATEGORIA_ESPADA[limpar(e.category).toLowerCase()];
    const original = limpar(e.description);
    const traduzida = DESC_PT.espadas[limpar(e.name).toLowerCase()];
    return {
      id: indice + 1, // a API não manda id para espadas
      nome: limpar(e.name).replace(/^./, (l) => l.toUpperCase()),
      grau: cat ? cat.nome : null,
      grupo: cat ? par(cat.grupo) : OP.t('semGrau'),
      ordem: cat ? cat.ordem : 4,
      tipo: par(TIPO_ESPADA[limpar(e.type).toLowerCase()]) || limpar(e.type) || null,
      destruida: Boolean(e.isDestroy),
      descricao: EN ? original : (traduzida || original),
      traduzida: !EN && Boolean(traduzida),
    };
  }

  function normalizarTripulacao(t) {
    let status = limpar(t.status).toLowerCase();
    if (status.startsWith('arr')) status = 'dissolved'; // "arrêté" às vezes chega com acento quebrado
    const statusId = STATUS_TRIPULACAO[status] || 'desconhecido';
    return {
      id: t.id,
      nome: traduzirNomeTripulacao(t),
      nomeOriginal: limpar(t.name),
      nomeJapones: limpar(t.roman_name),
      membros: paraNumero(t.number),
      recompensaTotal: paraNumero(t.total_prime),
      statusId,
      status: ROTULO_STATUS[statusId],
      yonko: Boolean(t.is_yonko),
    };
  }

  /* ---------- Funções públicas ---------- */

  OP.api = {
    async personagens() {
      const lista = await buscarUmaVez('characters/en');
      return lista.map(normalizarPersonagem);
    },
    async frutas() {
      const lista = await buscarUmaVez('fruits/en');
      return lista.map(normalizarFruta);
    },
    async espadas() {
      const lista = await buscarUmaVez('swords/en');
      return lista.map(normalizarEspada);
    },
    async tripulacoes() {
      const lista = await buscarUmaVez('crews/en');
      return lista.map(normalizarTripulacao);
    },
  };
})(window.OP);
