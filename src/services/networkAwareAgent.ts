import type { AppConfig } from '../config/types';
import { startAgent, stopAgent } from './agentService';
import { useNetworkState } from '../hooks/useNetworkState';

/**
 * Network-aware agent wrapper
 * 
 * Pauses polling when offline and resumes when online.
 * This prevents unnecessary API calls and errors when network is unavailable.
 */

let currentConfig: AppConfig | null = null;
let wasOnline = true;

/**
 * Start agent with network awareness
 */
export async function startNetworkAwareAgent(config: AppConfig) {
  currentConfig = config;
  const { isOnline } = useNetworkState();
  
  if (isOnline) {
    await startAgent(config);
    wasOnline = true;
  } else {
    wasOnline = false;
    // Will start when network comes back (handled by network state listener)
  }
}

/**
 * Stop network-aware agent
 */
export async function stopNetworkAwareAgent() {
  currentConfig = null;
  stopAgent();
}

/**
 * Call this when network state changes
 */
export async function handleNetworkChange(isOnline: boolean) {
  if (isOnline && !wasOnline && currentConfig) {
    // Network came back - restart agent
    await startAgent(currentConfig);
    wasOnline = true;
  } else if (!isOnline && wasOnline) {
    // Network went down - stop agent
    stopAgent();
    wasOnline = false;
  }
}

