import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/Auth_style/ForgotPassword.css";
import cmc_background from "../../assets/cmc-bg.png";
import logo from "../../assets/logocmc.png";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FcGoogle } from "react-icons/fc";
import axios from "axios";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [codeError, setCodeError] = useState("");
  const [newPasswordError, setNewPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [generalError, setGeneralError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [resendTimer, setResendTimer] = useState(60);
  const [resendAttempts, setResendAttempts] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const [touched, setTouched] = useState({
    email: false,
    code: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [showPassword, setShowPassword] = useState(false);

  // Validation functions
  const validateEmail = (emailValue) => {
    const gmailRegex = /^[^\s@]+@gmail\.com$/;
    if (!emailValue.trim()) {
      return "Email is required";
    }
    if (!gmailRegex.test(emailValue)) {
      return "Email must be a valid @gmail.com address";
    }
    return "";
  };

  const validatePassword = (passwordValue) => {
    if (!passwordValue) {
      return "Password is required";
    }
    if (passwordValue.length < 8) {
      return "Password must be at least 8 characters";
    }
    const hasLower = /[a-z]/.test(passwordValue);
    const hasUpper = /[A-Z]/.test(passwordValue);
    const hasNumber = /[0-9]/.test(passwordValue);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(
      passwordValue
    );

    if (!hasLower) {
      return "Password must contain at least one lowercase letter";
    }
    if (!hasUpper) {
      return "Password must contain at least one uppercase letter";
    }
    if (!hasNumber) {
      return "Password must contain at least one number";
    }
    if (!hasSpecial) {
      return "Password must contain at least one special character";
    }
    return "";
  };

  const validateConfirmPassword = (confirmValue) => {
    if (!confirmValue) {
      return "Confirm password is required";
    }
    if (confirmValue !== newPassword) {
      return "Passwords do not match";
    }
    return "";
  };

  // Handle changes
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (touched.email) setEmailError(validateEmail(e.target.value));
  };

  const handleCodeChange = (e) => {
    setCode(e.target.value);
    if (touched.code) setCodeError(""); // Clear error on change
  };

  const handleNewPasswordChange = (e) => {
    setNewPassword(e.target.value);
    if (touched.newPassword)
      setNewPasswordError(validatePassword(e.target.value));
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
    if (touched.confirmPassword)
      setConfirmPasswordError(validateConfirmPassword(e.target.value));
  };

  // Handle blurs
  const handleEmailBlur = () => {
    setTouched({ ...touched, email: true });
    setEmailError(validateEmail(email));
  };

  const handleCodeBlur = () => {
    setTouched({ ...touched, code: true });
    if (!code) setCodeError("Code is required");
  };

  const handleNewPasswordBlur = () => {
    setTouched({ ...touched, newPassword: true });
    setNewPasswordError(validatePassword(newPassword));
  };

  const handleConfirmPasswordBlur = () => {
    setTouched({ ...touched, confirmPassword: true });
    setConfirmPasswordError(validateConfirmPassword(confirmPassword));
  };

  // Send reset code
  const handleSendCode = async (isResend = false) => {
    setGeneralError("");
    setSuccessMessage("");
    const error = validateEmail(email);
    setEmailError(error);
    setTouched({ ...touched, email: true });

    if (error) return;

    setLoading(true);

    try {
      const response = await axios.post("/api/auth/forgot-password", { email });
      setSuccessMessage(
        response.data.message || "Reset code sent to your email."
      );
      setStep(2);
      setResendTimer(60 * Math.pow(2, resendAttempts)); // Double time each resend
      setCanResend(false);
      if (isResend) setResendAttempts(resendAttempts + 1);
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to send reset code.";
      setGeneralError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Verify code
  const handleVerifyCode = async () => {
    setGeneralError("");
    setSuccessMessage("");
    if (!code) {
      setCodeError("Code is required");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post("/api/auth/verify-reset-code", {
        email,
        code,
      });
      setSuccessMessage(response.data.message || "Code verified successfully.");
      setStep(3);
    } catch (error) {
      const msg = error.response?.data?.message || "Invalid code.";
      setCodeError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Reset password
  const handleResetPassword = async () => {
    setGeneralError("");
    setSuccessMessage("");
    const newPassErr = validatePassword(newPassword);
    const confirmErr = validateConfirmPassword(confirmPassword);
    setNewPasswordError(newPassErr);
    setConfirmPasswordError(confirmErr);
    setTouched({ ...touched, newPassword: true, confirmPassword: true });

    if (newPassErr || confirmErr) return;

    setLoading(true);

    try {
      const response = await axios.post("/api/auth/reset-password", {
        email,
        newPassword,
      });
      toast.success("Password reset successfully.");
      setSuccessMessage(
        response.data.message || "Password reset successfully."
      );
      setTimeout(() => navigate("/"), 3000);
    } catch (error) {
      setGeneralError(
        error.response?.data?.message || "Failed to reset password."
      );
      toast.error(generalError);
    } finally {
      setLoading(false);
    }
  };

  // Resend timer
  useEffect(() => {
    if (resendTimer > 0 && step === 2 && !canResend) {
      const interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else if (resendTimer === 0) {
      setCanResend(true);
    }
  }, [resendTimer, step]);

  // Handle resend
  const handleResend = () => {
    handleSendCode(true);
  };

  // Handle input focus to clear general error
  const handleInputFocus = () => {
    setGeneralError("");
  };

  return (
    <>
      <ToastContainer /* ... props as in Login */ />
      <div
        className="forgotpassword-wrapper"
        style={{ backgroundImage: `url(${cmc_background})` }}
      >
        <div className="forgotpassword-background-section"></div>
        <div className="forgotpassword-form-section">
          <div className="forgotpassword-form-container">
            <div className="forgotpassword-icon">
              <img
                src={logo}
                alt="CMC Logo"
                className="logocmc-forgotpassword"
              />
            </div>
            <h2 className="forgotpassword-form-title">Forgot Password</h2>
            <p className="forgotpassword-form-subtitle">
              Enter your email to reset your password.
            </p>

            <form onSubmit={(e) => e.preventDefault()}>
              {step === 1 && (
                <>
                  <div className="forgotpassword-form-group">
                    <label className="forgotpassword-form-label">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={handleEmailChange}
                      onBlur={handleEmailBlur}
                      onFocus={handleInputFocus}
                      className={`forgotpassword-form-input ${
                        touched.email && emailError ? "input-error" : ""
                      }`}
                      placeholder="Enter your @gmail.com email"
                    />
                    {touched.email && emailError && (
                      <span className="forgotpassword-error-text">
                        {emailError}
                      </span>
                    )}
                  </div>

                  {successMessage && (
                    <div className="forgotpassword-success-message">
                      {successMessage}
                    </div>
                  )}
                  {generalError && (
                    <div className="forgotpassword-error-message">
                      {generalError}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handleSendCode()}
                    className="forgotpassword-form-button"
                    disabled={loading || (touched.email && emailError)}
                  >
                    {loading ? "Sending..." : "Send Code"}
                  </button>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="forgotpassword-form-group">
                    <label className="forgotpassword-form-label">
                      Verification Code
                    </label>
                    <input
                      type="text"
                      value={code}
                      onChange={handleCodeChange}
                      onBlur={handleCodeBlur}
                      onFocus={handleInputFocus}
                      className={`forgotpassword-form-input ${
                        touched.code && codeError ? "input-error" : ""
                      }`}
                      placeholder="Enter 6-digit code"
                      maxLength={6}
                    />
                    {codeError && (
                      <span className="forgotpassword-error-text">
                        {codeError}
                      </span>
                    )}
                  </div>

                  {successMessage && (
                    <div className="forgotpassword-success-message">
                      {successMessage}
                    </div>
                  )}
                  {generalError && (
                    <div className="forgotpassword-error-message">
                      {generalError}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleVerifyCode}
                    className="forgotpassword-form-button"
                    disabled={loading || !code}
                  >
                    {loading ? "Verifying..." : "Verify Code"}
                  </button>

                  <div className="forgotpassword-resend">
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={!canResend || loading}
                      className="forgotpassword-resend-button"
                    >
                      Resend Code
                    </button>
                    {!canResend && resendTimer > 0 && (
                      <span>
                        {" "}
                        ({Math.floor(resendTimer / 60)}:
                        {(resendTimer % 60).toString().padStart(2, "0")})
                      </span>
                    )}
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <div className="forgotpassword-form-group">
                    <label className="forgotpassword-form-label">
                      New Password
                    </label>
                    <div className="password-wrapper">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={handleNewPasswordChange}
                        onBlur={handleNewPasswordBlur}
                        onFocus={handleInputFocus}
                        className={`forgotpassword-form-input ${
                          touched.newPassword && newPasswordError
                            ? "input-error"
                            : ""
                        }`}
                        placeholder="Enter new password"
                      />
                      {showPassword ? (
                        <AiOutlineEyeInvisible
                          onClick={() => setShowPassword(!showPassword)}
                          className="password-toggle-icon"
                        />
                      ) : (
                        <AiOutlineEye
                          onClick={() => setShowPassword(!showPassword)}
                          className="password-toggle-icon"
                        />
                      )}
                    </div>
                    {touched.newPassword && newPasswordError && (
                      <span className="forgotpassword-error-text">
                        {newPasswordError}
                      </span>
                    )}
                  </div>

                  <div className="forgotpassword-form-group">
                    <label className="forgotpassword-form-label">
                      Confirm New Password
                    </label>
                    <div className="password-wrapper">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={handleConfirmPasswordChange}
                        onBlur={handleConfirmPasswordBlur}
                        onFocus={handleInputFocus}
                        className={`forgotpassword-form-input ${
                          touched.confirmPassword && confirmPasswordError
                            ? "input-error"
                            : ""
                        }`}
                        placeholder="Confirm new password"
                      />
                      {showPassword ? (
                        <AiOutlineEyeInvisible
                          onClick={() => setShowPassword(!showPassword)}
                          className="password-toggle-icon"
                        />
                      ) : (
                        <AiOutlineEye
                          onClick={() => setShowPassword(!showPassword)}
                          className="password-toggle-icon"
                        />
                      )}
                    </div>
                    {touched.confirmPassword && confirmPasswordError && (
                      <span className="forgotpassword-error-text">
                        {confirmPasswordError}
                      </span>
                    )}
                  </div>

                  {successMessage && (
                    <div className="forgotpassword-success-message">
                      {successMessage}
                    </div>
                  )}
                  {generalError && (
                    <div className="forgotpassword-error-message">
                      {generalError}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleResetPassword}
                    className="forgotpassword-form-button"
                    disabled={
                      loading ||
                      (touched.newPassword && newPasswordError) ||
                      (touched.confirmPassword && confirmPasswordError)
                    }
                  >
                    {loading ? "Resetting..." : "Reset Password"}
                  </button>
                </>
              )}
            </form>

            <div className="forgotpassword-form-footer">
              <a
                href="/login"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/login");
                }}
              >
                Back to Login
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
