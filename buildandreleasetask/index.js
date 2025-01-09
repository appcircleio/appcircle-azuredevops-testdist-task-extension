"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadServiceHeaders = exports.appcircleApi = void 0;
exports.getToken = getToken;
exports.createDistributionProfile = createDistributionProfile;
exports.getDistributionProfiles = getDistributionProfiles;
exports.getProfileId = getProfileId;
exports.uploadArtifact = uploadArtifact;
exports.checkTaskStatus = checkTaskStatus;
var tl = require("azure-pipelines-task-lib/task");
var axios_1 = require("axios");
var fs = require("fs");
var FormData = require("form-data");
function run() {
    return __awaiter(this, void 0, void 0, function () {
        var personalAPIToken, profileName, createProfileIfNotExists, appPath, message, validExtensions, fileExtension, loginResponse, profileIdFromName, uploadResponse, err_1;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 7, , 8]);
                    personalAPIToken = tl.getInputRequired("personalAPIToken");
                    profileName = tl.getInputRequired("profileName");
                    createProfileIfNotExists = (_a = tl.getBoolInput("createProfileIfNotExists")) !== null && _a !== void 0 ? _a : false;
                    appPath = tl.getInputRequired("appPath");
                    message = (_b = tl.getInput("message")) !== null && _b !== void 0 ? _b : "";
                    validExtensions = [".ipa", ".apk", ".aab", ".zip"];
                    fileExtension = appPath.slice(appPath.lastIndexOf(".")).toLowerCase();
                    if (!validExtensions.includes(fileExtension)) {
                        tl.setResult(tl.TaskResult.Failed, "Invalid file extension for '".concat(appPath, "'. Please use one of the following:\n") +
                            "- Android: .apk or .aab\n" +
                            "- iOS: .ipa or .zip(.xcarchive)");
                        return [2 /*return*/];
                    }
                    // Validate if the file exists
                    if (!fs.existsSync(appPath)) {
                        tl.setResult(tl.TaskResult.Failed, "The specified file '".concat(appPath, "' does not exist."));
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, getToken(personalAPIToken)];
                case 1:
                    loginResponse = _c.sent();
                    console.log("Logged in to Appcircle successfully");
                    UploadServiceHeaders.token = loginResponse.access_token;
                    return [4 /*yield*/, getProfileId(profileName, createProfileIfNotExists)];
                case 2:
                    profileIdFromName = _c.sent();
                    return [4 /*yield*/, uploadArtifact({
                            message: message,
                            app: appPath,
                            distProfileId: profileIdFromName,
                        })];
                case 3:
                    uploadResponse = _c.sent();
                    if (!!uploadResponse.taskId) return [3 /*break*/, 4];
                    tl.setResult(tl.TaskResult.Failed, "Task ID is not found in the upload response");
                    return [3 /*break*/, 6];
                case 4: return [4 /*yield*/, checkTaskStatus(loginResponse.access_token, uploadResponse.taskId)];
                case 5:
                    _c.sent();
                    console.log("".concat(appPath, " uploaded to Appcircle successfully"));
                    _c.label = 6;
                case 6:
                    tl.setResult(tl.TaskResult.Succeeded, "".concat(appPath, " uploaded to Appcircle successfully"));
                    return [3 /*break*/, 8];
                case 7:
                    err_1 = _c.sent();
                    console.log(err_1);
                    tl.setResult(tl.TaskResult.Failed, err_1.message);
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/];
            }
        });
    });
}
run();
/* API */
function getToken(pat) {
    return __awaiter(this, void 0, void 0, function () {
        var params, response, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    params = new URLSearchParams();
                    params.append("pat", pat);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, axios_1.default.post("https://auth.appcircle.io/auth/v1/token", params.toString(), {
                            headers: {
                                accept: "application/json",
                                "content-type": "application/x-www-form-urlencoded",
                            },
                        })];
                case 2:
                    response = _a.sent();
                    return [2 /*return*/, response.data];
                case 3:
                    error_1 = _a.sent();
                    if (axios_1.default.isAxiosError(error_1)) {
                        console.error("Axios error:", error_1.message);
                        if (error_1.response) {
                            console.error("Response data:", error_1.response.data);
                            console.error("Response status:", error_1.response.status);
                        }
                    }
                    else {
                        console.error("Unexpected error:", error_1);
                    }
                    throw error_1;
                case 4: return [2 /*return*/];
            }
        });
    });
}
var API_HOSTNAME = "https://api.appcircle.io";
exports.appcircleApi = axios_1.default.create({
    baseURL: API_HOSTNAME.endsWith("/") ? API_HOSTNAME : "".concat(API_HOSTNAME, "/"),
});
var UploadServiceHeaders = /** @class */ (function () {
    function UploadServiceHeaders() {
    }
    UploadServiceHeaders.token = "";
    UploadServiceHeaders.getHeaders = function () {
        var response = {
            accept: "application/json",
            "User-Agent": "Appcircle Github Action",
        };
        response.Authorization = "Bearer ".concat(UploadServiceHeaders.token);
        return response;
    };
    return UploadServiceHeaders;
}());
exports.UploadServiceHeaders = UploadServiceHeaders;
function createDistributionProfile(name) {
    return __awaiter(this, void 0, void 0, function () {
        var response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, exports.appcircleApi.post("distribution/v2/profiles", { name: name }, {
                        headers: UploadServiceHeaders.getHeaders(),
                    })];
                case 1:
                    response = _a.sent();
                    return [2 /*return*/, response.data];
            }
        });
    });
}
function getDistributionProfiles() {
    return __awaiter(this, void 0, void 0, function () {
        var distributionProfiles;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, exports.appcircleApi.get("distribution/v2/profiles", {
                        headers: UploadServiceHeaders.getHeaders(),
                    })];
                case 1:
                    distributionProfiles = _a.sent();
                    return [2 /*return*/, distributionProfiles.data];
            }
        });
    });
}
function getProfileId(profileName, createProfileIfNotExists) {
    return __awaiter(this, void 0, void 0, function () {
        var profiles, profileId, _i, profiles_1, profile, newProfile;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getDistributionProfiles()];
                case 1:
                    profiles = _a.sent();
                    profileId = null;
                    for (_i = 0, profiles_1 = profiles; _i < profiles_1.length; _i++) {
                        profile = profiles_1[_i];
                        if (profile.name === profileName) {
                            profileId = profile.id;
                            break;
                        }
                    }
                    if (profileId === null && !createProfileIfNotExists) {
                        throw new Error("Error: The test profile '".concat(profileName, "' could not be found. The option 'createProfileIfNotExists' is set to false, so no new profile was created. To automatically create a new profile if it doesn't exist, set 'createProfileIfNotExists' to true."));
                    }
                    if (!(profileId === null && createProfileIfNotExists)) return [3 /*break*/, 3];
                    return [4 /*yield*/, createDistributionProfile(profileName)];
                case 2:
                    newProfile = _a.sent();
                    if (!newProfile || newProfile === null) {
                        throw new Error("Error: The new profile could not be created.");
                    }
                    console.log("New profile created: ".concat(newProfile.name));
                    profileId = newProfile.id;
                    _a.label = 3;
                case 3:
                    if (!profileId) {
                        throw new Error("Error: The profile ID is not found.");
                    }
                    return [2 /*return*/, profileId];
            }
        });
    });
}
function uploadArtifact(options) {
    return __awaiter(this, void 0, void 0, function () {
        var data, uploadResponse;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    data = new FormData();
                    data.append("Message", options.message);
                    data.append("File", fs.createReadStream(options.app));
                    return [4 /*yield*/, exports.appcircleApi.post("distribution/v2/profiles/".concat(options.distProfileId, "/app-versions"), data, {
                            maxContentLength: Infinity,
                            maxBodyLength: Infinity,
                            headers: __assign(__assign(__assign({}, UploadServiceHeaders.getHeaders()), data.getHeaders()), { "Content-Type": "multipart/form-data;boundary=" + data.getBoundary() }),
                        })];
                case 1:
                    uploadResponse = _a.sent();
                    return [2 /*return*/, uploadResponse.data];
            }
        });
    });
}
function checkTaskStatus(token_1, taskId_1) {
    return __awaiter(this, arguments, void 0, function (token, taskId, currentAttempt) {
        var response, res, error_2;
        if (currentAttempt === void 0) { currentAttempt = 0; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, exports.appcircleApi.get("/task/v1/tasks/".concat(taskId), {
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: "Bearer ".concat(token),
                            },
                        })];
                case 1:
                    response = _a.sent();
                    res = response.data;
                    if (((res === null || res === void 0 ? void 0 : res.stateValue) == 0 || (res === null || res === void 0 ? void 0 : res.stateValue) == 1) &&
                        currentAttempt < 100) {
                        return [2 /*return*/, checkTaskStatus(token, taskId, currentAttempt + 1)];
                    }
                    else if ((res === null || res === void 0 ? void 0 : res.stateValue) === 2) {
                        throw new Error("Build Upload Task Failed: ".concat(res.stateName));
                    }
                    return [3 /*break*/, 3];
                case 2:
                    error_2 = _a.sent();
                    if (error_2 instanceof Error) {
                        throw new Error("Error checking task status: ".concat(error_2.message));
                    }
                    else {
                        throw new Error("Error checking task status: ".concat(String(error_2)));
                    }
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
