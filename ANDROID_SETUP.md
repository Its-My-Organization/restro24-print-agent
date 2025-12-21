# Android Print Agent - Additional Setup Guide

## Overview

This guide covers additional setup steps needed to make the Android print agent work reliably on mobile devices, especially for restaurants that keep tablets always-on at the counter.

## 1. SSL Certificate Handling

### Problem
If your cloud API uses a **self-signed SSL certificate** (like `https://restro24api.dailotech.com`), Android will reject the connection by default.

### Solutions

#### Option A: Install Certificate on Device (Recommended for Production)

**Method 1: GUI Installation (Try this first)**
1. Download your server's SSL certificate (`.crt` or `.pem` file)
   - Use the provided script: `./extract-certificate.sh <host> <port>`
2. On Android device: **Settings → Security → Install from storage**
3. Select the certificate file
4. **IMPORTANT**: When Android shows "Install a certificate" with three options:
   - ✅ Select **"CA certificate"** (this is correct - no private key needed)
   - ❌ Do NOT select "Wi-Fi certificate" (requires private key)
   - ❌ Do NOT select "VPN & app user certificate" (requires private key)
5. If you see **"Private key required to install a certificate"** error:
   - This means the certificate doesn't have the `CA:TRUE` flag
   - Try **Method 2** (DER format) or **Method 3** (ADB installation) below
6. Name it (e.g., "Restro API Certificate")
7. Restart the app

**Method 2: Try DER Format**
Some Android versions handle DER format better:
1. The extraction script automatically creates a `.der.crt` file
2. Transfer `server-<host>-<port>.der.crt` to your Android device
3. Follow steps 2-7 from Method 1 above

**Method 3: ADB Installation (If Methods 1 & 2 fail)**
Use the provided ADB installation script:
```bash
./install-certificate-adb.sh server-<host>-<port>.crt
```
This script will guide you through the installation process.

**Troubleshooting: "Private key required" error**
- This happens when the server certificate doesn't have `CA:TRUE` in its Basic Constraints
- The extraction script will warn you if this is the case
- Solutions:
  1. Try the DER format (Method 2)
  2. Use ADB installation (Method 3)
  3. For development: Use HTTP instead of HTTPS (see Option B)
  4. For production: Get server admin to create a proper CA certificate with `CA:TRUE` flag

#### Option B: Use HTTP for Development (Not Recommended for Production)
- Change `cloudApiBaseUrl` in config to use `https://` instead of `https://`
- **Warning**: This is insecure and should only be used in trusted networks

#### Option C: Use Proper CA-Signed Certificate (Best Practice)
- Get a proper SSL certificate from Let's Encrypt or another CA
- This is the best long-term solution

## 2. Battery Optimization

Android aggressively kills background apps to save battery. You need to **disable battery optimization** for this app.

### Steps:
1. **Settings → Apps → Restro Print Agent**
2. Tap **Battery** or **Power usage**
3. Select **Unrestricted** or **Don't optimize**
4. Some devices: **Settings → Battery → Battery optimization → Restro Print Agent → Don't optimize**

### Why This Matters
Without this, Android will kill the app when the screen is off, stopping print jobs.

## 3. Auto-Start on Boot

The app should automatically start when the device reboots (useful for power outages).

### Implementation
The `expo-background-fetch` with `startOnBoot: true` handles this, but you may need to:

1. **Enable "Auto-start"** permission (varies by manufacturer):
   - **Xiaomi**: Settings → Permissions → Autostart → Enable
   - **Huawei**: Settings → Apps → Launch → Enable
   - **Samsung**: Usually enabled by default
   - **OnePlus**: Settings → Apps → Special access → Autostart → Enable

2. **Test**: Reboot device and verify the app starts automatically

## 4. Keep Screen On (Optional)

For tablets that stay plugged in, you may want to keep the screen on:

### Add to `App.tsx`:
```tsx
import { useKeepAwake } from 'expo-keep-awake';

// Inside your component:
useKeepAwake();
```

Install: `npx expo install expo-keep-awake`

## 5. Network Permissions

The app needs network access. These are already in `app.config.js`:
- `INTERNET`
- `ACCESS_NETWORK_STATE`

Verify they're granted on first launch.

## 6. Foreground Service Notification

The app shows a persistent notification "Print Agent Running" to keep it alive in the background.

- **Don't dismiss this notification** - it keeps the app running
- It's low-priority (no sound/vibration)
- You can minimize it to the notification shade

## 7. Testing Checklist

Before deploying to a restaurant:

- [ ] App starts automatically after device reboot
- [ ] App continues running when screen is off
- [ ] App survives battery optimization
- [ ] SSL certificate is installed (if using self-signed cert)
- [ ] Can connect to cloud API (test registration)
- [ ] Can print to network printer (test print job)
- [ ] Background task is registered (check notification)
- [ ] Network connectivity is detected correctly

## 8. Troubleshooting

### App Stops After Screen Off
- **Fix**: Disable battery optimization (see #2)
- **Fix**: Ensure foreground service notification is showing

### SSL Certificate Error
- **Fix**: Install certificate on device (see #1)
- **Fix**: Check if API URL is correct

### Print Jobs Not Processing
- **Check**: Agent status screen - is agent running?
- **Check**: Network connectivity
- **Check**: Printer IP addresses are correct
- **Check**: Printer is on same network as tablet
- **Check**: Printer port 9100 is open

### App Doesn't Auto-Start on Boot
- **Fix**: Enable auto-start permission (see #3)
- **Fix**: Verify `startOnBoot: true` in background task config

## 9. Production Deployment

For each restaurant tablet:

1. **Install the app** (via APK or Play Store)
2. **Configure once**:
   - Restaurant ID
   - API URL & Key
   - Printer IPs
   - Agent ID (stable, e.g., `KitchenTab-1`)
3. **Disable battery optimization**
4. **Enable auto-start** (if needed)
5. **Install SSL certificate** (if using self-signed)
6. **Start agent** and verify it's running
7. **Keep tablet plugged in** and connected to Wi-Fi
8. **Test**: Create an order and verify print job is processed

## 10. Monitoring

Use the **Status Screen** in the app to monitor:
- Agent running status
- Registration retry count
- Current configuration

For server-side monitoring, check your existing `PrintAgents` and `PrintJobs` tables in the database.

