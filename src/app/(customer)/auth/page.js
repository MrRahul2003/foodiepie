/**
 * =========================================================================
 * CUSTOMER AUTHENTICATION PAGE - Restaurant Verification & OTP Login
 * =========================================================================
 * 
 * PAGE FLOW:
 * 
 * STEP 1 - Restaurant Verification:
 * 1. Customer enters 6-character Restaurant ID (restoId)
 * 2. System verifies restaurant exists in database
 * 3. If valid, shows restaurant name and proceeds to Step 2
 * 
 * STEP 2 - Phone & OTP Verification:
 * 1. Customer enters 10-digit phone number
 * 2. System sends OTP (simulated - use "111111" for testing)
 * 3. Customer enters 6-digit OTP
 * 4. On valid OTP, shows table number popup
 * 
 * STEP 3 - Table Assignment:
 * 1. Customer enters table number (1-50)
 * 2. System creates/gets customer profile
 * 3. Creates session with restaurant, phone, and table
 * 4. Saves to localStorage and redirects to menu
 * 
 * STATE MANAGEMENT:
 * - step: Current auth step (1, 2, or 3)
 * - restoId/phone/otp: Form fields
 * - otpSent: Whether OTP has been sent
 * - resendTimer: Countdown for OTP resend
 * - showTablePopup: Table number popup visibility
 * - tableNo: Selected table number
 * - restaurantName/restaurantDbId: Verified restaurant info
 * 
 * FEATURES:
 * - Two-step verification (restaurant + phone)
 * - OTP with resend cooldown timer
 * - Table number assignment popup
 * - Session persistence in localStorage
 * - Existing session check on mount
 * - Visual restaurant branding
 * 
 * LOCALSTORAGE KEYS:
 * - customerSession: { profileId, restoId, restoName, phone, tableNo }
 * - customerProfile: { phone, name, createdAt }
 * 
 * =========================================================================
 */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import "./auth.css";
import {
  checkCustomerSession,
  createOrGetCustomerProfile,
  createCustomerSession,
} from "@/src/actions/customerAuthActions";
import { verifyRestoIdAction } from "@/src/actions/adminAuthActions";

// =========================================================================
// MAIN COMPONENT
// =========================================================================

