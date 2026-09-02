# Releasing for Self-Hosted Azure DevOps Server

This document explains how to package the Appcircle Testing Distribution extension (vsix) and install it on a **self-hosted** Azure DevOps Server.

## Prerequisites

- Node.js 18+ and npm
- Yarn (`npm i -g yarn`)
- `tfx-cli` (a devDependency in the root `package.json`; installed by `yarn install`)

## 1. Package the Extension (build the vsix)

From the repo root:

```bash
./build-vsix.sh
```

The script performs the following steps in order:

1. `yarn install` (root + `buildandreleasetask`) — installs dependencies
2. `yarn package` — compiles TypeScript (`tsc`), producing `buildandreleasetask/index.js`
3. `tfx extension create --manifest-globs vss-extension.json --overrides-file configs/release.json` — generates the `.vsix` file

For dev/test builds (uses `configs/dev.json`):

```bash
./build-vsix.sh dev
```

The output is `Appcircle.build-release-task-<version>.vsix` in the repo root.

> **Versioning:** bump the version in `vss-extension.json` (`"version"`) and
> `buildandreleasetask/task.json` (`"version"`) before packaging. Both must stay in sync.

## 2. Install on the Self-Hosted Azure DevOps Server

1. Sign in to the self-hosted Azure DevOps Server → **Extensions** (`https://<your-server>/_extensions/manage`)
2. Click **Upload extension**
3. Select the generated `.vsix` file and upload it
4. **Enable** the extension at enterprise or project level if needed

### If someone else performs the upload

The upload must be done by a user with extension management permissions on the server. In that case, simply pass the generated `.vsix` file (e.g. `Appcircle.build-release-task-<version>.vsix`) to that person — it is a self-contained package, no other files are needed — and they can upload it using the steps above.
