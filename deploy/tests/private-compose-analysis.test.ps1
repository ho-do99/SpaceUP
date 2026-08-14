$ErrorActionPreference = 'Stop'

$compose = Get-Content -Raw -Encoding utf8 "$PSScriptRoot/../compose.private.yml"
$workflow = Get-Content -Raw -Encoding utf8 "$PSScriptRoot/../../.github/workflows/ci.yml"
$deploy = Get-Content -Raw -Encoding utf8 "$PSScriptRoot/../scripts/deploy-private.sh"
$spaDockerfile = Get-Content -Raw -Encoding utf8 "$PSScriptRoot/../../ai/spa/Dockerfile"
$ocrDockerfile = Get-Content -Raw -Encoding utf8 "$PSScriptRoot/../../ai/ocr/Dockerfile"
$privateEnvExample = Get-Content -Raw -Encoding utf8 "$PSScriptRoot/../examples/spaceup-private.env.example"

foreach ($service in @('ocr:', 'spa:', 'viewerwall:')) {
    if (-not $compose.Contains($service)) { throw "missing service: $service" }
}

foreach ($image in @('spaceup-ocr', 'spaceup-spa', 'spaceup-viewerwall')) {
    if (-not $workflow.Contains($image)) { throw "missing published image: $image" }
}

foreach ($health in @('/health', '/api/analyze', '/api/floorplans/apartments/variants/${variant_id}/image')) {
    if (-not $deploy.Contains($health)) { throw "missing deployment verification: $health" }
}

foreach ($retryMarker in @('wait_for_service_http()', 'count <= attempts', 'wait_for_service_http "$service"')) {
    if (-not $deploy.Contains($retryMarker)) { throw "private service health check does not retry: $retryMarker" }
}

if (-not $deploy.Contains('FLOORPLAN_HEALTHCHECK_VARIANT_IDS')) {
    throw 'floorplan health-check variant IDs are not configurable'
}
if ($deploy.Contains('for variant_id in 18 19 20 21')) {
    throw 'floorplan health-check variant IDs are hard-coded'
}
if (-not $privateEnvExample.Contains('FLOORPLAN_HEALTHCHECK_VARIANT_IDS=18 19 20 21')) {
    throw 'private environment example is missing floorplan health-check variant IDs'
}

foreach ($objectStorageKey in @('NCP_OBJECT_STORAGE_ENABLED=true', 'NCP_OBJECT_STORAGE_ACCESS_KEY', 'NCP_OBJECT_STORAGE_SECRET_KEY')) {
    if (-not $deploy.Contains($objectStorageKey)) { throw "missing Object Storage deployment guard: $objectStorageKey" }
}

foreach ($spaPath in @('COPY spa/requirements.txt', 'COPY spa/app ./app', 'COPY model_weights/segmentation /models')) {
    if (-not $spaDockerfile.Contains($spaPath)) { throw "SPA image uses the wrong build context path: $spaPath" }
}

foreach ($ocrBuildDependency in @('build-essential', 'pybind11==')) {
    if (-not $ocrDockerfile.Contains($ocrBuildDependency)) { throw "OCR image is missing fastwer build dependency: $ocrBuildDependency" }
}

Write-Output 'private floorplan analysis deployment configuration is complete'
