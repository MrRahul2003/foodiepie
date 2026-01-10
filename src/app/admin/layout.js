/**
 * =========================================================================
 * ADMIN LAYOUT - Root Layout for Admin Section
 * =========================================================================
 * 
 * PURPOSE:
 * Wraps all admin pages with the AdminSessionProvider context
 * to provide authentication state across the admin section.
 * 
 * SESSION MANAGEMENT:
 * - AdminSessionProvider manages restaurant authentication
 * - Provides: restaurantId, restaurantName, isAuthenticated, isLoaded
 * - Session persists via localStorage (adminSession, adminProfile)
 * 
 * CHILD ROUTES:
 * - /admin - Dashboard home
 * - /admin/auth - Login/Signup
 * - /admin/menu - Menu management
 * - /admin/orders - Active orders
 * - /admin/history - Order history
 * - /admin/profile - Restaurant profile
 * - /admin/settings - Settings page
 * 
 * =========================================================================
 */

import { AdminSessionProvider } from '@/src/contexts/AdminSessionContext';

export const metadata = {
  title: 'Admin Dashboard | Foodie Pie',
  description: 'Restaurant management dashboard',
};

export default function AdminLayout({ children }) {
  return (
    <AdminSessionProvider>
      {children}
    </AdminSessionProvider>
  );
}
