/**
 * =========================================================================
 * ADMIN DASHBOARD - Restaurant Admin Home Page
 * =========================================================================
 * 
 * Beautiful modern dashboard with:
 * - Real-time stats cards (orders, revenue, active orders, served orders)
 * - Recent orders table
 * - Quick action buttons
 * - Order status breakdown
 * - Period-based statistics (week, month, all-time)
 * 
 * =========================================================================
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header1 from "@/src/_components/adminComponents/Header1";
import Header2 from "@/src/_components/adminComponents/Header2";
import Header3 from "@/src/_components/adminComponents/Header3";
import Footer from "@/src/_components/adminComponents/Footer";
import { useAdminSession } from "@/src/contexts/AdminSessionContext";
import { getDashboardStatsAction } from "@/src/actions/orderActions";
import { getAllFoodItemsByRestoCode } from "@/src/actions/restoItemActions";
import styles from "./dashboard.module.css";

export default function AdminDashboard() {
  const router = useRouter();
  const { restaurantId, restaurantName, isAuthenticated, isLoaded } = useAdminSession();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [menuItemCount, setMenuItemCount] = useState(0);

  // Fetch dashboard data
  useEffect(() => {
    const fetchData = async () => {
      if (!isLoaded) return;
      
      if (!isAuthenticated) {
        router.push("/admin/auth");
        return;
      }

      setLoading(true);
      try {
        // Fetch order stats
        const statsResult = await getDashboardStatsAction(restaurantId);
        if (statsResult.success) {
          setStats(statsResult.data);
        }
        
        // Fetch menu item count
        const menuResult = await getAllFoodItemsByRestoCode(restaurantId);
        if (menuResult.success) {
          setMenuItemCount(menuResult.data?.length || 0);
        }
      } catch (error) {
        console.error("Dashboard data fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isLoaded, isAuthenticated, restaurantId, router]);

  // Format currency
  const formatCurrency = (amount) => {
    return `₹${(amount || 0).toLocaleString('en-IN')}`;
  };

  // Format time
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <>
      <Header1 />
      <Header2 />
      <Header3 />

      {/* Dashboard Header */}
      <div className={styles.dashboardHeader}>
        <div className="container">
          <div className={styles.headerContent}>
            <div className={styles.headerLeft}>
              <h1>{getGreeting()}! 👋</h1>
              <p>Welcome to your restaurant dashboard</p>
              <div className={styles.welcomeBadge}>
                <span>🏪</span>
                <span>{restaurantName || "Your Restaurant"}</span>
              </div>
            </div>
            <div className={styles.headerRight}>
              <button 
                className={styles.headerBtn}
                onClick={() => router.push("/admin/orders")}
              >
                <span>📋</span> View Orders
              </button>
              <button 
                className={`${styles.headerBtn} ${styles.primary}`}
                onClick={() => router.push("/admin/menu/addItem")}
              >
                <span>➕</span> Add Item
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className={styles.dashboardContainer}>
        <div className="container">
          {loading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner}></div>
              <p className={styles.loadingText}>Loading dashboard...</p>
            </div>
          ) : (
            <>
              {/* Stats Cards Row */}
              <div className={styles.statsRow}>
                {/* Today's Orders */}
                <div className={styles.statCard}>
                  <div className={`${styles.statIcon} ${styles.purple}`}>
                    📦
                  </div>
                  <div className={styles.statContent}>
                    <h3>{stats?.today?.orders || 0}</h3>
                    <p>Today's Orders</p>
                    <span className={`${styles.statGrowth} ${
                      stats?.growth?.orders > 0 ? styles.positive : 
                      stats?.growth?.orders < 0 ? styles.negative : styles.neutral
                    }`}>
                      {stats?.growth?.orders > 0 ? "↑" : stats?.growth?.orders < 0 ? "↓" : "→"} 
                      {Math.abs(stats?.growth?.orders || 0)}% vs yesterday
                    </span>
                  </div>
                </div>

                {/* Today's Revenue */}
                <div className={styles.statCard}>
                  <div className={`${styles.statIcon} ${styles.green}`}>
                    💰
                  </div>
                  <div className={styles.statContent}>
                    <h3>{formatCurrency(stats?.today?.revenue)}</h3>
                    <p>Today's Revenue</p>
                    <span className={`${styles.statGrowth} ${
                      stats?.growth?.revenue > 0 ? styles.positive : 
                      stats?.growth?.revenue < 0 ? styles.negative : styles.neutral
                    }`}>
                      {stats?.growth?.revenue > 0 ? "↑" : stats?.growth?.revenue < 0 ? "↓" : "→"} 
                      {Math.abs(stats?.growth?.revenue || 0)}% vs yesterday
                    </span>
                  </div>
                </div>

                {/* Active Orders */}
                <div className={styles.statCard}>
                  <div className={`${styles.statIcon} ${styles.orange}`}>
                    🔥
                  </div>
                  <div className={styles.statContent}>
                    <h3>{stats?.today?.activeOrders || 0}</h3>
                    <p>Active Orders</p>
                    <span className={`${styles.statGrowth} ${styles.neutral}`}>
                      Needs attention
                    </span>
                  </div>
                </div>

                {/* Menu Items */}
                <div className={styles.statCard}>
                  <div className={`${styles.statIcon} ${styles.blue}`}>
                    🍽️
                  </div>
                  <div className={styles.statContent}>
                    <h3>{menuItemCount}</h3>
                    <p>Menu Items</p>
                    <span className={`${styles.statGrowth} ${styles.neutral}`}>
                      Total items
                    </span>
                  </div>
                </div>
              </div>

              {/* Main Content Grid */}
              <div className={styles.contentGrid}>
                {/* Recent Orders */}
                <div className={styles.card}>
                  <div className={styles.cardHeader}>
                    <h3 className={styles.cardTitle}>
                      <span>📋</span> Recent Orders
                    </h3>
                    <a 
                      className={styles.cardAction}
                      onClick={() => router.push("/admin/orders")}
                      style={{ cursor: 'pointer' }}
                    >
                      View All →
                    </a>
                  </div>
                  <div className={styles.cardBody}>
                    {stats?.recentOrders?.length > 0 ? (
                      <table className={styles.ordersTable}>
                        <thead>
                          <tr>
                            <th>Order ID</th>
                            <th>Customer</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.recentOrders.map((order) => (
                            <tr key={order._id}>
                              <td>
                                <span className={styles.orderIdBadge}>
                                  #{order.orderId}
                                </span>
                              </td>
                              <td>
                                <div className={styles.customerInfo}>
                                  <span className={styles.customerName}>
                                    {order.customerName || "Guest"}
                                  </span>
                                  <span className={styles.customerTable}>
                                    Table {order.tableNumber}
                                  </span>
                                </div>
                              </td>
                              <td>
                                <span className={styles.orderAmount}>
                                  {formatCurrency(order.total)}
                                </span>
                              </td>
                              <td>
                                <span className={`${styles.statusBadge} ${styles[order.status?.toLowerCase()]}`}>
                                  {order.status}
                                </span>
                              </td>
                              <td>
                                <span className={styles.orderTime}>
                                  {formatTime(order.createdAt)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className={styles.emptyOrders}>
                        <div>📭</div>
                        <p>No orders yet today</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Sidebar */}
                <div>
                  {/* Quick Actions */}
                  <div className={styles.card}>
                    <div className={styles.cardHeader}>
                      <h3 className={styles.cardTitle}>
                        <span>⚡</span> Quick Actions
                      </h3>
                    </div>
                    <div className={styles.cardBody}>
                      <div className={styles.quickActions}>
                        <a 
                          className={styles.actionCard}
                          onClick={() => router.push("/admin/orders")}
                        >
                          <div className={`${styles.actionIcon} ${styles.purple}`}>
                            📋
                          </div>
                          <div className={styles.actionContent}>
                            <h4>Manage Orders</h4>
                            <p>View & update order status</p>
                          </div>
                        </a>
                        
                        <a 
                          className={styles.actionCard}
                          onClick={() => router.push("/admin/menu")}
                        >
                          <div className={`${styles.actionIcon} ${styles.green}`}>
                            🍔
                          </div>
                          <div className={styles.actionContent}>
                            <h4>Menu Items</h4>
                            <p>Add, edit or remove items</p>
                          </div>
                        </a>
                        
                        <a 
                          className={styles.actionCard}
                          onClick={() => router.push("/admin/history")}
                        >
                          <div className={`${styles.actionIcon} ${styles.orange}`}>
                            📊
                          </div>
                          <div className={styles.actionContent}>
                            <h4>Order History</h4>
                            <p>View past orders & analytics</p>
                          </div>
                        </a>
                        
                        <a 
                          className={styles.actionCard}
                          onClick={() => router.push("/admin/menu/addItem")}
                        >
                          <div className={`${styles.actionIcon} ${styles.blue}`}>
                            ➕
                          </div>
                          <div className={styles.actionContent}>
                            <h4>Add New Item</h4>
                            <p>Create a new menu item</p>
                          </div>
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Order Status Breakdown */}
                  <div className={styles.card} style={{ marginTop: '24px' }}>
                    <div className={styles.cardHeader}>
                      <h3 className={styles.cardTitle}>
                        <span>📊</span> Today's Status
                      </h3>
                    </div>
                    <div className={styles.cardBody}>
                      <div className={styles.statusBreakdown}>
                        <div className={styles.statusItem}>
                          <span className={styles.statusLabel}>
                            <span className={`${styles.statusDot} ${styles.placed}`}></span>
                            Placed
                          </span>
                          <span className={styles.statusValue}>
                            {stats?.statusBreakdown?.placed || 0}
                          </span>
                        </div>
                        <div className={styles.statusItem}>
                          <span className={styles.statusLabel}>
                            <span className={`${styles.statusDot} ${styles.accepted}`}></span>
                            Accepted
                          </span>
                          <span className={styles.statusValue}>
                            {stats?.statusBreakdown?.accepted || 0}
                          </span>
                        </div>
                        <div className={styles.statusItem}>
                          <span className={styles.statusLabel}>
                            <span className={`${styles.statusDot} ${styles.preparing}`}></span>
                            Preparing
                          </span>
                          <span className={styles.statusValue}>
                            {stats?.statusBreakdown?.preparing || 0}
                          </span>
                        </div>
                        <div className={styles.statusItem}>
                          <span className={styles.statusLabel}>
                            <span className={`${styles.statusDot} ${styles.served}`}></span>
                            Served
                          </span>
                          <span className={styles.statusValue}>
                            {stats?.statusBreakdown?.served || 0}
                          </span>
                        </div>
                        <div className={styles.statusItem}>
                          <span className={styles.statusLabel}>
                            <span className={`${styles.statusDot} ${styles.cancelled}`}></span>
                            Cancelled
                          </span>
                          <span className={styles.statusValue}>
                            {stats?.statusBreakdown?.cancelled || 0}
                          </span>
                        </div>
                      </div>

                      {/* Period Stats */}
                      <div className={styles.periodStats}>
                        <div className={styles.periodCard}>
                          <h4>{stats?.week?.orders || 0}</h4>
                          <p>This Week</p>
                        </div>
                        <div className={styles.periodCard}>
                          <h4>{stats?.month?.orders || 0}</h4>
                          <p>This Month</p>
                        </div>
                        <div className={styles.periodCard}>
                          <h4>{stats?.allTime?.orders || 0}</h4>
                          <p>All Time</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
}
