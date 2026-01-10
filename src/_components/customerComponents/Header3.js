"use client";
import Link from 'next/link'
import React, { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useSession } from '@/src/contexts/SessionContext'
import styles from './header.module.css'

function Header3() {
  const pathname = usePathname();
  const router = useRouter();
  const session = useSession();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem("customerSession");
    localStorage.removeItem("customerProfile");
    localStorage.removeItem("foodie_pie_cart");
    localStorage.removeItem("foodie_pie_orders");
    // Clear the auth cookie
    document.cookie = 'customerSession=; path=/; max-age=0; SameSite=Lax';
    setShowLogoutModal(false);
    router.push("/auth");
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  const isActive = (path) => pathname === path;

  return (
    <>
<div className={`main-menu-area ${styles.mainMenuArea}`}>
  <div className="container">
    <div className="row">
      <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
        <ul className={`nav nav-tabs notika-menu-wrap menu-it-icon-pro ${styles.mainNav}`}>

          <li className={isActive('/') || isActive('/dashboard') ? 'active' : ''}>
            <Link href="/"><i className="notika-icon notika-house" /> Home</Link>
          </li>
          <li className={isActive('/menu') ? 'active' : ''}>
            <Link href="/menu"><i className="notika-icon notika-menus" /> Menu</Link>
          </li>
          <li className={isActive('/cart') ? 'active' : ''}>
            <Link href="/cart"><i className="notika-icon notika-up-arrow" /> Cart</Link>
          </li>
          <li className={isActive('/order') ? 'active' : ''}>
            <Link href="/order"><i className="notika-icon notika-checked" /> Order</Link>
          </li>
          <li className={isActive('/history') ? 'active' : ''}>
            <Link href="/history"><i className="notika-icon notika-next" /> History</Link>
          </li>
          {session.customerPhone ? (
            <>
              <li style={{ marginLeft: 'auto' }}>
                <span className={styles.userInfo}>
                  <i className="notika-icon notika-phone" /> {session.customerPhone}
                  {session.tableNumber && <> | Table: {session.tableNumber}</>}
                </span>
              </li>
              <li>
                <a href="#" onClick={(e) => { e.preventDefault(); handleLogoutClick(); }} className={styles.logoutBtn}>
                  <i className="notika-icon notika-close" /> Logout
                </a>
              </li>
            </>
          ) : (
            <li className={isActive('/auth') ? 'active' : ''} style={{ marginLeft: 'auto' }}>
              <Link href="/auth"><i className="notika-icon notika-login" /> Login</Link>
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
            <div className={styles.modalIcon}>
              <i className="notika-icon notika-close" />
            </div>
            <h3 className={styles.modalTitle}>Logout</h3>
            <p className={styles.modalText}>Are you sure you want to logout?</p>
            <div className={styles.modalButtons}>
              <button className={styles.cancelBtn} onClick={cancelLogout}>
                Cancel
              </button>
              <button className={styles.confirmBtn} onClick={confirmLogout}>
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
