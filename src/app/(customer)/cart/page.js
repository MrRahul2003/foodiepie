/**
 * =========================================================================
 * CUSTOMER CART PAGE - Shopping Cart & Checkout
 * =========================================================================
 * 
 * PAGE FLOW:
 * 1. On mount, load cart items from localStorage
 * 2. Display cart items with quantity controls and remove option
 * 3. User can apply coupon codes for discounts
 * 4. Select payment method (UPI/Card/Cash/Wallet)
 * 5. "Place Order" validates session, creates order via server action
 * 6. On success, clear cart and redirect to order tracking page
 * 
 * STATE MANAGEMENT:
 * - cart: Items in cart (synced with localStorage)
 * - selectedPayment: Currently selected payment method
 * - couponCode: Input field value for coupon
 * - appliedCoupon: Successfully applied coupon details
 * - isProcessing: Loading state during checkout
 * 
 * FEATURES:
 * - Quantity adjustment (+/- buttons)
 * - Item removal from cart
 * - Clear all cart items
 * - Coupon code validation and application
 * - Real-time price calculations (subtotal, tax, discount, delivery)
 * - Multiple payment method selection
 * - Session validation before checkout
 * - Order creation via server action
 * 
 * =========================================================================
 */

"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Footer from "@/src/_components/customerComponents/Footer";
import Header1 from "@/src/_components/customerComponents/Header1";
import Header2 from "@/src/_components/customerComponents/Header2";
import Header3 from "@/src/_components/customerComponents/Header3";
import { useSession } from "@/src/contexts/SessionContext";
import { placeOrderAction } from "@/src/actions/orderActions";
import styles from "./cart.module.css";
import RequireAuth from "@/src/_components/customerComponents/RequireAuth";


// =========================================================================
// CONSTANTS
// =========================================================================

/** LocalStorage key for cart data */
const CART_STORAGE_KEY = "foodie_pie_cart";

// =========================================================================
// HELPER FUNCTIONS
// =========================================================================

/**
 * Retrieves cart data from localStorage
 * @returns {Array} Cart items array or empty array if none/error
 */
const getCartFromStorage = () => {
  if (typeof window === "undefined") return [];
  try {
    const cart = localStorage.getItem(CART_STORAGE_KEY);
    return cart ? JSON.parse(cart) : [];
  } catch (error) {
    console.error("Error reading cart from localStorage:", error);
    return [];
  }
};

/**
 * Saves cart data to localStorage
 * @param {Array} cart - Cart items to save
 */
const saveCartToStorage = (cart) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (error) {
    console.error("Error saving cart to localStorage:", error);
  }
};

// =========================================================================
// MAIN COMPONENT
// =========================================================================

