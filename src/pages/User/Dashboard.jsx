import React, { useState, useEffect, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import viLocale from "@fullcalendar/core/locales/vi";
import "../../styles/Dashboard.css";
import NavBar from "../../components/NavBar";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

export default function Dashboard() {
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
    start: "",
    end: "",
    room: "101",
    organizer: "QT",
    participants: [],
  });

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
    setNewEventData({
      ...newEventData,
      start: selectInfo.startStr,
      end: selectInfo.endStr,
    });
    setShowNewEventModal(true);
  };

  const handleCreateEvent = () => {
    if (!newEventData.title) {
      alert("Vui lòng nhập tiêu đề cuộc họp!");
      return;
    }

    const room = rooms.find((r) => r.id === newEventData.room);
    const newEvent = {
      id: Date.now().toString(),
      title: `${newEventData.title} - ${room.name}`,
      start: newEventData.start,
      end: newEventData.end,
      backgroundColor: room.color,
      borderColor: room.color,
      extendedProps: {
        room: newEventData.room,
        organizer: newEventData.organizer,
        participants: newEventData.participants,
      },
    };

    setEvents([...events, newEvent]);
    setShowNewEventModal(false);
    setNewEventData({
      title: "",
      start: "",
      end: "",
      room: "101",
      organizer: "QT",
      participants: [],
    });
  };

  const handleDeleteEvent = () => {
    if (selectedEvent) {
      setEvents(events.filter((e) => e.id !== selectedEvent.id));
      setShowEventModal(false);
      setSelectedEvent(null);
    }
  };

  const toggleParticipant = (member) => {
    const participants = newEventData.participants || [];
    if (participants.includes(member)) {
      setNewEventData({
        ...newEventData,
        participants: participants.filter((p) => p !== member),
      });
    } else {
      setNewEventData({
        ...newEventData,
        participants: [...participants, member],
      });
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
  return (
    <div className="dashboard">
      {/* Navbar */}
      <NavBar />
      {/* <div className="navbar">
  <div className="navbar-left">
    <div className="time-display">{currentTime}</div>
    <div className="team-box">
      {teamMembers.slice(0, 4).map((m, i) => (
        <div key={i} className="avatar" style={{ backgroundColor: m.color }}>
          {m.icon}
        </div>
      ))}
      {teamMembers.length > 4 && (
        <div
          className="more-box"
          onMouseEnter={() => setShowMore(true)}
          onMouseLeave={() => setShowMore(false)}
        >
          ⋯
          {showMore && (
            <div className="more-popup">
              {teamMembers.slice(4).map((m, i) => (
                <div key={i} className="popup-item">
                  <span
                    className="avatar"
                    style={{ backgroundColor: m.color, width: 32, height: 32 }}
                  >
                    {m.icon}
                  </span>
                  <span className="popup-name">{m.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  </div>
  <div className="navbar-right">
    <button className="meeting-btn" onClick={() => setShowNewEventModal(true)}>
      + Đặt phòng
    </button>
    <div className="mail-icon">📩</div>
    <div className="profile-circle">👤</div>
  </div>
</div> */}

  <div className="navbar-right">
    <button className="meeting-btn" onClick={() => setShowNewEventModal(true)}>
      + Đặt phòng
    </button>
    {/*<div className="mail-icon">📩</div>
    <div className="profile-circle">👤</div>*/}
  </div>
  
      {/* Content */}

      <div className="content">
        {/* Sidebar */}

        <aside className="sidebar">
          {/* Lịch tháng nhỏ */}
          <div className="mini-calendar">
            <Calendar
              value={new Date()} // giá trị mặc định là hôm nay
              locale="vi-VN" // ngôn ngữ tiếng Việt
            />
          </div>

          {/* Thông tin phòng */}
          <h3 className="sidebar-title">Thông tin phòng</h3>
          <div className="room-box">
            <h4 className="room-box-title">Phòng đã đặt hôm nay</h4>
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
                <li className="room-item">Chưa có phòng nào được đặt</li>
              )}
            </ul>

            <h4 className="room-box-title" style={{ marginTop: 16 }}>
              Phòng trống hôm nay
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
              Danh sách phòng
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

        {/* Calendar */}
        <div className="calendar-container">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            locale={viLocale}
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
      </div>

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
              <p>
                <strong>Người tổ chức:</strong> {selectedEvent.organizer}
              </p>
              <p>
                <strong>Người tham gia:</strong>{" "}
                {selectedEvent.participants?.join(", ") || "Không có"}
              </p>
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

      {/* New Event Modal */}
      {showNewEventModal && (
        <div className="modal" onClick={() => setShowNewEventModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Đặt phòng họp mới</h3>
            <div className="modal-body">
              <div className="form-group">
                <label className="label">Tiêu đề cuộc họp:</label>
                <input
                  type="text"
                  className="input"
                  value={newEventData.title}
                  onChange={(e) =>
                    setNewEventData({ ...newEventData, title: e.target.value })
                  }
                  placeholder="VD: Họp team, Training..."
                />
              </div>

              <div className="form-group">
                <label className="label">Phòng:</label>
                <select
                  className="select"
                  value={newEventData.room}
                  onChange={(e) =>
                    setNewEventData({ ...newEventData, room: e.target.value })
                  }
                >
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="label">Người tổ chức:</label>
                <select
                  className="select"
                  value={newEventData.organizer}
                  onChange={(e) =>
                    setNewEventData({
                      ...newEventData,
                      organizer: e.target.value,
                    })
                  }
                >
                  {teamMembers.map((member) => (
                    <option key={member.name} value={member.name}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="label">Người tham gia:</label>
                <div className="participant-list">
                  {teamMembers.map((member) => (
                    <label key={member.name} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={newEventData.participants?.includes(
                          member.name
                        )}
                        onChange={() => toggleParticipant(member.name)}
                        className="checkbox"
                      />
                      {member.name}
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="label">Thời gian bắt đầu:</label>
                <input
                  type="datetime-local"
                  className="input"
                  value={newEventData.start}
                  onChange={(e) =>
                    setNewEventData({ ...newEventData, start: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label className="label">Thời gian kết thúc:</label>
                <input
                  type="datetime-local"
                  className="input"
                  value={newEventData.end}
                  onChange={(e) =>
                    setNewEventData({ ...newEventData, end: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="create-btn" onClick={handleCreateEvent}>
                Tạo
              </button>
              <button
                className="close-btn"
                onClick={() => setShowNewEventModal(false)}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
