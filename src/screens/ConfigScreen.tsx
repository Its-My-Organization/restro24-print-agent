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
        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>⚠️ SSL Certificate Issue</Text>
          <Text style={styles.warningText}>
            React Native cannot connect to HTTPS servers with self-signed certificates. You have two options:
          </Text>
          <Text style={styles.warningSteps}>
            <Text style={styles.boldText}>Option 1 (Development):</Text>{"\n"}
            Change URL to HTTP: http://164.68.118.52:8006{"\n"}
            {"\n"}
            <Text style={styles.boldText}>Option 2 (Production):</Text>{"\n"}
            1. Extract certificate: openssl s_client -showcerts -connect 164.68.118.52:8006 {"<"} /dev/null 2{">"}/dev/null | openssl x509 -outform PEM {" >"} server.crt{"\n"}
            2. Transfer server.crt to Android device{"\n"}
            3. Settings → Security → Install from storage{"\n"}
            4. Select server.crt and install as USER certificate{"\n"}
            5. Restart app
          </Text>
          <Text style={styles.warningNote}>
            💡 For Android Emulator: Use HTTP (Option 1) for quick testing. For real devices, install the certificate (Option 2).
          </Text>
        </View>
      )}
      {baseUrl.startsWith("http://") && !baseUrl.startsWith("https://") && (
        <View style={styles.devWarningBox}>
          <Text style={styles.devWarningTitle}>🔓 Development Mode - HTTP Enabled</Text>
          <Text style={styles.devWarningText}>
            ⚠️ WARNING: Using HTTP is insecure and should only be used for development/testing in trusted networks. Never use HTTP in production!
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
