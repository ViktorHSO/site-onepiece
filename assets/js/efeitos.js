/*
 * Efeitos de movimento usados em todas as páginas:
 * cabeçalho que muda ao rolar, barra de progresso, parallax do cenário,
 * elementos que aparecem ao entrar na tela, contadores, carta náutica
 * e o botão de voltar ao topo.
 *
 * Tudo respeita "reduzir movimento" do sistema: com ele ligado, o
 * conteúdo aparece direto e nada se mexe.
 */
window.OP = window.OP || {};

(function (OP) {
  const calmo = window.matchMedia('(prefers-reduced-motion: reduce)');
  const raiz = document.documentElement;
  raiz.classList.add('js-efeitos');

  /* ---------- Laço único de animação: lê o scroll uma vez por quadro ---------- */

  const tarefas = new Set();
  let pedido = 0;
  function agendar() {
    if (pedido) return;
    pedido = requestAnimationFrame(() => {
      pedido = 0;
      const y = window.scrollY;
      tarefas.forEach((f) => f(y));
    });
  }
  window.addEventListener('scroll', agendar, { passive: true });
  window.addEventListener('resize', agendar);

  /* ---------- Cabeçalho e barra de progresso ---------- */

  const topo = document.querySelector('.topo');
  if (topo) {
    const barra = document.createElement('div');
    barra.className = 'progresso';
    barra.setAttribute('aria-hidden', 'true');
    barra.innerHTML = '<span class="progresso__linha"></span><svg class="progresso__navio" viewBox="-18 -28 36 44"><path d="M-16 4 H16 Q13 12 8 14 H-8 Q-13 12 -16 4 Z" fill="currentColor"/><rect x="-1" y="-20" width="2.4" height="24" fill="currentColor"/><path d="M-12 -16 Q0 -12 12 -16 L10 0 Q0 3 -10 0 Z" fill="currentColor" opacity=".7"/></svg>';
    topo.appendChild(barra);
    const linha = barra.firstElementChild;
    const navio = barra.lastElementChild;
    let max = 1;
    const medirPagina = () => { max = document.documentElement.scrollHeight - window.innerHeight; };
    medirPagina();
    if ('ResizeObserver' in window) new ResizeObserver(medirPagina).observe(document.body);
    window.addEventListener('resize', medirPagina);
    let rolado = null;
    tarefas.add((y) => {
      if ((y > 8) !== rolado) { rolado = y > 8; topo.classList.toggle('topo--rolado', rolado); }
      const p = max > 0 ? Math.min(1, y / max) : 0;
      linha.style.transform = `scaleX(${p})`;
      navio.style.left = `calc(${(p * 100).toFixed(2)}% + ${(8 - p * 16).toFixed(1)}px)`;
    });
  }

  /* ---------- Parallax do cenário (scroll + mouse) ---------- */

  const cena = document.getElementById('cena');
  if (cena) {
    const camadas = [...cena.querySelectorAll('[data-paralaxe], [data-mouse]')];
    let mx = 0, my = 0, alvoX = 0, alvoY = 0, girando = false, altura = cena.offsetHeight;
    const celular = window.matchMedia('(max-width: 52rem)');
    celular.addEventListener?.('change', () => { cena.style.setProperty('--sumir', '0'); agendar(); });

    // Escala do cenário: a mesma conta do preserveAspectRatio="xMidYMax slice",
    // para as ondas e os raios (que são <svg> à parte) ficarem alinhados com o resto.
    const molde = cena.querySelector('.camada');
    function escalar() {
      altura = cena.offsetHeight;
      if (!molde) return;
      const e = Math.max(molde.offsetWidth / 1440, molde.offsetHeight / 800);
      cena.style.setProperty('--e', e.toFixed(4));
    }
    escalar();
    if ('ResizeObserver' in window) new ResizeObserver(escalar).observe(cena);
    else window.addEventListener('resize', escalar);

    // Fora da tela as animações param (economiza bateria e deixa o resto da página leve)
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => cena.classList.toggle('cena--parada', !e.isIntersecting)).observe(cena);
      const jornal = document.querySelector('.jornal');
      if (jornal) new IntersectionObserver(([e]) => jornal.classList.toggle('jornal--parado', !e.isIntersecting)).observe(jornal);
    }

    let fora = false;
    function aplicar(y) {
      if (y > altura) { // cenário fora da tela: não gasta nada
        if (!fora) { fora = true; cena.style.setProperty('--sumir', '1'); }
        return;
      }
      fora = false;
      // no celular o cenário fica parado no fundo: o parallax é só uma leve profundidade
      const fator = celular.matches ? 0.18 : 1;
      camadas.forEach((el) => {
        const v = parseFloat(el.dataset.paralaxe || 0);
        if (celular.matches && v < 0) { el.style.transform = ''; return; } // o texto segue o fluxo normal
        const m = parseFloat(el.dataset.mouse || 0);
        el.style.transform = `translate3d(${(mx * m).toFixed(2)}px, ${(y * v * fator + my * m * 0.5).toFixed(2)}px, 0)`;
      });
      if (!celular.matches) cena.style.setProperty('--sumir', Math.min(1, y / (altura * 0.8)).toFixed(3));
    }

    // o mouse puxa as camadas devagar, com uma suavização simples
    function suavizar() {
      mx += (alvoX - mx) * 0.08;
      my += (alvoY - my) * 0.08;
      aplicar(window.scrollY);
      if (Math.abs(alvoX - mx) > 0.001 || Math.abs(alvoY - my) > 0.001) requestAnimationFrame(suavizar);
      else girando = false;
    }

    cena.addEventListener('pointermove', (e) => {
      if (calmo.matches || e.pointerType !== 'mouse') return;
      const r = cena.getBoundingClientRect();
      alvoX = (e.clientX - r.left) / r.width - 0.5;
      alvoY = (e.clientY - r.top) / r.height - 0.5;
      if (!girando) { girando = true; requestAnimationFrame(suavizar); }
    });
    cena.addEventListener('pointerleave', () => { alvoX = 0; alvoY = 0; if (!girando) { girando = true; requestAnimationFrame(suavizar); } });

    tarefas.add((y) => { if (!calmo.matches) aplicar(y); });
  }

  /* ---------- Elementos que aparecem ao entrar na tela ---------- */

  const SELETOR_REVELAR = [
    '.secao__cabeca', '.ranking', '.imperadores li', '.convite > *', '.frutas',
    '.estatisticas__lista > div', '.titulo-pagina', '.filtros', '.faccao h2', '.faccao__texto',
    '.bando', '.oficina', '.tabela-envelope', '.texto-longo > *',
  ].join(',');

  const observador = 'IntersectionObserver' in window && !calmo.matches
    ? new IntersectionObserver((entradas) => {
      entradas.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('visivel');
        observador.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 })
    : null;

  OP.revelar = function (el, atraso = 0) {
    if (!observador) { el.classList.add('visivel'); return; }
    el.classList.add('revelar');
    if (atraso) el.style.setProperty('--atraso', `${atraso}ms`);
    observador.observe(el);
  };

  // atraso em cascata para irmãos (ex.: os quatro imperadores)
  document.querySelectorAll(SELETOR_REVELAR).forEach((el) => {
    const irmaos = el.parentElement ? [...el.parentElement.children].filter((c) => c.matches(SELETOR_REVELAR)) : [];
    OP.revelar(el, Math.max(0, irmaos.indexOf(el)) * 90);
  });

  /* ---------- Contadores ---------- */

  OP.contar = function (el) {
    const alvo = Number(el.dataset.alvo);
    if (!Number.isFinite(alvo)) return;
    const escrever = (n) => { el.textContent = OP.numero ? OP.numero(n) : String(n); };
    if (calmo.matches || !('IntersectionObserver' in window)) { escrever(alvo); return; }
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const inicio = performance.now();
      const dur = 1400;
      (function passo(t) {
        const p = Math.min(1, (t - inicio) / dur);
        escrever(Math.round(alvo * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(passo);
      })(inicio);
    }, { threshold: 0.4 });
    io.observe(el);
  };

  /* ---------- Carta náutica (rota do bando na home) ---------- */

  function iniciarCarta() {
    const carta = document.getElementById('carta');
    const svg = document.getElementById('carta-trilha');
    if (!carta || !svg) return;
    const fundo = svg.querySelector('.carta__rastro--fundo');
    const feito = svg.querySelector('.carta__rastro--feito');
    const barco = document.getElementById('carta-barco');
    const navio = barco.querySelector('.carta__navio');
    const corpo = barco.querySelector('.carta__navio-corpo');
    let paradas = [], pontos = [], comprimento = 0, marcos = [], tabela = [];
    let atual = 0, alvo = 0, andando = false, ultimoX = 1, visitadas = -1;

    // Liga o centro de cada medalha com curvas em S
    function medir() {
      paradas = [...carta.querySelectorAll('.parada')];
      if (!paradas.length) return;
      const base = carta.getBoundingClientRect();
      [svg, barco].forEach((el) => {
        el.setAttribute('viewBox', `0 0 ${base.width} ${base.height}`);
        el.setAttribute('width', base.width);
        el.setAttribute('height', base.height);
      });
      pontos = paradas.map((p) => {
        const r = p.querySelector('.parada__medalha').getBoundingClientRect();
        return [r.left - base.left + r.width / 2, r.top - base.top + r.height / 2];
      });
      let d = `M${pontos[0][0]} ${pontos[0][1] - 60} L${pontos[0][0]} ${pontos[0][1]}`;
      for (let i = 1; i < pontos.length; i++) {
        const [x0, y0] = pontos[i - 1];
        const [x1, y1] = pontos[i];
        const meio = (y1 - y0) / 2;
        d += ` C${x0} ${y0 + meio} ${x1} ${y1 - meio} ${x1} ${y1}`;
      }
      fundo.setAttribute('d', d);
      feito.setAttribute('d', d);
      comprimento = feito.getTotalLength();
      feito.style.strokeDasharray = comprimento;
      // Tabela altura -> distância no caminho. O caminho sempre desce, então
      // dá para achar o ponto que está na altura da tela, em qualquer layout.
      tabela = [];
      for (let l = 0; l <= comprimento; l += 3) tabela.push([feito.getPointAtLength(l).y, l]);
      tabela.push([feito.getPointAtLength(comprimento).y, comprimento]);
      marcos = pontos.map(([, y]) => distanciaNaAltura(y));
      visitadas = -1;
      atual = alvo = distanciaNaAltura(alturaAlvo());
      desenhar(atual);
      agendar();
    }

    function distanciaNaAltura(y) {
      if (!tabela.length) return 0;
      if (y <= tabela[0][0]) return 0;
      if (y >= tabela[tabela.length - 1][0]) return comprimento;
      let lo = 0, hi = tabela.length - 1;
      while (hi - lo > 1) {
        const m = (lo + hi) >> 1;
        if (tabela[m][0] < y) lo = m; else hi = m;
      }
      const [y0, l0] = tabela[lo], [y1, l1] = tabela[hi];
      return y1 === y0 ? l0 : l0 + ((y - y0) / (y1 - y0)) * (l1 - l0);
    }

    // a "linha de leitura" fica um pouco acima do meio da tela
    function alturaAlvo() {
      if (calmo.matches) return Infinity;
      const altura = window.visualViewport ? window.visualViewport.height : window.innerHeight;
      return altura * 0.55 - carta.getBoundingClientRect().top;
    }

    function desenhar(l) {
      feito.style.strokeDashoffset = comprimento - l;
      const pt = feito.getPointAtLength(l);
      const frente = feito.getPointAtLength(Math.min(comprimento, l + 4));
      if (frente.x < pt.x - 0.2) ultimoX = -1;
      else if (frente.x > pt.x + 0.2) ultimoX = 1;
      navio.setAttribute('transform', `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)})`);
      corpo.setAttribute('transform', `scale(${ultimoX} 1)`);
      const n = marcos.filter((m) => l >= m - 2).length;
      if (n !== visitadas) { visitadas = n; paradas.forEach((el, i) => el.classList.toggle('parada--visitada', i < n)); }
    }

    // No celular o scroll chega aos trancos; o navio desliza até o alvo em vez de pular
    function deslizar() {
      const dif = alvo - atual;
      atual = Math.abs(dif) < 0.5 ? alvo : atual + dif * 0.2;
      desenhar(atual);
      if (atual !== alvo) requestAnimationFrame(deslizar);
      else andando = false;
    }

    let cartaVisivel = true;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => { cartaVisivel = e.isIntersecting; if (cartaVisivel) agendar(); }, { rootMargin: '200px 0px' }).observe(carta);
    }
    function seguir() {
      if (!comprimento || !cartaVisivel) return;
      alvo = Math.max(0, Math.min(comprimento, distanciaNaAltura(alturaAlvo())));
      if (calmo.matches) { atual = alvo; desenhar(atual); return; }
      if (!andando && alvo !== atual) { andando = true; requestAnimationFrame(deslizar); }
    }

    tarefas.add(seguir);
    document.addEventListener('op:rota', medir);
    // a barra de endereço do celular muda a altura da tela: remede só quando a largura muda
    let largura = window.innerWidth;
    window.addEventListener('resize', () => {
      clearTimeout(medir.t);
      medir.t = setTimeout(() => { if (window.innerWidth !== largura) { largura = window.innerWidth; medir(); } else agendar(); }, 150);
    });
    if ('ResizeObserver' in window) new ResizeObserver(() => { clearTimeout(medir.r); medir.r = setTimeout(medir, 120); }).observe(carta);
    if (document.fonts) document.fonts.ready.then(medir);
    medir();
  }

  /* ---------- Faixa das páginas internas ---------- */

  // O título das páginas internas ganha um mar com ondas que se mexem
  function faixaInterna() {
    const titulo = document.querySelector('main > .envelope > .titulo-pagina');
    if (!titulo) return;
    const envelope = titulo.parentElement;
    const faixa = document.createElement('div');
    faixa.className = 'faixa';
    faixa.innerHTML = `
      <svg class="faixa__rosa" viewBox="0 0 200 200" aria-hidden="true" data-paralaxe-faixa="0.25">
        <circle cx="100" cy="100" r="92" fill="none" stroke="currentColor" stroke-width="1.5"/>
        <circle cx="100" cy="100" r="78" fill="none" stroke="currentColor" stroke-width="1" stroke-dasharray="2 6"/>
        <path d="M100 6 L112 100 L100 194 L88 100 Z" fill="currentColor"/>
        <path d="M6 100 L100 88 L194 100 L100 112 Z" fill="currentColor" opacity=".6"/>
      </svg>
      <div class="envelope faixa__conteudo"></div>
      <svg class="faixa__ondas" viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden="true">
        <g class="faixa__onda faixa__onda--1"><path d="M0 40 Q90 20 180 40 T360 40 T540 40 T720 40 T900 40 T1080 40 T1260 40 T1440 40 T1620 40 T1800 40 T1980 40 T2160 40 T2340 40 T2520 40 T2700 40 T2880 40 V80 H0 Z"/></g>
        <g class="faixa__onda faixa__onda--2"><path d="M0 55 Q120 38 240 55 T480 55 T720 55 T960 55 T1200 55 T1440 55 T1680 55 T1920 55 T2160 55 T2400 55 T2640 55 T2880 55 V80 H0 Z"/></g>
      </svg>`;
    faixa.querySelector('.faixa__conteudo').appendChild(titulo);
    envelope.parentElement.insertBefore(faixa, envelope);
    const rosa = faixa.querySelector('.faixa__rosa');
    tarefas.add((y) => {
      if (calmo.matches || y > faixa.offsetHeight) return;
      rosa.style.transform = `translateY(${y * 0.25}px) rotate(${y * 0.15}deg)`;
    });
  }

  /* ---------- Voltar ao topo (uma bússola) ---------- */

  function botaoTopo() {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'ao-topo';
    b.setAttribute('aria-label', OP.t ? OP.t('voltarTopo') : 'Voltar ao topo');
    b.innerHTML = '<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="17" fill="none" stroke="currentColor" stroke-width="2"/><path d="M20 7 L25 21 H15 Z" fill="#b3202a"/><path d="M20 33 L15 19 H25 Z" fill="currentColor" opacity=".55"/></svg>';
    b.addEventListener('click', () => window.scrollTo({ top: 0, behavior: calmo.matches ? 'auto' : 'smooth' }));
    document.body.appendChild(b);
    tarefas.add((y) => b.classList.toggle('ao-topo--ver', y > window.innerHeight * 0.9));
  }

  faixaInterna();
  iniciarCarta();
  botaoTopo();
  agendar();
})(window.OP);
