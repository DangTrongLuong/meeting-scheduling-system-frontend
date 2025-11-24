import React, { useState, useEffect, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import viLocale from "@fullcalendar/core/locales/vi";
import "../../styles/User/DashboardUser.css";
import NavBar from "../../components/NavBar";
import SideBarUser from "../../components/SideBarUser";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import CreateNewEvent from "./CreateNewEvent";
import DetailEvent from "./DetailEvent";
import EditEvent from "./EditEvent";

export default function DashboardUser() {
  const calendarRef = useRef(null);

  const [rooms, setRooms] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  //
  const [filterMode, setFilterMode] = useState("all");
  const [filterRoomId, setFilterRoomId] = useState(null);

  //
  const [selectedDate, setSelectedDate] = useState(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [openDetail, setOpenDetail] = useState(false);

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [preFillData, setPreFillData] = useState({
    date: "",
    startTime: "07:00",
    endTime: "07:30",
  });
  //
  const [showEdit, setShowEdit] = useState(false);
  //
  const [currentTime, setCurrentTime] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenuItem, setActiveMenuItem] = useState("meetting");
  const [miniCalendarKey, setMiniCalendarKey] = useState(0); // key để re-render React Calendar
  const handleTodayClick = () => {
    const calendarApi = calendarRef.current.getApi();
    calendarApi.today(); // FullCalendar lớn về hôm nay
    const today = new Date();
    setSelectedDate(today); // Mini calendar highlight today
    setMiniCalendarKey(today.getTime()); // Buộc mini calendar re-render
  };
  // Lọc sự kiện dựa trên filterMode
const getFilteredEvents = () => {
  const userId = localStorage.getItem("userId");

  let filtered = events;

  // Lọc theo filter created/invited
  if (filterMode === "created") {
    filtered = filtered.filter((e) => e.extendedProps.creatorId === userId);
  } else if (filterMode === "invited") {
    filtered = filtered.filter(
      (e) =>
        e.extendedProps.creatorId !== userId &&
        e.extendedProps.participants.includes(
          localStorage.getItem("userEmail")
        )
    );
  }

  // Lọc theo phòng nếu người dùng chọn trong "Available Rooms Today"
  if (filterRoomId) {
    filtered = filtered.filter(
      (e) => e.extendedProps.roomId === filterRoomId
    );
  }

  return filtered;
};

  const handleEditClick = (event) => {
    setSelectedEvent(event); // set sự kiện sẽ edit
    setShowEdit(true); // mở modal EditEvent
  };

  // Fetch rooms
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const response = await axios.get(
          "http://localhost:8080/api/meetings/get-all-rooms",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setRooms(response.data);
      } catch (error) {
        console.error("Error fetching rooms:", error);
        toast.error("Lỗi khi tải danh sách phòng!");
      }
    };

    fetchRooms();
  }, []);

  // Helper function để map meetings - tái sử dụng
  const mapMeetingsToEvents = (meetings, userId) => {
    return meetings.map((m) => {
      const eventDate = new Date(m.startTime);
      const dayOfWeek = eventDate.getDay();

      const colorPalette = [
        "#FF9999",
        "#66B2FF",
        "#99FF99",
        "#FFFF99",
        "#FFCC99",
        "#CC99FF",
        "#FF99CC",
      ];

      const backgroundColor = colorPalette[dayOfWeek];
      const borderColor = backgroundColor;

      // Kiểm tra xem userId có phải creator không
      const isCreatorMeeting = m.creator.id === userId;

      return {
        id: m.id,
        title: `${m.title}`,
        start: m.startTime,
        end: m.endTime,
        backgroundColor,
        borderColor,
        textColor: "#000",
        extendedProps: {
          meetingId: m.id,
          room: m.room.id,
          roomId: m.room.id,
          roomName: m.room.name,
          creatorId: m.creator.id, // ← Thêm creatorId
          creator: {
            // ← Thêm creator object
            id: m.creator.id,
            name: m.creator.name,
            email: m.creator.email,
          },
          isCreator: isCreatorMeeting, // ← Thêm flag isCreator
          description: m.description,
          participants: m.participants?.map((p) => p.user?.email) || [],
          devices: m.devices?.map((d) => d.device?.name) || [],
          status: m.status,
        },
      };
    });
  };

  const handleUpdateEvent = (updatedEvent) => {
    setEvents((prevEvents) =>
      prevEvents.map((ev) =>
        ev.id === updatedEvent.id ? { ...ev, ...updatedEvent } : ev
      )
    );
    setSelectedEvent((prev) => ({ ...prev, ...updatedEvent }));

    setShowEdit(false);
    setShowDetailModal(true);
    setToastMessage("Meeting updated successfully!");
  };

  // Fetch meetings lần đầu
  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const userId = localStorage.getItem("userId");

        const response = await axios.get(
          "http://localhost:8080/api/meetings/my-meetings",
          {
            headers: {
              Authorization: `Bearer ${token}`,
              userId: userId,
            },
          }
        );

        const mappedEvents = mapMeetingsToEvents(response.data.data, userId);
        setEvents(mappedEvents);
      } catch (error) {
        console.error("Error fetching meetings:", error);
      }
    };
    fetchMeetings();
  }, []);

  // Update current time
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
    setShowDetailModal(true);
  };

  const handleCreateSuccess = () => {
    // Refresh meetings list
    const fetchMeetings = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const userId = localStorage.getItem("userId");

        const response = await axios.get(
          "http://localhost:8080/api/meetings/my-meetings",
          {
            headers: {
              Authorization: `Bearer ${token}`,
              userId: userId,
            },
          }
        );

        // ← Dùng helper function
        const mappedEvents = mapMeetingsToEvents(response.data.data, userId);
        setEvents(mappedEvents);
      } catch (error) {
        console.error("Error fetching meetings:", error);
      }
    };

    fetchMeetings();
  };

  const handleDeleteSuccess = () => {
    handleCreateSuccess();
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
        autoClose={1200}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      <NavBar onToggleSidebar={toggleSidebar} />

      <div className="main-content-user">
        <SideBarUser
          activeItem={activeMenuItem}
          onItemClick={handleMenuClick}
          isOpen={sidebarOpen}
          onClose={closeSidebar}
        />

        <div className="navbar-right">
          <button
            className="meeting-btn-list"
            onClick={() => {
              setFilterMode((prev) => (prev === "created" ? "all" : "created"));
            }}
          >
            + Booked Rooms List
          </button>

          <button
            className="meeting-btn-invite"
            onClick={() => {
              setFilterMode((prev) => (prev === "invited" ? "all" : "invited"));
            }}
          >
            + Invited Rooms List
          </button>

          <button
            className="meeting-btn"
            onClick={() => setShowCreateModal(true)}
          >
            + Create Meeting
          </button>
        </div>

        <div className="main-inner-calender">
          <div className="calendar-container">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              locale="en-EN"
              events={getFilteredEvents()}
              eventClick={handleEventClick}
              headerToolbar={{
                left: "prev,next customtoday",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay",
              }}
              customButtons={{
                customtoday: {
                  text: "Today",
                  click: handleTodayClick,
                },
              }}
              slotMinTime="07:00:00"
              slotMaxTime="24:00:00"
              slotDuration="00:30:00"
              slotLabelInterval="01:00"
              height="100%"
              contentHeight="auto"
              selectable={true}
              selectMirror={true}
              dayMaxEvents={true}
              aspectRatio={2.5}
              dateClick={(arg) => {
                const clickedDate = arg.date;
                setSelectedDate(clickedDate);
                const dateStr = clickedDate.toISOString().split("T")[0];
                const hours = clickedDate
                  .getHours()
                  .toString()
                  .padStart(2, "0");
                const minutes = clickedDate
                  .getMinutes()
                  .toString()
                  .padStart(2, "0");
                const timeStr = `${hours}:${minutes}`;
                let endHour = clickedDate.getHours();
                let endMinute = clickedDate.getMinutes() + 30;
                if (endMinute >= 60) {
                  endHour += 1;
                  endMinute -= 60;
                }
                const endTimeStr = `${endHour
                  .toString()
                  .padStart(2, "0")}:${endMinute.toString().padStart(2, "0")}`;
                setPreFillData({
                  date: dateStr,
                  startTime: timeStr,
                  endTime: endTimeStr,
                });
                setShowCreateModal(true);
              }}
              dayCellClassNames={(arg) => {
                if (!selectedDate) return [];
                const sel = new Date(selectedDate);
                const cell = new Date(arg.date);
                if (
                  sel.getFullYear() === cell.getFullYear() &&
                  sel.getMonth() === cell.getMonth() &&
                  sel.getDate() === cell.getDate()
                ) {
                  return ["fc-selected-date"];
                }
                return [];
              }}
            />
          </div>

          <aside className="sidebar-user-calender">
            <div className="mini-calendar">
              <Calendar
                key={miniCalendarKey} //re-render khi Today nhấn
                value={selectedDate || new Date()}
                onClickDay={(date) => {
                  setSelectedDate(date);

                  // Đồng bộ FullCalendar lớn
                  if (calendarRef.current) {
                    const calendarApi = calendarRef.current.getApi();
                    calendarApi.gotoDate(date);
                  }
                }}
                onActiveStartDateChange={({ activeStartDate }) => {
                  if (calendarRef.current && activeStartDate) {
                    const calendarApi = calendarRef.current.getApi();
                    calendarApi.gotoDate(activeStartDate);
                  }
                }}
                tileClassName={({ date, view }) => {
                  if (view === "month") {
                    const today = new Date();
                    if (date.toDateString() === today.toDateString())
                      return "calendar-today"; // màu vàng
                    if (
                      selectedDate &&
                      date.toDateString() === selectedDate.toDateString()
                    )
                      return "calendar-selected"; // màu xanh dương
                  }
                  return null;
                }}
              />

              <div className="current-time">{currentTime}</div>
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
                        style={{ backgroundColor: "#3498db" }}
                      ></span>
                      {room?.name || "N/A"}
                    </li>
                  );
                })}
                {getBookedRooms().length === 0 && (
                  <li className="room-item">No rooms have been booked</li>
                )}
              </ul>

              <h4 className="room-box-title" style={{ marginTop: 16 }}>
                Available Rooms Today
              </h4>
              <ul className="room-list">
{getAvailableRooms().map((room, i) => (
  <li
    key={i}
    className="room-item"
    onClick={() => {
      // Nếu nhấn lại thì bỏ filter thôi 
      if (filterRoomId === room.id) {
        setFilterRoomId(null);
      } else {
        setFilterRoomId(room.id);
      }
    }}
    style={{
      cursor: "pointer",
      fontWeight: filterRoomId === room.id ? "bold" : "normal",
      color: filterRoomId === room.id ? "#127cf5" : "inherit",
    }}
  >
    <span
      className="room-dot"
      style={{ backgroundColor: "#28a745" }}
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
                      style={{ backgroundColor: "#127cf5" }}
                    ></span>
                    {room.name}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>

      {/* Create New Event Modal */}
      <CreateNewEvent
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        rooms={rooms}
        onSuccess={handleCreateSuccess}
        loading={loading}
        prefill={preFillData}
      />

      {/* Detail Event Modal */}
      <DetailEvent
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        event={selectedEvent}
        rooms={rooms}
        onDelete={handleDeleteSuccess}
        onEdit={handleEditClick}
        loading={loading}
        toastMessage={toastMessage}
      />
      <EditEvent
        isOpen={showEdit}
        onClose={() => setShowEdit(false)}
        event={selectedEvent}
        rooms={rooms}
        onUpdate={handleUpdateEvent}
      />
    </div>
  );
}
