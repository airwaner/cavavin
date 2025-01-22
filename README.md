# Cavavin Project : Gestionnaire de Cave à Vin

Cavavin est une application web simple et intuitive qui permet de gérer efficacement votre cave à vin. Grâce à une interface moderne et facile à prendre en main, vous pouvez suivre l'état de votre cave, organiser vos bouteilles, et consulter des statistiques détaillées.

---

## Fonctionnalités principales

- **Statistiques globales** : 
  Suivez en un coup d'œil l'occupation de votre cave, le nombre total de bouteilles, et leur valeur estimée.

- **Organisation des bouteilles** : 
  Ajoutez des bouteilles dans un "stock non rangé", puis rangez-les facilement dans des emplacements spécifiques de votre cave.

- **Statistiques par type de vin** : 
  Visualisez la répartition de vos bouteilles par type de vin (Rouge, Blanc, Rosé, Champagne) avec des indicateurs précis (nombre de cases occupées, nombre de bouteilles, valeur totale).

- **Formulaire d'ajout simplifié** : 
  Ajoutez de nouvelles bouteilles avec des détails comme le type de vin, l'année, le domaine, et bien plus encore.

---

## Aperçus de l'interface

### Vue générale

![1](https://github.com/user-attachments/assets/940f9501-a77a-4726-9367-0d5d2b203a9c)

La vue principale vous permet d'avoir une vue d'ensemble sur l'occupation de votre cave, les statistiques par type de vin, et un espace pour gérer les bouteilles non rangées.
Entièrement développé avec l'aide de Claude.ai Sonnet 3.5, car je n'ai pas les compétences pour ce genre de développement, j'ai besoin de votre aide pour mener à bien la suite et fin de ce projet !
---

### Gestion intuitive du rangement des bouteilles

![2](https://github.com/user-attachments/assets/5ae61e29-5db4-4a2b-974b-fd7075aec238)

Pour ranger une bouteille, il vous suffit de cliquer sur une bouteille dans le "stock non rangé", puis de sélectionner une case vide dans votre cave. Une interaction rapide et fluide !

---

### Formulaire d'ajout d'une bouteille


![3](https://github.com/user-attachments/assets/93fd4681-435a-4d19-bd33-684bb64514d9)

Un formulaire intuitif vous permet d'ajouter de nouvelles bouteilles avec les informations suivantes : 
- Type de vin
- Nom
- Domaine
- Appellation
- Millésime
- Prix (€)
- Quantité
- Commentaires
  
- Je pense qu'il en manque pour être plus précis sans aller dans l'excès, par exemple, les associations recommandée de repas, les apogées...
  
---

## Pré-requis techniques

- **Backend** : PHP
- **Base de données** : SQLite (pas encore) ou MariaDB
- **Frontend** : HTML, CSS, et JavaScript
- **Serveur** : Exécutable via un serveur local et une base Mariadb

---

## Installation et lancement

1. Clonez le dépôt :
   ```bash
   git clone https://github.com/votre-utilisateur/caveperso.git
   cd caveperso
   ```

2. Copier dans un dossier libre de votre serveur WEB et créez votre database :

  - Voir config.php pour les détails.
  
4. Lancez l'application :
   Ouvrez votre navigateur à l'adresse web où vous avez déposé le dossier.

---

## Fonctionnalités prévues
- Gestion des modifications sur des bouteilles déjà rentrées, actuellement il faut supprimer puis recréer.
- Ajouter des champs opportuns pour la gestion d'une cave.
- Faire en sorte que des menus déroulants pré-remplis grâce à l'historique de la base, pour éviter de retaper pour des grandes caves.
- Rendre l'application complètement déboguée
- Transférer vers une simple base SQlite au lieu d'interragir avec une Mariadb, moins de contraintes à l'installation.
- Intégration avec des API pour récupérer automatiquement les étiquettes de vin.
- Export des données en CSV pour une gestion hors ligne.
- Gestion multi-caves.

---

## Contribuer
Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request pour proposer des améliorations.



