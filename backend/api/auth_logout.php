<?php

declare(strict_types=1);

require_once __DIR__ . '/../utils/response.php';
require_once __DIR__ . '/../utils/validate.php';
require_once __DIR__ . '/../utils/auth.php';

requirePost();
startSession();

session_unset();
session_destroy();

jsonOk(true);