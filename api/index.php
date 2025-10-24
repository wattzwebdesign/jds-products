<?php
// Simple redirect to parent api.php with the path
$path = $_SERVER['REQUEST_URI'];
$path = str_replace('/api/', '/', $path);
require_once '../api.php';
?>
