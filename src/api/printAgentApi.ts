import type { AppConfig } from "../config/types";
import { createApiClient } from "./client";

export interface RegisterAgentResponse {
  success: boolean;
  agentId: number;
  message?: string;
}

export async function registerAgent(config: AppConfig): Promise<RegisterAgentResponse> {
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
  
  try {
    console.log("[registerAgent] Request:", {
      url: `${config.cloudApiBaseUrl}/api/printagent/register`,
      body,
      headers: { "X-API-Key": config.apiKey ? "***" : "MISSING" }
    });
    
    const res = await api.post("/printagent/register", body);
    
    console.log("[registerAgent] Response:", {
      status: res.status,
      statusText: res.statusText,
      data: res.data
    });
    
    const data = res.data ?? {};
    const result = {
      success: data.success ?? data.Success ?? false,
      agentId: data.agentId ?? data.AgentId ?? 0,
      message: data.message ?? data.Message,
    };
    
    console.log("[registerAgent] Parsed result:", result);
    return result;
  } catch (error: any) {
    console.error("[registerAgent] Full Error Details:", {
      message: error?.message,
      code: error?.code,
      errno: error?.errno,
      syscall: error?.syscall,
      address: error?.address,
      port: error?.port,
      response: error?.response?.data,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      config: {
        url: error?.config?.url,
        baseURL: error?.config?.baseURL,
        method: error?.config?.method,
        headers: error?.config?.headers,
      },
      // Log the full error object
      fullError: JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
    });
    throw error;
  }
}

export interface PrintJobDto {
  id: number;
  restaurantId: number;
  printerType: number; // 0 = Kitchen, 1 = Bar
  content: string;
  orderId: string;
}

function mapPrinterTypeToNumeric(printerType: any): number {
  if (typeof printerType === "number") return printerType;
  if (typeof printerType === "string") {
    const pt = printerType.toLowerCase();
    if (pt === "kitchen") return 0;
    if (pt === "bar") return 1;
  }
  return 0;
}

export async function pollJobs(
  config: AppConfig,
  agentDbId: number
): Promise<PrintJobDto[]> {
  const api = createApiClient(config);
  const body = {
    restaurantId: config.restaurantId,
    agentId: agentDbId,
    maxJobs: 5
  };
  const res = await api.post("/printagent/poll", body);
  const data = res.data ?? {};
  const rawJobs = data.jobs ?? data.Jobs ?? data ?? [];

  if (!Array.isArray(rawJobs)) {
    return [];
  }

  return rawJobs.map((j: any) => ({
    id: j.id ?? j.JobId,
    restaurantId: j.restaurantId ?? j.RestaurantId,
    printerType: mapPrinterTypeToNumeric(j.printerType ?? j.PrinterType),
    content: j.content ?? j.Content ?? "",
    orderId: j.orderId ?? j.OrderId ?? "",
  }));
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


