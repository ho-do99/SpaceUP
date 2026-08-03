# This script uses Docker to run an Alpine container with OpenSSL to generate self-signed certificates.
# This avoids needing to install OpenSSL locally on Windows.

$certsDir = Resolve-Path .
Write-Host "Generating self-signed SSL certificates in $certsDir..."

# Make sure we use absolute path with forward slashes for Docker on Windows if needed, or normal Windows path format
$targetPath = $certsDir.Path

docker run --rm -v "${targetPath}:/certs" alpine sh -c "apk add --no-cache openssl && openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /certs/server.key -out /certs/server.crt -subj '/CN=localhost'"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Success! server.crt and server.key have been created." -ForegroundColor Green
} else {
    Write-Warning "Failed to generate certificates. Please ensure Docker is running."
}
