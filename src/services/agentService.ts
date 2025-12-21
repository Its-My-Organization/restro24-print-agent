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
      console.log(`[registerAgentWithRetry] Attempt ${retryCount + 1}...`);
      const res = await registerAgent(config);
      
      if (res?.success && res.agentId) {
        console.log(`[registerAgentWithRetry] Success! Agent DB ID: ${res.agentId}`);
        agentDbId = res.agentId;
        registrationRetryCount = 0;
        return true;
      }

      const errorMsg = res?.message || "Agent registration failed - no agentId returned";
      console.warn(`[registerAgentWithRetry] Registration returned false:`, res);
      throw new Error(errorMsg);
    } catch (error: any) {
      retryCount++;
      registrationRetryCount = retryCount;
      
      const errorMessage = error?.message || error?.toString() || "Unknown error";
      const isNetworkError = error?.code === "NETWORK_ERROR" || 
                            error?.code === "ECONNABORTED" ||
                            error?.code === "ERR_NETWORK" ||
                            error?.message?.includes("Network") ||
                            error?.message?.includes("timeout");
      
      // Detect SSL errors: ERR_NETWORK with no response and HTTPS URL
      const isSSLError = (error?.code === "ERR_NETWORK" && !error?.response) ||
                        error?.message?.includes("SSL") ||
                        error?.message?.includes("certificate") ||
                        error?.code === "CERT_HAS_EXPIRED" ||
                        (isNetworkError && config.cloudApiBaseUrl.startsWith("https://"));
      
      console.error(`[registerAgentWithRetry] Attempt ${retryCount} failed:`, {
        error: errorMessage,
        code: error?.code,
        isNetworkError,
        isSSLError,
        willRetry: true
      });
      
      if (isSSLError && retryCount === 1) {
        console.error("[registerAgentWithRetry] SSL Certificate Issue Detected!");
        console.error("The server requires HTTPS. You must install the SSL certificate on the Android device.");
        console.error("");
        console.error("SOLUTION - Install SSL Certificate:");
        console.error("1. Get the server's SSL certificate file (.crt or .pem)");
        console.error("2. Transfer it to the Android device");
        console.error("3. Settings → Security → Install from storage");
        console.error("4. Select the certificate file");
        console.error("5. IMPORTANT: Select 'CA certificate' (NOT 'Wi-Fi certificate' or 'VPN & app user certificate')");
        console.error("6. Name it (e.g., 'Restro API Certificate')");
        console.error("7. Restart the app after installation");
        console.error("");
        console.error("Note: The browser may work without this, but React Native requires the certificate.");
      }
      
      // If using HTTPS and still getting network errors, it's likely SSL certificate issue
      if (isNetworkError && config.cloudApiBaseUrl.startsWith("https://") && retryCount === 1) {
        console.error("[registerAgentWithRetry] HTTPS Network Error Detected!");
        console.error("The server requires HTTPS. Most likely causes:");
        console.error("1. SSL certificate not installed on device (most common)");
        console.error("2. Device cannot reach the server (check network/firewall)");
        console.error("3. Wrong IP address or port");
        console.error("");
        console.error("ACTION: Install the SSL certificate on the device (see instructions above)");
      }

      if (retryCount < MAX_REGISTRATION_RETRIES) {
        console.log(`[registerAgentWithRetry] Retrying in ${REGISTRATION_RETRY_DELAY_MS / 1000}s...`);
        await new Promise((resolve) =>
          setTimeout(resolve, REGISTRATION_RETRY_DELAY_MS)
        );
      } else {
        console.log(`[registerAgentWithRetry] Max retries reached. Waiting ${REGISTRATION_RETRY_DELAY_AFTER_MAX_MS / 1000}s before next attempt...`);
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


