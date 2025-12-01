import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "../../assets/logocmc.png";
import CryptoJS from "crypto-js";

export default function LoadingScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);

          // const secretKey = import.meta.env.VITE_SECRET_KEY;
          const secretKey = "mySuperSecretKey_2025!@#%&*ABCxyz123";
          const email = location.state?.email || "";
          const encryptedEmail = CryptoJS.AES.encrypt(
            email,
            secretKey
          ).toString();

          navigate(`/login?email=${encodeURIComponent(encryptedEmail)}`);
          return 100;
        }
        return prev + 5;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [navigate, location.state]);

  return (
    <div className="loading-container">
      <img className="loading-logo" src={logo} alt="Loading" />
      <div className="progress-wrapper">
        <div className="outer-circle"></div>
        <div className="inner-circle"></div>
        <span className="progress-text">{progress}%</span>
      </div>
      <p className="redirect-text">Redirecting to your organization...</p>
    </div>
  );
}
