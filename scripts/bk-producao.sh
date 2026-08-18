#!/usr/bin/env bash

set -Eeuo pipefail

die() {
  printf 'ERRO: %s\n' "$*" >&2
  exit 1
}

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Comando ausente: $1"
}

require_var() {
  local name="$1"
  local value="${!name:-}"
  [[ -n "$value" ]] || die "Variavel obrigatoria ausente: $name"
}

need_cmd ssh
need_cmd scp
need_cmd tar
need_cmd gzip

REMOTE_HOST="${REMOTE_HOST:-23.158.72.30}"
REMOTE_PORT="${REMOTE_PORT:-22}"
REMOTE_USER="${REMOTE_USER:-root}"
REMOTE_KEY_PATH="${REMOTE_KEY_PATH:-$HOME/.ssh/id_ed25519}"
REMOTE_APP_DIR="${REMOTE_APP_DIR:-/www/wwwroot/gerar.suafontee.com/hug-buddy}"
REMOTE_DB_HOST="${REMOTE_DB_HOST:-127.0.0.1}"
REMOTE_DB_PORT="${REMOTE_DB_PORT:-7999}"
REMOTE_DB_NAME="${REMOTE_DB_NAME:-xtream_iptvpro}"
REMOTE_DB_USER="${REMOTE_DB_USER:-user_iptvpro}"
REMOTE_DB_PASS="${REMOTE_DB_PASS:-}"
BACKUP_DIR="${BACKUP_DIR:-./backups/producao}"
KEEP_REMOTE_COPY="${KEEP_REMOTE_COPY:-0}"

require_var REMOTE_DB_PASS

[[ -f "$REMOTE_KEY_PATH" ]] || die "Chave SSH nao encontrada: $REMOTE_KEY_PATH"

TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
SAFE_HOST="${REMOTE_HOST//[^a-zA-Z0-9.-]/_}"
LOCAL_DIR="$BACKUP_DIR/$TIMESTAMP-$SAFE_HOST"
REMOTE_TMP_DIR="/tmp/mago-backup-$TIMESTAMP-$$"

mkdir -p "$LOCAL_DIR"

SSH_OPTS=(
  -i "$REMOTE_KEY_PATH"
  -p "$REMOTE_PORT"
  -o BatchMode=yes
  -o ConnectTimeout=20
  -o StrictHostKeyChecking=accept-new
)

cleanup_remote() {
  if [[ "$KEEP_REMOTE_COPY" == "1" ]]; then
    return
  fi

  ssh "${SSH_OPTS[@]}" "$REMOTE_USER@$REMOTE_HOST" \
    "rm -rf '$REMOTE_TMP_DIR'" >/dev/null 2>&1 || true
}

trap cleanup_remote EXIT

printf 'Iniciando backup de producao em %s\n' "$REMOTE_HOST"
printf 'Diretorio remoto: %s\n' "$REMOTE_APP_DIR"
printf 'Banco remoto: %s@%s:%s/%s\n' "$REMOTE_DB_USER" "$REMOTE_DB_HOST" "$REMOTE_DB_PORT" "$REMOTE_DB_NAME"
printf 'Destino local: %s\n' "$LOCAL_DIR"

REMOTE_RESULT="$(
  ssh "${SSH_OPTS[@]}" "$REMOTE_USER@$REMOTE_HOST" bash -s -- \
    "$REMOTE_APP_DIR" \
    "$REMOTE_DB_HOST" \
    "$REMOTE_DB_PORT" \
    "$REMOTE_DB_NAME" \
    "$REMOTE_DB_USER" \
    "$REMOTE_DB_PASS" \
    "$REMOTE_TMP_DIR" \
    "$TIMESTAMP" <<'REMOTE_SCRIPT'
set -Eeuo pipefail

APP_DIR="$1"
DB_HOST="$2"
DB_PORT="$3"
DB_NAME="$4"
DB_USER="$5"
DB_PASS="$6"
TMP_DIR="$7"
STAMP="$8"
APP_BASE="$(basename "$APP_DIR")"

if [[ ! -d "$APP_DIR" ]]; then
  echo "Diretorio de aplicacao nao encontrado: $APP_DIR" >&2
  exit 2
