import type { AppConfig } from "../config/types";
import { registerAgent, pollJobs, completeJob, failJob } from "../api/printAgentApi";
import { getPrinterIpForJob, printToNetworkPrinter } from "./printerService";
import { updateForegroundServiceStatus } from "./foregroundService";

let isRunning = false;
let registrationRetryCount = 0;
const MAX_REGISTRATION_RETRIES = 5;
const REGISTRATION_RETRY_DELAY_MS = 30000; // 30 seconds
const REGISTRATION_RETRY_DELAY_AFTER_MAX_MS = 300000; // 5 minutes

/**
 * Registers the agent with retry logic (similar to Windows service)
 */
async function registerAgentWithRetry(config: AppConfig): Promise<boolean> {
  let retryCount = 0;
  
  while (retryCount < MAX_REGISTRATION_RETRIES) {
    try {
      await registerAgent(config);
      registrationRetryCount = 0; // Reset on success
      return true;
    } catch (error) {
      retryCount++;
      registrationRetryCount = retryCount;
      
      if (retryCount < MAX_REGISTRATION_RETRIES) {
        // Wait 30 seconds before retry
        await new Promise(resolve => setTimeout(resolve, REGISTRATION_RETRY_DELAY_MS));
      } else {
        // After max retries, wait 5 minutes before trying again
        await new Promise(resolve => setTimeout(resolve, REGISTRATION_RETRY_DELAY_AFTER_MAX_MS));
        // Reset retry count and try again indefinitely
        retryCount = 0;
      }
    }
  }
  
  return false;
}

export async function startAgent(config: AppConfig) {
  if (isRunning) return;
  isRunning = true;

  // Register agent with retry logic (similar to Windows service)
  // This runs in background and doesn't block the polling loop
  registerAgentWithRetry(config).catch(() => {
    // Keep trying to register even if it fails
    // The polling loop will continue, but jobs won't be assigned until registered
  });

  const loop = async () => {
    if (!isRunning) return;

    try {
      const jobs = await pollJobs(config);

      for (const job of jobs) {
        const printerIp = getPrinterIpForJob(job.printerType, config);
        if (!printerIp) {
          await failJob(config, job.id, "Printer IP not configured");
          continue;
        }

        try {
          await printToNetworkPrinter(printerIp, 9100, job.content);
          await completeJob(config, job.id);
          // Update notification with last job time
          const now = new Date().toLocaleTimeString();
          await updateForegroundServiceStatus('running', now);
        } catch (err: any) {
          await failJob(config, job.id, err?.message || "Print failed");
        }
      }
    } catch {
      // Swallow errors to keep loop alive; server logs details.
    } finally {
      setTimeout(loop, config.pollIntervalMs);
    }
  };

  loop();
}

export function stopAgent() {
  isRunning = false;
}

export function getIsRunning(): boolean {
  return isRunning;
}

export function getRegistrationRetryCount(): number {
  return registrationRetryCount;
}


