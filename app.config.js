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
    ]
  }
});


