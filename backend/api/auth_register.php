<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../utils/response.php';
require_once __DIR__ . '/../utils/validate.php';
require_once __DIR__ . '/../utils/auth.php';

requirePost();
startSession();

$email = trim((string)($_POST['email'] ?? ''));
$password = (string)($_POST['password'] ?? '');

if ($email === '' || $password === '') {
  jsonError('Email and password are required');
}

if (!isValidEmail($email)) {
  jsonError('Invalid email');
}

if (mb_strlen($password) < 6) {
  jsonError('Password must be at least 6 characters');
}

$stmt = $pdo->prepare('SELECT id FROM users WHERE email = :email LIMIT 1');
$stmt->execute([':email' => $email]);
if ($stmt->fetch()) {
  jsonError('Email already exists');
}

$hash = password_hash($password, PASSWORD_DEFAULT);

$stmt = $pdo->prepare('INSERT INTO users (email, password_hash) VALUES (:email, :hash)');
$stmt->execute([':email' => $email, ':hash' => $hash]);

$userId = (int)$pdo->lastInsertId();

$_SESSION['user_id'] = $userId;
$_SESSION['user_email'] = $email;

jsonOk(['id' => $userId, 'email' => $email]);