// static/config-garde.js

// Application automatique des styles au chargement
document.addEventListener('DOMContentLoaded', () => {
    CONFIG_GARDE.appliquerStyles();
});


const CONFIG_GARDE = {
    // Temps de garde par type (en années)
    durees: {
        'rouge': {
            jeunesse: { min: 0, max: 3 },
            apogee: { min: 3, max: 8 },
            maturite: { min: 8, max: 12 },
            declin: { min: 12, max: 20 }
        },
        'blanc': {
            jeunesse: { min: 0, max: 2 },
            apogee: { min: 2, max: 5 },
            maturite: { min: 5, max: 8 },
            declin: { min: 8, max: 12 }
        },
        'rose': {
            jeunesse: { min: 0, max: 1 },
            apogee: { min: 1, max: 2 },
            maturite: { min: 2, max: 3 },
            declin: { min: 3, max: 4 }
        },
        'champagne': {
            jeunesse: { min: 0, max: 2 },
            apogee: { min: 2, max: 6 },
            maturite: { min: 6, max: 10 },
            declin: { min: 10, max: 15 }
        }
    },

    // Styles visuels pour chaque état
    styles: {
        jeunesse: {
            backgroundColor: 'cyan',
            textColor: 'black',
            label: 'Jeunesse'
        },
        apogee: {
            backgroundColor: 'green',
            textColor: 'white',
            label: 'Apogée'
        },
        maturite: {
            backgroundColor: 'SpringGreen',
            textColor: 'black',
            label: 'Maturité'
        },
        declin: {
            backgroundColor: 'black',
            textColor: 'white',
            label: 'Déclin'
        }
    },

    // Multiplicateurs pour le calcul
    facteurs: {
        cepages: {
            'Cabernet Sauvignon': 1.4,
            'Merlot': 1.2,
            'default': 1.0
        },
        appellations: {
            'Bordeaux Supérieur': 1.2,
            'Saint-Émilion': 1.3,
            'default': 1.0
        },
        stockage: 1.2
    },

    // Méthode pour appliquer les styles
    // Dans config-garde.js, ajoutons une fonction pour appliquer les variables CSS
    appliquerStyles: function() {
        const styleSheet = document.createElement('style');
        styleSheet.textContent = `
            :root {
                --indicateur-jeunesse: ${this.styles.jeunesse.backgroundColor};
                --indicateur-apogee: ${this.styles.apogee.backgroundColor};
                --indicateur-maturite: ${this.styles.maturite.backgroundColor};
                --indicateur-declin: ${this.styles.declin.backgroundColor};
            }
        `;
        document.head.appendChild(styleSheet);
    }
};



