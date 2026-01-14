/**
 * =========================================================================
 * WEBSOCKET CONTEXT - Real-time Connection Management
 * =========================================================================
 * 
 * This context provides WebSocket (SSE) connection management for
 * real-time order updates throughout the application.
 * 
 * FEATURES:
 * - Automatic connection management
 * - Reconnection on disconnect
 * - Event subscription system
 * - Connection status tracking
 * 
 * USAGE:
 * 1. Wrap your app with WebSocketProvider
 * 2. Use useWebSocket() hook to access connection
 * 3. Subscribe to events with subscribe(eventName, callback)
 * 
 * =========================================================================
 */

"use client";
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { WS_EVENTS } from "@/src/lib/websocket";

const WebSocketContext = createContext(null);

export function WebSocketProvider({ children }) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionId, setConnectionId] = useState(null);
  const eventSourceRef = useRef(null);
  const subscribersRef = useRef(new Map());
  const reconnectTimeoutRef = useRef(null);
  const connectionParamsRef = useRef(null);

  /**
   * Subscribe to a specific event
   * @param {string} eventName - Event name to subscribe to
   * @param {function} callback - Callback function to execute
   * @returns {function} Unsubscribe function
   */
  const subscribe = useCallback((eventName, callback) => {
    if (!subscribersRef.current.has(eventName)) {
      subscribersRef.current.set(eventName, new Set());
    }
    subscribersRef.current.get(eventName).add(callback);

    // Return unsubscribe function
    return () => {
      const subscribers = subscribersRef.current.get(eventName);
      if (subscribers) {
        subscribers.delete(callback);
      }
    };
  }, []);

  /**
   * Notify all subscribers of an event
   * @param {string} eventName - Event name
   * @param {any} data - Event data
   */
  const notifySubscribers = useCallback((eventName, data) => {
    const subscribers = subscribersRef.current.get(eventName);
    if (subscribers) {
      subscribers.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in subscriber for ${eventName}:`, error);
        }
      });
    }
  }, []);

  /**
   * Connect to the SSE endpoint
   * @param {Object} params - Connection parameters
   * @param {string} params.restaurantId - Restaurant ID
   * @param {string} params.type - Connection type ("admin" or "customer")
   * @param {string} params.customerPhone - Customer phone (for customer type)
   */
  const connect = useCallback((params) => {
    const { restaurantId, type, customerPhone } = params;

    if (!restaurantId || !type) {
      console.error("Missing required connection parameters");
      return;
    }

    // Store params for reconnection
    connectionParamsRef.current = params;

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Build URL with query params
    const url = new URL("/api/ws", window.location.origin);
    url.searchParams.set("restaurantId", restaurantId);
    url.searchParams.set("type", type);
    if (customerPhone) {
      url.searchParams.set("customerPhone", customerPhone);
    }

    // Create new EventSource connection
    const eventSource = new EventSource(url.toString());
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log("SSE connection opened");
      setIsConnected(true);
      // Clear any pending reconnect
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const { event: eventName, data: eventData, timestamp } = data;

        // Handle connection event
        if (eventName === "connected") {
          setConnectionId(data.connectionId);
        }

        // Notify subscribers
        notifySubscribers(eventName, eventData);

        // Also notify "all" subscribers
        notifySubscribers("*", { event: eventName, data: eventData, timestamp });
      } catch (error) {
        console.error("Error parsing SSE message:", error);
      }
    };

    eventSource.onerror = (error) => {
      console.error("SSE connection error:", error);
      setIsConnected(false);
      eventSource.close();

      // Attempt reconnection after 5 seconds
      if (!reconnectTimeoutRef.current && connectionParamsRef.current) {
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectTimeoutRef.current = null;
          if (connectionParamsRef.current) {
            connect(connectionParamsRef.current);
          }
        }, 5000);
      }
    };
  }, [notifySubscribers]);

  /**
   * Disconnect from SSE endpoint
   */
  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsConnected(false);
    setConnectionId(null);
    connectionParamsRef.current = null;

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  const value = {
    isConnected,
    connectionId,
    connect,
    disconnect,
    subscribe,
    WS_EVENTS,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

/**
 * Hook to access WebSocket context
 * @returns {Object} WebSocket context value
 */
export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
}

export default WebSocketContext;
