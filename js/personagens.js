const personagemInfos = document.querySelectorAll('.personagem-info');
const links = document.querySelectorAll('ul li a');

links.forEach(link => {
  link.addEventListener('click', (event) => {
    const id = event.target.getAttribute('href').substring(1); // Obter o ID do link
    personagemInfos.forEach(info => {
      if (info.id === id) {
        info.style.display = 'block'; // Mostrar a div de descrição correspondente
      } else {
        info.style.display = 'none'; // Ocultar outras divs de descrição
      }
    });
  });
});