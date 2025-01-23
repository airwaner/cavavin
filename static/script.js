// Charger les caves existantes au chargement de la page
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('api.php?endpoint=caves_existantes');
        const data = await response.json();
        const select = document.getElementById('caves-existantes');
        
        if (data.caves) {
            data.caves.forEach(cave => {
                const option = document.createElement('option');
                option.value = cave.id;
                option.textContent = cave.nom;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Erreur lors du chargement des caves:', error);
    }
});

// Fonction pour ouvrir une cave existante
function ouvrirCave() {
    const select = document.getElementById('caves-existantes');
    const caveId = select.value;
    if (caveId) {
        window.location.href = `cave.html?id=${caveId}`;
    } else {
        alert('Veuillez sélectionner une cave');
    }
}

// Gestion du formulaire de création
document.getElementById('creation-cave').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const data = {
        nom: document.getElementById('nom').value,
        largeur: parseInt(document.getElementById('largeur').value),
        hauteur: parseInt(document.getElementById('hauteur').value)
    };
    
    try {
        const response = await fetch('api.php?endpoint=creer_cave', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        if (result.success) {
            window.location.href = `cave.html?id=${result.cave_id}`;
        } else {
            alert('Erreur: ' + result.error);
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Une erreur est survenue lors de la création de la cave');
    }
});