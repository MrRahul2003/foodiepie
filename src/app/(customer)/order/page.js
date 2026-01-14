/**
 * =========================================================================
 * CUSTOMER ORDER TRACKING PAGE - Real-time Order Status
 * =========================================================================
 * 
 * PAGE FLOW:
 * 1. On mount, check if session data is available
 * 2. Fetch orders from database using customer phone and restaurant ID
 * 3. Fall back to localStorage if session unavailable or fetch fails
 * 4. Display orders with expandable cards showing:
 *    - Order status progress (Placed → Accepted → Preparing → Served)
 *    - Order items with quantities and prices
 *    - Bill summary
 * 5. Auto-refresh orders every 15 seconds for live updates
 * 
 * STATE MANAGEMENT:
 * - orders: Array of order objects from database/localStorage
 * - expandedOrder: Currently expanded order ID for accordion
 * - loading: Loading state during data fetch
 * 
 * FEATURES:
 * - Real-time status updates (polls every 15 seconds)
 * - Expandable order cards with full details
 * - Visual progress indicator for order status
 * - Time ago display for order timestamps
 * - Live indicator showing real-time updates
 * - Fallback to localStorage for offline access
 * 
 * =========================================================================
 */

"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Footer from "@/src/_components/customerComponents/Footer";
import Header1 from "@/src/_components/customerComponents/Header1";
import Header2 from "@/src/_components/customerComponents/Header2";
import Header3 from "@/src/_components/customerComponents/Header3";
import { useSession } from "@/src/contexts/SessionContext";
import { useWebSocket } from "@/src/contexts/WebSocketContext";
import { getCustomerOrdersAction } from "@/src/actions/orderActions";
import styles from "./order.module.css";
import RequireAuth from "@/src/_components/customerComponents/RequireAuth";

// =========================================================================
// CONSTANTS
// =========================================================================

/** Order status steps for progress indicator */
const ORDER_STATUSES = [
  { id: "Placed", label: "Placed", icon: "🕐" },
  { id: "Accepted", label: "Accepted", icon: "✓" },
  { id: "Preparing", label: "Preparing", icon: "👨‍🍳" },
  { id: "Served", label: "Served", icon: "🍽️" },
];

// =========================================================================
// HELPER FUNCTIONS
// =========================================================================

/**
 * Converts a timestamp to human-readable "time ago" format
 * @param {string|Date} createdAt - Order creation timestamp
 * @returns {string} Human-readable time string (e.g., "5m ago", "2h ago")
 */
const getTimeAgo = (createdAt) => {
  const orderTime = new Date(createdAt);
  const now = new Date();
  const diffMs = now - orderTime;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) {
    return "Just now";
  } else if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else {
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    }
  }
};

/**
 * Gets the index of a status in the ORDER_STATUSES array
 * Used for progress indicator calculation
 * @param {string} status - Current order status
 * @returns {number} Index of the status (-1 if not found)
 */
const getStatusIndex = (status) => {
  return ORDER_STATUSES.findIndex((s) => s.id === status);
};

// =========================================================================
// MAIN COMPONENT
// =========================================================================

