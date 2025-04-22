import * as tl from "azure-pipelines-task-lib/task";
import axios, { Axios, AxiosInstance, AxiosRequestConfig } from "axios";
import * as fs from "fs";
import * as FormData from "form-data";
import * as path from 'path';

async function run() {
  try {
    const personalAPIToken = tl.getInputRequired("personalAPIToken");
    const authEndpoint = tl.getInput("authEndpoint") ?? "https://auth.appcircle.io";
    const apiEndpoint = tl.getInput("apiEndpoint") ?? "https://api.appcircle.io";
    const profileName = tl.getInputRequired("profileName");
    const createProfileIfNotExists =
      tl.getBoolInput("createProfileIfNotExists") ?? false;
    const appPath = tl.getInputRequired("appPath");
    const message = tl.getInput("message") ?? "";

    const validExtensions = [".ipa", ".apk", ".aab"];
    const fileExtension = appPath.slice(appPath.lastIndexOf(".")).toLowerCase();
    if (!validExtensions.includes(fileExtension)) {
      tl.setResult(
        tl.TaskResult.Failed,
        `Invalid file extension for '${appPath}'. Please use one of the following:\n` +
          `- Android: .apk or .aab\n` +
          `- iOS: .ipa`
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

    // Create Appcircle API instance
    const apiEndpointUrl = new URL(apiEndpoint).toString();
    const appcircleApi = axios.create({
      baseURL: apiEndpointUrl,
    });

    const loginResponse = await getToken(personalAPIToken, authEndpoint);
    console.log("Logged in to Appcircle successfully");
    UploadServiceHeaders.token = loginResponse.access_token;
    const profileIdFromName = await getProfileId(
      appcircleApi,
      profileName,
      createProfileIfNotExists
    );

    const uploadResponse = await uploadArtifact(
      appcircleApi,
      {
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
      await checkTaskStatus(appcircleApi, loginResponse.access_token, uploadResponse.taskId);
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

export async function getToken(pat: string, authEndpoint: string): Promise<any> {
  const params = new URLSearchParams();
  params.append("pat", pat);

  try {
    const url = new URL('/auth/v1/token', authEndpoint).toString();
    const response = await axios.post(
      url,
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

export async function createDistributionProfile(api: AxiosInstance, name: string) {
  const response = await api.post(
    `distribution/v2/profiles`,
    { name: name },
    {
      headers: UploadServiceHeaders.getHeaders(),
    }
  );
  return response.data;
}

export async function getDistributionProfiles(api: AxiosInstance) {
  const distributionProfiles = await api.get(
    `distribution/v2/profiles`,
    {
      headers: UploadServiceHeaders.getHeaders(),
    }
  );
  return distributionProfiles.data;
}

export async function getProfileId(
  api: AxiosInstance,
  profileName: string,
  createProfileIfNotExists: boolean
): Promise<string> {
  const profiles = await getDistributionProfiles(api);
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
    const newProfile = await createDistributionProfile(api, profileName);
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

export async function uploadArtifact(
  api: AxiosInstance,
  options: {
    message: string;
    app: string;
    distProfileId: string;
  }) {

  const filePath = options.app
  const fileStat = fs.statSync(filePath)
  const fileName = path.basename(filePath)
  const fileSize = fileStat.size

  console.log("Getting file upload information...")
  const uploadInfoResponse = await api.get<{
    fileId: string;
    uploadUrl: string;
  }>(
    `distribution/v1/profiles/${options.distProfileId}/app-versions`,
    {
      params: {
        action: 'uploadInformation',
        fileName: fileName,
        fileSize: fileSize
      },
      headers: UploadServiceHeaders.getHeaders()
    }
  );
  if (uploadInfoResponse.status < 200 || uploadInfoResponse.status >= 300) {
    throw new Error("Failed to retrieve file upload information with status code: " + uploadInfoResponse.status)
  }
  console.log("File upload information retrieved successfully with status code:", uploadInfoResponse.status)


  const { fileId, uploadUrl } = uploadInfoResponse.data;

  const fileContent = fs.readFileSync(filePath);

  console.log("Uploading file to Appcircle...")
  const uploadResponse = await axios.put(uploadUrl, fileContent, {
    headers: {
      'Content-Type': 'application/octet-stream'
    },
    maxContentLength: Infinity,
    maxBodyLength: Infinity
  });
  if (uploadResponse.status < 200 || uploadResponse.status >= 300) {
    throw new Error("Failed to upload file with status code: " + uploadResponse.status)
  }
  console.log("File upload finished successfully with status code:", uploadResponse.status)

  console.log("Committing file upload...")
  const commitResponse = await api.post<{
    taskId: string;
  }>(
    `distribution/v1/profiles/${options.distProfileId}/app-versions`,
    {
      fileId: fileId,
      fileName: fileName,
      message: options.message
    },
    {
      params: {
        action: 'commitFileUpload'
      },
      headers: UploadServiceHeaders.getHeaders()
    }
  );
  if (commitResponse.status < 200 || commitResponse.status >= 300) {
    throw new Error("Failed to commit file upload with status code: " + commitResponse.status)
  }
  console.log("File upload committed successfully with status code:", commitResponse.status)

  return commitResponse.data;

}

export async function checkTaskStatus(
  api: AxiosInstance,
  token: string,
  taskId: string,
  currentAttempt = 0
) {
  try {
    const response = await api.get(`/task/v1/tasks/${taskId}`, {
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
      return checkTaskStatus(api, token, taskId, currentAttempt + 1);
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
