<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../utils/response.php';
require_once __DIR__ . '/../utils/auth.php';
require_once __DIR__ . '/../utils/validate.php';

requirePost();
requireAuth();

$raw = file_get_contents('php://input');
$data = json_decode($raw ?: '[]', true);

$videoId = (int)($data['videoId'] ?? 0);
if ($videoId <= 0) {
  jsonError('videoId is required');
}

$stmt = $pdo->prepare('UPDATE videos SET likes = likes + 1 WHERE id = :id');
$stmt->execute([':id' => $videoId]);

$stmt = $pdo->prepare('SELECT likes FROM videos WHERE id = :id LIMIT 1');
$stmt->execute([':id' => $videoId]);
$row = $stmt->fetch();

if (!$row) {
  jsonError('Video not found', 404);
}

jsonOk(['videoId' => $videoId, 'likes' => (int)$row['likes']]);