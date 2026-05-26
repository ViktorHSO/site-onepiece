/**
 * One Piece Encyclopedia - Premium Main JavaScript
 * Handles loading screen, API integration, carousels, and interactions
 */

document.addEventListener('DOMContentLoaded', function () {
    // Initialize all components
    initLoadingScreen();
    initNavigation();
    initAOS();
    loadInitialData();
    initSwiperCarousels();
    initModalSystem();
    initScrollAnimations();
    updateActiveNavLink();
});

/**
 * Loading Screen
 */
function initLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    
    if (loadingScreen) {
        // Hide loading screen after content loads
        window.addEventListener('load', () => {
            setTimeout(() => {
                loadingScreen.classList.add('hidden');
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 500);
            }, 1500);
        });
        
        // Fallback: hide after 5 seconds even if not fully loaded
        setTimeout(() => {
            if (loadingScreen && !loadingScreen.classList.contains('hidden')) {
                loadingScreen.classList.add('hidden');
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 500);
            }
        }, 5000);
    }
}

/**
 * Navigation
 */
function initNavigation() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-list a');

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function () {
            const expanded = this.getAttribute('aria-expanded') === 'true';
            this.setAttribute('aria-expanded', String(!expanded));
            navMenu.classList.toggle('open');
            
            // Animate hamburger icon
            const spans = this.querySelectorAll('span');
            if (navMenu.classList.contains('open')) {
                spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
            } else {
                spans[0].style.transform = '';
                spans[1].style.opacity = '1';
                spans[2].style.transform = '';
            }
        });
    }

    navLinks.forEach((link) => {
        link.addEventListener('click', () => {
            if (navMenu && navMenu.classList.contains('open')) {
                navMenu.classList.remove('open');
                if (navToggle) {
                    navToggle.setAttribute('aria-expanded', 'false');
                    const spans = navToggle.querySelectorAll('span');
                    spans[0].style.transform = '';
                    spans[1].style.opacity = '1';
                    spans[2].style.transform = '';
                }
            }
        });
    });

    // Header scroll effect
    const header = document.querySelector('.site-header');
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header.style.background = 'rgba(2, 6, 13, 0.95)';
                header.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
            } else {
                header.style.background = 'rgba(2, 6, 13, 0.85)';
                header.style.boxShadow = 'none';
            }
        });
    }
}

/**
 * Initialize AOS (Animate On Scroll)
 */
function initAOS() {
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            easing: 'ease-out-cubic',
            once: true,
            offset: 50
        });
    }
}

/**
 * Load Initial Data from API
 */
async function loadInitialData() {
    try {
        const data = await OP_API.loadInitialData();
        
        // Update stats
        updateStats(data);
        
        // Load featured characters
        loadFeaturedCharacters(data.characters);
        
        // Load Yonko
        loadYonko(data.yonko);
        
        // Load fruits
        loadFruits(data.fruits);
        
        // Load swords
        loadSwords(data.swords);
        
        // Load crews
        loadCrews(data.crews);
        
    } catch (error) {
        console.error('Error loading initial data:', error);
    }
}

/**
 * Update Statistics
 */
function updateStats(data) {
    const stats = {
        characters: data.characters?.length || 0,
        crews: data.crews?.length || 0,
        fruits: data.fruits?.length || 0,
        swords: data.swords?.length || 0
    };

    // Animate numbers
    Object.keys(stats).forEach(key => {
        const element = document.getElementById(`stat-${key}`);
        if (element) {
            animateNumber(element, 0, stats[key], 2000);
        }
    });
}

/**
 * Animate Number
 */
function animateNumber(element, start, end, duration) {
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= end) {
            element.textContent = end.toLocaleString();
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current).toLocaleString();
        }
    }, 16);
}

/**
 * Load Featured Characters Carousel
 */