function AdminAuthPage() {
  const router = useRouter();

  // -----------------------------------------------------------------------
  // STATE VARIABLES
  // -----------------------------------------------------------------------

  /** Current authentication step (1=restoId, 2=phone/OTP, 3=table) */
  const [step, setStep] = useState(1);
  
  /** Restaurant ID input */
  const [restoId, setRestoId] = useState("");
  
  /** Customer phone number */
  const [phone, setPhone] = useState("");
  
  /** OTP input value */
  const [otp, setOtp] = useState("");
  
  /** Form submission loading state */
  const [loading, setLoading] = useState(false);
  
  /** Error message to display */
  const [error, setError] = useState("");
  
  /** Success modal visibility */
  const [showSuccess, setShowSuccess] = useState(false);
  
  /** Whether OTP has been sent */
  const [otpSent, setOtpSent] = useState(false);
  
  /** Countdown timer for OTP resend */
  const [resendTimer, setResendTimer] = useState(0);
  
  /** Table number popup visibility */
  const [showTablePopup, setShowTablePopup] = useState(false);
  
  /** Selected table number */
  const [tableNo, setTableNo] = useState("");
  
  /** Table popup error message */
  const [tableError, setTableError] = useState("");
  
  /** Session creation loading state */
  const [creatingSession, setCreatingSession] = useState(false);
  
  /** Verified restaurant name */
  const [restaurantName, setRestaurantName] = useState("");
  
  /** Restaurant MongoDB ID */
  const [restaurantDbId, setRestaurantDbId] = useState("");

  // -----------------------------------------------------------------------
  // EFFECTS
  // -----------------------------------------------------------------------
  
  /**
   * Effect: Check for existing session on component mount
   * Redirects to dashboard if valid session exists
   */
  useEffect(() => {
    checkExistingSession();
  }, []);

  /**
   * Effect: Countdown timer for OTP resend button
   * Decrements every second when resendTimer > 0
   */
  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // -----------------------------------------------------------------------
  // SESSION MANAGEMENT
  // -----------------------------------------------------------------------
  
  /**
   * Checks for existing customer session in localStorage
   * Redirects to dashboard if valid session found
   */
  const checkExistingSession = async () => {
    try {
      const session = localStorage.getItem("customerSession");
      if (session) {
        const sessionData = JSON.parse(session);
        // Validate session has required fields
        if (sessionData.profileId && sessionData.restoId) {
          router.push("/");
        }
      }
    } catch (error) {
      console.error("Session check error:", error);
      localStorage.removeItem("customerSession");
    }
  };

  // -----------------------------------------------------------------------
  // RESTAURANT VERIFICATION (STEP 1)
  // -----------------------------------------------------------------------

  /**
   * Handles restaurant ID verification
   * Verifies restoId exists and stores restaurant info
   */
  const handleRestoIdSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await verifyRestoIdAction(restoId);

      if (result.success) {
        setRestaurantName(result.restaurantName);
        if (result.restaurantId) {
          setRestaurantDbId(result.restaurantId);
        }
        setStep(2);
        setError("");
      } else {
        setError(result.error || "Invalid Restaurant ID. Please check and try again.");
      }
    } catch (err) {
      setError("Verification failed. Please try again.");
    }

    setLoading(false);
  };

  // -----------------------------------------------------------------------
  // OTP HANDLERS (STEP 2)
  // -----------------------------------------------------------------------

  /**
   * Sends OTP to the entered phone number
   * Currently simulated - use "111111" for testing
   */
  const handleSendOtp = useCallback(async () => {
    if (phone.length !== 10) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }

    setError("");
    setLoading(true);

    // Simulate OTP sending
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setOtpSent(true);
    setResendTimer(30); // 30 seconds cooldown
    setLoading(false);
  }, [phone]);

  /**
   * Resends OTP after cooldown period
   */
  const handleResendOtp = useCallback(async () => {
    if (resendTimer > 0) return;

    setError("");
    setLoading(true);
    setOtp("");

    // Simulate OTP resending
    await new Promise((resolve) => setTimeout(resolve, 800));

    setResendTimer(30);
    setLoading(false);
  }, [resendTimer]);

  /**
   * Verifies entered OTP and shows table popup on success
   */
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");

    if (!phone || phone.length !== 10) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }

    if (!otpSent) {
      setError("Please send OTP first.");
    }

    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }

    setLoading(true);

    // Simulate OTP verification
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mock verification - use "111111" as test OTP
    if (otp === "111111") {
      // Check if session already exists
      const existingSession = localStorage.getItem("customerSession");
      
      if (existingSession) {
        try {
          const sessionData = JSON.parse(existingSession);
          if (sessionData.profileId && sessionData.restoId === restoId.toUpperCase()) {
            // Session available - redirect to dashboard
            setShowSuccess(true);
            setTimeout(() => {
              router.push("/");
            }, 1500);
            return;
          }
        } catch (e) {
          localStorage.removeItem("customerSession");
        }
      }
      
      // Session not available - ask for table number using popup
      setShowTablePopup(true);
      
    } else {
      setError("Invalid OTP. Please try again.");
    }

    setLoading(false);
  };

  const handleBack = () => {
    setStep(1);
    setPhone("");
    setOtp("");
    setOtpSent(false);
    setResendTimer(0);
    setError("");
  };
  
  // Handle table number submission and create session
  const handleTableSubmit = async (e) => {
    e.preventDefault();
    setTableError("");
    
    if (!tableNo || tableNo.trim() === "") {
      setTableError("Please enter a valid table number.");
      return;
    }
    
    setCreatingSession(true);
    
    try {
      const phoneNumber = phone;
      const restaurantId = restoId.toUpperCase();
      const table = tableNo.trim();
      
      // Step 1: Check if session already exists for this phone and restaurant
      const sessionCheckResult = await checkCustomerSession(phoneNumber, restaurantId);
      
      if (sessionCheckResult.success && sessionCheckResult.session) {
        // Session exists - store session details in localStorage
        const existingSession = sessionCheckResult.session;
        
        const sessionData = {
          sessionId: existingSession._id,
          profileId: existingSession.profileId,
          phone: existingSession.phone,
          restoId: existingSession.restoId,
          tableNo: existingSession.tableNo,
          loginTime: existingSession.createdAt,
          expiresAt: existingSession.expiresAt,
        };
        
        localStorage.setItem("customerSession", JSON.stringify(sessionData));
        
        // Set cookie for middleware authentication (7 days expiry)
        document.cookie = `customerSession=${encodeURIComponent(JSON.stringify(sessionData))}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
        
        // Also store/update user profile if available
        if (sessionCheckResult.userProfile) {
          localStorage.setItem("customerProfile", JSON.stringify(sessionCheckResult.userProfile));
        }
        
        // Close popup and show success
        setShowTablePopup(false);
        setShowSuccess(true);
        
        setTimeout(() => {
          router.push("/");
        }, 2000);
        
        return;
      }
      
      // Step 2: Session doesn't exist - Create or Get UserProfile first
      const profileResult = await createOrGetCustomerProfile(phoneNumber, restaurantId, table);
      
      if (!profileResult.success) {
        throw new Error(profileResult.error || "Failed to create user profile.");
      }
      
      const userId = profileResult.userProfile._id;
      
      // Store user profile in localStorage
      localStorage.setItem("customerProfile", JSON.stringify(profileResult.userProfile));
      
      // Step 3: Create session with profileId, phone, restoId, tableNo
      const sessionResult = await createCustomerSession(userId, phoneNumber, restaurantId, table);
      
      if (!sessionResult.success) {
        throw new Error(sessionResult.error || "Failed to create session.");
      }
      
      // Store session in localStorage
      const sessionData = {
        sessionId: sessionResult.session._id,
        profileId: userId,
        phone: phoneNumber,
        restoId: restaurantId,
        tableNo: table,
        loginTime: sessionResult.session.createdAt,
        expiresAt: sessionResult.session.expiresAt,
      };
      
      localStorage.setItem("customerSession", JSON.stringify(sessionData));
      
      // Set cookie for middleware authentication (7 days expiry)
      document.cookie = `customerSession=${encodeURIComponent(JSON.stringify(sessionData))}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
      
      // Close table popup and show success
      setShowTablePopup(false);
      setShowSuccess(true);
      
      // Redirect to dashboard after showing success message
      setTimeout(() => {
        router.push("/");
      }, 2000);
      
    } catch (error) {
      console.error("Error creating session:", error);
      setTableError(error.message || "Failed to create session. Please try again.");
    } finally {
      setCreatingSession(false);
    }
  };
  
  // Handle closing table popup (cancel)
  const handleTablePopupClose = () => {
    setShowTablePopup(false);
    setTableNo("");
    setTableError("");
  };

  return (
    <div className="auth-page">
      {/* Table Number Popup Modal */}
      {showTablePopup && (
        <div className="auth-modal-overlay">
          <div className="auth-modal">
            <div className="auth-modal-icon table">
              <i className="fa fa-cutlery"></i>
            </div>
            <h3 className="auth-modal-title">Enter Table Number</h3>
            <p className="auth-modal-text">Please enter your table number to continue ordering.</p>
            
            <form onSubmit={handleTableSubmit}>
              <div className="auth-input-group" style={{ marginBottom: '15px' }}>
                <span className="auth-input-icon">
                  <i className="fa fa-hashtag"></i>
                </span>
                <input
                  type="text"
                  className="auth-input"
                  placeholder="Enter Table Number (e.g., T1, 5, A2)"
                  value={tableNo}
                  onChange={(e) => setTableNo(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              
              {tableError && (
                <div className="auth-error" style={{ marginBottom: '15px' }}>
                  <i className="fa fa-exclamation-circle"></i>
                  <span>{tableError}</span>
                </div>
              )}
              
              <div className="auth-modal-details">
                <div className="auth-modal-detail-item">
                  <i className="fa fa-building"></i>
                  <span>Restaurant: <strong>{restoId.toUpperCase()}</strong></span>
                </div>
                <div className="auth-modal-detail-item">
                  <i className="fa fa-phone"></i>
                  <span>Phone: <strong>+91 {phone}</strong></span>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  className="auth-btn auth-btn-secondary"
                  onClick={handleTablePopupClose}
                  disabled={creatingSession}
                  style={{ flex: 1 }}
                >
                  <i className="fa fa-times"></i>
                  <span>Cancel</span>
                </button>
                <button
                  type="submit"
                  className="auth-btn auth-btn-primary"
                  disabled={creatingSession || !tableNo.trim()}
                  style={{ flex: 1 }}
                >
                  {creatingSession ? (
                    <>
                      <i className="fa fa-spinner fa-spin"></i>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa fa-check"></i>
                      <span>Confirm</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccess && (
        <div className="auth-modal-overlay">
          <div className="auth-modal">
            <div className="auth-modal-icon success">
              <i className="fa fa-check"></i>
            </div>
            <h3 className="auth-modal-title">Login Successful!</h3>
            <p className="auth-modal-text">Welcome back! You have successfully logged in.</p>
            <div className="auth-modal-details">
              <div className="auth-modal-detail-item">
                <i className="fa fa-building"></i>
                <span>Restaurant ID: <strong>{restoId.toUpperCase()}</strong></span>
              </div>
              <div className="auth-modal-detail-item">
                <i className="fa fa-phone"></i>
                <span>Phone: <strong>+91 {phone}</strong></span>
              </div>
              {tableNo && (
                <div className="auth-modal-detail-item">
                  <i className="fa fa-cutlery"></i>
                  <span>Table: <strong>{tableNo}</strong></span>
                </div>
              )}
            </div>
            <button 
              className="auth-btn auth-btn-primary" 
              onClick={() => {
                setShowSuccess(false);
                router.push("/");
              }}
            >
              <i className="fa fa-arrow-right"></i>
              <span>Continue to Dashboard</span>
            </button>
          </div>
        </div>
      )}

      <div className="auth-container">
        {/* Step 1: Restaurant ID Verification */}
        {step === 1 && (
          <div className="auth-card">
            <div className="auth-logo">
              <img src="/img/logo/logo.png" alt="Logo" />
            </div>

            <h2 className="auth-title">Restaurant Verification</h2>
            <p className="auth-subtitle">Enter your secret Restaurant ID to continue</p>

            <form onSubmit={handleRestoIdSubmit}>
              <div className="auth-input-group">
                <span className="auth-input-icon">
                  <i className="fa fa-building"></i>
                </span>
                <input
                  type="text"
                  className="auth-input"
                  placeholder="Enter Secret Restaurant ID"
                  value={restoId}
                  onChange={(e) => setRestoId(e.target.value)}
                  required
                />
              </div>

              {error && (
                <div className="auth-error">
                  <i className="fa fa-exclamation-circle"></i>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                className="auth-btn auth-btn-primary"
                disabled={loading || !restoId}
              >
                {loading ? (
                  <>
                    <i className="fa fa-spinner fa-spin"></i>
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>Verify Restaurant</span>
                    <i className="fa fa-arrow-right"></i>
                  </>
                )}
              </button>
            </form>

            <div className="auth-footer">
              <p>
                Don't have a Restaurant ID?{" "}
                <a href="#">Contact Support</a>
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Phone OTP Login */}
        {step === 2 && (
          <div className="auth-card">
            <div className="auth-logo">
              <img src="/img/logo/logo.png" alt="Logo" />
            </div>

            <div className="auth-verified-badge">
              <i className="fa fa-check-circle"></i>
              <span><strong>{restaurantName}</strong> ({restoId.toUpperCase()})</span>
            </div>

            <h2 className="auth-title">Phone Verification</h2>
            <p className="auth-subtitle">Enter your phone number to receive OTP</p>

            <form onSubmit={handleVerifyOtp}>
              {/* Phone Number Input */}
              <div className="auth-input-group">
                <span className="auth-input-icon">
                  <i className="fa fa-phone"></i>
                </span>
                <span className="auth-phone-prefix">+91</span>
                <input
                  type="tel"
                  className="auth-input auth-input-phone"
                  placeholder="Enter 10-digit mobile number"
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                  }
                  disabled={otpSent}
                  required
                />
                {otpSent && (
                  <button
                    type="button"
                    className="auth-change-phone"
                    onClick={() => {
                      setOtpSent(false);
                      setOtp("");
                      setResendTimer(0);
                    }}
                  >
                    <i className="fa fa-pencil"></i>
                  </button>
                )}
              </div>

              {/* Send OTP Button */}
              {!otpSent && (
                <button
                  type="button"
                  className="auth-btn auth-btn-primary"
                  disabled={loading || phone.length !== 10}
                  onClick={handleSendOtp}
                >
                  {loading ? (
                    <>
                      <i className="fa fa-spinner fa-spin"></i>
                      <span>Sending OTP...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa fa-paper-plane"></i>
                      <span>Send OTP</span>
                    </>
                  )}
                </button>
              )}

              {/* OTP Input Section */}
              {otpSent && (
                <>
                  <div className="auth-otp-sent-msg">
                    <i className="fa fa-check-circle"></i>
                    <span>OTP sent to +91 {phone}</span>
                  </div>

                  <div className="auth-input-group">
                    <span className="auth-input-icon">
                      <i className="fa fa-key"></i>
                    </span>
                    <input
                      type="text"
                      className="auth-input"
                      placeholder="Enter 6-digit OTP"
                      value={otp}
                      onChange={(e) =>
                        setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      required
                    />
                  </div>

                  {/* Resend OTP */}
                  <div className="auth-resend-row">
                    <span className="auth-resend-text">Didn't receive OTP?</span>
                    {resendTimer > 0 ? (
                      <span className="auth-resend-timer">
                        Resend in {resendTimer}s
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="auth-resend-btn"
                        onClick={handleResendOtp}
                        disabled={loading}
                      >
                        {loading ? "Sending..." : "Resend OTP"}
                      </button>
                    )}
                  </div>

                  {error && (
                    <div className="auth-error">
                      <i className="fa fa-exclamation-circle"></i>
                      <span>{error}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="auth-btn auth-btn-primary"
                    disabled={loading || otp.length !== 6}
                  >
                    {loading ? (
                      <>
                        <i className="fa fa-spinner fa-spin"></i>
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <i className="fa fa-shield"></i>
                        <span>Verify & Login</span>
                      </>
                    )}
                  </button>
                </>
              )}

              {/* Error for non-OTP state */}
              {!otpSent && error && (
                <div className="auth-error">
                  <i className="fa fa-exclamation-circle"></i>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="button"
                className="auth-btn auth-btn-secondary"
                onClick={handleBack}
              >
                <i className="fa fa-arrow-left"></i>
                <span>Change Restaurant ID</span>
              </button>
            </form>

            <div className="auth-footer">
              <p>
                Need help? <a href="#">Contact Support</a>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminAuthPage;
