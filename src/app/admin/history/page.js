/**
 * =========================================================================
 * ADMIN ORDER HISTORY PAGE - Past Orders & Revenue Statistics
 * =========================================================================
 * 
 * PAGE FLOW:
 * 1. On mount, verify admin authentication from AdminSessionContext
 * 2. If not authenticated, show login prompt
 * 3. Fetch all completed orders (Served/Cancelled) from database
 * 4. Display statistics: served count, cancelled count, total revenue
 * 5. Show orders with filter tabs (Status + Date range)
 * 6. Table view with order details, items, and totals
 * 
 * STATE MANAGEMENT:
 * - orders: Array of completed orders from database
 * - loading: Loading state during data fetch
 * - filter: Status filter ("all", "served", "cancelled")
 * - dateFilter: Date range filter ("today", "week", "month", "all")
 * 
 * FEATURES:
 * - Statistics cards with revenue metrics
 * - Dual filtering (status + date range)
 * - Table view with expandable order items
 * - Timestamp and status formatting
 * - Revenue calculation per time period
 * - Responsive design
 * 
 * =========================================================================
 */

"use client";
import React, { useState, useEffect, useCallback } from "react";
import Header1 from "@/src/_components/adminComponents/Header1";
import Header2 from "@/src/_components/adminComponents/Header2";
import Header3 from "@/src/_components/adminComponents/Header3";
import Footer from "@/src/_components/adminComponents/Footer";
import { useAdminSession } from "@/src/contexts/AdminSessionContext";
import { getRestaurantOrdersAction } from "@/src/actions/orderActions";
import styles from "./history.module.css";
import RequireAdminAuth from "@/src/_components/adminComponents/RequireAuth";

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

