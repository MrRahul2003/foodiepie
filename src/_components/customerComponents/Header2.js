// Mobile menu component for customer side
"use client";
import Link from 'next/link'
import React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useSession } from '@/src/contexts/SessionContext'
import styles from './header.module.css'

function Header2() {
  const pathname = usePathname();
  const router = useRouter();
  const session = useSession();

  const handleLogout = () => {
    if (confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("customerSession");
      localStorage.removeItem("customerProfile");
      localStorage.removeItem("foodie_pie_cart");
      localStorage.removeItem("foodie_pie_orders");
      router.push("/auth");
    }
  };

  const isActive = (path) => pathname === path;

  return (
<div className={`mobile-menu-area ${styles.mobileMenuArea}`}>
  <div className="container">
    <div className="row">
      <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
        <div className="mobile-menu">
          <nav id="dropdown">
            <ul className={`mobile-menu-nav ${styles.mobileMenuNav}`}>
              <li className={isActive('/') ? 'active' : ''}>
                <Link href="/">Home</Link>
              </li>
              <li className={isActive('/menu') ? 'active' : ''}>
                <Link href="/menu">Menu</Link>
              </li>
              <li className={isActive('/cart') ? 'active' : ''}>
                <Link href="/cart">Cart</Link>
              </li>
              <li className={isActive('/order') ? 'active' : ''}>
                <Link href="/order">Order</Link>
              </li>
              <li className={isActive('/history') ? 'active' : ''}>
                <Link href="/history">History</Link>
              </li>
              {session.customerPhone ? (
                <li>
                  <a href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }} className={styles.logoutBtn}>
                    Logout
                  </a>
                </li>
              ) : (
                <li className={isActive('/auth') ? 'active' : ''}>
                  <Link href="/auth">Login</Link>
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