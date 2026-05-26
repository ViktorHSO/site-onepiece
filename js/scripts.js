
document.addEventListener('DOMContentLoaded', function () {
    const slides = document.querySelectorAll('.carousel img');
    let currentSlide = 0;
    let intervalId;

    function showSlide(index) {
        slides.forEach((slide, i) => {
            slide.style.transitionDuration = '0s'; // Remover a transição durante a troca de slides
            slide.classList.toggle('active', i === index);
        });
        setTimeout(() => {
            slides.forEach(slide => {
                slide.style.transitionDuration = ''; // Restaurar a transição após a troca de slides
            });
        }, 10); // Adicionar um pequeno intervalo antes de restaurar a transição
    }

    function nextSlide() {
        currentSlide = (currentSlide + 1) % slides.length;
        showSlide(currentSlide);
    }

    function startCarousel() {
        showSlide(currentSlide);
        clearInterval(intervalId);
        intervalId = setInterval(nextSlide, 3000); // Troca de slide a cada 3 segundos
    }

    startCarousel(); // Iniciar o carrossel

    slides.forEach((slide, index) => {
        slide.addEventListener('transitionend', () => {
            clearInterval(intervalId);
            intervalId = setInterval(nextSlide, 3000); // Troca de slide a cada 3 segundos
        });
    });
});
