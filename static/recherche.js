let bouteilles = [];
let caves = new Map();

// Chargement initial
document.addEventListener('DOMContentLoaded', async () => {
    await chargerCaves();
    
    // Vérifier si une cave est présélectionnée dans l'URL
    const urlParams = new URLSearchParams(window.location.search);
    const cavePreselection = urlParams.get('cave');
    if (cavePreselection) {
        document.getElementById('cave').value = cavePreselection;
    }
    
    await chargerToutesLesBouteilles();
    attacherEcouteurs();
});

async function chargerCaves() {
    try {
        const response = await fetch('api.php?endpoint=caves_existantes');
        const data = await response.json();
        const select = document.getElementById('cave');
        
        data.caves.forEach(cave => {
            caves.set(cave.id.toString(), cave);
            const option = document.createElement('option');
            option.value = cave.id;
            option.textContent = cave.nom;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Erreur lors du chargement des caves:', error);
    }
}

async function chargerToutesLesBouteilles() {
    bouteilles = [];
    for (const [caveId, cave] of caves) {
        try {
            const response = await fetch(`api.php?endpoint=get_bouteilles&cave_id=${caveId}`);
            const data = await response.json();
            if (data.success) {
                data.bouteilles.forEach(bouteille => {
                    bouteille.cave_nom = cave.nom;
                    bouteille.cave_id = caveId;
                });
                bouteilles = bouteilles.concat(data.bouteilles);
            }
        } catch (error) {
            console.error(`Erreur lors du chargement des bouteilles de la cave ${caveId}:`, error);
        }
    }
    filtrerEtAfficher();
}

function attacherEcouteurs() {
    // Écouteurs pour tous les champs de filtrage
    const champs = ['search', 'type-vin', 'prix-min', 'prix-max', 'millesime-min', 
                   'millesime-max', 'cave', 'tri'];
    champs.forEach(id => {
        document.getElementById(id).addEventListener('change', filtrerEtAfficher);
        if (id === 'search') {
            document.getElementById(id).addEventListener('keyup', filtrerEtAfficher);
        }
    });
}

function filtrerEtAfficher() {
    const recherche = document.getElementById('search').value.toLowerCase();
    const typeVin = document.getElementById('type-vin').value;
    const prixMin = document.getElementById('prix-min').value;
    const prixMax = document.getElementById('prix-max').value;
    const millesimeMin = document.getElementById('millesime-min').value;
    const millesimeMax = document.getElementById('millesime-max').value;
    const caveSelectionnee = document.getElementById('cave').value;
    const tri = document.getElementById('tri').value;

    let resultats = bouteilles.filter(bouteille => {
        if (recherche && !bouteille.nom.toLowerCase().includes(recherche)) return false;
        if (typeVin && bouteille.type_vin !== typeVin) return false;
        if (prixMin && bouteille.prix < parseFloat(prixMin)) return false;
        if (prixMax && bouteille.prix > parseFloat(prixMax)) return false;
        if (millesimeMin && bouteille.millesime < parseInt(millesimeMin)) return false;
        if (millesimeMax && bouteille.millesime > parseInt(millesimeMax)) return false;
        if (caveSelectionnee && bouteille.cave_id !== caveSelectionnee) return false;
        return true;
    });

    // Tri des résultats
    resultats.sort((a, b) => {
        switch(tri) {
            case 'prix-asc':
                return a.prix - b.prix;
            case 'prix-desc':
                return b.prix - a.prix;
            case 'millesime-desc':
                return b.millesime - a.millesime;
            case 'millesime-asc':
                return a.millesime - b.millesime;
            default: // 'nom'
                return a.nom.localeCompare(b.nom);
        }
    });

    afficherResultats(resultats);
}

function afficherResultats(resultats) {
    const container = document.getElementById('resultats-list');
    const countContainer = document.getElementById('resultats-count');
    
    // Afficher le nombre de résultats
    countContainer.textContent = `${resultats.length} bouteille(s) trouvée(s)`;
    
    // Vider le conteneur
    container.innerHTML = '';
    
    // Afficher chaque résultat
    resultats.forEach(bouteille => {
        const element = document.createElement('div');
        element.className = 'resultat-item';
        
        const infosPrimaires = document.createElement('div');
        infosPrimaires.className = 'info-primaire';
        
        const infosSecondaires = document.createElement('div');
        infosSecondaires.className = 'info-secondaire';
        
        // Construction du HTML pour chaque bouteille
        infosPrimaires.innerHTML = `
            <h3>${bouteille.nom}
                <span class="badge ${bouteille.type_vin}">${bouteille.type_vin}</span>
            </h3>
            <p>
                ${bouteille.domaine ? `Domaine: ${bouteille.domaine}<br>` : ''}
                ${bouteille.appellation ? `Appellation: ${bouteille.appellation}<br>` : ''}
                Cave: <a href="cave.html?id=${bouteille.cave_id}" class="cave-link">${bouteille.cave_nom}</a>
            </p>
        `;
        
        infosSecondaires.innerHTML = `
            <p>
                ${bouteille.millesime ? `Millésime: ${bouteille.millesime}<br>` : ''}
                Prix: ${bouteille.prix.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €<br>
                Quantité: ${bouteille.quantite}
            </p>
        `;
        
        element.appendChild(infosPrimaires);
        element.appendChild(infosSecondaires);
        container.appendChild(element);
    });
}