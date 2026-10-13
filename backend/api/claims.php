<?php
/**
 * ClaimNest - Claims API Endpoint
 * 
 * Manages warranty claims, replacements, and return requests:
 * - GET: Fetch all claims (joined with product info) or a single claim
 * - POST: Create a new claim for a purchase
 * - PUT: Update claim status or details
 * - DELETE: Delete a claim
 * 
 * Demonstrates Unit III (PHP Server Logic, Prepared Statements, Relational Data)
 */

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

// Helper function: Validate claim input
function validateClaimData($data) {
    $errors = [];

    if (empty($data['purchase_id']) || !is_numeric($data['purchase_id'])) {
        $errors[] = 'Please select a valid purchase for this claim.';
    }

    $validTypes = ['Return', 'Replacement', 'Repair'];
    if (empty($data['request_type']) || !in_array($data['request_type'], $validTypes)) {
        $errors[] = 'Request type must be Return, Replacement, or Repair.';
    }

    if (empty(trim($data['problem_description'] ?? ''))) {
        $errors[] = 'Problem description is required.';
    } elseif (strlen(trim($data['problem_description'])) < 5) {
        $errors[] = 'Problem description must be at least 5 characters.';
    }

    if (empty($data['request_date'])) {
        $errors[] = 'Request date is required.';
    }

    return $errors;
}

// Handle GET: Fetch claims
if ($method === 'GET') {
    // If specific ID is requested
    if (isset($_GET['id']) && is_numeric($_GET['id'])) {
        $id = (int)$_GET['id'];
        $sql = "SELECT c.*, p.product_name, p.category, p.seller_name, p.purchase_date, p.return_deadline, p.warranty_expiry, p.receipt_filename
                FROM claims c
                JOIN purchases p ON c.purchase_id = p.id
                WHERE c.id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':id' => $id]);
        $claim = $stmt->fetch();

        if ($claim) {
            echo json_encode(['success' => true, 'data' => $claim]);
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Claim not found']);
        }
        exit();
    }

    // Filter by purchase_id if provided
    $purchaseId = isset($_GET['purchase_id']) ? (int)$_GET['purchase_id'] : 0;
    $statusFilter = trim($_GET['status'] ?? '');

    $sql = "SELECT c.*, p.product_name, p.category, p.seller_name, p.purchase_date, p.return_deadline, p.warranty_expiry, p.receipt_filename
            FROM claims c
            JOIN purchases p ON c.purchase_id = p.id
            WHERE 1=1";
    $params = [];

    if ($purchaseId > 0) {
        $sql .= " AND c.purchase_id = :purchase_id";
        $params[':purchase_id'] = $purchaseId;
    }

    if (!empty($statusFilter)) {
        $sql .= " AND c.claim_status = :claim_status";
        $params[':claim_status'] = $statusFilter;
    }

    $sql .= " ORDER BY c.id DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $claims = $stmt->fetchAll();

    echo json_encode(['success' => true, 'data' => $claims]);
    exit();
}

// Handle POST: Create new claim
if ($method === 'POST') {
    $raw = file_get_contents('php://input');
    $inputData = json_decode($raw, true) ?? [];

    $errors = validateClaimData($inputData);
    if (!empty($errors)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => implode(' ', $errors)]);
        exit();
    }

    $purchaseId = (int)$inputData['purchase_id'];

    // Verify that purchase exists
    $checkStmt = $pdo->prepare("SELECT id, product_name, return_deadline, warranty_expiry, receipt_filename FROM purchases WHERE id = :id");
    $checkStmt->execute([':id' => $purchaseId]);
    $purchase = $checkStmt->fetch();

    if (!$purchase) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Selected purchase does not exist.']);
        exit();
    }

    // Default status is 'Pending' unless specified
    $validStatuses = ['Pending', 'Submitted', 'In Progress', 'Resolved', 'Rejected'];
    $status = !empty($inputData['claim_status']) && in_array($inputData['claim_status'], $validStatuses) 
              ? $inputData['claim_status'] 
              : 'Pending';

    $sql = "INSERT INTO claims 
            (purchase_id, request_type, problem_description, request_date, evidence_notes, claim_status) 
            VALUES 
            (:purchase_id, :request_type, :problem_description, :request_date, :evidence_notes, :claim_status)";
    
    $stmt = $pdo->prepare($sql);
    $executed = $stmt->execute([
        ':purchase_id'          => $purchaseId,
        ':request_type'         => $inputData['request_type'],
        ':problem_description'  => trim($inputData['problem_description']),
        ':request_date'         => $inputData['request_date'],
        ':evidence_notes'       => trim($inputData['evidence_notes'] ?? ''),
        ':claim_status'         => $status
    ]);

    if ($executed) {
        $newId = (int)$pdo->lastInsertId();
        echo json_encode([
            'success' => true,
            'message' => 'Claim request recorded successfully!',
            'id'      => $newId
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to create claim.']);
    }
    exit();
}

// Handle PUT: Update claim (e.g. status transition)
if ($method === 'PUT') {
    $raw = file_get_contents('php://input');
    $inputData = json_decode($raw, true) ?? [];

    $id = isset($inputData['id']) ? (int)$inputData['id'] : (isset($_GET['id']) ? (int)$_GET['id'] : 0);

    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Valid Claim ID is required for update.']);
        exit();
    }

    $validStatuses = ['Pending', 'Submitted', 'In Progress', 'Resolved', 'Rejected'];
    $status = trim($inputData['claim_status'] ?? '');

    if (!empty($status) && !in_array($status, $validStatuses)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid claim status provided.']);
        exit();
    }

    // Build dynamic update depending on whether only status or full details are sent
    if (!empty($inputData['problem_description'])) {
        $sql = "UPDATE claims SET 
                request_type = :request_type,
                problem_description = :problem_description,
                evidence_notes = :evidence_notes,
                claim_status = :claim_status
                WHERE id = :id";
        $params = [
            ':request_type'        => $inputData['request_type'],
            ':problem_description' => trim($inputData['problem_description']),
            ':evidence_notes'      => trim($inputData['evidence_notes'] ?? ''),
            ':claim_status'        => $status,
            ':id'                  => $id
        ];
    } else {
        // Quick status update
        $sql = "UPDATE claims SET claim_status = :claim_status WHERE id = :id";
        $params = [
            ':claim_status' => $status,
            ':id'           => $id
        ];
    }

    $stmt = $pdo->prepare($sql);
    $executed = $stmt->execute($params);

    if ($executed) {
        echo json_encode(['success' => true, 'message' => 'Claim updated successfully!']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to update claim.']);
    }
    exit();
}

// Handle DELETE: Delete a claim
if ($method === 'DELETE') {
    $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    if ($id <= 0) {
        $raw = file_get_contents('php://input');
        $inputData = json_decode($raw, true) ?? [];
        $id = isset($inputData['id']) ? (int)$inputData['id'] : 0;
    }

    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Valid Claim ID required for deletion.']);
        exit();
    }

    $stmt = $pdo->prepare("DELETE FROM claims WHERE id = :id");
    $executed = $stmt->execute([':id' => $id]);

    if ($executed) {
        echo json_encode(['success' => true, 'message' => 'Claim deleted successfully!']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to delete claim.']);
    }
    exit();
}

http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Method not allowed']);
