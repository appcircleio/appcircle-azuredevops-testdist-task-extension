# Appcircle Distribute

Appcircle, enterprise-Grade Fully Automated Mobile DevOps Platform, simplifies the testing distribution of builds to test groups. With comprehensive control over distribution details such as testers and build access, our platform ensures additionally secure authentication via username/password. If you want to get support or more information please [contact us](https://appcircle.io/contact)

Efficiently distribute test binaries or beta versions using Appcircle, featuring seamless IPA distribution, APK distribution capabilities. Streamline your testing process with our versatile tool designed to optimize your distribution workflow

## Exploring Testing Distribution

Testing distribution is a proccess distrubiting test builds to designated test groups or individuals. This fast-speed proccess allows developer to gather fast feedback, identify bugs and ensure quality of the software applications before releasing to customers. Test distribution module inside appcircle allows developers to create test groups and share the desired build with related groups or individual by providing email/password authentication additionaly.

## Benefits of Using Testing Distribution

Continuously featuring a development or a bug fix is curisial to ship to end users for giving best experience. For that reason agile teams requires to have a excellent flow of distributing builds. Without using a distribution tool you would need to deal with stores distribution headaches such as waiting for approval for distributing build to test users.

Using tools like appcircle allows you to manage testing groups, establish limits who can access the build by setting an username/passoword. More importantly you can distribute the build bloody-fast without dealing with approve proccess like TestFlight

## Getting Started with the Extension: Usage Guide

Effortlessly build your project and deploy your artifact to an Appcircle distribution profile using the following YAML configuration in your Azure DevOps pipeline:

### Testing Distribution

In order to share your builds with testers, you can create distribution profiles and assign testing groups to the distribution profiles.

![Distribution Profile](images/distribution-start.png)

### Generating/Managing the Personal API Tokens

To generate a Personal API Token, go to the My Organization screen in the Appcircle dashboard. The Personal API Token section is located on the top right.

Press the "Generate Token" button to generate your first token.

![Token Generation](images/PAT.png)

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
