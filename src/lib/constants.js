// Order status flow
export const ORDER_STATUSES = ["Placed", "Accepted", "Preparing", "Served"];

export const ORDER_TYPES = ["Veg", "Non-Veg", "Egg"];

// Payment methods
export const PAYMENT_METHODS = [
  { id: "UPI", label: "UPI", icon: "Smartphone" },
  { id: "Cash", label: "Cash", icon: "Banknote" },
  { id: "Card", label: "Card", icon: "CreditCard" },
];

// Dietary filters
export const DIETARY_FILTERS = [
  { id: "all", label: "All" },
  { id: "Veg", label: "Veg", color: "#27AE60" },
  { id: "Non-Veg", label: "Non-Veg", color: "#E74C3C" },
  { id: "Egg", label: "Egg", color: "#F39C12" },
];

// Common food categories
export const DEFAULT_CATEGORIES = [
  "Starters",
  "Main Course",
  "Breads",
  "Rice & Biryani",
  "Soups",
  "Salads",
  "Desserts",
  "Beverages",
];

// Common food tags
export const FOOD_TAGS = [
  "Best Seller",
  "Spicy",
  "New",
  "Chef Special",
  "Healthy",
  "Recommended",
];

// Polling intervals (in milliseconds)
export const POLLING_INTERVALS = {
  ADMIN_ORDERS: 10000, // 10 seconds
  ORDER_TRACKING: 15000, // 15 seconds
  MENU_AVAILABILITY: 30000, // 30 seconds
};

// Session keys for localStorage
export const SESSION_KEYS = {
  RESTAURANT_ID: "dineflow_restaurant_id",
  RESTAURANT_CODE: "dineflow_restaurant_code",
  RESTAURANT_NAME: "dineflow_restaurant_name",
  CUSTOMER_NAME: "dineflow_customer_name",
  CUSTOMER_PHONE: "dineflow_customer_phone",
  TABLE_NUMBER: "dineflow_table_number",
  CART: "dineflow_cart",
  ADMIN_PHONE: "dineflow_admin_phone",
  ADMIN_RESTAURANT_ID: "dineflow_admin_restaurant_id",
};
