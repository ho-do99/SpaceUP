#!/usr/bin/env bash

set -Eeuo pipefail

die() { printf '[spaceup-deploy-install] ERROR: %s\n' "$*" >&2; exit 1; }

[[ "$EUID" -eq 0 ]] || die "run this installer as root"
[[ "$#" -eq 1 ]] || die "usage: install-deploy-user.sh public|private"
readonly role="$1"
case "$role" in
  public | private) ;;
  *) die "role must be public or private" ;;
esac

for command_name in id install mktemp openssl useradd usermod visudo; do
  command -v "$command_name" >/dev/null 2>&1 || die "required command not found: $command_name"
done

IFS= read -r public_key || die "read the SSH public key from standard input"
[[ "$public_key" =~ ^ssh-ed25519\ [A-Za-z0-9+/=]+([[:space:]].*)?$ ]] ||
  die "only an ssh-ed25519 public key is accepted"
if IFS= read -r _; then
  die "unexpected additional input"
fi

readonly deploy_user=spaceup-deploy
if ! id "$deploy_user" >/dev/null 2>&1; then
  useradd --create-home --shell /bin/bash "$deploy_user"
fi
# OpenSSH rejects public-key authentication when the shadow entry is locked (`*`/`!`).
# Use an unknown, randomly generated password hash so the account remains eligible for
# public-key authentication without creating a usable shared password.
readonly deploy_password_hash="$(openssl rand -base64 48 | openssl passwd -6 -stdin)"
usermod --password "$deploy_password_hash" --shell /bin/bash "$deploy_user"
readonly deploy_group="$(id -gn "$deploy_user")"

install -d -o "$deploy_user" -g "$deploy_group" -m 0700 "/home/${deploy_user}/.ssh"
case "$role" in
  public)
    # authorized_keys does not accept the `none` form for permitlisten. Keep remote forwarding
    # effectively unusable by limiting it to one loopback-only high port.
    readonly key_options='restrict,port-forwarding,permitopen="10.10.20.6:22",permitlisten="127.0.0.1:65535"'
    ;;
  private)
    readonly key_options='restrict'
    ;;
esac

readonly authorized_keys_tmp="$(mktemp)"
readonly sudoers_tmp="$(mktemp)"
trap 'rm -f "$authorized_keys_tmp" "$sudoers_tmp"' EXIT
printf '%s %s\n' "$key_options" "$public_key" > "$authorized_keys_tmp"
install -o "$deploy_user" -g "$deploy_group" -m 0600 \
  "$authorized_keys_tmp" "/home/${deploy_user}/.ssh/authorized_keys"

readonly script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
readonly source_gateway="${script_dir}/../server/spaceup-deploy-${role}"
readonly installed_gateway="/usr/local/sbin/spaceup-deploy-${role}"
[[ -r "$source_gateway" ]] || die "gateway source is missing: $source_gateway"
install -o root -g root -m 0755 "$source_gateway" "$installed_gateway"

printf '%s\n' \
  "Defaults:${deploy_user} !requiretty" \
  "${deploy_user} ALL=(root) NOPASSWD: ${installed_gateway}" \
  > "$sudoers_tmp"
visudo -cf "$sudoers_tmp" >/dev/null
install -o root -g root -m 0440 "$sudoers_tmp" "/etc/sudoers.d/spaceup-deploy"

printf '[spaceup-deploy-install] installed %s role for %s\n' "$role" "$deploy_user"
