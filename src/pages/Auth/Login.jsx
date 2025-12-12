import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../../styles/Auth_style/LoginPage.css";
import cmc_background from "../../assets/cmc-bg.png";
import logo from "../../assets/logocmc.png";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FcGoogle } from "react-icons/fc";
import { login } from "../../context/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import axios from "axios";
import CryptoJS from "crypto-js";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const encryptedEmail = params.get("email");
  let decryptedEmail = "";

  if (encryptedEmail) {
    const secretKey = "mySuperSecretKey_2025!@#%&*ABCxyz123";
    const bytes = CryptoJS.AES.decrypt(encryptedEmail, secretKey);
    decryptedEmail = bytes.toString(CryptoJS.enc.Utf8);
  }

  const [email, setEmail] = useState(decryptedEmail || "");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [generalError, setGeneralError] = useState("");
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });
  const [showPassword, setShowPassword] = useState(false);

  // 2FA Authenticator
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [isSettingUp2FA, setIsSettingUp2FA] = useState(false);

  // First Login Flow
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [firstLoginStep, setFirstLoginStep] = useState(1); // 1: nhập code, 2: đổi password
  const [verificationCode, setVerificationCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changePassError, setChangePassError] = useState("");
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const error = params.get("error");
    const message = params.get("message");

    if (error === "google_login_failed" && message) {
      const decoded = decodeURIComponent(message);
      setGeneralError(decoded);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [location]);

  // Resend timer for first login code
  useEffect(() => {
    if (resendTimer > 0 && isFirstLogin && firstLoginStep === 1 && !canResend) {
      const interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else if (resendTimer === 0) {
      setCanResend(true);
    }
  }, [resendTimer, isFirstLogin, firstLoginStep, canResend]);

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

    if (!hasLower) return "Password must contain at least one lowercase letter";
    if (!hasUpper) return "Password must contain at least one uppercase letter";
    if (!hasNumber) return "Password must contain at least one number";
    if (!hasSpecial)
      return "Password must contain at least one special character";

    return "";
  };

  const handleEmailBlur = () => {
    setTouched({ ...touched, email: true });
    const error = validateEmail(email);
    setEmailError(error);
  };

  const handlePasswordBlur = () => {
    setTouched({ ...touched, password: true });
    const error = validatePassword(password);
    setPasswordError(error);
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    if (touched.email) {
      const error = validateEmail(value);
      setEmailError(error);
    }
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    if (touched.password) {
      const error = validatePassword(value);
      setPasswordError(error);
    }
  };

  const checkFirstLogin = async (email) => {
    try {
      const res = await axios.post("/api/auth/check-first-login", { email });
      return res.data.firstLogin === true;
    } catch (err) {
      return false;
    }
  };

  const sendFirstLoginCode = async () => {
    try {
      await axios.post("/api/auth/send-first-login-code", {
        email: email.trim(),
      });
      toast.success("Verification code sent! Please check your email.");
      setResendTimer(60);
      setCanResend(false);
    } catch (err) {
      toast.error("Failed to send code. Please try again.");
    }
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      setCodeError("Please enter a 6-digit code");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post("/api/auth/verify-first-login-code", {
        email: email.trim(),
        code: verificationCode,
      });

      if (res.data.status === "success") {
        toast.success("Code verified! Please set your new password.");
        setFirstLoginStep(2);
        setCodeError("");
      }
    } catch (err) {
      setCodeError(err.response?.data?.message || "Invalid or expired code");
      toast.error("Invalid or expired code");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = () => {
    sendFirstLoginCode();
  };

  const handleChangePassword = async () => {
    // Validate ngay khi nhấn nút
    if (!newPassword || newPassword.length < 8) {
      setChangePassError("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setChangePassError("Passwords do not match");
      return;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(newPassword)) {
      setChangePassError(
        "Password must contain uppercase, lowercase, number and special character"
      );
      return;
    }

    // Check nếu mật khẩu mới trùng với mật khẩu cũ
    if (newPassword === password) {
      setChangePassError(
        "New password cannot be the same as your current password"
      );
      return;
    }

    setLoading(true);
    setChangePassError(""); // Clear error trước khi gọi API

    try {
      const res = await axios.post("/api/auth/update-password-first-login", {
        email: email.trim(),
        newPassword,
      });

      if (res.data.success) {
        toast.success("Password changed successfully! Logging you in...");

        // Auto login với password mới
        const loginRes = await axios.post("/api/auth/login", {
          email: email.trim(),
          password: newPassword,
        });

        const result = loginRes.data.data;

        // Lưu đầy đủ thông tin vào localStorage
        localStorage.setItem("accessToken", result.accessToken);
        localStorage.setItem("jwtToken", result.accessToken);
        const threeDays = 3 * 24 * 60 * 60 * 1000;
        localStorage.setItem("tokenExpiresAt", Date.now() + threeDays);
        localStorage.setItem("userId", result.id);
        localStorage.setItem("userEmail", result.email);
        localStorage.setItem(
          "userName",
          result.name || result.email.split("@")[0] || "User"
        );
        localStorage.setItem("role", result.role || "USER");
        localStorage.setItem(
          "created_at",
          result.createdAt || new Date().toISOString().split("T")[0]
        );
        localStorage.setItem(
          "avatarUrl",
          result.avatarUrl || "/uploads/avatars/user-avatar.png"
        );
        localStorage.setItem("backgroundUrl", result.backgroundUrl || null);
        localStorage.setItem("authProvider", result.authProvider || "LOCAL");

        // Trigger storage event để các component khác cập nhật
        window.dispatchEvent(new Event("storage"));

        setTimeout(() => {
          navigate(
            result.role === "ADMIN" || result.role === "SUPERADMIN"
              ? "/admin/dashboard"
              : "/user/meeting-schedule",
            { replace: true }
          );
        }, 1200);
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || "Failed to update password";
      setChangePassError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError("");
    setLoading(true);

    // Lưu password để check sau này
    const currentPassword = password;

    const isFirst = await checkFirstLogin(email);
    if (isFirst) {
      setIsFirstLogin(true);
      setFirstLoginStep(1);
      // Lưu password cũ vào state để so sánh sau
      setPassword(currentPassword);
      await sendFirstLoginCode();
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post("/api/auth/login", {
        email: email.trim(),
        password,
      });

      const result = response.data.data;

      localStorage.setItem("accessToken", result.accessToken);
      localStorage.setItem("jwtToken", result.accessToken);
      const threeDays = 3 * 24 * 60 * 60 * 1000;
      localStorage.setItem("tokenExpiresAt", Date.now() + threeDays);
      localStorage.setItem("userId", result.id);
      localStorage.setItem("userEmail", result.email);
      localStorage.setItem("userName", result.name || "User");
      localStorage.setItem(
        "avatarUrl",
        result.avatarUrl || "/uploads/avatars/user-avatar.png"
      );
      localStorage.setItem("role", result.role || "USER");
      localStorage.setItem(
        "created_at",
        result.createdAt || new Date().toISOString().split("T")[0]
      );
      localStorage.setItem("backgroundUrl", result.backgroundUrl || null);
      localStorage.setItem("authProvider", "LOCAL");
      window.dispatchEvent(new Event("storage"));

      toast.success("Login successful!");
      setTimeout(() => {
        navigate(
          result.role === "ADMIN" || result.role === "SUPERADMIN"
            ? "/admin/dashboard"
            : "/user/meeting-schedule",
          { replace: true }
        );
      }, 1200);
    } catch (error) {
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;

        // 2FA REQUIRED
        if (
          status === 428 ||
          (data?.message && data.message.toLowerCase().includes("2fa"))
        ) {
          setShow2FAModal(true);
          try {
            const res = await axios.post("/api/auth/2fa/setup", null, {
              params: { email: email.trim() },
            });
            setQrCodeUrl(res.data.qrCode);
            setIsSettingUp2FA(true);
          } catch {
            setIsSettingUp2FA(false);
          }
          setLoading(false);
          return;
        }

        const msg = data?.message || "Login failed";
        if (msg.includes("not activated")) {
          setGeneralError("Account not activated. Please check your email!");
        } else if (msg.includes("Invalid email or password")) {
          setGeneralError("Invalid email or password");
        } else {
          setGeneralError(msg);
        }
      } else {
        setGeneralError("Cannot connect to server");
      }

      toast.error("Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleInputFocus = () => {
    setGeneralError("");
  };

  const handleRegisterClick = (e) => {
    e.preventDefault();
    navigate("/register");
  };

  const handleForgotPasswordClick = (e) => {
    e.preventDefault();
    navigate("/forgot_password");
  };

  const googleLogin = () => {
    window.location.href = `http://localhost:8080/api/auth/login/google`;
  };

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={1000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      <div className="login-wrapper">
        <div
          className="login-background-section"
          style={{ backgroundImage: `url(${cmc_background})` }}
        ></div>

        <div className="login-form-section">
          <div className="login-form-container">
            <div className="login-icon">
              <img src={logo} className="logocmc-login" />
              <div className="title-login">
                <h1 className="login-form-title">LOGIN</h1>
                <p className="login-form-subtitle">Meeting Scheduling System</p>
              </div>
            </div>

            {!isFirstLogin ? (
              <form className="login-form" onSubmit={handleSubmit}>
                <div className="login-form-group">
                  <label className="login-form-label">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    onBlur={handleEmailBlur}
                    onFocus={handleInputFocus}
                    className={`login-form-input ${
                      touched.email && emailError ? "input-error" : ""
                    }`}
                    placeholder="Enter your @gmail.com email"
                  />
                  {touched.email && emailError && (
                    <span className="login-error-text">{emailError}</span>
                  )}
                </div>

                <div
                  className="login-form-group"
                  style={{ position: "relative" }}
                >
                  <label className="login-form-label">Password</label>
                  <div className="password-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={handlePasswordChange}
                      onBlur={handlePasswordBlur}
                      onFocus={handleInputFocus}
                      className={`login-form-input ${
                        touched.password && passwordError ? "input-error" : ""
                      }`}
                      placeholder="Enter your password"
                    />
                    {password.length > 0 &&
                      (showPassword ? (
                        <AiOutlineEyeInvisible
                          onClick={() => setShowPassword(!showPassword)}
                          className="password-toggle-icon"
                        />
                      ) : (
                        <AiOutlineEye
                          onClick={() => setShowPassword(!showPassword)}
                          className="password-toggle-icon"
                        />
                      ))}
                  </div>
                  {touched.password && passwordError && (
                    <span className="login-error-text">{passwordError}</span>
                  )}
                </div>

                {generalError && (
                  <div className="login-error-message">{generalError}</div>
                )}

                <button
                  type="submit"
                  className="login-form-button"
                  disabled={
                    loading ||
                    (touched.email && emailError) ||
                    (touched.password && passwordError)
                  }
                >
                  {loading ? "Logging in..." : "Sign In"}
                </button>
              </form>
            ) : (
              <div className="login-form">
                {firstLoginStep === 1 ? (
                  <>
                    <h3 className="login-first-login-title">
                      First Time Login - Verification
                    </h3>
                    <p className="login-first-login-subtitle">
                      A verification code has been sent to your email. Please
                      check your inbox and enter the code below.
                    </p>

                    <div className="login-input-group">
                      <label>Verification Code</label>
                      <input
                        type="text"
                        maxLength="6"
                        value={verificationCode}
                        onChange={(e) => {
                          setVerificationCode(
                            e.target.value.replace(/\D/g, "")
                          );
                          setCodeError("");
                        }}
                        placeholder="Enter 6-digit code"
                        className={`login-form-input ${
                          codeError ? "input-error" : ""
                        }`}
                        style={{
                          textAlign: "center",
                          letterSpacing: "5px",
                          fontSize: "18px",
                        }}
                      />
                      {codeError && (
                        <span className="login-error-text">{codeError}</span>
                      )}
                    </div>

                    <button
                      type="button"
                      className="login-form-button"
                      disabled={loading || verificationCode.length !== 6}
                      onClick={handleVerifyCode}
                    >
                      {loading ? "Verifying..." : "Verify Code"}
                    </button>

                    <div
                      className="forgotpassword-resend"
                      style={{ textAlign: "center", marginTop: "15px" }}
                    >
                      <button
                        type="button"
                        onClick={handleResendCode}
                        disabled={!canResend || loading}
                        className="forgotpassword-resend-button"
                        style={{
                          background: "none",
                          border: "none",
                          color: canResend ? "#007bff" : "#999",
                          cursor: canResend ? "pointer" : "not-allowed",
                          textDecoration: "underline",
                        }}
                      >
                        Resend Code
                      </button>
                      {!canResend && resendTimer > 0 && (
                        <span style={{ marginLeft: "8px", color: "#666" }}>
                          ({Math.floor(resendTimer / 60)}:
                          {(resendTimer % 60).toString().padStart(2, "0")})
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      className="login-form-button"
                      style={{ background: "#888", marginTop: "10px" }}
                      onClick={() => {
                        setIsFirstLogin(false);
                        setVerificationCode("");
                        setCodeError("");
                      }}
                    >
                      Back to Login
                    </button>
                  </>
                ) : (
                  <>
                    <h3 className="login-first-login-title">
                      Set New Password
                    </h3>
                    <p className="login-first-login-subtitle">
                      Please create a strong password for your account.
                    </p>

                    <div className="login-input-group">
                      <label>New Password</label>
                      <div className="login-password-wrapper">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => {
                            setNewPassword(e.target.value);
                            setChangePassError("");
                          }}
                          placeholder="Enter new password"
                          required
                        />
                        <span
                          onClick={() => setShowPassword(!showPassword)}
                          className="login-toggle-password"
                        >
                          {showPassword ? (
                            <AiOutlineEyeInvisible />
                          ) : (
                            <AiOutlineEye />
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="login-input-group">
                      <label>Confirm New Password</label>
                      <div className="login-password-wrapper">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            setChangePassError("");
                          }}
                          placeholder="Confirm new password"
                          required
                        />
                        <span
                          onClick={() => setShowPassword(!showPassword)}
                          className="login-toggle-password"
                        >
                          {showPassword ? (
                            <AiOutlineEyeInvisible />
                          ) : (
                            <AiOutlineEye />
                          )}
                        </span>
                      </div>
                    </div>

                    {changePassError && (
                      <div className="login-first-login-error">
                        {changePassError}
                      </div>
                    )}

                    <button
                      type="button"
                      className="login-form-button"
                      disabled={loading}
                      onClick={handleChangePassword}
                    >
                      {loading ? "Processing..." : "Change Password & Continue"}
                    </button>

                    <button
                      type="button"
                      className="login-form-button"
                      style={{ background: "#888", marginTop: "10px" }}
                      onClick={() => {
                        setFirstLoginStep(1);
                        setNewPassword("");
                        setConfirmPassword("");
                        setChangePassError("");
                      }}
                      disabled={loading}
                    >
                      Back
                    </button>
                  </>
                )}
              </div>
            )}

            <div className="login-form-footer">
              Forgot password?{" "}
              <a href="/forgot_password" onClick={handleForgotPasswordClick}>
                Click here !
              </a>
            </div>
          </div>
        </div>
      </div>

      {show2FAModal && (
        <div
          className="modal-overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            className="modal-2fa"
            style={{
              background: "#fff",
              padding: "25px 30px",
              borderRadius: "12px",
              width: "400px",
              textAlign: "center",
              boxShadow: "0 6px 20px rgba(0,0,0,0.3)",
            }}
          >
            <h2>Two-Factor Authentication Required</h2>

            {isSettingUp2FA && qrCodeUrl && (
              <>
                <p>Scan with Google Authenticator:</p>
                <img
                  src={qrCodeUrl}
                  alt="2FA QR Code"
                  style={{ width: "220px", margin: "15px 0" }}
                />
                <p>
                  <strong>Or enter manually if you cannot scan</strong>
                </p>
              </>
            )}

            <input
              type="text"
              maxLength="6"
              placeholder="Enter 6-digit code"
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
              style={{
                width: "100%",
                padding: "10px 0",
                fontSize: "18px",
                textAlign: "center",
                borderRadius: "8px",
                border: "1px solid #ccc",
                margin: "15px 0",
                letterSpacing: "5px",
                outline: "none",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#007bff")}
              onBlur={(e) => (e.target.style.borderColor = "#ccc")}
            />

            <div
              style={{ display: "flex", gap: "10px", justifyContent: "center" }}
            >
              <button
                onClick={async () => {
                  if (totpCode.length !== 6) {
                    toast.error("Please enter a full 6-digit code");
                    return;
                  }

                  try {
                    if (isSettingUp2FA) {
                      await axios.post("/api/auth/2fa/verify-setup", null, {
                        params: { email: email.trim(), code: totpCode },
                      });
                    }

                    const res = await axios.post("/api/auth/verify-2fa", {
                      email: email.trim(),
                      code: totpCode,
                    });

                    const result = res.data.data;

                    localStorage.setItem("accessToken", result.accessToken);
                    localStorage.setItem("jwtToken", result.accessToken);
                    localStorage.setItem("userId", result.id);
                    localStorage.setItem("userEmail", result.email);
                    localStorage.setItem("userName", result.name || "User");

                    const threeDays = 3 * 24 * 60 * 60 * 1000;
                    localStorage.setItem(
                      "tokenExpiresAt",
                      Date.now() + threeDays
                    );

                    localStorage.setItem(
                      "avatarUrl",
                      result.avatarUrl || "/uploads/avatars/user-avatar.png"
                    );
                    localStorage.setItem("role", result.role || "USER");
                    localStorage.setItem(
                      "backgroundUrl",
                      result.backgroundUrl || null
                    );
                    localStorage.setItem(
                      "authProvider",
                      result.authProvider || "LOCAL"
                    );

                    toast.success("Login successful!");
                    setTimeout(() => {
                      navigate(
                        result.role === "ADMIN" || result.role === "SUPERADMIN"
                          ? "/admin/dashboard"
                          : "/user/meeting-schedule",
                        { replace: true }
                      );
                    }, 1200);
                  } catch (err) {
                    toast.error("Invalid or expired code");
                  }
                }}
                className="login-form-button"
                disabled={totpCode.length !== 6}
                style={{
                  padding: "8px 15px",
                  fontSize: "14px",
                  borderRadius: "6px",
                  cursor: totpCode.length === 6 ? "pointer" : "not-allowed",
                }}
              >
                Verify
              </button>

              <button
                onClick={() => {
                  setShow2FAModal(false);
                  setLoading(false);
                }}
                style={{
                  background: "#ccc",
                  padding: "8px 15px",
                  fontSize: "14px",
                  borderRadius: "6px",
                }}
                className="login-form-button"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
