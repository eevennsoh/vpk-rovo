#!/usr/bin/env bash
set -euo pipefail

if ! command -v qmd >/dev/null 2>&1; then
	echo "qmd is not installed; Personal Graph will use grep fallback."
	exit 0
fi

VAULT="${PERSONAL_GRAPH_VAULT:-/Users/esoh/Documents/Obsidian Vault/Graph}"
COLLECTION="${PERSONAL_GRAPH_QMD_COLLECTION:-personal-graph}"

qmd status >/dev/null 2>&1 || true
qmd collection add "$VAULT/wiki" --name "$COLLECTION" >/dev/null 2>&1 || true
qmd embed --collection "$COLLECTION"
