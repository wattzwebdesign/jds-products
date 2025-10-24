<?php
/**
 * PHP Proxy for Node.js Backend API
 * Routes all requests from /api/* to http://localhost:3000/api/*
 */

// Debug mode - set to false in production
$debugMode = isset($_GET['debug']) ? true : false;

if ($debugMode) {
    header('Content-Type: application/json');
    echo json_encode([
        'message' => 'API Proxy Debug Info',
        'REQUEST_URI' => $_SERVER['REQUEST_URI'],
        'SCRIPT_NAME' => $_SERVER['SCRIPT_NAME'],
        'PATH_INFO' => $_SERVER['PATH_INFO'] ?? 'NOT SET',
        'REDIRECT_API_PATH' => $_SERVER['REDIRECT_API_PATH'] ?? 'NOT SET',
        'QUERY_STRING' => $_SERVER['QUERY_STRING'] ?? '',
        'REQUEST_METHOD' => $_SERVER['REQUEST_METHOD'],
        'all_env_vars' => array_filter($_SERVER, function($key) {
            return strpos($key, 'REDIRECT') === 0 || strpos($key, 'PATH') !== false;
        }, ARRAY_FILTER_USE_KEY)
    ], JSON_PRETTY_PRINT);
    exit();
}

// Enable CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Get the request path - handle multiple formats
$requestUri = $_SERVER['REQUEST_URI'];

// Try multiple methods to extract the API path
if (isset($_SERVER['PATH_INFO'])) {
    // Method 1: PATH_INFO is set
    $apiPath = $_SERVER['PATH_INFO'];
} elseif (isset($_SERVER['REDIRECT_API_PATH'])) {
    // Method 2: Environment variable from .htaccess rewrite
    $apiPath = $_SERVER['REDIRECT_API_PATH'];
} else {
    // Method 3: Extract from REQUEST_URI
    // Remove query string
    $path = parse_url($requestUri, PHP_URL_PATH);

    // Remove /api.php prefix if present
    if (strpos($path, '/api.php/') === 0) {
        $apiPath = substr($path, 8); // Remove '/api.php'
    } elseif (strpos($path, '/api.php') === 0) {
        $apiPath = '/health'; // Default test endpoint
    } else {
        $apiPath = $path;
    }
}

// Ensure path starts with /
if (empty($apiPath) || $apiPath === '/') {
    $apiPath = '/health';
}
if ($apiPath[0] !== '/') {
    $apiPath = '/' . $apiPath;
}

// Backend URL
$backendUrl = 'http://localhost:3000' . $apiPath;

// Add query string if present
if (isset($_SERVER['QUERY_STRING']) && !empty($_SERVER['QUERY_STRING'])) {
    $backendUrl .= '?' . $_SERVER['QUERY_STRING'];
}

// Get request method
$method = $_SERVER['REQUEST_METHOD'];

// Get request body
$requestBody = file_get_contents('php://input');

// Get request headers
$headers = [];
foreach (getallheaders() as $name => $value) {
    if (strtolower($name) !== 'host') {
        $headers[] = "$name: $value";
    }
}

// Initialize cURL
$ch = curl_init($backendUrl);

// Set cURL options
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);

// Add request body for POST, PUT, etc.
if (in_array($method, ['POST', 'PUT', 'PATCH'])) {
    curl_setopt($ch, CURLOPT_POSTFIELDS, $requestBody);
}

// Execute request
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);

// Check for errors
if (curl_errno($ch)) {
    http_response_code(502);
    header('Content-Type: application/json');
    echo json_encode([
        'error' => 'Backend server error',
        'message' => curl_error($ch)
    ]);
    curl_close($ch);
    exit();
}

curl_close($ch);

// Split headers and body
$responseHeaders = substr($response, 0, $headerSize);
$responseBody = substr($response, $headerSize);

// Forward response headers (except certain ones)
$headerLines = explode("\r\n", $responseHeaders);
foreach ($headerLines as $header) {
    if (empty($header) || strpos($header, 'HTTP/') === 0) {
        continue;
    }

    $headerLower = strtolower($header);
    if (strpos($headerLower, 'transfer-encoding:') === false &&
        strpos($headerLower, 'connection:') === false) {
        header($header);
    }
}

// Set response code
http_response_code($httpCode);

// Output response body
echo $responseBody;
?>
