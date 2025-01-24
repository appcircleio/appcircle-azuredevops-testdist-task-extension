#!/bin/env bash

# shellcheck shell=bash
set -euo pipefail

echo "Publish Token: $(echo "$PUBLISH_TOKEN" | cut -c1-3)...***"
echo
echo "=== Runtime Dependencies ==="
echo "npm: $(npm -v)"
echo "node: $(node -v)"
echo "yarn: $(yarn -v)"
if command -v tsc &>/dev/null; then
  echo "tsc: OK"
  npm ls -g | grep typescript
fi
if command -v tfx &>/dev/null; then
  echo "tfx: OK"
  npm ls -g | grep tfx-cli
fi
echo


exit 0
