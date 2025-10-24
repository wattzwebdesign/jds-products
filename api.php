<?php
/**
 * PHP Proxy for Node.js Backend API
 * Routes all requests from /api/* to http://localhost:3000/api/*
 */

// Enable CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Get the request path
$requestUri = $_SERVER['REQUEST_URI'];
$scriptName = $_SERVER['SCRIPT_NAME'];

// Extract the API path
$apiPath = str_replace(dirname($scriptName) . '/api.php', '', $requestUri);
if (empty($apiPath) || $apiPath === '/') {
    $apiPath = '/';
}

// Backend URL
$backendUrl = 'http://localhost:3000' . $apiPath;

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
