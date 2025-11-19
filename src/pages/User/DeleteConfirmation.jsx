import React, { useState } from "react";
import "../../styles/User/DeleteConfirmation.css";

export default function DeleteConfirmation({
  isOpen,
  onClose,
  onConfirm,
  loading,
}) {
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");

  const reasons = [
    {
      value: "SCHEDULE_CONFLICT",
      label: "Schedule Conflict",
      description: "Meeting time conflicts with another event",
    },
    {
      value: "ROOM_UNAVAILABLE",
      label: "Room Unavailable",
      description: "The room is no longer available",
    },
    {
      value: "CANCELLED_BY_ORGANIZER",
      label: "Cancelled by Organizer",
      description: "Organizer decision to cancel",
    },
    {
      value: "NOT_ENOUGH_PARTICIPANTS",
      label: "Not Enough Participants",
      description: "Not enough people confirmed attendance",
    },
    {
      value: "OTHER",
      label: "Other Reason",
      description: "Provide your own reason",
    },
  ];

  const handleConfirm = () => {
    if (!selectedReason) {
      alert("Please select a reason");
      return;
    }

    if (selectedReason === "OTHER" && !customReason.trim()) {
      alert("Please enter a reason");
      return;
    }

    const finalReason =
      selectedReason === "OTHER" ? customReason : selectedReason;
    onConfirm(finalReason);
  };

  if (!isOpen) return null;

  return (
    <div className="delete-confirmation-overlay" onClick={onClose}>
      <div
        className="delete-confirmation-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="delete-confirmation-header">
          <h3>⚠️ Delete Meeting</h3>
          <button className="delete-confirmation-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="delete-confirmation-body">
          <p className="delete-confirmation-warning">
            Are you sure you want to delete this meeting? This action cannot be
            undone.
          </p>

          <div className="delete-confirmation-reasons">
            <label className="delete-confirmation-label">
              Why are you deleting this meeting?
            </label>

            <div className="delete-confirmation-options">
              {reasons.map((reason) => (
                <label
                  key={reason.value}
                  className={`delete-confirmation-option ${
                    selectedReason === reason.value ? "checked" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={reason.value}
                    checked={selectedReason === reason.value}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="delete-confirmation-radio"
                  />
                  <div className="delete-confirmation-radio-circle"></div>
                  <div className="delete-confirmation-reason-content">
                    <div className="delete-confirmation-reason-label">
                      {reason.label}
                    </div>
                    <div className="delete-confirmation-reason-description">
                      {reason.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>

            {selectedReason === "OTHER" && (
              <div className="delete-confirmation-custom-reason">
                <textarea
                  className="delete-confirmation-textarea"
                  placeholder="Please provide your reason for cancellation..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  maxLength={200}
                  disabled={loading}
                />
                <div className="delete-confirmation-char-count">
                  {customReason.length}/200
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="delete-confirmation-footer">
          <button
            className="delete-confirmation-cancel-btn"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="delete-confirmation-delete-btn"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? "Deleting..." : "Delete Meeting"}
          </button>
        </div>
      </div>
    </div>
  );
}
