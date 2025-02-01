// Au début de chaque fichier JS principal (cave.js, recherche.js, script.js)
document.addEventListener('DOMContentLoaded', () => {
    // Initialisation du header
    new NavigationHeader();
    
    // Reste du code d'initialisation...
});


function calculerPeriodes(vin) {
    const reglesBase = CONFIG_GARDE.durees[vin.type_vin];
    if (!reglesBase) return null;

    const facteurAppellation = CONFIG_GARDE.facteurs.appellations[vin.appellation] || CONFIG_GARDE.facteurs.appellations.default;
    const facteurCepage = CONFIG_GARDE.facteurs.cepages[vin.cepage] || CONFIG_GARDE.facteurs.cepages.default;
    const facteurPrix = vin.prix >= 50 ? 1.5 : 
                       vin.prix >= 30 ? 1.3 : 
                       vin.prix >= 15 ? 1.2 : 
                       vin.prix >= 10 ? 1.1 : 1.0;

    const facteurTotal = facteurAppellation * facteurPrix * facteurCepage * CONFIG_GARDE.facteurs.stockage;


    const anneeActuelle = new Date().getFullYear();
    const age = anneeActuelle - vin.millesime;

    const periodes = {
        jeunesse: {
            debut: vin.millesime,
            fin: vin.millesime + Math.round(reglesBase.jeunesse.max * facteurTotal)
        },
        apogee: {
            debut: vin.millesime + Math.round(reglesBase.jeunesse.max * facteurTotal),
            fin: vin.millesime + Math.round(reglesBase.apogee.max * facteurTotal)
        },
        maturite: {
            debut: vin.millesime + Math.round(reglesBase.apogee.max * facteurTotal),
            fin: vin.millesime + Math.round(reglesBase.maturite.max * facteurTotal)
        },
        declin: {
            debut: vin.millesime + Math.round(reglesBase.maturite.max * facteurTotal),
            fin: vin.millesime + Math.round(reglesBase.declin.max * facteurTotal)
        }
    };

    let etatActuel = age <= periodes.jeunesse.fin - vin.millesime ? 'jeunesse' :
                     age <= periodes.apogee.fin - vin.millesime ? 'apogee' :
                     age <= periodes.maturite.fin - vin.millesime ? 'maturite' : 'declin';

    return { periodes, etatActuel, age };
}
