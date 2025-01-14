import * as tl from "azure-pipelines-task-lib/task";
import axios, { Axios, AxiosInstance, AxiosRequestConfig } from "axios";
import * as fs from "fs";
import * as FormData from "form-data";
import * as https from 'https';

async function run() {
  try {
    const personalAPIToken = tl.getInputRequired("personalAPIToken");
    const authEndpoint = tl.getInput("authEndpoint") ?? "https://auth.appcircle.io";
    const apiEndpoint = tl.getInput("apiEndpoint") ?? "https://api.appcircle.io";
    const sslCertificatePath = tl.getInput("sslCertificatePath") ?? "";
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

    // If SSL certificate path is provided, check file existance
    if (sslCertificatePath && !fs.existsSync(sslCertificatePath)) {
      tl.setResult(
        tl.TaskResult.Failed,
        `The specified certificate file '${appPath}' does not exist.`
      );
      return;
    }
    // Create custom https agent
    var customHttpsAgent;
    if(sslCertificatePath) {
      customHttpsAgent = new https.Agent({
        ca: fs.readFileSync(sslCertificatePath),
        rejectUnauthorized: true
      });
    }

    // Create Appcircle API instance
    const apiEndpointUrl = new URL(apiEndpoint).toString();
    const appcircleApi = axios.create({
      baseURL: apiEndpointUrl,
    });
    if(customHttpsAgent) {
      appcircleApi.defaults.httpsAgent = customHttpsAgent;
    }

    const loginResponse = await getToken(personalAPIToken, authEndpoint, customHttpsAgent);
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

export async function getToken(pat: string, authEndpoint: string, customHttpsAgent?: https.Agent): Promise<any> {
  const params = new URLSearchParams();
  params.append("pat", pat);

  try {
    const url = new URL('/auth/v1/token', authEndpoint).toString();
    const api = axios.create();
    if(customHttpsAgent) {
      api.defaults.httpsAgent = customHttpsAgent;
    }
    
    const response = await api.post(
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

// let API_HOSTNAME = "https://api.appcircle.io";
// export function configureApiEndpoint(endpoint: string) {
//   API_HOSTNAME = endpoint;
// }

// export const appcircleApi = axios.create({
//   baseURL: "",  // Will be set for each request
// });

// // Modify the existing appcircleApi.post and appcircleApi.get calls to use API_HOSTNAME
// appcircleApi.interceptors.request.use((config) => {
//   config.baseURL = API_HOSTNAME.endsWith("/") ? API_HOSTNAME : `${API_HOSTNAME}/`;
//   return config;
// });

// const apiEndpointUrl = new URL(apiEndpoint).toString();
// export const appcircleApi = axios.create({
//   baseURL: apiEndpointUrl,
// });

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
  const data = new FormData();
  data.append("Message", options.message);
  data.append("File", fs.createReadStream(options.app));

  const uploadResponse = await api.post(
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