function loadFeaturedCharacters(characters) {
    const container = document.getElementById('featured-characters');
    if (!container || !characters || characters.length === 0) return;

    // Get first 8 characters for featured carousel
    const featured = characters.slice(0, 8);
    
    featured.forEach(character => {
        const card = createCharacterCard(character);
        container.appendChild(card);
    });
}

/**
 * Create Character Card
 */
function createCharacterCard(character) {
    const slide = document.createElement('div');
    slide.className = 'swiper-slide';
    
    const card = document.createElement('div');
    card.className = 'character-card';
    card.onclick = () => openCharacterModal(character);
    
    const name = character.name || 'Unknown';
    const crew = character.crew || 'Unknown Crew';
    const reward = character.bounty || 'Unknown';
    
    // Use ImageService for reliable image loading with fallbacks
    const img = ImageService.createImageElement(character, 'character', {
        className: 'character-card-image',
        alt: name,
        loading: 'lazy'
    });
    
    const info = document.createElement('div');
    info.className = 'character-card-info';
    info.innerHTML = `
        <h3 class="character-card-name">${name}</h3>
        <p class="character-card-crew">${crew}</p>
        <div class="character-card-reward">
            <i class="fas fa-coins"></i>
            <span>${formatReward(reward)}</span>
        </div>
    `;
    
    card.appendChild(img);
    card.appendChild(info);
    slide.appendChild(card);
    return slide;
}

/**
 * Format Reward
 */
function formatReward(reward) {
    if (!reward || reward === 'Unknown') return 'Unknown';
    if (typeof reward === 'number') {
        return reward.toLocaleString();
    }
    // Remove any non-numeric characters except commas
    const numeric = reward.replace(/[^0-9,]/g, '');
    return numeric || reward;
}

/**
 * Load Yonko Section
 */
function loadYonko(yonko) {
    const container = document.getElementById('yonko-grid');
    if (!container || !yonko || yonko.length === 0) return;

    yonko.forEach(crew => {
        const card = document.createElement('div');
        card.className = 'yonko-card';
        
        const name = crew.name || 'Unknown';
        const captain = crew.captain || 'Unknown';
        
        // Use ImageService for reliable image loading
        const img = ImageService.createImageElement(crew, 'crew', {
            className: 'yonko-card-image',
            alt: name,
            loading: 'lazy'
        });
        
        const info = document.createElement('div');
        info.className = 'yonko-card-info';
        info.innerHTML = `
            <h3 class="yonko-card-name">${name}</h3>
            <p class="yonko-card-title">Yonko</p>
            <p class="yonko-card-crew">Capitão: ${captain}</p>
        `;
        
        card.appendChild(img);
        card.appendChild(info);
        container.appendChild(card);
    });
}

/**
 * Load Fruits Carousel
 */
function loadFruits(fruits) {
    const container = document.getElementById('fruits-carousel');
    if (!container || !fruits || fruits.length === 0) return;

    // Get first 8 fruits
    const featuredFruits = fruits.slice(0, 8);
    
    featuredFruits.forEach(fruit => {
        const slide = document.createElement('div');
        slide.className = 'swiper-slide';
        
        const card = document.createElement('div');
        card.className = 'fruit-card';
        card.onclick = () => openFruitModal(fruit);
        
        const name = fruit.name || 'Unknown';
        const type = fruit.type || 'Unknown';
        const user = fruit.user || 'Unknown';
        
        // Use ImageService for reliable image loading
        const img = ImageService.createImageElement(fruit, 'fruit', {
            className: 'fruit-card-image',
            alt: name,
            loading: 'lazy'
        });
        
        const info = document.createElement('div');
        info.className = 'fruit-card-info';
        info.innerHTML = `
            <h3 class="fruit-card-name">${name}</h3>
            <p class="fruit-card-type">${type}</p>
            <p class="fruit-card-user">Usuário: ${user}</p>
        `;
        
        card.appendChild(img);
        card.appendChild(info);
        slide.appendChild(card);
        container.appendChild(slide);
    });
}

