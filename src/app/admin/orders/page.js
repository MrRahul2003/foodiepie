/**
 * =========================================================================
 * ADMIN ORDERS PAGE - Real-time Order Management Dashboard
 * =========================================================================
 * 
 * PAGE FLOW:
 * 1. On mount, verify admin authentication from AdminSessionContext
 * 2. If not authenticated, show login prompt
 * 3. Fetch all active orders and statistics for the restaurant
 * 4. Display stats cards (session orders, revenue, active, served)
 * 5. Show active orders list with action buttons
 * 6. Admin can update order status: Placed → Accepted → Preparing → Served
 * 7. Admin can cancel orders at any stage with confirmation
 * 8. Auto-refresh every 10 seconds for real-time updates
 * 
 * STATE MANAGEMENT:
 * - orders: Array of all orders for the restaurant
 * - stats: Order statistics (counts and revenue)
 * - loading: Loading state during data fetch
 * - expandedOrder: Currently expanded order (for details)
 * 
 * FEATURES:
 * - Real-time order updates (polls every 10 seconds)
 * - Statistics dashboard with key metrics
 * - Order status progression (Accept → Prepare → Serve)
 * - Cancel order functionality at any stage
 * - Time ago display for order timestamps
 * - Live indicator showing real-time updates
 * 
 * ORDER STATUS FLOW:
 * Placed → Accepted → Preparing → Served
 *    ↓        ↓           ↓
 * Cancelled (can happen at any stage before Served)
 * 
 * =========================================================================
 */

"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Header1 from "@/src/_components/adminComponents/Header1";
import Header2 from "@/src/_components/adminComponents/Header2";
import Header3 from "@/src/_components/adminComponents/Header3";
import Footer from "@/src/_components/adminComponents/Footer";
import { useAdminSession } from "@/src/contexts/AdminSessionContext";
import {
  getRestaurantOrdersAction,
  getOrderStatsAction,
  updateOrderStatusAction,
} from "@/src/actions/orderActions";
import styles from "./orders.module.css";
import RequireAdminAuth from "@/src/_components/adminComponents/RequireAuth";

// =========================================================================
// CONSTANTS
// =========================================================================

/** Polling interval for order updates (10 seconds) */
const POLL_INTERVAL = 10000;

// =========================================================================
// HELPER FUNCTIONS
// =========================================================================

/**
 * Converts a timestamp to human-readable "time ago" format
 * @param {string|Date} createdAt - Order creation timestamp
 * @returns {string} Human-readable time string
 */
