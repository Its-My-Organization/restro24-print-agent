export interface AppConfig {
  restaurantId: number;
  cloudApiBaseUrl: string;
  apiKey: string;
  agentId: string;
  agentName: string;
  printerIpKitchen: string;
  printerIpBar: string;
  pollIntervalMs: number;
  bypassSslValidation?: boolean; // For self-signed certs (requires native module)
}


