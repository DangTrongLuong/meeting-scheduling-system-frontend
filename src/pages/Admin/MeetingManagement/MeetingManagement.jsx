import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../../../styles/MeetingManagement/MeetingManagement.css";
import NavBar from "../../../components/NavBar";
import SideBarAdmin from "../../../components/SideBarAdmin";
import {
  Search,
  CheckCircle,
  XCircle,
  Calendar,
  Clock,
  MapPin,
  User,
  Eye,
} from "lucide-react";
import axios from "axios";

const MeetingManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenuItem, setActiveMenuItem] = useState("meetting-management");
  const [pendingMeetings, setPendingMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("asc");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [selectedMeeting, setSelectedMeeting] = useState(null);

  useEffect(() => {
    fetchPendingMeetings();
  }, []);

  const fetchPendingMeetings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");
      const res = await axios.get("/api/meetings/pending", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPendingMeetings(res.data.data || []);
    } catch (error) {
      console.error("Error fetching pending meetings:", error);
      toast.error("Failed to load pending meetings");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedMeeting) return;

    try {
      const token = localStorage.getItem("accessToken");
      await axios.patch(
        `/api/meetings/${selectedMeeting.id}/approve`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Meeting approved successfully!");
      fetchPendingMeetings();
    } catch (error) {
      console.error("Error approving meeting:", error);
      toast.error(
        error.response?.data?.message || "Failed to approve meeting!"
      );
    } finally {
      setShowConfirmModal(false);
      setSelectedMeeting(null);
      setConfirmAction(null);
    }
  };

  const handleReject = async () => {
    if (!selectedMeeting) return;

    try {
      const token = localStorage.getItem("accessToken");
      await axios.patch(
        `/api/meetings/${selectedMeeting.id}/reject`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.error("Meeting rejected!");
      fetchPendingMeetings();
    } catch (error) {
      console.error("Error rejecting meeting:", error);
      toast.error(error.response?.data?.message || "Failed to reject meeting!");
    } finally {
      setShowConfirmModal(false);
      setSelectedMeeting(null);
      setConfirmAction(null);
    }
  };

  const openConfirmModal = (meeting, action) => {
    setSelectedMeeting(meeting);
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

  const handleViewDetail = (meeting) => {
    navigate(`/admin/meetingManagement/detail/${meeting.id}`, {
      state: { meeting },
    });
  };

  const filteredMeetings = pendingMeetings
    .filter((meeting) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        meeting.title?.toLowerCase().includes(searchLower) ||
        meeting.room?.name?.toLowerCase().includes(searchLower) ||
        meeting.creator?.name?.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === "date") {
        comparison = new Date(a.startTime) - new Date(b.startTime);
      } else if (sortBy === "title") {
        comparison = (a.title || "").localeCompare(b.title || "");
      } else if (sortBy === "room") {
        comparison = (a.room?.name || "").localeCompare(b.room?.name || "");
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return "N/A";
    const date = new Date(dateTimeString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
          <h1 className="meeting-management">Meeting Management</h1>

          <div className="mm-controls">
            <div className="mm-search-wrapper">
              <Search className="mm-search-icon" size={20} />
              <input
                type="text"
                placeholder="Search by title, room, or organizer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mm-search-field"
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="mm-sort-dropdown"
            >
              <option value="date">Sort by Date</option>
              <option value="title">Sort by Title</option>
              <option value="room">Sort by Room</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="mm-order-toggle"
            >
              {sortOrder === "asc" ? "↑ Ascending" : "↓ Descending"}
            </button>
          </div>

          {loading ? (
            <div className="mm-loading-container">
              <div className="mm-loading-spinner"></div>
              <p>Loading pending meetings...</p>
            </div>
          ) : (
            <div className="mm-table-wrapper">
              <table className="mm-data-table">
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>Title</th>
                    <th>Creator</th>
                    <th>Room</th>
                    <th>Start Time</th>
                    <th>End Time</th>
                    <th>Participants</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMeetings.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="mm-no-data">
                        No pending meetings found
                      </td>
                    </tr>
                  ) : (
                    filteredMeetings.map((meeting, index) => (
                      <tr key={meeting.id}>
                        <td>{index + 1}</td>
                        <td className="mm-name-cells">
                          {meeting.title || "N/A"}
                        </td>
                        <td className="mm-creator-cells">
                          <span>{meeting.creator?.name || "N/A"}</span>
                        </td>
                        <td className="mm-room-cells">
                          {meeting.room?.name || "N/A"}
                        </td>
                        <td className="mm-time-cells">
                          {formatDateTime(meeting.startTime)}
                        </td>
                        <td className="mm-time-cells">
                          {formatDateTime(meeting.endTime)}
                        </td>
                        <td className="mm-participant-cell">
                          {meeting.participants?.length || 0}
                        </td>

                        <td>
                          <span className="mm-status-badge mm-status-pending">
                            PENDING
                          </span>
                        </td>
                        <td>
                          <div className="mm-action-group">
                            <button
                              onClick={() => handleViewDetail(meeting)}
                              className="mm-view-action"
                              title="View details"
                            >
                              <Eye size={16} />
                            </button>

                            <button
                              onClick={() =>
                                openConfirmModal(meeting, "approve")
                              }
                              className="mm-approve-action"
                              title="Approve meeting"
                            >
                              <CheckCircle size={16} />
                            </button>

                            <button
                              onClick={() =>
                                openConfirmModal(meeting, "reject")
                              }
                              className="mm-reject-action"
                              title="Reject meeting"
                            >
                              <XCircle size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="mm-count-info">
            Showing {filteredMeetings.length} of {pendingMeetings.length}{" "}
            pending meetings
          </div>
        </main>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && selectedMeeting && (
        <div
          className="mm-modal-backdrop"
          onClick={() => setShowConfirmModal(false)}
        >
          <div className="mm-modal-box" onClick={(e) => e.stopPropagation()}>
            <h3 className="mm-modal-title">
              {confirmAction === "approve"
                ? "Confirm Approval"
                : "Confirm Rejection"}
            </h3>
            <p className="mm-modal-text">
              Are you sure you want to {confirmAction}{" "}
              <strong>{selectedMeeting.title}</strong>?
            </p>
            <div className="mm-modal-actions">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="mm-cancel-btn"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className={`mm-confirm-btn ${
                  confirmAction === "approve"
                    ? "mm-approve-btn"
                    : "mm-reject-btn"
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

export default MeetingManagement;
