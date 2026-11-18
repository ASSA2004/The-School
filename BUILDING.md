# SCHOOL deliverables

The source ZIP includes the React Native/Expo SDK 58 project, lockfile, tests, design notes and generated Android project. Downloaded dependencies and generated build caches are excluded.

## Run the source

```sh
npm ci
npm start
```

## Build a standalone Android test APK

Install Java 21 and the Android SDK. Set JAVA_HOME and ANDROID_HOME, then run:

```powershell
cd android
.\gradlew.bat assembleRelease -PreactNativeArchitectures=arm64-v8a
```

The output is `android/app/build/outputs/apk/release/app-release.apk`.
The provided APK targets 64-bit ARM Android phones, contains its JavaScript/assets, and does not require Expo Go or Metro.
It uses the generated Android test signing key. Use a private production signing key for store distribution.

School records, approvals, messages and role switching remain a local frontend simulation. No school backend or real message delivery is included.

Download QR links hosted from a computer work only while its download server is running and the phone can reach that computer on the same network. They are not permanent public links.
