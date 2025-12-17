/**
 * SSL Certificate Configuration
 * 
 * For React Native, we need to handle self-signed certificates differently.
 * Since React Native uses the system's certificate store, we can't easily bypass SSL
 * validation like in .NET. However, we can:
 * 
 * 1. Use a library like react-native-ssl-pinning (if you have the cert)
 * 2. Use a custom native module to bypass SSL (requires native code)
 * 3. For development/testing: Use HTTP instead of HTTPS (not recommended for production)
 * 
 * For production with self-signed certs, you should:
 * - Install the certificate on the Android device
 * - Or use a proper CA-signed certificate
 * 
 * This file provides a helper to detect if we should use HTTP fallback.
 */

import type { AppConfig } from '../config/types';

/**
 * Checks if the API URL should use HTTP instead of HTTPS
 * (Only for development/testing with self-signed certs)
 */
export function shouldUseHttpFallback(config: AppConfig): boolean {
  // In production, always use HTTPS
  // For development, you can check if bypassSslValidation is set
  // But React Native can't bypass SSL easily, so we recommend:
  // 1. Use proper certificates in production
  // 2. Or install the self-signed cert on the device
  
  // For now, we'll use the URL as-is and let axios handle errors
  // The app will show connection errors if SSL validation fails
  return false;
}

/**
 * Converts HTTPS URL to HTTP (for development only)
 */
export function getHttpUrl(httpsUrl: string): string {
  return httpsUrl.replace(/^https:/i, 'http:');
}

