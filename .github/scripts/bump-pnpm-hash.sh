#!/usr/bin/env bash
# Sync flake.nix's pnpmDeps.hash to whatever pnpm-lock.yaml currently produces.
# Idempotent: prints "ok" + leaves flake.nix untouched if the hash already matches.
# Shared by ci.yml's trivy job (in-memory only) and bump-pnpm-hash.yml (commits).
#
# Handles two starting states:
#   - hash = "sha256-...";    (the steady-state after a successful bump)
#   - hash = pkgs.lib.fakeHash;  (placeholder a developer leaves in to force a re-bump)
set -euo pipefail

ORIG_QUOTED=$(grep -oP 'hash = "\Ksha256-[A-Za-z0-9+/=]+' flake.nix | head -1 || true)
HAS_FAKEHASH=$(grep -c 'hash = pkgs\.lib\.fakeHash' flake.nix || true)
FAKE='sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA='

if [ -n "$ORIG_QUOTED" ]; then
  # Swap real → FAKE so the FOD build mismatches and prints the real `got:` hash.
  sed -i -E '0,/hash = "sha256-[A-Za-z0-9+\/=]+"/{ s|hash = "sha256-[A-Za-z0-9+\/=]+"|hash = "'"$FAKE"'"| }' flake.nix
elif [ "$HAS_FAKEHASH" -gt 0 ]; then
  : # Already a placeholder; build will mismatch as-is.
else
  echo "::error::No pnpmDeps.hash placeholder (quoted sha256 or pkgs.lib.fakeHash) found in flake.nix"
  exit 1
fi

# Expected to fail with the FOD mismatch — the `got:` line is the real hash.
LOG=$(nix build --impure --no-link --print-build-logs .#d3strukt0rs-portfolio 2>&1 || true)
NEW=$(echo "$LOG" | grep -oP 'got:\s+\Ksha256-[A-Za-z0-9+/=]+' | head -1)

if [ -z "$NEW" ]; then
  if [ -n "$ORIG_QUOTED" ]; then
    # No mismatch — current hash is correct. Restore from FAKE → ORIG.
    sed -i "s|$FAKE|$ORIG_QUOTED|" flake.nix
    echo "ok"
  else
    echo "::error::Build did not produce a got: line; cannot resolve fakeHash"
    exit 1
  fi
else
  if [ -n "$ORIG_QUOTED" ]; then
    sed -i "s|$FAKE|$NEW|" flake.nix
    echo "bumped: $ORIG_QUOTED -> $NEW"
  else
    # Replace the whole `pkgs.lib.fakeHash` expression with the real quoted hash.
    sed -i -E "s|hash = pkgs\.lib\.fakeHash|hash = \"$NEW\"|" flake.nix
    echo "bumped: fakeHash -> $NEW"
  fi
fi
