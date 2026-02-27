<?php
header('Content-Type: application/json');

$host = 'p3nlmysql137plsk.secureserver.net';
$user = 'pete.nova.1.1.2000';
$pass = 'vxk*jmt6etg2WJK7qtc';
$db = 'school';

try {
    $conn = new PDO("mysql:host=$host;dbname=$db", $user, $pass);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $action = $_GET['action'] ?? 'list';
    
    // List tasks
    if ($action === 'list') {
        $status = $_GET['status'] ?? '';
        $sql = "SELECT * FROM tasks";
        if ($status) {
            $sql .= " WHERE status = ?";
            $stmt = $conn->prepare($sql);
            $stmt->execute([$status]);
        } else {
            $stmt = $conn->query($sql);
        }
        $tasks = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['success' => true, 'tasks' => $tasks]);
    }
    
    // Add task
    if ($action === 'add') {
        $title = $_POST['title'] ?? '';
        $description = $_POST['description'] ?? '';
        $category = $_POST['category'] ?? 'work';
        $priority = $_POST['priority'] ?? 'medium';
        $due_date = $_POST['due_date'] ?? null;
        
        $stmt = $conn->prepare("INSERT INTO tasks (title, description, category, priority, due_date) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$title, $description, $category, $priority, $due_date]);
        
        echo json_encode(['success' => true, 'id' => $conn->lastInsertId()]);
    }
    
    // Update task status
    if ($action === 'update') {
        $id = $_POST['id'] ?? 0;
        $status = $_POST['status'] ?? '';
        
        $stmt = $conn->prepare("UPDATE tasks SET status = ? WHERE id = ?");
        $stmt->execute([$status, $id]);
        
        echo json_encode(['success' => true]);
    }
    
    // Delete task
    if ($action === 'delete') {
        $id = $_POST['id'] ?? 0;
        
        $stmt = $conn->prepare("DELETE FROM tasks WHERE id = ?");
        $stmt->execute([$id]);
        
        echo json_encode(['success' => true]);
    }
    
} catch(PDOException $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
