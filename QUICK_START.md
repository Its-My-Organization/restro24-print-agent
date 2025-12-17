# Quick Start Guide - Android Print Agent

## For New Developers

This guide helps you get started quickly. For detailed information, see [`COMPREHENSIVE_DOCUMENTATION.md`](./COMPREHENSIVE_DOCUMENTATION.md).

## What This App Does

- **Polls** Restro24 cloud API for print jobs (KOT/BOT tickets)
- **Sends** print jobs to network ESC/POS printers over TCP
- **Runs in background** on Android tablets/phones
- **No backend changes** - uses existing REST APIs

## Setup (5 minutes)

```bash
# 1. Install dependencies
npm install

# 2. Build dev client (required for TCP socket native module)
npx expo run:android

# 3. Start Metro bundler
npm start

# 4. On Android device: Open dev client, connect to Metro
```

## Configuration

1. Open app → **Config** tab
2. Fill in:
   - Restaurant ID: `3`
   - Cloud API Base URL: `https://164.68.118.52:8006`
   - API Key: `test-api-key-12345`
   - Kitchen Printer IP: `192.168.101.8`
   - Bar Printer IP: `192.168.101.8`
3. Tap **"Save & Start Agent"**

## Verify It Works

1. Go to **Status** tab → Should show "Running"
2. Create an order in Restro24 system
3. Check printer → Should print KOT/BOT ticket

## Project Structure

```
src/
├── config/          # Configuration storage
├── api/             # HTTP API wrappers
├── services/        # Core logic (polling, printing)
└── screens/         # UI (Config, Status)
```

## Key Files

- **Agent Logic**: `src/services/agentService.ts`
- **Printing**: `src/services/printerService.ts`
- **API Calls**: `src/api/printAgentApi.ts`
- **UI**: `src/screens/ConfigScreen.tsx`

## Common Issues

**Agent not registering?**
- Check API URL and key
- Install SSL certificate if using self-signed cert

**Jobs not printing?**
- Verify printer IPs are correct
- Check printer is on same network
- Test: `telnet <printer-ip> 9100`

**App stops when screen off?**
- Disable battery optimization (see `ANDROID_SETUP.md`)

## Next Steps

- Read [`COMPREHENSIVE_DOCUMENTATION.md`](./COMPREHENSIVE_DOCUMENTATION.md) for architecture details
- Check [`ANDROID_SETUP.md`](./ANDROID_SETUP.md) for production deployment

