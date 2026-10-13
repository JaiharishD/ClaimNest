<?php
/**
 * ClaimNest - CORS and JSON Header Helper
 * 
 * Allows cross-origin requests from the React frontend running on Vite (localhost:5173).
 * Responds to browser pre-flight OPTIONS requests.
 */

// Allow requests from any origin (or React development server)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

// Handle HTTP preflight OPTIONS request
if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
