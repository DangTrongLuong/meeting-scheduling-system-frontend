import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/Auth_style/Register.css";
import cmc_background from "../../assets/cmc-bg.png";
import logo from "../../assets/logocmc.png";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FcGoogle } from "react-icons/fc";
import { register } from "../../context/AuthContext";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [generalError, setGeneralError] = useState("");
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
    confirmPassword: false,
  });

  // Validation functions
  const validateName = (nameValue) => {
    if (!nameValue.trim()) {
      return "Username is required";
    }
    if (nameValue.trim().length < 2) {
      return "Username must be at least 2 characters";
    }
    if (nameValue.trim().length > 100) {
      return "Username must not exceed 100 characters";
    }
    return "";
  };

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

  const validateConfirmPassword = (confirmPasswordValue) => {
    if (!confirmPasswordValue) {
      return "Please confirm your password";
    }
    if (confirmPasswordValue !== password) {
      return "Passwords do not match";
    }
    return "";
  };

  // Handle blur events
  const handleNameBlur = () => {
    setTouched({ ...touched, name: true });
    const error = validateName(name);
    setNameError(error);
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

  const handleConfirmPasswordBlur = () => {
    setTouched({ ...touched, confirmPassword: true });
    const error = validateConfirmPassword(confirmPassword);
    setConfirmPasswordError(error);
  };

  // Handle input changes
  const handleNameChange = (e) => {
    const value = e.target.value;
    setName(value);
    if (touched.name) {
      const error = validateName(value);
      setNameError(error);
    }
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
    // Re-validate confirm password if it's been touched
    if (touched.confirmPassword && confirmPassword) {
      const confirmError =
        confirmPassword !== value ? "Passwords do not match" : "";
      setConfirmPasswordError(confirmError);
    }
  };

  const handleConfirmPasswordChange = (e) => {
    const value = e.target.value;
    setConfirmPassword(value);
    if (touched.confirmPassword) {
      const error = validateConfirmPassword(value);
      setConfirmPasswordError(error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError("");

    // Validate all fields
    const nameError = validateName(name);
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    const confirmPasswordError = validateConfirmPassword(confirmPassword);

    setNameError(nameError);
    setEmailError(emailError);
    setPasswordError(passwordError);
    setConfirmPasswordError(confirmPasswordError);
    setTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    if (nameError || emailError || passwordError || confirmPasswordError) {
      return;
    }

    setLoading(true);

    try {
      await register(name.trim(), email.trim(), password);
      toast.success("Registration successful!", {
        autoClose: 1500,
        onClose: () => {
          navigate("/");
        },
      });
    } catch (error) {
      const errorMsg =
        error.message || "Registration failed. Please try again.";
      setGeneralError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleInputFocus = () => {
    setGeneralError("");
  };

  const handleLoginClick = (e) => {
    e.preventDefault();
    navigate("/");
  };

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={1500}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      <div className="register-wrapper">
        <div
          className="register-background-section"
          style={{ backgroundImage: `url(${cmc_background})` }}
        ></div>

        <div className="register-form-section">
          <div className="register-form-container">
            <div className="register-icon">
              <img src={logo} className="logocmc-register" alt="CMC Logo" />
              <div className="title-register">
                <h1 className="register-form-title">REGISTER</h1>
                <p className="register-form-subtitle">
                  Meeting Scheduling System
                </p>
              </div>
            </div>

            <div className="register-google">
              <button className="btn btn-register-gg">
                <FcGoogle size={20} />
                Sign in with Google
              </button>
            </div>

            <div className="device-register">
              <span className="device-register-text">
                or sign up with your account
              </span>
            </div>

            <form className="register-form" onSubmit={handleSubmit}>
              <div className="register-form-group">
                <label className="register-form-label">Username</label>
                <input
                  type="text"
                  value={name}
                  onChange={handleNameChange}
                  onBlur={handleNameBlur}
                  onFocus={handleInputFocus}
                  className={`register-form-input ${
                    touched.name && nameError ? "input-error" : ""
                  }`}
                  placeholder="Enter your username"
                />
                {touched.name && nameError && (
                  <span className="register-error-text">{nameError}</span>
                )}
              </div>

              <div className="register-form-group">
                <label className="register-form-label">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  onBlur={handleEmailBlur}
                  onFocus={handleInputFocus}
                  className={`register-form-input ${
                    touched.email && emailError ? "input-error" : ""
                  }`}
                  placeholder="Enter your @gmail.com email"
                />
                {touched.email && emailError && (
                  <span className="register-error-text">{emailError}</span>
                )}
              </div>

              <div className="register-form-group">
                <label className="register-form-label">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={handlePasswordChange}
                  onBlur={handlePasswordBlur}
                  onFocus={handleInputFocus}
                  className={`register-form-input ${
                    touched.password && passwordError ? "input-error" : ""
                  }`}
                  placeholder="Enter your password"
                />
                {touched.password && passwordError && (
                  <span className="register-error-text">{passwordError}</span>
                )}
              </div>

              <div className="register-form-group">
                <label className="register-form-label">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  onBlur={handleConfirmPasswordBlur}
                  onFocus={handleInputFocus}
                  className={`register-form-input ${
                    touched.confirmPassword && confirmPasswordError
                      ? "input-error"
                      : ""
                  }`}
                  placeholder="Confirm your password"
                />
                {touched.confirmPassword && confirmPasswordError && (
                  <span className="register-error-text">
                    {confirmPasswordError}
                  </span>
                )}
              </div>

              {generalError && (
                <div className="register-error-message">{generalError}</div>
              )}

              <button
                type="submit"
                className="register-form-button"
                disabled={
                  loading ||
                  (touched.name && nameError) ||
                  (touched.email && emailError) ||
                  (touched.password && passwordError) ||
                  (touched.confirmPassword && confirmPasswordError)
                }
              >
                {loading ? "Creating account..." : "Sign Up"}
              </button>
            </form>

            <div className="register-form-footer">
              Already have an account?{" "}
              <a href="/" onClick={handleLoginClick}>
                Login here!
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
