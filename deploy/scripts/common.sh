#!/usr/bin/env bash

set -Eeuo pipefail

log() { printf '[spaceup-deploy] %s\n' "$*"; }
die() { printf '[spaceup-deploy] ERROR: %s\n' "$*" >&2; exit 1; }

require_command() {
  command -v "$1" >/dev/null 2>&1 || die "required command not found: $1"
}

require_env_file_key() {
  local env_file="$1"
  local key="$2"
  grep -Eq "^${key}=.+" "$env_file" || die "${key} is missing or empty in ${env_file}"
}

load_env_file() {
  local env_file="$1"
  local line key value

  [[ -r "$env_file" ]] || die "environment file is not readable: $env_file"
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%$'\r'}"
    case "$line" in
      "" | \#*) continue ;;
    esac
    [[ "$line" == *=* ]] || die "invalid environment line in ${env_file}"
    key="${line%%=*}"
    value="${line#*=}"
    [[ "$key" =~ ^[A-Z_][A-Z0-9_]*$ ]] || die "invalid environment key in ${env_file}: ${key}"
    export "$key=$value"
  done < "$env_file"
}

validate_revision() {
  local revision="$1"
  local branch="$2"
  [[ "$revision" =~ ^[0-9a-f]{40}$ ]] || die "revision must be a full 40-character commit SHA"
  case "$branch" in
    main | infra) ;;
    *) die "deployment branch must be main or infra" ;;
  esac
}

validate_registry() {
  [[ "${IMAGE_REGISTRY:-}" =~ ^ghcr\.io/[a-z0-9_.-]+$ ]] ||
    die "IMAGE_REGISTRY must be a trusted ghcr.io namespace"
}

update_source() {
  local repository_dir="$1"
  local revision="$2"
  local branch="$3"

  cd "$repository_dir"
  [[ -d .git ]] || die "not a Git repository: $repository_dir"
  [[ -z "$(git status --porcelain --untracked-files=no)" ]] ||
    die "tracked server files have local changes; deployment stopped"

  git fetch --no-tags --prune origin "$branch"
  git cat-file -e "${revision}^{commit}" 2>/dev/null || die "commit not found: $revision"
  git merge-base --is-ancestor "$revision" "origin/${branch}" ||
    die "commit is not contained in origin/${branch}"
  git switch "$branch"
  git merge --ff-only "$revision"
  [[ "$(git rev-parse HEAD)" == "$revision" ]] || die "server did not reach requested revision"
}

wait_for_http() {
  local url="$1"
  local attempts="${2:-30}"
  local delay="${3:-2}"
  local count

  for ((count = 1; count <= attempts; count++)); do
    if curl --fail --silent --show-error --max-time 10 "$url" >/dev/null; then
      log "health check passed: $url"
      return 0
    fi
    sleep "$delay"
  done

  printf '[spaceup-deploy] ERROR: health check failed: %s\n' "$url" >&2
  return 1
}
