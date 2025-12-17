import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AppConfig } from "./types";

const KEY = "restro-print-agent-config";

export async function saveConfig(config: AppConfig): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(config));
}

export async function loadConfig(): Promise<AppConfig | null> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AppConfig;
  } catch {
    return null;
  }
}


