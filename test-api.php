<?php
// Simple test to check if PHP works and what variables are available
header('Content-Type: application/json');

echo json_encode([
    'status' => 'PHP is working',
    'REQUEST_URI' => $_SERVER['REQUEST_URI'] ?? 'NOT SET',
    'SCRIPT_NAME' => $_SERVER['SCRIPT_NAME'] ?? 'NOT SET',
    'PATH_INFO' => $_SERVER['PATH_INFO'] ?? 'NOT SET',
    'QUERY_STRING' => $_SERVER['QUERY_STRING'] ?? 'NOT SET',
    'all_server_vars' => $_SERVER
], JSON_PRETTY_PRINT);
?>
