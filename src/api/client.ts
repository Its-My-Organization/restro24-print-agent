import axios from "axios";
import type { AppConfig } from "../config/types";

export function createApiClient(config: AppConfig) {
  return axios.create({
    baseURL: `${config.cloudApiBaseUrl.replace(/\/+$/, "")}/api`,
    timeout: 10000,
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": config.apiKey
    }
  });
}


