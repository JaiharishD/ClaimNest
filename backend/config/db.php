<?php
/**
 * ClaimNest - Database Connection Configuration
 * 
 * Unit III (PHP & MySQL Database Connectivity)
 * Uses PHP PDO (PHP Data Objects) with prepared statement capabilities.
 * Supports both standard XAMPP (empty password) and configured root passwords.
 */

$host = '127.0.0.1';
$port = '3306';
$dbname = 'claimnest_db';
$user = 'root';

// List of common passwords to try (admin for this system, empty for standard XAMPP)
$passwordsToTry = ['admin', '', 'root'];

$pdo = null;
$connected = false;
$lastError = '';

foreach ($passwordsToTry as $pass) {
    try {
        $dsn = "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4";
        $pdo = new PDO($dsn, $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]);
        $connected = true;
        break;
    } catch (PDOException $e) {
        $lastError = $e->getMessage();
    }
}

// If connection failed because database doesn't exist yet, connect to server and create it
if (!$connected && strpos($lastError, 'Unknown database') !== false) {
    foreach ($passwordsToTry as $pass) {
        try {
            $tempPdo = new PDO("mysql:host=$host;port=$port;charset=utf8mb4", $user, $pass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
            ]);
            $tempPdo->exec("CREATE DATABASE IF NOT EXISTS claimnest_db;");
            
            // Reconnect to newly created database
            $dsn = "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4";
            $pdo = new PDO($dsn, $user, $pass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false
            ]);
            $connected = true;
            break;
        } catch (PDOException $e) {
            $lastError = $e->getMessage();
        }
    }
}

if (!$connected) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed: ' . $lastError
    ]);
    exit();
}
