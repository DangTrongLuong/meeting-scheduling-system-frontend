import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import logo_cmc from "../../assets/logocmc.png";

export default function InviteAccept() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get("email");
  const meetingId = searchParams.get("mid");

  const [status, setStatus] = useState("loading");

  useEffect(() => {
    if (!email || !meetingId) {
      setStatus("error");
      return;
    }

    const acceptInvitation = async () => {
      try {
        await axios.patch("/api/meetings/participants/status", {
          email: email,
          meetingId: meetingId,
          status: "ACCEPTED",
        });
        setStatus("success");
      } catch (err) {
        console.error("Accept failed:", err);
        setStatus("error");
      }
    };

    acceptInvitation();
  }, [email, meetingId]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #ffffffff 0%rgba(249, 249, 249, 1)a2 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        width: "100vw",
        fontFamily: "'Segoe UI', sans-serif",
      }}
    >
      <div
        style={{
          background: "white",
          padding: "60px 80px",
          borderRadius: "20px",
          boxShadow: "0 25px 50px rgba(0,0,0,0.25)",
          textAlign: "center",
          maxWidth: "560px",
          width: "100%",
        }}
      >
        <img
          src={logo_cmc}
          alt="CMC Logo"
          style={{
            height: "90px",
            marginBottom: "32px",
            display: "block",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        />

        <h1
          style={{
            color: "#28a745",
            fontSize: "32px",
            marginBottom: "20px",
            fontWeight: "700",
          }}
        >
          Invitation Accepted!
        </h1>

        <p
          style={{
            fontSize: "18px",
            color: "#555",
            marginBottom: "40px",
            lineHeight: "1.6",
          }}
        >
          Thank you! The meeting has been successfully added to your calendar in
          MSS.
        </p>

        <button
          onClick={() => navigate("/")}
          style={{
            padding: "16px 48px",
            backgroundColor: "#28a745",
            color: "white",
            border: "none",
            borderRadius: "12px",
            fontSize: "18px",
            fontWeight: "600",
            cursor: "pointer",
            boxShadow: "0 4px 15px rgba(40,167,69,0.4)",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => (e.target.style.transform = "translateY(-3px)")}
          onMouseLeave={(e) => (e.target.style.transform = "translateY(0)")}
        >
          Go to Login
        </button>
      </div>
    </div>
  );
}
