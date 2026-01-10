"use client";
import Link from 'next/link'
import React, { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAdminSession } from '@/src/contexts/AdminSessionContext'
import styles from './header.module.css'

function Header3() {
  const pathname = usePathname();
  const router = useRouter();
  const { restaurantId, adminPhone, clearAdminSession } = useAdminSession();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    clearAdminSession();
    setShowLogoutModal(false);
    router.push("/admin/auth");
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  const isActive = (path) => pathname === path || (path !== '/admin' && pathname.startsWith(path));

  return (
    <>
<div className={`main-menu-area ${styles.mainMenuArea}`}>
  <div className="container">
    <div className="row">
      <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
        <ul className={`nav nav-tabs notika-menu-wrap menu-it-icon-pro ${styles.mainNav}`}>

          <li className={pathname === '/admin' ? 'active' : ''}>
            <Link href="/admin"><i className="notika-icon notika-house" /> Dashboard</Link>
          </li>
          <li className={isActive('/admin/orders') ? 'active' : ''}>
            <Link href="/admin/orders"><i className="notika-icon notika-checked" /> Orders</Link>
          </li>
          <li className={isActive('/admin/menu') && !pathname.includes('addItem') ? 'active' : ''}>
            <Link href="/admin/menu"><i className="notika-icon notika-menus" /> Menu</Link>
          </li>
          <li className={pathname.includes('addItem') ? 'active' : ''}>
            <Link href="/admin/menu/addItem"><i className="notika-icon notika-edit" /> Add Items</Link>
          </li>
          <li className={isActive('/admin/history') ? 'active' : ''}>
            <Link href="/admin/history"><i className="notika-icon notika-next" /> History</Link>
          </li>
          {restaurantId ? (
            <>
              <li style={{ marginLeft: 'auto' }}>
                <span className={styles.restoInfo}>
                  <i className="notika-icon notika-star" /> Restaurant ID: <span className={styles.restoId}>{restaurantId}</span>
                </span>
              </li>
              <li>
                <a href="#" onClick={(e) => { e.preventDefault(); handleLogoutClick(); }} className={styles.logoutBtn}>
                  <i className="notika-icon notika-close" /> Logout
                </a>
              </li>
            </>
          ) : (
            <li className={isActive('/admin/auth') ? 'active' : ''} style={{ marginLeft: 'auto' }}>
              <Link href="/admin/auth" className={styles.loginBtn}><i className="notika-icon notika-login" /> Login</Link>
            </li>
          )}

        </ul>
      </div>
    </div>
  </div>
</div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className={styles.modalOverlay} onClick={cancelLogout}>
          <div className={styles.logoutModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalIconAdmin}>
              <i className="notika-icon notika-close" />
            </div>
            <h3 className={styles.modalTitle}>Logout</h3>
            <p className={styles.modalText}>Are you sure you want to logout from admin panel?</p>
            <div className={styles.modalButtons}>
              <button className={styles.cancelBtn} onClick={cancelLogout}>
                Cancel
              </button>
              <button className={styles.confirmBtnAdmin} onClick={confirmLogout}>
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Header3
