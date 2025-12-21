import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import type { AppConfig } from "../config/types";
import { loadConfig, saveConfig } from "../config/configStore";
import {
  DEFAULT_API_BASE_URL,
  DEFAULT_API_KEY,
  DEFAULT_RESTAURANT_ID,
  DEFAULT_AGENT_NAME,
  DEFAULT_POLL_INTERVAL_MS,
  AGENT_ID_PREFIX,
  LEGACY_HTTP_URL,
  LEGACY_CERT_HOST,
  LEGACY_CERT_PORT,
} from "../config/constants";
import { startAgent } from "../services/agentService";
import { registerBackgroundTask } from "../services/backgroundTask";
import { startForegroundService } from "../services/foregroundService";

export const ConfigScreen: React.FC = () => {
  const [restaurantId, setRestaurantId] = useState(DEFAULT_RESTAURANT_ID);
  const [baseUrl, setBaseUrl] = useState(DEFAULT_API_BASE_URL);
  const [apiKey, setApiKey] = useState(DEFAULT_API_KEY);
  const [agentId, setAgentId] = useState("");
  const [agentName, setAgentName] = useState(DEFAULT_AGENT_NAME);
  const [kitchenIp, setKitchenIp] = useState("");
  const [barIp, setBarIp] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    (async () => {
      const cfg = await loadConfig();
      if (cfg) {
        setRestaurantId(String(cfg.restaurantId));
        setBaseUrl(cfg.cloudApiBaseUrl);
        setApiKey(cfg.apiKey);
        setAgentId(cfg.agentId);
        setAgentName(cfg.agentName);
        setKitchenIp(cfg.printerIpKitchen);
        setBarIp(cfg.printerIpBar);
        setStatus("Loaded saved configuration.");
      }
    })();
  }, []);

  const onSaveAndStart = async () => {
    if (!restaurantId || !baseUrl || !apiKey) {
      setStatus("Restaurant ID, API URL and API key are required.");
      return;
    }

    setSaving(true);
    try {
      const id = agentId || `${AGENT_ID_PREFIX}${restaurantId}`;
      const config: AppConfig = {
        restaurantId: Number(restaurantId),
        cloudApiBaseUrl: baseUrl,
        apiKey,
        agentId: id,
        agentName,
        printerIpKitchen: kitchenIp,
        printerIpBar: barIp,
        pollIntervalMs: DEFAULT_POLL_INTERVAL_MS,
      };

      await saveConfig(config);
      await startForegroundService();
      await startAgent(config);
      await registerBackgroundTask();
      setStatus("Configuration saved and agent started.");
    } catch (err: any) {
      setStatus(err?.message || "Failed to start agent.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Restro Print Agent (Android)</Text>

      <Text style={styles.label}>Restaurant ID</Text>
      <TextInput
        style={styles.input}
        value={restaurantId}
        onChangeText={setRestaurantId}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Cloud API Base URL</Text>
      <TextInput
        style={styles.input}
        value={baseUrl}
        onChangeText={setBaseUrl}
        autoCapitalize="none"
        placeholder={DEFAULT_API_BASE_URL}
      />

      <Text style={styles.label}>API Key</Text>
      <TextInput
        style={styles.input}
        value={apiKey}
        onChangeText={setApiKey}
        autoCapitalize="none"
      />

      <Text style={styles.label}>Agent ID (optional)</Text>
      <TextInput
        style={styles.input}
        value={agentId}
        onChangeText={setAgentId}
        autoCapitalize="none"
      />

      <Text style={styles.label}>Agent Name</Text>
      <TextInput
        style={styles.input}
        value={agentName}
        onChangeText={setAgentName}
      />

      <Text style={styles.label}>Kitchen Printer IP</Text>
      <TextInput
        style={styles.input}
        value={kitchenIp}
        onChangeText={setKitchenIp}
        autoCapitalize="none"
      />

      <Text style={styles.label}>Bar Printer IP</Text>
      <TextInput
        style={styles.input}
        value={barIp}
        onChangeText={setBarIp}
        autoCapitalize="none"
      />

      <View style={styles.buttonContainer}>
        <Button
          title={saving ? "Saving..." : "Save & Start Agent"}
          onPress={onSaveAndStart}
        />
      </View>

      {status ? <Text style={styles.status}>{status}</Text> : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  label: {
    marginTop: 12,
    marginBottom: 4,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  buttonContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  status: {
    marginTop: 16,
    color: "#555",
  },
  warningBox: {
    marginTop: 8,
    marginBottom: 12,
    padding: 12,
    backgroundColor: "#fff3cd",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#ffc107",
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#856404",
    marginBottom: 8,
  },
  warningText: {
    fontSize: 12,
    color: "#333",
    marginBottom: 8,
    lineHeight: 18,
  },
  warningSteps: {
    fontSize: 11,
    color: "#555",
    marginBottom: 8,
    lineHeight: 18,
    fontFamily: "monospace",
  },
  warningNote: {
    fontSize: 11,
    color: "#856404",
    fontStyle: "italic",
    marginTop: 4,
    fontWeight: "500",
  },
  boldText: {
    fontWeight: "bold",
  },
  devWarningBox: {
    marginTop: 8,
    marginBottom: 12,
    padding: 12,
    backgroundColor: "#f8d7da",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#dc3545",
  },
  devWarningTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#721c24",
    marginBottom: 8,
  },
  devWarningText: {
    fontSize: 12,
    color: "#721c24",
    lineHeight: 18,
  },
});
