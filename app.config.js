module.exports = ({ config }) => ({
  ...config,
  name: "Restro Print Agent",
  slug: "restro24-print-agent",
  version: "1.0.0",
  owner: "dailotechs",
  extra: {
    eas: {
      projectId: "5e1f307d-eb50-47dd-87c2-31bd1f90c0a0"
    }
  },
  android: {
    ...(config.android || {}),
    package: "com.restro.printagent",
    versionCode: 1,
    // adaptiveIcon: {
    //   foregroundImage: "./assets/adaptive-icon.png",
    //   backgroundColor: "#ffffff"
    // },
    permissions: [
      "INTERNET",
      "ACCESS_NETWORK_STATE",
      "FOREGROUND_SERVICE",
      "RECEIVE_BOOT_COMPLETED",
      "WAKE_LOCK"
    ],
    // Allow cleartext (HTTP) traffic for development/testing
    // WARNING: Only use HTTP on trusted networks, not in production
    usesCleartextTraffic: true,
    // Minimum Android version
    minSdkVersion: 21,
    // Target SDK version (Android 13)
    targetSdkVersion: 33,
    // Compile SDK version
    compileSdkVersion: 33
  },
  // App orientation
  orientation: "portrait",
  // Icon and splash screen (optional - Expo will use defaults if not provided)
  // icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  // splash: {
  //   image: "./assets/splash.png",
  //   resizeMode: "contain",
  //   backgroundColor: "#ffffff"
  // }
});
