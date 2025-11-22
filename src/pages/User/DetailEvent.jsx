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
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [roomDevices, setRoomDevices] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const currentUserId = localStorage.getItem("userId");

  const isCreator =
    event?.isCreator ||
    event?.creator?.id === currentUserId ||
    event?.creatorId === currentUserId;

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

  const fetchRoomDevices = async () => {
    try {
      const roomId = event.room || event.roomId;
      const response = await axios.get(
        `http://localhost:8080/api/meetings/rooms/${roomId}/devices`
      );
      setRoomDevices(response.data || []);
    } catch (error) {
      console.error("Error fetching room devices:", error);
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
            <p style={{ margin: "4px 0", fontSize: "14px", color: "#666" }}>
              {event.roomName || "N/A"}
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
                {event.participants.map((participant, idx) => (
                  <li key={idx} style={{ fontSize: "14px", color: "#666" }}>
                    {participant}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Devices */}
          <div style={{ marginBottom: "16px" }}>
            <strong>Borrowed Devices:</strong>
            <ul style={{ margin: "8px 0", paddingLeft: "20px" }}>
              {roomDevices && roomDevices.length > 0 ? (
                roomDevices.map((device, idx) => (
                  <li key={idx} style={{ fontSize: "14px", color: "#666" }}>
                    {device.deviceName} (x{device.quantity})
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
            <p
              style={{
                margin: "4px 0",
                fontSize: "14px",
                color: "#28a745",
                fontWeight: "bold",
              }}
            >
              {event.status || "N/A"}
            </p>
          </div>
        </div>

        <div className="detail-event-modal-footer">
          {isCreator ? (
            <>
<button
  className="detail-event-update-btn"
  onClick={() => onEdit(event)} 
>
  Update
</button>
              <button
                className="detail-event-cancel-btn"
                onClick={() => {
                  toast.info("Update feature coming soon!");
                }}
              >
                Cancel
              </button>
              <button
                className="detail-event-delete-btn"
                onClick={handleDeleteClick}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </>
          ) : (
            <p style={{ color: "#999", fontSize: "14px" }}>
              Only creator can edit or delete
            </p>
          )}

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
