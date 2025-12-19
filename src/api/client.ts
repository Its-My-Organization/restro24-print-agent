import axios from "axios";
import type { AppConfig } from "../config/types";

export function createApiClient(config: AppConfig) {
  const client = axios.create({
    baseURL: `${config.cloudApiBaseUrl.replace(/\/+$/, "")}/api`,
    timeout: 10000,
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": config.apiKey
    }
  });

  // Request interceptor for debugging
  client.interceptors.request.use(
    (request) => {
      console.log(`[API] ${request.method?.toUpperCase()} ${request.url}`, {
        baseURL: request.baseURL,
        headers: {
          ...request.headers,
          "X-API-Key": request.headers["X-API-Key"] ? "***" : "MISSING"
        },
        data: request.data
      });
      return request;
    },
    (error) => {
      console.error("[API] Request error:", error);
      return Promise.reject(error);
    }
  );

  // Response interceptor for debugging
  client.interceptors.response.use(
    (response) => {
      console.log(`[API] Response ${response.status} ${response.config.url}`, {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      });
      return response;
    },
    (error) => {
      // Log the full error object for debugging
      console.error("[API] Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      
      const errorDetails = {
        message: error?.message,
        code: error?.code,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
        url: error?.config?.url,
        baseURL: error?.config?.baseURL,
        // Additional error properties
        errno: error?.errno,
        syscall: error?.syscall,
        address: error?.address,
        port: error?.port,
        stack: error?.stack
      };
      
      // Detect SSL/certificate issues
      const isSSLError = 
        (error?.code === "ERR_NETWORK" || error?.code === "ECONNREFUSED" || error?.code === "ENOTFOUND") && 
        !error?.response && 
        error?.config?.baseURL?.startsWith("https://");
      
      // Check for specific SSL error messages
      const hasSSLErrorMessage = 
        error?.message?.toLowerCase().includes("ssl") ||
        error?.message?.toLowerCase().includes("certificate") ||
        error?.message?.toLowerCase().includes("cert") ||
        error?.message?.toLowerCase().includes("handshake") ||
        error?.code === "CERT_HAS_EXPIRED" ||
        error?.code === "UNABLE_TO_VERIFY_LEAF_SIGNATURE";
      
      if (isSSLError || hasSSLErrorMessage) {
        console.error("[API] SSL Certificate Error detected:", {
          ...errorDetails,
          hint: "React Native's network stack is stricter than the browser. Even if the browser works, React Native may reject the certificate.",
          note: "The browser uses a different certificate validation mechanism than React Native.",
          solutions: [
            "1. Get the server's SSL certificate file (.crt or .pem)",
            "2. Transfer it to the Android device",
            "3. Settings → Security → Install from storage",
            "4. Select the certificate file",
            "5. Install as USER certificate (not just view)",
            "6. Restart the app after installation",
            "",
            "Note: The browser may work without this, but React Native requires the certificate."
          ]
        });
      } else {
        console.error("[API] Response error:", errorDetails);
        
        // Check if it's a connection refused error
        if (error?.code === "ECONNREFUSED" || error?.code === "ERR_NETWORK") {
          const isHttps = error?.config?.baseURL?.startsWith("https://");
          console.error("[API] Connection Error - Possible causes:");
          if (isHttps) {
            console.error("1. SSL certificate not installed on device (most common)");
            console.error("2. Device/emulator cannot reach the server IP");
            console.error("3. Firewall blocking the connection");
            console.error("4. Wrong IP address or port");
            console.error("5. Network connectivity issue");
            console.error("");
            console.error("DIAGNOSTIC STEPS:");
            console.error("1. Test HTTPS in browser: https://164.68.118.52:8006/api/printagent/register");
            console.error("2. If browser works but app doesn't, install SSL certificate on device");
            console.error("3. Check if device/emulator can reach the server IP");
            console.error("4. Verify the SSL certificate is installed as USER certificate");
          } else {
            console.error("1. Server only accepts HTTPS (not HTTP)");
            console.error("2. Device/emulator cannot reach the server IP");
            console.error("3. Firewall blocking the connection");
            console.error("4. Wrong IP address or port");
            console.error("5. Network connectivity issue");
            console.error("");
            console.error("SOLUTION: Use HTTPS and install the SSL certificate on the device");
          }
        }
      }
      
      return Promise.reject(error);
    }
  );

  return client;
}


