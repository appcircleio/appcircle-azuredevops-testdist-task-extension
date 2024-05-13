# Appcircle Distribute

A tool designed for distributing test binaries or beta versions efficiently using Appcircle.

## Usage

Effortlessly build your project and deploy your artifact to an Appcircle distribution profile using the following YAML configuration in your Azure DevOps pipeline:

```yaml
- task: AppcircleDistribute@0
  inputs:
    accessToken: "APPCIRCLE_ACCESS_TOKEN" # Your Appcircle Access Token
    profileId: "APPCIRCLE_PROFILE_ID" # ID of your Appcircle Distribution Profile
    appPath: "BUILD_PATH" # Path to your iOS .ipa or .xcarchive, or Android APK or App Bundle
    message: "Sample Message" # Custom message for your testers
```

### Leveraging Environment Variables

Utilize environment variables seamlessly by substituting the parameters with `$(VARIABLE_NAME)` in your task inputs. The extension automatically retrieves values from the specified environment variables within your pipeline.

### Reference

For details on generating an Appcircle Personal Access Token, visit [Generating/Managing Personal API Tokens](https://docs.appcircle.io/appcircle-api/api-authentication#generatingmanaging-the-personal-api-tokens)

To create or learn more about Appcircle testing and distribution profiles, please refer to [Creating or Selecting a Distribution Profile](https://docs.appcircle.io/distribute/create-or-select-a-distribution-profile)
