import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
} from "react-native";
import { loadConfig } from "../config/configStore";
import {
  getJobHistory,
  clearJobHistory,
  updateJobStatus,
  type JobHistoryItem,
} from "../services/jobHistoryService";
import { getPrinterIpForJob, printToNetworkPrinter } from "../services/printerService";

export const JobsScreen: React.FC = () => {
  const [jobHistory, setJobHistory] = useState<JobHistoryItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobHistoryItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");

  const loadData = useCallback(async () => {
    try {
      // Load job history only from local storage
      const history = await getJobHistory();
      setJobHistory(history);
    } catch (error) {
      console.error("Error loading job history:", error);
    }
  }, []);

  useEffect(() => {
    loadData();
    // Refresh every 5 seconds
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handlePrintJob = async (job: JobHistoryItem) => {
    const config = await loadConfig();
    if (!config) {
      Alert.alert("Error", "Configuration not found");
      return;
    }

    const printerIp = getPrinterIpForJob(job.printerType, config);
    if (!printerIp) {
      Alert.alert("Error", "Printer IP not configured for this printer type");
      return;
    }

    Alert.alert(
      "Print Job",
      `Print order #${job.orderId} to ${job.printerType === 0 ? "Kitchen" : "Bar"} printer?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Print",
          onPress: async () => {
            try {
              // Mark as processing locally
              await updateJobStatus(job.jobId, "processing");

              await printToNetworkPrinter(printerIp, 9100, job.content ?? "");
              await updateJobStatus(job.jobId, "completed");

              Alert.alert("Success", "Job printed successfully");
              await loadData();
            } catch (error: any) {
              const errorMsg = error?.message || "Print failed";
              await updateJobStatus(job.jobId, "failed", errorMsg);
              Alert.alert("Error", errorMsg);
              await loadData();
            }
          },
        },
      ]
    );
  };

  const handleRetryJob = async (job: JobHistoryItem) => {
    if (!job.content) {
      Alert.alert("Error", "Job content not available for retry");
      return;
    }

    const config = await loadConfig();
    if (!config) {
      Alert.alert("Error", "Configuration not found");
      return;
    }

    const printerIp = getPrinterIpForJob(job.printerType, config);
    if (!printerIp) {
      Alert.alert("Error", "Printer IP not configured");
      return;
    }

    Alert.alert(
      "Retry Job",
      `Retry printing order #${job.orderId}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Retry",
          onPress: async () => {
            try {
              await updateJobStatus(job.jobId, "processing");
              await printToNetworkPrinter(printerIp, 9100, job.content!);
              await updateJobStatus(job.jobId, "completed");
              Alert.alert("Success", "Job printed successfully");
              await loadData();
            } catch (error: any) {
              const errorMsg = error?.message || "Print failed";
              await updateJobStatus(job.jobId, "failed", errorMsg);
              Alert.alert("Error", errorMsg);
              await loadData();
            }
          },
        },
      ]
    );
  };

  const handleClearHistory = () => {
    Alert.alert(
      "Clear History",
      "Are you sure you want to clear all job history?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            await clearJobHistory();
            await loadData();
          },
        },
      ]
    );
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getStatusColor = (status: JobHistoryItem["status"]) => {
    switch (status) {
      case "completed":
        return "#4caf50";
      case "failed":
        return "#f44336";
      case "processing":
        return "#ff9800";
      case "pending":
        return "#2196f3";
      default:
        return "#666";
    }
  };

  const renderJobItem = (job: JobHistoryItem, isHistory: boolean = false) => {
    const status = job.status;
    const jobId = job.jobId;
    const orderId = job.orderId;
    const printerType = job.printerType;
    const timestamp = job.timestamp;

    return (
      <TouchableOpacity
        key={jobId}
        style={styles.jobItem}
        onPress={() => {
          setSelectedJob(job);
          setModalVisible(true);
        }}
      >
        <View style={styles.jobHeader}>
          <Text style={styles.jobOrderId}>Order #{orderId}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(status) },
            ]}
          >
            <Text style={styles.statusText}>{status.toUpperCase()}</Text>
          </View>
        </View>
        <View style={styles.jobDetails}>
          <Text style={styles.jobDetail}>
            Printer: {printerType === 0 ? "Kitchen" : "Bar"}
          </Text>
          <Text style={styles.jobDetail}>
            Time: {formatTime(timestamp)}
          </Text>
          {job.errorMessage && (
            <Text style={styles.errorText}>
              Error: {job.errorMessage}
            </Text>
          )}
        </View>
        {!isHistory && (
          <TouchableOpacity
            style={styles.printButton}
            onPress={() => handlePrintJob(job)}
          >
            <Text style={styles.printButtonText}>Print Now</Text>
          </TouchableOpacity>
        )}
        {isHistory && status === "failed" && (
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => handleRetryJob(job as JobHistoryItem)}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "pending" && styles.activeTab]}
          onPress={() => setActiveTab("pending")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "pending" && styles.activeTabText,
            ]}
          >
            Pending (
            {
              jobHistory.filter(
                (job) =>
                  job.status === "pending" || job.status === "processing"
              ).length
            }
            )
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "history" && styles.activeTab]}
          onPress={() => setActiveTab("history")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "history" && styles.activeTabText,
            ]}
          >
            History ({jobHistory.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === "pending" ? (
          (() => {
            const pendingJobs = jobHistory.filter(
              (job) =>
                job.status === "pending" || job.status === "processing"
            );

            if (pendingJobs.length === 0) {
              return (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No pending jobs</Text>
                </View>
              );
            }

            return pendingJobs.map((job) => renderJobItem(job, false));
          })()
        ) : (
          <>
            {jobHistory.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClearHistory}
              >
                <Text style={styles.clearButtonText}>Clear History</Text>
              </TouchableOpacity>
            )}
            {jobHistory.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No job history</Text>
              </View>
            ) : (
              jobHistory.map((job) => renderJobItem(job, true))
            )}
          </>
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Job Details</Text>
            {selectedJob && (
              <>
                <Text style={styles.modalText}>
                  Order ID: {selectedJob.orderId}
                </Text>
                <Text style={styles.modalText}>
                  Status: {selectedJob.status.toUpperCase()}
                </Text>
                <Text style={styles.modalText}>
                  Printer: {selectedJob.printerType === 0 ? "Kitchen" : "Bar"}
                </Text>
                <Text style={styles.modalText}>
                  Time: {formatTime(selectedJob.timestamp)}
                </Text>
                {selectedJob.errorMessage && (
                  <Text style={styles.modalError}>
                    Error: {selectedJob.errorMessage}
                  </Text>
                )}
              </>
            )}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  tab: {
    flex: 1,
    padding: 16,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: "#2196f3",
  },
  tabText: {
    fontSize: 16,
    color: "#666",
  },
  activeTabText: {
    color: "#2196f3",
    fontWeight: "bold",
  },
  scrollView: {
    flex: 1,
  },
  jobItem: {
    backgroundColor: "white",
    padding: 16,
    margin: 8,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  jobHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  jobOrderId: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  jobDetails: {
    marginBottom: 8,
  },
  jobDetail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  errorText: {
    fontSize: 12,
    color: "#f44336",
    marginTop: 4,
  },
  printButton: {
    backgroundColor: "#4caf50",
    padding: 10,
    borderRadius: 4,
    alignItems: "center",
    marginTop: 8,
  },
  printButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  retryButton: {
    backgroundColor: "#ff9800",
    padding: 10,
    borderRadius: 4,
    alignItems: "center",
    marginTop: 8,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
  },
  clearButton: {
    backgroundColor: "#f44336",
    padding: 12,
    margin: 8,
    borderRadius: 4,
    alignItems: "center",
  },
  clearButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 24,
    borderRadius: 8,
    width: "80%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  modalText: {
    fontSize: 14,
    color: "#333",
    marginBottom: 8,
  },
  modalError: {
    fontSize: 14,
    color: "#f44336",
    marginTop: 8,
  },
  closeButton: {
    backgroundColor: "#2196f3",
    padding: 12,
    borderRadius: 4,
    alignItems: "center",
    marginTop: 16,
  },
  closeButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});

