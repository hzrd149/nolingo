import { initializeVapidKeys } from "./push-notifications";

/**
 * Initialize server-side services
 * This should be called when the server starts
 */
export async function initializeServer() {
  try {
    console.log("Initializing server services...");

    // Initialize VAPID keys for push notifications
    await initializeVapidKeys();

    console.log("Server services initialized successfully");
  } catch (error) {
    console.error("Error initializing server services:", error);
    throw error;
  }
}

/**
 * Initialize server services if not already initialized
 * This can be called safely multiple times
 */
export async function ensureServerInitialized() {
  try {
    await initializeVapidKeys();
  } catch (error) {
    console.error("Error ensuring server initialization:", error);
    // Don't throw here to prevent breaking the app if push notifications fail
  }
}
