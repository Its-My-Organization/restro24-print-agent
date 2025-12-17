import type { AppConfig } from "../config/types";
import { createApiClient } from "./client";

export async function registerAgent(config: AppConfig) {
  const api = createApiClient(config);
  const body = {
    restaurantId: config.restaurantId,
    agentId: config.agentId,
    agentName: config.agentName,
    platform: 1, // Android (must match backend enum)
    version: "1.0.0",
    hostAddress: config.agentId,
    createdBy: `${config.agentId}-PrintAgent`
  };
  const res = await api.post("/printagent/register", body);
  return res.data as { success: boolean; agentId: number };
}

export interface PrintJobDto {
  id: number;
  restaurantId: number;
  printerType: number; // 0 = Kitchen, 1 = Bar
  content: string;
  orderId: string;
}

export async function pollJobs(config: AppConfig): Promise<PrintJobDto[]> {
  const api = createApiClient(config);
  const body = {
    restaurantId: config.restaurantId,
    agentId: config.agentId,
    maxJobs: 5
  };
  const res = await api.post("/printagent/poll", body);
  return (res.data?.jobs ?? res.data ?? []) as PrintJobDto[];
}

export async function completeJob(config: AppConfig, jobId: number) {
  const api = createApiClient(config);
  await api.post("/printagent/complete", {
    jobId,
    agentId: config.agentId
  });
}

export async function failJob(config: AppConfig, jobId: number, error: string) {
  const api = createApiClient(config);
  await api.post("/printagent/fail", {
    jobId,
    agentId: config.agentId,
    errorMessage: error
  });
}

/**
 * Get pending jobs without processing them (for viewing in UI)
 */
export async function getPendingJobs(config: AppConfig): Promise<PrintJobDto[]> {
  const api = createApiClient(config);
  const body = {
    restaurantId: config.restaurantId,
    agentId: config.agentId,
    maxJobs: 50 // Get more jobs for the UI
  };
  try {
    const res = await api.post("/printagent/poll", body);
    return (res.data?.jobs ?? res.data ?? []) as PrintJobDto[];
  } catch {
    return [];
  }
}


