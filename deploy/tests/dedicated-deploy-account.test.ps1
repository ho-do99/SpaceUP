$ErrorActionPreference = 'Stop'

$workflow = Get-Content -Raw -Encoding utf8 "$PSScriptRoot/../../.github/workflows/deploy.yml"
$common = Get-Content -Raw -Encoding utf8 "$PSScriptRoot/../scripts/common.sh"
$publicDeploy = Get-Content -Raw -Encoding utf8 "$PSScriptRoot/../scripts/deploy-public.sh"
$privateDeploy = Get-Content -Raw -Encoding utf8 "$PSScriptRoot/../scripts/deploy-private.sh"
$installer = Get-Content -Raw -Encoding utf8 "$PSScriptRoot/../scripts/install-deploy-user.sh"

foreach ($required in @(
    'readonly DEPLOY_BRANCH=main',
    'sudo -n /usr/local/sbin/spaceup-deploy-private',
    'sudo -n /usr/local/sbin/spaceup-deploy-public',
    'Host spaceup-public',
    'Host spaceup-private',
    'ProxyJump spaceup-public',
    'ssh spaceup-private',
    'ssh spaceup-public'
)) {
    if (-not $workflow.Contains($required)) { throw "workflow is missing: $required" }
}
if ($workflow.Contains('inputs.branch')) { throw 'production workflow still accepts a deployment branch' }
if ($workflow.Contains('-J "${SSH_USER}@${PUBLIC_HOST}"')) {
    throw 'jump host identity must be explicitly configured instead of relying on inherited -J options'
}
if (-not $common.Contains('production deployment branch must be main')) {
    throw 'deployment validation is not pinned to main'
}
if (-not $publicDeploy.Contains('DEPLOY_BRANCH="${2:-main}"')) {
    throw 'public deployment does not default to main'
}
if (-not $publicDeploy.Contains('ENV_FILE="${SPACEUP_PUBLIC_ENV:-/root/spaceup-public.env}"')) {
    throw 'public deployment uses the wrong environment-file path'
}
if (-not $privateDeploy.Contains('DEPLOY_BRANCH="${2:-main}"')) {
    throw 'private deployment does not default to main'
}
foreach ($required in @('permitopen="10.10.20.6:22"', 'permitlisten="127.0.0.1:65535"', "readonly key_options='restrict'", 'NOPASSWD')) {
    if (-not $installer.Contains($required)) { throw "installer is missing: $required" }
}
if ($installer.Contains('permitlisten="none"')) {
    throw 'authorized_keys does not accept permitlisten="none" and would reject the entire key'
}
foreach ($required in @('openssl rand -base64 48', 'openssl passwd -6 -stdin')) {
    if (-not $installer.Contains($required)) { throw "installer is missing unlocked random password handling: $required" }
}
if ($installer.Contains("usermod --password '*'")) {
    throw 'deploy user shadow entry must not be locked because OpenSSH rejects its public key'
}
if ($installer.Contains('docker group') -or $installer.Contains('usermod -aG docker')) {
    throw 'deploy user must not receive unrestricted Docker access'
}

Write-Output 'dedicated main-only deployment configuration is complete'
