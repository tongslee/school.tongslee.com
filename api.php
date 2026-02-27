<?php
header('Content-Type: application/json');

$host = 'p3nlmysql137plsk.secureserver.net';
$user = 'pete.nova.1.1.2000';
$pass = 'vxk*jmt6etg2WJK7qtc';
$db = 'school';

try {
    $conn = new PDO("mysql:host=$host;dbname=$db", $user, $pass);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $action = $_GET['action'] ?? 'get_assignments';
    
    if ($action === 'get_assignments') {
        $stmt = $conn->query("
            SELECT a.id, a.title, a.assignment_type, a.due_date, a.status, a.link, a.week_id,
                   s.id as subject_id, s.display_name, s.color
            FROM assignments a
            JOIN subjects s ON a.subject_id = s.id
            ORDER BY a.due_date ASC
        ");
        $assignments = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['success' => true, 'data' => $assignments]);
    }
    
    if ($action === 'update_status') {
        $id = $_POST['id'] ?? 0;
        $status = $_POST['status'] ?? '';
        
        $stmt = $conn->prepare("UPDATE assignments SET status = ? WHERE id = ?");
        $stmt->execute([$status, $id]);
        
        echo json_encode(['success' => true]);
    }
    
    if ($action === 'add_assignment') {
        $subject_id = $_POST['subject_id'] ?? 0;
        $title = $_POST['title'] ?? '';
        $assignment_type = $_POST['assignment_type'] ?? 'formative';
        $due_date = $_POST['due_date'] ?? date('Y-m-d H:i:s');
        $link = $_POST['link'] ?? '';
        $week_id = $_POST['week_id'] ?? 29;
        
        $stmt = $conn->prepare("INSERT INTO assignments (subject_id, title, assignment_type, due_date, status, link, week_id) VALUES (?, ?, ?, ?, 'pending', ?, ?)");
        $stmt->execute([$subject_id, $title, $assignment_type, $due_date, $link, $week_id]);
        
        echo json_encode(['success' => true, 'id' => $conn->lastInsertId()]);
    }
    
} catch(PDOException $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
