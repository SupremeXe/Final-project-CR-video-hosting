<?php

declare(strict_types=1);

function isValidEmail(string $email): bool {
  return (bool)filter_var($email, FILTER_VALIDATE_EMAIL);
}

function requirePost(): void {
  if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    jsonError('Method not allowed', 405);
  }
}