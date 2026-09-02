#!/usr/bin/env bash
# Appcircle Testing Distribution - Azure DevOps extension packaging script
# Usage:
#   ./build-vsix.sh            # default: uses configs/release.json
#   ./build-vsix.sh dev        # uses configs/dev.json (for release/* branches)
set -euo pipefail

# Always run from the repo root, regardless of where the script is invoked
cd "$(dirname "$0")"

# Pick the tfx overrides config based on the argument
CONFIG="configs/release.json"
if [ "${1:-}" = "dev" ]; then
    CONFIG="configs/dev.json"
fi

# Fail fast if the selected config does not exist
if [ ! -f "$CONFIG" ]; then
    echo "Error: $CONFIG not found"
    exit 1
fi

# Print the runtime versions so a failed build can be diagnosed quickly
echo "=== Runtime ==="
echo "node: $(node -v)"
echo "npm:  $(npm -v)"
# Yarn is required by the install steps below
command -v yarn >/dev/null || { echo "Error: yarn is not installed (npm i -g yarn)"; exit 1; }
echo "yarn: $(yarn -v)"
echo

echo "=== Install dependencies ==="
# Root deps include tfx-cli and typescript; task deps are bundled into the vsix
yarn install
(cd buildandreleasetask && yarn install)
echo

echo "=== Compile TypeScript (tsc) ==="
# Produces buildandreleasetask/index.js from index.ts
yarn package
echo

echo "=== Create VSIX ($CONFIG) ==="
# Prefer the locally installed tfx-cli; fall back to npx if not present
if [ -x node_modules/.bin/tfx ]; then
    TFX="node_modules/.bin/tfx"
else
    TFX="npx tfx"
fi
$TFX extension create --manifest-globs vss-extension.json --overrides-file "$CONFIG" --base-path .
echo

echo "=== Result ==="
ls -lh *.vsix
echo
echo "Done. See RELEASE-SELF-HOSTED.md for installing on a self-hosted Azure DevOps Server."
