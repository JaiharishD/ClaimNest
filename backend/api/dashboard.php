<?php
/**
 * ClaimNest - Dashboard Summary API
 * 
 * Computes aggregated statistics directly from MySQL database:
 * - Total registered purchases
 * - Approaching return deadlines (within 7 days)
 * - Open claims (Pending, Submitted, In Progress)
 * - Expired warranties
 * - Recent purchases with deadline calculations
 * 
 * Demonstrates Unit III (PHP Aggregations, MySQL Queries, JSON Response)
 */

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';

// Helper function: Calculate remaining days
function calculateDaysRemaining($targetDateString) {
    $today = new DateTime('today');
    $target = new DateTime($targetDateString);
    $interval = $today->diff($target);
    return (int)$interval->format('%r%a');
}

function getStatusFromDays($daysRemaining) {
    if ($daysRemaining < 0) {
        return 'Expired';
    } elseif ($daysRemaining <= 7) {
        return 'Expiring Soon';
    } else {
        return 'Active';
    }
}

try {
    // 1. Total purchases
    $stmt1 = $pdo->query("SELECT COUNT(*) AS total FROM purchases");
    $totalPurchases = (int)$stmt1->fetch()['total'];

    // 2. Return deadlines approaching soon (between today and today + 7 days)
    $stmt2 = $pdo->query("SELECT COUNT(*) AS approaching FROM purchases 
                          WHERE return_deadline >= CURRENT_DATE() 
                          AND return_deadline <= DATE_ADD(CURRENT_DATE(), INTERVAL 7 DAY)");
    $approachingReturns = (int)$stmt2->fetch()['approaching'];

    // 3. Open claims (Pending, Submitted, In Progress)
    $stmt3 = $pdo->query("SELECT COUNT(*) AS open_count FROM claims 
                          WHERE claim_status IN ('Pending', 'Submitted', 'In Progress')");
    $openClaims = (int)$stmt3->fetch()['open_count'];

    // 4. Expired warranties
    $stmt4 = $pdo->query("SELECT COUNT(*) AS expired_count FROM purchases 
                          WHERE warranty_expiry < CURRENT_DATE()");
    $expiredWarranties = (int)$stmt4->fetch()['expired_count'];

    // 5. Total claims count
    $stmt5 = $pdo->query("SELECT COUNT(*) AS total_claims FROM claims");
    $totalClaims = (int)$stmt5->fetch()['total_claims'];

    // 6. Recent purchases (latest 5)
    $stmt6 = $pdo->query("SELECT id, product_name, category, purchase_date, purchase_price, seller_name, return_deadline, warranty_expiry 
                          FROM purchases 
                          ORDER BY id DESC 
                          LIMIT 5");
    $recentRaw = $stmt6->fetchAll();

    $recentPurchases = [];
    foreach ($recentRaw as $p) {
        $p['return_days'] = calculateDaysRemaining($p['return_deadline']);
        $p['return_status'] = getStatusFromDays($p['return_days']);
        $p['warranty_days'] = calculateDaysRemaining($p['warranty_expiry']);
        $p['warranty_status'] = getStatusFromDays($p['warranty_days']);
        $recentPurchases[] = $p;
    }

    echo json_encode([
        'success' => true,
        'data' => [
            'total_purchases'      => $totalPurchases,
            'approaching_returns'  => $approachingReturns,
            'open_claims'          => $openClaims,
            'expired_warranties'   => $expiredWarranties,
            'total_claims'         => $totalClaims,
            'recent_purchases'     => $recentPurchases
        ]
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error querying dashboard statistics: ' . $e->getMessage()
    ]);
}
