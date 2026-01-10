"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { SESSION_KEYS } from "@/src/lib/constants";

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [session, setSession] = useState({
    restaurantId: null,
    restaurantCode: null,
    restaurantName: null,
    customerName: null,
    customerPhone: null,
    tableNumber: null,
    sessionId: null,
    profileId: null,
    isLoaded: false,
  });

  // Load session from localStorage on mount
  // Reads from customerSession and customerProfile keys used by auth page
  useEffect(() => {
    try {
      // Read from customerSession (set by auth page)
      const customerSessionStr = localStorage.getItem("customerSession");
      const customerProfileStr = localStorage.getItem("customerProfile");
      
      console.log("=== SessionContext Loading ===");
      console.log("customerSession raw:", customerSessionStr);
      console.log("customerProfile raw:", customerProfileStr);
      
      let sessionData = {};
      let profileData = {};
      
      if (customerSessionStr) {
        sessionData = JSON.parse(customerSessionStr);
        console.log("Parsed sessionData:", sessionData);
      }
      
      if (customerProfileStr) {
        profileData = JSON.parse(customerProfileStr);
        console.log("Parsed profileData:", profileData);
      }
      
      // Try multiple possible field names for restaurant ID
      const finalRestoId = sessionData.restoId || sessionData.restaurantId || 
                           profileData.restoId || profileData.restaurantId || null;
      console.log("Final restaurantId:", finalRestoId);
      
      // Map the stored data to session state
      // restaurantId uses restoId (the 6-char code) as identifier
      // This is what the cart page checks for session validity
      setSession({
        restaurantId: finalRestoId,
        restaurantCode: sessionData.restoId || profileData.restoId || null,
        restaurantName: profileData.restaurantName || sessionData.restoId || null,
        customerName: profileData.name || null,
        customerPhone: sessionData.phone || profileData.phone || null,
        tableNumber: sessionData.tableNo || profileData.tableNo || null,
        sessionId: sessionData.sessionId || null,
        profileId: sessionData.profileId || profileData._id || null,
        isLoaded: true,
      });
    } catch (error) {
      console.error("Error loading session from localStorage:", error);
      setSession((prev) => ({ ...prev, isLoaded: true }));
    }
  }, []);

  // Set restaurant info
  const setRestaurant = useCallback((id, code, name) => {
    localStorage.setItem(SESSION_KEYS.RESTAURANT_ID, id);
    localStorage.setItem(SESSION_KEYS.RESTAURANT_CODE, code);
    localStorage.setItem(SESSION_KEYS.RESTAURANT_NAME, name);
    setSession((prev) => ({
      ...prev,
      restaurantId: id,
      restaurantCode: code,
      restaurantName: name,
    }));
  }, []);

  // Set customer name
  const setCustomerName = useCallback((name) => {
    localStorage.setItem(SESSION_KEYS.CUSTOMER_NAME, name);
    setSession((prev) => ({ ...prev, customerName: name }));
  }, []);

  // Set customer phone
  const setCustomerPhone = useCallback((phone) => {
    localStorage.setItem(SESSION_KEYS.CUSTOMER_PHONE, phone);
    setSession((prev) => ({ ...prev, customerPhone: phone }));
  }, []);

  // Set table number (locks session)
  const setTableNumber = useCallback((table) => {
    localStorage.setItem(SESSION_KEYS.TABLE_NUMBER, table);
    setSession((prev) => ({ ...prev, tableNumber: table }));
  }, []);

  // Clear customer session (keep restaurant)
  const clearCustomerSession = useCallback(() => {
    localStorage.removeItem(SESSION_KEYS.CUSTOMER_NAME);
    localStorage.removeItem(SESSION_KEYS.CUSTOMER_PHONE);
    localStorage.removeItem(SESSION_KEYS.TABLE_NUMBER);
    localStorage.removeItem(SESSION_KEYS.CART);
    setSession((prev) => ({
      ...prev,
      customerName: null,
      customerPhone: null,
      tableNumber: null,
    }));
  }, []);

  // Clear all session
  const clearSession = useCallback(() => {
    Object.values(SESSION_KEYS).forEach((key) => {
      if (!key.includes("admin")) {
        localStorage.removeItem(key);
      }
    });
    setSession({
      restaurantId: null,
      restaurantCode: null,
      restaurantName: null,
      customerName: null,
      customerPhone: null,
      tableNumber: null,
      isLoaded: true,
    });
  }, []);

  // Check if session is complete
  const isSessionComplete = Boolean(
    session.restaurantId && session.customerPhone && session.tableNumber
  );

  return (
    <SessionContext.Provider
      value={{
        ...session,
        setRestaurant,
        setCustomerName,
        setCustomerPhone,
        setTableNumber,
        clearCustomerSession,
        clearSession,
        isSessionComplete,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within SessionProvider");
  }
  return context;
}
