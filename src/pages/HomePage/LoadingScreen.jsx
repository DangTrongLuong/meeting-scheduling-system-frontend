import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/logocmc.png";

export default function LoadingScreen() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          navigate("/");
          return 100;
        }
        return prev + 1;
      });
    }, 15);

    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <div className="loading-container">
      <img className="loading-logo" src={logo} alt="Loading" />
      <div className="progress-wrapper">
        <div className="progress-circle"></div>
        <span className="progress-text">{progress}%</span>
      </div>

      <p className="redirect-text">Redirecting to your organization...</p>
    </div>
  );
}
