"use strict";
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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
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
exports.__esModule = true;
var tl = require("azure-pipelines-task-lib/task");
var child_process_1 = require("child_process");
function run() {
    var _a;
    return __awaiter(this, void 0, void 0, function () {
        var accessToken, profileId, appPath, message, inputs_1;
        return __generator(this, function (_b) {
            try {
                accessToken = tl.getInputRequired("accessToken");
                profileId = tl.getInputRequired("profileId");
                appPath = tl.getInputRequired("appPath");
                message = (_a = tl.getInput("message")) !== null && _a !== void 0 ? _a : "";
                inputs_1 = {
                    accessToken: isVariableName(accessToken)
                        ? tl.getVariable(accessToken)
                        : accessToken,
                    profileId: isVariableName(profileId)
                        ? tl.getVariable(profileId)
                        : profileId,
                    appPath: isVariableName(appPath) ? tl.getVariable(appPath) : appPath,
                    message: isVariableName(message) ? tl.getVariable(message) : message
                };
                console.log("Access Token From Variable: ", inputs_1.accessToken);
                console.log("ProfileID: ", inputs_1.profileId);
                console.log("appPath: ", inputs_1.appPath);
                console.log("Message: ", inputs_1.message);
                installACNpmPackage(function () {
                    appcircleLogin(inputs_1.accessToken, function () {
                        uploadArtifact(inputs_1);
                    });
                });
                tl.setResult(tl.TaskResult.Succeeded, "Artifact Uploaded Successfully!");
            }
            catch (err) {
                tl.setResult(tl.TaskResult.Failed, err.message);
            }
            return [2 /*return*/];
        });
    });
}
run();
function installACNpmPackage(callback) {
    (0, child_process_1.exec)("npm install -g @appcircle/cli", function (error) {
        if (error) {
            console.log("error: ".concat(error.message));
            tl.setResult(tl.TaskResult.Failed, error.message);
            return;
        }
        callback();
    });
}
function appcircleLogin(accessToken, callback) {
    (0, child_process_1.exec)("appcircle login --pat=".concat(accessToken), function (error) {
        if (error) {
            console.log("error: ".concat(error.message));
            tl.setResult(tl.TaskResult.Failed, error.message);
            return;
        }
        callback();
    });
}
function isVariableName(input) {
    var variablePrefix = "$(";
    var variableSuffix = ")";
    if (input.startsWith(variablePrefix) && input.endsWith(variableSuffix)) {
        return true;
    }
    return false;
}
function uploadArtifact(inputs) {
    (0, child_process_1.exec)("appcircle testing-distribution upload --app=".concat(inputs === null || inputs === void 0 ? void 0 : inputs.appPath, " --distProfileId=").concat(inputs === null || inputs === void 0 ? void 0 : inputs.profileId, " --message=\"").concat(inputs === null || inputs === void 0 ? void 0 : inputs.message, "\""), function (error) {
        console.log("Upload callback");
        if (error) {
            console.log("error: ".concat(error.message));
            tl.setResult(tl.TaskResult.Failed, error.message);
        }
    });
}
