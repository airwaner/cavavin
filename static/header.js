// static/header.js

class NavigationHeader {
    static #instance = null;

    constructor() {
        // Si une instance existe déjà, la retourner
        if (NavigationHeader.#instance) {
            return NavigationHeader.#instance;
        }

        // Sinon, créer la nouvelle instance
        this.currentCaveId = null;
        this.initialized = false;
        NavigationHeader.#instance = this;
    }

    init() {
        // Éviter l'initialisation multiple
        if (this.initialized) {
            return;
        }

        // Nettoyer les navigations existantes
        document.querySelectorAll('.header-navigation').forEach(nav => nav.remove());

        // Récupérer l'ID de la cave
        const urlParams = new URLSearchParams(window.location.search);
        this.currentCaveId = urlParams.get('id') || urlParams.get('cave');

        // Créer le header
        this.createHeader();
        this.initialized = true;
    }

    getCurrentPage() {
        const path = window.location.pathname;
        if (path.includes('cave.html')) return 'cave';
        if (path.includes('recherche.html')) return 'recherche';
        if (path.includes('statistiques.html')) return 'statistiques';
        return 'index';
    }

    createHeader() {
        const headerContainer = document.createElement('div');
        headerContainer.className = 'header-navigation';
        
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'header-buttons';
        
        const currentPage = this.getCurrentPage();
        const buttons = this.getContextualButtons(currentPage);
        
        buttons.forEach(button => {
            const btn = document.createElement('button');
            btn.className = `btn-${button.type}`;
            btn.textContent = button.label;
            btn.onclick = button.action;
            buttonContainer.appendChild(btn);
        });

        headerContainer.appendChild(buttonContainer);
        
        const existingHeader = document.querySelector('header');
        if (existingHeader) {
            existingHeader.insertBefore(headerContainer, existingHeader.firstChild);
        }
    }

    getContextualButtons(currentPage) {
        const buttons = [];
        
        if (currentPage !== 'index') {
            buttons.push({
                label: 'Accueil',
                type: 'secondary',
                action: () => window.location.href = 'index.html'
            });
        }
        
        if (this.currentCaveId && currentPage !== 'cave') {
            buttons.push({
                label: 'Retour à la Cave',
                type: 'primary',
                action: () => window.location.href = `cave.html?id=${this.currentCaveId}`
            });
        }
        
        if (currentPage !== 'recherche') {
            buttons.push({
                label: 'Rechercher',
                type: 'primary',
                action: () => {
                    let url = 'recherche.html';
                    if (this.currentCaveId) {
                        url += `?cave=${this.currentCaveId}`;
                    }
                    window.location.href = url;
                }
            });
        }

        if (currentPage === 'cave') {
            buttons.push({
                label: 'Statistiques',
                type: 'primary',
                action: () => window.location.href = `statistiques.html?id=${this.currentCaveId}`
            });
        }
        
        return buttons;
    }
}

// Une seule initialisation au chargement de la page
window.addEventListener('DOMContentLoaded', () => {
    const header = new NavigationHeader();
    header.init();
});