fi

mkdir -p "$TMP_DIR"

APP_ARCHIVE="$TMP_DIR/app-$STAMP.tar.gz"
DB_ARCHIVE="$TMP_DIR/db-$STAMP.sql.gz"
MANIFEST="$TMP_DIR/manifest-$STAMP.json"

tar -czf "$APP_ARCHIVE" \
  --exclude="$APP_BASE/node_modules" \
  --exclude="$APP_BASE/.git" \
  --exclude="$APP_BASE/backups" \
  -C "$(dirname "$APP_DIR")" \
  "$APP_BASE"

MYSQL_PWD="$DB_PASS" mysqldump \
  -h "$DB_HOST" \
  -P "$DB_PORT" \
  -u "$DB_USER" \
  --single-transaction \
  --routines \
  --triggers \
  --events \
  "$DB_NAME" | gzip > "$DB_ARCHIVE"

APP_SIZE="$(du -sh "$APP_ARCHIVE" | awk '{print $1}')"
DB_SIZE="$(du -sh "$DB_ARCHIVE" | awk '{print $1}')"
APP_SHA="$(sha256sum "$APP_ARCHIVE" | awk '{print $1}')"
DB_SHA="$(sha256sum "$DB_ARCHIVE" | awk '{print $1}')"

GIT_SHA=""
if command -v git >/dev/null 2>&1 && git -C "$APP_DIR" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  GIT_SHA="$(git -C "$APP_DIR" rev-parse HEAD 2>/dev/null || true)"
fi

cat > "$MANIFEST" <<EOF_MANIFEST
{
  "timestamp": "$STAMP",
  "app_dir": "$APP_DIR",
  "db_name": "$DB_NAME",
  "db_host": "$DB_HOST",
  "db_port": "$DB_PORT",
  "git_sha": "$GIT_SHA",
  "app_archive": "$(basename "$APP_ARCHIVE")",
  "db_archive": "$(basename "$DB_ARCHIVE")",
  "app_size": "$APP_SIZE",
  "db_size": "$DB_SIZE",
  "app_sha256": "$APP_SHA",
  "db_sha256": "$DB_SHA"
}
EOF_MANIFEST

printf '%s|%s|%s\n' "$APP_ARCHIVE" "$DB_ARCHIVE" "$MANIFEST"
REMOTE_SCRIPT
)"

IFS='|' read -r REMOTE_APP_ARCHIVE REMOTE_DB_ARCHIVE REMOTE_MANIFEST <<<"$REMOTE_RESULT"

[[ -n "${REMOTE_APP_ARCHIVE:-}" && -n "${REMOTE_DB_ARCHIVE:-}" && -n "${REMOTE_MANIFEST:-}" ]] || die "Falha ao obter caminhos dos arquivos remotos."

scp "${SSH_OPTS[@]}" \
  "$REMOTE_USER@$REMOTE_HOST:$REMOTE_APP_ARCHIVE" \
  "$LOCAL_DIR/" >/dev/null

scp "${SSH_OPTS[@]}" \
  "$REMOTE_USER@$REMOTE_HOST:$REMOTE_DB_ARCHIVE" \
  "$LOCAL_DIR/" >/dev/null

scp "${SSH_OPTS[@]}" \
  "$REMOTE_USER@$REMOTE_HOST:$REMOTE_MANIFEST" \
  "$LOCAL_DIR/" >/dev/null

FINAL_ARCHIVE="$LOCAL_DIR/backup-producao-$TIMESTAMP-$SAFE_HOST.tar.gz"
tar -czf "$FINAL_ARCHIVE" -C "$LOCAL_DIR" \
  "$(basename "$REMOTE_APP_ARCHIVE")" \
  "$(basename "$REMOTE_DB_ARCHIVE")" \
  "$(basename "$REMOTE_MANIFEST")"

printf '\nBackup concluido com sucesso.\n'
printf 'Pacote final: %s\n' "$FINAL_ARCHIVE"
printf 'Manifesto: %s\n' "$LOCAL_DIR/$(basename "$REMOTE_MANIFEST")"
