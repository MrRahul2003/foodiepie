/**
 * =========================================================================
 * ADMIN MENU PAGE - Menu Item Management
 * =========================================================================
 * 
 * PAGE FLOW:
 * 1. On mount, fetch all menu items for the restaurant from database
 * 2. Display items in a grid layout with category sidebar filter
 * 3. Admin can filter items by category
 * 4. Clicking an item opens a detail modal with variants
 * 5. Admin can edit or delete items via action buttons
 * 6. Delete requires confirmation before execution
 * 
 * STATE MANAGEMENT:
 * - Items: All menu items from database
 * - filter: Currently selected category filter
 * - selectedItem: Item selected for modal view
 * - selectedVariant: Selected variant in modal
 * - deleteConfirm: Item pending delete confirmation
 * 
 * FEATURES:
 * - Category filtering sidebar
 * - Grid layout for menu items
 * - Item detail modal with variants
 * - Edit item navigation
 * - Delete item with confirmation
 * - localStorage sync for edit page
 * 
 * =========================================================================
 */

"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Footer from "@/src/_components/adminComponents/Footer";
import Header1 from "@/src/_components/adminComponents/Header1";
import Header2 from "@/src/_components/adminComponents/Header2";
import Header3 from "@/src/_components/adminComponents/Header3";
import { DEFAULT_CATEGORIES } from "@/src/lib/constants";
import { getAllFoodItemsByRestoCode, deleteFoodItemAction } from "@/src/actions/restoItemActions";
import { useAdminSession } from "@/src/contexts/AdminSessionContext";
import styles from "./menu.module.css";
import RequireAdminAuth from "@/src/_components/adminComponents/RequireAuth";

// =========================================================================
// CONSTANTS
// =========================================================================

/** LocalStorage key for menu items cache */
const MENU_ITEMS_KEY = "foodie_pie_menu_items";

/** Number of items to display per page */
const ITEMS_PER_PAGE = 6;

// =========================================================================
// HELPER FUNCTIONS
// =========================================================================

/**
 * Saves menu items to localStorage for offline access and edit page
 * @param {Array} items - Menu items to save
 */
const saveMenuItemsToStorage = (items) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(MENU_ITEMS_KEY, JSON.stringify(items));
  } catch (error) {
    console.error("Error saving menu items to localStorage:", error);
  }
};

// =========================================================================
// MAIN COMPONENT
// =========================================================================

