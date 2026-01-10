/**
 * =========================================================================
 * CUSTOMER ORDER HISTORY PAGE - Past Orders & Statistics
 * =========================================================================
 * 
 * PAGE FLOW:
 * 1. On mount, verify customer session from SessionContext
 * 2. If not logged in, show authentication prompt
 * 3. Fetch all completed orders (Served/Cancelled) from database
 * 4. Display statistics: completed, cancelled, total spent
 * 5. Show orders with filter tabs (All/Completed/Cancelled)
 * 6. Each order card shows items, total, status, and timestamp
 * 
 * STATE MANAGEMENT:
 * - orders: Array of completed orders from database
 * - loading: Loading state during data fetch
 * - filter: Current filter tab ("all", "served", "cancelled")
 * 
 * FEATURES:
 * - Statistics cards (completed count, cancelled count, total spent)
 * - Filter tabs for order status
 * - Order cards with item details
 * - Timestamp formatting (date + time)
 * - Status badges with color coding
 * - Responsive card layout
 * 
 * =========================================================================
 */

"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Header1 from "@/src/_components/customerComponents/Header1";
import Header2 from "@/src/_components/customerComponents/Header2";
import Header3 from "@/src/_components/customerComponents/Header3";
import Footer from "@/src/_components/customerComponents/Footer";
import { useSession } from "@/src/contexts/SessionContext";
import { getCustomerOrdersAction } from "@/src/actions/orderActions";
import styles from "./history.module.css";
import RequireAuth from "@/src/_components/customerComponents/RequireAuth";

// =========================================================================
// HELPER FUNCTIONS
// =========================================================================

/**
 * Formats date to "DD Mon YYYY" format
 * @param {string|Date} dateStr - Date to format
 * @returns {string} Formatted date string
 */
const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/**
 * Formats time to "HH:MM AM/PM" format
 * @param {string|Date} dateStr - Date to format
 * @returns {string} Formatted time string
 */
const formatTime = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

// =========================================================================
// MAIN COMPONENT
// =========================================================================

