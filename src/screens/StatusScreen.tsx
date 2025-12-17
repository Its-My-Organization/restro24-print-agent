import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { getIsRunning, getRegistrationRetryCount, startAgent, stopAgent } from '../services/agentService';
import { loadConfig } from '../config/configStore';
import { registerBackgroundTask, unregisterBackgroundTask } from '../services/backgroundTask';

export const StatusScreen: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsRunning(getIsRunning());
      setRetryCount(getRegistrationRetryCount());
    }, 1000);

    loadConfig().then(setConfig);

    return () => clearInterval(interval);
  }, []);

  const handleStart = async () => {
    const cfg = await loadConfig();
    if (cfg) {
      await startAgent(cfg);
      await registerBackgroundTask();
      setIsRunning(true);
    }
  };

  const handleStop = async () => {
    stopAgent();
    await unregisterBackgroundTask();
    setIsRunning(false);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.title}>Agent Status</Text>
        <View style={styles.statusRow}>
          <Text style={styles.label}>Status:</Text>
          <Text style={[styles.value, isRunning ? styles.running : styles.stopped]}>
            {isRunning ? 'Running' : 'Stopped'}
          </Text>
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.label}>Registration Retries:</Text>
          <Text style={styles.value}>{retryCount}</Text>
        </View>
      </View>

      {config && (
        <View style={styles.section}>
          <Text style={styles.title}>Configuration</Text>
          <View style={styles.statusRow}>
            <Text style={styles.label}>Restaurant ID:</Text>
            <Text style={styles.value}>{config.restaurantId}</Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.label}>Agent ID:</Text>
            <Text style={styles.value}>{config.agentId}</Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.label}>Agent Name:</Text>
            <Text style={styles.value}>{config.agentName}</Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.label}>Poll Interval:</Text>
            <Text style={styles.value}>{config.pollIntervalMs}ms</Text>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.button, isRunning ? styles.stopButton : styles.startButton]}
          onPress={isRunning ? handleStop : handleStart}
        >
          <Text style={styles.buttonText}>
            {isRunning ? 'Stop Agent' : 'Start Agent'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.helpText}>
          {isRunning
            ? 'Agent is polling for print jobs. Keep this app running in the foreground or background.'
            : 'Start the agent to begin polling for print jobs.'}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  running: {
    color: '#4caf50',
  },
  stopped: {
    color: '#f44336',
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#4caf50',
  },
  stopButton: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    lineHeight: 18,
  },
});

