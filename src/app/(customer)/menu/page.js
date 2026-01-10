/**
 * =========================================================================
 * CUSTOMER MENU PAGE - Menu Browsing & Cart Management
 * =========================================================================
 * 
 * PAGE FLOW:
 * 1. On mount, fetch all menu items for the restaurant from server
 * 2. Display items in a grid layout with category sidebar filter
 * 3. User can filter items by category
 * 4. Clicking an item opens a modal to select variant and quantity
 * 5. "Add to Cart" saves selected item to localStorage cart
 * 6. Floating cart button shows cart count and navigates to cart page
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
import { DEFAULT_CATEGORIES } from "@/src/lib/constants";
import { getAllFoodItemsByRestoCode } from "@/src/actions/restoItemActions";
import { useSession } from "@/src/contexts/SessionContext";
import styles from "./menu.module.css";
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

function CustomerMenuPage() {
  const router = useRouter();
  const session = useSession();

  // -----------------------------------------------------------------------
  // STATE VARIABLES
  // -----------------------------------------------------------------------

  /** Array of all menu items */
  const [Items, setItems] = useState([]);
  
  /** Loading state */
  const [loading, setLoading] = useState(true);
  
  /** Error state */
  const [error, setError] = useState(null);
  
  /** Current category filter ("All" or specific category) */
  const [filter, setFilter] = useState("All");
  
  /** Currently selected item for modal view */
  const [selectedItem, setSelectedItem] = useState(null);
  
  /** Selected variant in the modal */
  const [selectedVariant, setSelectedVariant] = useState(null);
  
  /** Quantity for add to cart */
  const [quantity, setQuantity] = useState(1);
  
  /** Cart items */
  const [cart, setCart] = useState([]);
  
  /** Trigger to refetch items */
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  // -----------------------------------------------------------------------
  // EFFECTS
  // -----------------------------------------------------------------------

  /**
   * Effect: Fetch items when session is loaded
   */
  useEffect(() => {
    console.log("=== Menu useEffect triggered ===");
    console.log("session?.isLoaded:", session?.isLoaded);
    console.log("session?.restaurantId:", session?.restaurantId);
    
    const fetchItems = async () => {
      console.log("=== fetchItems called ===");
      setLoading(true);
      setError(null);
      
      try {
        const restoId = session?.restaurantId;
        console.log("Session data:", session);
        console.log("Fetching items for restoId:", restoId);
        
        if (!restoId) {
          console.log("No restoId, showing error");
          setError("Please login to access the menu");
          setLoading(false);
          return;
        }

        console.log("Calling getAllFoodItemsByRestoCode...");
        const result = await getAllFoodItemsByRestoCode(restoId);
        console.log("Menu fetch result:", result);
        
        if (result.success) {
          console.log("Setting items:", result.data?.length, "items");
          setItems(result.data || []);
        } else {
          console.log("Error from server:", result.error);
          setError(result.error || "Failed to load menu");
        }
      } catch (err) {
        console.error("Error fetching menu:", err);
        setError("Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (session?.isLoaded && session?.restaurantId) {
      console.log("Conditions met, calling fetchItems");
      fetchItems();
    } else if (session?.isLoaded && !session?.restaurantId) {
      console.log("Session loaded but no restaurantId");
      setLoading(false);
      setError("Please login to access the menu");
    } else {
      console.log("Session not loaded yet");
    }
  }, [session?.isLoaded, session?.restaurantId, refetchTrigger]);

  /**
   * Effect: Load cart from localStorage
   */
  useEffect(() => {
    setCart(getCartFromStorage());
  }, []);
  
  /**
   * Handler to retry fetching items
   */
  const handleRetry = () => {
    setRefetchTrigger(prev => prev + 1);
  };

  // -----------------------------------------------------------------------
  // MODAL HANDLERS
  // -----------------------------------------------------------------------

  /**
   * Opens item detail modal
   */
  const openModal = (item) => {
    setSelectedItem(item);
    setSelectedVariant(item.variants?.[0] || null);
    setQuantity(1);
  };

  /**
   * Closes item detail modal
   */
  const closeModal = () => {
    setSelectedItem(null);
    setSelectedVariant(null);
    setQuantity(1);
  };

  // -----------------------------------------------------------------------
  // CART HANDLERS
  // -----------------------------------------------------------------------

  /**
   * Adds item to cart
   */
  const handleAddToCart = () => {
    if (!selectedItem || !selectedVariant) return;

    const cartItem = {
      id: `${selectedItem._id}-${selectedVariant._id}`,
      itemId: selectedItem._id,
      variantId: selectedVariant._id,
      name: selectedItem.name,
      variant: {
        _id: selectedVariant._id,
        label: selectedVariant.label,
        price: selectedVariant.price,
      },
      quantity: quantity,
      image: selectedItem.imageUrl,
      foodType: selectedItem.foodType,
    };

    const existingIndex = cart.findIndex((item) => item.id === cartItem.id);
    let newCart;

    if (existingIndex >= 0) {
      newCart = [...cart];
      newCart[existingIndex].quantity += quantity;
    } else {
      newCart = [...cart, cartItem];
    }

    setCart(newCart);
    saveCartToStorage(newCart);
    closeModal();
  };

  // -----------------------------------------------------------------------
  // COMPUTED VALUES
  // -----------------------------------------------------------------------

  /**
   * Filters items based on selected category
   */
  const filteredItems = useMemo(() => {
    if (filter === "All") return Items;
    return Items.filter((item) => item.category === filter);
  }, [Items, filter]);

  /**
   * Total cart count
   */
  const cartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // -----------------------------------------------------------------------
  // RENDER
  // -----------------------------------------------------------------------

  return (
    <RequireAuth>
      {/* Header Section */}
      <Header1 />
      <Header2 />
      <Header3 />

      <>
        {/* Breadcomb area Start*/}
        <div className="breadcomb-area">
          <div className="container">
            <div className="row">
              <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
                <div className="breadcomb-list">
                  <div className="row">
                    <div className="col-lg-6 col-md-6 col-sm-6 col-xs-12">
                      <div className="breadcomb-wp">
                        <div className="breadcomb-icon">
                          <i className="notika-icon notika-app" />
                        </div>
                        <div className="breadcomb-ctn">
                          <h2>Menu</h2>
                          <p>
                            Browse our delicious <span className="bread-ntd">Food Items</span>
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="col-lg-6 col-md-6 col-sm-6 col-xs-3">
                      <div className="breadcomb-report" style={{ display: "flex", gap: "10px", alignItems: "center", justifyContent: "flex-end" }}>
                        <button
                          className="btn"
                          onClick={() => router.push("/cart")}
                          style={{ position: "relative" }}
                        >
                          <i className="fa fa-shopping-cart" /> Cart
                          {cartCount > 0 && (
                            <span className={styles.cartBadge}>{cartCount}</span>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Breadcomb area End*/}

        {/* Menu area Start*/}
        <div className="inbox-area">
          <div className="container">
            <div className="row">
              {/* Category Sidebar */}
              <div className="col-lg-3 col-md-3 col-sm-3 col-xs-12">
                <div className="inbox-left-sd">
                  <div className="compose-ml">
                    <a className="btn" href="#">
                      Categories :
                    </a>
                  </div>
                  <div className="inbox-status">
                    <ul className="inbox-st-nav inbox-ft">
                      <li className={filter === "All" ? "active" : ""}>
                        <a href="#" onClick={(e) => { e.preventDefault(); setFilter("All"); }}>
                          <i className="notika-icon notika-mail" /> All
                          <span className="pull-right">{Items.length}</span>
                        </a>
                      </li>

                      {DEFAULT_CATEGORIES.map((category) => (
                        <li key={category} className={filter === category ? "active" : ""}>
                          <a href="#" onClick={(e) => { e.preventDefault(); setFilter(category); }}>
                            <i className="notika-icon notika-mail" /> {category}
                            <span className="pull-right">
                              {Items.filter((item) => item.category === category).length}
                            </span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <hr />
                </div>
              </div>

              {/* Menu Items Grid */}
              <div className="col-lg-9 col-md-9 col-sm-9 col-xs-12">
                <div className="contact-area">
                  <div className="container-fluid">
                    {/* Loading State */}
                    {loading && (
                      <div className={styles.loadingContainer}>
                        <div className={styles.spinner}></div>
                        <p>Loading menu...</p>
                      </div>
                    )}

                    {/* Error State */}
                    {error && !loading && (
                      <div className={styles.errorContainer}>
                        <i className="fa fa-exclamation-circle"></i>
                        <p>{error}</p>
                        <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
                          {error.includes("login") ? (
                            <button onClick={() => router.push("/auth")} className="btn">
                              <i className="fa fa-sign-in"></i> Login
                            </button>
                          ) : (
                            <button onClick={handleRetry} className="btn">
                              <i className="fa fa-refresh"></i> Try Again
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Empty State */}
                    {!loading && !error && filteredItems.length === 0 && (
                      <div className={styles.emptyContainer}>
                        <div className={styles.emptyIcon}>🍽️</div>
                        <h3 className={styles.emptyTitle}>
                          {filter === "All" ? "No Items Available" : `No ${filter} Items`}
                        </h3>
                        <p className={styles.emptyMessage}>
                          {filter === "All" 
                            ? "The menu is currently empty. Please check back later!"
                            : `No items found in the ${filter} category. Try another category!`
                          }
                        </p>
                      </div>
                    )}

                    {/* Menu Items */}
                    {!loading && !error && (
                      <div className="row">
                        {filteredItems.map((item) => (
                          <div
                            className="col-lg-4 col-md-6 col-sm-12 mb-4"
                            key={item._id}
                          >
                            <div 
                              className={styles.foodCard}
                              onClick={() => openModal(item)}
                            >
                              {/* Image Section */}
                              <div className={styles.cardImageWrapper}>
                                <img 
                                  src={item.imageUrl || ""} 
                                  alt={item.name}
                                  className={styles.cardImage}
                                />
                                {/* Food Type Badge */}
                                <span className={`${styles.foodTypeBadge} ${
                                  item.foodType === "Veg" ? styles.veg : 
                                  item.foodType === "Non-Veg" ? styles.nonVeg : styles.vegan
                                }`}>
                                  {item.foodType}
                                </span>
                                {/* Price Badge */}
                                <span className={styles.priceBadge}>
                                  ₹{item.variants?.[0]?.price || "N/A"}
                                </span>
                              </div>

                              {/* Content Section */}
                              <div className={styles.cardContent}>
                                <h4 className={styles.cardTitle}>
                                  {item.name}
                                </h4>
                                
                                <p className={styles.cardDescription}>
                                  {item.description}
                                </p>

                                {/* Category Badge */}
                                <div className={styles.categoryBadgeWrapper}>
                                  <span className={styles.categoryBadge}>
                                    {item.category}
                                  </span>
                                </div>

                                {/* Tags */}
                                {item.tags && item.tags.length > 0 && (
                                  <div className={styles.tagsWrapper}>
                                    {item.tags.slice(0, 3).map((tag, idx) => (
                                      <span key={idx} className={styles.tag}>
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
        {/* Menu area End*/}
      </>

      {/* Item Detail Modal */}
      {selectedItem && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            {/* Close Button */}
            <button onClick={closeModal} className={styles.closeButton}>
              ✕
            </button>

            {/* Modal Image */}
            <div className={styles.modalImageWrapper}>
              <img
                src={selectedItem.imageUrl || ""}
                alt={selectedItem.name}
                className={styles.modalImage}
              />
              <div className={styles.modalImageOverlay}>
                <h2 className={styles.modalTitle}>
                  {selectedItem.name}
                </h2>
                <div className={styles.modalBadges}>
                  <span className={`${styles.modalFoodTypeBadge} ${
                    selectedItem.foodType === "Veg" ? styles.veg : 
                    selectedItem.foodType === "Non-Veg" ? styles.nonVeg : styles.vegan
                  }`}>
                    {selectedItem.foodType}
                  </span>
                  <span className={styles.modalCategoryBadge}>
                    {selectedItem.category}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className={styles.modalBody}>
              {/* Description */}
              <p className={styles.modalDescription}>
                {selectedItem.description}
              </p>

              {/* Tags */}
              {selectedItem.tags && selectedItem.tags.length > 0 && (
                <div className={styles.modalTagsSection}>
                  <h5 className={styles.sectionTitle}>Tags</h5>
                  <div className={styles.modalTagsWrapper}>
                    {selectedItem.tags.map((tag, idx) => (
                      <span key={idx} className={styles.modalTag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Variants */}
              <div className={styles.variantsSection}>
                <h5 className={styles.sectionTitle}>Select Variant</h5>
                <div className={styles.variantsList}>
                  {selectedItem.variants?.map((variant, idx) => (
                    <div
                      key={idx}
                      className={`${styles.variantLabel} ${
                        selectedVariant?._id === variant._id ? styles.selected : ""
                      } ${!variant.isAvailable ? styles.disabled : ""}`}
                      onClick={() => variant.isAvailable && setSelectedVariant(variant)}
                    >
                      <div className={styles.variantLeft}>
                        <span className={styles.variantName}>
                          {variant.label}
                        </span>
                        {!variant.isAvailable && (
                          <span className={styles.outOfStock}>
                            Out of Stock
                          </span>
                        )}
                      </div>
                      <span className={styles.variantPrice}>
                        ₹{variant.price}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quantity Selector */}
              <div className={styles.quantitySection}>
                <h5 className={styles.sectionTitle}>Quantity</h5>
                <div className={styles.quantityControls}>
                  <button 
                    className={styles.quantityBtn}
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    -
                  </button>
                  <span className={styles.quantityValue}>{quantity}</span>
                  <button 
                    className={styles.quantityBtn}
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Add to Cart Button */}
              <button 
                className={styles.addToCartBtn}
                onClick={handleAddToCart}
                disabled={!selectedVariant || !selectedVariant.isAvailable}
              >
                <i className="fa fa-cart-plus"></i>
                Add to Cart - ₹{selectedVariant ? selectedVariant.price * quantity : 0}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Cart Button */}
      {cartCount > 0 && (
        <div className={styles.floatingCart} onClick={() => router.push("/cart")}>
          <i className="fa fa-shopping-cart"></i>
          <span className={styles.floatingCartCount}>{cartCount}</span>
          <span className={styles.floatingCartText}>View Cart</span>
        </div>
      )}

      <Footer />
    </RequireAuth>
  );
}

export default CustomerMenuPage;
