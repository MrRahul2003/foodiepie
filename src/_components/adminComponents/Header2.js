// Mobile menu component for admin dashboard
"use client";
import Link from 'next/link'
import React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAdminSession } from '@/src/contexts/AdminSessionContext'
import styles from './header.module.css'

function Header2() {
  const pathname = usePathname();
  const router = useRouter();
  const { restaurantId, clearAdminSession } = useAdminSession();

  const handleLogout = () => {
    if (confirm("Are you sure you want to logout?")) {
      clearAdminSession();
      router.push("/admin/auth");
    }
  };

  const isActive = (path) => pathname === path || pathname.startsWith(path + '/');

  return (
<div className={`mobile-menu-area ${styles.mobileMenuArea}`}>
  <div className="container">
    <div className="row">
      <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
        <div className="mobile-menu">
          <nav id="dropdown">
            <ul className={`mobile-menu-nav ${styles.mobileMenuNav}`}>
              <li className={pathname === '/admin' ? 'active' : ''}>
                <Link href="/admin">Dashboard</Link>
              </li>
              <li className={isActive('/admin/orders') ? 'active' : ''}>
                <Link href="/admin/orders">Orders</Link>
              </li>
              <li className={isActive('/admin/menu') ? 'active' : ''}>
                <Link href="/admin/menu"><i className="notika-icon notika-menus" /> Menu</Link>
              </li>
              <li className={isActive('/admin/menu/addItem') ? 'active' : ''}>
                <Link href="/admin/menu/addItem"><i className="notika-icon notika-edit" /> Add Items</Link>
              </li>
              <li className={isActive('/admin/history') ? 'active' : ''}>
                <Link href="/admin/history"><i className="notika-icon notika-time" /> History</Link>
              </li>
              {restaurantId ? (
                <li>
                  <a href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }} className={styles.logoutBtn}>
                    Logout
                  </a>
                </li>
              ) : (
                <li className={isActive('/admin/auth') ? 'active' : ''}>
                  <Link href="/admin/auth">Login</Link>
                </li>
              )}
            </ul>
          </nav>
        </div>
      </div>
    </div>
  </div>
</div>
  )
}

export default Header2