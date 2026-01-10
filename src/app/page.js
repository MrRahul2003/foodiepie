/**
 * =========================================================================
 * CUSTOMER DASHBOARD - Main Entry Point
 * =========================================================================
 * 
 * PAGE FLOW:
 * 1. User lands on the main page (/)
 * 2. Displays personalized welcome if logged in
 * 3. Shows quick action cards for navigation
 * 4. Displays session info (phone, table, restaurant)
 * 
 * =========================================================================
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header1 from "../_components/customerComponents/Header1";
import Header2 from "../_components/customerComponents/Header2";
import Header3 from "../_components/customerComponents/Header3";
import Footer from "../_components/customerComponents/Footer";
import { useSession } from "@/src/contexts/SessionContext";
import styles from "./dashboard.module.css";

export default function Home() {
  const session = useSession();
  const [cartCount, setCartCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);

  useEffect(() => {
    // Get cart items count
    try {
      const cart = JSON.parse(localStorage.getItem("foodie_pie_cart") || "[]");
      setCartCount(cart.length);
    } catch (e) {
      setCartCount(0);
    }

    // Get orders count
    try {
      const orders = JSON.parse(localStorage.getItem("foodie_pie_orders") || "[]");
      setOrderCount(orders.length);
    } catch (e) {
      setOrderCount(0);
    }
  }, []);

  if (!session.isLoaded) {
    return (
      <>
        <Header1 />
        <Header2 />
        <Header3 />
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading...</p>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header1 />
      <Header2 />
      <Header3 />

      {session.customerPhone ? (
        <>
          {/* Hero Section */}
          <div className={styles.heroSection}>
            <div className="container">
              <div className={styles.heroContent}>
                <p className={styles.welcomeText}>Welcome back!</p>
                <h1 className={styles.heroTitle}>
                  Hello, <span>{session.customerName || "Food Lover"}</span> 👋
                </h1>
                <p className={styles.heroSubtitle}>
                  Ready to order some delicious food? Browse our menu and treat yourself today!
                </p>
                <div className={styles.sessionInfo}>
                  <div className={styles.sessionBadge}>
                    <i className="notika-icon notika-phone" />
                    {session.customerPhone}
                  </div>
                  {session.tableNumber && (
                    <div className={styles.sessionBadge}>
                      <i className="notika-icon notika-house" />
                      Table {session.tableNumber}
                    </div>
                  )}
                  {session.restaurantCode && (
                    <div className={styles.sessionBadge}>
                      <i className="notika-icon notika-star" />
                      {session.restaurantName || session.restaurantCode}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className={styles.quickActions}>
            <div className="container">
              <h2 className={styles.sectionTitle}>
                <i className="notika-icon notika-app" />
                Quick Actions
              </h2>
              <div className={styles.actionsGrid}>
                <Link href="/menu" className={styles.actionCard}>
                  <div className={`${styles.actionIcon} ${styles.menuIcon}`}>
                    <i className="notika-icon notika-menus" />
                  </div>
                  <div className={styles.actionContent}>
                    <h3>Browse Menu</h3>
                    <p>Explore our delicious dishes</p>
                  </div>
                  <i className={`notika-icon notika-right-arrow ${styles.actionArrow}`} />
                </Link>

                <Link href="/cart" className={styles.actionCard}>
                  <div className={`${styles.actionIcon} ${styles.cartIcon}`}>
                    <i className="notika-icon notika-up-arrow" />
                  </div>
                  <div className={styles.actionContent}>
                    <h3>Your Cart</h3>
                    <p>{cartCount > 0 ? `${cartCount} items in cart` : "Your cart is empty"}</p>
                  </div>
                  <i className={`notika-icon notika-right-arrow ${styles.actionArrow}`} />
                </Link>

                <Link href="/order" className={styles.actionCard}>
                  <div className={`${styles.actionIcon} ${styles.orderIcon}`}>
                    <i className="notika-icon notika-checked" />
                  </div>
                  <div className={styles.actionContent}>
                    <h3>Active Orders</h3>
                    <p>Track your current orders</p>
                  </div>
                  <i className={`notika-icon notika-right-arrow ${styles.actionArrow}`} />
                </Link>

                <Link href="/history" className={styles.actionCard}>
                  <div className={`${styles.actionIcon} ${styles.historyIcon}`}>
                    <i className="notika-icon notika-next" />
                  </div>
                  <div className={styles.actionContent}>
                    <h3>Order History</h3>
                    <p>View your past orders</p>
                  </div>
                  <i className={`notika-icon notika-right-arrow ${styles.actionArrow}`} />
                </Link>
              </div>

              {/* Promo Banner */}
              <div className={styles.promoBanner}>
                <div className={styles.promoContent}>
                  <h3>🔥 Special Offer!</h3>
                  <p>Get 20% off on your first order. Use code: FOODIE20</p>
                </div>
                <Link href="/menu" className={styles.promoButton}>
                  Order Now
                </Link>
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className={styles.featuresSection}>
            <div className="container">
              <h2 className={styles.sectionTitle}>
                <i className="notika-icon notika-star" />
                Why Choose Us
              </h2>
              <div className={styles.featuresGrid}>
                <div className={styles.featureCard}>
                  <div className={styles.featureIcon}>
                    <i className="notika-icon notika-down-arrow" />
                  </div>
                  <h3>Fast Delivery</h3>
                  <p>Get your food delivered hot and fresh within 30 minutes</p>
                </div>
                <div className={styles.featureCard}>
                  <div className={styles.featureIcon}>
                    <i className="notika-icon notika-checked" />
                  </div>
                  <h3>Quality Food</h3>
                  <p>Made with fresh ingredients and prepared by expert chefs</p>
                </div>
                <div className={styles.featureCard}>
                  <div className={styles.featureIcon}>
                    <i className="notika-icon notika-phone" />
                  </div>
                  <h3>Easy Ordering</h3>
                  <p>Simple and intuitive ordering process from your table</p>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Not Logged In State */
        <div className={styles.quickActions}>
          <div className="container">
            <div className={styles.notLoggedIn}>
              <h2>Welcome to FoodiePie! 🍕</h2>
              <p>Please login to start ordering delicious food from our menu</p>
              <Link href="/auth" className={styles.loginButton}>
                <i className="notika-icon notika-login" />
                Login to Continue
              </Link>
            </div>

            {/* Features Section for non-logged users */}
            <div className={styles.featuresGrid} style={{ marginTop: "50px" }}>
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>
                  <i className="notika-icon notika-menus" />
                </div>
                <h3>Wide Menu Selection</h3>
                <p>Browse through our extensive menu with various cuisines and dishes</p>
              </div>
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>
                  <i className="notika-icon notika-time" />
                </div>
                <h3>Quick Service</h3>
                <p>Fast and efficient service to ensure your food arrives fresh</p>
              </div>
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>
                  <i className="notika-icon notika-cart" />
                </div>
                <h3>Easy Ordering</h3>
                <p>Simple ordering process right from your table</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
