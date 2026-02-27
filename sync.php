<?php
// Script to sync assignments from scraped data to database
// Called by cron jobs

header('Content-Type: application/json');

$host = 'p3nlmysql137plsk.secureserver.net';
$user = 'pete.nova.1.1.2000';
$pass = 'vxk*jmt6etg2WJK7qtc';
$db = 'school';

$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['assignments'])) {
    // Get assignments from query string
    $assignmentsJson = $_GET['assignments'] ?? '[]';
    $input = ['assignments' => json_decode($assignmentsJson, true)];
}

try {
    $conn = new PDO("mysql:host=$host;dbname=$db", $user, $pass);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $count = 0;
    foreach ($input['assignments'] as $a) {
        // Check if assignment exists by title and due_date
        $stmt = $conn->prepare("SELECT id FROM assignments WHERE title = ? AND due_date = ?");
        $stmt->execute([$a['title'], $a['due_date']]);
        $existing = $stmt->fetch();
        
        if (!$existing) {
            // Insert new assignment
            $stmt = $conn->prepare("
                INSERT INTO assignments (subject_id, title, assignment_type, due_date, status, link, week_id) 
                VALUES (?, ?, ?, ?, 'pending', ?, ?)
            ");
            $stmt->execute([
                $a['subject_id'],
                $a['title'],
                $a['assignment_type'] ?? 'formative',
                $a['due_date'],
                $a['link'] ?? '',
                $a['week_id'] ?? 29
            ]);
            $count++;
        }
    }
    
    echo json_encode(['success' => true, 'added' => $count]);
    
} catch(PDOException $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
