import React, { useState, useEffect, use } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import "../../styles/User/CreateNewEvent.css";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import Select from "react-select";

export default function CreateNewEvent({
  isOpen,
  onClose,
  rooms,
  onSuccess,
  loading,
  prefill = { date: "", startTime: "07:00", endTime: "07:30" },
}) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    startTime: "07:00",
    endTime: "07:30",
    roomId: "",
    participants: [{ email: "", role: "REQUIRED" }],
    borrowedDevices: [],
  });

  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomDevices, setRoomDevices] = useState([]);
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [allDevices, setAllDevices] = useState([]);

  useEffect(() => {
    if (formData.roomId) {
      fetchRoomDevices(formData.roomId);
      const room = rooms.find((r) => r.id === formData.roomId);
      setSelectedRoom(room);
    }
  }, [formData.roomId]);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      date: prefill.date,
      startTime: prefill.startTime,
      endTime: prefill.endTime,
    }));
  }, [prefill]);

  useEffect(() => {
    fetchAllDevices();
  }, []);

  const fetchRoomDevices = async (roomId) => {
    try {
      const response = await axios.get(
        `http://localhost:8080/api/meetings/rooms/${roomId}/devices`
      );
      setRoomDevices(response.data || []);
    } catch (error) {
      console.error("Error fetching room devices:", error);
    }
  };

  const fetchAllDevices = async () => {
    try {
      const response = await axios.get(
        'http://localhost:8080/api/meetings/devices/active'
      );
      setAllDevices(response.data || []);
    } catch (error) {
      console.error("Error fetching devices:", error);
    }
  };

  const handleSearchEmail = async (value) => {
    setSearchEmail(value);
    if (value.length > 3) {
      try {
        const response = await axios.get(
          `http://localhost:8080/api/meetings/users/search?email=${value}`
        );
        setSearchResults(response.data || []);
      } catch (error) {
        console.error("Error searching users:", error);
      }
    } else {
      setSearchResults([]);
    }
  };

  const addParticipant = (user) => {
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

  const handleSubmit = async () => {
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

      const room = rooms.find((r) => r.id === formData.roomId);
      const roomName = room ? room.name : "";

      const meetingData = {
        title: formData.title,
        description: formData.description,
        startTime: startDateTime,
        endTime: endDateTime,
        roomId: formData.roomId,
        participants: formData.participants.filter((p) => p.email),
        borrowedDevices: formData.borrowedDevices.filter((d) => d.deviceId),
      };

      const token = localStorage.getItem("accessToken");
      const userId = localStorage.getItem("userId");
      const userEmail = localStorage.getItem("userEmail");
      const userName = localStorage.getItem("userName");

      const response = await axios.post(
        "http://localhost:8080/api/meetings/createMeeting",
        meetingData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            userId: userId,
          },
        }
      );

      try {
        await axios.post("https://n8n.quanliduan-pms.site/webhook/send-email", {
          ...meetingData,
          meetingId: response.data.data?.meetingId,
          createdBy: userName,
          createdByEmail: userEmail,
          roomName: roomName,
        });
      } catch (emailError) {
        console.error("Error sending email:", emailError);
      }

      toast.success("Meeting booked successfully!");
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (error) {
      console.error("Error creating meeting:", error);
      toast.error(
        error.response?.data?.message || "An error occurred. Please try again!"
      );
    }
  };

  if (!isOpen) return null;

  const timeSlots = generateTimeSlots();

  return (
    <div className="modal" onClick={onClose}>
      <ToastContainer
        position="top-right"
        style={{ top: "70px" }}
        autoClose={1200}
      />
      <div
        className="create-event-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="create-event-modal-title">Book a Meeting Room</h3>
        <div
          className="create-event-modal-body"
          style={{ maxHeight: "70vh", overflowY: "auto" }}
        >
          {/* Title */}
          <div className="create-event-form-group">
            <label className="create-event-label">
              Title <span class="create-meeting-important">*</span>{" "}
            </label>
            <input
              type="text"
              className="create-event-input"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="e.g., Team Meeting, Training..."
              disabled={loading}
            />
          </div>

          {/* Description */}
          <div className="create-event-form-group">
            <label className="create-event-label">Description (optional)</label>
            <div className="ckeditor-wrapper">
              <CKEditor
                editor={ClassicEditor}
                data={formData.description}
                onReady={(editor) => {
                  //   // Lưu editor instance để dùng sau (nếu cần)
                  //   console.log("Editor is ready!", editor);
                }}
                onChange={(event, editor) => {
                  const data = editor.getData();
                  setFormData({ ...formData, description: data });
                }}
                onBlur={(event, editor) => {}}
                onFocus={(event, editor) => {
                  editor.editing.view.focus();
                }}
                config={{
                  toolbar: [
                    "heading",
                    "|",
                    "bold",
                    "italic",
                    "link",
                    "bulletedList",
                    "numberedList",
                    "|",
                    "fontColor",
                    "fontBackgroundColor",
                    "|",
                    "outdent",
                    "indent",
                    "|",
                    "blockQuote",
                    "insertTable",
                    "undo",
                    "redo",
                  ],
                  placeholder: "Detailed description of the meeting...",
                }}
                disabled={loading}
              />
            </div>
          </div>

          {/* Date */}
          <div className="create-event-form-group">
            <label className="create-event-label">
              Date <span class="create-meeting-important">*</span>
            </label>
            <input
              type="date"
              className="create-event-input"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              disabled={loading}
              min={new Date().toISOString().split("T")[0]}
            />
          </div>

          {/* Room */}
          <div className="create-event-form-group">
            <label className="create-event-label">
              Room <span class="create-meeting-important">*</span>
            </label>
            <select
              className="create-event-select"
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
              className="create-event-form-group"
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



          {/* Start Time */}
          <div className="create-event-form-group">
            <label className="create-event-label">
              Start Time <span class="create-meeting-important">*</span>
            </label>
            <select
              className="create-event-select"
              value={formData.startTime}
              onChange={(e) =>
                setFormData({ ...formData, startTime: e.target.value })
              }
              disabled={loading}
            >
              {timeSlots.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </div>

          {/* End Time */}
          <div className="create-event-form-group">
            <label className="create-event-label">
              End Time <span class="create-meeting-important">*</span>
            </label>
            <select
              className="create-event-select"
              value={formData.endTime}
              onChange={(e) =>
                setFormData({ ...formData, endTime: e.target.value })
              }
              disabled={loading}
            >
              {timeSlots.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </div>

          {/* Participants */}
          <div className="create-event-form-group">
            <label className="create-event-label">Invite People (Email)</label>
            <div
              style={{
                position: "relative",
                marginBottom: "10px",
              }}
            >
              <input
                type="text"
                className="create-event-input"
                value={searchEmail}
                onChange={(e) => handleSearchEmail(e.target.value)}
                placeholder="Enter email of invited..."
                disabled={loading}
              />
              {searchResults.length > 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    backgroundColor: "white",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    zIndex: 10,
                    maxHeight: "200px",
                    overflowY: "auto",
                  }}
                >
                  {searchResults.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => addParticipant(user)}
                      style={{
                        padding: "10px",
                        borderBottom: "1px solid #eee",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          backgroundColor: "#007bff",
                          color: "white",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "12px",
                        }}
                      >
                        {user.name?.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: "500" }}>{user.name}</div>
                        <div style={{ fontSize: "12px", color: "#666" }}>
                          {user.email}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Participants List */}
            <div style={{ marginTop: "10px" }}>
              {formData.participants.map(
                (participant, idx) =>
                  participant.email && (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "8px",
                        backgroundColor: "#e7f3ff",
                        borderRadius: "4px",
                        marginBottom: "5px",
                      }}
                    >
                      <span>{participant.email} </span>
                      <div>
                        <select
                          value={participant.role}
                          onChange={(e) => {
                            const newParticipants = [...formData.participants];
                            newParticipants[idx].role = e.target.value;
                            setFormData({
                              ...formData,
                              participants: newParticipants,
                            });
                          }}
                          style={{
                            marginLeft: "10px",
                            marginRight: "10px",
                            padding: "4px",
                            gap: "10px",
                          }}
                          className="create-event-select-role"
                        >
                          <option value="REQUIRED">Required</option>
                          <option value="OPTIONAL">Optional</option>
                        </select>
                        <button
                          onClick={() => removeParticipant(idx)}
                          style={{
                            backgroundColor: "#dc3545",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            padding: "4px 8px",
                            cursor: "pointer",
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )
              )}
            </div>
          </div>

          {/* Borrowed Devices */}
          <div className="create-event-form-group">
            <label className="create-event-label">
              Borrow Devices (Optional)
            </label>

            {formData.borrowedDevices.length > 0 && (
              <>
                {formData.borrowedDevices.map((device, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      gap: "10px",
                      marginBottom: "10px",
                      alignItems: "center",
                    }}
                  >
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

                    <input
                      type="number"
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
              </>
            )}

            <button
              onClick={addDevice}
              style={{
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "4px",
                padding: "8px 16px",
                cursor: "pointer",
                marginTop: formData.borrowedDevices.length > 0 ? "10px" : "0",
              }}
              disabled={loading}
            >
              + Add Device
            </button>
          </div>
        </div>

        <div className="create-event-modal-footer">
          <button
            className="create-event-create-btn"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Meeting"}
          </button>
          <button
            className="create-event-close-btn"
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