/**
 * Load Swords Grid
 */
function loadSwords(swords) {
    const container = document.getElementById('swords-grid');
    if (!container || !swords || swords.length === 0) return;

    // Get first 6 swords
    const featuredSwords = swords.slice(0, 6);
    
    featuredSwords.forEach(sword => {
        const card = document.createElement('div');
        card.className = 'sword-card';
        card.onclick = () => openSwordModal(sword);
        
        const name = sword.name || 'Unknown';
        const grade = sword.grade || 'Unknown';
        const user = sword.owner || 'Unknown';
        
        // Use ImageService for reliable image loading
        const img = ImageService.createImageElement(sword, 'sword', {
            className: 'sword-card-image',
            alt: name,
            loading: 'lazy'
        });
        
        const info = document.createElement('div');
        info.className = 'sword-card-info';
        info.innerHTML = `
            <h3 class="sword-card-name">${name}</h3>
            <p class="sword-card-grade">${grade}</p>
            <p class="sword-card-user">Usuário: ${user}</p>
        `;
        
        card.appendChild(img);
        card.appendChild(info);
        container.appendChild(card);
    });
}

/**
 * Load Crews Carousel
 */
function loadCrews(crews) {
    const container = document.getElementById('crews-carousel');
    if (!container || !crews || crews.length === 0) return;

    // Get first 8 crews
    const featuredCrews = crews.slice(0, 8);
    
    featuredCrews.forEach(crew => {
        const slide = document.createElement('div');
        slide.className = 'swiper-slide';
        
        const card = document.createElement('div');
        card.className = 'crew-card';
        card.onclick = () => openCrewModal(crew);
        
        const name = crew.name || 'Unknown';
        const captain = crew.captain || 'Unknown';
        const members = crew.total || 'Unknown';
        
        // Use ImageService for reliable image loading
        const img = ImageService.createImageElement(crew, 'crew', {
            className: 'crew-card-banner',
            alt: name,
            loading: 'lazy'
        });
        
        const info = document.createElement('div');
        info.className = 'crew-card-info';
        info.innerHTML = `
            <h3 class="crew-card-name">${name}</h3>
            <p class="crew-card-captain">Capitão: ${captain}</p>
            <p class="crew-card-members">${members} membros</p>
        `;
        
        card.appendChild(img);
        card.appendChild(info);
        slide.appendChild(card);
        container.appendChild(slide);
    });
}

/**
 * Initialize Swiper Carousels
 */
function initSwiperCarousels() {
    // Featured Characters Swiper
    const featuredSwiper = document.querySelector('.featured-swiper');
    if (featuredSwiper && typeof Swiper !== 'undefined') {
        new Swiper(featuredSwiper, {
            slidesPerView: 1,
            spaceBetween: 20,
            loop: true,
            autoplay: {
                delay: 5000,
                disableOnInteraction: false
            },
            pagination: {
                el: '.featured-swiper .swiper-pagination',
                clickable: true
            },
            navigation: {
                nextEl: '.featured-swiper .swiper-button-next',
                prevEl: '.featured-swiper .swiper-button-prev'
            },
            breakpoints: {
                640: { slidesPerView: 2 },
                768: { slidesPerView: 3 },
                1024: { slidesPerView: 4 }
            }
        });
    }

    // Fruits Swiper
    const fruitsSwiper = document.querySelector('.fruits-swiper');
    if (fruitsSwiper && typeof Swiper !== 'undefined') {
        new Swiper(fruitsSwiper, {
            slidesPerView: 1,
            spaceBetween: 20,
            loop: true,
            autoplay: {
                delay: 5000,
                disableOnInteraction: false
            },
            pagination: {
                el: '.fruits-swiper .swiper-pagination',
                clickable: true
            },
            navigation: {
                nextEl: '.fruits-swiper .swiper-button-next',
                prevEl: '.fruits-swiper .swiper-button-prev'
            },
            breakpoints: {
                640: { slidesPerView: 2 },
                768: { slidesPerView: 3 },
                1024: { slidesPerView: 4 }
            }
        });
    }

    // Crews Swiper
    const crewsSwiper = document.querySelector('.crews-swiper');
    if (crewsSwiper && typeof Swiper !== 'undefined') {
        new Swiper(crewsSwiper, {
            slidesPerView: 1,
            spaceBetween: 20,
            loop: true,
            autoplay: {
                delay: 5000,
                disableOnInteraction: false
            },
            pagination: {
                el: '.crews-swiper .swiper-pagination',
                clickable: true
            },
            navigation: {
                nextEl: '.crews-swiper .swiper-button-next',
                prevEl: '.crews-swiper .swiper-button-prev'
            },
            breakpoints: {
                640: { slidesPerView: 2 },
                768: { slidesPerView: 3 },
                1024: { slidesPerView: 4 }
            }
        });
    }
}

