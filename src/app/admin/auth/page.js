/**
 * =========================================================================
 * ADMIN AUTHENTICATION PAGE - Restaurant Login & Signup
 * =========================================================================
 * 
 * PAGE FLOW:
 * 
 * LOGIN FLOW:
 * 1. Admin enters 6-character Restaurant ID (restoId)
 * 2. System verifies restoId exists in database
 * 3. If valid, shows restaurant name and credentials form
 * 4. Admin enters phone and password
 * 5. On success, saves session and redirects to dashboard
 * 
 * SIGNUP FLOW:
 * 1. Admin fills registration form (name, phone, location, password)
 * 2. System creates new restaurant record
 * 3. Returns unique 6-character restoId
 * 4. Shows success modal with restoId to save
 * 5. Admin can proceed to login
 * 
 * STATE MANAGEMENT:
 * - authMode: "login" or "signup" mode toggle
 * - loginStep: Current step in login flow (1=restoId, 2=credentials)
 * - restoId/phone/password: Login form fields
 * - signupData: Signup form object with all fields
 * - loading: Form submission loading state
 * - error: Error message to display
 * - showSuccess: Success modal visibility
 * - successData: Data to display in success modal
 * 
 * FEATURES:
 * - Two-step login with restoId verification
 * - Restaurant name display after verification
 * - Password visibility toggle
 * - Form validation with error messages
 * - Success modal with copy-to-clipboard
 * - Session persistence via AdminSessionContext
 * 
 * =========================================================================
 */

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminSession } from "@/src/contexts/AdminSessionContext";
import {
  verifyRestoIdAction,
  loginRestaurantAction,
  signupRestaurantAction,
} from "@/src/actions/adminAuthActions";
import "./auth.css";

// =========================================================================
// MAIN COMPONENT
// =========================================================================

