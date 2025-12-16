import React, { useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../../../styles/MeetingManagement/MeetingManagement.css";
import NavBar from "../../../components/NavBar";
import SideBarAdmin from "../../../components/SideBarAdmin";
import { Search, CheckCircle, XCircle, Eye } from "lucide-react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import axios from "axios";
import Pagination from "../../../components/Pagination.jsx";

const MeetingManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenuItem, setActiveMenuItem] = useState("meetting-management");
  const [allMeetings, setAllMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("asc");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [approveRejectLoading, setApproveRejectLoading] = useState(false);
  const [direction, setDirection] = useState("asc");

  useEffect(() => {
    fetchAllMeetings();
  }, []);

  const fetchAllMeetings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");
      const res = await axios.get("/api/meetings/getAllMeetings", {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: 0,
          size: 1000,
          sortBy: "startTime",
          direction: "desc",
        },
      });

      const meetings = res.data.data?.content || [];
      console.log("Fetched meetings:", meetings);

      setAllMeetings(Array.isArray(meetings) ? meetings : []);
    } catch (error) {
      console.error("Error fetching all meetings:", error);
      toast.error("Failed to load meetings");
    } finally {
      setLoading(false);
    }
  };


  const sendWebhookNotification = (meeting, action) => {
    try {
      const webhookData = {
        action: action, // "approve" hoặc "reject"
        timestamp: new Date().toISOString(),
        meeting: {
          id: meeting.id,
          title: meeting.title,
          description: meeting.description,
          startTime: meeting.startTime,
          endTime: meeting.endTime,
          status: meeting.status,
          room: {
            id: meeting.room?.id,
            name: meeting.room?.name,
            location: meeting.room?.location,
            capacity: meeting.room?.capacity,
          },
          creator: {
            id: meeting.creator?.id,
            name: meeting.creator?.name,
            email: meeting.creator?.email,
            avatarUrl: meeting.creator?.avatarUrl,
          },
          participants:
            meeting.participants?.map((p) => ({
              id: p.id,
              user: {
                id: p.user?.id,
                name: p.user?.name,
                email: p.user?.email,
                avatarUrl: p.user?.avatarUrl,
              },
              role: p.role,
              status: p.status,
              invitedAt: p.invitedAt,
              respondedAt: p.respondedAt,
            })) || [],
          devices:
            meeting.devices?.map((d) => ({
              id: d.id,
              device: {
                id: d.device?.id,
                name: d.device?.name,
                imagePath: d.device?.imagePath,
              },
              quantity: d.quantity,
              status: d.status,
              notes: d.notes,
              availableQuantity: d.availableQuantity,
            })) || [],
          createdAt: meeting.createdAt,
          updatedAt: meeting.updatedAt,
          cancelledAt: meeting.cancelledAt,
          cancellationReason: meeting.cancellationReason,
        },
      };

      console.log("Sending webhook notification:", webhookData);


      axios
        .post(
          "https://n8n.quanliduan-pms.site/webhook/email-aprrove-or-reject",
          webhookData,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        )
        .then(() => {
          console.log("Webhook sent successfully");
        })
        .catch((error) => {
          console.error("Webhook send error:", error.message);
        });
    } catch (error) {
      console.error("Error preparing webhook notification:", error);
    }
  };

  const handleApprove = async () => {
    if (!selectedMeeting) return;

    try {
      setApproveRejectLoading(true);
      const token = localStorage.getItem("accessToken");

      // Gọi API approve
      const approveRes = await axios.patch(
        `/api/meetings/${selectedMeeting.id}/approve`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const approvedMeeting = approveRes.data?.data;

      // Gửi webhook nếu có
      if (approvedMeeting) {
        sendWebhookNotification(approvedMeeting, "approve");
      }

      // Nếu là repeat meeting, hiển thị thông báo
      if (selectedMeeting.isRepeat && selectedMeeting.repeatGroupId) {
        toast.success(
          `✓ Meeting and all repeat sessions approved successfully!`
        );
      } else {
        toast.success("✓ Meeting approved successfully!");
      }

      fetchAllMeetings();
    } catch (error) {
      console.error("Error approving meeting:", error);
      toast.error(
        error.response?.data?.message || "Failed to approve meeting!"
      );
    } finally {
      setApproveRejectLoading(false);
      setShowConfirmModal(false);
      setSelectedMeeting(null);
      setConfirmAction(null);
    }
  };

  const handleReject = async () => {
    if (!selectedMeeting) return;

    try {
      setApproveRejectLoading(true);
      const token = localStorage.getItem("accessToken");

      // Gọi API reject
      const rejectRes = await axios.patch(
        `/api/meetings/${selectedMeeting.id}/reject`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const rejectedMeeting = rejectRes.data?.data;

      // Gửi webhook nếu có
      if (rejectedMeeting) {
        sendWebhookNotification(rejectedMeeting, "reject");
      }

      // Nếu là repeat meeting, hiển thị thông báo
      if (selectedMeeting.isRepeat && selectedMeeting.repeatGroupId) {
        toast.error(`✗ Meeting and all repeat sessions have been rejected!`);
      } else {
        toast.error("✗ Meeting rejected!");
      }

      fetchAllMeetings();
    } catch (error) {
      console.error("Error rejecting meeting:", error);
      toast.error(error.response?.data?.message || "Failed to reject meeting!");
    } finally {
      setApproveRejectLoading(false);
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

  const filteredMeetings = allMeetings
    .filter((meeting) => {
      // Filter by status
      if (statusFilter !== "ALL" && meeting.status !== statusFilter) {
        return false;
      }

      // Filter by selected date
      const meetingDate = new Date(meeting.startTime);
      if (
        meetingDate.getDate() !== selectedDate.getDate() ||
        meetingDate.getMonth() !== selectedDate.getMonth() ||
        meetingDate.getFullYear() !== selectedDate.getFullYear()
      ) {
        return false;
      }

      // Filter by search term
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

  const formatTime = (dateTimeString) => {
    if (!dateTimeString) return "N/A";
    const date = new Date(dateTimeString);
    return date.toLocaleString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "PENDING_APPROVAL":
        return "mm-status-pending";
      case "SCHEDULED":
        return "mm-status-scheduled";
      case "CANCELLED":
        return "mm-status-cancelled";
      default:
        return "mm-status-pending";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "PENDING_APPROVAL":
        return "PENDING";
      case "SCHEDULED":
        return "SCHEDULED";
      case "CANCELLED":
        return "CANCELLED";
      default:
        return status;
    }
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

  // ---------------------------
  // [ADD] Phân trang client-side
  // ---------------------------
  const [currentPage, setCurrentPage] = useState(1); // 1-based
  const pageSize = 10; // số dòng/trang

  // [ADD] Khi search/sort đổi => quay về trang 1
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy, direction]);

  const totalItems = filteredMeetings.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Clamp currentPage khi data thay đổi (ví dụ sau khi xóa/search)
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
    if (currentPage < 1 && totalPages >= 1) setCurrentPage(1);
  }, [totalPages, currentPage]);

  const startIndex = (currentPage - 1) * pageSize;

  // Dữ liệu hiển thị theo trang
  const pagedMeetings = useMemo(
    () => filteredMeetings.slice(startIndex, startIndex + pageSize),
    [filteredMeetings, startIndex]
  );
  console.log("Paged meetings:", pagedMeetings);

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
          <div className="mm-header-wrapper">
            <div className="mm-meeting-management-and-search">
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
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="mm-sort-dropdown"
                >
                  <option value="PENDING_APPROVAL">Pending</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="ALL">All Status</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="mm-sort-dropdown"
                >
                  <option value="date">Sort by Date</option>
                  <option value="title">Sort by Title</option>
                  <option value="room">Sort by Room</option>
                </select>
              </div>
            </div>

            {/* Mini Calendar */}
            <div className="mm-mini-calendar-box">
              <Calendar
                value={selectedDate}
                onClickDay={(date) => setSelectedDate(date)}
                tileClassName={({ date }) => {
                  const today = new Date();
                  let classes = "";

                  if (date.toDateString() === today.toDateString()) {
                    classes += "calendar-today ";
                  }
                  if (date.toDateString() === selectedDate.toDateString()) {
                    classes += "calendar-selected";
                  }

                  return classes.trim();
                }}
              />
              <div className="mm-selected-date-display">
                {selectedDate.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </div>
            </div>
          </div>

          <div className="meeting-management-summary">
            Total: {filteredMeetings.length} meetings on{" "}
            {selectedDate.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>

          {loading ? (
            <div className="mm-loading-container">
              <div className="mm-loading-spinner"></div>
              <p>Loading meetings...</p>
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
                    <th>Time</th>
                    <th>Repeat</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMeetings.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="mm-no-data">
                        No meetings found
                      </td>
                    </tr>
                  ) : (
                    pagedMeetings.map((meeting, index) => (
                      <tr key={meeting.id}>
                        <td>{startIndex + index + 1}</td>
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
                          {formatTime(meeting.startTime)} -{" "}
                          {formatTime(meeting.endTime)}
                        </td>
                        <td className="mm-name-cells">
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            {meeting.repeat ? (
                              <span
                                style={{
                                  backgroundColor: "#ff9800",
                                  color: "white",
                                  padding: "2px 6px",
                                  borderRadius: "3px",
                                  fontSize: "11px",
                                  fontWeight: "bold",
                                }}
                              >
                                REPEAT
                              </span>
                            ) : (
                              <span
                                style={{
                                  backgroundColor: "#e3e3e3ff",
                                  color: "black",
                                  padding: "2px 6px",
                                  borderRadius: "3px",
                                  fontSize: "11px",
                                  fontWeight: "bold",
                                }}
                              >
                                NO REPEAT
                              </span>
                            )}
                          </div>
                        </td>

                        <td>
                          <span
                            className={`mm-status-badge ${getStatusBadgeClass(
                              meeting.status
                            )}`}
                          >
                            {getStatusLabel(meeting.status)}
                          </span>
                        </td>
                        <td>
                          <div className="mm-action-group">
                            <button
                              onClick={() => handleViewDetail(meeting)}
                              className="mm-view-action"
                              title="View details"
                              disabled={approveRejectLoading}
                            >
                              <Eye size={16} />
                            </button>

                            {meeting.status === "PENDING_APPROVAL" && (
                              <>
                                <button
                                  onClick={() =>
                                    openConfirmModal(meeting, "approve")
                                  }
                                  className="mm-approve-action"
                                  title="Approve meeting"
                                  disabled={approveRejectLoading}
                                >
                                  <CheckCircle size={16} />
                                </button>

                                <button
                                  onClick={() =>
                                    openConfirmModal(meeting, "reject")
                                  }
                                  className="mm-reject-action"
                                  title="Reject meeting"
                                  disabled={approveRejectLoading}
                                >
                                  <XCircle size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
      {totalPages > 1 && (
        <div className="pagination-container">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            showFirstLast
            maxButtons={5}
          />
        </div>
      )}

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
                disabled={approveRejectLoading}
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
                disabled={approveRejectLoading}
              >
                {approveRejectLoading ? (
                  <>
                    <span
                      style={{
                        display: "inline-block",
                        marginRight: "8px",
                        animation: "spin 1s linear infinite",
                      }}
                    >
                      ⟳
                    </span>
                    Processing...
                  </>
                ) : confirmAction === "approve" ? (
                  "Approve"
                ) : (
                  "Reject"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default MeetingManagement;
