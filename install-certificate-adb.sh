#!/bin/bash

# Script to install SSL certificate on Android device via ADB
# This method works even when the certificate doesn't have CA:TRUE flag
# Usage: ./install-certificate-adb.sh <certificate-file>
# Example: ./install-certificate-adb.sh server-164.68.118.52-8006.crt

CERT_FILE=${1:-server-164.68.118.52-8006.crt}

if [ ! -f "$CERT_FILE" ]; then
  echo "❌ Certificate file not found: $CERT_FILE"
  echo "Usage: ./install-certificate-adb.sh <certificate-file>"
  exit 1
fi

echo "Installing certificate: $CERT_FILE"
echo ""

# Check if adb is available
if ! command -v adb &> /dev/null; then
  echo "❌ ADB not found. Please install Android SDK Platform Tools."
  echo "   On Mac: brew install android-platform-tools"
  echo "   Or download from: https://developer.android.com/studio/releases/platform-tools"
  exit 1
fi

# Check if device is connected
if ! adb devices | grep -q "device$"; then
  echo "❌ No Android device connected or authorized."
  echo "   Make sure:"
  echo "   1. USB debugging is enabled on your device"
  echo "   2. You've authorized this computer"
  echo "   3. Run 'adb devices' to verify"
  exit 1
fi

echo "✅ Device connected"
echo ""

# Method 1: Try user certificate store (Android 7.0+, no root required)
echo "Attempting installation via user certificate store..."
CERT_NAME=$(basename "$CERT_FILE" .crt | tr '.-' '_')

# Push certificate to device
adb push "$CERT_FILE" /sdcard/Download/ 2>/dev/null || adb push "$CERT_FILE" /storage/emulated/0/Download/ 2>/dev/null

if [ $? -eq 0 ]; then
  echo "✅ Certificate pushed to device"
  echo ""
  echo "📱 On your Android device:"
  echo "   1. Open Settings → Security → Install from storage"
  echo "   2. Navigate to Downloads"
  echo "   3. Select $(basename $CERT_FILE)"
  echo "   4. Select 'CA certificate' when prompted"
  echo "   5. If you still see 'Private key required', try the alternative method below"
  echo ""
  
  # Try to open the certificate installer
  echo "Attempting to open certificate installer..."
  adb shell am start -a android.credentials.INSTALL 2>/dev/null || echo "   (Manual installation required - see steps above)"
else
  echo "❌ Failed to push certificate to device"
  exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "ALTERNATIVE: System Certificate Store (Requires Root)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "If the above method doesn't work, try installing to system store (requires root):"
echo ""
echo "  adb root"
echo "  adb push $CERT_FILE /data/local/tmp/"
echo "  CERT_HASH=\$(openssl x509 -inform PEM -subject_hash_old -in $CERT_FILE -noout | head -1)"
echo "  adb shell \"su -c 'cp /data/local/tmp/$CERT_FILE /system/etc/security/cacerts/\${CERT_HASH}.0'\""
echo "  adb shell \"su -c 'chmod 644 /system/etc/security/cacerts/\${CERT_HASH}.0'\""
echo "  adb reboot"
echo ""
echo "Note: This method requires a rooted device or emulator."
