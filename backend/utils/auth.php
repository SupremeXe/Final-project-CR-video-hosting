<?php

declare(strict_types=1);

function startSession(): void {
  if (session_status() === PHP_SESSION_NONE) {
    session_start();
  }
}

function requireAuth(): int {
  startSession();

  $userId = (int)($_SESSION['user_id'] ?? 0);
  if ($userId <= 0) {
    jsonError('Unauthorized', 401);
  }

  return $userId;
}

function currentUser(): ?array {
  startSession();

  if (empty($_SESSION['user_id'])) {
    return null;
  }

  return [
    'id' => (int)$_SESSION['user_id'],
    'email' => (string)($_SESSION['user_email'] ?? ''),
  ];
}