function CartPage() {
  const router = useRouter();
  const session = useSession();

  // -----------------------------------------------------------------------
  // STATE VARIABLES
  // -----------------------------------------------------------------------

  /** Cart items array */
  const [cart, setCart] = useState([]);
  
  /** Selected payment method ID */
  const [selectedPayment, setSelectedPayment] = useState("UPI");
  
  /** Coupon input field value */
  const [couponCode, setCouponCode] = useState("");
  
  /** Applied coupon details object */
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  
  /** Loading state during order placement */
  const [isProcessing, setIsProcessing] = useState(false);

  // -----------------------------------------------------------------------
  // EFFECTS
  // -----------------------------------------------------------------------

  /**
   * Effect: Load cart from localStorage on component mount
   */
  useEffect(() => {
    const savedCart = getCartFromStorage();
    setCart(savedCart);
  }, []);

  // -----------------------------------------------------------------------
  // CART MANAGEMENT FUNCTIONS
  // -----------------------------------------------------------------------

  /**
   * Updates quantity of a specific cart item
   * Prevents quantity from going below 1
   * @param {string} itemId - Unique item identifier
   * @param {number} newQuantity - New quantity value
   */
  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    
    setCart((prevCart) => {
      const updatedCart = prevCart.map((item) =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      );
      saveCartToStorage(updatedCart);
      return updatedCart;
    });
  };

  /**
   * Removes a specific item from the cart
   * @param {string} itemId - Unique item identifier to remove
   */
  const removeItem = (itemId) => {
    setCart((prevCart) => {
      const updatedCart = prevCart.filter((item) => item.id !== itemId);
      saveCartToStorage(updatedCart);
      return updatedCart;
    });
  };

  /**
   * Clears all items from the cart
   */
  const clearCart = () => {
    setCart([]);
    saveCartToStorage([]);
  };

  // -----------------------------------------------------------------------
  // COUPON FUNCTIONS
  // -----------------------------------------------------------------------

  /**
   * Validates and applies entered coupon code
   * Checks minimum order requirement before applying
   */
  const applyCoupon = () => {
    const validCoupons = {
      SAVE10: { type: "percent", value: 10, minOrder: 200 },
      FLAT50: { type: "flat", value: 50, minOrder: 300 },
      WELCOME20: { type: "percent", value: 20, minOrder: 0 },
    };

    const coupon = validCoupons[couponCode.toUpperCase()];
    if (coupon) {
      if (subtotal >= coupon.minOrder) {
        setAppliedCoupon({ code: couponCode.toUpperCase(), ...coupon });
      } else {
        alert(`Minimum order of ₹${coupon.minOrder} required for this coupon`);
      }
    } else {
      alert("Invalid coupon code");
    }
  };

  /**
   * Removes currently applied coupon
   */
  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
  };

  // -----------------------------------------------------------------------
  // COMPUTED VALUES (MEMOS)
  // -----------------------------------------------------------------------

  /**
   * Calculates subtotal of all cart items
   */
  const subtotal = useMemo(() => {
    return cart.reduce(
      (total, item) => total + item.variant.price * item.quantity,
      0
    );
  }, [cart]);

  /**
   * Calculates discount amount based on applied coupon
   */
  const discount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.type === "percent") {
      return Math.round((subtotal * appliedCoupon.value) / 100);
    }
    return appliedCoupon.value;
  }, [subtotal, appliedCoupon]);

  /** Delivery fee (free for orders above ₹500) */
  const deliveryFee = subtotal > 500 ? 0 : 40;
  
  /** GST tax at 5% */
  const tax = Math.round(subtotal * 0.05);
  
  /** Final total amount */
  const total = subtotal - discount + deliveryFee + tax;

  // -----------------------------------------------------------------------
  // CHECKOUT HANDLER
  // -----------------------------------------------------------------------

  /**
   * Handles the checkout process:
   * 1. Validates cart is not empty
   * 2. Validates session has required info (restaurant, phone, table)
   * 3. Creates order via server action
   * 4. Stores order locally for immediate display
   * 5. Clears cart and redirects to order page
   */
  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert("Your cart is empty!");
      return;
    }

    // Check if session is complete
    if (!session.restaurantId || !session.customerPhone || !session.tableNumber) {
      alert("Please complete your session details first!");
      router.push("/auth");
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Create order data for backend
      const orderData = {
        restoId: session.restaurantId,
        restoCode: session.restaurantCode,
        restoName: session.restaurantName,
        customerPhone: session.customerPhone,
        customerName: session.customerName || "",
        tableNumber: session.tableNumber,
        items: cart,
        subtotal: subtotal,
        tax: tax,
        discount: discount,
        deliveryFee: deliveryFee,
        total: total,
        paymentMethod: selectedPayment,
      };
      
      // Call backend action
      const result = await placeOrderAction(orderData);
      
      if (result.success) {
        // Store order locally for immediate display
        const localOrderData = {
          orderId: result.order.orderId,
          items: cart,
          subtotal: subtotal,
          tax: tax,
          discount: discount,
          deliveryFee: deliveryFee,
          total: total,
          paymentMethod: selectedPayment,
          status: "Placed",
          tableNumber: session.tableNumber,
          phone: session.customerPhone,
          createdAt: result.order.createdAt,
        };
        
        // Get existing orders from localStorage
        const existingOrders = JSON.parse(localStorage.getItem("foodie_pie_orders") || "[]");
        
        // Add new order to the beginning of the array
        const updatedOrders = [localOrderData, ...existingOrders];
        
        // Save orders to localStorage
        localStorage.setItem("foodie_pie_orders", JSON.stringify(updatedOrders));
        
        // Clear the cart
        clearCart();
        
        // Redirect to order page
        router.push("/order");
      } else {
        alert(result.error || "Failed to place order. Please try again.");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // -----------------------------------------------------------------------
  // STATIC DATA
  // -----------------------------------------------------------------------

  /** Available payment methods */
  const paymentMethods = [
    { id: "UPI", label: "UPI", icon: "📱", description: "Google Pay, PhonePe, Paytm" },
    { id: "Card", label: "Card", icon: "💳", description: "Credit/Debit Card" },
    { id: "Cash", label: "Cash", icon: "💵", description: "Cash on Delivery" },
    { id: "Wallet", label: "Wallet", icon: "👛", description: "Foodie Wallet" },
  ];

  // -----------------------------------------------------------------------
  // RENDER
  // -----------------------------------------------------------------------

  return (
    <RequireAuth>
      {/* Header Section */}
      <Header1 />
      <Header2 />
      <Header3 />

      {/* Page Title Section */}
      <div className="breadcomb-area">
        <div className="container">
          <div className="row">
            <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
              <div className="breadcomb-list">
                <div className="row">
                  <div className="col-lg-6 col-md-6 col-sm-6 col-xs-12">
                    <div className="breadcomb-wp">
                      <div className="breadcomb-icon">
                        <i className="notika-icon notika-cart" />
                      </div>
                      <div className="breadcomb-ctn">
                        <h2>Your Cart</h2>
                        <p>
                          {cart.length} {cart.length === 1 ? "item" : "items"} in cart
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-6 col-md-6 col-sm-6 col-xs-3">
                    <div className="breadcomb-report">
                      <button
                        className="btn"
                        onClick={() => router.push("/menu")}
                      >
                        <i className="notika-icon notika-left-arrow" /> Continue Shopping
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.cartArea}>
        <div className="container">
          <div className="row">
            {/* Cart Items Section */}
            <div className="col-lg-8 col-md-7 col-sm-12">
              <div className={styles.cartItemsSection}>
                {cart.length === 0 ? (
                  <div className={styles.emptyCart}>
                    <div className={styles.emptyCartIcon}>🛒</div>
                    <h3>Your cart is empty</h3>
                    <p>Looks like you haven't added anything to your cart yet</p>
                    <button
                      className={styles.shopNowBtn}
                      onClick={() => router.push("/admin/menu")}
                    >
                      Browse Menu
                    </button>
                  </div>
                ) : (
                  <>
                    <div className={styles.cartHeader}>
                      <h3>Cart Items</h3>
                      <button className={styles.clearCartBtn} onClick={clearCart}>
                        Clear All
                      </button>
                    </div>

                    <div className={styles.cartItemsList}>
                      {cart.map((item) => (
                        <div key={item.id} className={styles.cartItem}>
                          <div className={styles.itemImage}>
                            <img
                              src={item.imageUrl || ""}
                              alt={item.name}
                            />
                            <span
                              className={`${styles.foodTypeDot} ${
                                item.foodType === "Veg"
                                  ? styles.veg
                                  : item.foodType === "Non-Veg"
                                  ? styles.nonVeg
                                  : styles.egg
                              }`}
                            />
                          </div>

                          <div className={styles.itemDetails}>
                            <h4 className={styles.itemName}>{item.name}</h4>
                            <p className={styles.itemVariant}>{item.variant.label}</p>
                            <p className={styles.itemPrice}>₹{item.variant.price}</p>
                          </div>

                          <div className={styles.quantityControl}>
                            <button
                              className={styles.qtyBtn}
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            >
                              −
                            </button>
                            <span className={styles.qtyValue}>{item.quantity}</span>
                            <button
                              className={styles.qtyBtn}
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            >
                              +
                            </button>
                          </div>

                          <div className={styles.itemTotal}>
                            <p>₹{item.variant.price * item.quantity}</p>
                          </div>

                          <button
                            className={styles.removeBtn}
                            onClick={() => removeItem(item.id)}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Billing Section */}
            <div className="col-lg-4 col-md-5 col-sm-12">
              <div className={styles.billingSection}>
                {/* Coupon Section */}
                <div className={styles.couponSection}>
                  <h4>Apply Coupon</h4>
                  {appliedCoupon ? (
                    <div className={styles.appliedCoupon}>
                      <span className={styles.couponTag}>
                        🎉 {appliedCoupon.code} applied!
                      </span>
                      <button onClick={removeCoupon}>Remove</button>
                    </div>
                  ) : (
                    <div className={styles.couponInput}>
                      <input
                        type="text"
                        placeholder="Enter coupon code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                      />
                      <button onClick={applyCoupon}>Apply</button>
                    </div>
                  )}
                  <div className={styles.availableCoupons}>
                    <p>Try: <span onClick={() => setCouponCode("SAVE10")}>SAVE10</span>, <span onClick={() => setCouponCode("FLAT50")}>FLAT50</span></p>
                  </div>
                </div>

                {/* Bill Details */}
                <div className={styles.billDetails}>
                  <h4>Bill Details</h4>
                  
                  <div className={styles.billRow}>
                    <span>Item Total</span>
                    <span>₹{subtotal}</span>
                  </div>
                  
                  {appliedCoupon && (
                    <div className={`${styles.billRow} ${styles.discount}`}>
                      <span>Discount ({appliedCoupon.code})</span>
                      <span>-₹{discount}</span>
                    </div>
                  )}
                  
                  <div className={styles.billRow}>
                    <span>Delivery Fee</span>
                    <span>
                      {deliveryFee === 0 ? (
                        <span className={styles.freeDelivery}>FREE</span>
                      ) : (
                        `₹${deliveryFee}`
                      )}
                    </span>
                  </div>
                  
                  <div className={styles.billRow}>
                    <span>GST (5%)</span>
                    <span>₹{tax}</span>
                  </div>
                  
                  <div className={styles.billDivider}></div>
                  
                  <div className={`${styles.billRow} ${styles.totalRow}`}>
                    <span>To Pay</span>
                    <span>₹{total}</span>
                  </div>

                  {discount > 0 && (
                    <div className={styles.savingsBadge}>
                      🎉 You're saving ₹{discount} on this order!
                    </div>
                  )}
                </div>

                {/* Payment Methods */}
                <div className={styles.paymentSection}>
                  <h4>Payment Method</h4>
                  <div className={styles.paymentMethods}>
                    {paymentMethods.map((method) => (
                      <label
                        key={method.id}
                        className={`${styles.paymentOption} ${
                          selectedPayment === method.id ? styles.selected : ""
                        }`}
                      >
                        <input
                          type="radio"
                          name="payment"
                          value={method.id}
                          checked={selectedPayment === method.id}
                          onChange={(e) => setSelectedPayment(e.target.value)}
                        />
                        <span className={styles.paymentIcon}>{method.icon}</span>
                        <div className={styles.paymentInfo}>
                          <span className={styles.paymentLabel}>{method.label}</span>
                          <span className={styles.paymentDesc}>{method.description}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Checkout Button */}
                <button
                  className={styles.checkoutBtn}
                  onClick={handleCheckout}
                  disabled={cart.length === 0 || isProcessing}
                >
                  {isProcessing ? (
                    <>Processing...</>
                  ) : (
                    <>
                      Place Order • ₹{total}
                    </>
                  )}
                </button>

                <p className={styles.securePayment}>
                  🔒 100% Secure Payment
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </RequireAuth>
  );
}

export default CartPage;
