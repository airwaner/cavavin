<?php
// Définition du chemin de la base de données SQLite
define('DB_FILE', __DIR__ . '/db/cavavin.sqlite');

try {
    $pdo = new PDO("sqlite:" . DB_FILE);
    
    // Configuration importante pour SQLite
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    
    // Activation des clés étrangères pour SQLite
    $pdo->exec('PRAGMA foreign_keys = ON;');
    
    // Activation du support des timestamps
    $pdo->exec('PRAGMA journal_mode = WAL;');
    
    // Pour assurer la compatibilité avec MariaDB pour les comparaisons LIKE
    $pdo->exec('PRAGMA case_sensitive_like = OFF;');
    
} catch(PDOException $e) {
    die("Erreur de connexion à la base de données : " . $e->getMessage());
}

// Fonction utilitaire pour gérer la compatibilité des dates entre MariaDB et SQLite
function formatSqliteDate($date = null) {
    return $date ? date('Y-m-d H:i:s', strtotime($date)) : date('Y-m-d H:i:s');
}
?>