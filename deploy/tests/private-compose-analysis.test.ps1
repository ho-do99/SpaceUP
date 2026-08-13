$ErrorActionPreference = 'Stop'

$compose = Get-Content -Raw -Encoding utf8 "$PSScriptRoot/../compose.private.yml"
$workflow = Get-Content -Raw -Encoding utf8 "$PSScriptRoot/../../.github/workflows/ci.yml"
$deploy = Get-Content -Raw -Encoding utf8 "$PSScriptRoot/../scripts/deploy-private.sh"
$spaDockerfile = Get-Content -Raw -Encoding utf8 "$PSScriptRoot/../../ai/spa/Dockerfile"

foreach ($service in @('ocr:', 'spa:', 'viewerwall:')) {
    if (-not $compose.Contains($service)) { throw "missing service: $service" }
}

foreach ($image in @('spaceup-ocr', 'spaceup-spa', 'spaceup-viewerwall')) {
    if (-not $workflow.Contains($image)) { throw "missing published image: $image" }
}

foreach ($health in @('/health', '/api/analyze', '/api/floorplans/variants/${variant_id}/image')) {
    if (-not $deploy.Contains($health)) { throw "missing deployment verification: $health" }
}

foreach ($objectStorageKey in @('NCP_OBJECT_STORAGE_ENABLED=true', 'NCP_OBJECT_STORAGE_ACCESS_KEY', 'NCP_OBJECT_STORAGE_SECRET_KEY')) {
    if (-not $deploy.Contains($objectStorageKey)) { throw "missing Object Storage deployment guard: $objectStorageKey" }
}

foreach ($spaPath in @('COPY spa/requirements.txt', 'COPY spa/app ./app', 'COPY model_weights/segmentation /models')) {
    if (-not $spaDockerfile.Contains($spaPath)) { throw "SPA image uses the wrong build context path: $spaPath" }
}

Write-Output 'private floorplan analysis deployment configuration is complete'
