<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once 'config.php';

try {
    $stmt = $pdo->query('SELECT 1');
    echo "Connexion à la base de données réussie!";
    
    $stmt = $pdo->query('SHOW TABLES');
    echo "\nTables dans la base:\n";
    while($row = $stmt->fetch()) {
        print_r($row);
    }
} catch(Exception $e) {
    echo "Erreur: " . $e->getMessage();
}
?>