function CustomerHistoryPage() {
  const router = useRouter();
  const session = useSession();

  // -----------------------------------------------------------------------
  // STATE VARIABLES
  // -----------------------------------------------------------------------

  /** Array of completed orders */
  const [orders, setOrders] = useState([]);
  
  /** Loading state during initial data fetch */
  const [loading, setLoading] = useState(true);
  
  /** Current filter tab ("all", "served", "cancelled") */
  const [filter, setFilter] = useState("all");

  // -----------------------------------------------------------------------
  // DATA FETCHING
  // -----------------------------------------------------------------------

  /**
   * Fetches completed orders (Served/Cancelled) from database
   */
  const fetchData = useCallback(async () => {
    if (!session.customerPhone || !session.restaurantCode) return;

    try {
      const ordersResult = await getCustomerOrdersAction(
        session.customerPhone,
        session.restaurantCode
      );

      if (ordersResult.success) {
        // Filter only completed orders (Served or Cancelled)
        const completedOrders = ordersResult.orders.filter(
          (order) => order.status === "Served" || order.status === "Cancelled"
        );
        setOrders(completedOrders);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [session.customerPhone, session.restaurantCode]);

  // -----------------------------------------------------------------------
  // EFFECTS
  // -----------------------------------------------------------------------

  /**
   * Effect: Fetch data when session is loaded
   */
  useEffect(() => {
    if (session.isLoaded && session.customerPhone) {
      fetchData();
    } else if (session.isLoaded && !session.customerPhone) {
      setLoading(false);
    }
  }, [session.isLoaded, session.customerPhone, fetchData]);

  // -----------------------------------------------------------------------
  // COMPUTED VALUES
  // -----------------------------------------------------------------------

  /** Filtered orders based on selected tab */
  const filteredOrders = orders.filter((order) => {
    if (filter === "all") return true;
    return order.status.toLowerCase() === filter;
  });

  /** Count of served orders */
  const servedCount = orders.filter((o) => o.status === "Served").length;
  
  /** Count of cancelled orders */
  const cancelledCount = orders.filter((o) => o.status === "Cancelled").length;
  
  /** Total amount spent on served orders */
  const totalSpent = orders
    .filter((o) => o.status === "Served")
    .reduce((sum, o) => sum + o.total, 0);

  // -----------------------------------------------------------------------
  // CONDITIONAL RENDERS
  // -----------------------------------------------------------------------

  // Loading state
  if (!session.isLoaded) {
    return (
      <RequireAuth>
        <Header1 />
        <Header2 />
        <Header3 />
        <div className={styles.loadingContainer}>
          <p>Loading...</p>
        </div>
        <Footer />
      </RequireAuth>
    );
  }

  // Not logged in state
  if (!session.customerPhone) {
    return (
      <RequireAuth>
        <Header1 />
        <Header2 />
        <Header3 />
        <div className={styles.loginPrompt}>
          <i className="fa fa-user-circle" />
          <h3>Please Login</h3>
          <p>Login to view your order history</p>
          <button onClick={() => router.push("/auth")} className={styles.loginBtn}>
            Login Now
          </button>
        </div>
        <Footer />
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <Header1 />
      <Header2 />
      <Header3 />

      <div className={styles.historyArea}>
        <div className="container">
          {/* Page Header */}
          <div className={styles.pageHeader}>
            <h2 className={styles.pageTitle}>
              <i className="fa fa-history" /> Order History
            </h2>
            <button className={styles.refreshBtn} onClick={fetchData}>
              <i className="fa fa-refresh" />
            </button>
          </div>

          {/* Stats Cards */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ backgroundColor: "#d4edda" }}>
                <i className="fa fa-check-circle" style={{ color: "#155724" }} />
              </div>
              <div className={styles.statContent}>
                <h3>{servedCount}</h3>
                <p>Completed</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ backgroundColor: "#f8d7da" }}>
                <i className="fa fa-times-circle" style={{ color: "#721c24" }} />
              </div>
              <div className={styles.statContent}>
                <h3>{cancelledCount}</h3>
                <p>Cancelled</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ backgroundColor: "#cce5ff" }}>
                <i className="fa fa-inr" style={{ color: "#004085" }} />
              </div>
              <div className={styles.statContent}>
                <h3>₹{totalSpent.toLocaleString()}</h3>
                <p>Total Spent</p>
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className={styles.filterTabs}>
            <button
              className={`${styles.filterTab} ${filter === "all" ? styles.activeTab : ""}`}
              onClick={() => setFilter("all")}
            >
              All ({orders.length})
            </button>
            <button
              className={`${styles.filterTab} ${filter === "served" ? styles.activeTab : ""}`}
              onClick={() => setFilter("served")}
            >
              Completed ({servedCount})
            </button>
            <button
              className={`${styles.filterTab} ${filter === "cancelled" ? styles.activeTab : ""}`}
              onClick={() => setFilter("cancelled")}
            >
              Cancelled ({cancelledCount})
            </button>
          </div>

          {/* Orders List */}
          <div className={styles.ordersSection}>
            {loading ? (
              <div className={styles.loadingOrders}>Loading orders...</div>
            ) : filteredOrders.length === 0 ? (
              <div className={styles.noOrders}>
                <i className="fa fa-inbox" />
                <p>No orders found</p>
                <button onClick={() => router.push("/menu")} className={styles.browseBtn}>
                  Browse Menu
                </button>
              </div>
            ) : (
              <div className={styles.ordersList}>
                {filteredOrders.map((order) => (
                  <div key={order.orderId} className={styles.orderCard}>
                    {/* Order Header */}
                    <div className={styles.orderHeader}>
                      <div className={styles.orderIdSection}>
                        <span className={styles.orderId}>#{order.orderId}</span>
                        <span
                          className={`${styles.statusBadge} ${
                            order.status === "Served"
                              ? styles.servedBadge
                              : styles.cancelledBadge
                          }`}
                        >
                          {order.status === "Served" ? "Completed" : order.status}
                        </span>
                      </div>
                      <div className={styles.orderDateTime}>
                        <span className={styles.date}>{formatDate(order.createdAt)}</span>
                        <span className={styles.time}>{formatTime(order.createdAt)}</span>
                      </div>
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

                    {/* Order Footer */}
                    <div className={styles.orderFooter}>
                      <div className={styles.footerLeft}>
                        <span className={styles.tableInfo}>
                          <i className="fa fa-cutlery" /> Table {order.tableNumber}
                        </span>
                        <span className={styles.paymentInfo}>
                          <i className="fa fa-credit-card" /> {order.paymentMethod}
                        </span>
                      </div>
                      <div className={styles.orderTotal}>
                        <span>Total:</span>
                        <span className={styles.totalAmount}>₹{order.total.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </RequireAuth>
  );
}

export default CustomerHistoryPage;
