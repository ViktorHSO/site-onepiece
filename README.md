# Diário da Grand Line

Uma enciclopédia de One Piece feita por fã: personagens, tripulações, Frutas do Diabo, espadas e as facções que mandam no mundo. Os dados vêm da [API One Piece](https://api-onepiece.com/), então as listas crescem sozinhas quando ela é atualizada.

**[Abrir o site](https://viktorhso.github.io/site-onepiece/)**

![Página inicial do site, com o título "Procura-se" e cartazes de procurado do Luffy, Zoro e Sanji](docs/inicio.jpg)

## O que tem no site

- **Personagens:** os 786 personagens da API em cartazes de procurado, com busca, filtro por tripulação e situação e ordenação por recompensa. Cada cartaz abre uma ficha com idade, altura, fruta e recompensa.
- **Quem vale mais:** as dez maiores recompensas, com barras para comparar.
- **Abertura em camadas:** um pôr do sol desenhado em SVG (céu, Red Line, ilhas, navio e três faixas de mar) com parallax no scroll e no mouse.
- **Jornal Econômico Mundial:** manchetes passando logo abaixo da abertura, e os números da API contando ao aparecer.
- **A rota do bando:** uma carta náutica com as sagas na ordem, de East Blue até Elbaf. O caminho é desenhado e um navio segue a rota conforme a página rola.
- **Tripulações:** tabela com capitão, número de membros, recompensa somada e a lista de quem faz parte.
- **Frutas do Diabo:** as 213 frutas por tipo, com descrição em português e quem comeu cada uma.
- **Espadas:** as espadas famosas separadas por grau (Saijo O Wazamono, O Wazamono, Ryo Wazamono).
- **Facções:** Imperadores, Pior Geração, Marinha, Exército Revolucionário e Governo Mundial, com os principais nomes de cada grupo.
- **Seu cartaz:** você escreve seu nome, escolhe a recompensa e uma foto, e baixa o seu próprio cartaz de procurado. A foto não sai do navegador.
- **Português e inglês:** o botão PT | EN no topo troca o site inteiro.

| | |
|---|---|
| ![Ranking das maiores recompensas](docs/ranking.jpg) | ![Cartazes da Marinha na página de facções](docs/faccoes.jpg) |
| ![Página para criar o próprio cartaz](docs/cartaz.jpg) | |

## Como rodar

É HTML, CSS e JavaScript puro, sem nenhuma instalação. Dá para abrir o `index.html` direto no navegador, mas o jeito mais confiável é usar a extensão **Live Server** do VS Code (botão *Go Live*). O site precisa de internet para buscar os dados na API.

## Como o código está organizado

```
index.html                     página inicial
pages/                         personagens, tripulações, frutas, espadas, facções e seu cartaz
assets/css/style.css           todo o visual
assets/js/api.js               busca os dados na API e deixa tudo num formato simples
assets/js/ui.js                peças usadas em todas as páginas: menu, cartaz, janela de detalhes
assets/js/efeitos.js           movimento: parallax, barra de progresso, revelar ao rolar, carta náutica, voltar ao topo
assets/js/idioma.js            troca de idioma e todas as frases do site
assets/js/descricoes-pt.js     descrições das frutas e espadas em português
assets/js/fotos.js             personagens com foto na pasta assets/img/personagens
assets/js/fotos-anilist.js     fotos dos personagens vindas da AniList
assets/js/pages/*.js           o código de cada página
assets/img/personagens/        fotos do bando do Chapéu de Palha
docs/                          imagens deste README
```

Todo o JavaScript fica dentro de um único objeto, `OP`, para uma página não sobrescrever as funções da outra.

### Movimento e acessibilidade

Todo o movimento fica em `assets/js/efeitos.js` e roda num único `requestAnimationFrame` por quadro. Quem liga "reduzir movimento" no sistema vê o site parado, com todo o conteúdo já visível. Os desenhos são SVG feitos para o site, sem imagens externas, então a política de segurança (CSP) continua a mesma.

### Fotos de personagens

A API One Piece não tem fotos de personagens (só tem imagem de 23 frutas). As fotos vêm da [AniList](https://anilist.co/anime/21/ONE-PIECE/characters): `assets/js/fotos-anilist.js` liga o id de cada personagem da API à imagem dele, e hoje cobre 355 personagens, incluindo quase todos os principais. O nome que aparece no site é sempre o da API One Piece.

Para trocar ou acrescentar uma foto, salve a imagem como `assets/img/personagens/<id>.webp` e coloque o id na lista de `assets/js/fotos.js`. Fotos locais têm prioridade sobre as da AniList. Quem não tem foto aparece com as iniciais.

### Idiomas

Os textos fixos do HTML têm o atributo `data-i18n="chave"`, e a versão em inglês fica em `assets/js/idioma.js`. Os textos montados pelo JavaScript usam `OP.t('chave')`. A API só tem inglês e francês, então as descrições em português das frutas e espadas foram traduzidas para o site e ficam em `assets/js/descricoes-pt.js`.

## Créditos

- Dados: [API One Piece](https://api-onepiece.com/)
- Fotos dos personagens: [AniList](https://anilist.co)
- Fontes: [Rye](https://fonts.google.com/specimen/Rye) e [Bricolage Grotesque](https://fonts.google.com/specimen/Bricolage+Grotesque), do Google Fonts

One Piece pertence a Eiichiro Oda, Shueisha e Toei Animation. Este é um projeto de fã, sem fins lucrativos.

## Sobre o projeto

Feito na disciplina de Introdução à Tecnologia Web, no 1º período de Sistemas de Informação do Centro Universitário do Rio São Francisco (UNIRIOS).

**Aluno:** Victor Hugo Sousa Oliveira
