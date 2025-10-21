<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight request for CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$response = ["status" => "error", "message" => "An unknown error occurred."];

if (isset($_FILES['file'])) {
    $file = $_FILES['file'];

    // --- Konfigurasi ---
    $uploadDir = 'images/';
    $maxFileSize = 10 * 1024 * 1024; // 10 MB
    $allowedMimeTypes = [
        'image/jpeg', 
        'image/png', 
        'image/webp',
        'audio/mpeg', // for MP3
        'audio/wav',
        'audio/ogg',
        'audio/webm',
        'application/octet-stream'   // fallback kalau server tidak deteksi dengan benar
    ];
    
    // Pastikan direktori upload ada
    if (!file_exists($uploadDir)) {
        if (!mkdir($uploadDir, 0755, true)) {
            $response['message'] = "Failed to create upload directory.";
            echo json_encode($response);
            exit;
        }
    }

    // --- Validasi ---
    // Cek error upload
    if ($file['error'] !== UPLOAD_ERR_OK) {
        $response['message'] = "File upload error with code: " . $file['error'];
        echo json_encode($response);
        exit;
    }

    // Cek ukuran file
    if ($file['size'] > $maxFileSize) {
        $response['message'] = "File is too large. Maximum size is 10MB.";
        echo json_encode($response);
        exit;
    }

    // Cek tipe MIME
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);

    if (!in_array($mimeType, $allowedMimeTypes)) {
        $response['message'] = "Invalid file type: " . $mimeType . ". Only images (JPG, PNG, WEBP) and audio (MP3, WAV, OGG, WEBM) are allowed.";
        echo json_encode($response);
        exit;
    }

    // --- Proses Upload ---
    $fileExtension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $prefix = strpos($mimeType, 'image/') === 0 ? 'img_' : 'aud_';
    $newFileName = uniqid($prefix, true) . '.' . strtolower($fileExtension);
    $uploadPath = $uploadDir . $newFileName;

    if (move_uploaded_file($file['tmp_name'], $uploadPath)) {
        // Tentukan URL berdasarkan protokol dan nama host
        $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || $_SERVER['SERVER_PORT'] == 443) ? "https://" : "http://";
        $host = $_SERVER['HTTP_HOST'];
        $fileUrl = $protocol . $host . '/' . $uploadPath;

        $response['status'] = "success";
        $response['message'] = "File uploaded successfully.";
        $response['url'] = $fileUrl;
    } else {
        $response['message'] = "Failed to move uploaded file.";
    }

} else {
    $response['message'] = "No file was uploaded.";
}

echo json_encode($response);
?>
