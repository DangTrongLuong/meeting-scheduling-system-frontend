import React, { useState, useEffect, useRef } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import "../../styles/User/CreateNewEvent.css";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";

const WEEKDAYS = [
  { id: 1, label: "Monday", dayNum: 1, value: "MONDAY" },
  { id: 2, label: "Tuesday", dayNum: 2, value: "TUESDAY" },
  { id: 3, label: "Wednesday", dayNum: 3, value: "WEDNESDAY" },
  { id: 4, label: "Thursday", dayNum: 4, value: "THURSDAY" },
  { id: 5, label: "Friday", dayNum: 5, value: "FRIDAY" },
  { id: 6, label: "Saturday", dayNum: 6, value: "SATURDAY" },
];

export default function CreateNewEvent({
  isOpen,
  onClose,
  rooms,
  onSuccess,
  loading,
  prefill = { date: "", startTime: "07:00", endTime: "07:30" },
}) {
  const today = new Date().toISOString().split("T")[0];
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: today,
    startTime: "07:00",
    endTime: "07:30",
    roomId: "",
    participants: [],
    borrowedDevices: [],
    isRepeat: false,
    repeatDays: [],
  });

  const [repeatConfig, setRepeatConfig] = useState({
    type: "none",
    weeks: 1,
    customStartDate: "",
    customEndDate: "",
  });
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomDevices, setRoomDevices] = useState([]);
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [allDevices, setAllDevices] = useState([]);
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showRepeatDropdown, setShowRepeatDropdown] = useState(false);
  const [inputTimeMode, setInputTimeMode] = useState(false);
  const dropdownRef = useRef(null);
  const repeatDropdownRef = useRef(null);

  const filteredRooms = rooms.filter((room) =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleSelect = (roomId) => {
    setFormData({ ...formData, roomId });
    setOpen(false);
    setSearchTerm("");
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        slots.push(
          `${hour.toString().padStart(2, "0")}:${minute
            .toString()
            .padStart(2, "0")}`,
        );
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  /**
   * Lấy tuần của ngày được chọn (date param)
   * Trả về object với key = dayName, value = date string
   */
  const getWeekDatesForDate = (dateString) => {
    const selectedDate = new Date(dateString);
    const currentDayOfWeek = selectedDate.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat

    // Tính Monday của tuần chứa ngày được chọn
    const monday = new Date(selectedDate);
    monday.setDate(selectedDate.getDate() - (currentDayOfWeek - 1));

    const dates = {};
    for (let i = 0; i < 6; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dayName = WEEKDAYS[i].value;
      dates[dayName] = d.toISOString().split("T")[0];
    }
    return dates;
  };

  // Lấy dates dựa vào date hiện tại trong form
  const weekDates = getWeekDatesForDate(formData.date);

  /**
   * Kiểm tra ngày có trong quá khứ không
   * So với hôm nay (today)
   */
  const isPastDate = (dateString) => {
    const selectedDate = new Date(dateString);
    const todayDate = new Date(today);
    return selectedDate < todayDate;
  };

  const handleToggleRepeatDay = (dayValue) => {
    const dateString = weekDates[dayValue];

    // Kiểm tra nếu ngày đó đã qua
    if (isPastDate(dateString)) {
      toast.error(`Cannot select ${dayValue} - it's already passed`);
      return;
    }

    setFormData((prev) => {
      const updated = prev.repeatDays.includes(dayValue)
        ? prev.repeatDays.filter((d) => d !== dayValue)
        : [...prev.repeatDays, dayValue];
      return { ...prev, repeatDays: updated };
    });
  };

  const handleSelectAllDays = () => {
    // Lọc chỉ những ngày chưa qua
    const availableDays = WEEKDAYS.filter(
      (d) => !isPastDate(weekDates[d.value]),
    ).map((d) => d.value);

    if (availableDays.length === 0) {
      toast.error("All days in this week have already passed");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      repeatDays:
        prev.repeatDays.length === availableDays.length ? [] : availableDays,
    }));
  };

  // Kiểm tra ngày bị disable
  const isDateDisabled = (dayValue) => {
    return isPastDate(weekDates[dayValue]);
  };

  // Reset repeatDays khi chuyển date
  useEffect(() => {
    // Khi date thay đổi, reset repeatDays để tránh conflicts
    setFormData((prev) => ({
      ...prev,
      repeatDays: [],
    }));
  }, [formData.date]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
      if (
        repeatDropdownRef.current &&
        !repeatDropdownRef.current.contains(e.target)
      ) {
        setShowRepeatDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (formData.roomId) {
      fetchRoomDevices(formData.roomId);
      const room = rooms.find((r) => r.id === formData.roomId);
      setSelectedRoom(room);
    }
  }, [formData.roomId]);

  useEffect(() => {
    if (isOpen && prefill.startTime && prefill.endTime) {
      setFormData((prev) => ({
        ...prev,
        date: prefill.date || today,
        startTime: prefill.startTime,
        endTime: prefill.endTime,
      }));
    }
  }, [prefill, isOpen]);

  useEffect(() => {
    fetchAllDevices();
  }, []);

  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setFormData({
          title: "",
          description: "",
          date: today,
          startTime: "07:00",
          endTime: "07:30",
          roomId: "",
          participants: [],
          borrowedDevices: [],
          isRepeat: false,
          repeatDays: [],
        });
        setRepeatConfig({
          type: "none",
          weeks: 1,
          endMonths: 1,
          customDays: [],
        });
        setSelectedRoom(null);
        setRoomDevices([]);
        setSearchEmail("");
        setSearchResults([]);
        setInputTimeMode(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, today]);

  const fetchRoomDevices = async (roomId) => {
    try {
      const response = await axios.get(
        `http://localhost:8080/api/meetings/rooms/${roomId}/devices`,
      );
      setRoomDevices(response.data || []);
    } catch (error) {
      console.error("Error fetching room devices:", error);
    }
  };

  const fetchAllDevices = async () => {
    try {
      const response = await axios.get(
        "http://localhost:8080/api/meetings/devices/active",
      );
      setAllDevices(response.data || []);
    } catch (error) {
      console.error("Error fetching devices:", error);
    }
  };

  const currentEmailLocal = localStorage.getItem("userEmail") || "";
  const handleSearchEmail = async (value) => {
    setSearchEmail(value);
    if (value.length > 3) {
      try {
        const response = await axios.get(
          `http://localhost:8080/api/meetings/users/search?email=${value}`,
        );
        const currentEmail = currentEmailLocal;
        setSearchResults(
          (response.data || []).filter(
            (u) => u.email?.toLowerCase() !== currentEmail.toLowerCase(),
          ),
        );
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

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      date: today,
      startTime: "07:00",
      endTime: "07:30",
      roomId: "",
      participants: [],
      borrowedDevices: [],
      isRepeat: false,
      repeatDays: [],
    });
    setSelectedRoom(null);
    setRoomDevices([]);
    setSearchEmail("");
    setSearchResults([]);
  };

  // ===== THAY ĐỔI 1: Sửa handleSubmit =====
  const handleSubmit = async () => {
    // Basic validation
    if (!formData.title.trim()) {
      toast.error("Please enter a meeting title!");
      return;
    }

    if (!formData.date) {
      toast.error("Please select a date!");
      return;
    }
    if (!formData.roomId) {
      toast.error("Please select a meeting room!");
      return;
    }

    // Time format validation
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(formData.startTime)) {
      toast.error("Invalid start time format (HH:MM)");
      return;
    }
    if (!timeRegex.test(formData.endTime)) {
      toast.error("Invalid end time format (HH:MM)");
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

    // === CALCULATE REPEAT END DATE (repeatUntilDate) ===
    let repeatUntilDate = null; // yyyy-MM-dd - highest priority for backend
    let repeatType = null;
    let repeatDays = null;

    if (repeatConfig.type !== "none") {
      let endDateObj;

      if (repeatConfig.type === "custom") {
        if (!repeatConfig.customEndDate) {
          toast.error("Please select an end date for custom repeat");
          return;
        }
        if (repeatConfig.customDays.length === 0) {
          toast.error("Please select at least one day of the week to repeat");
          return;
        }

        endDateObj = new Date(repeatConfig.customEndDate);
        repeatType = "CUSTOM";
        repeatDays = repeatConfig.customDays;
      } else {
        // Daily or Weekly: calculate end date from number of weeks
        if (repeatConfig.weeks < 1 || repeatConfig.weeks > 36) {
          toast.error("Number of weeks must be between 1 and 36");
          return;
        }

        endDateObj = new Date(formData.date);
        endDateObj.setDate(endDateObj.getDate() + repeatConfig.weeks * 7);

        if (repeatConfig.type === "daily") {
          repeatType = "DAILY";

          repeatDays = [
            "MONDAY",
            "TUESDAY",
            "WEDNESDAY",
            "THURSDAY",
            "FRIDAY",
            "SATURDAY",
          ];
        } else if (repeatConfig.type === "weekly") {
          repeatType = "WEEKLY";
        }
      }

      const startDateObj = new Date(formData.date);
      if (endDateObj < startDateObj) {
        toast.error("Repeat end date must be on or after the start date");
        return;
      }

      repeatUntilDate = endDateObj.toISOString().split("T")[0];
    }

    // === BUILD PAYLOAD ===
    const meetingData = {
      title: formData.title.trim(),
      description: formData.description || "",
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      roomId: formData.roomId,
      participants: formData.participants,
      borrowedDevices: formData.borrowedDevices.filter(
        (d) => d.deviceId && d.quantity > 0,
      ),

      // Send repeat fields only if repeat is enabled
      ...(repeatConfig.type !== "none" && {
        repeatType: repeatType,
        repeatUntilDate: repeatUntilDate,
        ...(repeatType === "CUSTOM" && { repeatDays: repeatDays }),
        ...(repeatType === "DAILY" && { repeatDays: repeatDays }),
      }),
    };

    try {
      const token = localStorage.getItem("accessToken");
      const userId = localStorage.getItem("userId");

      await axios.post("http://localhost:8080/api/meetings", meetingData, {
        headers: {
          Authorization: `Bearer ${token}`,
          userId: userId,
        },
      });

      let estimatedCount = 1;
      if (repeatConfig.type !== "none") {
        const start = new Date(formData.date);
        const end = new Date(repeatUntilDate || formData.date);
        const daysDiff = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;

        if (repeatConfig.type === "daily") {
          // Tính số ngày làm việc (loại bỏ Chủ nhật)
          estimatedCount = 0;
          for (let i = 0; i < daysDiff; i++) {
            const checkDate = new Date(start);
            checkDate.setDate(checkDate.getDate() + i);
            const dayOfWeek = checkDate.getDay();
            // 0 = Sunday, 6 = Saturday
            if (dayOfWeek !== 0) {
              estimatedCount++;
            }
          }
        } else if (repeatConfig.type === "weekly") {
          estimatedCount = repeatConfig.weeks;
        } else if (repeatConfig.type === "custom") {
          estimatedCount = "multiple";
        }
      }

      toast.success(
        repeatConfig.type === "none"
          ? "Meeting booked successfully! "
          : estimatedCount === "multiple"
            ? "Multiple recurring meetings created successfully! "
            : `${estimatedCount} meeting(s) booked successfully! `,
      );

      // Reset form and state
      resetForm();
      setRepeatConfig({
        type: "none",
        weeks: 1,
        customStartDate: "",
        customEndDate: "",
        customDays: [],
      });

      onSuccess(); // Refresh calendar
      onClose(); // Close modal
    } catch (error) {
      console.error("Error creating meeting:", error);
      const msg =
        error.response?.data?.message ||
        "Failed to create meeting. The room may already be booked or there was a system error.";
      toast.error(msg);
    }
  };

  if (!isOpen) return null;

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
              Title <span className="create-meeting-important">*</span>
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
                onChange={(event, editor) => {
                  const data = editor.getData();
                  setFormData({ ...formData, description: data });
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
              Date <span className="create-meeting-important">*</span>
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
          <div className="custom-select-container" ref={dropdownRef}>
            <label className="create-event-label">
              Room <span className="create-meeting-important">*</span>
            </label>
            <div className="custom-select" onClick={() => setOpen(!open)}>
              <span className="selected-value">
                {formData.roomId
                  ? rooms.find((r) => r.id === formData.roomId)?.name
                  : "Select a room"}
              </span>
              <span className="arrow">{open ? "▲" : "▼"}</span>
            </div>

            {open && (
              <div className="dropdown">
                <input
                  type="text"
                  placeholder="Search room..."
                  className="dropdown-search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <ul className="dropdown-list">
                  {filteredRooms.length > 0 ? (
                    filteredRooms.map((room) => (
                      <li
                        key={room.id}
                        onClick={() => handleSelect(room.id)}
                        className="dropdown-item"
                      >
                        {room.name}
                      </li>
                    ))
                  ) : (
                    <li className="dropdown-item no-result">No rooms found</li>
                  )}
                </ul>
              </div>
            )}
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

          {/* Time Input Mode Toggle */}
          <div style={{ marginBottom: "15px" }}>
            <label style={{ fontSize: "12px", color: "#666" }}>
              <input
                type="checkbox"
                checked={inputTimeMode}
                onChange={(e) => setInputTimeMode(e.target.checked)}
                style={{ marginRight: "8px" }}
              />
              Free time input (disable dropdown)
            </label>
          </div>

          {/* Start Time */}
          <div className="create-event-form-group">
            <label className="create-event-label">
              Start Time <span className="create-meeting-important">*</span>
            </label>
            {!inputTimeMode ? (
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
            ) : (
              <input
                type="time"
                className="create-event-input"
                value={formData.startTime}
                onChange={(e) =>
                  setFormData({ ...formData, startTime: e.target.value })
                }
                disabled={loading}
                style={{
                  padding: "8px 12px",
                  fontSize: "14px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                }}
              />
            )}
          </div>

          {/* End Time */}
          <div className="create-event-form-group">
            <label className="create-event-label">
              End Time <span className="create-meeting-important">*</span>
            </label>
            {!inputTimeMode ? (
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
            ) : (
              <input
                type="time"
                className="create-event-input"
                value={formData.endTime}
                onChange={(e) =>
                  setFormData({ ...formData, endTime: e.target.value })
                }
                disabled={loading}
                style={{
                  padding: "8px 12px",
                  fontSize: "14px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                }}
              />
            )}
          </div>

          {/* REPEAT SELECTOR */}
          <div className="create-event-repeat-group">
            <label className="create-event-repeat-label">Repeat</label>

            <div style={{ position: "relative" }}>
              <button
                type="button"
                className="create-event-repeat-trigger"
                onClick={() => setShowRepeatDropdown(!showRepeatDropdown)}
              >
                <span className="create-event-repeat-trigger-text">
                  {repeatConfig.type === "none" && "Does not repeat"}
                  {repeatConfig.type === "daily" &&
                    `Daily for ${repeatConfig.weeks} week${
                      repeatConfig.weeks > 1 ? "s" : ""
                    }`}
                  {repeatConfig.type === "weekly" &&
                    `Repeat every day from this day for ${
                      repeatConfig.weeks
                    } week${repeatConfig.weeks > 1 ? "s" : ""}`}
                  {repeatConfig.type === "custom" &&
                    `Custom from ${
                      repeatConfig.customStartDate || formData.date
                    } to ${repeatConfig.customEndDate || "no end"}`}
                </span>
                <span className="create-event-repeat-trigger-icon">▼</span>
              </button>

              {showRepeatDropdown && (
                <div
                  ref={repeatDropdownRef}
                  className="create-event-repeat-dropdown"
                >
                  <div
                    className="create-event-repeat-option"
                    onClick={() => {
                      setRepeatConfig({
                        type: "none",
                        weeks: 1,
                        customStartDate: "",
                        customEndDate: "",
                      });
                      setShowRepeatDropdown(false);
                    }}
                  >
                    Does not repeat
                  </div>

                  <div
                    className="create-event-repeat-option"
                    onClick={() => {
                      setRepeatConfig((prev) => ({ ...prev, type: "daily" }));
                      setShowRepeatDropdown(false);
                    }}
                  >
                    Daily (Mon–Sun)
                  </div>

                  {/* <div className="create-event-weekly-box create-event-repeat-option">
                    <div className="create-event-weekly-title">
                      Repeat every day from this day (Mon–Sat)
                    </div>
                    <div className="create-event-weekly-input-group">
                      <span>for</span>
                      <input
                        type="number"
                        min="1"
                        max="36"
                        value={repeatConfig.weeks}
                        onChange={(e) =>
                          setRepeatConfig((prev) => ({
                            ...prev,
                            weeks: Math.max(
                              1,
                              Math.min(36, parseInt(e.target.value) || 1)
                            ),
                          }))
                        }
                        onClick={(e) => e.stopPropagation()}
                        className="create-event-weekly-input"
                      />
                      <span>weeks (max 36)</span>
                    </div>
                    <button
                      className="create-event-apply-weekly-btn"
                      onClick={() => {
                        setRepeatConfig((prev) => ({
                          ...prev,
                          type: "weekly",
                        }));
                        setShowRepeatDropdown(false);
                      }}
                    >
                      Apply
                    </button>
                  </div> */}

                  <div
                    className="create-event-repeat-option"
                    onClick={() => {
                      setRepeatConfig((prev) => ({
                        ...prev,
                        type: "custom",
                        customStartDate: formData.date, // mặc định từ ngày gốc
                        customEndDate: "",
                      }));
                      setShowRepeatDropdown(false);
                    }}
                  >
                    Custom date range...
                  </div>
                </div>
              )}
            </div>

            {/* Cho Daily và Weekly: chọn số tuần */}
            {(repeatConfig.type === "daily" ||
              repeatConfig.type === "weekly") && (
              <div className="create-event-end-after-box">
                <label className="create-event-end-after-label">
                  Repeat for:
                </label>
                <select
                  value={repeatConfig.weeks}
                  onChange={(e) =>
                    setRepeatConfig((prev) => ({
                      ...prev,
                      weeks: parseInt(e.target.value),
                    }))
                  }
                  className="create-event-end-after-select"
                >
                  {Array.from({ length: 36 }, (_, i) => i + 1).map((w) => (
                    <option key={w} value={w}>
                      {w} week{w > 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
                <small className="create-event-end-after-note">
                  Maximum 36 weeks
                </small>
              </div>
            )}

            {/* Cho Custom: chọn từ ngày đến ngày */}
            {repeatConfig.type === "custom" && (
              <div className="create-event-end-after-box">
                <label className="create-event-end-after-label">
                  Repeat from - to:
                </label>
                <div style={{ display: "flex", gap: "10px" }}>
                  <input
                    type="date"
                    value={repeatConfig.customStartDate || formData.date}
                    min={formData.date}
                    onChange={(e) =>
                      setRepeatConfig((prev) => ({
                        ...prev,
                        customStartDate: e.target.value,
                      }))
                    }
                    className="create-event-end-after-select"
                  />
                  <input
                    type="date"
                    value={repeatConfig.customEndDate}
                    min={repeatConfig.customStartDate || formData.date}
                    onChange={(e) =>
                      setRepeatConfig((prev) => ({
                        ...prev,
                        customEndDate: e.target.value,
                      }))
                    }
                    className="create-event-end-after-select"
                  />
                </div>
                <small className="create-event-end-after-note">
                  Choose an end date (up to 2 months from the start date)
                </small>
              </div>
            )}

            {/* Custom days selection - giữ nguyên như cũ */}
            {repeatConfig.type === "custom" && (
              <div className="create-event-custom-days-box">
                <p className="create-event-custom-days-title">
                  Select days to repeat:
                </p>
                <div className="create-event-custom-days-grid">
                  {WEEKDAYS.map((day) => (
                    <button
                      key={day.value}
                      type="button"
                      className={`create-event-custom-day-btn ${
                        repeatConfig.customDays.includes(day.value)
                          ? "selected"
                          : ""
                      }`}
                      onClick={() =>
                        setRepeatConfig((prev) => ({
                          ...prev,
                          customDays: prev.customDays.includes(day.value)
                            ? prev.customDays.filter((d) => d !== day.value)
                            : [...prev.customDays, day.value],
                        }))
                      }
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Participants */}
          <div className="create-event-form-group">
            <label className="create-event-label">Invite People (Email)</label>
            <div style={{ position: "relative", marginBottom: "10px" }}>
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
                      <span>{participant.email}</span>
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
                  ),
              )}
            </div>
          </div>

          {/* Borrowed Devices */}
          {/* <div className="create-event-form-group">
            <label className="create-event-label">
              Request more devices (Optional)
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
          </div> */}
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