function AdminAuthPage() {
  const router = useRouter();
  const { setAdminSession } = useAdminSession();

  // -----------------------------------------------------------------------
  // STATE VARIABLES
  // -----------------------------------------------------------------------

  /** Current auth mode: "login" or "signup" */
  const [authMode, setAuthMode] = useState("login");

  /** Login flow step: 1 = restoId input, 2 = credentials input */
  const [loginStep, setLoginStep] = useState(1);
  
  /** Restaurant ID for login verification */
  const [restoId, setRestoId] = useState("");
  
  /** Verified restaurant name (after step 1) */
  const [restaurantName, setRestaurantName] = useState("");
  
  /** Phone number for login */
  const [phone, setPhone] = useState("");
  
  /** Password for login */
  const [password, setPassword] = useState("");

  /** Signup form data object */
  const [signupData, setSignupData] = useState({
    restaurantName: "",
    phone: "",
    state: "",
    city: "",
    password: "",
    confirmPassword: "",
  });

  /** Form submission loading state */
  const [loading, setLoading] = useState(false);
  
  /** Error message to display */
  const [error, setError] = useState("");
  
  /** Password visibility toggle */
  const [showPassword, setShowPassword] = useState(false);
  
  /** Success modal visibility */
  const [showSuccess, setShowSuccess] = useState(false);
  
  /** Data for success modal display */
  const [successData, setSuccessData] = useState(null);

  // -----------------------------------------------------------------------
  // LOGIN HANDLERS
  // -----------------------------------------------------------------------

  /**
   * Handles restoId verification (Login Step 1)
   * Verifies the restaurant exists and shows credentials form
   */
  const handleRestoIdSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await verifyRestoIdAction(restoId);

      if (result.success) {
        setRestaurantName(result.restaurantName);
        setLoginStep(2);
        setError("");
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Verification failed. Please try again.");
    }

    setLoading(false);
  };

  /**
   * Handles login submission (Login Step 2)
   * Validates credentials and creates session on success
   */
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!phone || !password) {
      setError("Please fill in all fields.");
      setLoading(false);
      return;
    }

    if (phone.length !== 10) {
      setError("Please enter a valid 10-digit phone number.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    try {
      const result = await loginRestaurantAction(restoId, phone, password);

      if (result.success) {
        // Save to context and localStorage
        // Use restoId (6-char code) for consistency with order queries
        setAdminSession(phone, result.restaurant.restoId);

        setSuccessData({
          type: "login",
          restoId: result.restaurant.restoId,
          restaurantName: result.restaurant.restaurantName,
          phone: phone,
        });
        setShowSuccess(true);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Login failed. Please try again.");
    }

    setLoading(false);
  };

  // -----------------------------------------------------------------------
  // SIGNUP HANDLERS
  // -----------------------------------------------------------------------

  /**
   * Handles signup form submission
   * Creates new restaurant and shows success with restoId
   */
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { restaurantName, phone, state, city, password, confirmPassword } = signupData;

    // Validation
    if (!restaurantName || !phone || !state || !city || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      setLoading(false);
      return;
    }

    if (phone.length !== 10) {
      setError("Please enter a valid 10-digit phone number.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const result = await signupRestaurantAction({
        restaurantName,
        phone,
        state,
        city,
        password,
      });

      if (result.success) {
        setSuccessData({
          type: "signup",
          restoId: result.restoId,
          restaurantName: restaurantName,
          phone: phone,
        });
        setShowSuccess(true);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Registration failed. Please try again.");
    }

    setLoading(false);
  };

  // Handle input change for signup
  const handleSignupChange = (field, value) => {
    setSignupData((prev) => ({ ...prev, [field]: value }));
  };

  // Go back to step 1 in login
  const handleBack = () => {
    setLoginStep(1);
    setPhone("");
    setPassword("");
    setError("");
  };

  // Switch between login and signup
  const switchAuthMode = (mode) => {
    setAuthMode(mode);
    setError("");
    setLoginStep(1);
    setRestoId("");
    setPhone("");
    setPassword("");
    setSignupData({
      restaurantName: "",
      phone: "",
      state: "",
      city: "",
      password: "",
      confirmPassword: "",
    });
  };

  // Handle success continue
  const handleSuccessContinue = () => {
    setShowSuccess(false);
    if (successData?.type === "login") {
      router.push("/admin");
    } else {
      // For signup, switch to login mode with the new restoId
      setAuthMode("login");
      setRestoId(successData?.restoId || "");
      setLoginStep(1);
    }
  };

  return (
    <div className="auth-page">
      {/* Success Modal */}
      {showSuccess && (
        <div className="auth-modal-overlay">
          <div className="auth-modal">
            <div className="auth-modal-icon success">
              <i className="fa fa-check"></i>
            </div>
            <h3 className="auth-modal-title">
              {successData?.type === "login" ? "Login Successful!" : "Registration Successful!"}
            </h3>
            <p className="auth-modal-text">
              {successData?.type === "login"
                ? "Welcome back! You have successfully logged in."
                : "Your restaurant has been registered successfully!"}
            </p>
            <div className="auth-modal-details">
              <div className="auth-modal-detail-item">
                <i className="fa fa-key"></i>
                <span>Restaurant ID: <strong>{successData?.restoId}</strong></span>
              </div>
              <div className="auth-modal-detail-item">
                <i className="fa fa-building"></i>
                <span>Name: <strong>{successData?.restaurantName}</strong></span>
              </div>
              <div className="auth-modal-detail-item">
                <i className="fa fa-phone"></i>
                <span>Phone: <strong>{successData?.phone}</strong></span>
              </div>
            </div>
            {successData?.type === "signup" && (
              <div className="auth-modal-warning">
                <i className="fa fa-exclamation-triangle"></i>
                <span>Save your Restaurant ID! You'll need it to login.</span>
              </div>
            )}
            <button 
              className="auth-btn auth-btn-primary" 
              onClick={handleSuccessContinue}
            >
              <i className="fa fa-arrow-right"></i>
              <span>{successData?.type === "login" ? "Continue to Dashboard" : "Go to Login"}</span>
            </button>
          </div>
        </div>
      )}

      <div className="auth-container">
        {/* Auth Mode Tabs */}
        <div className="auth-tabs">
          <button
            className={`auth-tab ${authMode === "login" ? "active" : ""}`}
            onClick={() => switchAuthMode("login")}
          >
            <i className="fa fa-sign-in"></i> Login
          </button>
          <button
            className={`auth-tab ${authMode === "signup" ? "active" : ""}`}
            onClick={() => switchAuthMode("signup")}
          >
            <i className="fa fa-user-plus"></i> Sign Up
          </button>
        </div>

        {/* LOGIN FLOW */}
        {authMode === "login" && (
          <>
            {/* Step 1: Restaurant ID Verification */}
            {loginStep === 1 && (
              <div className="auth-card">
                <div className="auth-logo">
                  <img src="/img/logo/logo.png" alt="Logo" />
                </div>

                <h2 className="auth-title">Restaurant Verification</h2>
                <p className="auth-subtitle">Enter your Restaurant ID to continue</p>

                <form onSubmit={handleRestoIdSubmit}>
                  <div className="auth-input-group">
                    <span className="auth-input-icon">
                      <i className="fa fa-key"></i>
                    </span>
                    <input
                      type="text"
                      className="auth-input"
                      placeholder="Enter Restaurant ID (e.g., ABC123)"
                      value={restoId}
                      onChange={(e) => setRestoId(e.target.value.toUpperCase())}
                      maxLength={6}
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
                    <a href="#" onClick={(e) => { e.preventDefault(); switchAuthMode("signup"); }}>
                      Sign Up Now
                    </a>
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Phone & Password Login */}
            {loginStep === 2 && (
              <div className="auth-card">
                <div className="auth-logo">
                  <img src="/img/logo/logo.png" alt="Logo" />
                </div>

                <div className="auth-verified-badge">
                  <i className="fa fa-check-circle"></i>
                  <span>Restaurant: <strong>{restaurantName}</strong> ({restoId.toUpperCase()})</span>
                </div>

                <h2 className="auth-title">Admin Login</h2>
                <p className="auth-subtitle">Enter your credentials to access the dashboard</p>

                <form onSubmit={handleLoginSubmit}>
                  <div className="auth-input-group">
                    <span className="auth-input-icon">
                      <i className="fa fa-phone"></i>
                    </span>
                    <input
                      type="tel"
                      className="auth-input"
                      placeholder="Phone Number (10 digits)"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      required
                    />
                  </div>

                  <div className="auth-input-group">
                    <span className="auth-input-icon">
                      <i className="fa fa-lock"></i>
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      className="auth-input"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="auth-password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <i className={`fa ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                    </button>
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
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <i className="fa fa-spinner fa-spin"></i>
                        <span>Signing In...</span>
                      </>
                    ) : (
                      <>
                        <i className="fa fa-sign-in"></i>
                        <span>Login to Dashboard</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    className="auth-btn auth-btn-secondary"
                    onClick={handleBack}
                  >
                    <i className="fa fa-arrow-left"></i>
                    <span>Change Restaurant ID</span>
                  </button>
                </form>
              </div>
            )}
          </>
        )}

        {/* SIGNUP FLOW */}
        {authMode === "signup" && (
          <div className="auth-card">
            <div className="auth-logo">
              <img src="/img/logo/logo.png" alt="Logo" />
            </div>

            <h2 className="auth-title">Register Restaurant</h2>
            <p className="auth-subtitle">Create your restaurant account</p>

            <form onSubmit={handleSignupSubmit}>
              <div className="auth-input-group">
                <span className="auth-input-icon">
                  <i className="fa fa-building"></i>
                </span>
                <input
                  type="text"
                  className="auth-input"
                  placeholder="Restaurant Name"
                  value={signupData.restaurantName}
                  onChange={(e) => handleSignupChange("restaurantName", e.target.value)}
                  required
                />
              </div>

              <div className="auth-input-group">
                <span className="auth-input-icon">
                  <i className="fa fa-phone"></i>
                </span>
                <input
                  type="tel"
                  className="auth-input"
                  placeholder="Phone Number (10 digits)"
                  value={signupData.phone}
                  onChange={(e) => handleSignupChange("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                  required
                />
              </div>

              <div className="auth-input-row">
                <div className="auth-input-group">
                  <span className="auth-input-icon">
                    <i className="fa fa-map-marker"></i>
                  </span>
                  <input
                    type="text"
                    className="auth-input"
                    placeholder="State"
                    value={signupData.state}
                    onChange={(e) => handleSignupChange("state", e.target.value)}
                    required
                  />
                </div>
                <div className="auth-input-group">
                  <span className="auth-input-icon">
                    <i className="fa fa-map"></i>
                  </span>
                  <input
                    type="text"
                    className="auth-input"
                    placeholder="City"
                    value={signupData.city}
                    onChange={(e) => handleSignupChange("city", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="auth-input-group">
                <span className="auth-input-icon">
                  <i className="fa fa-lock"></i>
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  className="auth-input"
                  placeholder="Password (min 6 characters)"
                  value={signupData.password}
                  onChange={(e) => handleSignupChange("password", e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <i className={`fa ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                </button>
              </div>

              <div className="auth-input-group">
                <span className="auth-input-icon">
                  <i className="fa fa-lock"></i>
                </span>
                <input
                  type="password"
                  className="auth-input"
                  placeholder="Confirm Password"
                  value={signupData.confirmPassword}
                  onChange={(e) => handleSignupChange("confirmPassword", e.target.value)}
                  required
                />
              </div>

              {error && (
                <div className="auth-error">
                  <i className="fa fa-exclamation-circle"></i>
                  <span>{error}</span>
                </div>
              )}

              <div className="auth-info-box">
                <i className="fa fa-info-circle"></i>
                <span>A unique Restaurant ID will be generated for you upon registration.</span>
              </div>

              <button
                type="submit"
                className="auth-btn auth-btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <i className="fa fa-spinner fa-spin"></i>
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <i className="fa fa-user-plus"></i>
                    <span>Create Restaurant Account</span>
                  </>
                )}
              </button>
            </form>

            <div className="auth-footer">
              <p>
                Already have an account?{" "}
                <a href="#" onClick={(e) => { e.preventDefault(); switchAuthMode("login"); }}>
                  Login Here
                </a>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminAuthPage;
