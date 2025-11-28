import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../../../styles/MeetingManagement/DetailMeetingManagement.css";
import NavBar from "../../../components/NavBar";
import SideBarAdmin from "../../../components/SideBarAdmin";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  User,
  Users,
  Package,
  CheckCircle,
  XCircle,
  FileText,
} from "lucide-react";
import axios from "axios";

const DetailMeetingManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenuItem, setActiveMenuItem] = useState("meetting-management");
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  useEffect(() => {
    // Check if meeting data was passed via navigation state
    if (location.state?.meeting) {
      setMeeting(location.state.meeting);
      setLoading(false);
    } else {
      // Otherwise fetch from API
      fetchMeetingDetail();
    }
  }, [id]);

  const fetchMeetingDetail = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");
      const res = await axios.get(`/api/meetings/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMeeting(res.data.data);
    } catch (error) {
      console.error("Error fetching meeting detail:", error);
      toast.error("Failed to load meeting details");
      navigate("/admin/meetingManagement");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      await axios.patch(
        `/api/meetings/${id}/approve`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Meeting approved successfully!");
      setTimeout(() => {
        navigate("/admin/meetingManagement");
      }, 1500);
    } catch (error) {
      console.error("Error approving meeting:", error);
      toast.error(
        error.response?.data?.message || "Failed to approve meeting!"
      );
    } finally {
      setShowConfirmModal(false);
      setConfirmAction(null);
    }
  };

  const handleReject = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      await axios.patch(
        `/api/meetings/${id}/reject`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.error("Meeting rejected!");
      setTimeout(() => {
        navigate("/admin/meetingManagement");
      }, 1500);
    } catch (error) {
      console.error("Error rejecting meeting:", error);
      toast.error(error.response?.data?.message || "Failed to reject meeting!");
    } finally {
      setShowConfirmModal(false);
      setConfirmAction(null);
    }
  };

  const openConfirmModal = (action) => {
    setConfirmAction(action);
    setShowConfirmModal(true);
  };

  const handleConfirm = () => {
    if (confirmAction === "approve") {
      handleApprove();
    } else if (confirmAction === "reject") {
      handleReject();
    }
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return "N/A";
    const date = new Date(dateTimeString);
    return date.toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateDuration = (start, end) => {
    if (!start || !end) return "N/A";
    const diff = new Date(end) - new Date(start);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const handleMenuClick = (itemId) => {
    setActiveMenuItem(itemId);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  if (loading) {
    return (
      <div className="my-project-container">
        <NavBar onToggleSidebar={toggleSidebar} />
        <SideBarAdmin
          activeItem={activeMenuItem}
          onItemClick={handleMenuClick}
          isOpen={sidebarOpen}
          onClose={closeSidebar}
        />
        <div className="main-layout">
          <main className="main-content">
            <div className="dmm-loading-container">
              <div className="dmm-loading-spinner"></div>
              <p>Loading meeting details...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="my-project-container">
        <NavBar onToggleSidebar={toggleSidebar} />
        <SideBarAdmin
          activeItem={activeMenuItem}
          onItemClick={handleMenuClick}
          isOpen={sidebarOpen}
          onClose={closeSidebar}
        />
        <div className="main-layout">
          <main className="main-content">
            <div className="dmm-error-container">
              <p>Meeting not found</p>
              <button
                onClick={() => navigate("/admin/meetingManagement")}
                className="dmm-back-btn"
              >
                Back to Meeting Management
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="my-project-container">
      <ToastContainer autoClose={1500} style={{ top: "70px" }} />
      <NavBar onToggleSidebar={toggleSidebar} />
      <SideBarAdmin
        activeItem={activeMenuItem}
        onItemClick={handleMenuClick}
        isOpen={sidebarOpen}
        onClose={closeSidebar}
      />
      <div className="main-layout">
        <main className="main-content">
          <div className="dmm-header">
            <button
              onClick={() => navigate("/admin/meeting-management")}
              className="dmm-back-button"
            >
              <ArrowLeft size={20} />
              Back
            </button>
            <h1 className="dmm-title">Meeting Details</h1>
          </div>

          <div className="dmm-container">
            {/* Meeting Info Card */}
            <div className="dmm-card">
              <div className="dmm-card-header">
                <Calendar className="dmm-header-icon" size={24} />
                <h2>Meeting Information</h2>
              </div>
              <div className="dmm-card-body">
                <div className="dmm-info-row">
                  <span className="dmm-label">Meeting ID:</span>
                  <span className="dmm-value">{meeting.id}</span>
                </div>
                <div className="dmm-info-row">
                  <span className="dmm-label">Title:</span>
                  <span className="dmm-value dmm-title-value">
                    {meeting.title}
                  </span>
                </div>
                <div className="dmm-info-row">
                  <span className="dmm-label">Status:</span>
                  <span className="dmm-status-badge dmm-status-pending">
                    {meeting.status}
                  </span>
                </div>
                {meeting.description && (
                  <div className="dmm-info-row dmm-description-row">
                    <span className="dmm-label">
                      <FileText size={16} className="dmm-icon-inline" />
                      Description:
                    </span>
                    <p className="dmm-description-text">
                      {meeting.description}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Time & Location Card */}
            <div className="dmm-card">
              <div className="dmm-card-header">
                <Clock className="dmm-header-icon" size={24} />
                <h2>Time & Location</h2>
              </div>
              <div className="dmm-card-body">
                <div className="dmm-info-row">
                  <span className="dmm-label">
                    <Clock size={16} className="dmm-icon-inline" />
                    Start Time:
                  </span>
                  <span className="dmm-value">
                    {formatDateTime(meeting.startTime)}
                  </span>
                </div>
                <div className="dmm-info-row">
                  <span className="dmm-label">
                    <Clock size={16} className="dmm-icon-inline" />
                    End Time:
                  </span>
                  <span className="dmm-value">
                    {formatDateTime(meeting.endTime)}
                  </span>
                </div>
                <div className="dmm-info-row">
                  <span className="dmm-label">Duration:</span>
                  <span className="dmm-value dmm-duration">
                    {calculateDuration(meeting.startTime, meeting.endTime)}
                  </span>
                </div>
                <div className="dmm-info-row">
                  <span className="dmm-label">
                    <MapPin size={16} className="dmm-icon-inline" />
                    Room:
                  </span>
                  <span className="dmm-value dmm-room-value">
                    {meeting.room?.name || "N/A"}
                  </span>
                </div>
                {meeting.room?.location && (
                  <div className="dmm-info-row">
                    <span className="dmm-label">Location:</span>
                    <span className="dmm-value dmm-location-value">
                      {meeting.room.location}
                    </span>
                  </div>
                )}
                {meeting.room?.capacity && (
                  <div className="dmm-info-row">
                    <span className="dmm-label">Capacity:</span>
                    <span className="dmm-value">
                      {meeting.room.capacity} people
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Creator Card */}
            <div className="dmm-card">
              <div className="dmm-card-header">
                <User className="dmm-header-icon" size={24} />
                <h2>Creator Information</h2>
              </div>
              <div className="dmm-card-body">
                <div className="dmm-creator-info">
                  <img
                    src={
                      meeting.creator?.avatarUrl ||
                      "http://localhost:8080/uploads/avatars/user-avatar.png"
                    }
                    alt="Creator avatar"
                    className="dmm-creator-avatar"
                  />
                  <div className="dmm-creator-details">
                    <p className="dmm-creator-name">
                      {meeting.creator?.name || "N/A"}
                    </p>
                    <p className="dmm-creator-email">
                      {meeting.creator?.email || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Participants Card */}
            <div className="dmm-card">
              <div className="dmm-card-header">
                <Users className="dmm-header-icon" size={24} />
                <h2>Participants ({meeting.participants?.length || 0})</h2>
              </div>
              <div className="dmm-card-body">
                {meeting.participants && meeting.participants.length > 0 ? (
                  <div className="dmm-participants-list">
                    {meeting.participants.map((participant, index) => (
                      <div key={index} className="dmm-participant-item">
                        <img
                          src={
                            participant.user?.avatarUrl ||
                            "http://localhost:8080/uploads/avatars/user-avatar.png"
                          }
                          alt="Participant avatar"
                          className="dmm-participant-avatar"
                        />
                        <div className="dmm-participant-info">
                          <p className="dmm-participant-name">
                            {participant.user?.name || "N/A"}
                          </p>
                          <p className="dmm-participant-email">
                            {participant.user?.email || "N/A"}
                          </p>
                        </div>
                        <div className="dmm-participant-badges">
                          <span className="dmm-role-badge">
                            {participant.role}
                          </span>
                          <span
                            className={`dmm-status-badge-small dmm-status-${participant.status?.toLowerCase()}`}
                          >
                            {participant.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="dmm-empty-message">No participants</p>
                )}
              </div>
            </div>

            {/* Devices Card */}
            <div className="dmm-card">
              <div className="dmm-card-header">
                <Package className="dmm-header-icon" size={24} />
                <h2>Devices ({meeting.devices?.length || 0})</h2>
              </div>
              <div className="dmm-card-body">
                {meeting.devices && meeting.devices.length > 0 ? (
                  <div className="dmm-devices-list">
                    {meeting.devices.map((device, index) => (
                      <div key={index} className="dmm-device-item">
                        <img
                          src={
                            device.device?.imagePath
                              ? `http://localhost:8080${device.device.imagePath}`
                              : "http://localhost:8080/uploads/devices/default-device.png"
                          }
                          alt="Device"
                          className="dmm-device-image"
                        />
                        <div className="dmm-device-info">
                          <p className="dmm-device-name">
                            {device.device?.name || "N/A"}
                          </p>
                          <p className="dmm-device-quantity">
                            Quantity: {device.quantity}
                          </p>
                          <span
                            className={`dmm-device-status dmm-device-${device.status?.toLowerCase()}`}
                          >
                            {device.status}
                          </span>
                          {device.notes && (
                            <p className="dmm-device-notes">{device.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="dmm-empty-message">No devices assigned</p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="dmm-action-buttons">
              <button
                onClick={() => openConfirmModal("approve")}
                className="dmm-approve-button"
              >
                <CheckCircle size={20} />
                Approve Meeting
              </button>
              <button
                onClick={() => openConfirmModal("reject")}
                className="dmm-reject-button"
              >
                <XCircle size={20} />
                Reject Meeting
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div
          className="dmm-modal-backdrop"
          onClick={() => setShowConfirmModal(false)}
        >
          <div className="dmm-modal-box" onClick={(e) => e.stopPropagation()}>
            <h3 className="dmm-modal-title">
              {confirmAction === "approve"
                ? "Confirm Approval"
                : "Confirm Rejection"}
            </h3>
            <p className="dmm-modal-text">
              Are you sure you want to {confirmAction}{" "}
              <strong>{meeting.title}</strong>?
            </p>
            <div className="dmm-modal-actions">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="dmm-cancel-btn"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className={`dmm-confirm-btn ${
                  confirmAction === "approve"
                    ? "dmm-approve-btn"
                    : "dmm-reject-btn"
                }`}
              >
                {confirmAction === "approve" ? "Approve" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetailMeetingManagement;
