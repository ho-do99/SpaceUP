#!/usr/bin/env bash

set -Eeuo pipefail
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "${SCRIPT_DIR}/common.sh"

REVISION="${1:-}"
DEPLOY_BRANCH="${2:-main}"
REPOSITORY_DIR="${SPACEUP_REPOSITORY_DIR:-/root/SpaceUP}"
ENV_FILE="${SPACEUP_PRIVATE_ENV:-/home/ubuntu/spaceup-private.env}"
LOCK_FILE="${SPACEUP_PRIVATE_LOCK:-/tmp/spaceup-private-deploy.lock}"

for command_name in docker git curl flock; do require_command "$command_name"; done
validate_revision "$REVISION" "$DEPLOY_BRANCH"
exec 9>"$LOCK_FILE"
flock -n 9 || die "another private deployment is already running"

update_source "$REPOSITORY_DIR" "$REVISION" "$DEPLOY_BRANCH"
for key in COMPOSE_PROJECT_NAME IMAGE_REGISTRY SPACEUP_SECRET_ENV BACKEND_BIND_HOST AI_BIND_HOST DB_PORT; do
  require_env_file_key "$ENV_FILE" "$key"
done
load_env_file "$ENV_FILE"
validate_registry

[[ "$DB_PORT" == "3307" ]] || die "production DB_PORT must be 3307"
[[ "$BACKEND_BIND_HOST" != "0.0.0.0" ]] || die "backend must not bind to every interface"
[[ "$AI_BIND_HOST" != "0.0.0.0" ]] || die "AI must not bind to every interface"
[[ -r "$SPACEUP_SECRET_ENV" ]] || die "application secret file is not readable"
grep -Eq '^DB_PORT=3307$' "$SPACEUP_SECRET_ENV" || die "application secret DB_PORT must be 3307"
for key in NCP_OBJECT_STORAGE_ENDPOINT NCP_OBJECT_STORAGE_REGION NCP_OBJECT_STORAGE_BUCKET NCP_OBJECT_STORAGE_ACCESS_KEY NCP_OBJECT_STORAGE_SECRET_KEY; do
  require_env_file_key "$SPACEUP_SECRET_ENV" "$key"
done
grep -Eq '^NCP_OBJECT_STORAGE_ENABLED=true$' "$SPACEUP_SECRET_ENV" || die "NCP Object Storage must be enabled in production"

export BACKEND_IMAGE="${IMAGE_REGISTRY}/spaceup-backend:${REVISION}"
export AI_IMAGE="${IMAGE_REGISTRY}/spaceup-ai:${REVISION}"
export OCR_IMAGE="${IMAGE_REGISTRY}/spaceup-ocr:${REVISION}"
export SPA_IMAGE="${IMAGE_REGISTRY}/spaceup-spa:${REVISION}"
export VIEWERWALL_IMAGE="${IMAGE_REGISTRY}/spaceup-viewerwall:${REVISION}"
COMPOSE=(docker compose --env-file "$ENV_FILE" -f deploy/compose.private.yml)
"${COMPOSE[@]}" config --quiet

BACKEND_CONTAINER_ID="$("${COMPOSE[@]}" ps -q backend)"
AI_CONTAINER_ID="$("${COMPOSE[@]}" ps -q ai)"
OCR_CONTAINER_ID="$("${COMPOSE[@]}" ps -q ocr)"
SPA_CONTAINER_ID="$("${COMPOSE[@]}" ps -q spa)"
VIEWERWALL_CONTAINER_ID="$("${COMPOSE[@]}" ps -q viewerwall)"
PREVIOUS_BACKEND_IMAGE="$(docker inspect --format '{{.Config.Image}}' "$BACKEND_CONTAINER_ID" 2>/dev/null || true)"
PREVIOUS_AI_IMAGE="$(docker inspect --format '{{.Config.Image}}' "$AI_CONTAINER_ID" 2>/dev/null || true)"
PREVIOUS_OCR_IMAGE="$(docker inspect --format '{{.Config.Image}}' "$OCR_CONTAINER_ID" 2>/dev/null || true)"
PREVIOUS_SPA_IMAGE="$(docker inspect --format '{{.Config.Image}}' "$SPA_CONTAINER_ID" 2>/dev/null || true)"
PREVIOUS_VIEWERWALL_IMAGE="$(docker inspect --format '{{.Config.Image}}' "$VIEWERWALL_CONTAINER_ID" 2>/dev/null || true)"
REPLACEMENT_STARTED=0

rollback_private() {
  local exit_code="$?"
  trap - ERR
  if [[ "$REPLACEMENT_STARTED" == "1" && -n "$PREVIOUS_BACKEND_IMAGE" ]]; then
    log "restoring previous private images"
    export BACKEND_IMAGE="$PREVIOUS_BACKEND_IMAGE"
    [[ -n "$PREVIOUS_AI_IMAGE" ]] && export AI_IMAGE="$PREVIOUS_AI_IMAGE"
    [[ -n "$PREVIOUS_OCR_IMAGE" ]] && export OCR_IMAGE="$PREVIOUS_OCR_IMAGE"
    [[ -n "$PREVIOUS_SPA_IMAGE" ]] && export SPA_IMAGE="$PREVIOUS_SPA_IMAGE"
    [[ -n "$PREVIOUS_VIEWERWALL_IMAGE" ]] && export VIEWERWALL_IMAGE="$PREVIOUS_VIEWERWALL_IMAGE"
    "${COMPOSE[@]}" up -d --no-deps ai ocr spa viewerwall backend || true
  fi
  exit "$exit_code"
}
trap rollback_private ERR

log "pulling immutable private images before replacement"
"${COMPOSE[@]}" pull ai ocr spa viewerwall backend
REPLACEMENT_STARTED=1
"${COMPOSE[@]}" up -d --no-deps ai
"${COMPOSE[@]}" up -d --no-deps ocr
"${COMPOSE[@]}" up -d --no-deps spa
"${COMPOSE[@]}" up -d --no-deps viewerwall
"${COMPOSE[@]}" up -d --no-deps backend
wait_for_http "http://${AI_BIND_HOST}:${AI_PORT:-8000}/health" 40 2
for service in ocr spa viewerwall; do
  "${COMPOSE[@]}" exec -T "$service" python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=10).read()"
done
"${COMPOSE[@]}" exec -T viewerwall python -c "import urllib.request, urllib.error; r=urllib.request.Request('http://127.0.0.1:8000/api/analyze', method='POST');
try: urllib.request.urlopen(r, timeout=10)
except urllib.error.HTTPError as e: assert e.code in (400, 422)"
wait_for_http "http://${BACKEND_BIND_HOST}:${BACKEND_PORT:-8080}/api/rental-transactions/apartments?size=1" 40 2
for variant_id in 18 19 20 21; do
  wait_for_http "http://${BACKEND_BIND_HOST}:${BACKEND_PORT:-8080}/api/floorplans/apartments/variants/${variant_id}/image" 10 2
done
trap - ERR
"${COMPOSE[@]}" ps
log "private deployment completed at ${REVISION}"
