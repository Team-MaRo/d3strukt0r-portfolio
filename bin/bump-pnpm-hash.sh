#!/usr/bin/env bash
# Sync flake.nix's pnpmDeps.hash to whatever pnpm-lock.yaml currently produces.
# Idempotent: prints "ok" + leaves flake.nix untouched if the hash already matches.
# Shared by ci.yml's trivy job (in-memory only) and bump-pnpm-hash.yml (commits).
set -euo pipefail

ORIG=$(grep -oP 'hash = "\Ksha256-[A-Za-z0-9+/=]+' flake.nix | head -1)
[ -n "$ORIG" ] || { echo "::error::No pnpmDeps.hash found in flake.nix"; exit 1; }

FAKE='sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA='
sed -i -E '0,/hash = "sha256-[A-Za-z0-9+\/=]+"/{ s|hash = "sha256-[A-Za-z0-9+\/=]+"|hash = "'"$FAKE"'"| }' flake.nix

# Expected to fail with the FOD mismatch — the `got:` line is the real hash.
LOG=$(nix build --impure --no-link --print-build-logs .#d3strukt0rs-portfolio 2>&1 || true)
NEW=$(echo "$LOG" | grep -oP 'got:\s+\Ksha256-[A-Za-z0-9+/=]+' | head -1)

if [ -n "$NEW" ] && [ "$NEW" != "$ORIG" ]; then
  sed -i "s|$FAKE|$NEW|" flake.nix
  echo "bumped: $ORIG -> $NEW"
else
  sed -i "s|$FAKE|$ORIG|" flake.nix
  echo "ok"
fi