const getTimeAgo = (createdAt) => {
  const orderTime = new Date(createdAt);
  const now = new Date();
  const diffMs = now - orderTime;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

/**
 * Formats date to DD/MM/YYYY format
 * @param {string|Date} dateStr - Date to format
 * @returns {string} Formatted date string
 */
const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// =========================================================================
// MAIN COMPONENT
// =========================================================================

function AdminOrdersPage() {
  const router = useRouter();
  const { restaurantId, isAuthenticated, isLoaded } = useAdminSession();

  // -----------------------------------------------------------------------
  // STATE VARIABLES
  // -----------------------------------------------------------------------

  /** Array of all orders for the restaurant */
  const [orders, setOrders] = useState([]);
  
  /** Order statistics object */
  const [stats, setStats] = useState({
    sessionOrders: 0,
    sessionRevenue: 0,
    activeOrders: 0,
    servedOrders: 0,
  });
  
  /** Loading state during initial data fetch */
  const [loading, setLoading] = useState(true);
  
  /** Active tab selection (unused but kept for future tabs) */
  const [activeTab, setActiveTab] = useState("orders");
  
  /** Currently expanded order ID */
  const [expandedOrder, setExpandedOrder] = useState(null);

  // -----------------------------------------------------------------------
  // DATA FETCHING
  // -----------------------------------------------------------------------

  /**
   * Fetches orders and statistics from the server
   * Called on mount and every POLL_INTERVAL
   */
  const fetchData = useCallback(async () => {
    if (!restaurantId) return;

    try {
      const [ordersResult, statsResult] = await Promise.all([
        getRestaurantOrdersAction(restaurantId),
        getOrderStatsAction(restaurantId),
      ]);

      if (ordersResult.success) {
        setOrders(ordersResult.orders);
      }

      if (statsResult.success) {
        setStats(statsResult.stats);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  // -----------------------------------------------------------------------
  // EFFECTS
  // -----------------------------------------------------------------------

  /**
   * Effect: Initial fetch and polling setup
   * Sets up interval for live order updates
   */
  useEffect(() => {
    if (isLoaded && restaurantId) {
      fetchData();
      // Poll for updates every 10 seconds
      const interval = setInterval(fetchData, POLL_INTERVAL);
      return () => clearInterval(interval);
    }
  }, [isLoaded, restaurantId, fetchData]);

  // -----------------------------------------------------------------------
  // EVENT HANDLERS
  // -----------------------------------------------------------------------

  /**
   * Updates order status and refreshes statistics
   * @param {string} orderId - Order ID to update
   * @param {string} newStatus - New status to set
   */
  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      const result = await updateOrderStatusAction(orderId, newStatus);
      if (result.success) {
        // Update local state immediately for responsiveness
        setOrders((prev) =>
          prev.map((order) =>
            order.orderId === orderId ? { ...order, status: newStatus } : order
          )
        );
        // Refresh stats to reflect changes
        const statsResult = await getOrderStatsAction(restaurantId);
        if (statsResult.success) {
          setStats(statsResult.stats);
        }
      } else {
        alert("Failed to update order status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Something went wrong");
    }
  };

  // -----------------------------------------------------------------------
  // COMPUTED VALUES
  // -----------------------------------------------------------------------

  /** Filter to get only active orders (not served or cancelled) */
  const activeOrders = orders.filter(
    (o) => o.status !== "Served" && o.status !== "Cancelled"
  );

  // -----------------------------------------------------------------------
  // CONDITIONAL RENDERS
  // -----------------------------------------------------------------------

  // Loading state
  if (!isLoaded) {
    return (
      <RequireAdminAuth>
        <Header1 />
        <Header2 />
        <Header3 />
        <div className={styles.loadingContainer}>
          <p>Loading...</p>
        </div>
        <Footer />
      </RequireAdminAuth>
    );
  }

  // Not authenticated state
  if (!isAuthenticated) {
    return (
      <RequireAdminAuth>
        <Header1 />
        <Header2 />
        <Header3 />
        <div className={styles.loadingContainer}>
          <p>Please login to view orders</p>
        </div>
        <Footer />
      </RequireAdminAuth>
    );
  }

  // -----------------------------------------------------------------------
  // MAIN RENDER
  // -----------------------------------------------------------------------

  return (
    <RequireAdminAuth>
      {/* Header Section */}
      <Header1 />
      <Header2 />
      <Header3 />

      <div className={styles.ordersArea}>
        <div className="container">

          {/* Stats Cards */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ backgroundColor: "#fff3cd" }}>
                <i className="fa fa-clipboard" style={{ color: "#856404" }} />
              </div>
              <div className={styles.statContent}>
                <h3>{stats.sessionOrders}</h3>
                <p>Session Orders</p>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ backgroundColor: "#d4edda" }}>
                <i className="fa fa-inr" style={{ color: "#155724" }} />
              </div>
              <div className={styles.statContent}>
                <h3>₹{stats.sessionRevenue.toLocaleString()}</h3>
                <p>Session Revenue</p>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ backgroundColor: "#fff3cd" }}>
                <i className="fa fa-clock-o" style={{ color: "#856404" }} />
              </div>
              <div className={styles.statContent}>
                <h3>{stats.activeOrders}</h3>
                <p>Active Orders</p>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ backgroundColor: "#d4edda" }}>
                <i className="fa fa-check-circle" style={{ color: "#155724" }} />
              </div>
              <div className={styles.statContent}>
                <h3>{stats.servedOrders}</h3>
                <p>Served</p>
              </div>
            </div>
          </div>

          {/* Order History Link */}
          <div className={styles.historyBar}>
            <div className={styles.historyLeft}>
              <i className="fa fa-history" />
              <div>
                <h4>Order History</h4>
                <p>View all past orders & daily stats</p>
              </div>
            </div>
            <a href="/admin/history" className={styles.viewLink}>
              View →
            </a>
          </div>

          {/* Active Orders Section */}
          <div className={styles.activeOrdersSection}>
            <div className={styles.sectionHeader}>
              <h3>
                Active Orders{" "}
                <span className={styles.liveBadge}>
                  <span className={styles.liveDot}></span> LIVE
                </span>
              </h3>
              <span className={styles.orderCount}>{activeOrders.length} orders</span>
            </div>

            {loading ? (
              <div className={styles.loadingOrders}>Loading orders...</div>
            ) : activeOrders.length === 0 ? (
              <div className={styles.noOrders}>
                <i className="fa fa-inbox" />
                <p>No active orders</p>
              </div>
            ) : (
              <div className={styles.ordersList}>
                {activeOrders.map((order) => (
                  <div key={order.orderId} className={styles.orderCard}>
                    {/* Order Header */}
                    <div className={styles.orderHeader}>
                      <div className={styles.orderIdSection}>
                        <span className={styles.orderId}>#{order.orderId}</span>
                        <span className={styles.statusBadge}>{order.status}</span>
                      </div>
                      <span className={styles.orderTime}>
                        {getTimeAgo(order.createdAt)}
                      </span>
                    </div>

                    {/* Table & Customer Info */}
                    <div className={styles.tableInfo}>
                      <div className={styles.tableLeft}>
                        <i className="fa fa-users" />
                        <span>Table {order.tableNumber}</span>
                      </div>
                      <span className={styles.customerPhone}>{order.customerPhone}</span>
                    </div>

                    {/* Order Items */}
                    <div className={styles.orderItems}>
                      {order.items.map((item, idx) => (
                        <div key={idx} className={styles.orderItem}>
                          <div className={styles.itemLeft}>
                            <span
                              className={`${styles.foodDot} ${
                                item.foodType === "Veg"
                                  ? styles.vegDot
                                  : item.foodType === "Non-Veg"
                                  ? styles.nonVegDot
                                  : styles.eggDot
                              }`}
                            />
                            <span className={styles.itemQty}>{item.quantity}×</span>
                            <span className={styles.itemName}>{item.name}</span>
                            <span className={styles.itemVariant}>({item.variant.label})</span>
                          </div>
                          <span className={styles.itemPrice}>
                            ₹{item.variant.price * item.quantity}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Order Total */}
                    <div className={styles.orderTotal}>
                      <span>Total</span>
                      <span className={styles.totalAmount}>₹{order.total.toLocaleString()}</span>
                    </div>

                    {/* Action Buttons */}
                    <div className={styles.orderActions}>
                      {order.status === "Placed" && (
                        <>
                          <button
                            className={styles.acceptBtn}
                            onClick={() => handleStatusUpdate(order.orderId, "Accepted")}
                          >
                            Accept
                          </button>
                          <button
                            className={styles.rejectBtn}
                            onClick={() => {
                              if (confirm("Are you sure you want to cancel this order?")) {
                                handleStatusUpdate(order.orderId, "Cancelled");
                              }
                            }}
                          >
                            <i className="fa fa-times" />
                          </button>
                        </>
                      )}
                      {order.status === "Accepted" && (
                        <>
                          <button
                            className={styles.prepareBtn}
                            onClick={() => handleStatusUpdate(order.orderId, "Preparing")}
                          >
                            Start Preparing
                          </button>
                          <button
                            className={styles.cancelBtn}
                            onClick={() => {
                              if (confirm("Are you sure you want to cancel this order?")) {
                                handleStatusUpdate(order.orderId, "Cancelled");
                              }
                            }}
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      {order.status === "Preparing" && (
                        <>
                          <button
                            className={styles.serveBtn}
                            onClick={() => handleStatusUpdate(order.orderId, "Served")}
                          >
                            Mark as Served
                          </button>
                          <button
                            className={styles.cancelBtn}
                            onClick={() => {
                              if (confirm("Are you sure you want to cancel this order?")) {
                                handleStatusUpdate(order.orderId, "Cancelled");
                              }
                            }}
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </RequireAdminAuth>
  );
}

export default AdminOrdersPage;