/**
 * Modal System
 */
function initModalSystem() {
    const modalOverlay = document.getElementById('modal-overlay');
    const modalClose = document.querySelector('.modal-close');
    
    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }
    
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeModal();
            }
        });
    }
    
    // Close on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
}

function openModal(content) {
    const modalOverlay = document.getElementById('modal-overlay');
    const modalContent = document.getElementById('modal-content');
    
    if (modalOverlay && modalContent) {
        modalContent.innerHTML = content;
        modalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal() {
    const modalOverlay = document.getElementById('modal-overlay');
    
    if (modalOverlay) {
        modalOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function openCharacterModal(character) {
    const image = character.image || 'images/luffy.png';
    const name = character.name || 'Unknown';
    const crew = character.crew || 'Unknown';
    const reward = character.bounty || 'Unknown';
    const fruit = character.fruit || 'None';
    const status = character.status || 'Unknown';
    
    const content = `
        <div class="modal-character">
            <img src="${image}" alt="${name}" class="modal-character-image" onerror="this.src='images/luffy.png'">
            <div class="modal-character-info">
                <h2>${name}</h2>
                <div class="modal-details">
                    <div class="modal-detail">
                        <span class="modal-detail-label">Tripulação:</span>
                        <span class="modal-detail-value">${crew}</span>
                    </div>
                    <div class="modal-detail">
                        <span class="modal-detail-label">Recompensa:</span>
                        <span class="modal-detail-value">${formatReward(reward)}</span>
                    </div>
                    <div class="modal-detail">
                        <span class="modal-detail-label">Fruta do Diabo:</span>
                        <span class="modal-detail-value">${fruit}</span>
                    </div>
                    <div class="modal-detail">
                        <span class="modal-detail-label">Status:</span>
                        <span class="modal-detail-value">${status}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    openModal(content);
}

function openFruitModal(fruit) {
    const name = fruit.name || 'Unknown';
    const type = fruit.type || 'Unknown';
    const user = fruit.user || 'Unknown';
    const description = fruit.description || 'No description available';
    
    const content = `
        <div class="modal-fruit">
            <div class="modal-fruit-icon">
                <i class="fas fa-apple-alt" style="font-size: 5rem; color: var(--accent-primary);"></i>
            </div>
            <div class="modal-fruit-info">
                <h2>${name}</h2>
                <div class="modal-details">
                    <div class="modal-detail">
                        <span class="modal-detail-label">Tipo:</span>
                        <span class="modal-detail-value">${type}</span>
                    </div>
                    <div class="modal-detail">
                        <span class="modal-detail-label">Usuário:</span>
                        <span class="modal-detail-value">${user}</span>
                    </div>
                </div>
                <p class="modal-description">${description}</p>
            </div>
        </div>
    `;
    
    openModal(content);
}

function openSwordModal(sword) {
    const name = sword.name || 'Unknown';
    const grade = sword.grade || 'Unknown';
    const user = sword.owner || 'Unknown';
    const description = sword.description || 'No description available';
    
    const content = `
        <div class="modal-sword">
            <div class="modal-sword-icon">
                <i class="fas fa-khanda" style="font-size: 5rem; color: var(--accent-tertiary);"></i>
            </div>
            <div class="modal-sword-info">
                <h2>${name}</h2>
                <div class="modal-details">
                    <div class="modal-detail">
                        <span class="modal-detail-label">Classificação:</span>
                        <span class="modal-detail-value">${grade}</span>
                    </div>
                    <div class="modal-detail">
                        <span class="modal-detail-label">Usuário:</span>
                        <span class="modal-detail-value">${user}</span>
                    </div>
                </div>
                <p class="modal-description">${description}</p>
            </div>
        </div>
    `;
    
    openModal(content);
}

function openCrewModal(crew) {
    const name = crew.name || 'Unknown';
    const captain = crew.captain || 'Unknown';
    const members = crew.total || 'Unknown';
    const status = crew.status || 'Unknown';
    
    const content = `
        <div class="modal-crew">
            <div class="modal-crew-icon">
                <i class="fas fa-flag" style="font-size: 5rem; color: var(--accent-primary);"></i>
            </div>
            <div class="modal-crew-info">
                <h2>${name}</h2>
                <div class="modal-details">
                    <div class="modal-detail">
                        <span class="modal-detail-label">Capitão:</span>
                        <span class="modal-detail-value">${captain}</span>
                    </div>
                    <div class="modal-detail">
                        <span class="modal-detail-label">Membros:</span>
                        <span class="modal-detail-value">${members}</span>
                    </div>
                    <div class="modal-detail">
                        <span class="modal-detail-label">Status:</span>
                        <span class="modal-detail-value">${status}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    openModal(content);
}

/**
 * Scroll Animations
 */
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    // Observe all sections
    document.querySelectorAll('.section').forEach(section => {
        observer.observe(section);
    });
}

/**
 * Update Active Navigation Link
 */
function updateActiveNavLink() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-list a');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPath || 
            (currentPath.endsWith('index.html') && href === 'index.html') ||
            (currentPath === '/' && href === 'index.html')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

/**
 * Add modal styles dynamically
 */
const modalStyles = document.createElement('style');
modalStyles.textContent = `
    .modal-character,
    .modal-fruit,
    .modal-sword,
    .modal-crew {
        display: flex;
        flex-direction: column;
        gap: 2rem;
        text-align: center;
    }
    
    .modal-character-image {
        width: 100%;
        max-width: 300px;
        height: auto;
        border-radius: var(--radius-lg);
        margin: 0 auto;
    }
    
    .modal-fruit-icon,
    .modal-sword-icon,
    .modal-crew-icon {
        margin: 0 auto;
    }
    
    .modal-character-info h2,
    .modal-fruit-info h2,
    .modal-sword-info h2,
    .modal-crew-info h2 {
        font-size: 2rem;
        font-weight: 800;
        margin-bottom: 1.5rem;
        background: var(--gradient-primary);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }
    
    .modal-details {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        margin-bottom: 1.5rem;
    }
    
    .modal-detail {
        display: flex;
        justify-content: space-between;
        padding: 0.75rem 1rem;
        background: var(--surface-light);
        border-radius: var(--radius-md);
    }
    
    .modal-detail-label {
        font-weight: 600;
        color: var(--text-secondary);
    }
    
    .modal-detail-value {
        font-weight: 700;
        color: var(--text-primary);
    }
    
    .modal-description {
        color: var(--text-secondary);
        line-height: 1.8;
    }
    
    @media (min-width: 768px) {
        .modal-character {
            flex-direction: row;
            text-align: left;
        }
        
        .modal-character-image {
            margin: 0;
            max-width: 250px;
        }
    }
`;
document.head.appendChild(modalStyles);
