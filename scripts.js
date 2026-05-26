/**
 * ONE PIECE PREMIUM ENGINE
 * Enciclopédia Visual e Cinemática
 */

class OnePieceApp {
    constructor() {
        this.init();
    }

    async init() {
        this.setupCore();
        this.renderHero();
        this.loadEncyclopedia();
        this.setupModal();
    }

    setupCore() {
        if (typeof AOS !== 'undefined') AOS.init({ duration: 1000, once: true });
    }

    async renderHero() {
        const data = await OP_API.getDetail('characters', 1); 
        const luffy = Array.isArray(data) ? data[0] : data;
        
        const heroImg = document.getElementById('hero-featured-img');
        if (heroImg && luffy && (luffy.image || luffy.img)) {
            // Prioriza imagem da API, aceitando múltiplos formatos de campo
            heroImg.src = luffy.image || luffy.img;
            gsap.from(heroImg, { opacity: 0, scale: 1.2, duration: 2 });
        }
    }

    createCard(item, type) {
        const title = item.name || item.french_name;
        const badge = item.job || item.type || item.roman_name || (type === 'characters' ? 'Pirata' : 'Tesouro');
        const bounty = item.bounty ? `<span class="bounty">฿ ${item.bounty}</span>` : '';
        const imagePath = item.image || item.img || 'https://via.placeholder.com/400x600/050d1a/ffb84d?text=Ver+Imagem';
        
        const card = document.createElement('article');
        card.className = 'personagem-card reveal glass-card';
        card.innerHTML = `
            <div class="card-img-container">
                <img src="${imagePath}" 
                     alt="${title}" loading="lazy">
            </div>
            <div class="personagem-content">
                <span class="personagem-badge">${badge}</span>
                <h3 class="personagem-title">${title}</h3>
                ${bounty}
            </div>
        `;
        
        card.addEventListener('click', () => this.openDetails(item, type));
        return card;
    }

    async loadEncyclopedia() {
        const container = document.querySelector('.dynamic-grid');
        if (!container) return;

        const type = container.dataset.endpoint; // characters, fruits, swords, crews
        container.innerHTML = '<div class="loader-op">Navegando pela Grand Line...</div>';

        let data = [];
        if (type === 'characters') data = await OP_API.getCharacters();
        else if (type === 'fruits') data = await OP_API.getFruits();
        else if (type === 'swords') data = await OP_API.getSwords();
        else if (type === 'crews') data = await OP_API.getCrews();

        if (!data || data.length === 0) {
            container.innerHTML = '<p>Erro ao invocar a Buster Call (Falha na API).</p>';
            return;
        }

        // Agrupamento Dinâmico (Lógica de Enciclopédia)
        const groups = this.groupData(data, type);
        container.innerHTML = '';

        Object.entries(groups).forEach(([groupName, items]) => {
            const section = this.createSection(groupName, items, type);
            container.appendChild(section);
        });

        this.applyPostEffects();
    }

    groupData(list, type) {
        return list.reduce((acc, item) => {
            let key = "Geral";
            if (type === 'characters') key = item.crew?.name || "Independentes / Marinha";
            else if (type === 'fruits') key = item.type || "Desconhecido";
            else if (type === 'swords') key = item.grade || "Sem Classificação";
            
            if (!acc[key]) acc[key] = [];
            acc[key].push(item);
            return acc;
        }, {});
    }

    createSection(name, items, type) {
        const section = document.createElement('div');
        section.className = 'api-group-shelf';
        section.innerHTML = `
            <h2 class="shelf-title">${name} <span>(${items.length})</span></h2>
            <div class="shelf-grid"></div>
        `;
        const grid = section.querySelector('.shelf-grid');
        items.forEach(item => grid.appendChild(this.createCard(item, type)));
        return section;
    }

    openDetails(item, type) {
        const modal = document.getElementById('details-modal');
        const content = modal.querySelector('.modal-body');
        
        modal.classList.add('active');
        const imagePath = item.image || item.img || 'https://via.placeholder.com/400x600/050d1a/ffb84d?text=Sem+Imagem';
        content.innerHTML = `
            <div class="modal-premium-layout">
                <div class="modal-hero" style="background-image: url(${imagePath})">
                    <div class="modal-overlay">
                        <span class="badge">${item.type || item.job || ''}</span>
                        <h1>${item.name || item.french_name}</h1>
                    </div>
                </div>
                <div class="modal-info">
                    <div class="stats-row">
                        ${item.bounty ? `<div><strong>Recompensa:</strong> ฿ ${item.bounty}</div>` : ''}
                        ${item.status ? `<div><strong>Status:</strong> ${item.status}</div>` : ''}
                        ${item.age ? `<div><strong>Idade:</strong> ${item.age}</div>` : ''}
                    </div>
                    <p class="description">${item.description || 'Informação classificada pelo Governo Mundial.'}</p>
                </div>
            </div>
        `;
        
        gsap.from(".modal-content", { y: 100, opacity: 0, duration: 0.5 });
    }

    setupModal() {
        const modal = document.createElement('div');
        modal.id = 'details-modal';
        modal.className = 'op-modal';
        modal.innerHTML = `
            <div class="modal-content glass-card">
                <button class="close-modal">&times;</button>
                <div class="modal-body"></div>
            </div>
        `;
        document.body.appendChild(modal);
        
        modal.querySelector('.close-modal').onclick = () => modal.classList.remove('active');
        window.onclick = (e) => { if(e.target == modal) modal.classList.remove('active'); };
    }

    applyPostEffects() {
        // Vanilla Tilt para efeito 3D premium
        if (typeof VanillaTilt !== 'undefined') {
            VanillaTilt.init(document.querySelectorAll(".personagem-card"), {
                max: 15,
                speed: 400,
                glare: true,
                "max-glare": 0.3,
            });
        }
        
        // Revelação imediata e GSAP
        document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
        gsap.from(".personagem-card", { opacity: 0, y: 50, stagger: 0.05, duration: 0.8 });
    }
}

document.addEventListener('DOMContentLoaded', () => new OnePieceApp());
