# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
    npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

## Build android app

We build using eas on the eas servers. Make sure you have eas installed:

```powershell
npm install -g eas-cli
```

And authenticate with an account having access to the project:

```powershell
eas login
```

### Prerequesites

To do builds, first make sure that the eas environment variables are set so that the build root is the app directory, not the repository root.

This is very important, otherwise the whole repo would be uploaded, including the backend and secrets. To prevent this, there is an easignore file in the repository root, so an empty archive is uploaded instead.

For example, in powershell:

```powershell
cd app # if not already in the app directory
$env:EAS_NO_VCS=1
$env:EAS_PROJECT_ROOT=$pwd
```

### Dev build

Dev build uses the locally running node app to show the components, making real time updates possible. Unless configured otherwise, it requires the backend to run on the expo host machine, listening on 0.0.0.0 port 8000, allowed through firewall.

```powershell
eas build --platform android --profile development
```

### Production build

Creates a release apk as a fully functional app. By default uses the deployed API on Google Cloud.

```powershell
eas build --platform android --profile development
```
