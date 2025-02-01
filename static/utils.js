// static/utils.js
const Utils = {
    buildCaveUrl: function(caveId) {
        return `cave.html?id=${caveId}`;
    },

    buildSearchUrl: function(caveId) {
        return `recherche.html?cave=${caveId}`;
    }
};

const URLManager = {
    getCaveId: function() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('cave') || urlParams.get('id');
    },

    buildCaveUrl: function(caveId) {
        return `cave.html?id=${caveId}`;
    },

    buildSearchUrl: function(caveId) {
        return `recherche.html?cave=${caveId}`;
    },

    buildStatistiquesUrl: function(caveId) {
        return `statistiques.html?id=${caveId}`;
    }
};