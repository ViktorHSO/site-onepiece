/*
 * Troca de idioma (português / inglês).
 *
 * - O HTML é escrito em português. Elementos com data-i18n="chave" recebem
 *   o texto em inglês de TEXTOS_EN quando o idioma escolhido é inglês.
 *   data-i18n-placeholder e data-i18n-aria fazem o mesmo com placeholder
 *   e aria-label.
 * - Textos montados pelo JavaScript usam OP.t('chave'), que procura em
 *   FRASES[idioma].
 * - A escolha fica salva no navegador. Trocar de idioma recarrega a página.
 */
window.OP = window.OP || {};

(function (OP) {
  let salvo = null;
  try { salvo = localStorage.getItem('op:idioma'); } catch (e) { /* navegador sem localStorage */ }
  OP.idioma = salvo === 'en' ? 'en' : 'pt';
  OP.local = OP.idioma === 'en' ? 'en-US' : 'pt-BR';
  document.documentElement.lang = OP.idioma === 'en' ? 'en' : 'pt-BR';

  /* ---------- Frases usadas pelo JavaScript ---------- */

  const FRASES = {
    pt: {
      procurado: 'Procurado', vivoOuMorto: 'Vivo ou morto', marinha: 'Marinha',
      marinhaTitulo: 'Marinha', fichaOficial: 'Ficha de oficial', qg: 'Quartel-general',
      dossie: 'Dossiê', governoMundial: 'Governo Mundial', maryGeoise: 'Mary Geoise', sigiloso: 'Sigiloso',
      semRecompensa: 'sem recompensa', semRecompensaFicha: 'Sem recompensa',
      verDetalhes: 'Ver detalhes de {nome}',
      tripulacao: 'Tripulação', funcao: 'Função', fruta: 'Fruta do Diabo', recompensa: 'Recompensa',
      idade: 'Idade', altura: 'Altura', situacao: 'Situação', nenhuma: 'Nenhuma',
      naoComeu: 'Não comeu nenhuma', conhecidoComo: 'Conhecido como {apelido}', semTripulacao: 'Sem tripulação',
      fechar: 'Fechar', detalhes: 'Detalhes',
      erroCarregar: 'Não foi possível carregar {oque}.', confiraConexao: 'Confira sua conexão com a internet e tente de novo.',
      tentarDeNovo: 'Tentar de novo',
      semImagemDe: 'Sem imagem de {nome}', semDescricaoFruta: 'A API não tem descrição para esta fruta.',
      quemComeu: 'Quem comeu', procurandoPersonagens: 'Procurando nos personagens…',
      ninguemLigado: 'Nenhum personagem da API está ligado a esta fruta.', erroPersonagens: 'Não foi possível consultar os personagens agora.',
      traducaoNota: 'Tradução feita para este site a partir do texto em inglês da API.',
      // início
      numeros: 'Até agora são <strong>{p} personagens</strong>, <strong>{t} tripulações</strong>, <strong>{f} Frutas do Diabo</strong> e <strong>{e} espadas</strong>.',
      semNumeros: 'A API não respondeu agora, então os números ficaram de fora.',
      pregando: 'Pregando os cartazes…', bauFrutas: 'Abrindo o baú de frutas…',
      oqBando: 'os cartazes do bando', oqFrutas: 'as frutas', capitulos: 'Capítulos {c}',
      seuNome: 'Seu nome aqui', arcoAtual: 'arco atual',
      voltarTopo: 'Voltar ao topo', progresso: 'Progresso da leitura',
      // listas
      personagensEncontrados: '{n} personagens encontrados', umPersonagem: '1 personagem encontrado',
      nadaPersonagem: 'Ninguém com esses filtros. Tente apagar parte do nome ou escolher "Todas" na tripulação.',
      buscandoCartazes: 'Buscando os cartazes na Marinha…', oqPersonagens: 'os personagens',
      frutasEncontradas: '{n} frutas encontradas', umaFruta: '1 fruta encontrada',
      nadaFruta: 'Nenhuma fruta com esses filtros. Tente outro nome ou volte o tipo para "Todos".',
      tripulacoesN: '{n} tripulações', umaTripulacao: '1 tripulação',
      nadaTripulacao: 'Nenhuma tripulação com esses filtros. Tente outro nome.',
      contandoBandos: 'Contando os bandos…', oqTripulacoes: 'as tripulações',
      nome: 'Nome', capitao: 'Capitão', membros: 'Membros', recompensaTotal: 'Recompensa total',
      imperador: 'Já foi comandada por um Imperador', imperadorCurto: '(Imperador)',
      emJapones: 'Em japonês, {n}.', situacaoX: 'Situação: {s}.', recompensaSomada: 'Recompensa somada: {v}.',
      membrosNaApi: 'Membros na API ({n})', verCartazes: 'Ver os cartazes', semMembros: 'A API não liga nenhum personagem a esta tripulação.',
      afiando: 'Afiando as lâminas…', oqEspadas: 'as espadas', tipo: 'Tipo', grau: 'Grau {g}', semGrau: 'Sem grau oficial',
      quebrada: 'Quebrada', inteira: 'Inteira', quebradaMin: 'quebrada', semDescricaoEspada: 'A API não tem descrição para esta espada.',
      buscandoFaccao: 'Buscando os cartazes…', oqFaccoes: 'os cartazes das facções',
      // oficina
      oficial: 'Oficial', agente: 'Agente', semNome: 'Sem nome', erroImagem: ' Não deu para gerar a imagem com essa foto. Tente outra.',
      'cartaz.heic': 'Fotos HEIC do iPhone não abrem neste navegador. Tire um print da foto ou escolha uma em JPG ou PNG.',
      'cartaz.fotoRuim': 'Não deu para abrir essa imagem. Tente outra, em JPG ou PNG.',
      'cartaz.baixado': 'Pronto! O cartaz foi salvo como {arquivo}.',
    },
    en: {
      procurado: 'Wanted', vivoOuMorto: 'Dead or alive', marinha: 'Marine',
      marinhaTitulo: 'Marines', fichaOficial: 'Officer record', qg: 'Headquarters',
      dossie: 'Dossier', governoMundial: 'World Government', maryGeoise: 'Mary Geoise', sigiloso: 'Classified',
      semRecompensa: 'no bounty', semRecompensaFicha: 'No bounty',
      verDetalhes: 'See details for {nome}',
      tripulacao: 'Crew', funcao: 'Role', fruta: 'Devil Fruit', recompensa: 'Bounty',
      idade: 'Age', altura: 'Height', situacao: 'Status', nenhuma: 'None',
      naoComeu: 'Has not eaten one', conhecidoComo: 'Known as {apelido}', semTripulacao: 'No crew',
      fechar: 'Close', 'cartaz.amostra': 'Wanted', detalhes: 'Details',
      erroCarregar: 'Could not load {oque}.', confiraConexao: 'Check your internet connection and try again.',
      tentarDeNovo: 'Try again',
      semImagemDe: 'No image of {nome}', semDescricaoFruta: 'The API has no description for this fruit.',
      quemComeu: 'Who ate it', procurandoPersonagens: 'Looking through the characters…',
      ninguemLigado: 'No character in the API is linked to this fruit.', erroPersonagens: 'Could not look up the characters right now.',
      traducaoNota: '',
      numeros: 'So far there are <strong>{p} characters</strong>, <strong>{t} crews</strong>, <strong>{f} Devil Fruits</strong> and <strong>{e} swords</strong>.',
      semNumeros: 'The API did not answer just now, so the numbers are missing.',
      pregando: 'Pinning up the posters…', bauFrutas: 'Opening the fruit chest…',
      oqBando: 'the crew posters', oqFrutas: 'the fruits', capitulos: 'Chapters {c}',
      seuNome: 'Your name here', arcoAtual: 'current arc',
      voltarTopo: 'Back to top', progresso: 'Reading progress',
      personagensEncontrados: '{n} characters found', umPersonagem: '1 character found',
      nadaPersonagem: 'Nobody matches these filters. Try deleting part of the name or choosing "All" for the crew.',
      buscandoCartazes: 'Fetching posters from the Marines…', oqPersonagens: 'the characters',
      frutasEncontradas: '{n} fruits found', umaFruta: '1 fruit found',
      nadaFruta: 'No fruit matches these filters. Try another name or set the type back to "All".',
      tripulacoesN: '{n} crews', umaTripulacao: '1 crew',
      nadaTripulacao: 'No crew matches these filters. Try another name.',
      contandoBandos: 'Counting the crews…', oqTripulacoes: 'the crews',
      nome: 'Name', capitao: 'Captain', membros: 'Members', recompensaTotal: 'Total bounty',
      imperador: 'Was once led by an Emperor', imperadorCurto: '(Emperor)',
      emJapones: 'In Japanese, {n}.', situacaoX: 'Status: {s}.', recompensaSomada: 'Combined bounty: {v}.',
      membrosNaApi: 'Members in the API ({n})', verCartazes: 'See the posters', semMembros: 'The API does not link any character to this crew.',
      afiando: 'Sharpening the blades…', oqEspadas: 'the swords', tipo: 'Type', grau: '{g} grade', semGrau: 'No official grade',
      quebrada: 'Broken', inteira: 'Intact', quebradaMin: 'broken', semDescricaoEspada: 'The API has no description for this sword.',
      buscandoFaccao: 'Fetching the posters…', oqFaccoes: 'the faction posters',
      oficial: 'Officer', agente: 'Agent', semNome: 'No name', erroImagem: ' Could not create the image with this photo. Try another one.',
      'cartaz.heic': 'iPhone HEIC photos do not open in this browser. Take a screenshot of the photo or pick a JPG or PNG.',
      'cartaz.fotoRuim': 'Could not open this image. Try another one, as JPG or PNG.',
      'cartaz.baixado': 'Done! The poster was saved as {arquivo}.',
    },
  };

  OP.t = function (chave, vars = {}) {
    let texto = FRASES[OP.idioma][chave] ?? FRASES.pt[chave] ?? chave;
    Object.entries(vars).forEach(([k, v]) => { texto = texto.replaceAll(`{${k}}`, v); });
    return texto;
  };

  /* ---------- Textos fixos do HTML em inglês ---------- */

  const TEXTOS_EN = {
    // topo e rodapé
    'pular': 'Skip to content',
    'menu': 'Menu',
    'nav.inicio': 'Home', 'nav.personagens': 'Characters', 'nav.tripulacoes': 'Crews', 'nav.frutas': 'Fruits',
    'nav.espadas': 'Swords', 'nav.faccoes': 'Factions', 'nav.cartaz': 'Your poster',
    'nav.rotulo': 'Main',
    'rodape.autor': 'Made by Victor Hugo Sousa Oliveira, Information Systems, UNIRIOS.',
    'rodape.dados': 'Data from the <a href="https://api-onepiece.com/">One Piece API</a>. One Piece belongs to Eiichiro Oda, Shueisha and Toei Animation. This is a non-profit fan project.',
    'rodape.codigo': 'Source code on GitHub',
    'rodape.fotos': 'Character pictures: <a href="https://anilist.co/anime/21/ONE-PIECE/characters">AniList</a>.',

    // início
    'inicio.grito': 'Wanted:',
    'inicio.sub': 'information about One Piece.',
    'inicio.texto': 'I started this site as an assignment for Introduction to Web Technology, in the Information Systems course at UNIRIOS, and it turned into the notebook where I write down everything about the series. The data comes from the One Piece API, so the lists grow on their own.',
    'inicio.contando': 'Counting the characters, crews, fruits and swords in the API…',
    'inicio.verProcurados': 'See the wanted', 'inicio.fazerCartaz': 'Make my poster',
    'inicio.colagem': 'Posters of Luffy, Zoro and Sanji',
    'inicio.ranking': 'Who is worth the most',
    'inicio.rankingTexto': 'The ten highest bounties in the API. Each bar shows how a bounty compares with the highest one.',
    'inicio.rota': 'The crew’s route',
    'inicio.rotaTexto': 'The sagas in the order the Straw Hats sailed through them. Scroll down and follow the ship.',
    'inicio.selo': 'Fan encyclopedia · East Blue → Elbaf',
    'inicio.descer': 'Scroll down to the content',
    'inicio.jornal': 'World Economy News', 'inicio.jornalRotulo': 'World Economy News headlines',
    'inicio.numerosRotulo': 'The site in numbers',
    'stat.p': 'characters', 'stat.t': 'crews', 'stat.f': 'Devil Fruits', 'stat.e': 'legendary swords',
    'inicio.bando': 'The Straw Hat Pirates',
    'inicio.bandoTexto': 'Current bounties. Click a poster to open the record.',
    'inicio.yonko': 'The Four Emperors today',
    'inicio.yonkoLink': 'See each one’s crew',
    'yonko.luffy': 'Straw Hat Pirates', 'yonko.shanks': 'Shanks, the Red-Haired', 'yonko.ruivo': 'Red Hair Pirates',
    'yonko.barbanegra': 'Blackbeard Pirates', 'yonko.buggy': 'Buggy the Clown',
    'inicio.convite': 'How much is your head worth?',
    'inicio.conviteTexto': 'Type your name, pick a photo and a bounty, and download your own wanted poster. The photo never leaves your computer.',
    'inicio.frutas': 'Some Devil Fruits', 'inicio.frutasLink': 'See all fruits',

    // personagens
    'pers.titulo': 'Characters',
    'pers.texto': 'Every character in the API, from captain to background extra. Click a poster to open the record.',
    'f.nome': 'Name', 'f.tripulacao': 'Crew', 'f.situacao': 'Status', 'f.ordem': 'Sort by', 'f.tipo': 'Type', 'f.imagem': 'Image',
    'f.todas': 'All', 'f.todos': 'All', 'f.semTripulacao': 'No crew',
    'f.vivo': 'Alive', 'f.morto': 'Dead', 'f.desconhecido': 'Unknown',
    'f.ordemApi': 'Order of appearance', 'f.ordemRecompensa': 'Highest bounty', 'f.ordemNome': 'Name, A to Z',
    'f.ordemRecompensaTotal': 'Highest total bounty', 'f.ordemMembros': 'Most members',
    'f.ativa': 'Active', 'f.inativa': 'Inactive', 'f.dissolvida': 'Disbanded',
    'f.zoan': 'Zoan (includes Ancient and Mythical)', 'f.comSem': 'With or without image', 'f.soCom': 'With image only',
    'mais24': 'Show 24 more', 'mais30': 'Show 30 more',

    // tripulações
    'trip.titulo': 'Crews',
    'trip.texto': 'The pirate crews in the API. The captain and member list are put together from the characters. The crown marks crews that were once led by an Emperor.',
    'trip.exemplo': 'e.g. Whitebeard',
    'pers.exemplo': 'e.g. Zoro', 'frutas.exemplo': 'e.g. Mera Mera',

    // frutas
    'frutas.titulo': 'Devil Fruits',
    'frutas.texto': 'Whoever eats one gains a power and loses the ability to swim. The API only has images for a few fruits; the others are shown as a simple drawing in the color of their type.',

    // espadas
    'esp.titulo': 'Swords',
    'esp.texto': 'Named swords in One Piece are ranked into grades, the Meito. The API only has the 21 best-known ones, so the list is short. Click a name to read its description.',

    // facções
    'fac.titulo': 'Factions',
    'fac.texto': 'Who rules, who hunts and who runs in the world of One Piece. The texts are mine; the posters use data from the API.',
    'fac.sumario': 'On this page',
    'fac.s.imperadores': 'Emperors', 'fac.s.antigos': 'Former Emperors', 'fac.s.pior': 'Worst Generation',
    'fac.s.marinha': 'Marines', 'fac.s.revolucionarios': 'Revolutionaries', 'fac.s.governo': 'World Government',
    'fac.imperadores': 'The Four Emperors',
    'fac.imperadoresTexto': 'The four pirates who split the New World between them. After Wano the list became Luffy, Shanks, Blackbeard and Buggy, who got in almost by accident thanks to Cross Guild.',
    'fac.b.chapeu': 'Straw Hat Pirates', 'fac.b.ruivo': 'Red Hair Pirates', 'fac.b.barbanegra': 'Blackbeard Pirates',
    'fac.antigos': 'The former Emperors',
    'fac.antigosTexto': 'Whitebeard died at Marineford. Kaido and Big Mom fell together at Onigashima. Roger was never an Emperor, he was the Pirate King, but his crew is here because it started everything.',
    'fac.b.barbabranca': 'Whitebeard Pirates', 'fac.b.cemferas': 'Beasts Pirates', 'fac.b.bigmom': 'Big Mom Pirates', 'fac.b.roger': 'Roger Pirates',
    'fac.pior': 'The Worst Generation',
    'fac.piorTexto': 'The rookies who reached Sabaody with bounties over 100 million at the same time as Luffy. Some became allies, others fell by the wayside.',
    'fac.marinha': 'Marines',
    'fac.marinhaTexto': 'The World Government’s military force, and the ones who print the wanted posters. Not every Marine agrees with the Government: Garp, Smoker and Koby do things their own way. Kuzan left after losing the fight for Fleet Admiral and now sails with Blackbeard.',
    'fac.revolucionarios': 'Revolutionary Army',
    'fac.revolucionariosTexto': 'Led by Monkey D. Dragon, Luffy’s father. They want to overthrow the World Government and act in countries where people suffer under the nobles. Sabo, Luffy’s sworn brother, is the Chief of Staff.',
    'fac.governo': 'World Government',
    'fac.governoTexto': 'More than 170 countries under one rule for 800 years. Above everything are the Five Elders, and above them, Imu. Cipher Pol does the dirty work: CP9 fought the crew at Enies Lobby.',
    'fac.nota': 'Summary up to date through the Egghead arc.',

    // seu cartaz
    'cartaz.titulo': 'Make your poster',
    'cartaz.texto': 'Type a name, pick a bounty and a photo, place it the way you like and download the poster. The photo stays in your browser and is never sent anywhere.',
    'cartaz.nome': 'Name on the poster', 'cartaz.valor': 'Bounty in berries', 'cartaz.foto': 'Photo', 'cartaz.modelo': 'Poster type',
    'cartaz.m.procurado': 'Wanted, dead or alive', 'cartaz.m.marinha': 'Marine record', 'cartaz.m.governo': 'Classified dossier',
    'cartaz.g.texto': 'Text', 'cartaz.g.foto': 'Photo', 'cartaz.g.estilo': 'Style',
    'cartaz.escolherFoto': 'Choose a photo',
    'cartaz.arraste': 'Drag the photo on the poster to place it. Use the mouse wheel or two fingers to zoom.',
    'cartaz.zoom': 'Zoom', 'cartaz.horizontal': 'Horizontal', 'cartaz.vertical': 'Vertical',
    'cartaz.tom': 'Photo color', 'cartaz.tom.sepia': 'Sepia', 'cartaz.tom.pb': 'Black and white', 'cartaz.tom.cor': 'Color',
    'cartaz.centralizar': 'Center photo', 'cartaz.fonte': 'Font', 'cartaz.papel': 'Paper',
    'cartaz.papel.novo': 'Freshly nailed', 'cartaz.papel.velho': 'Aged', 'cartaz.papel.gasto': 'Beaten by the sea',
    'cartaz.desgaste': 'Shuffle stains and tears', 'cartaz.compartilhar': 'Share',
    'cartaz.salvarTitulo': 'Your poster is ready', 'cartaz.salvarTexto': 'If the download did not start, tap and hold the image and choose save.',
    fechar: 'Close', 'cartaz.amostra': 'Wanted',
    'cartaz.baixar': 'Download as image',
  };

  function aplicarTextos() {
    if (OP.idioma !== 'en') return;
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const t = TEXTOS_EN[el.dataset.i18n];
      if (t != null) el.innerHTML = t;
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const t = TEXTOS_EN[el.dataset.i18nPlaceholder];
      if (t != null) el.placeholder = t;
    });
    document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
      const t = TEXTOS_EN[el.dataset.i18nAria];
      if (t != null) el.setAttribute('aria-label', t);
    });
    const titulo = document.querySelector('meta[name="titulo-en"]');
    if (titulo) document.title = titulo.content;
  }

  /* ---------- Botão PT | EN ---------- */

  function criarBotao() {
    const lugar = document.querySelector('.topo__linha');
    if (!lugar) return;
    const caixa = document.createElement('div');
    caixa.className = 'idioma';
    caixa.setAttribute('role', 'group');
    caixa.setAttribute('aria-label', OP.idioma === 'en' ? 'Language' : 'Idioma');
    caixa.innerHTML = `
      <button type="button" data-lang="pt" lang="pt-BR" aria-pressed="${OP.idioma === 'pt'}" title="Português">PT</button>
      <button type="button" data-lang="en" lang="en" aria-pressed="${OP.idioma === 'en'}" title="English">EN</button>`;
    caixa.addEventListener('click', (e) => {
      const b = e.target.closest('[data-lang]');
      if (!b || b.dataset.lang === OP.idioma) return;
      try { localStorage.setItem('op:idioma', b.dataset.lang); } catch (erro) { /* sem localStorage */ }
      location.reload();
    });
    lugar.insertBefore(caixa, lugar.querySelector('.menu-botao'));
  }

  aplicarTextos();
  criarBotao();
})(window.OP);
