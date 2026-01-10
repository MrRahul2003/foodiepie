// Edit Food Item Page

"use client";
import Footer from "@/src/_components/adminComponents/Footer";
import Header1 from "@/src/_components/adminComponents/Header1";
import Header2 from "@/src/_components/adminComponents/Header2";
import Header3 from "@/src/_components/adminComponents/Header3";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ORDER_TYPES,
  DEFAULT_CATEGORIES,
  FOOD_TAGS,
} from "@/src/lib/constants";
import { deleteFoodItemAction, updateFoodItemAction, getRestaurantIdByRestoCode } from "@/src/actions/restoItemActions";
import { useAdminSession } from "@/src/contexts/AdminSessionContext";
import styles from "../formStyles.module.css";
import RequireAdminAuth from "@/src/_components/adminComponents/RequireAuth";

function EditItemPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const itemId = searchParams.get("id");
  const { restaurantId: restoCode, isAuthenticated, isLoaded } = useAdminSession();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [mongoRestaurantId, setMongoRestaurantId] = useState(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [foodCategory, setFoodCategory] = useState("");
  const [type, setType] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [availability, setAvailability] = useState(true);
  const [tags, setTags] = useState([]);
  const [variants, setVariants] = useState([
    { label: "Regular", price: 1, isAvailable: true },
  ]);

  // Get MongoDB restaurant ID from restoCode
  useEffect(() => {
    const fetchRestaurantId = async () => {
      if (restoCode) {
        const result = await getRestaurantIdByRestoCode(restoCode);
        if (result.success) {
          setMongoRestaurantId(result.restaurantId);
        }
      }
    };
    
    if (isLoaded && isAuthenticated) {
      fetchRestaurantId();
    } else if (isLoaded && !isAuthenticated) {
      router.push("/admin/auth");
    }
  }, [isLoaded, isAuthenticated, restoCode, router]);

  // Load item data from localStorage (simulating backend fetch)
  useEffect(() => {
    if (itemId) {
      // Get items from localStorage (this simulates fetching from backend)
      const storedItems = localStorage.getItem("foodie_pie_menu_items");
      if (storedItems) {
        const items = JSON.parse(storedItems);
        const item = items.find((i) => i._id === itemId);
        console.log("Loaded item for editing:", item);
        console.log("Tags from item:", item?.tags);
        if (item) {
          setName(item.name || "");
          setDescription(item.description || "");
          setFoodCategory(item.category || "");
          setType(item.foodType || "");
          setImageUrl(item.imageUrl || "");
          setAvailability(item.availability ?? true);
          setTags(Array.isArray(item.tags) ? item.tags : []);
          setVariants(
            item.variants || [{ label: "Regular", price: 1, isAvailable: true }]
          );
        }
      }
    }
  }, [itemId]);

  const addVariant = () => {
    setVariants((prev) => [
      ...prev,
      { label: "", price: 1, isAvailable: true },
    ]);
  };

  const removeVariant = (index) => {
    if (variants.length <= 1) return;
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const updateVariant = (index, field, value) => {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    );
  };

  const toggleTag = (tag) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    if (!mongoRestaurantId) {
      setError("Restaurant not found. Please try again.");
      return;
    }
    
    setLoading(true);

    const updatedFoodData = {
      _id: itemId,
      name,
      description,
      category: foodCategory,
      foodType: type,
      imageUrl: imageUrl,
      variants,
      availability,
      tags,
      restaurantId: mongoRestaurantId,
      updatedAt: new Date().toISOString(),
    };

    console.log("Submitting food data:", updatedFoodData);
    const result = await updateFoodItemAction(null, updatedFoodData);
    if (!result.success) {
      setError("Failed to update food item. Please try again.");
      setLoading(false);
      return;
    }
    setLoading(false);
    console.log("Food item updated successfully", result);
    
    // Show success popup
    setShowSuccessPopup(true);
  };

  const handleSuccessClose = () => {
    setShowSuccessPopup(false);
    router.push("/admin/menu");
  };

  return (
    <RequireAdminAuth>
      <Header1 />
      <Header2 />
      <Header3 />

      {/* Breadcrumb Area */}
      <div className={styles.breadcrumb}>
        <div className="container">
          <div className={styles.breadcrumbContent}>
            <div className={styles.breadcrumbTitle}>
              <div className={styles.breadcrumbIcon}>
                <i className="notika-icon notika-edit" />
              </div>
              <div className={styles.breadcrumbText}>
                <h2>Edit Item</h2>
                <p>Update menu item details</p>
              </div>
            </div>
            <button 
              className={styles.backButton}
              onClick={() => router.push("/admin/menu")}
            >
              <i className="notika-icon notika-left-arrow" /> Back to Menu
            </button>
          </div>
        </div>
      </div>

      {/* Form Area */}
      <div className={styles.pageContainer}>
        <div className="container">
          <div className={styles.formCard}>
            {success && (
              <div className={styles.successMessage}>
                <span>✅</span> {success}
              </div>
            )}
            {error && (
              <div className={styles.errorMessage}>
                <span>❌</span> {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Basic Info Row */}
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Item Name *</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="Enter item name"
                    value={name || ""}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <div className={styles.toggleContainer}>
                    <span className={styles.toggleLabel}>Availability</span>
                    <label className={styles.toggleSwitch}>
                      <input
                        type="checkbox"
                        checked={availability ?? true}
                        onChange={(e) => setAvailability(e.target.checked)}
                      />
                      <span className={styles.toggleSlider}></span>
                    </label>
                    <span className={`${styles.toggleStatus} ${availability ? styles.active : ''}`}>
                      {availability ? 'Available' : 'Not Available'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description & Image Row */}
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Description *</label>
                  <textarea
                    className={styles.formTextarea}
                    placeholder="Enter item description"
                    value={description || ""}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Image URL</label>
                  <input
                    type="url"
                    className={styles.formInput}
                    value={imageUrl || ""}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                  />
                  {imageUrl && (
                    <div className={styles.imagePreview}>
                      <img src={imageUrl} alt="Preview" onError={(e) => e.target.style.display = 'none'} />
                    </div>
                  )}
                </div>
              </div>

              {/* Category & Type Row */}
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Food Type *</label>
                  <select
                    className={styles.formSelect}
                    value={type || ""}
                    onChange={(e) => setType(e.target.value)}
                    required
                  >
                    <option value="">Select Food Type</option>
                    {ORDER_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Category *</label>
                  <select
                    className={styles.formSelect}
                    value={foodCategory || ""}
                    onChange={(e) => setFoodCategory(e.target.value)}
                    required
                  >
                    <option value="">Select Category</option>
                    {DEFAULT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tags Section */}
              <div className={styles.tagsSection}>
                <label className={styles.tagsLabel}>Tags</label>
                <div className={styles.tagsContainer}>
                  {FOOD_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className={`${styles.tagButton} ${tags.includes(tag) ? styles.active : ''}`}
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Variants Section */}
              <div className={styles.variantsSection}>
                <div className={styles.variantsHeader}>
                  <label className={styles.variantsLabel}>Variants & Pricing *</label>
                  <button type="button" onClick={addVariant} className={styles.addVariantBtn}>
                    <span>+</span> Add Variant
                  </button>
                </div>
                {variants.map((variant, index) => (
                  <div key={index} className={styles.variantRow}>
                    <input
                      type="text"
                      className={styles.variantInput}
                      value={variant.label}
                      onChange={(e) => updateVariant(index, "label", e.target.value)}
                      placeholder="Variant name (e.g., Regular, Large)"
                      required
                    />
                    <div className={styles.priceWrapper}>
                      <span className={styles.priceSymbol}>₹</span>
                      <input
                        type="number"
                        className={styles.priceInput}
                        value={variant.price}
                        onChange={(e) => updateVariant(index, "price", Number(e.target.value))}
                        placeholder="Price"
                        min="1"
                        required
                      />
                    </div>
                    {variants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeVariant(index)}
                        className={styles.removeVariantBtn}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Form Actions */}
              <div className={styles.formActions}>
                <button type="submit" className={styles.submitBtn} disabled={loading}>
                  {loading ? "Updating..." : "Update Item"}
                </button>
                <button 
                  type="button" 
                  className={styles.cancelBtn}
                  onClick={() => router.push("/admin/menu")}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessPopup && (
        <div className={styles.modalOverlay} onClick={handleSuccessClose}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalIcon}>
              <span>✓</span>
            </div>
            <h3 className={styles.modalTitle}>Update Successful!</h3>
            <p className={styles.modalText}>Your menu item has been updated successfully.</p>
            <div className={styles.modalActions}>
              <button onClick={handleSuccessClose} className={styles.modalPrimaryBtn}>
                Go to Menu
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </RequireAdminAuth>
  );
}

export default EditItemPage;
