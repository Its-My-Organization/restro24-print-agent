import type { AppConfig } from "../config/types";
import { registerAgent, pollJobs, completeJob, failJob } from "../api/printAgentApi";
import { getPrinterIpForJob, printToNetworkPrinter } from "./printerService";
import { updateForegroundServiceStatus } from "./foregroundService";
import { saveJobToHistory, jobDtoToHistoryItem, updateJobStatus } from "./jobHistoryService";

let isRunning = false;
let registrationRetryCount = 0;
let agentDbId: number | null = null;
const MAX_REGISTRATION_RETRIES = 5;
const REGISTRATION_RETRY_DELAY_MS = 30000; // 30 seconds
const REGISTRATION_RETRY_DELAY_AFTER_MAX_MS = 300000; // 5 minutes

/**
 * Registers the agent with retry logic (similar to Windows service)
 */
async function registerAgentWithRetry(config: AppConfig): Promise<boolean> {
  let retryCount = 0;

  // Keep trying indefinitely with backoff strategy
  // First 5 attempts: every 30s, then every 5 minutes
  // On success: store numeric DB AgentId for polling
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const res = await registerAgent(config);
      if (res?.success && res.agentId) {
        agentDbId = res.agentId;
        registrationRetryCount = 0;
        return true;
      }

      throw new Error(res?.message || "Agent registration failed");
    } catch {
      retryCount++;
      registrationRetryCount = retryCount;

      if (retryCount < MAX_REGISTRATION_RETRIES) {
        await new Promise((resolve) =>
          setTimeout(resolve, REGISTRATION_RETRY_DELAY_MS)
        );
      } else {
        await new Promise((resolve) =>
          setTimeout(resolve, REGISTRATION_RETRY_DELAY_AFTER_MAX_MS)
        );
        retryCount = 0;
      }
    }
  }
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
      // Don't poll until we have a numeric DB AgentId from registration
      if (!agentDbId) {
        await new Promise((resolve) =>
          setTimeout(resolve, config.pollIntervalMs)
        );
        return loop();
      }

      const jobs = await pollJobs(config, agentDbId);

      for (const job of jobs) {
        // Save job to history as processing
        await saveJobToHistory(jobDtoToHistoryItem(job, "processing"));
        
        const printerIp = getPrinterIpForJob(job.printerType, config);
        if (!printerIp) {
          const errorMsg = "Printer IP not configured";
          await failJob(config, job.id, errorMsg);
          await updateJobStatus(job.id, "failed", errorMsg);
          continue;
        }

        try {
          await printToNetworkPrinter(printerIp, 9100, job.content);
          await completeJob(config, job.id);
          await updateJobStatus(job.id, "completed");
          // Update notification with last job time
          const now = new Date().toLocaleTimeString();
          await updateForegroundServiceStatus('running', now);
        } catch (err: any) {
          const errorMsg = err?.message || "Print failed";
          await failJob(config, job.id, errorMsg);
          await updateJobStatus(job.id, "failed", errorMsg);
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