function OrderPage() {
  const router = useRouter();
  const session = useSession();
  const { connect, disconnect, subscribe, isConnected, WS_EVENTS } = useWebSocket();

  // -----------------------------------------------------------------------
  // STATE VARIABLES
  // -----------------------------------------------------------------------

  /** Array of customer orders */
  const [orders, setOrders] = useState([]);
  
  /** Currently expanded order ID (for accordion behavior) */
  const [expandedOrder, setExpandedOrder] = useState(null);
  
  /** Loading state during initial data fetch */
  const [loading, setLoading] = useState(true);

  // -----------------------------------------------------------------------
  // DATA FETCHING
  // -----------------------------------------------------------------------

  /**
   * Fetches orders from backend or falls back to localStorage
   * Called on mount and every POLL_INTERVAL for live updates
   */
  const fetchOrders = useCallback(async () => {
    if (!session.customerPhone || !session.restaurantId) {
      // Fallback to localStorage if session not available
      const savedOrders = localStorage.getItem("foodie_pie_orders");
      if (savedOrders) {
        const parsedOrders = JSON.parse(savedOrders);
        setOrders(parsedOrders);
        if (parsedOrders.length > 0) {
          setExpandedOrder(parsedOrders[0].orderId);
        }
      }
      setLoading(false);
      return;
    }

    try {
      const result = await getCustomerOrdersAction(
        session.customerPhone,
        session.restaurantId
      );

      if (result.success && result.orders.length > 0) {
        setOrders(result.orders);
        setExpandedOrder(result.orders[0].orderId);
      } else {
        // Fallback to localStorage
        const savedOrders = localStorage.getItem("foodie_pie_orders");
        if (savedOrders) {
          const parsedOrders = JSON.parse(savedOrders);
          setOrders(parsedOrders);
          if (parsedOrders.length > 0) {
            setExpandedOrder(parsedOrders[0].orderId);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      // Fallback to localStorage
      const savedOrders = localStorage.getItem("foodie_pie_orders");
      if (savedOrders) {
        const parsedOrders = JSON.parse(savedOrders);
        setOrders(parsedOrders);
        if (parsedOrders.length > 0) {
          setExpandedOrder(parsedOrders[0].orderId);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [session.customerPhone, session.restaurantId]);

  // -----------------------------------------------------------------------
  // EFFECTS
  // -----------------------------------------------------------------------

  /**
   * Effect: Initial fetch and WebSocket setup
   * Connects to SSE for real-time status updates
   */
  useEffect(() => {
    if (session.isLoaded) {
      fetchOrders();

      // Connect to WebSocket for real-time updates
      if (session.restaurantId && session.customerPhone) {
        connect({
          restaurantId: session.restaurantId,
          type: "customer",
          customerPhone: session.customerPhone,
        });
      }

      return () => disconnect();
    }
  }, [session.isLoaded, session.restaurantId, session.customerPhone, fetchOrders, connect, disconnect]);

  /**
   * Effect: Subscribe to WebSocket events
   * Handles real-time order status updates
   */
  useEffect(() => {
    if (!isConnected) return;

    // Handle order status change
    const unsubStatusChange = subscribe(WS_EVENTS.ORDER_STATUS_CHANGED, (data) => {
      if (data?.orderId) {
        setOrders((prev) =>
          prev.map((order) =>
            order.orderId === data.orderId
              ? { ...order, status: data.status }
              : order
          )
        );
      }
    });

    return () => {
      unsubStatusChange();
    };
  }, [isConnected, subscribe, WS_EVENTS]);

  // -----------------------------------------------------------------------
  // EVENT HANDLERS
  // -----------------------------------------------------------------------

  /**
   * Toggles the expanded state of an order card
   * @param {string} orderId - Order ID to toggle
   */
  const toggleOrderExpand = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  // -----------------------------------------------------------------------
  // CONDITIONAL RENDERS
  // -----------------------------------------------------------------------

  // Loading state
  if (loading) {
    return (
      <RequireAuth>
        <Header1 />
        <Header2 />
        <Header3 />
        <div className={styles.orderArea}>
          <div className="container">
            <div className={styles.noOrder}>
              <div className={styles.noOrderIcon}>⏳</div>
              <h3>Loading orders...</h3>
            </div>
          </div>
        </div>
        <Footer />
      </RequireAuth>
    );
  }

  // Empty state
  if (orders.length === 0) {
    return (
      <RequireAuth>
        <Header1 />
        <Header2 />
        <Header3 />
        <div className={styles.orderArea}>
          <div className="container">
            <div className={styles.noOrder}>
              <div className={styles.noOrderIcon}>📋</div>
              <h3>No active orders</h3>
              <p>You don't have any orders right now</p>
              <button
                className={styles.orderMoreBtn}
                onClick={() => router.push("/menu")}
              >
                🏠 Order Now
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </RequireAuth>
    );
  }

  // -----------------------------------------------------------------------
  // MAIN RENDER
  // -----------------------------------------------------------------------

  return (
    <RequireAuth>
      {/* Header Section */}
      <Header1 />
      <Header2 />
      <Header3 />

      {/* Page Header */}
      <div className={styles.orderHeader}>
        <div className="container">
          <div className={styles.orderHeaderContent}>
            <div className={styles.orderHeaderLeft}>
              <button
                className={styles.backBtn}
                onClick={() => router.push("/menu")}
              >
                ←
              </button>
              <div>
                <h2>My Orders</h2>
                <span className={styles.timeAgo}>{orders.length} order{orders.length > 1 ? 's' : ''}</span>
              </div>
            </div>
            <div className={styles.liveIndicator}>
              <span className={styles.liveDot}></span>
              LIVE
            </div>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className={styles.orderArea}>
        <div className="container">
          {orders.map((order) => {
            const currentStatusIndex = getStatusIndex(order.status);
            const isExpanded = expandedOrder === order.orderId;

            return (
              <div key={order.orderId} className={styles.orderCard}>
                {/* Order Card Header - Always Visible */}
                <div 
                  className={styles.orderCardHeader}
                  onClick={() => toggleOrderExpand(order.orderId)}
                >
                  <div className={styles.orderCardHeaderLeft}>
                    <div className={styles.orderIdBadge}>#{order.orderId}</div>
                    <div className={styles.orderCardMeta}>
                      <span className={styles.orderCardItems}>
                        {order.items.length} item{order.items.length > 1 ? 's' : ''}
                      </span>
                      <span className={styles.orderCardTime}>{getTimeAgo(order.createdAt)}</span>
                    </div>
                  </div>
                  <div className={styles.orderCardHeaderRight}>
                    <span className={styles.statusBadgeSmall}>{order.status}</span>
                    <span className={styles.orderCardTotal}>₹{order.total}</span>
                    <span className={`${styles.expandIcon} ${isExpanded ? styles.expanded : ''}`}>
                      ▼
                    </span>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className={styles.orderCardBody}>
                    {/* Status Progress */}
                    <div className={styles.statusSection}>
                      <div className={styles.progressContainer}>
                        {ORDER_STATUSES.map((status, index) => (
                          <div key={status.id} className={styles.progressStep}>
                            <div
                              className={`${styles.progressIcon} ${
                                index <= currentStatusIndex ? styles.active : ""
                              } ${index === currentStatusIndex ? styles.current : ""}`}
                            >
                              {index < currentStatusIndex ? "✓" : status.icon}
                            </div>
                            <span
                              className={`${styles.progressLabel} ${
                                index <= currentStatusIndex ? styles.activeLabel : ""
                              }`}
                            >
                              {status.label}
                            </span>
                            {index < ORDER_STATUSES.length - 1 && (
                              <div
                                className={`${styles.progressLine} ${
                                  index < currentStatusIndex ? styles.activeLine : ""
                                }`}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Order Info */}
                    <div className={styles.infoSection}>
                      <div className={styles.infoItem}>
                        <span className={styles.infoIcon}>📍</span>
                        <span>Table {order.tableNumber}</span>
                      </div>
                      <div className={styles.infoItem}>
                        <span className={styles.infoIcon}>📞</span>
                        <span>{order.phone}</span>
                      </div>
                      <div className={styles.infoItem}>
                        <span className={styles.infoIcon}>💳</span>
                        <span>{order.paymentMethod}</span>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className={styles.itemsSection}>
                      <h5 className={styles.itemsSectionTitle}>Order Items</h5>
                      {order.items.map((item, index) => (
                        <div key={index} className={styles.orderItem}>
                          <div className={styles.itemLeft}>
                            <span
                              className={`${styles.foodTypeIndicator} ${
                                item.foodType === "Veg" ? styles.veg : styles.nonVeg
                              }`}
                            ></span>
                            <div className={styles.itemDetails}>
                              <span className={styles.itemName}>{item.name}</span>
                              <span className={styles.itemVariant}>
                                {item.variant.label} × {item.quantity}
                              </span>
                            </div>
                          </div>
                          <span className={styles.itemPrice}>
                            ₹{item.variant.price * item.quantity}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Bill Summary */}
                    <div className={styles.billSummary}>
                      <div className={styles.billRow}>
                        <span>Subtotal</span>
                        <span>₹{order.subtotal}</span>
                      </div>
                      <div className={styles.billRow}>
                        <span>Taxes</span>
                        <span>₹{order.tax}</span>
                      </div>
                      {order.discount > 0 && (
                        <div className={`${styles.billRow} ${styles.discountRow}`}>
                          <span>Discount</span>
                          <span>-₹{order.discount}</span>
                        </div>
                      )}
                      <div className={styles.billTotal}>
                        <span>Total</span>
                        <span className={styles.totalAmount}>₹{order.total}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className={styles.bottomBar}>
        <button
          className={styles.orderMoreBtn}
          onClick={() => router.push("/menu")}
        >
          🏠 Order More
        </button>
      </div>

      <Footer />
    </RequireAuth>
  );
}

export default OrderPage;