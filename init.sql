USE cavavin;

CREATE TABLE IF NOT EXISTS caves (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    largeur INT NOT NULL,
    hauteur INT NOT NULL,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bouteilles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cave_id INT,
    position_x INT,
    position_y INT,
    type_vin VARCHAR(50) NOT NULL,
    nom VARCHAR(255) NOT NULL,
    domaine VARCHAR(255),
    appellation VARCHAR(255),
    millesime INT,
    prix DECIMAL(10,2) NOT NULL DEFAULT 0,
    quantite INT DEFAULT 1,
    date_ajout TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    commentaire TEXT,
    FOREIGN KEY (cave_id) REFERENCES caves(id),
    UNIQUE KEY unique_position (cave_id, position_x, position_y)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;