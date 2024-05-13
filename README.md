# Appcircle Distribute

Tool for test/binary/beta distribution using Appcircle

## Usage

Build your project and upload your artifact to appcircle distribution profile.

```yaml
- task: AppcircleDistribute@0
  inputs:
  accessToken: "APPCIRCLE_ACCESS_TOKEN"
  profileId: "APPCIRCLE_PROFILE_ID"
  appPath: "BUILD_PATH" # for iOS .ipa file or .xcarchive file or android apk or app bundle path
  message: "Sample Message" # Message to Testers
```

### Using Environment Variable

To get values from environment variables use `$(VARIABLE_NAME)` variation on task inputs. Extension automatically look value from the given environment on the pipeline

### Reference

Please refer for generating Appcircle [Personal Access Token](https://docs.appcircle.io/appcircle-api/api-authentication#generatingmanaging-the-personal-api-tokens)

Create or learn more about appcircle testing [distribution profile](https://docs.appcircle.io/distribute/create-or-select-a-distribution-profile)
