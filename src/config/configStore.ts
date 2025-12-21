import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AppConfig } from "./types";
import { LEGACY_HTTP_URL } from "./constants";

const KEY = "restro-print-agent-config";

export async function saveConfig(config: AppConfig): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(config));
}

export async function loadConfig(): Promise<AppConfig | null> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const config = JSON.parse(raw) as AppConfig;
    // Auto-migrate HTTP to HTTPS (server only accepts HTTPS)
    if (config.cloudApiBaseUrl?.startsWith(LEGACY_HTTP_URL)) {
      config.cloudApiBaseUrl = config.cloudApiBaseUrl.replace("http://", "https://");
      // Save the migrated config
      await saveConfig(config);
    }
    return config;
  } catch {
    return null;
  }
}


