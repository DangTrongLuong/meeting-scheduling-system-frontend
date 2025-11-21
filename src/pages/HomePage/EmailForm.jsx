import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import logo from "../../assets/logocmc.png";
import "../../styles/Auth_style/EmailForm.css";

export default function EmailForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setError("");
    if (!email) {
      setError("Please enter your email");
      return;
    }

    try {
      const response = await axios.get("/api/auth/check-email", {
        params: { email },
      });

      if (response.data === true) {
        navigate("/redirecting");
      } else {
        setError("Email is incorrect or does not exist");
      }
    } catch (err) {
      setError("Something went wrong");
    }
  };

  return (
    <div className="email-form">
      {!loading ? (
        <div className="email-container-check">
          <div className="check-email">
            <div className="email-input-wrapper">
              <span className="email-icon">📧</span>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="email-input"
                required
              />
            </div>
            <button onClick={handleSubmit} className="submit-btn">
              Continue
            </button>
          </div>
          <div>{error && <p className="error-text">{error}</p>}</div>
        </div>
      ) : (
        <div className="loading-screen">
          <img className="loading-screen" src={logo}></img>
          <div className="progress-circle"></div>
          <p className="redirect-text">Redirecting to your organization...</p>
        </div>
      )}
    </div>
  );
}
