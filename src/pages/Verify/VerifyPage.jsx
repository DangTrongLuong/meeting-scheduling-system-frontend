// src/pages/VerifyPage.jsx
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import "../../styles/VerifyPage.css";

export default function VerifyPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const email = searchParams.get("email");
    const token = searchParams.get("token");

    if (!email || !token) {
      setStatus("error");
      setMessage("Invalid verification link.");
      return;
    }

    axios
      .post("/api/auth/verify", null, { params: { email, token } })
      .then((res) => {
        if (res.data.success) {
          setStatus("success");
          setMessage(res.data.message);
        } else {
          setStatus("error");
          setMessage(res.data.message || "Verification failed.");
        }
      })
      .catch((err) => {
        setStatus("error");
        setMessage(
          err.response?.data?.message ||
            "Verification failed. Please try again."
        );
      });
  }, [searchParams]);

  return (
    <div className="verify-page-container">
      <div className="verify-card">
        <div className="verify-logo">
          <img src="/logocmc.png" alt="Company Logo" />
        </div>

        <div className="verify-icon">
          {status === "loading" && (
            <Loader2
              size={64}
              className="animate-spin"
              style={{ color: "#2f53f6ff" }}
            />
          )}
          {status === "success" && (
            <CheckCircle size={64} style={{ color: "#10b981" }} />
          )}
          {status === "error" && (
            <XCircle size={64} style={{ color: "#ef4444" }} />
          )}
        </div>

        <h1 className="verify-title">
          {status === "loading" && "Verifying Your Account"}
          {status === "success" && "Account Verified!"}
          {status === "error" && "Verification Failed"}
        </h1>

        <p className="verify-message">{message}</p>

        {status === "success" && (
          <button onClick={() => navigate("/")} className="verify-btn-primary">
            Go to Login
          </button>
        )}

        {status === "error" && (
          <div>
            <button
              onClick={() => navigate("/")}
              className="verify-btn-secondary"
            >
              Back to Login
            </button>
            <button
              onClick={() => window.location.reload()}
              className="verify-btn-danger"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
