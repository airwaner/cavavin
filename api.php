<?php
// Configuration des erreurs et du type de contenu
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
header('Content-Type: application/json');

// Inclusion de la configuration
require_once 'config.php';

// Log de débogage
error_log("Requête reçue : " . $_SERVER['REQUEST_METHOD'] . " " . $_SERVER['REQUEST_URI']);

// Récupération de la méthode et de l'endpoint
$method = $_SERVER['REQUEST_METHOD'];
$endpoint = isset($_GET['endpoint']) ? $_GET['endpoint'] : '';
error_log("Endpoint appelé : " . $endpoint);

try {
    switch($method) {
        case 'GET':
            switch($endpoint) {
                case 'caves_existantes':
                    $stmt = $pdo->query('SELECT id, nom FROM caves ORDER BY nom');
                    $caves = $stmt->fetchAll();
                    error_log("Caves trouvées : " . print_r($caves, true));
                    echo json_encode(['success' => true, 'caves' => $caves]);
                    break;

                case 'search_bouteilles':
                    $params = [];
                    $conditions = [];
                    
                    if (!empty($_GET['search'])) {
                        $conditions[] = "b.nom LIKE ?";
                        $params[] = "%" . $_GET['search'] . "%";
                    }
                    
                    if (!empty($_GET['type'])) {
                        $conditions[] = "b.type_vin = ?";
                        $params[] = $_GET['type'];
                    }
                    
                    if (!empty($_GET['prix_min'])) {
                        $conditions[] = "b.prix >= ?";
                        $params[] = floatval($_GET['prix_min']);
                    }
                    
                    if (!empty($_GET['prix_max'])) {
                        $conditions[] = "b.prix <= ?";
                        $params[] = floatval($_GET['prix_max']);
                    }
                    
                    if (!empty($_GET['millesime_min'])) {
                        $conditions[] = "b.millesime >= ?";
                        $params[] = intval($_GET['millesime_min']);
                    }
                    
                    if (!empty($_GET['millesime_max'])) {
                        $conditions[] = "b.millesime <= ?";
                        $params[] = intval($_GET['millesime_max']);
                    }
                    
                    if (!empty($_GET['cave_id'])) {
                        $conditions[] = "b.cave_id = ?";
                        $params[] = intval($_GET['cave_id']);
                    }
                    
                    $sql = "SELECT b.*, c.nom as cave_nom 
                            FROM bouteilles b 
                            LEFT JOIN caves c ON b.cave_id = c.id";
                    
                    if (!empty($conditions)) {
                        $sql .= " WHERE " . implode(" AND ", $conditions);
                    }
                    
                    // Gestion du tri
                    $tri = $_GET['tri'] ?? 'nom';
                    switch($tri) {
                        case 'prix-asc':
                            $sql .= " ORDER BY b.prix ASC";
                            break;
                        case 'prix-desc':
                            $sql .= " ORDER BY b.prix DESC";
                            break;
                        case 'millesime-desc':
                            $sql .= " ORDER BY b.millesime DESC";
                            break;
                        case 'millesime-asc':
                            $sql .= " ORDER BY b.millesime ASC";
                            break;
                        default:
                            $sql .= " ORDER BY b.nom ASC";
                    }
                    
                    try {
                        $stmt = $pdo->prepare($sql);
                        $stmt->execute($params);
                        $bouteilles = $stmt->fetchAll();
                        echo json_encode([
                            'success' => true,
                            'bouteilles' => $bouteilles
                        ]);
                    } catch (Exception $e) {
                        echo json_encode([
                            'success' => false,
                            'error' => $e->getMessage()
                        ]);
                    }
                    break;

                case 'get_suggestions':
                    $field = isset($_GET['field']) ? $_GET['field'] : '';
                    $allowed_fields = ['nom', 'domaine', 'appellation'];
                    
                    if (!in_array($field, $allowed_fields)) {
                        throw new Exception('Champ non autorisé');
                    }
                    
                    $stmt = $pdo->prepare("
                        SELECT DISTINCT $field 
                        FROM bouteilles 
                        WHERE $field IS NOT NULL 
                        AND $field != '' 
                        ORDER BY $field ASC
                    ");
                    $stmt->execute();
                    $suggestions = $stmt->fetchAll(PDO::FETCH_COLUMN);
                    
                    echo json_encode([
                        'success' => true,
                        'suggestions' => $suggestions
                    ]);
                    break;

                case 'get_cave':
                    $cave_id = isset($_GET['cave_id']) ? intval($_GET['cave_id']) : 0;
                    if ($cave_id <= 0) {
                        throw new Exception('ID de cave invalide');
                    }
                    $stmt = $pdo->prepare('SELECT * FROM caves WHERE id = ?');
                    $stmt->execute([$cave_id]);
                    $cave = $stmt->fetch();
                    
                    if (!$cave) {
                        throw new Exception('Cave non trouvée');
                    }
                    
                    echo json_encode([
                        'success' => true,
                        'cave' => $cave
                    ]);
                    break;

                case 'get_bouteilles':
                    $cave_id = isset($_GET['cave_id']) ? intval($_GET['cave_id']) : 0;
                    if ($cave_id <= 0) {
                        throw new Exception('ID de cave invalide');
                    }
                    $stmt = $pdo->prepare('SELECT * FROM bouteilles WHERE cave_id = ?');
                    $stmt->execute([$cave_id]);
                    $bouteilles = $stmt->fetchAll();
                    echo json_encode([
                        'success' => true,
                        'bouteilles' => $bouteilles
                    ]);
                    break;

                case 'stats':
                    $cave_id = isset($_GET['cave_id']) ? intval($_GET['cave_id']) : 0;
                    if ($cave_id <= 0) {
                        throw new Exception('ID de cave invalide');
                    }

                    // Récupérer les dimensions de la cave
                    $stmt = $pdo->prepare('SELECT largeur, hauteur FROM caves WHERE id = ?');
                    $stmt->execute([$cave_id]);
                    $cave = $stmt->fetch();
                    $total_cases = $cave['largeur'] * $cave['hauteur'];

                    // Statistiques par type de vin
                    $stmt = $pdo->prepare('
                        SELECT 
                            type_vin,
                            COUNT(*) as nombre,
                            SUM(quantite) as total_bouteilles,
                            SUM(prix * quantite) as valeur_totale
                        FROM bouteilles 
                        WHERE cave_id = ?
                        GROUP BY type_vin
                    ');
                    $stmt->execute([$cave_id]);
                    $stats_par_type = $stmt->fetchAll();

                    $stats = [
                        'total_cases' => $total_cases,
                        'bouteilles_par_type' => [],
                        'total_bouteilles' => 0,
                        'valeur_totale' => 0
                    ];

                    foreach ($stats_par_type as $stat) {
                        $stats['bouteilles_par_type'][$stat['type_vin']] = [
                            'nombre' => intval($stat['nombre']),
                            'total_bouteilles' => intval($stat['total_bouteilles']),
                            'valeur_totale' => floatval($stat['valeur_totale'])
                        ];
                        $stats['total_bouteilles'] += intval($stat['total_bouteilles']);
                        $stats['valeur_totale'] += floatval($stat['valeur_totale']);
                    }

                    echo json_encode([
                        'success' => true,
                        'stats' => $stats
                    ]);
                    break;

                default:
                    echo json_encode([
                        'success' => false, 
                        'error' => 'Endpoint inconnu'
                    ]);
            }
            break;

        case 'POST':
            $input = file_get_contents('php://input');
            error_log("Données POST reçues : " . $input);
            $data = json_decode($input, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                error_log("Erreur de parsing JSON : " . json_last_error_msg());
                echo json_encode([
                    'success' => false, 
                    'error' => 'Invalid JSON data'
                ]);
                break;
            }

            switch($endpoint) {
                case 'creer_cave':
                    if (!isset($data['nom']) || !isset($data['largeur']) || !isset($data['hauteur'])) {
                        error_log("Données manquantes pour la création de cave");
                        echo json_encode([
                            'success' => false, 
                            'error' => 'Données manquantes'
                        ]);
                        break;
                    }

                    try {
                        $stmt = $pdo->prepare('
                            INSERT INTO caves (nom, largeur, hauteur)
                            VALUES (?, ?, ?)
                        ');
                        $stmt->execute([
                            $data['nom'],
                            $data['largeur'],
                            $data['hauteur']
                        ]);
                        
                        $cave_id = $pdo->lastInsertId();
                        error_log("Cave créée avec succès, ID : " . $cave_id);
                        
                        echo json_encode([
                            'success' => true,
                            'cave_id' => $cave_id
                        ]);
                    } catch (PDOException $e) {
                        error_log("Erreur PDO lors de la création de la cave : " . $e->getMessage());
                        throw $e;
                    }
                    break;

                case 'supprimer_cave':
                    $pdo->beginTransaction();
                    try {
                        // D'abord supprimer toutes les bouteilles de la cave
                        $stmt = $pdo->prepare('DELETE FROM bouteilles WHERE cave_id = ?');
                        $stmt->execute([$data['cave_id']]);
                        
                        // Ensuite supprimer la cave
                        $stmt = $pdo->prepare('DELETE FROM caves WHERE id = ?');
                        $stmt->execute([$data['cave_id']]);
                        
                        $pdo->commit();
                        echo json_encode(['success' => true]);
                    } catch (Exception $e) {
                        $pdo->rollBack();
                        throw $e;
                    }
                    break;

                case 'ajouter_bouteille':
                    $pdo->beginTransaction();
                    try {
                        if (isset($data['position_x']) && isset($data['position_y'])) {
                            // Ajouter une bouteille à une position
                            $stmt = $pdo->prepare('
                                INSERT INTO bouteilles (
                                    cave_id, position_x, position_y, type_vin, nom,
                                    domaine, appellation, millesime, prix, quantite, commentaire
                                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
                            ');
                            $stmt->execute([
                                $data['cave_id'], 
                                $data['position_x'], 
                                $data['position_y'],
                                $data['type_vin'], 
                                $data['nom'], 
                                $data['domaine'],
                                $data['appellation'], 
                                $data['millesime'], 
                                $data['prix'],
                                $data['commentaire']
                            ]);

                            // Si quantité > 1, ajouter le reste en stock
                            if ($data['quantite'] > 1) {
                                $stmt = $pdo->prepare('
                                    INSERT INTO bouteilles (
                                        cave_id, type_vin, nom, domaine, appellation,
                                        millesime, prix, quantite, commentaire
                                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                                ');
                                $stmt->execute([
                                    $data['cave_id'], 
                                    $data['type_vin'], 
                                    $data['nom'],
                                    $data['domaine'], 
                                    $data['appellation'], 
                                    $data['millesime'],
                                    $data['prix'], 
                                    $data['quantite'] - 1, 
                                    $data['commentaire']
                                ]);
                            }
                        } else {
                            // Ajouter au stock
                            $stmt = $pdo->prepare('
                                INSERT INTO bouteilles (
                                    cave_id, type_vin, nom, domaine, appellation,
                                    millesime, prix, quantite, commentaire
                                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                            ');
                            $stmt->execute([
                                $data['cave_id'], 
                                $data['type_vin'], 
                                $data['nom'],
                                $data['domaine'], 
                                $data['appellation'], 
                                $data['millesime'],
                                $data['prix'], 
                                $data['quantite'], 
                                $data['commentaire']
                            ]);
                        }
                        $pdo->commit();
                        echo json_encode([
                            'success' => true,
                            'bouteille_id' => $pdo->lastInsertId()
                        ]);
						
						} catch (Exception $e) {
                        $pdo->rollBack();
                        throw $e;
                    }
                    break;
					
						case 'modifier_bouteille':
                        $pdo->beginTransaction();
                        try {
                            $stmt = $pdo->prepare('
                                UPDATE bouteilles 
                                SET type_vin = ?, 
                                    nom = ?,
                                    domaine = ?,
                                    appellation = ?,
                                    millesime = ?,
                                    prix = ?,
                                    quantite = ?,
                                    commentaire = ?
                                WHERE id = ? AND cave_id = ?
                            ');
                            
                            $stmt->execute([
                                $data['type_vin'],
                                $data['nom'],
                                $data['domaine'],
                                $data['appellation'],
                                $data['millesime'],
                                $data['prix'],
                                $data['quantite'],
                                $data['commentaire'],
                                $data['id'],
                                $data['cave_id']
                            ]);

                            $pdo->commit();
                            echo json_encode(['success' => true]);
                        } catch (Exception $e) {
                            $pdo->rollBack();
                            throw $e;
                        }
                        break;

                    case 'ranger_bouteille':
                        $pdo->beginTransaction();
                        try {
                            // Vérifier si la position est libre
                            $stmt = $pdo->prepare('
                                SELECT id FROM bouteilles 
                                WHERE cave_id = ? AND position_x = ? AND position_y = ?
                            ');
                            $stmt->execute([
                                $data['cave_id'], 
                                $data['position_x'], 
                                $data['position_y']
                            ]);
                            
                            if (!$stmt->fetch()) {
                                // Récupérer les infos de la bouteille en stock
                                $stmt = $pdo->prepare('SELECT * FROM bouteilles WHERE id = ?');
                                $stmt->execute([$data['bouteille_id']]);
                                $bouteille = $stmt->fetch();

                                // Créer une nouvelle entrée pour la bouteille rangée
                                $stmt = $pdo->prepare('
                                    INSERT INTO bouteilles (
                                        cave_id, position_x, position_y, type_vin, nom,
                                        domaine, appellation, millesime, prix, quantite, commentaire
                                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
                                ');
                                $stmt->execute([
                                    $data['cave_id'], 
                                    $data['position_x'], 
                                    $data['position_y'],
                                    $bouteille['type_vin'], 
                                    $bouteille['nom'],
                                    $bouteille['domaine'], 
                                    $bouteille['appellation'],
                                    $bouteille['millesime'], 
                                    $bouteille['prix'],
                                    $bouteille['commentaire']
                                ]);

                                // Mettre à jour ou supprimer l'entrée du stock
                                if ($bouteille['quantite'] > 1) {
                                    $stmt = $pdo->prepare('
                                        UPDATE bouteilles 
                                        SET quantite = quantite - 1 
                                        WHERE id = ?
                                    ');
                                    $stmt->execute([$data['bouteille_id']]);
                                } else {
                                    $stmt = $pdo->prepare('
                                        DELETE FROM bouteilles 
                                        WHERE id = ?
                                    ');
                                    $stmt->execute([$data['bouteille_id']]);
                                }

                                $pdo->commit();
                                echo json_encode(['success' => true]);
                            } else {
                                $pdo->rollBack();
                                echo json_encode([
                                    'success' => false, 
                                    'error' => 'Position occupée'
                                ]);
                            }
                        } catch (Exception $e) {
                            $pdo->rollBack();
                            throw $e;
                        }
                        break;

                    case 'retirer_bouteille':
                        try {
                            $stmt = $pdo->prepare('
                                DELETE FROM bouteilles 
                                WHERE cave_id = ? AND position_x = ? AND position_y = ?
                            ');
                            $stmt->execute([
                                $data['cave_id'], 
                                $data['position_x'], 
                                $data['position_y']
                            ]);
                            echo json_encode(['success' => true]);
                        } catch (Exception $e) {
                            throw $e;
                        }
                        break;

                    default:
                        echo json_encode([
                            'success' => false, 
                            'error' => 'Endpoint inconnu'
                        ]);
                }
                break;

            default:
                echo json_encode([
                    'success' => false, 
                    'error' => 'Méthode HTTP non supportée'
                ]);
        }
    } catch (Exception $e) {
        error_log("Erreur générale : " . $e->getMessage());
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ]);
    }

// S'assurer qu'il n'y a pas de sortie après le JSON
exit();
?>