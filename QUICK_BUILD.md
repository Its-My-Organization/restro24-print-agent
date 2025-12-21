# Quick APK Build Guide

## Build APK for Client Testing

Since you're already logged into Expo, you can build the APK right away!

### Step 1: Build the APK

Run this command in your terminal:

```bash
yarn build:apk:preview
```

Or:

```bash
eas build --platform android --profile preview
```

### Step 2: Wait for Build

- Build time: **10-15 minutes**
- You'll see a build URL in the terminal
- You can also monitor progress at: https://expo.dev/accounts/dailotechs/projects/restro24-print-agent/builds

### Step 3: Download APK

Once the build completes:

1. **Option A**: Click the download link in the terminal
2. **Option B**: Visit https://expo.dev/accounts/dailotechs/projects/restro24-print-agent/builds
3. Download the `.apk` file

### Step 4: Share with Client

1. Send the APK file to your client
2. Client needs to:
   - Enable "Install from unknown sources" on their Android device
   - Transfer APK to device
   - Open and install

---

## App Configuration

✅ **App Name**: Restro Print Agent  
✅ **Package**: com.restro.printagent  
✅ **Version**: 1.0.0  
✅ **Min Android**: 5.0 (API 21)  
✅ **Target Android**: 13 (API 33)  

**Permissions Configured**:
- INTERNET
- ACCESS_NETWORK_STATE
- FOREGROUND_SERVICE
- RECEIVE_BOOT_COMPLETED
- WAKE_LOCK

---

## For Production/Play Store

When ready for Play Store deployment:

```bash
yarn build:aab
```

This creates an Android App Bundle (AAB) required for Play Store.

---

## Troubleshooting

**Build fails?**
- Check build logs at https://expo.dev
- Make sure you're logged in: `eas whoami`
- Verify project ID matches in `app.config.js`

**Need to update version?**
- Update `version` in `app.config.js`
- Update `versionCode` for Android (increment by 1)
