/**
 * =========================================================================
 * ROOT LAYOUT - Main Application Layout
 * =========================================================================
 * 
 * PURPOSE:
 * Root layout for the entire Foodie Pie application.
 * Wraps all pages with SessionProvider and loads global assets.
 * 
 * SESSION MANAGEMENT:
 * - SessionProvider manages customer authentication
 * - Provides: customerId, restaurantId, tableNumber, isAuthenticated
 * - Session persists via localStorage (customerSession, customerProfile)
 * 
 * GLOBAL ASSETS LOADED:
 * - CSS: Bootstrap, Font Awesome, Owl Carousel, custom styles
 * - JS: jQuery, Bootstrap JS, animations, charts, chat widgets
 * 
 * ROUTES COVERED:
 * - / - Customer landing page
 * - /menu - Browse menu
 * - /cart - Shopping cart
 * - /order - Order tracking
 * - /auth - Customer authentication
 * - /history - Order history
 * - /profile - Customer profile
 * - /admin/* - Admin section (uses nested layout)
 * 
 * NOTE: Admin section has its own layout with AdminSessionProvider
 * 
 * =========================================================================
 */

import Script from "next/script";
import "./globals.css";
import { SessionProvider } from "@/src/contexts/SessionContext";

export const metadata = {
  title: "Foodie Pie | Online Food Ordering",
  description: "Order delicious food from your favorite restaurant",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* ===== FAVICON ===== */}
        <link rel="shortcut icon" type="image/x-icon" href="/img/favicon.ico" />
        
        {/* ===== FONTS ===== */}
        <link
          href="https://fonts.googleapis.com/css?family=Roboto:100,300,400,700,900"
          rel="stylesheet"
        />
        
        {/* ===== STYLESHEETS ===== */}
        <link rel="stylesheet" href="/css/bootstrap.min.css" />
        <link rel="stylesheet" href="/css/font-awesome.min.css" />
        <link rel="stylesheet" href="/css/owl.carousel.css" />
        <link rel="stylesheet" href="/css/owl.theme.css" />
        <link rel="stylesheet" href="/css/owl.transitions.css" />
        <link rel="stylesheet" href="/css/meanmenu/meanmenu.min.css" />
        <link rel="stylesheet" href="/css/animate.css" />
        <link rel="stylesheet" href="/css/normalize.css" />
        <link rel="stylesheet" href="/css/scrollbar/jquery.mCustomScrollbar.min.css" />
        <link rel="stylesheet" href="/css/jvectormap/jquery-jvectormap-2.0.3.css" />
        <link rel="stylesheet" href="/css/notika-custom-icon.css" />
        <link rel="stylesheet" href="/css/wave/waves.min.css" />
        <link rel="stylesheet" href="/css/main.css" />
        <link rel="stylesheet" href="/style.css" />
        <link rel="stylesheet" href="/css/responsive.css" />
      </head>
      <body>
        <div />
        {/* ===== SESSION PROVIDER FOR CUSTOMER AUTH ===== */}
        <SessionProvider>{children}</SessionProvider>

        {/* ===== VENDOR SCRIPTS ===== */}
        <Script src="/js/vendor/modernizr-2.8.3.min.js"/>
        <Script
          src="/js/vendor/jquery-1.12.4.min.js"
          strategy="afterInteractive"
        />
        <Script src="/js/bootstrap.min.js" strategy="afterInteractive" />
        <Script src="/js/wow.min.js" strategy="afterInteractive" />
        <Script src="/js/jquery-price-slider.js" strategy="afterInteractive" />
        <Script src="/js/owl.carousel.min.js" strategy="afterInteractive" />
        <Script src="/js/jquery.scrollUp.min.js" strategy="afterInteractive" />
        <Script
          src="/js/meanmenu/jquery.meanmenu.js"
          strategy="afterInteractive"
        />
        
        {/* ===== COUNTER/ANIMATION SCRIPTS ===== */}
        <Script
          src="/js/counterup/jquery.counterup.min.js"
          strategy="afterInteractive"
        />
        <Script
          src="/js/counterup/waypoints.min.js"
          strategy="afterInteractive"
        />
        <Script
          src="/js/counterup/counterup-active.js"
          strategy="afterInteractive"
        />
        
        {/* ===== SCROLLBAR SCRIPTS ===== */}
        <Script
          src="/js/scrollbar/jquery.mCustomScrollbar.concat.min.js"
          strategy="afterInteractive"
        />
        
        {/* ===== MAP/VECTOR SCRIPTS ===== */}
        <Script
          src="/js/jvectormap/jquery-jvectormap-2.0.2.min.js"
          strategy="afterInteractive"
        />
        <Script
          src="/js/jvectormap/jquery-jvectormap-world-mill-en.js"
          strategy="afterInteractive"
        />
        <Script
          src="/js/jvectormap/jvectormap-active.js"
          strategy="afterInteractive"
        />
        
        {/* ===== CHART/SPARKLINE SCRIPTS ===== */}
        <Script
          src="/js/sparkline/jquery.sparkline.min.js"
          strategy="afterInteractive"
        />
        <Script
          src="/js/sparkline/sparkline-active.js"
          strategy="afterInteractive"
        />
        <Script src="/js/flot/jquery.flot.js" strategy="afterInteractive" />
        <Script
          src="/js/flot/jquery.flot.resize.js"
          strategy="afterInteractive"
        />
        <Script src="/js/flot/curvedLines.js" strategy="afterInteractive" />
        <Script src="/js/flot/flot-active.js" strategy="afterInteractive" />
        
        {/* ===== KNOB/DIAL SCRIPTS ===== */}
        <Script src="/js/knob/jquery.knob.js" strategy="afterInteractive" />
        <Script src="/js/knob/jquery.appear.js" strategy="afterInteractive" />
        <Script src="/js/knob/knob-active.js" strategy="afterInteractive" />
        
        {/* ===== WAVE/ANIMATION SCRIPTS ===== */}
        <Script src="/js/wave/waves.min.js" strategy="afterInteractive" />
        <Script src="/js/wave/wave-active.js" strategy="afterInteractive" />
        
        {/* ===== UTILITY SCRIPTS ===== */}
        <Script src="/js/todo/jquery.todo.js" strategy="afterInteractive" />
        <Script src="/js/plugins.js" strategy="afterInteractive" />
        
        {/* ===== CHAT SCRIPTS ===== */}
        <Script src="/js/chat/moment.min.js" strategy="afterInteractive" />
        <Script src="/js/chat/jquery.chat.js" strategy="afterInteractive" />
        
        {/* ===== MAIN APP SCRIPTS ===== */}
        <Script src="/js/main.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
