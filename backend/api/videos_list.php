<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../utils/response.php';

$q = trim((string)($_GET['q'] ?? ''));
$sort = (string)($_GET['sort'] ?? 'date_desc');

$allowedSort = [
  'title_asc' => 'v.title ASC',
  'title_desc' => 'v.title DESC',
  'likes_asc' => 'v.likes ASC',
  'likes_desc' => 'v.likes DESC',
  'date_asc' => 'v.created_at ASC',
  'date_desc' => 'v.created_at DESC',
];

$orderBy = $allowedSort[$sort] ?? $allowedSort['date_desc'];

$sql = "
  SELECT v.id, v.title, v.file_path, v.likes, v.created_at, u.email
  FROM videos v
  JOIN users u ON u.id = v.user_id
";

$params = [];

if ($q !== '') {
  $sql .= " WHERE v.title LIKE :q ";
  $params[':q'] = '%' . $q . '%';
}

$sql .= " ORDER BY {$orderBy}";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);

$videos = $stmt->fetchAll();

jsonOk($videos);