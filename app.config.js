module.exports = ({ config }) => ({
  ...config,
  name: "Restro Print Agent",
  slug: "restro-print-agent",
  version: "1.0.0",
  android: {
    ...(config.android || {}),
    package: "com.restro.printagent",
    permissions: [
      "INTERNET",
      "ACCESS_NETWORK_STATE",
      "FOREGROUND_SERVICE",
      "RECEIVE_BOOT_COMPLETED" // For auto-start on boot
    ],
    // Allow cleartext (HTTP) traffic for development/testing
    // WARNING: Only use HTTP on trusted networks, not in production
    usesCleartextTraffic: true
  }
});


