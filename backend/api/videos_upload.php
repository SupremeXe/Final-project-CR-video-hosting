<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../utils/response.php';
require_once __DIR__ . '/../utils/auth.php';
require_once __DIR__ . '/../utils/validate.php';

requirePost();
$userId = requireAuth();

$title = trim((string)($_POST['title'] ?? ''));
if ($title === '') {
  jsonError('Title is required');
}

if (!isset($_FILES['video']) || ($_FILES['video']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
  jsonError('Video file is required');
}

$file = $_FILES['video'];

$maxSize = 200 * 1024 * 1024;
if (($file['size'] ?? 0) > $maxSize) {
  jsonError('File is too large');
}

$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime = $finfo->file($file['tmp_name']);

$allowed = [
  'video/mp4' => 'mp4',
  'video/webm' => 'webm',
  'video/ogg' => 'ogv',
];

if (!isset($allowed[$mime])) {
  jsonError('Unsupported video format');
}

$ext = $allowed[$mime];
$baseName = bin2hex(random_bytes(12));
$fileName = $baseName . '.' . $ext;

$root = dirname(__DIR__, 2);
$videosDir = $root . '/videos';

if (!is_dir($videosDir)) {
  mkdir($videosDir, 0777, true);
}

$targetPath = $videosDir . '/' . $fileName;

if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
  jsonError('Failed to save file', 500);
}

$publicPath = 'videos/' . $fileName;

$stmt = $pdo->prepare('INSERT INTO videos (user_id, title, file_path) VALUES (:user_id, :title, :file_path)');
$stmt->execute([
  ':user_id' => $userId,
  ':title' => $title,
  ':file_path' => $publicPath,
]);

$videoId = (int)$pdo->lastInsertId();

jsonOk([
  'id' => $videoId,
  'title' => $title,
  'file_path' => $publicPath,
  'likes' => 0,
]);