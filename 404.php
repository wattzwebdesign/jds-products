<?php
// 404 handler - serve index.html for Vue Router
// This handles cases where nginx can't find the file
$indexPath = __DIR__ . '/index.html';

if (file_exists($indexPath)) {
    header('Content-Type: text/html; charset=UTF-8');
    readfile($indexPath);
} else {
    http_response_code(404);
    echo '404 - Not Found';
}
?>
