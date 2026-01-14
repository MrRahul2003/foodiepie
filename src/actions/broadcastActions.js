/**
 * =========================================================================
 * BROADCAST ACTIONS - Real-time Event Broadcasting via SSE
 * =========================================================================
 * 
 * Server actions for broadcasting events to connected SSE clients.
 * Uses globalThis.__sseConnections to access the SSE connections map.
 * 
 * =========================================================================
 */

"use server";

/**
 * Broadcast event to all connections for a restaurant
 * @param {string} restaurantId - Restaurant ID
 * @param {string} event - Event name
 * @param {any} data - Event data
 */
export async function broadcastToRestaurantAction(restaurantId, event, data) {
  try {
    const connections = globalThis.__sseConnections;
    if (!connections) return { success: false, error: "No connections available" };

    const encoder = new TextEncoder();
    const message = `data: ${JSON.stringify({ event, data, timestamp: Date.now() })}\n\n`;
    let broadcastCount = 0;

    connections.forEach((conn, connId) => {
      if (conn.restaurantId === restaurantId) {
        try {
          conn.controller.enqueue(encoder.encode(message));
          broadcastCount++;
        } catch {
          connections.delete(connId);
        }
      }
    });

    return { success: true, broadcastCount };
  } catch (error) {
    console.error("Broadcast error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Broadcast event to a specific customer
 * @param {string} restaurantId - Restaurant ID
 * @param {string} customerPhone - Customer phone number
 * @param {string} event - Event name
 * @param {any} data - Event data
 */
export async function broadcastToCustomerAction(restaurantId, customerPhone, event, data) {
  try {
    const connections = globalThis.__sseConnections;
    if (!connections) return { success: false, error: "No connections available" };

    const encoder = new TextEncoder();
    const message = `data: ${JSON.stringify({ event, data, timestamp: Date.now() })}\n\n`;
    let broadcastCount = 0;

    connections.forEach((conn, connId) => {
      if (
        conn.restaurantId === restaurantId &&
        conn.type === "customer" &&
        conn.customerPhone === customerPhone
      ) {
        try {
          conn.controller.enqueue(encoder.encode(message));
          broadcastCount++;
        } catch {
          connections.delete(connId);
        }
      }
    });

    return { success: true, broadcastCount };
  } catch (error) {
    console.error("Broadcast to customer error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Broadcast event to admin connections only
 * @param {string} restaurantId - Restaurant ID
 * @param {string} event - Event name
 * @param {any} data - Event data
 */
export async function broadcastToAdminAction(restaurantId, event, data) {
  try {
    const connections = globalThis.__sseConnections;
    if (!connections) return { success: false, error: "No connections available" };

    const encoder = new TextEncoder();
    const message = `data: ${JSON.stringify({ event, data, timestamp: Date.now() })}\n\n`;
    let broadcastCount = 0;

    connections.forEach((conn, connId) => {
      if (conn.restaurantId === restaurantId && conn.type === "admin") {
        try {
          conn.controller.enqueue(encoder.encode(message));
          broadcastCount++;
        } catch {
          connections.delete(connId);
        }
      }
    });

    return { success: true, broadcastCount };
  } catch (error) {
    console.error("Broadcast to admin error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get connection statistics
 * @param {string} restaurantId - Optional restaurant ID filter
 */
export async function getConnectionStatsAction(restaurantId = null) {
  try {
    const connections = globalThis.__sseConnections;
    if (!connections) return { success: true, stats: { total: 0, admin: 0, customer: 0 } };

    let total = 0;
    let admin = 0;
    let customer = 0;

    connections.forEach((conn) => {
      if (!restaurantId || conn.restaurantId === restaurantId) {
        total++;
        if (conn.type === "admin") admin++;
        if (conn.type === "customer") customer++;
      }
    });

    return { success: true, stats: { total, admin, customer } };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