function Page() {
  const router = useRouter();
  const { restaurantId, isAuthenticated, isLoaded } = useAdminSession();

  // -----------------------------------------------------------------------
  // STATE VARIABLES
  // -----------------------------------------------------------------------

  /** Array of all menu items */
  const [Items, setItems] = useState([]);
  
  /** Loading state */
  const [loading, setLoading] = useState(true);
  
  /** Current category filter ("All" or specific category) */
  const [filter, setFilter] = useState("All");
  
  /** Currently selected item for modal view */
  const [selectedItem, setSelectedItem] = useState(null);
  
  /** Selected variant in the modal */
  const [selectedVariant, setSelectedVariant] = useState(null);
  
  /** Item pending delete confirmation */
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  /** Number of visible items (for load more) */
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  
  /** Availability filter ("All", "Available", "Unavailable") */
  const [availabilityFilter, setAvailabilityFilter] = useState("All");
  
  /** Food type filter ("All", "Veg", "Non-Veg", "Vegan") */
  const [foodTypeFilter, setFoodTypeFilter] = useState("All");

  // -----------------------------------------------------------------------
  // DATA FETCHING
  // -----------------------------------------------------------------------

  /**
   * Fetches all menu items for the restaurant
   * Redirects to auth if unauthorized
   */
  const fetchItems = async () => {
    if (!restaurantId) {
      router.push("/admin/auth");
      return;
    }
    
    setLoading(true);
    const foodItems = await getAllFoodItemsByRestoCode(restaurantId);
    console.log("Fetching food items for restoId:", restaurantId, foodItems);

    if (foodItems?.error === "UNAUTHORIZED") {
      router.push("/admin/auth");
      return;
    }
    setItems(foodItems.data || []);
    // Save to localStorage for edit functionality
    saveMenuItemsToStorage(foodItems.data || []);
    setLoading(false);
  };

  // -----------------------------------------------------------------------
  // EFFECTS
  // -----------------------------------------------------------------------

  /**
   * Effect: Fetch items when session is loaded
   */
  useEffect(() => {
    if (isLoaded) {
      if (!isAuthenticated) {
        router.push("/admin/auth");
      } else {
        fetchItems();
      }
    }
  }, [isLoaded, isAuthenticated, restaurantId]);

  // -----------------------------------------------------------------------
  // MODAL HANDLERS
  // -----------------------------------------------------------------------

  /**
   * Opens item detail modal
   * @param {Object} item - Item to view
   */
  const openModal = (item) => {
    setSelectedItem(item);
    setSelectedVariant(item.variants?.[0] || null);
  };

  /**
   * Closes item detail modal
   */
  const closeModal = () => {
    setSelectedItem(null);
    setSelectedVariant(null);
  };

  // -----------------------------------------------------------------------
  // ITEM ACTION HANDLERS
  // -----------------------------------------------------------------------

  /**
   * Navigates to edit page for the item
   * @param {Event} e - Click event
   * @param {string} itemId - ID of item to edit
   */
  const handleEditItem = (e, itemId) => {
    e.stopPropagation();
    router.push(`/admin/menu/editItem?id=${itemId}`);
  };

  /**
   * Shows delete confirmation dialog
   * @param {Event} e - Click event
   * @param {Object} item - Item to delete
   */
  const handleDeleteClick = (e, item) => {
    e.stopPropagation();
    setDeleteConfirm(item);
  };

  /**
   * Confirms and executes item deletion
   */
  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    
    try {
      // Call backend to delete
      const result = await deleteFoodItemAction(deleteConfirm._id);
      
      if (result.success) {
        // Remove from state
        const updatedItems = Items.filter((item) => item._id !== deleteConfirm._id);
        setItems(updatedItems);
        
        // Update localStorage
        saveMenuItemsToStorage(updatedItems);
        
        console.log("Item deleted from database:", deleteConfirm.name);
      } else {
        console.error("Failed to delete item:", result.error);
        alert("Failed to delete item: " + result.error);
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      alert("Error deleting item. Please try again.");
    }
    
    // Close confirmation
    setDeleteConfirm(null);
  };

  /**
   * Cancels delete operation
   */
  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  // -----------------------------------------------------------------------
  // COMPUTED VALUES
  // -----------------------------------------------------------------------

  /**
   * Filters items based on selected category, availability, and food type
   */
  const filteredItems = useMemo(() => {
    let items = [...Items];
    
    // Filter by availability
    if (availabilityFilter === "Available") {
      items = items.filter((item) => 
        item.isAvailable !== false && 
        item.variants?.some((variant) => variant.isAvailable)
      );
    } else if (availabilityFilter === "Unavailable") {
      items = items.filter((item) => 
        item.isAvailable === false || 
        !item.variants?.some((variant) => variant.isAvailable)
      );
    }
    
    // Filter by food type
    if (foodTypeFilter !== "All") {
      items = items.filter((item) => item.foodType === foodTypeFilter);
    }
    
    // Filter by category
    if (filter !== "All") {
      items = items.filter((item) => item.category === filter);
    }
    
    return items;
  }, [Items, filter, availabilityFilter, foodTypeFilter]);

  /**
   * Items to display (limited by visibleCount for load more)
   */
  const displayedItems = useMemo(() => {
    return filteredItems.slice(0, visibleCount);
  }, [filteredItems, visibleCount]);

  /**
   * Check if there are more items to load
   */
  const hasMoreItems = filteredItems.length > visibleCount;

  /**
   * Remaining items count
   */
  const remainingItems = filteredItems.length - visibleCount;

  /**
   * Load more items handler
   */
  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + ITEMS_PER_PAGE);
  };

  // -----------------------------------------------------------------------
  // RENDER
  // -----------------------------------------------------------------------

  return (
    <RequireAdminAuth>
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
                            Welcome to Foodie Pie{" "}
                            <span className="bread-ntd">Admin Template</span>
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="col-lg-6 col-md-6 col-sm-6 col-xs-3">
                      <div className="breadcomb-report" style={{ display: "flex", gap: "10px", alignItems: "center", justifyContent: "flex-end" }}>
                        <button
                          data-toggle="tooltip"
                          data-placement="left"
                          title="Add New Item"
                          className="btn"
                          onClick={() => router.push("/admin/menu/addItem")}
                        >
                          <i className="notika-icon notika-draft" /> Add
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
        {/* Inbox area Start*/}
        <div className="inbox-area">
          <div className="container">
            <div className="row">
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
                        <a href="#" onClick={(e) => { e.preventDefault(); setFilter("All"); setVisibleCount(ITEMS_PER_PAGE); }}>
                          <i className="notika-icon notika-mail" /> All
                          <span className="pull-right">{Items.length}</span>
                        </a>
                      </li>

                      {DEFAULT_CATEGORIES.map((category) => (
                        <li key={category} className={filter === category ? "active" : ""}>
                          <a href="#" onClick={(e) => { e.preventDefault(); setFilter(category); setVisibleCount(ITEMS_PER_PAGE); }}>
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
                  
                  {/* Availability Filter */}
                  <div className="compose-ml">
                    <a className="btn" href="#">
                      Availability :
                    </a>
                  </div>
                  <div className="inbox-status">
                    <ul className="inbox-st-nav inbox-ft">
                      {["All", "Available", "Unavailable"].map((status) => (
                        <li key={status} className={availabilityFilter === status ? "active" : ""}>
                          <a href="#" onClick={(e) => { e.preventDefault(); setAvailabilityFilter(status); setVisibleCount(ITEMS_PER_PAGE); }}>
                            <i className={`notika-icon ${status === "Available" ? "notika-checked" : status === "Unavailable" ? "notika-close" : "notika-list"}`} /> {status}
                            <span className="pull-right">
                              {status === "All" ? Items.length : 
                               status === "Available" ? Items.filter((item) => item.isAvailable !== false && item.variants?.some((v) => v.isAvailable)).length :
                               Items.filter((item) => item.isAvailable === false || !item.variants?.some((v) => v.isAvailable)).length}
                            </span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <hr />
                  
                  {/* Food Type Filter */}
                  <div className="compose-ml">
                    <a className="btn" href="#">
                      Food Type :
                    </a>
                  </div>
                  <div className="inbox-status">
                    <ul className="inbox-st-nav inbox-ft">
                      {["All", "Veg", "Non-Veg", "Vegan"].map((type) => (
                        <li key={type} className={foodTypeFilter === type ? "active" : ""}>
                          <a href="#" onClick={(e) => { e.preventDefault(); setFoodTypeFilter(type); setVisibleCount(ITEMS_PER_PAGE); }}>
                            <i className="notika-icon notika-star" style={{ color: type === "Veg" ? "#22c55e" : type === "Non-Veg" ? "#ef4444" : type === "Vegan" ? "#10b981" : "inherit" }} /> {type}
                            <span className="pull-right">
                              {type === "All" ? Items.length : Items.filter((item) => item.foodType === type).length}
                            </span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <hr />
                </div>
              </div>

              <div className="col-lg-9 col-md-9 col-sm-9 col-xs-12">
                <div className="contact-area">
                  <div className="container-fluid">
                    {/* Loading State */}
                    {loading && (
                      <div className={styles.loadingContainer}>
                        <div className={styles.spinner}></div>
                        <p className={styles.loadingText}>Loading menu items...</p>
                      </div>
                    )}

                    {/* Empty State */}
                    {!loading && filteredItems.length === 0 && (
                      <div className={styles.emptyContainer}>
                        <div className={styles.emptyIcon}>🍽️</div>
                        <h3 className={styles.emptyTitle}>
                          {filter === "All" ? "No Items Available" : `No ${filter} Items`}
                        </h3>
                        <p className={styles.emptyMessage}>
                          {filter === "All" 
                            ? "Your menu is empty. Add your first item to get started!"
                            : `No items in ${filter} category.`
                          }
                        </p>
                        <button 
                          className={styles.emptyBtn}
                          onClick={() => router.push("/admin/menu/addItem")}
                        >
                          <i className="fa fa-plus"></i> Add First Item
                        </button>
                      </div>
                    )}

                    {/* Menu Items */}
                    {!loading && filteredItems.length > 0 && (
                    <div className="row">
                      {displayedItems.map((item) => (
                        <div
                          className="col-lg-4 col-md-6 col-sm-12 mb-4"
                          key={item._id}
                        >
                          <div 
                            className={styles.foodCard}
                            onClick={() => openModal(item)}
                          >
                            {/* Action Buttons */}
                            <div className={styles.cardActions}>
                              <button
                                className={styles.editBtn}
                                onClick={(e) => handleEditItem(e, item._id)}
                                title="Edit Item"
                              >
                                ✏️
                              </button>
                              <button
                                className={styles.deleteBtn}
                                onClick={(e) => handleDeleteClick(e, item)}
                                title="Delete Item"
                              >
                                🗑️
                              </button>
                            </div>

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
                                  {item.tags.map((tag, idx) => (
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

                    {/* Load More Button */}
                    {!loading && hasMoreItems && (
                      <div className={styles.loadMoreContainer}>
                        <button 
                          className={styles.loadMoreBtn}
                          onClick={handleLoadMore}
                        >
                          <span className={styles.loadMoreIcon}>+</span>
                          <span className={styles.loadMoreText}>Load More</span>
                          <span className={styles.loadMoreCount}>({remainingItems} more items)</span>
                        </button>
                        <p className={styles.showingCount}>
                          Showing {displayedItems.length} of {filteredItems.length} items
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
        {/* Inbox area End*/}
      </>

      {/* Modal Popup */}
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
                <h5 className={styles.sectionTitle}>Variants</h5>
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
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className={styles.modalOverlay} onClick={cancelDelete}>
          <div 
            className={styles.deleteModal}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.deleteModalIcon}>🗑️</div>
            <h3>Delete Item?</h3>
            <p>Are you sure you want to delete <strong>{deleteConfirm.name}</strong>?</p>
            <p className={styles.deleteWarning}>This action cannot be undone.</p>
            <div className={styles.deleteModalActions}>
              <button 
                className={styles.cancelDeleteBtn}
                onClick={cancelDelete}
              >
                Cancel
              </button>
              <button 
                className={styles.confirmDeleteBtn}
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </RequireAdminAuth>
  );
}

export default Page;
