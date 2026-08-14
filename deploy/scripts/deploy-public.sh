#!/usr/bin/env bash

set -Eeuo pipefail
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "${SCRIPT_DIR}/common.sh"

REVISION="${1:-}"
DEPLOY_BRANCH="${2:-main}"
REPOSITORY_DIR="${SPACEUP_REPOSITORY_DIR:-/root/SpaceUP}"
ENV_FILE="${SPACEUP_PUBLIC_ENV:-/root/spaceup-public.env}"
LOCK_FILE="${SPACEUP_PUBLIC_LOCK:-/tmp/spaceup-public-deploy.lock}"

for command_name in docker git curl flock; do require_command "$command_name"; done
validate_revision "$REVISION" "$DEPLOY_BRANCH"
exec 9>"$LOCK_FILE"
flock -n 9 || die "another public deployment is already running"

update_source "$REPOSITORY_DIR" "$REVISION" "$DEPLOY_BRANCH"
for key in COMPOSE_PROJECT_NAME IMAGE_REGISTRY DOMAIN LEGACY_DOMAIN BACKEND_HOST AI_HOST LETSENCRYPT_DIR CERTBOT_WEBROOT_DIR SSL_CERT_PATH SSL_KEY_PATH LEGACY_SSL_CERT_PATH LEGACY_SSL_KEY_PATH; do
  require_env_file_key "$ENV_FILE" "$key"
done
load_env_file "$ENV_FILE"
validate_registry

[[ "$DOMAIN" == "spaceup.duckdns.org" ]] || die "unexpected production DOMAIN: $DOMAIN"
[[ "$LEGACY_DOMAIN" == "101.79.26.89.sslip.io" ]] || die "unexpected legacy domain"
for cert_file in \
  "${LETSENCRYPT_DIR}/live/${DOMAIN}/fullchain.pem" \
  "${LETSENCRYPT_DIR}/live/${DOMAIN}/privkey.pem" \
  "${LETSENCRYPT_DIR}/live/${LEGACY_DOMAIN}/fullchain.pem" \
  "${LETSENCRYPT_DIR}/live/${LEGACY_DOMAIN}/privkey.pem"; do
  [[ -r "$cert_file" ]] || die "TLS file is missing: $cert_file"
done
[[ "$SSL_CERT_PATH" == "/etc/nginx/certs/live/${DOMAIN}/fullchain.pem" ]] || die "official certificate path does not match DOMAIN"
[[ "$SSL_KEY_PATH" == "/etc/nginx/certs/live/${DOMAIN}/privkey.pem" ]] || die "official private-key path does not match DOMAIN"
[[ "$LEGACY_SSL_CERT_PATH" == "/etc/nginx/certs/live/${LEGACY_DOMAIN}/fullchain.pem" ]] || die "legacy certificate path does not match LEGACY_DOMAIN"
[[ "$LEGACY_SSL_KEY_PATH" == "/etc/nginx/certs/live/${LEGACY_DOMAIN}/privkey.pem" ]] || die "legacy private-key path does not match LEGACY_DOMAIN"

export FRONTEND_IMAGE="${IMAGE_REGISTRY}/spaceup-frontend:${REVISION}"
COMPOSE=(docker compose --env-file "$ENV_FILE" -f deploy/compose.public.yml)
"${COMPOSE[@]}" config --quiet
"${COMPOSE[@]}" run --rm --no-deps nginx nginx -t

FRONTEND_CONTAINER_ID="$("${COMPOSE[@]}" ps -q frontend)"
PREVIOUS_FRONTEND_IMAGE="$(docker inspect --format '{{.Config.Image}}' "$FRONTEND_CONTAINER_ID" 2>/dev/null || true)"
REPLACEMENT_STARTED=0

rollback_public() {
  local exit_code="$?"
  trap - ERR
  if [[ "$REPLACEMENT_STARTED" == "1" && -n "$PREVIOUS_FRONTEND_IMAGE" ]]; then
    log "restoring previous frontend image"
    export FRONTEND_IMAGE="$PREVIOUS_FRONTEND_IMAGE"
    "${COMPOSE[@]}" up -d --no-deps frontend nginx || true
  fi
  exit "$exit_code"
}
trap rollback_public ERR

log "pulling immutable public image before replacement"
"${COMPOSE[@]}" pull frontend nginx
REPLACEMENT_STARTED=1
"${COMPOSE[@]}" up -d --no-deps frontend
"${COMPOSE[@]}" up -d --no-deps --force-recreate nginx
"${COMPOSE[@]}" exec -T nginx nginx -t
wait_for_http "https://${DOMAIN}/" 30 2
wait_for_http "https://${DOMAIN}/api/rental-transactions/apartments?size=1" 30 2
LEGACY_REDIRECT="$(curl --fail --silent --show-error --head --max-time 10 "https://${LEGACY_DOMAIN}/" | tr -d '\r' | awk 'tolower($1) == "location:" { print $2; exit }')"
[[ "$LEGACY_REDIRECT" == "https://${DOMAIN}/" ]] || die "legacy domain did not redirect to the official domain"
trap - ERR
"${COMPOSE[@]}" ps
log "public deployment completed at ${REVISION}"
