import React from "react";
import Link from "next/link";
import styles from "./header.module.css";

function Header1() {
  return (
    <div className={`header-top-area ${styles.headerTopArea}`}>
      <div className="container">
        <div className="row">
          <div className="col-lg-4 col-md-4 col-sm-6 col-xs-6">
            <div className={`logo-area ${styles.logoArea}`}>
              <Link href="/admin" className={styles.logoText}>
                <i className="notika-icon notika-food" /> FoodiePie
              </Link>
            </div>
          </div>
          <div className="col-lg-8 col-md-8 col-sm-6 col-xs-6">
            <div className={`header-top-menu ${styles.headerTopMenu}`}>
              <ul className="nav navbar-nav notika-top-nav">
                <li className="nav-item">
                  <span className={styles.adminBadge}>
                    <i className="notika-icon notika-star" /> Admin Panel
                  </span>
                </li>
                <li className="nav-item">
                  <Link href="/admin/orders" className="nav-link">
                    <span>
                      <i className="notika-icon notika-checked" />
                    </span>
                  </Link>
                </li>
                <li className="nav-item">
                  <Link href="/admin/menu" className="nav-link">
                    <span>
                      <i className="notika-icon notika-menus" />
                    </span>
                  </Link>
                </li>
                <li className="nav-item">
                  <Link href="/admin/history" className="nav-link">
                    <span>
                      <i className="notika-icon notika-time" />
                    </span>
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Header1;
