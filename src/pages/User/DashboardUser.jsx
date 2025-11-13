import React, { useState, useEffect, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import viLocale from "@fullcalendar/core/locales/vi";
import "../../styles/DashboardUser.css";
import NavBar from "../../components/NavBar";
import SideBarUser from "../../components/SideBarUser";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function DashboardUser() {
  const calendarRef = useRef(null);
  const handleDateClick = (info) => {
    const title = prompt("Nhập tiêu đề sự kiện:");
    if (title) {
      setEvents([...events, { title, date: info.dateStr }]);
    }
  };
  const teamMembers = [
    { name: "QT", icon: "👤", color: "#3498db" },
    { name: "HT", icon: "👤", color: "#e74c3c" },
    { name: "LT", icon: "👤", color: "#2ecc71" },
    { name: "MT", icon: "👤", color: "#f39c12" },
    { name: "NT", icon: "👤", color: "#9b59b6" },
    { name: "V", icon: "👤", color: "#1abc9c" },
  ];

  const rooms = [
    { id: "101", name: "Phòng 101", color: "#3498db" },
    { id: "202", name: "Phòng 202", color: "#e74c3c" },
    { id: "303", name: "Phòng 303", color: "#2ecc71" },
    { id: "404", name: "Phòng 404", color: "#f39c12" },
  ];

  const [currentTime, setCurrentTime] = useState("");
  const [showMore, setShowMore] = useState(false);
  const [events, setEvents] = useState([
    {
      id: "1",
      title: "Họp team - Phòng 101",
      start: "2025-11-06T09:00:00",
      end: "2025-11-06T10:30:00",
      backgroundColor: "#3498db",
      borderColor: "#2980b9",
      extendedProps: {
        room: "101",
        organizer: "QT",
        participants: ["HT", "LT"],
      },
    },
    {
      id: "2",
      title: "Training - Phòng 202",
      start: "2025-11-06T14:00:00",
      end: "2025-11-06T16:00:00",
      backgroundColor: "#e74c3c",
      borderColor: "#c0392b",
      extendedProps: {
        room: "202",
        organizer: "MT",
        participants: ["NT", "V"],
      },
    },
    {
      id: "3",
      title: "Review dự án - Phòng 303",
      start: "2025-11-07T10:00:00",
      end: "2025-11-07T11:30:00",
      backgroundColor: "#2ecc71",
      borderColor: "#27ae60",
      extendedProps: {
        room: "303",
        organizer: "LT",
        participants: ["QT", "HT", "MT"],
      },
    },
  ]);

  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showNewEventModal, setShowNewEventModal] = useState(false);
  const [newEventData, setNewEventData] = useState({
    title: "",
    date: "",
    startTime: "09:00",
    endTime: "09:30",
    room: "101",
    description: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options = { weekday: "short", month: "short", day: "numeric" };
      setCurrentTime(
        `${now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })} - ${now.toLocaleDateString("vi-VN", options)}`
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleEventClick = (info) => {
    setSelectedEvent({
      id: info.event.id,
      title: info.event.title,
      start: info.event.start,
      end: info.event.end,
      ...info.event.extendedProps,
    });
    setShowEventModal(true);
  };

  const handleDateSelect = (selectInfo) => {
    const selectedDate = selectInfo.startStr.split("T")[0]; // Extract date part
    setNewEventData({
      ...newEventData,
      date: selectedDate,
      startTime: "09:00",
      endTime: "09:30",
    });
    setShowNewEventModal(true);
  };

  // Generate time slots (30-minute intervals for 24 hours)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, "0")}:${minute
          .toString()
          .padStart(2, "0")}`;
        slots.push(timeString);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const handleCreateEvent = async () => {
    if (!newEventData.title) {
      toast.error("Vui lòng nhập tiêu đề cuộc họp!");
      return;
    }

    if (!newEventData.date) {
      toast.error("Vui lòng chọn ngày!");
      return;
    }

    if (!newEventData.startTime || !newEventData.endTime) {
      toast.error("Vui lòng chọn thời gian bắt đầu và kết thúc!");
      return;
    }

    // Check if end time is after start time
    const startMinutes =
      parseInt(newEventData.startTime.split(":")[0]) * 60 +
      parseInt(newEventData.startTime.split(":")[1]);
    const endMinutes =
      parseInt(newEventData.endTime.split(":")[0]) * 60 +
      parseInt(newEventData.endTime.split(":")[1]);

    if (endMinutes <= startMinutes) {
      toast.error("Thời gian kết thúc phải sau thời gian bắt đầu!");
      return;
    }

    setLoading(true);

    try {
      const token =
        localStorage.getItem("accessToken");
      
      const username =
        localStorage.getItem("userName");
       

      // Combine date and time to create ISO strings
      const startDateTime = `${newEventData.date}T${newEventData.startTime}:00`;
      const endDateTime = `${newEventData.date}T${newEventData.endTime}:00`;

      const meetingData = {
        title: newEventData.title,
        roomId: newEventData.room,
        startTime: startDateTime,
        endTime: endDateTime,
        description: newEventData.description || "",
      };

      const response = await fetch("http://localhost:8080/api/meetings/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          createdBy: `${username}`,
        },
        body: JSON.stringify(meetingData),
      })

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create meeting");
      }

      const createdMeeting = await response.json();

      // Add new event to local state
      const room = rooms.find((r) => r.id === newEventData.room);
      const newEvent = {
        id: createdMeeting.id.toString(),
        title: `${newEventData.title} - ${room.name}`,
        start: startDateTime,
        end: endDateTime,
        backgroundColor: room.color,
        borderColor: room.color,
        extendedProps: {
          room: newEventData.room,
          description: newEventData.description,
        },
      };

      setEvents([...events, newEvent]);
      setShowNewEventModal(false);
      setNewEventData({
        title: "",
        date: "",
        startTime: "09:00",
        endTime: "09:30",
        room: "101",
        description: "",
      });

      toast.success("Đặt phòng thành công!");
    } catch (error) {
      console.error("Error creating meeting:", error);
      toast.error(
        error.message || "Có lỗi xảy ra khi đặt phòng. Vui lòng thử lại!"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = () => {
    if (selectedEvent) {
      setEvents(events.filter((e) => e.id !== selectedEvent.id));
      setShowEventModal(false);
      setSelectedEvent(null);
    }
  };

  const getBookedRooms = () => {
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const currentEvents = events.filter((e) => e.start.startsWith(today));
    return [...new Set(currentEvents.map((e) => e.extendedProps.room))];
  };

  const getAvailableRooms = () => {
    const booked = getBookedRooms();
    return rooms.filter((r) => !booked.includes(r.id));
  };

  const [activeMenuItem, setActiveMenuItem] = useState("meetting");
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <NavBar onToggleSidebar={toggleSidebar} />

      <div className="main-content">
        <SideBarUser
          activeItem={activeMenuItem}
          onItemClick={handleMenuClick}
          isOpen={sidebarOpen}
          onClose={closeSidebar}
        />
        <div className="navbar-right">
          <button
            className="meeting-btn"
            onClick={() => setShowNewEventModal(true)}
          >
            + Create a meeting
          </button>
        </div>
        <div className="main-inner-calender">
          <div className="calendar-container">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              locale="en"
              events={events}
              dateClick={handleDateClick}
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay",
              }}
              height="100%"
              contentHeight="auto"
              aspectRatio={1.8}
            />
          </div>

          <aside className="sidebar-user-calender">
            <div className="mini-calendar">
              <Calendar value={new Date()} locale="en-EN" />
            </div>

            {/* Thông tin phòng */}
            <h3 className="sidebar-title">Room Information</h3>
            <div className="room-box">
              <h4 className="room-box-title">Rooms Booked Today</h4>
              <ul className="room-list">
                {getBookedRooms().map((roomId, i) => {
                  const room = rooms.find((r) => r.id === roomId);
                  return (
                    <li key={i} className="room-item">
                      <span
                        className="room-dot"
                        style={{ backgroundColor: room.color }}
                      ></span>
                      {room.name}
                    </li>
                  );
                })}
                {getBookedRooms().length === 0 && (
                  <li className="room-item">No rooms booked yet</li>
                )}
              </ul>

              <h4 className="room-box-title" style={{ marginTop: 16 }}>
                Available Rooms Today
              </h4>
              <ul className="room-list">
                {getAvailableRooms().map((room, i) => (
                  <li key={i} className="room-item">
                    <span
                      className="room-dot"
                      style={{ backgroundColor: room.color }}
                    ></span>
                    {room.name}
                  </li>
                ))}
              </ul>

              <h4 className="room-box-title" style={{ marginTop: 16 }}>
                All Rooms
              </h4>
              <ul className="room-list">
                {rooms.map((room, i) => (
                  <li key={i} className="room-item">
                    <span
                      className="room-dot"
                      style={{ backgroundColor: room.color }}
                    ></span>
                    {room.name}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>

      {/* New Event Modal */}
      {showNewEventModal && (
        <div className="modal" onClick={() => setShowNewEventModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Book a room</h3>
            <div className="modal-body">
              <div className="form-group">
                <label className="label">Title:</label>
                <input
                  type="text"
                  className="input"
                  value={newEventData.title}
                  onChange={(e) =>
                    setNewEventData({ ...newEventData, title: e.target.value })
                  }
                  placeholder="VD: Họp team, Training..."
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label className="label">Description (optional):</label>
                <textarea
                  className="input"
                  rows="3"
                  value={newEventData.description || ""}
                  onChange={(e) =>
                    setNewEventData({
                      ...newEventData,
                      description: e.target.value,
                    })
                  }
                  placeholder="Mô tả chi tiết về cuộc họp..."
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label className="label">Invite users (Emails):</label>
                <textarea
                  className="input"
                  rows="2"
                  value={newEventData.inviteEmails || ""}
                  onChange={(e) =>
                    setNewEventData({
                      ...newEventData,
                      inviteEmails: e.target.value,
                    })
                  }
                  placeholder="Nhập email người được mời..."
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label className="label">Date:</label>
                <input
                  type="date"
                  className="input"
                  value={newEventData.date}
                  onChange={(e) =>
                    setNewEventData({ ...newEventData, date: e.target.value })
                  }
                  disabled={loading}
                  min={new Date().toISOString().split("T")[0]} // Không cho chọn ngày trong quá khứ
                />
              </div>

              <div className="form-group">
                <label className="label">Room:</label>
                <select
                  className="select"
                  value={newEventData.room}
                  onChange={(e) =>
                    setNewEventData({ ...newEventData, room: e.target.value })
                  }
                  disabled={loading}
                >
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="label">Time Start:</label>
                <select
                  className="select"
                  value={newEventData.startTime}
                  onChange={(e) =>
                    setNewEventData({
                      ...newEventData,
                      startTime: e.target.value,
                    })
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

              <div className="form-group">
                <label className="label">Time End:</label>
                <select
                  className="select"
                  value={newEventData.endTime}
                  onChange={(e) =>
                    setNewEventData({
                      ...newEventData,
                      endTime: e.target.value,
                    })
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
            </div>
            <div className="modal-footer">
              <button
                className="create-btn"
                onClick={handleCreateEvent}
                disabled={loading}
              >
                {loading ? "Đang tạo..." : "Tạo"}
              </button>
              <button
                className="close-btn"
                onClick={() => setShowNewEventModal(false)}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Event Detail Modal */}
      {showEventModal && selectedEvent && (
        <div className="modal" onClick={() => setShowEventModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Chi tiết cuộc họp</h3>
            <div className="modal-body">
              <p>
                <strong>Tiêu đề:</strong> {selectedEvent.title}
              </p>
              <p>
                <strong>Phòng:</strong>{" "}
                {rooms.find((r) => r.id === selectedEvent.room)?.name}
              </p>
              <p>
                <strong>Thời gian:</strong>{" "}
                {new Date(selectedEvent.start).toLocaleString("vi-VN")} -{" "}
                {new Date(selectedEvent.end).toLocaleString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              {selectedEvent.description && (
                <p>
                  <strong>Mô tả:</strong> {selectedEvent.description}
                </p>
              )}
            </div>
            <div className="modal-footer">
              <button className="delete-btn" onClick={handleDeleteEvent}>
                Xóa
              </button>
              <button
                className="close-btn"
                onClick={() => setShowEventModal(false)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
