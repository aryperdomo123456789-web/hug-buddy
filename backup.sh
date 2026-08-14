#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="$ROOT_DIR/.backups"
STAMP="$(date +%Y%m%d-%H%M%S)"
BRANCH_NAME="backup/${STAMP}"

mkdir -p "$BACKUP_DIR"

cd "$ROOT_DIR"

git rev-parse --is-inside-work-tree >/dev/null 2>&1 || {
  echo "Este diretório não parece ser um repositório Git."
  exit 1
}

# Salva o estado atual do working tree sem alterar o main.
git status --short > "$BACKUP_DIR/status-${STAMP}.txt"
git diff > "$BACKUP_DIR/diff-${STAMP}.patch"
git diff --staged > "$BACKUP_DIR/staged-${STAMP}.patch"

# Cria uma branch apontando para o commit atual, sem alterar o main.
git branch "$BRANCH_NAME" >/dev/null 2>&1 || true

echo "Backup criado com sucesso."
echo "Branch local: $BRANCH_NAME"
echo "Status salvo em: $BACKUP_DIR/status-${STAMP}.txt"
echo "Diff salvo em: $BACKUP_DIR/diff-${STAMP}.patch"
echo "Staged salvo em: $BACKUP_DIR/staged-${STAMP}.patch"
