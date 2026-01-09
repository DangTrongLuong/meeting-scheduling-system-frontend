import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../../styles/User/DetailEvent.css";
import axios from "axios";
import DeleteConfirmation from "./DeleteConfirmation";

export default function DetailEvent({
  isOpen,
  onClose,
  event,
  rooms,
  onDelete,
  onEdit,
  loading,
  toastMessage,
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [roomDevices, setRoomDevices] = useState([]);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const currentUserId = localStorage.getItem("userId");

  const isCreator =
    event?.isCreator ||
    event?.creator?.id === currentUserId ||
    event?.creatorId === currentUserId;

  const isParticipant =
    event?.extendedProps?.isParticipant ||
    event?.participants?.some(
      (p) => p.user?.id === currentUserId && p.status === "ACCEPTED"
    );

  const canEdit = isCreator;
  const ended =
    event?.ended === true
      ? true
      : event?.end
      ? new Date(event.end).getTime() < Date.now()
      : false;
  // useEffect(() => {
  //   if (event) {
  //     console.log("Event details:", event);
  //     console.log("Current User ID:", currentUserId);
  //     console.log("Creator ID:", event.creator?.id || event.creatorId);
  //     console.log("isCreator flag:", event.isCreator);
  //   }
  // }, [event, currentUserId]);

  useEffect(() => {
    if (!event) return;
    fetchRoomDevices();
  }, [event]);

  useEffect(() => {
    if (toastMessage) {
      toast.success(toastMessage);
    }
  }, [toastMessage]);

  const fetchRoomDevices = async () => {
    try {
      const roomId = event.room?.id;

      if (!roomId) {
        console.warn("No room ID found in event:", event);
        setRoomDevices([]);
        return;
      }

      const response = await axios.get(
        `http://localhost:8080/api/meetings/rooms/${roomId}/devices`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      setRoomDevices(response.data || []);
    } catch (error) {
      console.error("Error fetching room devices:", error);
      setRoomDevices([]);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async (reason) => {
    setIsDeleting(true);
    try {
      const token = localStorage.getItem("accessToken");
      const userId = localStorage.getItem("userId");

      await axios.delete(
        `http://localhost:8080/api/meetings/${
          event.id
        }?reason=${encodeURIComponent(reason)}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            userId: userId,
          },
        }
      );

      toast.success("Meeting deleted successfully!");
      setTimeout(() => {
        setShowDeleteConfirm(false);
        onDelete();
        onClose();
      }, 1200);
    } catch (error) {
      console.error("Error deleting meeting:", error);
      toast.error(error.response?.data?.message || "Error deleting meeting!");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen || !event) return null;

  const startTime = new Date(event.start);
  const endTime = new Date(event.end);

  const formatDateTime = (date) => {
    return date.toLocaleString("en-EN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const durationMinutes = Math.round((endTime - startTime) / (1000 * 60));
  const durationHours = (durationMinutes / 60).toFixed(1);

  const statusColor_Meeting =
    event.status === "PENDING_APPROVAL"
      ? "#f39c12"
      : event.status === "SCHEDULED"
      ? "#28a745"
      : "#fa3434ff";

  const statusColors_Member = {
    PENDING: "#f19d2eff",
    ACCEPTED: "#27ae60",
    DECLINED: "#d81b24ff",
  };

  return (
    <div className="detail-event-modal" onClick={onClose}>
      <ToastContainer
        position="top-right"
        style={{ top: "70px" }}
        autoClose={1200}
      />
      <div
        className="detail-event-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="detail-event-modal-title">Meeting Details</h3>
        <div className="detail-event-modal-body">
          {/* Title */}
          <div style={{ marginBottom: "16px" }}>
            <strong>Title:</strong>
            <p style={{ margin: "4px 0", fontSize: "16px", color: "#333" }}>
              {event.title}
            </p>
          </div>

          {/* Creator */}
          <div style={{ marginBottom: "16px" }}>
            <strong>Created by:</strong>
            <p style={{ margin: "4px 0", fontSize: "14px", color: "#666" }}>
              {event.creator?.name || "N/A"} ({event.creator?.email})
            </p>
          </div>

          {/* Room */}
          <div style={{ marginBottom: "16px" }}>
            <strong>Room:</strong>
            <p
              style={{ fontSize: "15px", fontWeight: "600", color: "#1976d2" }}
            >
              {event.room?.name || event.meetingRoom?.name || "N/A"}
              {event.room?.location && (
                <span
                  style={{ color: "#666", fontSize: "13px", marginLeft: "8px" }}
                >
                  ({event.room.location})
                </span>
              )}
            </p>
          </div>

          {/* Start Time */}
          <div style={{ marginBottom: "16px" }}>
            <strong>Start Time:</strong>
            <p style={{ margin: "4px 0", fontSize: "14px", color: "#666" }}>
              {formatDateTime(startTime)}
            </p>
          </div>

          {/* End Time */}
          <div style={{ marginBottom: "16px" }}>
            <strong>End Time:</strong>
            <p style={{ margin: "4px 0", fontSize: "14px", color: "#666" }}>
              {formatDateTime(endTime)}
            </p>
          </div>

          {/* Duration */}
          <div style={{ marginBottom: "16px" }}>
            <strong>Duration:</strong>
            <p style={{ margin: "4px 0", fontSize: "14px", color: "#666" }}>
              {durationHours} hours ({durationMinutes} minutes)
            </p>
          </div>

          {/* Description */}
          {event.description && (
            <div style={{ marginBottom: "16px" }}>
              <strong>Description:</strong>
              <div
                style={{
                  padding: "10px",
                  backgroundColor: "#f0f0f0",
                  borderRadius: "4px",
                  marginTop: "4px",
                  fontSize: "14px",
                  color: "#555",
                }}
                dangerouslySetInnerHTML={{ __html: event.description }}
              />
            </div>
          )}

          {/* Participants */}
          {event.participants && event.participants.length > 0 && (
            <div style={{ marginBottom: "16px" }}>
              <strong>Participants:</strong>
              <ul style={{ margin: "8px 0", paddingLeft: "20px" }}>
                {event.participants && event.participants.length > 0 ? (
                  event.participants.map((p, idx) => {
                    const user = p.user || p;
                    const statusColor =
                      p.status === "ACCEPTED"
                        ? "#28a745"
                        : p.status === "DECLINED"
                        ? "#dc3545"
                        : "#ffc107";
                    const statusBg =
                      p.status === "ACCEPTED"
                        ? "#d4edda"
                        : p.status === "DECLINED"
                        ? "#f8d7da"
                        : "#fff3cd";

                    return (
                      <div
                        className="participants-list"
                        style={{
                          height: "auto",
                          maxHeight: "220px",
                          overflowY: "auto",
                          marginBottom: "6px",
                        }}
                      >
                        <li
                          key={idx}
                          style={{
                            fontSize: "14px",
                            color: "#444",
                            marginBottom: "6px",
                          }}
                        >
                          <strong>{user.name || "Unknown User"}</strong>

                          {user.email && (
                            <span
                              style={{
                                color: "#666",
                                marginLeft: "8px",
                                fontSize: "13px",
                              }}
                            >
                              &lt;{user.email}&gt;
                            </span>
                          )}
                          {p.role && (
                            <span
                              style={{
                                marginLeft: "8px",
                                color: "#999",
                                fontSize: "12px",
                              }}
                            >
                              ({p.role})
                            </span>
                          )}
                          {p.status && (
                            <span
                              style={{
                                marginLeft: "10px",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                fontSize: "11px",
                                backgroundColor: statusBg,
                                color: statusColor,
                                fontWeight: "bold",
                              }}
                            >
                              {p.status}
                            </span>
                          )}
                        </li>
                      </div>
                    );
                  })
                ) : (
                  <li style={{ fontSize: "14px", color: "#999" }}>
                    No participants invited
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Devices */}
          <div style={{ marginBottom: "16px" }}>
            <strong>Availabled Devices:</strong>
            <ul style={{ margin: "8px 0", paddingLeft: "20px" }}>
              {roomDevices && roomDevices.length > 0 ? (
                roomDevices.map((device, idx) => (
                  <li key={idx} style={{ fontSize: "14px", color: "#444" }}>
                    {device.device?.name || device.deviceName} (x
                    {device.quantity || 1})
                    {device.notes && (
                      <span
                        style={{
                          color: "#999",
                          fontSize: "12px",
                          marginLeft: "6px",
                        }}
                      >
                        – {device.notes}
                      </span>
                    )}
                  </li>
                ))
              ) : (
                <li style={{ fontSize: "14px", color: "#999" }}>
                  No devices borrowed
                </li>
              )}
            </ul>
          </div>

          {/* Status */}
          <div style={{ marginBottom: "16px" }}>
            <strong>Status:</strong>
            <p style={{ fontWeight: "bold", margin: 0 }}>
              {ended ? (
                // ❗ Không nền, chỉ chữ đỏ đậm, caps (giống pending_approval style nhưng đổi sang đỏ)
                <span
                  style={{
                    color: "#c62828",
                    fontWeight: 700,
                    letterSpacing: "0.3px",
                    textTransform: "uppercase",
                  }}
                >
                  This meeting has concluded
                </span>
              ) : (
                // Giữ nguyên cách hiển thị status khi chưa concluded
                <span
                  style={{
                    color: statusColor_Meeting,
                    textTransform: "uppercase",
                  }}
                >
                  {event.status}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="detail-event-modal-footer">
          {!ended && canEdit ? (
            <>
              <button
                className="detail-event-update-btn"
                onClick={() => onEdit(event)}
              >
                Update
              </button>
              <button
                className="detail-event-delete-btn"
                onClick={handleDeleteClick}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </>
          ) : null}
          <button
            className="detail-event-close-btn"
            onClick={onClose}
            disabled={isDeleting || loading}
          >
            Close
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmation
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        loading={isDeleting}
      />
    </div>
  );
}
