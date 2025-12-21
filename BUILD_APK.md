# Building APK for Client Testing

This guide explains how to generate an APK file that you can share with your client for testing.

## Prerequisites

1. **Expo Account** (free): Sign up at https://expo.dev
2. **EAS CLI**: Install the Expo Application Services CLI
   ```bash
   npm install -g eas-cli
   ```

## Method 1: EAS Build (Recommended - Cloud Build)

This method builds the APK in the cloud. No Android SDK required on your machine.

### Step 1: Install EAS CLI

```bash
npm install -g eas-cli
```

### Step 2: Login to Expo

```bash
eas login
```

### Step 3: Configure Build

The `eas.json` file is already configured. You can build with:

```bash
# Build APK for testing (preview build)
eas build --platform android --profile preview
```

Or for production:

```bash
# Build production APK
eas build --platform android --profile production
```

### Step 4: Download APK

After the build completes (usually 10-15 minutes), you'll get a download link. You can also:

1. Visit https://expo.dev/accounts/[your-account]/builds
2. Download the APK file
3. Share it with your client

### Step 5: Share with Client

The client can install the APK by:
1. Enabling "Install from unknown sources" on their Android device
2. Transferring the APK file to their device
3. Opening the APK file and installing it

---

## Method 2: Local Build (Alternative)

If you prefer to build locally or don't want to use EAS, you can build the APK on your machine.

### Prerequisites

1. **Android Studio** installed
2. **Android SDK** configured
3. **Java JDK** installed

### Step 1: Generate Android Native Project

```bash
npx expo prebuild --platform android
```

### Step 2: Build APK

```bash
cd android
./gradlew assembleRelease
```

The APK will be located at:
```
android/app/build/outputs/apk/release/app-release.apk
```

### Step 3: Sign the APK (Required for Play Store)

For testing, you can use a debug keystore. For production/Play Store, you'll need a proper signing key.

**Debug APK (for testing only):**
```bash
cd android
./gradlew assembleDebug
```
APK location: `android/app/build/outputs/apk/debug/app-debug.apk`

**Release APK (signed):**
1. Create a keystore (first time only):
   ```bash
   keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
   ```

2. Configure signing in `android/app/build.gradle`:
   ```gradle
   android {
       ...
       signingConfigs {
           release {
               storeFile file('my-release-key.keystore')
               storePassword 'YOUR_STORE_PASSWORD'
               keyAlias 'my-key-alias'
               keyPassword 'YOUR_KEY_PASSWORD'
           }
       }
       buildTypes {
           release {
               signingConfig signingConfigs.release
           }
       }
   }
   ```

3. Build signed APK:
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

---

## App Information

- **App Name**: Restro Print Agent
- **Package Name**: com.restro.printagent
- **Version**: 1.0.0

## Notes

- **For Testing**: Use the preview build profile (Method 1) or debug APK (Method 2)
- **For Play Store**: Use production build profile (Method 1) or signed release APK (Method 2)
- The APK file size will be approximately 20-30 MB
- Make sure your client's device has Android 5.0 (API 21) or higher

## Troubleshooting

### EAS Build Issues

- **"No account found"**: Run `eas login` first
- **Build fails**: Check the build logs at https://expo.dev
- **APK too large**: This is normal for React Native apps with native modules

### Local Build Issues

- **"Command not found: gradlew"**: Make sure you're in the `android` directory
- **"SDK not found"**: Install Android SDK via Android Studio
- **Build errors**: Check that all dependencies are installed (`yarn install`)

## Next Steps for Play Store

When ready to deploy to Play Store:

1. **Create a Play Store listing** at https://play.google.com/console
2. **Generate a signed APK/AAB** using production build profile
3. **Upload to Play Store** using `eas submit` or manually upload the APK/AAB
4. **Complete store listing** (screenshots, description, etc.)
5. **Submit for review**

For Play Store, you might want to build an **AAB (Android App Bundle)** instead of APK:

```bash
eas build --platform android --profile production --type app-bundle
```
