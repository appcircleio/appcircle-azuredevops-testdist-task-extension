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

echo "=== Update Dependencies ==="
yarn install
cd buildandreleasetask/
yarn install
cd ..
echo

echo "=== Build Package ==="
yarn package

echo "=== Create Extension ==="
if [ "$BRANCH_NAME" == "main" ]; then
    configuration="configs/release.json"
elif [[ "$BRANCH_NAME" =~ ^release.* ]]; then
    configuration="configs/dev.json"
else
    echo "Branch $BRANCH_NAME is not configured for release."
    exit 1
fi

tfx extension create --manifest-globs vss-extension.json --overrides-file $configuration

exit 0
