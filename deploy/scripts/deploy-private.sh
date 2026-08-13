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

export BACKEND_IMAGE="${IMAGE_REGISTRY}/spaceup-backend:${REVISION}"
export AI_IMAGE="${IMAGE_REGISTRY}/spaceup-ai:${REVISION}"
COMPOSE=(docker compose --env-file "$ENV_FILE" -f deploy/compose.private.yml)
"${COMPOSE[@]}" config --quiet

BACKEND_CONTAINER_ID="$("${COMPOSE[@]}" ps -q backend)"
AI_CONTAINER_ID="$("${COMPOSE[@]}" ps -q ai)"
PREVIOUS_BACKEND_IMAGE="$(docker inspect --format '{{.Config.Image}}' "$BACKEND_CONTAINER_ID" 2>/dev/null || true)"
PREVIOUS_AI_IMAGE="$(docker inspect --format '{{.Config.Image}}' "$AI_CONTAINER_ID" 2>/dev/null || true)"
REPLACEMENT_STARTED=0

rollback_private() {
  local exit_code="$?"
  trap - ERR
  if [[ "$REPLACEMENT_STARTED" == "1" && -n "$PREVIOUS_BACKEND_IMAGE" ]]; then
    log "restoring previous private images"
    export BACKEND_IMAGE="$PREVIOUS_BACKEND_IMAGE"
    [[ -n "$PREVIOUS_AI_IMAGE" ]] && export AI_IMAGE="$PREVIOUS_AI_IMAGE"
    "${COMPOSE[@]}" up -d --no-deps ai backend || true
  fi
  exit "$exit_code"
}
trap rollback_private ERR

log "pulling immutable private images before replacement"
"${COMPOSE[@]}" pull ai backend
REPLACEMENT_STARTED=1
"${COMPOSE[@]}" up -d --no-deps ai
"${COMPOSE[@]}" up -d --no-deps backend
wait_for_http "http://${BACKEND_BIND_HOST}:${BACKEND_PORT:-8080}/api/rental-transactions/apartments?size=1" 40 2
trap - ERR
"${COMPOSE[@]}" ps
log "private deployment completed at ${REVISION}"
