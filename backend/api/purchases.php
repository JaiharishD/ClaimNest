<?php
/**
 * ClaimNest - Purchases API Endpoint
 * 
 * Handles CRUD operations for product purchases:
 * - GET: Fetch all purchases or a single purchase by ID
 * - POST: Add a new purchase (with validation & receipt upload)
 * - PUT: Update an existing purchase
 * - DELETE: Delete a purchase by ID
 * 
 * Demonstrates Unit III (PHP Server Logic, Prepared Statements, Input Validation)
 */

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';

// Helper function: Calculate remaining days between today and a target date
function calculateDaysRemaining($targetDateString) {
    $today = new DateTime('today'); // Today at 00:00:00
    $target = new DateTime($targetDateString);
    
    // Invert = 1 if target is in the past
    $interval = $today->diff($target);
    $days = (int)$interval->format('%r%a');
    return $days;
}

// Helper function: Determine deadline status based on days remaining
function getStatusFromDays($daysRemaining) {
    if ($daysRemaining < 0) {
        return 'Expired';
    } elseif ($daysRemaining <= 7) {
        return 'Expiring Soon';
    } else {
        return 'Active';
    }
}

// Helper function: Validate purchase fields
function validatePurchaseData($data) {
    $errors = [];

    // Check required string fields
    if (empty(trim($data['product_name'] ?? ''))) {
        $errors[] = 'Product name is required.';
    }
    if (empty(trim($data['category'] ?? ''))) {
        $errors[] = 'Category is required.';
    }
    if (empty(trim($data['seller_name'] ?? ''))) {
        $errors[] = 'Seller/Store name is required.';
    }

    // Check price
    if (!isset($data['purchase_price']) || !is_numeric($data['purchase_price']) || floatval($data['purchase_price']) <= 0) {
        $errors[] = 'Purchase price must be a positive number.';
    }

    // Check dates
    if (empty($data['purchase_date'])) {
        $errors[] = 'Purchase date is required.';
    }
    if (empty($data['return_deadline'])) {
        $errors[] = 'Return deadline is required.';
    }
    if (empty($data['warranty_expiry'])) {
        $errors[] = 'Warranty expiry date is required.';
    }

    // Validate date sequence: return & warranty cannot be before purchase date
    if (!empty($data['purchase_date']) && !empty($data['return_deadline'])) {
        if ($data['return_deadline'] < $data['purchase_date']) {
            $errors[] = 'Return deadline cannot be earlier than purchase date.';
        }
    }
    if (!empty($data['purchase_date']) && !empty($data['warranty_expiry'])) {
        if ($data['warranty_expiry'] < $data['purchase_date']) {
            $errors[] = 'Warranty expiry date cannot be earlier than purchase date.';
        }
    }

    return $errors;
}

// Read HTTP request method
$method = $_SERVER['REQUEST_METHOD'];

// Handle GET: Fetch purchases
if ($method === 'GET') {
    // If specific ID is requested
    if (isset($_GET['id']) && is_numeric($_GET['id'])) {
        $id = (int)$_GET['id'];
        $stmt = $pdo->prepare("SELECT * FROM purchases WHERE id = :id");
        $stmt->execute([':id' => $id]);
        $purchase = $stmt->fetch();

        if ($purchase) {
            $purchase['return_days'] = calculateDaysRemaining($purchase['return_deadline']);
            $purchase['return_status'] = getStatusFromDays($purchase['return_days']);
            $purchase['warranty_days'] = calculateDaysRemaining($purchase['warranty_expiry']);
            $purchase['warranty_status'] = getStatusFromDays($purchase['warranty_days']);

            echo json_encode(['success' => true, 'data' => $purchase]);
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Purchase not found']);
        }
        exit();
    }

    // Fetch all purchases with optional search and category filter
    $search = trim($_GET['search'] ?? '');
    $category = trim($_GET['category'] ?? '');
    $statusFilter = trim($_GET['status'] ?? '');

    $sql = "SELECT * FROM purchases WHERE 1=1";
    $params = [];

    if (!empty($search)) {
        $sql .= " AND (product_name LIKE :search OR seller_name LIKE :search)";
        $params[':search'] = '%' . $search . '%';
    }

    if (!empty($category)) {
        $sql .= " AND category = :category";
        $params[':category'] = $category;
    }

    $sql .= " ORDER BY id DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $purchases = $stmt->fetchAll();

    // Attach calculated days and status to each purchase
    $results = [];
    foreach ($purchases as $item) {
        $item['return_days'] = calculateDaysRemaining($item['return_deadline']);
        $item['return_status'] = getStatusFromDays($item['return_days']);
        $item['warranty_days'] = calculateDaysRemaining($item['warranty_expiry']);
        $item['warranty_status'] = getStatusFromDays($item['warranty_days']);

        // Optional filter by return status (Active, Expiring Soon, Expired)
        if (!empty($statusFilter)) {
            if ($item['return_status'] !== $statusFilter && $item['warranty_status'] !== $statusFilter) {
                continue;
            }
        }

        $results[] = $item;
    }

    echo json_encode(['success' => true, 'data' => $results]);
    exit();
}

