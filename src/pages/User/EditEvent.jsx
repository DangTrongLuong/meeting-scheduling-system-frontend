import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import "../../styles/User/EditEvent.css";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import Select from "react-select";

export default function EditEvent({
  isOpen,
  onClose,
  event,
  rooms,
  onUpdate,
  loading,
}) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    startTime: "07:00",
    endTime: "07:30",
    roomId: "",
    participants: [],
    borrowedDevices: [],
  });

  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomDevices, setRoomDevices] = useState([]);
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [allDevices, setAllDevices] = useState([]);

  const token = localStorage.getItem("accessToken");

  // Populate formData when event changes
  useEffect(() => {
    if (event) {
      let startDate = "";
      let startTime = "07:00";
      let endTime = "07:30";

      if (event.start instanceof Date) {
        startDate = event.start.toISOString().split("T")[0];
        startTime = `${event.start
          .getHours()
          .toString()
          .padStart(2, "0")}:${event.start
          .getMinutes()
          .toString()
          .padStart(2, "0")}`;
      } else if (typeof event.start === "string") {
        startDate = event.start.split("T")[0];
        startTime = event.start.split("T")[1]?.slice(0, 5);
      }

      if (event.end instanceof Date) {
        endTime = `${event.end
          .getHours()
          .toString()
          .padStart(2, "0")}:${event.end
          .getMinutes()
          .toString()
          .padStart(2, "0")}`;
      } else if (typeof event.end === "string") {
        endTime = event.end.split("T")[1]?.slice(0, 5);
      }

      setFormData({
        title: event.title || "",
        description: event.description || "",
        date: startDate,
        startTime: startTime,
        endTime: endTime,
        roomId: event.roomId || "",
        //participants: event.participants || [],
        //borrowedDevices: event.borrowedDevices || [],
        participants: Array.isArray(event.participants)
          ? event.participants.map((p) =>
              typeof p === "string" ? { email: p, role: "REQUIRED" } : p
            )
          : [],
        borrowedDevices: Array.isArray(event.borrowedDevices)
          ? event.borrowedDevices
          : [],
      });
    }
  }, [event]);

  useEffect(() => {
    if (formData.roomId) {
      fetchRoomDevices(formData.roomId);
      const room = rooms.find((r) => r.id === formData.roomId);
      setSelectedRoom(room);
    }
  }, [formData.roomId]);

  useEffect(() => {
    fetchAllDevices();
  }, []);

  const fetchRoomDevices = async (roomId) => {
    try {
      const response = await axios.get(`/api/meetings/rooms/${roomId}/devices`);
      setRoomDevices(response.data || []);
    } catch (err) {
      console.error("Error fetching room devices:", err);
    }
  };

  const fetchAllDevices = async () => {
    try {
      const response = await axios.get("/api/meetings/devices/active");
      setAllDevices(response.data || []);
    } catch (err) {
      console.error("Error fetching devices:", err);
    }
  };

  // Participants search
  const handleSearchEmail = async (value) => {
    setSearchEmail(value);
    if (value.length > 3) {
      try {
        const response = await axios.get(
          `/api/meetings/users/search?email=${value}`
        );
        setSearchResults(response.data || []);
      } catch (err) {
        console.error("Error searching users:", err);
      }
    } else {
      setSearchResults([]);
    }
  };

  const addParticipant = (user) => {
    const emailNorm = user.email.toLowerCase().trim();
    const exists = formData.participants.some(
      (p) => p.email?.toLowerCase().trim() === emailNorm
    );
    if (exists) {
      // ví dụ: toast.info("Email này đã có trong danh sách.");
      setSearchEmail("");
      setSearchResults([]);
      return;
    }

    const newParticipants = [
      ...formData.participants,
      { email: user.email, role: "REQUIRED" },
    ];
    setFormData({ ...formData, participants: newParticipants });
    setSearchEmail("");
    setSearchResults([]);
  };

  const removeParticipant = (index) => {
    const newParticipants = formData.participants.filter((_, i) => i !== index);
    setFormData({ ...formData, participants: newParticipants });
  };

  // Devices
  const addDevice = () => {
    const newDevices = [
      ...formData.borrowedDevices,
      { deviceId: "", quantity: 1, notes: "" },
    ];
    setFormData({ ...formData, borrowedDevices: newDevices });
  };

  const removeDevice = (index) => {
    const newDevices = formData.borrowedDevices.filter((_, i) => i !== index);
    setFormData({ ...formData, borrowedDevices: newDevices });
  };

  const handleDeviceChange = (index, field, value) => {
    const newDevices = [...formData.borrowedDevices];
    newDevices[index][field] = value;
    setFormData({ ...formData, borrowedDevices: newDevices });
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        slots.push(
          `${hour.toString().padStart(2, "0")}:${minute
            .toString()
            .padStart(2, "0")}`
        );
      }
    }
    return slots;
  };

  const handleUpdateMeeting = async () => {
    if (!formData.title.trim()) {
      toast.error("Please enter a meeting title!");
      return;
    }
    if (!formData.date) {
      toast.error("Please select a date!");
      return;
    }
    if (!formData.roomId) {
      toast.error("Please select a room!");
      return;
    }

    const startMinutes =
      parseInt(formData.startTime.split(":")[0]) * 60 +
      parseInt(formData.startTime.split(":")[1]);
    const endMinutes =
      parseInt(formData.endTime.split(":")[0]) * 60 +
      parseInt(formData.endTime.split(":")[1]);

    if (endMinutes <= startMinutes) {
      toast.error("End time must be after start time!");
      return;
    }

    try {
      const startDateTime = `${formData.date}T${formData.startTime}:00`;
      const endDateTime = `${formData.date}T${formData.endTime}:00`;

      const updateData = {
        title: formData.title,
        description: formData.description,
        startTime: startDateTime,
        endTime: endDateTime,
        roomId: formData.roomId,
        participants: formData.participants.filter((p) => p.email),
        borrowedDevices: formData.borrowedDevices.filter((d) => d.deviceId),
      };
      const userId = localStorage.getItem("userId");

      const response = await axios.put(
        `/api/meetings/${event.id}`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${token}`, // JWT token
            userId: userId,
            "Content-Type": "application/json",
          },
        }
      );

      onUpdate({
        id: event.id,
        title: formData.title,
        start: startDateTime,
        end: endDateTime,
        roomId: formData.roomId,
        roomName:
          rooms.find((r) => r.id === formData.roomId)?.name || event.roomName,
        description: formData.description,
        participants: formData.participants.filter((p) => p.email),
        borrowedDevices: formData.borrowedDevices.filter((d) => d.deviceId),
        status: event.status,
      });

      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    }
  };

  if (!isOpen) return null;

  const timeSlots = generateTimeSlots();

  return (
    <div className="edit-event-modal" onClick={onClose}>
      {/* {isOpen && <ToastContainer position="top-right" autoClose={1200} />} */}

      <div
        className="edit-event-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="edit-event-modal-title">Edit Meeting</h3>
        <div
          className="edit-event-modal-body"
          style={{ maxHeight: "70vh", overflowY: "auto" }}
        >
          {/* Title */}
          <div className="edit-event-form-group">
            <label className="edit-event-label">Title *</label>
            <input
              type="text"
              className="edit-event-input"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              disabled={loading}
            />
          </div>

          {/* Description */}
          <div className="edit-event-form-group">
            <label className="edit-event-label">Description</label>
            <div className="ckeditor-wrapper">
              <CKEditor
                editor={ClassicEditor}
                data={formData.description}
                onChange={(event, editor) => {
                  const data = editor.getData();
                  setFormData({ ...formData, description: data });
                }}
                disabled={loading}
              />
            </div>
          </div>

          {/* Date */}
          <div className="edit-event-form-group">
            <label className="edit-event-label">Date *</label>
            <input
              type="date"
              className="edit-event-input"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              disabled={loading}
              min={new Date().toISOString().split("T")[0]}
            />
          </div>

          {/* Room */}
          <div className="edit-event-form-group">
            <label className="edit-event-label">Room *</label>
            <select
              className="edit-event-select"
              value={formData.roomId}
              onChange={(e) =>
                setFormData({ ...formData, roomId: e.target.value })
              }
              disabled={loading}
            >
              <option value="">-- Select a room --</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
            </select>
          </div>

          {/* Room Info */}
          {selectedRoom && (
            <div
              className="edit-event-form-group"
              style={{
                padding: "10px",
                backgroundColor: "#f0f0f0",
                borderRadius: "4px",
              }}
            >
              <p>
                <strong>Room Name:</strong> {selectedRoom.name}
              </p>
              <p>
                <strong>Capacity:</strong> {selectedRoom.capacity} people
              </p>
              <p>
                <strong>Available Devices:</strong>
              </p>
              <ul style={{ marginLeft: "20px" }}>
                {roomDevices.length > 0 ? (
                  roomDevices.map((device, idx) => (
                    <li key={idx}>
                      {device.deviceName} (x{device.quantity})
                    </li>
                  ))
                ) : (
                  <li>No devices available</li>
                )}
              </ul>
            </div>
          )}

          {/* Participants */}
          <div className="edit-event-form-group">
            <label className="edit-event-label">Participants</label>

            <div style={{ marginTop: "10px" }}>
              {formData.participants.length === 0 ? (
                <p
                  style={{
                    color: "#888",

                    margin: "8px 0",
                  }}
                >
                  No participants added
                </p>
              ) : (
                formData.participants.map((p, idx) => {
                  // Chuẩn hóa dữ liệu: nếu backend trả string → biến thành object
                  const participant =
                    typeof p === "string" ? { email: p, role: "REQUIRED" } : p;

                  return (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 14px",
                        backgroundColor: "#f8f9fa",
                        borderRadius: "8px",
                        marginBottom: "8px",
                        border: "1px solid #e9ecef",
                        fontSize: "0.95rem",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "14px",
                          width: "100%",
                        }}
                      >
                        <strong
                          style={{
                            fontWeight: "400",
                            color: "#2c3e50",
                            width: "75%",
                          }}
                        >
                          {participant.email}
                        </strong>

                        <select
                          value={participant.role || "REQUIRED"}
                          onChange={(e) => {
                            const updated = [...formData.participants];
                            if (typeof updated[idx] === "string") {
                              updated[idx] = {
                                email: updated[idx],
                                role: e.target.value,
                              };
                            } else {
                              updated[idx] = {
                                ...updated[idx],
                                role: e.target.value,
                              };
                            }
                            setFormData({ ...formData, participants: updated });
                          }}
                          style={{
                            padding: "6px 10px",
                            borderRadius: "6px",
                            border: "1px solid #ced4da",
                            backgroundColor: "white",
                            fontSize: "0.9rem",
                          }}
                        >
                          <option value="REQUIRED">Required</option>
                          <option value="OPTIONAL">Optional</option>
                        </select>
                      </div>

                      <button
                        onClick={() => removeParticipant(idx)}
                        style={{
                          backgroundColor: "#e74c3c",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          padding: "6px 12px",
                          fontSize: "0.8rem",
                          cursor: "pointer",
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="edit-event-form-group">
            <label className="edit-event-label">Start Time *</label>
            <select
              className="edit-event-select"
              value={formData.startTime}
              onChange={(e) =>
                setFormData({ ...formData, startTime: e.target.value })
              }
            >
              {timeSlots.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </div>

          <div className="edit-event-form-group">
            <label className="edit-event-label">End Time *</label>
            <select
              className="edit-event-select"
              value={formData.endTime}
              onChange={(e) =>
                setFormData({ ...formData, endTime: e.target.value })
              }
            >
              {timeSlots.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </div>

          {/* Borrow Devices */}
          <div className="edit-event-form-group">
            <label className="edit-event-label">
              Borrow Devices (Optional)
            </label>

            {/* React-Select Multi */}
            <Select
              isMulti
              options={allDevices.map((d) => ({
                value: d.id,
                label: d.device.name,
              }))}
              value={formData.borrowedDevices
                .map((d) => {
                  const found = allDevices.find((x) => x.id === d.deviceId);
                  return found
                    ? { value: found.id, label: found.device.name }
                    : null;
                })
                .filter(Boolean)}
              onChange={(selectedOptions) => {
                const selectedDevices = selectedOptions.map((op) => {
                  const exists = formData.borrowedDevices.find(
                    (d) => d.deviceId === op.value
                  );
                  return exists
                    ? exists
                    : { deviceId: op.value, quantity: 1, notes: "" };
                });
                setFormData({ ...formData, borrowedDevices: selectedDevices });
              }}
              placeholder="Search and select devices..."
              classNamePrefix="react-select"
            />

            {/* Manual edit */}
            {formData.borrowedDevices.length > 0 &&
              formData.borrowedDevices.map((device, idx) => (
                <div
                  key={device.deviceId || idx}
                  style={{
                    display: "flex",
                    gap: "10px",
                    marginBottom: "10px",
                    marginTop: "10px",
                    alignItems: "center",
                  }}
                >
                  {/* Select device */}
                  <select
                    value={device.deviceId}
                    onChange={(e) =>
                      handleDeviceChange(idx, "deviceId", e.target.value)
                    }
                    style={{ flex: 1, padding: "8px", borderRadius: "4px" }}
                    disabled={loading}
                  >
                    <option value="">-- Select a device --</option>
                    {allDevices.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.device.name}
                      </option>
                    ))}
                  </select>

                  {/* Quantity */}
                  <input
                    type="number"
                    min={1}
                    value={device.quantity}
                    onChange={(e) =>
                      handleDeviceChange(
                        idx,
                        "quantity",
                        parseInt(e.target.value)
                      )
                    }
                    style={{ width: "80px", padding: "8px" }}
                    disabled={loading}
                  />

                  {/* Notes */}
                  <input
                    type="text"
                    value={device.notes}
                    onChange={(e) =>
                      handleDeviceChange(idx, "notes", e.target.value)
                    }
                    placeholder="Notes"
                    style={{ flex: 1, padding: "8px" }}
                    disabled={loading}
                  />

                  {/* Remove */}
                  <button
                    onClick={() => removeDevice(idx)}
                    style={{
                      backgroundColor: "#dc3545",
                      color: "white",
                      border: "none",
                      padding: "8px 12px",
                      borderRadius: "4px",
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}

            <button
              onClick={addDevice}
              style={{
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "4px",
                padding: "8px 16px",
                cursor: "pointer",

                marginTop:
                  formData.borrowedDevices.length > 0 ? "10px" : "10px",
              }}
              disabled={loading}
            >
              + Add Device
            </button>
          </div>

          {/* Start & End Time */}
        </div>

        {/* Footer */}
        <div className="edit-event-modal-footer">
          <button
            className="edit-event-update-btn"
            onClick={handleUpdateMeeting}
            disabled={loading}
          >
            {loading ? "Updating..." : "Save Changes"}
          </button>
          <button
            className="edit-event-cancel-btn"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
