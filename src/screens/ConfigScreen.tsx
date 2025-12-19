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
import { startAgent } from "../services/agentService";
import { registerBackgroundTask } from "../services/backgroundTask";
import { startForegroundService } from "../services/foregroundService";

export const ConfigScreen: React.FC = () => {
  const [restaurantId, setRestaurantId] = useState("3");
  const [baseUrl, setBaseUrl] = useState("https://164.68.118.52:8006");
  const [apiKey, setApiKey] = useState("test-api-key-12345");
  const [agentId, setAgentId] = useState("");
  const [agentName, setAgentName] = useState("Android Print Agent");
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
      const id = agentId || `Android-${restaurantId}`;
      const config: AppConfig = {
        restaurantId: Number(restaurantId),
        cloudApiBaseUrl: baseUrl,
        apiKey,
        agentId: id,
        agentName,
        printerIpKitchen: kitchenIp,
        printerIpBar: barIp,
        pollIntervalMs: 10000,
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
        placeholder="https://164.68.118.52:8006"
      />
      {baseUrl.startsWith("https://") && (
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>📋 SSL Certificate Setup Required</Text>
          <Text style={styles.infoText}>
            Since the server uses HTTPS with a self-signed certificate, you must install it on the Android device:
          </Text>
          <Text style={styles.infoSteps}>
            1. Get the server's SSL certificate file (.crt or .pem){"\n"}
            2. Transfer it to the Android device{"\n"}
            3. Settings → Security → Install from storage{"\n"}
            4. Select the certificate file{"\n"}
            5. Install as USER certificate (not just view){"\n"}
            6. Restart the app after installation
          </Text>
          <Text style={styles.infoNote}>
            Note: The browser may work without this, but React Native requires the certificate to be installed.
          </Text>
        </View>
      )}

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
  warningText: {
    marginTop: 4,
    marginBottom: 8,
    fontSize: 12,
    color: "#ff9800",
    fontStyle: "italic",
  },
  infoBox: {
    marginTop: 8,
    marginBottom: 12,
    padding: 12,
    backgroundColor: "#e3f2fd",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#2196f3",
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1976d2",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: "#333",
    marginBottom: 8,
    lineHeight: 18,
  },
  infoSteps: {
    fontSize: 11,
    color: "#555",
    marginBottom: 8,
    lineHeight: 18,
    fontFamily: "monospace",
  },
  infoNote: {
    fontSize: 11,
    color: "#666",
    fontStyle: "italic",
    marginTop: 4,
  },
});
