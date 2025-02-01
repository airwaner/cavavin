
document.addEventListener('DOMContentLoaded', async () => {
    // Récupérer l'ID de la cave depuis l'URL
    const urlParams = new URLSearchParams(window.location.search);
    caveId = urlParams.get('id');
    
    if (!caveId) {
        alert('ID de cave non spécifié');
        window.location.href = 'index.html';
        return;
    }

    try {
        await chargerStatistiques();
    } catch (error) {
        console.error('Erreur lors du chargement initial:', error);
    }
});

async function exporterPDF() {
    try {
        // Initialiser jsPDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        let yPosition = margin;

        // Titre du document
        doc.setFontSize(20);
        doc.text('Statistiques de la Cave à Vin', margin, yPosition);
        yPosition += 15;

        // Fonction utilitaire pour ajouter une image
        async function ajouterGraphique(element, titre) {
            if (yPosition > pageHeight - 80) {
                doc.addPage();
                yPosition = margin;
            }

            // Ajouter le titre du graphique
            doc.setFontSize(14);
            doc.text(titre, margin, yPosition);
            yPosition += 10;

            // Capture et ajout du graphique
            const canvas = await html2canvas(element);
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = pageWidth - (2 * margin);
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            doc.addImage(imgData, 'PNG', margin, yPosition, imgWidth, imgHeight);
            yPosition += imgHeight + 15;
        }

        // Capturer et ajouter chaque graphique
        const graphiques = [
            {
                element: document.querySelector('#graph-types').parentElement,
                titre: 'Répartition par type de vin'
            },
            {
                element: document.querySelector('#graph-millesimes').parentElement,
                titre: 'Distribution des millésimes'
            },
            {
                element: document.querySelector('#graph-valeurs').parentElement,
                titre: 'Valeur de la cave par type'
            }
        ];

        // Ajouter les graphiques un par un
        for (const graphique of graphiques) {
            await ajouterGraphique(graphique.element, graphique.titre);
        }

        // Ajouter les statistiques des appellations
        const statsAppellations = document.querySelector('#stats-appellations');
        if (statsAppellations && statsAppellations.querySelector('.appellations-table')) {
            if (yPosition > pageHeight - 100) {
                doc.addPage();
                yPosition = margin;
            }

            doc.setFontSize(14);
            doc.text('Statistiques des appellations', margin, yPosition);
            yPosition += 10;

            const canvas = await html2canvas(statsAppellations);
            const imgWidth = pageWidth - (2 * margin);
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            doc.addImage(canvas.toDataURL('image/png'), 'PNG', margin, yPosition, imgWidth, imgHeight);
        }

        // Ajouter la date d'export
        doc.setFontSize(10);
        const dateExport = new Date().toLocaleDateString('fr-FR');
        doc.text(`Export réalisé le ${dateExport}`, margin, pageHeight - 10);

        // Sauvegarder le PDF
        const nomCave = document.querySelector('h1').textContent;
        doc.save(`Statistiques_${nomCave.replace(/\s+/g, '_')}_${dateExport.replace(/\//g, '-')}.pdf`);

    } catch (error) {
        console.error('Erreur lors de l\'export PDF:', error);
        alert('Une erreur est survenue lors de la génération du PDF');
    }
}

function retourCave() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    window.location.href = `cave.html?id=${id}`;
}

function creerStatsAppellations(data) {
    const container = document.getElementById('stats-appellations');
    if (!container) {
        console.error('Conteneur des appellations non trouvé');
        return;
    }

    container.innerHTML = '';
    const table = document.createElement('div');
    table.className = 'appellations-table';

    if (data.length === 0) {
        container.innerHTML = '<p class="no-data">Aucune appellation enregistrée</p>';
        return;
    }

    const header = document.createElement('div');
    header.className = 'table-row header';
    header.innerHTML = `
        <div class="cell">Appellation</div>
        <div class="cell">Bouteilles</div>
        <div class="cell">Valeur</div>
        <div class="cell">Types</div>
    `;
    table.appendChild(header);

    data.forEach(appellation => {
        const row = document.createElement('div');
        row.className = 'table-row';
        const types = appellation.types_vin.split(',').map(type => {
            return `<span class="type-dot ${type}" title="${type}"></span>`;
        }).join('');
        
        row.innerHTML = `
            <div class="cell appellation">${appellation.appellation}</div>
            <div class="cell nombre">${appellation.total_bouteilles}</div>
            <div class="cell valeur">${parseFloat(appellation.valeur_totale).toLocaleString('fr-FR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })} €</div>
            <div class="cell types">${types}</div>
        `;
        table.appendChild(row);
    });

    container.appendChild(table);
}

async function chargerStatistiques() {
    try {
        const response = await fetch(`api.php?endpoint=statistiques_detaillees&cave_id=${caveId}`);
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Erreur lors du chargement des statistiques');
        }

        const stats = data.statistiques;

        if (stats.repartition_types && stats.repartition_types.length > 0) {
            creerGraphiqueTypes(stats.repartition_types);
        }
        
        if (stats.distribution_millesimes && stats.distribution_millesimes.length > 0) {
            creerGraphiqueMillesimes(stats.distribution_millesimes);
        }
        
        if (stats.repartition_types && stats.repartition_types.length > 0) {
            creerGraphiqueValeurs(stats.repartition_types);
        }

        if (stats.stats_appellations) {
            creerStatsAppellations(stats.stats_appellations);
        }
        
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors du chargement des statistiques');
    }
}

function creerGraphiqueTypes(data) {
    const canvas = document.getElementById('graph-types');
    if (!canvas) {
        console.error('Canvas types non trouvé');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    
    // Utilisation des mêmes couleurs que celles définies dans le CSS
    const couleursVin = {
        'rouge': '#8B0000',    // Rouge bordeaux pour le vin rouge
        'blanc': '#FFD700',    // Jaune doré pour le vin blanc
        'rose': '#FFB6C1',     // Rose clair pour le rosé
        'champagne': '#F4E6BE' // Beige doré pour le champagne
    };

    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: data.map(item => item.type_vin.charAt(0).toUpperCase() + item.type_vin.slice(1)), // Première lettre en majuscule
            datasets: [{
                data: data.map(item => item.nombre),
                backgroundColor: data.map(item => couleursVin[item.type_vin]),
                borderWidth: 1,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((acc, val) => acc + val, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${value} bouteille${value > 1 ? 's' : ''} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function creerGraphiqueMillesimes(data) {
    const canvas = document.getElementById('graph-millesimes');
    if (!canvas) {
        console.error('Canvas millésimes non trouvé');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(item => item.millesime),
            datasets: [{
                label: 'Nombre de bouteilles',
                data: data.map(item => item.nombre),
                backgroundColor: '#4CAF50'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 }
                }
            }
        }
    });
}

function creerGraphiqueValeurs(data) {
    const canvas = document.getElementById('graph-valeurs');
    if (!canvas) {
        console.error('Canvas valeurs non trouvé');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(item => item.type_vin),
            datasets: [{
                label: 'Valeur totale (€)',
                data: data.map(item => item.valeur_totale),
                backgroundColor: '#2196F3'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}