import React, { useState, useEffect } from "react";
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Clock,
  MapPin,
  Users,
} from "lucide-react";
import "../../styles/Chat_Call/Call.css";
import axios from "axios";

export default function Call() {
  const [meetings, setMeetings] = useState([]);
  const [activeCall, setActiveCall] = useState(null);
  const [callState, setCallState] = useState("idle"); // idle, ringing, active, ended
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const currentUserId = localStorage.getItem("userId");
  const token = localStorage.getItem("accessToken");

  useEffect(() => {
    fetchTodayMeetings();
    const interval = setInterval(fetchTodayMeetings, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (callState === "active") {
      const timer = setInterval(() => {
        setCallDuration((d) => d + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [callState]);

  const fetchTodayMeetings = async () => {
    try {
      const response = await axios.get("/api/calls/today", {
        headers: {
          userId: currentUserId,
          Authorization: `Bearer ${token}`,
        },
      });

      const data = response.data;
      if (data.data) {
        setMeetings(data.data);
        checkActiveCall();
      }
    } catch (error) {
      console.error("Error fetching meetings:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkActiveCall = async () => {
    try {
      // Check all meetings for active calls
      for (const meeting of meetings) {
        try {
          const response = await axios.get(
            `/api/calls/active/${meeting.meetingId}`,
            {
              headers: {
                userId: currentUserId,
                Authorization: `Bearer ${token}`,
              },
            }
          );

          const data = response.data;
          if (data.data) {
            setActiveCall(data.data);
            setCallState("ringing");
            playRingtone();
            break;
          }
        } catch (err) {
          continue;
        }
      }
    } catch (error) {
      console.error("Error checking active calls:", error);
    }
  };

  const playRingtone = () => {
    const audio = new Audio(
      "data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA=="
    );
    audio.loop = true;
    audio.play().catch((e) => console.log("Could not play ringtone", e));
  };

  const initiateCall = async (meeting) => {
    try {
      const response = await axios.post(
        "/api/calls/initiate",
        { meetingId: meeting.meetingId }, // body
        {
          headers: {
            "Content-Type": "application/json",
            userId: currentUserId,
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = response.data;
      if (data.data) {
        setActiveCall(data.data);
        setCallState("ringing");
        playRingtone();
      }
    } catch (error) {
      console.error("Error initiating call:", error);
      alert("Failed to initiate call");
    }
  };

  const acceptCall = async () => {
    try {
      const response = await axios.patch(
        `/api/calls/${activeCall.callId}/accept`,
        {},
        {
          headers: {
            userId: currentUserId,
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        setCallState("active");
        setCallDuration(0);
      }
    } catch (error) {
      console.error("Error accepting call:", error);
    }
  };

  const declineCall = async () => {
    try {
      await axios.patch(
        `/api/calls/${activeCall.callId}/decline`,
        {},
        {
          headers: {
            userId: currentUserId,
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setActiveCall(null);
      setCallState("idle");
      setCallDuration(0);
    } catch (error) {
      console.error("Error declining call:", error);
    }
  };

  const endCall = async () => {
    try {
      await axios.patch(
        `/api/calls/${activeCall.callId}/end`,
        {},
        {
          headers: {
            userId: currentUserId,
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setActiveCall(null);
      setCallState("ended");
      setCallDuration(0);
      setTimeout(() => setCallState("idle"), 1500);
    } catch (error) {
      console.error("Error ending call:", error);
    }
  };

  const toggleMute = async () => {
    try {
      await axios.patch(
        `/api/calls/${activeCall.callId}/mute`,
        {},
        {
          headers: {
            userId: currentUserId,
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setIsMuted(!isMuted);
    } catch (error) {
      console.error("Error toggling mute:", error);
    }
  };

  const toggleVideo = async () => {
    try {
      await axios.patch(
        `/api/calls/${activeCall.callId}/video`,
        {},
        {
          headers: {
            userId: currentUserId,
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setIsVideoEnabled(!isVideoEnabled);
    } catch (error) {
      console.error("Error toggling video:", error);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const formatMeetingTime = (dateTime) => {
    const date = new Date(dateTime);
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (callState === "ringing" || callState === "active") {
    return (
      <div className={`call-view ${callState}`}>
        <div className="call-container">
          {/* Main Call UI */}
          <div className="call-content">
            <div className="remote-video">
              <div className="avatar-large">
                <img
                  src={
                    activeCall?.initiatorId
                      ? "https://via.placeholder.com/150"
                      : "https://via.placeholder.com/150"
                  }
                  alt="Caller"
                />
              </div>
              <div className="call-info">
                <h1>{activeCall?.meetingTitle}</h1>
                {callState === "ringing" && (
                  <p className="ringing">Đang gọi...</p>
                )}
                {callState === "active" && (
                  <p className="duration">{formatTime(callDuration)}</p>
                )}
              </div>
            </div>

            {/* Participants Info */}
            <div className="participants-info">
              <div className="participants-header">
                <Users size={16} />
                <span>{activeCall?.participants?.length || 0} thành viên</span>
              </div>
              <div className="participants-list">
                {activeCall?.participants?.map((p) => (
                  <div key={p.participantId} className="participant-item">
                    <img
                      src={p.userAvatar || "https://via.placeholder.com/32"}
                      alt={p.userName}
                      className="participant-avatar"
                    />
                    <div className="participant-info">
                      <span className="participant-name">{p.userName}</span>
                      <span
                        className={`participant-status ${p.status.toLowerCase()}`}
                      >
                        {p.status === "ACCEPTED"
                          ? "✓ Đã tham gia"
                          : p.status === "RINGING"
                          ? "📞 Đang gọi"
                          : p.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Call Controls */}
            <div className="call-controls">
              <button
                className={`control-button ${isMuted ? "active" : ""}`}
                onClick={toggleMute}
                title={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
              >
                {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
              </button>

              <button
                className={`control-button ${isVideoEnabled ? "" : "active"}`}
                onClick={toggleVideo}
                title={isVideoEnabled ? "Tắt video" : "Bật video"}
              >
                {isVideoEnabled ? <Video size={24} /> : <VideoOff size={24} />}
              </button>

              <button
                className="control-button end-call"
                onClick={endCall}
                title="Kết thúc cuộc gọi"
              >
                <PhoneOff size={24} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (callState === "ended") {
    return (
      <div className="call-ended-view">
        <div className="ended-container">
          <div className="ended-icon">✓</div>
          <h2>Cuộc gọi đã kết thúc</h2>
          <p>Thời lượng: {formatTime(callDuration)}</p>
          <button onClick={() => setCallState("idle")} className="back-button">
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  // Meetings List View
  return (
    <div className="calls-container">
      <div className="calls-header">
        <h1>Cuộc gọi hôm nay</h1>
        <p>{meetings.length} cuộc họp trong ngày</p>
      </div>

      {loading ? (
        <div className="loading-state">
          <p>Đang tải cuộc họp...</p>
        </div>
      ) : meetings.length === 0 ? (
        <div className="empty-state">
          <p>Không có cuộc họp nào hôm nay</p>
        </div>
      ) : (
        <div className="meetings-grid">
          {meetings.map((meeting) => (
            <div
              key={meeting.meetingId}
              className={`meeting-card ${
                meeting.isCallActive ? "call-active" : ""
              }`}
            >
              {meeting.isCallActive && (
                <div className="call-active-badge">Đang gọi</div>
              )}

              <div className="meeting-header">
                <h3>{meeting.title}</h3>
              </div>

              <div className="meeting-details">
                <div className="detail-item">
                  <Clock size={16} />
                  <span>{formatMeetingTime(meeting.startTime)}</span>
                </div>
                <div className="detail-item">
                  <MapPin size={16} />
                  <span>{meeting.roomName}</span>
                </div>
                <div className="detail-item">
                  <Users size={16} />
                  <span>{meeting.participantCount} thành viên</span>
                </div>
              </div>

              {meeting.description && (
                <p className="meeting-description">{meeting.description}</p>
              )}

              <button
                className={`call-button ${
                  meeting.canInitiateCall ? "active" : "disabled"
                }`}
                onClick={() => meeting.canInitiateCall && initiateCall(meeting)}
                disabled={!meeting.canInitiateCall}
                title={
                  meeting.canInitiateCall ? "Gọi bây giờ" : "Chưa đến lúc gọi"
                }
              >
                <Phone size={20} />
                {meeting.isCallActive ? "Tham gia cuộc gọi" : "Gọi ngay"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