function AdminHistoryPage() {
  const { restaurantId, isAuthenticated, isLoaded } = useAdminSession();

  // -----------------------------------------------------------------------
  // STATE VARIABLES
  // -----------------------------------------------------------------------

  /** Array of completed orders */
  const [orders, setOrders] = useState([]);
  
  /** Loading state during initial data fetch */
  const [loading, setLoading] = useState(true);
  
  /** Status filter ("all", "served", "cancelled") */
  const [filter, setFilter] = useState("all");
  
  /** Date range filter ("today", "week", "month", "all") */
  const [dateFilter, setDateFilter] = useState("today");

  // -----------------------------------------------------------------------
  // DATA FETCHING
  // -----------------------------------------------------------------------

  /**
   * Fetches all orders from database
   */
  const fetchData = useCallback(async () => {
    if (!restaurantId) return;

    try {
      const ordersResult = await getRestaurantOrdersAction(restaurantId);

      if (ordersResult.success) {
        // Show all orders (not just completed)
        setOrders(ordersResult.orders);
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
   * Effect: Fetch data when session is loaded and authenticated
   */
  useEffect(() => {
    if (isLoaded && restaurantId) {
      fetchData();
    }
  }, [isLoaded, restaurantId, fetchData]);

  // -----------------------------------------------------------------------
  // FILTER FUNCTIONS
  // -----------------------------------------------------------------------

  /**
   * Filters order by date range
   * @param {Object} order - Order to check
   * @returns {boolean} Whether order falls within selected date range
   */
  const filterByDate = (order) => {
    const orderDate = new Date(order.createdAt);
    const now = new Date();

    switch (dateFilter) {
      case "today":
        return orderDate.toDateString() === now.toDateString();
      case "week":
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return orderDate >= weekAgo;
      case "month":
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return orderDate >= monthAgo;
      default:
        return true;
    }
  };

  /**
   * Filters order by status
   * @param {Object} order - Order to check
   * @returns {boolean} Whether order matches selected status
   */
  const filterByStatus = (order) => {
    if (filter === "all") return true;
    return order.status.toLowerCase() === filter;
  };

  // -----------------------------------------------------------------------
  // COMPUTED VALUES
  // -----------------------------------------------------------------------

  /** Orders filtered by both date and status */
  const filteredOrders = orders.filter(
    (order) => filterByDate(order) && filterByStatus(order)
  );

  /** Count of served orders (after filtering) */
  const servedCount = filteredOrders.filter((o) => o.status === "Served").length;
  
  /** Count of cancelled orders (after filtering) */
  const cancelledCount = filteredOrders.filter((o) => o.status === "Cancelled").length;
  
  /** Total revenue from served orders (after filtering) */
  const totalRevenue = filteredOrders
    .filter((o) => o.status === "Served")
    .reduce((sum, o) => sum + o.total, 0);

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

  if (!isAuthenticated) {
    return (
      <RequireAdminAuth>
        <Header1 />
        <Header2 />
        <Header3 />
        <div className={styles.loadingContainer}>
          <p>Please login to view history</p>
        </div>
        <Footer />
      </RequireAdminAuth>
    );
  }

  return (
    <RequireAdminAuth>
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
              <i className="fa fa-refresh" /> Refresh
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
                <p>Served Orders</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ backgroundColor: "#f8d7da" }}>
                <i className="fa fa-times-circle" style={{ color: "#721c24" }} />
              </div>
              <div className={styles.statContent}>
                <h3>{cancelledCount}</h3>
                <p>Cancelled Orders</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ backgroundColor: "#cce5ff" }}>
                <i className="fa fa-inr" style={{ color: "#004085" }} />
              </div>
              <div className={styles.statContent}>
                <h3>₹{totalRevenue.toLocaleString()}</h3>
                <p>Total Revenue</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className={styles.filtersSection}>
            <div className={styles.filterGroup}>
              <label>Status:</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="all">All</option>
                <option value="placed">Placed</option>
                <option value="accepted">Accepted</option>
                <option value="preparing">Preparing</option>
                <option value="served">Served</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className={styles.filterGroup}>
              <label>Period:</label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="all">All Time</option>
              </select>
            </div>
          </div>

          {/* Orders List */}
          <div className={styles.ordersSection}>
            <div className={styles.sectionHeader}>
              <h3>Completed Orders</h3>
              <span className={styles.orderCount}>{filteredOrders.length} orders</span>
            </div>

            {loading ? (
              <div className={styles.loadingOrders}>Loading orders...</div>
            ) : filteredOrders.length === 0 ? (
              <div className={styles.noOrders}>
                <i className="fa fa-inbox" />
                <p>No orders found</p>
              </div>
            ) : (
              <div className={styles.ordersTable}>
                <table>
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Date & Time</th>
                      <th>Table</th>
                      <th>Customer</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Payment</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr key={order.orderId}>
                        <td className={styles.orderId}>#{order.orderId}</td>
                        <td className={styles.dateTime}>
                          <span className={styles.date}>{formatDate(order.createdAt)}</span>
                          <span className={styles.time}>{formatTime(order.createdAt)}</span>
                        </td>
                        <td className={styles.table}>Table {order.tableNumber}</td>
                        <td className={styles.customer}>{order.customerPhone}</td>
                        <td className={styles.items}>
                          <div className={styles.itemsList}>
                            {order.items.map((item, idx) => (
                              <span key={idx} className={styles.itemTag}>
                                <span
                                  className={`${styles.foodDot} ${
                                    item.foodType === "Veg"
                                      ? styles.vegDot
                                      : item.foodType === "Non-Veg"
                                      ? styles.nonVegDot
                                      : styles.eggDot
                                  }`}
                                />
                                {item.quantity}× {item.name}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className={styles.total}>₹{order.total.toLocaleString()}</td>
                        <td className={styles.payment}>{order.paymentMethod}</td>
                        <td>
                          <span
                            className={`${styles.statusBadge} ${
                              order.status === "Served"
                                ? styles.servedBadge
                                : styles.cancelledBadge
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </RequireAdminAuth>
  );
}

export default AdminHistoryPage;
