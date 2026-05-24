#!/usr/bin/env bash
# Scan TypeScript source for comments in violation of the no-comments policy.
# Usage: ./find-comments.sh [path]
# Defaults to scanning src/ if no path is given.

set -euo pipefail

SCAN_PATH="${1:-src}"

if [ ! -d "$SCAN_PATH" ]; then
  echo "Directory not found: $SCAN_PATH" >&2
  exit 2
fi

echo "Scanning $SCAN_PATH for comments..."
echo

# Find single-line, block, and TSDoc/JSDoc comments in .ts files.
# Excludes the shebang-equivalent and eslint-disable directives (tolerated).
matches="$(
  find "$SCAN_PATH" -type f -name '*.ts' -not -path '*/node_modules/*' -print0 \
  | xargs -0 grep -nE '^\s*(//|/\*|\*)' \
  | grep -vE '//\s*(eslint-disable|eslint-enable|@ts-' \
  || true
)"

if [ -z "$matches" ]; then
  echo "No comments found. Code is self-documenting."
  exit 0
fi

count="$(echo "$matches" | wc -l | tr -d ' ')"
echo "Found $count comment line(s):"
echo
echo "$matches"
echo
echo "REMINDER: This project has a NO COMMENTS policy."
echo "Refactor these into self-documenting code (extract functions, name booleans, named constants)."
exit 1
