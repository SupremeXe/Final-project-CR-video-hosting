<?php

declare(strict_types=1);

function jsonOk($data = null): void {
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode(['ok' => true, 'data' => $data], JSON_UNESCAPED_UNICODE);
  exit;
}

function jsonError(string $message, int $code = 400): void {
  header('Content-Type: application/json; charset=utf-8');
  http_response_code($code);
  echo json_encode(['ok' => false, 'error' => $message], JSON_UNESCAPED_UNICODE);
  exit;
}