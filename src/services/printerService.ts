import TcpSocket from "react-native-tcp-socket";
import type { AppConfig } from "../config/types";

export function getPrinterIpForJob(printerType: number, config: AppConfig): string | null {
  if (printerType === 0) return config.printerIpKitchen || null;
  if (printerType === 1) return config.printerIpBar || null;
  return null;
}

export async function printToNetworkPrinter(
  host: string,
  port: number,
  content: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const client = TcpSocket.createConnection(
      {
        host,
        port,
        timeout: 5000
      },
      () => {
        // Convert string to Uint8Array for React Native (Buffer is not available)
        const encoder = new TextEncoder();
        const buffer = encoder.encode(content);
        client.write(buffer);
        client.destroy();
        resolve();
      }
    );

    client.on("error", (err: Error) => {
      client.destroy();
      reject(err);
    });

    client.on("timeout", () => {
      client.destroy();
      reject(new Error("Printer connection timeout"));
    });
  });
}


