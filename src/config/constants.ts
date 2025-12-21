/**
 * Application Constants
 * 
 * Centralized configuration constants for the Restro24 Print Agent.
 * Update values here to change defaults across the entire application.
 */

// API Configuration
export const DEFAULT_API_BASE_URL = "https://restro24api.dailotech.com";
export const DEFAULT_API_KEY = "test-api-key-12345";
export const API_TIMEOUT_MS = 10000;

// Default Configuration Values
export const DEFAULT_RESTAURANT_ID = "16";
export const DEFAULT_AGENT_NAME = "Android Print Agent";
export const DEFAULT_POLL_INTERVAL_MS = 10000;

// Agent ID Generation
export const AGENT_ID_PREFIX = "Android-";

// Legacy/Development URLs (for migration and documentation)
export const LEGACY_HTTP_URL = "http://164.68.118.52:8006";
export const LEGACY_HTTPS_URL = "https://164.68.118.52:8006";

// Certificate Extraction (for documentation/scripts)
export const LEGACY_CERT_HOST = "164.68.118.52";
export const LEGACY_CERT_PORT = "8006";
