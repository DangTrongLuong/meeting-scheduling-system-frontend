import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import logo_cmc from "../../assets/logocmc.png";

export default function InviteDecline() {
  const [searchParams] = useSearchParams();
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(false);
  const [meetingData, setMeetingData] = useState(null);

  const email = searchParams.get("email");
  const meetingId = searchParams.get("mid");
  const creatorEmail = searchParams.get("c");

  useEffect(() => {
    const fetchMeetingData = async () => {
      try {
        const accessToken = localStorage.getItem("accessToken");
        const userId = localStorage.getItem("userId");

        if (!accessToken || !userId || !meetingId) return;

        const { data: response } = await axios.get(
          `http://localhost:8080/api/meetings/${meetingId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              userId: userId,
            },
          }
        );

        setMeetingData(response.data);
      } catch (err) {
        console.error("Failed to fetch meeting data:", err);
      }
    };

    fetchMeetingData();
  }, [meetingId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) return;

    setSubmitting(true);
    setError(false);

    try {
      // 1. Update participant status
      try {
        await axios.patch("/api/meetings/participants/status", {
          email,
          meetingId: meetingId,
          status: "DECLINED",
        });
        console.log("Participant status updated successfully");
      } catch (statusError) {
        console.error("Failed to update participant status:", statusError);
        throw new Error("Failed to update meeting status. Please try again.");
      }

      // 2. Gửi email decline với thông tin meeting đầy đủ
      try {
        const webhookPayload = {
          declinedBy: email,
          creatorEmail: creatorEmail,
          meetingId: meetingId,
          reason: reason.trim(),
          // Thông tin meeting chi tiết
          meetingInfo: meetingData
            ? {
                title: meetingData.title,
                description: meetingData.description,
                startTime: meetingData.startTime,
                endTime: meetingData.endTime,
                roomName: meetingData.room.name,
                roomLocation: meetingData.room.location,
                creatorName: meetingData.creator.name,
              }
            : null,
        };

        await axios.post(
          "https://n8n.quanliduan-pms.site/webhook/send-email-decline",
          webhookPayload
        );
        console.log(" Email notification sent successfully");
      } catch (webhookError) {
        console.error(" Failed to send email notification:", webhookError);

        console.warn("Status updated but email notification failed");
      }

      setSubmitted(true);
    } catch (err) {
      console.error("Decline process failed:", err);
      setError(err.message || "Failed to decline meeting. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div
        style={{
          minHeight: "100vh",
          width: "100vw",
          background: "#f8f9fa",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          fontFamily: "'Segoe UI', sans-serif",
        }}
      >
        <div
          style={{
            background: "white",
            padding: "60px 80px",
            borderRadius: "20px",
            boxShadow: "0 25px 50px rgba(0,0,0,0.15)",
            textAlign: "center",
            maxWidth: "600px",
          }}
        >
          <img
            src={logo_cmc}
            alt="CMC Logo"
            style={{ height: "90px", marginBottom: "32px" }}
          />
          <h2
            style={{ color: "#dc3545", fontSize: "30px", marginBottom: "20px" }}
          >
            Response Submitted
          </h2>
          <p style={{ fontSize: "18px", color: "#555" }}>
            Thank you for your response. The meeting organizer has been
            notified.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        background: "linear-gradient(135deg, #f5f5f5ff 0%, #fdfdfdff 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
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
          maxWidth: "600px",
          width: "100%",
        }}
      >
        <img
          src={logo_cmc}
          alt="CMC Logo"
          style={{ height: "90px", marginBottom: "32px" }}
        />

        <h1
          style={{ color: "#dc3545", fontSize: "32px", marginBottom: "20px" }}
        >
          Decline Meeting Invitation
        </h1>

        <p
          style={{
            fontSize: "18px",
            color: "#555",
            marginBottom: "32px",
            lineHeight: "1.6",
          }}
        >
          We’re sorry you can’t attend. Please let the organizer know your
          reason:
        </p>

        <form onSubmit={handleSubmit}>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter your reason for declining (required)"
            required
            rows="6"
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: "12px",
              border: "2px solid #ddd",
              fontSize: "16px",
              fontFamily: "inherit",
              resize: "vertical",
            }}
          />

          <button
            type="submit"
            disabled={submitting || !reason.trim()}
            style={{
              marginTop: "32px",
              padding: "16px 48px",
              backgroundColor: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "12px",
              fontSize: "18px",
              fontWeight: "600",
              cursor: "pointer",
              width: "100%",
              boxShadow: "0 4px 15px rgba(220,53,69,0.4)",
            }}
          >
            {submitting ? "Submitting..." : "Submit & Decline"}
          </button>
        </form>
      </div>
    </div>
  );
}
