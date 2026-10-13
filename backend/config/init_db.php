<?php
/**
 * ClaimNest - One-Click Database Initializer
 * 
 * Runs database.sql to create tables and seed realistic sample data.
 * Can be run from terminal via PHP CLI or through browser/curl.
 */

require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/db.php';

$sqlFile = __DIR__ . '/../database.sql';

if (!file_exists($sqlFile)) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'database.sql file not found']);
    exit();
}

try {
    $sqlContent = file_get_contents($sqlFile);
    
    // Split into individual SQL statements by semicolon
    // PDO exec handles multiple statements when separated or we can run exec
    $pdo->exec($sqlContent);

    echo json_encode([
        'success' => true,
        'message' => 'ClaimNest database tables and sample records initialized successfully!'
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error initializing database: ' . $e->getMessage()
    ]);
}
