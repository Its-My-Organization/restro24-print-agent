## Restro Print Agent (Android, Expo)

This is a lightweight React Native / Expo application that runs as a **print agent** for Restro24.
It behaves like the Windows `PrintGateway` service, but on Android phones/tablets.

### 📚 Documentation

- **[Quick Start](./QUICK_START.md)** - Get started in 5 minutes
- **[Comprehensive Documentation](./COMPREHENSIVE_DOCUMENTATION.md)** - Complete reference for developers
- **[Architecture Overview](./ARCHITECTURE.md)** - System design and data flow
- **[Android Setup Guide](./ANDROID_SETUP.md)** - Production deployment instructions

From the backend's perspective it is just another `PrintAgent`:

- Uses the existing `/api/printagent/register`, `/poll`, `/complete`, `/fail` endpoints
- Works with the same `PrintJobs` / `PrintAgents` tables
- Does **not** require any changes to your .NET business logic

### Features

- Periodically polls the cloud API for print jobs for a specific restaurant
- Sends the server-generated ESC/POS content to network printers over TCP (port 9100)
- Marks jobs as completed/failed via existing APIs
- Persists configuration on the device (restaurant ID, API URL, API key, printer IPs)
- Can run background polling via Expo Background Fetch (Android)

### Project layout

- `App.tsx` – loads a simple configuration screen and starts the print agent
- `src/config` – configuration model and AsyncStorage helpers
- `src/api` – HTTP client and print-agent API wrappers
- `src/services`
  - `agentService.ts` – polling loop and job processing
  - `printerService.ts` – TCP printing to ESC/POS printers
  - `backgroundTask.ts` – Expo Background Fetch integration
- `src/screens/ConfigScreen.tsx` – UI to configure restaurant and printer settings

### Running locally (high level)

1. Install dependencies:

   ```bash
   cd print-agent-expo
   npm install
   ```

2. Build a development client for Android (required for the TCP socket native module):

   ```bash
   npx expo run:android
   ```

3. Start Metro:

   ```bash
   npm start
   ```

4. On the Android device:
   - Open the dev client you built in step 2
   - Connect to the Metro bundler
   - The `ConfigScreen` will appear

5. Configure:
   - **Restaurant ID** – e.g. `3`
   - **Cloud API Base URL** – e.g. `https://restro24api.dailotech.com`
   - **API Key** – same as `CloudApi:ApiKey` / `PrintGateway` API key
   - **Agent ID** – optional stable ID (otherwise `Android-<restaurantId>` is used)
   - **Agent Name** – label visible in your backend
   - **Kitchen / Bar Printer IPs** – LAN IPs of your ESC/POS printers

6. Tap **Save & Start Agent**:
   - The app saves the config
   - Registers the agent with the cloud API
   - Starts the polling loop to process print jobs
   - Registers a background task so Android can wake the agent periodically

### Notes

- All order formatting and business rules stay in the backend.  
  This app only:
  - polls for `PrintJob` records
  - sends the provided `Content` bytes to the printer
  - reports completion/failure

- If you change ticket formatting or print routing in .NET, the Android agent does **not** need code changes as long as the `/api/printagent` contract stays the same.

## Additional Setup Required for Production

For production deployment on Android devices, see **`ANDROID_SETUP.md`** for:
- SSL certificate handling (for self-signed certs)
- Battery optimization settings (critical for background operation)
- Auto-start on boot configuration
- Network permissions
- Troubleshooting guide


