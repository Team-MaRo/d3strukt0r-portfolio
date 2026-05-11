#!/usr/bin/env bash
# Run a CI command and stream its stdout+stderr to BOTH the workflow's
# job log and `$GITHUB_STEP_SUMMARY` (wrapped in a collapsible <details>
# block titled $1). Preserves the command's exit code so the calling
# step's `continue-on-error: true` records the real outcome — letting a
# trailing gate step re-derive the job's pass/fail without losing the
# per-step output.
#
# Usage: bash .github/scripts/summarize-step.sh "Title" cmd arg1 arg2 ...

set -o pipefail

TITLE="$1"
shift

{
  echo
  echo "### $TITLE"
  echo
  echo '<details open><summary>Output</summary>'
  echo
  echo '```text'
} >> "$GITHUB_STEP_SUMMARY"

"$@" 2>&1 | tee -a "$GITHUB_STEP_SUMMARY"
EC=${PIPESTATUS[0]}

{
  echo '```'
  echo
  echo '</details>'
} >> "$GITHUB_STEP_SUMMARY"

exit "$EC"
