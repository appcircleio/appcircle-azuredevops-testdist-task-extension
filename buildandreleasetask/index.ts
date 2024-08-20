import tl = require("azure-pipelines-task-lib/task");
import { exec } from "child_process";

interface IInputs {
  accessToken?: string;
  profileId?: string;
  appPath?: string;
  message?: string;
}

async function run() {
  try {
    const accessToken = tl.getInputRequired("accessToken");
    const profileId = tl.getInputRequired("profileId");
    const appPath = tl.getInputRequired("appPath");
    const message = tl.getInput("message") ?? "";

    const inputs = {
      accessToken: isVariableName(accessToken)
        ? tl.getVariable(accessToken)
        : accessToken,
      profileId: isVariableName(profileId)
        ? tl.getVariable(profileId)
        : profileId,
      appPath: isVariableName(appPath) ? tl.getVariable(appPath) : appPath,
      message: isVariableName(message) ? tl.getVariable(message) : message,
    };

    installACNpmPackage(() => {
      appcircleLogin(inputs.accessToken, () => {
        uploadArtifact(inputs);
      });
    });

    tl.setResult(tl.TaskResult.Succeeded, "Artifact Uploaded Successfully!");
  } catch (err: any) {
    tl.setResult(tl.TaskResult.Failed, err.message);
  }
}

run();

function installACNpmPackage(callback: () => void) {
  exec("npm install -g @appcircle/cli", (error) => {
    if (error) {
      console.log(`error: ${error.message}`);
      tl.setResult(tl.TaskResult.Failed, error.message);
      return;
    }

    callback();
  });
}

function appcircleLogin(accessToken: string | undefined, callback: () => void) {
  exec(`appcircle login --pat=${accessToken}`, (error) => {
    if (error) {
      console.log(`error: ${error.message}`);
      tl.setResult(tl.TaskResult.Failed, error.message);
      return;
    }

    callback();
  });
}

function isVariableName(input: string): boolean {
  const variablePrefix = "$(";
  const variableSuffix = ")";
  if (input.startsWith(variablePrefix) && input.endsWith(variableSuffix)) {
    return true;
  }

  return false;
}

function uploadArtifact(inputs: IInputs | undefined) {
  exec(
    `appcircle testing-distribution upload --app=${inputs?.appPath} --distProfileId=${inputs?.profileId} --message="${inputs?.message}"`,
    (error) => {
      console.log("Upload callback");
      if (error) {
        console.log(`error: ${error.message}`);
        tl.setResult(tl.TaskResult.Failed, error.message);
      }
    }
  );
}
