#!/bin/bash

# Script to extract SSL certificate from server for Android installation
# Usage: ./extract-certificate.sh <host> <port>
# Example: ./extract-certificate.sh 164.68.118.52 8006

HOST=${1:-164.68.118.52}
PORT=${2:-8006}
OUTPUT_FILE="server-${HOST}-${PORT}.crt"

echo "Extracting SSL certificate from ${HOST}:${PORT}..."
echo "Output file: ${OUTPUT_FILE}"
echo ""

# Extract certificate
openssl s_client -showcerts -connect ${HOST}:${PORT} < /dev/null 2>/dev/null | \
  openssl x509 -outform PEM > ${OUTPUT_FILE}

if [ $? -eq 0 ]; then
  echo "✅ Certificate extracted successfully!"
  echo ""
  echo "Next steps:"
  echo "1. Transfer ${OUTPUT_FILE} to your Android device"
  echo "2. On Android: Settings → Security → Install from storage"
  echo "3. Select ${OUTPUT_FILE}"
  echo "4. Install as USER certificate (not just view)"
  echo "5. Restart the app"
  echo ""
  echo "For Android Emulator:"
  echo "  adb push ${OUTPUT_FILE} /sdcard/Download/"
  echo "  Then install from Settings → Security → Install from storage"
else
  echo "❌ Failed to extract certificate"
  echo "Make sure:"
  echo "1. The server is running and accessible"
  echo "2. You have openssl installed (brew install openssl on Mac, apt-get install openssl on Linux)"
  exit 1
fi

