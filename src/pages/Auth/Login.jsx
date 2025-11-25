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

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || "");
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

  // Handle blur events
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

  // Handle input changes
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError("");
    setLoading(true);
    setShow2FAModal(false);
    setQrCodeUrl("");
    setTotpCode("");
    setIsSettingUp2FA(false);

    try {
      const response = await axios.post("/api/auth/login", {
        email: email.trim(),
        password,
      });

      const result = response.data.data;

      localStorage.setItem("accessToken", result.accessToken);
      localStorage.setItem("jwtToken", result.accessToken);
      localStorage.setItem(
        "tokenExpiresAt",
        Date.now() + result.expiresIn * 1000
      );
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
          result.role === "ADMIN"
            ? "/admin/dashboard"
            : "/user/meeting-schedule",
          { replace: true }
        );
      }, 1200);
    } catch (error) {
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;

        // 2FA REQUIRED → hiện modal
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

        // Các lỗi khác
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

            <div className="login-google">
              <button className="btn btn-login-gg" onClick={googleLogin}>
                <FcGoogle size={20} />
                Sign in with Google
              </button>
            </div>

            <div className="device-login">
              <span className="device-login-text">
                or sign in with your account
              </span>
            </div>

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

            <div className="login-form-footer">
              Forgot password?{" "}
              <a href="/forgot_password" onClick={handleForgotPasswordClick}>
                Click here !
              </a>
            </div>
            <div className="login-form-footer">
              Don't have an account?{" "}
              <a href="/register" onClick={handleRegisterClick}>
                Register now!
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
                    localStorage.setItem(
                      "tokenExpiresAt",
                      Date.now() + result.expiresIn * 1000
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
                        result.role === "ADMIN"
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
