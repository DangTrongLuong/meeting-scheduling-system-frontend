import React, { useState } from "react";
import "../../styles/LoginPage.css";
import cmc_background from "../../assets/cmc-bg.png";
import logo from "../../assets/logocmc.png";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FcGoogle } from "react-icons/fc";
import { login } from "../../context/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [generalError, setGeneralError] = useState("");
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });

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

    // Validate both fields
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    setEmailError(emailError);
    setPasswordError(passwordError);
    setTouched({ email: true, password: true });

    if (emailError || passwordError) {
      return;
    }

    setLoading(true);

    try {
      const result = await login(email.trim(), password);
      toast.success("Login successfully!", {
        autoClose: 1000,
        onClose: () => {
          window.location.href = "/dashboard";
        },
      });
    } catch (error) {
      const errorMsg =
        error.message || "Invalid account or password. Please try again.";
      setGeneralError("Invalid account or password. Please try again.");
      toast.error("Invalid account or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputFocus = () => {
    setGeneralError("");
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
              <button className="btn btn-login-gg">
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

              <div className="login-form-group">
                <label className="login-form-label">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={handlePasswordChange}
                  onBlur={handlePasswordBlur}
                  onFocus={handleInputFocus}
                  className={`login-form-input ${
                    touched.password && passwordError ? "input-error" : ""
                  }`}
                  placeholder="Enter your password"
                />
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
              Forgot password? <a href="#support">Clich here !</a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
