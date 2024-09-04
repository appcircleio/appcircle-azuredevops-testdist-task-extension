import * as tl from "azure-pipelines-task-lib/task";
import axios, { AxiosRequestConfig } from "axios";
import * as fs from "fs";
import * as FormData from "form-data";

async function run() {
  try {
    const personalAPIToken = tl.getInputRequired("personalAPIToken");
    const profileName = tl.getInputRequired("profileName");
    const createProfileIfNotExists =
      tl.getBoolInput("createProfileIfNotExists") ?? false;
    const appPath = tl.getInputRequired("appPath");
    const message = tl.getInput("message") ?? "";

    const validExtensions = [".ipa", ".apk", ".aab", ".zip"];
    const fileExtension = appPath.slice(appPath.lastIndexOf(".")).toLowerCase();
    if (!validExtensions.includes(fileExtension)) {
      tl.setResult(
        tl.TaskResult.Failed,
        `Invalid file extension for '${appPath}'. Please use one of the following:\n` +
          `- Android: .apk or .aab\n` +
          `- iOS: .ipa or .zip(.xcarchive)`
      );
      return;
    }

    // Validate if the file exists
    if (!fs.existsSync(appPath)) {
      tl.setResult(
        tl.TaskResult.Failed,
        `The specified file '${appPath}' does not exist.`
      );
      return;
    }

    const loginResponse = await getToken(personalAPIToken);
    console.log("Logged in to Appcircle successfully");
    UploadServiceHeaders.token = loginResponse.access_token;
    const profileIdFromName = await getProfileId(
      profileName,
      createProfileIfNotExists
    );

    const uploadResponse = await uploadArtifact({
      message,
      app: appPath,
      distProfileId: profileIdFromName,
    });
    if (!uploadResponse.taskId) {
      tl.setResult(
        tl.TaskResult.Failed,
        "Task ID is not found in the upload response"
      );
    } else {
      await checkTaskStatus(loginResponse.access_token, uploadResponse.taskId);
      console.log(`${appPath} uploaded to Appcircle successfully`);
    }

    tl.setResult(
      tl.TaskResult.Succeeded,
      `${appPath} uploaded to Appcircle successfully`
    );
  } catch (err: any) {
    console.log(err);
    tl.setResult(tl.TaskResult.Failed, err.message);
  }
}

run();

/* API */

export async function getToken(pat: string): Promise<any> {
  const params = new URLSearchParams();
  params.append("pat", pat);

  try {
    const response = await axios.post(
      "https://auth.appcircle.io/auth/v1/token",
      params.toString(),
      {
        headers: {
          accept: "application/json",
          "content-type": "application/x-www-form-urlencoded",
        },
      }
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Axios error:", error.message);
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
      }
    } else {
      console.error("Unexpected error:", error);
    }
    throw error;
  }
}

const API_HOSTNAME = "https://api.appcircle.io";
export const appcircleApi = axios.create({
  baseURL: API_HOSTNAME.endsWith("/") ? API_HOSTNAME : `${API_HOSTNAME}/`,
});

export class UploadServiceHeaders {
  static token = "";

  static getHeaders = (): AxiosRequestConfig["headers"] => {
    let response: AxiosRequestConfig["headers"] = {
      accept: "application/json",
      "User-Agent": "Appcircle Github Action",
    };

    response.Authorization = `Bearer ${UploadServiceHeaders.token}`;

    return response;
  };
}

export async function createDistributionProfile(name: string) {
  const response = await appcircleApi.post(
    `distribution/v2/profiles`,
    { name: name },
    {
      headers: UploadServiceHeaders.getHeaders(),
    }
  );
  return response.data;
}

export async function getDistributionProfiles() {
  const distributionProfiles = await appcircleApi.get(
    `distribution/v2/profiles`,
    {
      headers: UploadServiceHeaders.getHeaders(),
    }
  );
  return distributionProfiles.data;
}

export async function getProfileId(
  profileName: string,
  createProfileIfNotExists: boolean
): Promise<string> {
  const profiles = await getDistributionProfiles();
  let profileId: string | null = null;

  for (const profile of profiles) {
    if (profile.name === profileName) {
      profileId = profile.id;
      break;
    }
  }

  if (profileId === null && !createProfileIfNotExists) {
    throw new Error(
      `Error: The test profile '${profileName}' could not be found. The option 'createProfileIfNotExists' is set to false, so no new profile was created. To automatically create a new profile if it doesn't exist, set 'createProfileIfNotExists' to true.`
    );
  }

  if (profileId === null && createProfileIfNotExists) {
    const newProfile = await createDistributionProfile(profileName);
    if (!newProfile || newProfile === null) {
      throw new Error("Error: The new profile could not be created.");
    }

    console.log(`New profile created: ${newProfile.name}`);
    profileId = newProfile.id;
  }

  if (!profileId) {
    throw new Error("Error: The profile ID is not found.");
  }

  return profileId;
}

export async function uploadArtifact(options: {
  message: string;
  app: string;
  distProfileId: string;
}) {
  const data = new FormData();
  data.append("Message", options.message);
  data.append("File", fs.createReadStream(options.app));

  const uploadResponse = await appcircleApi.post(
    `distribution/v2/profiles/${options.distProfileId}/app-versions`,
    data,
    {
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      headers: {
        ...UploadServiceHeaders.getHeaders(),
        ...data.getHeaders(),
        "Content-Type": "multipart/form-data;boundary=" + data.getBoundary(),
      },
    }
  );

  return uploadResponse.data;
}

export async function checkTaskStatus(
  token: string,
  taskId: string,
  currentAttempt = 0
) {
  try {
    const response = await appcircleApi.get(`/task/v1/tasks/${taskId}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const res = response.data;
    if (
      (res?.stateValue == 0 || res?.stateValue == 1) &&
      currentAttempt < 100
    ) {
      return checkTaskStatus(token, taskId, currentAttempt + 1);
    } else if (res?.stateValue === 2) {
      throw new Error(`Build Upload Task Failed: ${res.stateName}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error checking task status: ${error.message}`);
    } else {
      throw new Error(`Error checking task status: ${String(error)}`);
    }
  }
}
