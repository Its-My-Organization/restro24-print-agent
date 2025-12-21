# Restro24 Print Agent - Android App Documentation

## Table of Contents
1. [Overview](#overview)
2. [Purpose & Business Context](#purpose--business-context)
3. [Architecture & Integration](#architecture--integration)
4. [Technical Stack](#technical-stack)
5. [Project Structure](#project-structure)
6. [Core Components](#core-components)
7. [API Contracts](#api-contracts)
8. [Configuration](#configuration)
9. [Setup & Development](#setup--development)
10. [Deployment](#deployment)
11. [Current Implementation Status](#current-implementation-status)
12. [Known Issues & Limitations](#known-issues--limitations)
13. [Future Enhancements](#future-enhancements)
14. [Troubleshooting](#troubleshooting)
15. [Developer Notes](#developer-notes)

---

## Overview

**Restro24 Print Agent** is a React Native (Expo) Android application that acts as a **print agent** for the Restro24 restaurant management system. It enables restaurants without Windows PCs to print KOT (Kitchen Order Ticket) and BOT (Bar Order Ticket) receipts directly from Android tablets/phones to network ESC/POS printers.

### Key Characteristics
- **Lightweight**: Minimal UI, focused on background operation
- **Queue-based**: Polls cloud API for print jobs (no push notifications needed)
- **Network printing**: Sends raw ESC/POS commands to printers over TCP (port 9100)
- **Background operation**: Runs continuously even when app is in background
- **Zero backend changes**: Uses existing REST APIs and database schema

---

## Purpose & Business Context

### Problem Statement
Restro24 is a cloud-based restaurant management system. When orders are created, KOT/BOT tickets need to be printed on local network printers at each restaurant. The original solution required:
- A Windows PC running a .NET service (`PrintGateway.API`)
- Visual Studio or manual service management
- Complex network setup (ngrok for cloud access)

**Many restaurants don't have Windows PCs** - they only have Android tablets/phones for POS operations.

### Solution
This Android app provides the **same functionality as the Windows service** but runs on Android devices:
- Restaurant staff installs the app on a tablet
- Configures it once (restaurant ID, API URL, printer IPs)
- App runs in background, automatically printing orders
- No PC required, no manual intervention needed

### Business Value
- **Expands market**: Enables restaurants without PCs to use Restro24
- **Lower cost**: No need for dedicated Windows machines
- **Easier deployment**: Just install an app on existing Android devices
- **Same reliability**: Uses the same proven queue-based architecture

---

## Architecture & Integration

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Restro24 Cloud API                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  PrintAgentController                                 │  │
│  │  - /api/printagent/register                           │  │
│  │  - /api/printagent/poll                                │  │
│  │  - /api/printagent/complete                            │  │
│  │  - /api/printagent/fail                                │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  PrintQueueService                                    │  │
│  │  - Enqueues print jobs (PrintJob table)              │  │
│  │  - Assigns jobs to agents                            │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Database Tables                                     │  │
│  │  - PrintAgents (registered agents)                   │  │
│  │  - PrintJobs (queued print jobs)                     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          ▲
                          │ HTTPS (REST API)
                          │
┌─────────────────────────┴─────────────────────────────────┐
│              Android Print Agent App                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Agent Service (Polling Loop)                        │  │
│  │  - Registers with cloud API                          │  │
│  │  - Polls for jobs every 10 seconds                   │  │
│  │  - Processes jobs and reports status                 │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Printer Service                                     │  │
│  │  - TCP connection to printer IP:9100                 │  │
│  │  - Sends ESC/POS content (from server)              │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Background Services                                 │  │
│  │  - Foreground service (persistent notification)      │  │
│  │  - Background fetch (periodic wake-up)               │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ TCP (Port 9100)
                          │
┌─────────────────────────┴─────────────────────────────────┐
│              Network ESC/POS Printer                       │
│              (Kitchen/Bar Printer)                         │
└─────────────────────────────────────────────────────────────┘
```

### Integration Points

#### 1. **Agent Registration**
- Android app calls `POST /api/printagent/register` on startup
- Creates/updates a `PrintAgent` record with `Platform = Android`
- Same endpoint used by Windows service

#### 2. **Job Polling**
- Android app calls `POST /api/printagent/poll` every 10 seconds (configurable)
- Server returns pending `PrintJob` records for that restaurant
- Jobs are already formatted (ESC/POS content generated by backend)

#### 3. **Job Processing**
- Android app receives `PrintJob.Content` (plain text with ESC/POS commands)
- Sends content directly to printer IP over TCP port 9100
- Reports success/failure via `/complete` or `/fail` endpoints

#### 4. **No Backend Changes Required**
- All business logic (order formatting, ticket generation) stays in .NET backend
- Android app is a "dumb client" that just:
  - Polls for jobs
  - Sends bytes to printer
  - Reports status

---

## Technical Stack

### Core Technologies
- **React Native**: 0.76.3
- **Expo SDK**: ~52.0.0 (Managed workflow with dev client)
- **TypeScript**: 5.6.0
- **Node.js**: 18+ (for development)

### Key Dependencies

#### HTTP & Networking
- `axios`: ^1.7.0 - HTTP client for API calls
- `@react-native-community/netinfo`: ^11.3.1 - Network connectivity monitoring

#### Storage
- `@react-native-async-storage/async-storage`: ^1.23.0 - Local configuration persistence

#### Background Operations
- `expo-background-fetch`: ~13.0.0 - Periodic background task execution
- `expo-task-manager`: ~12.0.0 - Background task definitions
- `expo-notifications`: ~0.32.0 - Foreground service notifications

#### Printing
- `react-native-tcp-socket`: ^5.2.1 - Raw TCP socket for ESC/POS printing
  - **Note**: Requires Expo dev client (native module)

#### Navigation
- `@react-navigation/native`: ^6.1.18 - Navigation framework
- `@react-navigation/bottom-tabs`: ^6.6.1 - Tab navigation
- `react-native-screens`: ~4.1.0 - Native screen components
- `react-native-safe-area-context`: 4.12.0 - Safe area handling

### Why Expo Managed Workflow?
- **Faster development**: No native Android Studio setup needed
- **Easier updates**: OTA updates possible (though not used for native modules)
- **Cross-platform potential**: Can add iOS later with minimal changes
- **Dev client**: Allows native modules (TCP socket) while staying in managed workflow

---

## Project Structure

```
print-agent-expo/
├── App.tsx                          # Main app entry, tab navigation
├── app.config.js                    # Expo configuration (permissions, package name)
├── package.json                     # Dependencies and scripts
├── tsconfig.json                    # TypeScript configuration
│
├── src/
│   ├── config/
│   │   ├── types.ts                 # AppConfig interface
│   │   └── configStore.ts           # AsyncStorage read/write
│   │
│   ├── api/
│   │   ├── client.ts                # Axios instance factory
│   │   ├── printAgentApi.ts         # API wrappers (register, poll, complete, fail)
│   │   └── sslConfig.ts             # SSL certificate handling helpers
│   │
│   ├── services/
│   │   ├── agentService.ts          # Main polling loop and job processing
│   │   ├── printerService.ts        # TCP printing to network printers
│   │   ├── backgroundTask.ts        # Expo background fetch integration
│   │   ├── foregroundService.ts     # Persistent notification service
│   │   └── networkAwareAgent.ts     # Network state handling (optional)
│   │
│   ├── screens/
│   │   ├── ConfigScreen.tsx         # Configuration UI (restaurant ID, API URL, printer IPs)
│   │   └── StatusScreen.tsx         # Agent status monitoring (running/stopped, retry count)
│   │
│   └── hooks/
│       └── useNetworkState.ts       # Network connectivity hook
│
├── README.md                        # Quick start guide
├── ANDROID_SETUP.md                 # Production deployment guide
└── COMPREHENSIVE_DOCUMENTATION.md   # This file
```

---

## Core Components

### 1. Agent Service (`src/services/agentService.ts`)

**Purpose**: Main orchestration - handles agent registration, polling loop, and job processing.

**Key Functions**:
- `startAgent(config)`: Starts the agent lifecycle
  - Registers agent with cloud API (with retry logic)
  - Starts polling loop
- `stopAgent()`: Stops polling and agent operations
- `registerAgentWithRetry(config)`: Registration with retry (5 attempts, then every 5 minutes)

**Polling Logic**:
```typescript
1. Poll /api/printagent/poll every 10 seconds (configurable)
2. For each job received:
   a. Determine printer IP (Kitchen=0, Bar=1)
   b. Send job.content to printer via TCP
   c. On success: POST /api/printagent/complete
   d. On failure: POST /api/printagent/fail with error message
3. Continue polling indefinitely
```

**Error Handling**:
- Registration failures: Retry with exponential backoff
- Polling failures: Swallow errors, continue polling (server logs details)
- Print failures: Report to server, continue with next job

### 2. Printer Service (`src/services/printerService.ts`)

**Purpose**: Low-level TCP communication with ESC/POS printers.

**Key Functions**:
- `getPrinterIpForJob(printerType, config)`: Maps printer type to IP address
- `printToNetworkPrinter(host, port, content)`: Sends content to printer

**Implementation Details**:
- Uses `react-native-tcp-socket` for raw TCP connections
- Connects to `printerIp:9100` (standard ESC/POS port)
- Sends `job.content` as ASCII bytes (content already contains ESC/POS commands from server)
- 5-second connection timeout
- Closes connection after sending

**Note**: The server generates the ESC/POS content (including formatting, line breaks, cut commands). The Android app just sends the bytes.

### 3. API Client (`src/api/printAgentApi.ts`)

**Purpose**: HTTP wrappers for all print agent endpoints.

**Endpoints Used**:
- `POST /api/printagent/register`: Register/update agent
- `POST /api/printagent/poll`: Get pending jobs
- `POST /api/printagent/complete`: Mark job as completed
- `POST /api/printagent/fail`: Mark job as failed

**Request/Response Formats**:
- Matches exactly with Windows service implementation
- Uses `X-API-Key` header for authentication
- All requests include `restaurantId` and `agentId`

### 4. Configuration (`src/config/`)

**Purpose**: Persistent storage of app configuration.

**Configuration Fields**:
- `restaurantId`: Restaurant identifier (integer)
- `cloudApiBaseUrl`: Cloud API URL (e.g., `https://restro24api.dailotech.com`)
- `apiKey`: API authentication key
- `agentId`: Stable agent identifier (defaults to `Android-{restaurantId}`)
- `agentName`: Human-readable agent name
- `printerIpKitchen`: LAN IP of kitchen printer
- `printerIpBar`: LAN IP of bar printer
- `pollIntervalMs`: Polling interval in milliseconds (default: 10000)

**Storage**: Uses `AsyncStorage` (persists across app restarts)

### 5. Background Services

#### Foreground Service (`src/services/foregroundService.ts`)
- Shows persistent notification: "Print Agent Running"
- Keeps app alive in background (Android requirement)
- Updates notification with last job time
- Low priority (no sound/vibration)

#### Background Task (`src/services/backgroundTask.ts`)
- Uses Expo Background Fetch
- Wakes app periodically (minimum 15 minutes, OS-controlled)
- Ensures agent continues even if app is backgrounded
- Auto-starts on device boot (`startOnBoot: true`)

### 6. UI Screens

#### Config Screen (`src/screens/ConfigScreen.tsx`)
- Form for all configuration fields
- Validation before saving
- "Save & Start Agent" button:
  - Saves config to AsyncStorage
  - Starts agent service
  - Registers background task
  - Shows foreground service notification

#### Status Screen (`src/screens/StatusScreen.tsx`)
- Real-time agent status (running/stopped)
- Registration retry count
- Current configuration display
- Start/Stop agent controls

---

## API Contracts

### 1. Register Agent

**Endpoint**: `POST /api/printagent/register`

**Request Body**:
```json
{
  "restaurantId": 3,
  "agentId": "Android-3",
  "agentName": "Kitchen Tablet",
  "platform": 1,  // 1 = Android (enum: Windows=0, Android=1, iOS=2, Linux=3)
  "version": "1.0.0",
  "hostAddress": "AndroidDevice",
  "createdBy": "Android-3-PrintAgent"
}
```

**Response**:
```json
{
  "success": true,
  "agentId": 123,  // Database ID
  "message": "Agent registered/updated successfully"
}
```

**Behavior**:
- If agent with same `restaurantId` + `agentId` exists: Updates heartbeat, marks as active
- If new: Creates new `PrintAgent` record
- Sets `LastHeartbeat = DateTime.UtcNow`

### 2. Poll for Jobs

**Endpoint**: `POST /api/printagent/poll`

**Request Body**:
```json
{
  "restaurantId": 3,
  "agentId": "Android-3",
  "maxJobs": 5
}
```

**Response**:
```json
[
  {
    "id": 456,
    "restaurantId": 3,
    "printerType": 0,  // 0=Kitchen, 1=Bar
    "content": "Restaurant Name\nAddress\nOrder #123\n...\nKOT",
    "orderId": "123"
  }
]
```

**Behavior**:
- Returns pending jobs for the restaurant
- Assigns jobs to the agent (`AssignedAgentId`)
- Sets `Status = Processing`, `PickedUpAt = DateTime.UtcNow`
- Returns empty array if no jobs

### 3. Complete Job

**Endpoint**: `POST /api/printagent/complete`

**Request Body**:
```json
{
  "jobId": 456,
  "agentId": "Android-3"
}
```

**Response**: `200 OK`

**Behavior**:
- Sets `Status = Completed`, `CompletedAt = DateTime.UtcNow`
- Validates agent owns the job

### 4. Fail Job

**Endpoint**: `POST /api/printagent/fail`

**Request Body**:
```json
{
  "jobId": 456,
  "agentId": "Android-3",
  "errorMessage": "Printer connection timeout"
}
```

**Response**: `200 OK`

**Behavior**:
- Sets `Status = Failed`, `ErrorMessage = {errorMessage}`
- Increments `RetryCount`
- If `RetryCount < MaxRetries`, job can be retried

---

## Configuration

### Initial Setup

1. **Install app** on Android device
2. **Open app** → Config tab
3. **Fill in**:
   - Restaurant ID (from Restro24 system)
   - Cloud API Base URL (e.g., `https://restro24api.dailotech.com`)
   - API Key (same as Windows service uses)
   - Agent ID (optional, defaults to `Android-{restaurantId}`)
   - Agent Name (e.g., "Kitchen Tablet 1")
   - Kitchen Printer IP (LAN IP, e.g., `192.168.1.100`)
   - Bar Printer IP (LAN IP, e.g., `192.168.1.101`)
4. **Tap "Save & Start Agent"**

### Configuration Persistence

- Stored in `AsyncStorage` (survives app restarts)
- Key: `restro-print-agent-config`
- Format: JSON string of `AppConfig` object

### Environment-Specific Settings

**Development**:
- Can use HTTP instead of HTTPS (not recommended)
- Can use test API keys

**Production**:
- Must use HTTPS
- Must install SSL certificate if using self-signed certs
- Use production API keys

---

## Setup & Development

### Prerequisites
- Node.js 18+
- npm or yarn
- Android device or emulator
- Expo CLI: `npm install -g expo-cli`

### Initial Setup

```bash
# 1. Install dependencies
cd print-agent-expo
npm install

# 2. Build Expo dev client (required for native modules)
npx expo run:android

# 3. Start Metro bundler
npm start

# 4. On Android device:
#    - Open the dev client app
#    - Connect to Metro (scan QR code or use LAN URL)
```

### Development Workflow

1. **Make code changes** in `src/`
2. **Save file** → Metro reloads automatically
3. **Test on device** → Changes appear immediately (hot reload)

### Building for Production

```bash
# Build APK
npx expo build:android

# Or build AAB (for Play Store)
npx expo build:android -t app-bundle
```

### Debugging

- **React Native Debugger**: Use Chrome DevTools
- **Logs**: Check Metro bundler console
- **Network**: Use `axios` interceptors or React Native Debugger network tab
- **Agent Status**: Check Status screen in app

---

## Deployment

### Pre-Deployment Checklist

- [ ] SSL certificate installed on device (if using self-signed certs)
- [ ] Battery optimization disabled for app
- [ ] Auto-start permission enabled (device-specific)
- [ ] Network permissions granted
- [ ] Printer IPs verified (ping test)
- [ ] API URL and key verified (test registration)

### Deployment Steps

1. **Build production APK/AAB**
2. **Install on restaurant tablet** (via ADB, file transfer, or Play Store)
3. **Configure app** (see Configuration section)
4. **Start agent** and verify it's running
5. **Test**: Create an order in Restro24 system, verify print job is processed
6. **Monitor**: Check Status screen and server logs

### Post-Deployment

- **Monitor agent status** via Status screen
- **Check server logs** for registration and job processing
- **Verify prints** are working correctly
- **Document agent ID** for restaurant (for troubleshooting)

---

## Current Implementation Status

### ✅ Completed Features

1. **Agent Registration**
   - ✅ Register with cloud API
   - ✅ Retry logic (5 attempts, then every 5 minutes)
   - ✅ Stable agent ID (reuses same agent on restart)

2. **Job Polling**
   - ✅ Polls `/api/printagent/poll` every 10 seconds
   - ✅ Processes multiple jobs per poll
   - ✅ Handles empty responses gracefully

3. **Printing**
   - ✅ TCP connection to network printers (port 9100)
   - ✅ Sends ESC/POS content from server
   - ✅ Handles connection timeouts
   - ✅ Maps printer types (Kitchen/Bar) to IPs

4. **Job Status Reporting**
   - ✅ Reports success via `/api/printagent/complete`
   - ✅ Reports failures via `/api/printagent/fail` with error message

5. **Background Operation**
   - ✅ Foreground service (persistent notification)
   - ✅ Background fetch (periodic wake-up)
   - ✅ Auto-start on boot

6. **Configuration**
   - ✅ Persistent storage (AsyncStorage)
   - ✅ Configuration UI
   - ✅ Validation

7. **Monitoring**
   - ✅ Status screen (running/stopped, retry count)
   - ✅ Real-time updates

8. **Network Awareness**
   - ✅ Network state monitoring hook
   - ⚠️ Network-aware agent (created but not fully integrated)

### ⚠️ Partially Implemented

1. **Network-Aware Agent**: Code exists but not integrated into main flow
   - Should pause polling when offline, resume when online
   - Currently: Polling continues even if offline (fails silently)

2. **SSL Certificate Bypass**: Documentation exists, but React Native can't easily bypass SSL
   - Workaround: Install certificate on device or use proper CA-signed cert

### ❌ Not Implemented (Future)

1. **Bluetooth Printer Support**: Currently only network (TCP) printers
2. **Job History**: No local storage of processed jobs
3. **Advanced Error Recovery**: Basic retry, but could be more sophisticated
4. **Multi-Printer Support**: One IP per type (Kitchen/Bar), no printer pools
5. **OTA Updates**: Could use Expo Updates for non-native code changes
6. **Analytics**: No usage tracking or metrics
7. **Offline Queue**: Jobs are lost if device is offline (server handles retries)

---

## Known Issues & Limitations

### 1. SSL Certificate Validation

**Issue**: React Native uses system certificate store. Self-signed certificates are rejected.

**Impact**: App cannot connect to APIs with self-signed SSL certificates.

**Workarounds**:
- Install certificate on device (see `ANDROID_SETUP.md`)
- Use proper CA-signed certificate (recommended)
- Use HTTP for development only (not secure)

**Status**: Documented, no code fix possible without native module.

### 2. Battery Optimization

**Issue**: Android kills background apps aggressively to save battery.

**Impact**: Agent stops polling when screen is off or app is backgrounded.

**Workaround**: Disable battery optimization for app (see `ANDROID_SETUP.md`)

**Status**: User action required, cannot be automated.

### 3. Network Connectivity

**Issue**: No automatic pause/resume when network goes offline.

**Impact**: App continues polling, generating failed requests.

**Status**: `networkAwareAgent.ts` exists but not integrated. Low priority.

### 4. Background Fetch Limitations

**Issue**: Android's background fetch has minimum 15-minute interval.

**Impact**: If app is killed, jobs may be delayed up to 15 minutes.

**Status**: Expected behavior. Foreground service prevents this in normal operation.

### 5. Printer Connection Failures

**Issue**: No retry logic for printer connection failures.

**Impact**: Job is marked as failed immediately if printer is unreachable.

**Status**: Server-side retry logic handles this (job can be retried by any agent).

### 6. No Job History

**Issue**: App doesn't store processed jobs locally.

**Impact**: Cannot view past print jobs or debug issues.

**Status**: Not critical, server logs contain this information.

---

## Future Enhancements

### High Priority

1. **Integrate Network-Aware Agent**
   - Pause polling when offline
   - Resume when network returns
   - Show network status in UI

2. **Better Error Handling**
   - Retry printer connections
   - Exponential backoff for API failures
   - User-friendly error messages

3. **Job History Screen**
   - Show last N processed jobs
   - Display success/failure status
   - Allow manual retry

### Medium Priority

4. **Bluetooth Printer Support**
   - Detect and pair Bluetooth printers
   - Send ESC/POS over Bluetooth
   - Fallback to network if Bluetooth fails

5. **Multi-Printer Support**
   - Support multiple printers per type
   - Round-robin or load balancing
   - Printer health monitoring

6. **Advanced Configuration**
   - QR code configuration (scan to configure)
   - Printer discovery (auto-detect printers on network)
   - Test print functionality

### Low Priority

7. **Analytics & Monitoring**
   - Track jobs processed per day
   - Success/failure rates
   - Average processing time

8. **Offline Queue**
   - Store jobs locally when offline
   - Process when network returns
   - Sync with server

9. **iOS Support**
   - Port to iOS (most code is cross-platform)
   - iOS-specific background limitations
   - App Store deployment

---

## Troubleshooting

### Agent Not Registering

**Symptoms**: Status screen shows "Registration Retries: 5+"

**Possible Causes**:
1. SSL certificate issue (self-signed cert not installed)
2. Incorrect API URL
3. Network connectivity issue
4. API key incorrect

**Solutions**:
1. Check API URL is correct and accessible
2. Install SSL certificate if using self-signed
3. Verify API key matches server configuration
4. Check network connectivity (Wi-Fi connected?)

### Jobs Not Processing

**Symptoms**: Agent is running, but no prints happen

**Possible Causes**:
1. No jobs in queue (check server)
2. Printer IP incorrect
3. Printer not on same network
4. Printer port 9100 blocked by firewall

**Solutions**:
1. Create a test order in Restro24 system
2. Verify printer IPs in config
3. Ping printer IP from device
4. Test printer connection: `telnet <printer-ip> 9100`

### App Stops After Screen Off

**Symptoms**: Agent stops when device screen turns off

**Possible Causes**:
1. Battery optimization enabled
2. Foreground service not running
3. Background fetch not registered

**Solutions**:
1. Disable battery optimization (see `ANDROID_SETUP.md`)
2. Verify foreground service notification is showing
3. Restart app and re-register background task

### SSL Certificate Errors

**Symptoms**: "Network request failed" or "SSL handshake failed"

**Solutions**:
1. Install certificate on device (see `ANDROID_SETUP.md`)
2. Or use proper CA-signed certificate on server
3. For development: Use HTTP (not recommended for production)

### Printer Connection Timeout

**Symptoms**: Jobs fail with "Printer connection timeout"

**Possible Causes**:
1. Printer is offline
2. Wrong IP address
3. Firewall blocking port 9100
4. Printer not on same network

**Solutions**:
1. Verify printer is powered on and online
2. Check printer IP in config matches actual IP
3. Test connection: `telnet <printer-ip> 9100` from device
4. Ensure device and printer are on same Wi-Fi network

---

## Developer Notes

### Code Style
- **TypeScript**: Strict mode enabled
- **Naming**: camelCase for variables/functions, PascalCase for components/types
- **Async/Await**: Prefer over promises
- **Error Handling**: Try-catch with meaningful error messages

### Key Design Decisions

1. **Polling vs Push**: Chose polling because:
   - No need for persistent WebSocket connections
   - Works behind firewalls/NAT
   - Simpler to implement and debug
   - Server already supports it

2. **Expo Managed Workflow**: Chose because:
   - Faster development (no Android Studio setup)
   - Easier for other developers to contribute
   - Can add iOS later
   - Dev client allows native modules

3. **Minimal UI**: Chose because:
   - App runs in background mostly
   - Restaurant staff don't need complex UI
   - Focus on reliability over features

4. **No Local Job Queue**: Chose because:
   - Server handles retries
   - Simpler codebase
   - Single source of truth (server)

### Testing Strategy

**Manual Testing**:
1. Configure app with test restaurant
2. Create test order in Restro24 system
3. Verify job appears in queue
4. Verify agent polls and processes job
5. Verify print appears on printer

**Edge Cases to Test**:
- Network disconnection during polling
- Printer offline when job arrives
- App killed and restarted
- Device reboot (auto-start)
- Multiple agents for same restaurant

### Contributing

When adding features:
1. **Don't change backend APIs** - use existing endpoints
2. **Maintain compatibility** - Android and Windows agents should work identically
3. **Update this documentation** - keep it current
4. **Test on real device** - emulator may not catch all issues

### Common Pitfalls

1. **Native Modules**: `react-native-tcp-socket` requires dev client rebuild
2. **Background Limits**: Android restricts background execution
3. **Network Security**: Android 9+ requires cleartext traffic config for HTTP
4. **Permissions**: Some devices need manual permission grants

---

## Quick Reference

### Key Files to Modify

- **Agent Logic**: `src/services/agentService.ts`
- **Printing Logic**: `src/services/printerService.ts`
- **API Calls**: `src/api/printAgentApi.ts`
- **UI**: `src/screens/ConfigScreen.tsx`, `src/screens/StatusScreen.tsx`
- **Configuration**: `src/config/types.ts`, `src/config/configStore.ts`

### Key Commands

```bash
# Install dependencies
npm install

# Build dev client
npx expo run:android

# Start Metro
npm start

# Build production APK
npx expo build:android

# Type check
npx tsc --noEmit
```

### Important Constants

- **Poll Interval**: 10000ms (10 seconds) - configurable
- **Printer Port**: 9100 (standard ESC/POS)
- **Registration Retries**: 5 attempts, then every 5 minutes
- **Connection Timeout**: 5 seconds

---

## Conclusion

This Android print agent app provides a complete solution for restaurants without Windows PCs to print KOT/BOT tickets. It integrates seamlessly with the existing Restro24 backend without requiring any changes to server-side code.

The app is production-ready for basic use cases, with some enhancements planned for future versions. The architecture is simple, maintainable, and follows React Native/Expo best practices.

For questions or issues, refer to:
- `README.md` - Quick start
- `ANDROID_SETUP.md` - Production deployment
- This document - Comprehensive reference

---

**Last Updated**: 2024
**Version**: 1.0.0
**Maintainer**: Restro24 Development Team

