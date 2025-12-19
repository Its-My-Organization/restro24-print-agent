import AsyncStorage from "@react-native-async-storage/async-storage";
import type { PrintJobDto } from "../api/printAgentApi";

export interface JobHistoryItem {
  jobId: number;
  orderId: string;
  printerType: number; // 0 = Kitchen, 1 = Bar
  status: "pending" | "processing" | "completed" | "failed";
  timestamp: number;
  errorMessage?: string;
  content?: string; // Store content for retry
}

const HISTORY_KEY = "restro-print-agent-job-history";
const MAX_HISTORY_ITEMS = 100;

/**
 * Save a job to history
 */
export async function saveJobToHistory(job: JobHistoryItem): Promise<void> {
  const history = await getJobHistory();
  const existingIndex = history.findIndex((h) => h.jobId === job.jobId);
  
  if (existingIndex >= 0) {
    history[existingIndex] = job;
  } else {
    history.unshift(job); // Add to beginning
  }
  
  // Keep only the most recent items
  const trimmed = history.slice(0, MAX_HISTORY_ITEMS);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
}

/**
 * Get job history
 */
export async function getJobHistory(): Promise<JobHistoryItem[]> {
  const raw = await AsyncStorage.getItem(HISTORY_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as JobHistoryItem[];
  } catch {
    return [];
  }
}

/**
 * Get job by ID
 */
export async function getJobById(jobId: number): Promise<JobHistoryItem | null> {
  const history = await getJobHistory();
  return history.find((j) => j.jobId === jobId) || null;
}

/**
 * Update job status
 */
export async function updateJobStatus(
  jobId: number,
  status: JobHistoryItem["status"],
  errorMessage?: string
): Promise<void> {
  const history = await getJobHistory();
  const job = history.find((j) => j.jobId === jobId);
  if (job) {
    job.status = status;
    job.timestamp = Date.now();
    if (errorMessage) {
      job.errorMessage = errorMessage;
    }
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }
}

/**
 * Clear job history
 */
export async function clearJobHistory(): Promise<void> {
  await AsyncStorage.removeItem(HISTORY_KEY);
}

/**
 * Remove a single job from local history (does not affect server)
 */
export async function removeJobFromHistory(jobId: number): Promise<void> {
  const history = await getJobHistory();
  const filtered = history.filter((j) => j.jobId !== jobId);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
}

/**
 * Convert PrintJobDto to JobHistoryItem
 */
export function jobDtoToHistoryItem(job: PrintJobDto, status: JobHistoryItem["status"] = "pending"): JobHistoryItem {
  return {
    jobId: job.id,
    orderId: job.orderId,
    printerType: job.printerType,
    status,
    timestamp: Date.now(),
    content: job.content,
  };
}

