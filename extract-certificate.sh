#!/bin/bash

# Script to extract SSL certificate from server for Android installation
# Usage: ./extract-certificate.sh <host> <port>
# Example: ./extract-certificate.sh 164.68.118.52 8006

HOST=${1:-164.68.118.52}
PORT=${2:-8006}
OUTPUT_FILE="server-${HOST}-${PORT}.crt"
DER_FILE="server-${HOST}-${PORT}.der.crt"

echo "Extracting SSL certificate from ${HOST}:${PORT}..."
echo "Output file: ${OUTPUT_FILE}"
echo ""

# Extract certificate
openssl s_client -showcerts -connect ${HOST}:${PORT} < /dev/null 2>/dev/null | \
  openssl x509 -outform PEM > ${OUTPUT_FILE}

if [ $? -eq 0 ]; then
  # Also create DER format (Android sometimes handles this better)
  openssl x509 -inform PEM -outform DER -in ${OUTPUT_FILE} -out ${DER_FILE} 2>/dev/null
  
  echo "✅ Certificate extracted successfully!"
  echo ""
  
  # Check if certificate has CA:TRUE flag
  HAS_CA_FLAG=$(openssl x509 -in ${OUTPUT_FILE} -text -noout 2>/dev/null | grep -i "CA:TRUE" | wc -l | tr -d ' ')
  
  if [ "$HAS_CA_FLAG" = "0" ]; then
    echo "⚠️  WARNING: This certificate doesn't have CA:TRUE flag."
    echo "   Android may require a private key or reject it."
    echo "   Try Method 2 (ADB installation) below, or use Method 3 (DER format)."
    echo ""
  fi
  
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "INSTALLATION METHODS:"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "METHOD 1: Manual Installation (GUI)"
  echo "─────────────────────────────────────"
  echo "1. Transfer ${OUTPUT_FILE} to your Android device"
  echo "2. On Android: Settings → Security → Install from storage"
  echo "3. Select ${OUTPUT_FILE}"
  echo "4. IMPORTANT: When prompted 'Install a certificate', select 'CA certificate'"
  echo "   (NOT 'Wi-Fi certificate' or 'VPN & app user certificate')"
  echo "5. If you see 'Private key required' error, use Method 2 or 3 instead"
  echo "6. Name it (e.g., 'Restro API Certificate')"
  echo "7. Restart the app"
  echo ""
  echo "METHOD 2: ADB Installation (Recommended if Method 1 fails)"
  echo "───────────────────────────────────────────────────────────"
  echo "This method forces installation as a CA certificate:"
  echo ""
  echo "  adb root"
  echo "  adb push ${OUTPUT_FILE} /data/local/tmp/"
  echo "  adb shell \"su -c 'mount -o remount,rw /system'\""
  echo "  adb shell \"su -c 'cp /data/local/tmp/${OUTPUT_FILE} /system/etc/security/cacerts/$(openssl x509 -inform PEM -subject_hash_old -in ${OUTPUT_FILE} -noout 2>/dev/null | head -1).0'\""
  echo "  adb reboot"
  echo ""
  echo "OR (simpler, for Android 7.0+):"
  echo "  adb push ${OUTPUT_FILE} /sdcard/Download/"
  echo "  adb shell am start -a android.credentials.INSTALL"
  echo "  # Then manually select the file in the GUI"
  echo ""
  echo "METHOD 3: Try DER Format"
  echo "────────────────────────"
  echo "Some Android versions handle DER format better:"
  echo "1. Transfer ${DER_FILE} to your Android device"
  echo "2. On Android: Settings → Security → Install from storage"
  echo "3. Select ${DER_FILE}"
  echo "4. Select 'CA certificate' when prompted"
  echo ""
  echo "For Android Emulator:"
  echo "  adb push ${OUTPUT_FILE} /sdcard/Download/"
  echo "  # Then use Method 1 or 2 above"
  echo ""
else
  echo "❌ Failed to extract certificate"
  echo "Make sure:"
  echo "1. The server is running and accessible"
  echo "2. You have openssl installed (brew install openssl on Mac, apt-get install openssl on Linux)"
  exit 1
fi

