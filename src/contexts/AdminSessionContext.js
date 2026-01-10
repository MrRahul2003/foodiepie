'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SESSION_KEYS } from '@/src/lib/constants';

const AdminSessionContext = createContext(null);

export function AdminSessionProvider({ children }) {
  const [session, setSession] = useState({
    adminPhone: null,
    restaurantId: null,
    isLoaded: false
  });

  useEffect(() => {
    const adminPhone = localStorage.getItem(SESSION_KEYS.ADMIN_PHONE);
    const restaurantId = localStorage.getItem(SESSION_KEYS.ADMIN_RESTAURANT_ID);

    setSession({
      adminPhone,
      restaurantId,
      isLoaded: true
    });
  }, []);

  const setAdminSession = useCallback((phone, restaurantId) => {
    localStorage.setItem(SESSION_KEYS.ADMIN_PHONE, phone);
    localStorage.setItem(SESSION_KEYS.ADMIN_RESTAURANT_ID, restaurantId);
    
    // Set cookie for middleware authentication (7 days expiry)
    const sessionData = JSON.stringify({ phone, restaurantId });
    document.cookie = `adminSession=${encodeURIComponent(sessionData)}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
    
    setSession({
      adminPhone: phone,
      restaurantId,
      isLoaded: true
    });
  }, []);

  const clearAdminSession = useCallback(() => {
    localStorage.removeItem(SESSION_KEYS.ADMIN_PHONE);
    localStorage.removeItem(SESSION_KEYS.ADMIN_RESTAURANT_ID);
    
    // Clear the cookie
    document.cookie = 'adminSession=; path=/; max-age=0; SameSite=Lax';
    
    setSession({
      adminPhone: null,
      restaurantId: null,
      isLoaded: true
    });
  }, []);

  const isAuthenticated = Boolean(session.adminPhone && session.restaurantId);

  return (
    <AdminSessionContext.Provider value={{
      ...session,
      isAuthenticated,
      setAdminSession,
      clearAdminSession
    }}>
      {children}
    </AdminSessionContext.Provider>
  );
}

export function useAdminSession() {
  const context = useContext(AdminSessionContext);
  if (!context) {
    throw new Error('useAdminSession must be used within AdminSessionProvider');
  }
  return context;
}
