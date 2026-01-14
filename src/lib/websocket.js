/**
 * =========================================================================
 * WEBSOCKET UTILITIES - Shared WebSocket Configuration
 * =========================================================================
 * 
 * This file contains shared WebSocket utilities and configuration
 * for real-time order updates between admin and customers.
 * 
 * =========================================================================
 */

// WebSocket event types
export const WS_EVENTS = {
  // Order events
  ORDER_PLACED: "order:placed",
  ORDER_UPDATED: "order:updated",
  ORDER_STATUS_CHANGED: "order:status_changed",
  
  // Connection events
  SUBSCRIBE_RESTAURANT: "subscribe:restaurant",
  SUBSCRIBE_CUSTOMER: "subscribe:customer",
  UNSUBSCRIBE: "unsubscribe",
  
  // System events
  CONNECTED: "connected",
  ERROR: "error",
  PING: "ping",
  PONG: "pong",
};

// WebSocket message helper
export function createWSMessage(event, data) {
  return JSON.stringify({ event, data, timestamp: Date.now() });
}

// Parse WebSocket message
export function parseWSMessage(message) {
  try {
    return JSON.parse(message);
  } catch (error) {
    console.error("Failed to parse WebSocket message:", error);
    return null;
  }
}
