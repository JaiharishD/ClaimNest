<?php
/**
 * ClaimNest - Reports & Analytics API
 * 
 * Provides structured aggregations for the Reports page:
 * - Purchases grouped by category (count and total amount)
 * - Upcoming return deadlines (within next 7 days)
 * - Expired warranties list
 * - Claims grouped by status
 * 
 * Demonstrates Unit III (GROUP BY queries, PHP Data Processing)
 */

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';

function calculateDaysRemaining($targetDateString) {
    $today = new DateTime('today');
    $target = new DateTime($targetDateString);
    $interval = $today->diff($target);
    return (int)$interval->format('%r%a');
}

try {
    // 1. Grouped by Category
    $catStmt = $pdo->query("SELECT category, COUNT(*) as count, SUM(purchase_price) as total_spent 
                            FROM purchases 
                            GROUP BY category 
                            ORDER BY count DESC");
    $byCategory = $catStmt->fetchAll();

    // 2. Upcoming Return Deadlines (within 7 days and not yet expired)
    $upcomingStmt = $pdo->query("SELECT id, product_name, category, seller_name, return_deadline, purchase_price 
                                 FROM purchases 
                                 WHERE return_deadline >= CURRENT_DATE() 
                                 AND return_deadline <= DATE_ADD(CURRENT_DATE(), INTERVAL 7 DAY)
                                 ORDER BY return_deadline ASC");
    $upcomingRaw = $upcomingStmt->fetchAll();
    $upcomingReturns = [];
    foreach ($upcomingRaw as $row) {
        $row['days_left'] = calculateDaysRemaining($row['return_deadline']);
        $upcomingReturns[] = $row;
    }

    // 3. Expired Warranties
    $expiredStmt = $pdo->query("SELECT id, product_name, category, seller_name, warranty_expiry, purchase_price 
                                FROM purchases 
                                WHERE warranty_expiry < CURRENT_DATE()
                                ORDER BY warranty_expiry DESC");
    $expiredRaw = $expiredStmt->fetchAll();
    $expiredWarranties = [];
    foreach ($expiredRaw as $row) {
        $row['days_expired'] = abs(calculateDaysRemaining($row['warranty_expiry']));
        $expiredWarranties[] = $row;
    }

    // 4. Claims Grouped by Status
    $statusStmt = $pdo->query("SELECT claim_status, COUNT(*) as count 
                               FROM claims 
                               GROUP BY claim_status");
    $claimsByStatus = $statusStmt->fetchAll();

    echo json_encode([
        'success' => true,
        'data' => [
            'by_category'         => $byCategory,
            'upcoming_returns'    => $upcomingReturns,
            'expired_warranties'  => $expiredWarranties,
            'claims_by_status'    => $claimsByStatus
        ]
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error generating reports: ' . $e->getMessage()
    ]);
}