// Handle POST: Add new purchase (or multipart file upload)
if ($method === 'POST') {
    // Check if client sent JSON or FormData
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    $inputData = [];

    if (strpos($contentType, 'application/json') !== false) {
        $raw = file_get_contents('php://input');
        $inputData = json_decode($raw, true) ?? [];
    } else {
        $inputData = $_POST;
    }

    // Validate inputs
    $errors = validatePurchaseData($inputData);
    if (!empty($errors)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => implode(' ', $errors)]);
        exit();
    }

    // Handle receipt file upload if present
    $receiptFilename = null;
    if (isset($_FILES['receipt']) && $_FILES['receipt']['error'] === UPLOAD_ERR_OK) {
        $file = $_FILES['receipt'];
        $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $safeExtension = strtolower($extension);
        
        $allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png'];
        if (in_array($safeExtension, $allowedExtensions)) {
            $uniqueName = 'receipt_' . time() . '_' . rand(100, 999) . '.' . $safeExtension;
            $destination = __DIR__ . '/../uploads/' . $uniqueName;
            if (move_uploaded_file($file['tmp_name'], $destination)) {
                $receiptFilename = $uniqueName;
            }
        }
    } elseif (!empty($inputData['receipt_filename'])) {
        $receiptFilename = trim($inputData['receipt_filename']);
    }

    // Insert into MySQL with Prepared Statements
    $sql = "INSERT INTO purchases 
            (product_name, category, purchase_date, purchase_price, seller_name, return_deadline, warranty_expiry, receipt_filename, notes) 
            VALUES 
            (:product_name, :category, :purchase_date, :purchase_price, :seller_name, :return_deadline, :warranty_expiry, :receipt_filename, :notes)";
    
    $stmt = $pdo->prepare($sql);
    $executed = $stmt->execute([
        ':product_name'     => trim($inputData['product_name']),
        ':category'         => trim($inputData['category']),
        ':purchase_date'    => $inputData['purchase_date'],
        ':purchase_price'   => floatval($inputData['purchase_price']),
        ':seller_name'      => trim($inputData['seller_name']),
        ':return_deadline'  => $inputData['return_deadline'],
        ':warranty_expiry'  => $inputData['warranty_expiry'],
        ':receipt_filename' => $receiptFilename,
        ':notes'            => trim($inputData['notes'] ?? '')
    ]);

    if ($executed) {
        $newId = (int)$pdo->lastInsertId();
        echo json_encode([
            'success' => true,
            'message' => 'Purchase recorded successfully!',
            'id'      => $newId
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to save purchase']);
    }
    exit();
}

// Handle PUT: Update existing purchase
if ($method === 'PUT') {
    $raw = file_get_contents('php://input');
    $inputData = json_decode($raw, true) ?? [];

    $id = isset($inputData['id']) ? (int)$inputData['id'] : (isset($_GET['id']) ? (int)$_GET['id'] : 0);

    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Valid Purchase ID is required for update.']);
        exit();
    }

    // Validate inputs
    $errors = validatePurchaseData($inputData);
    if (!empty($errors)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => implode(' ', $errors)]);
        exit();
    }

    $sql = "UPDATE purchases SET 
            product_name = :product_name,
            category = :category,
            purchase_date = :purchase_date,
            purchase_price = :purchase_price,
            seller_name = :seller_name,
            return_deadline = :return_deadline,
            warranty_expiry = :warranty_expiry,
            notes = :notes
            WHERE id = :id";
    
    $stmt = $pdo->prepare($sql);
    $executed = $stmt->execute([
        ':product_name'     => trim($inputData['product_name']),
        ':category'         => trim($inputData['category']),
        ':purchase_date'    => $inputData['purchase_date'],
        ':purchase_price'   => floatval($inputData['purchase_price']),
        ':seller_name'      => trim($inputData['seller_name']),
        ':return_deadline'  => $inputData['return_deadline'],
        ':warranty_expiry'  => $inputData['warranty_expiry'],
        ':notes'            => trim($inputData['notes'] ?? ''),
        ':id'               => $id
    ]);

    if ($executed) {
        echo json_encode(['success' => true, 'message' => 'Purchase updated successfully!']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to update purchase.']);
    }
    exit();
}

// Handle DELETE: Delete purchase
if ($method === 'DELETE') {
    $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    
    // Also check JSON body if not in query param
    if ($id <= 0) {
        $raw = file_get_contents('php://input');
        $inputData = json_decode($raw, true) ?? [];
        $id = isset($inputData['id']) ? (int)$inputData['id'] : 0;
    }

    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Valid Purchase ID required for deletion.']);
        exit();
    }

    // Find receipt file to delete if any
    $checkStmt = $pdo->prepare("SELECT receipt_filename FROM purchases WHERE id = :id");
    $checkStmt->execute([':id' => $id]);
    $existing = $checkStmt->fetch();

    if ($existing && !empty($existing['receipt_filename'])) {
        $filePath = __DIR__ . '/../uploads/' . $existing['receipt_filename'];
        if (file_exists($filePath)) {
            @unlink($filePath);
        }
    }

    // Delete purchase (Foreign key cascades to delete related claims)
    $stmt = $pdo->prepare("DELETE FROM purchases WHERE id = :id");
    $executed = $stmt->execute([':id' => $id]);

    if ($executed) {
        echo json_encode(['success' => true, 'message' => 'Purchase deleted successfully!']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to delete purchase.']);
    }
    exit();
}

// Fallback for unsupported methods
http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Method not allowed']);
