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
import ggCalendar from "../../assets/gcalendericon.png";
import { useNavigate } from "react-router-dom";

export default function DashboardUser() {
  const navigate = useNavigate();
  const calendarRef = useRef(null);
  const filterDropdownRef = useRef(null);

  const [rooms, setRooms] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const [isGoogleConnected, setIsGoogleConnected] = useState(false);

  // Room filter state
  const [showRoomFilter, setShowRoomFilter] = useState(false);
  const [filterMode, setFilterMode] = useState("my-meetings");
  const [roomSearchTerm, setRoomSearchTerm] = useState("");

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

  const [showEdit, setShowEdit] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenuItem, setActiveMenuItem] = useState("meetting");
  const [miniCalendarKey, setMiniCalendarKey] = useState(0);

  // Lọc phòng theo search term
  const filteredRoomsForFilter = rooms.filter((room) =>
    room.name.toLowerCase().includes(roomSearchTerm.toLowerCase())
  );

  // Close dropdown khi click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(e.target)
      ) {
        setShowRoomFilter(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleTodayClick = () => {
    const calendarApi = calendarRef.current.getApi();
    calendarApi.today();
    const today = new Date();
    setSelectedDate(today);
    setMiniCalendarKey(today.getTime());
  };

  useEffect(() => {
    const checkGoogleConnection = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const userId = localStorage.getItem("userId");

        const response = await axios.get("/api/google-calendar/status", {
          headers: { Authorization: `Bearer ${token}`, userId },
        });

        setIsGoogleConnected(response.data.data.connected);
      } catch (error) {
        console.error("Error checking Google connection:", error);
      }
    };

    checkGoogleConnection();
  }, []);

  const handleGoogleSync = async () => {
    if (!isGoogleConnected) {
      try {
        const userId = localStorage.getItem("userId");
        const token = localStorage.getItem("accessToken");

        if (!userId || !token) {
          toast.error("Please login first!");
          return;
        }

        window.location.href = `http://localhost:8080/api/google-calendar/connect?userId=${userId}`;
      } catch (error) {
        console.error("Error initiating Google connection:", error);
        toast.error("Failed to connect Google Calendar!");
      }
    } else {
      try {
        setLoading(true);
        const token = localStorage.getItem("accessToken");
        const userId = localStorage.getItem("userId");

        const response = await axios.post(
          "http://localhost:8080/api/google-calendar/sync-all",
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
              userId: userId,
            },
          }
        );

        if (response.data.code === 200) {
          toast.success(`Synced ${response.data.data.syncedCount} meetings!`);
          handleCreateSuccess();
        }
      } catch (error) {
        console.error("Error syncing:", error);
        toast.error("Failed to sync with Google Calendar!");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleGoogleDisconnect = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const userId = localStorage.getItem("userId");

      await axios.delete("/api/google-calendar/disconnect", {
        headers: {
          Authorization: `Bearer ${token}`,
          userId,
        },
      });

      setIsGoogleConnected(false);
      toast.success("Disconnected Google Calendar!");
    } catch (error) {
      console.error("Error disconnecting:", error);
      toast.error("Failed to disconnect Google Calendar!");
    } finally {
      setLoading?.(false);
    }
  };

  // Filter events dựa trên filter mode
  const getFilteredEvents = React.useMemo(() => {
    if (filterMode === "my-meetings") {
      // Hiển thị tất cả meetings
      return events;
    } else {
      // Hiển thị chỉ meetings của phòng được chọn
      return events.filter((event) => {
        const eventRoomId = event.extendedProps?.room?.id;
        return eventRoomId === filterMode;
      });
    }
  }, [events, filterMode]);

  console.log("Get: ", getFilteredEvents);

  const handleEditClick = (event) => {
    setSelectedEvent(event);
    setShowEdit(true);
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
const fetchEvents = async () => {
  try {
    setLoading(true);
    const token = localStorage.getItem("accessToken");
    const userId = localStorage.getItem("userId");
    let meetings = [];

    if (filterMode === "my-meetings") {
      // Lấy các cuộc họp của tôi (có thể bao gồm cả đã kết thúc)
      const res = await axios.get("/api/meetings/my-meetings", {
        headers: { Authorization: `Bearer ${token}`, userId },
      });
      meetings = res.data.data ?? res.data ?? [];
    } else {
      // Lấy các cuộc họp theo phòng (đang scheduled + active)
      const res = await axios.get(
        `/api/meetings/room/${filterMode}/scheduled-active`,
        {
          headers: { Authorization: `Bearer ${token}`, userId },
        }
      );
      meetings = res.data.data ?? [];
    }

    // --- Lọc hiển thị ---
    // 1) Loại bỏ CANCELLED
    // 2) Ẩn các PENDING_APPROVAL đã quá thời gian (local time)
    const nowMs = Date.now(); // local epoch milliseconds
    const visibleMeetings = meetings.filter((m) => {
      if (m.status === "CANCELLED") return false;

      if (m.status === "PENDING_APPROVAL") {
        const endMs = m?.endTime ? new Date(m.endTime).getTime() : Number.NaN;
        // Nếu có endTime và đã kết thúc trong quá khứ -> ẩn khỏi lịch
        if (Number.isFinite(endMs) && endMs < nowMs) return false;
      }

      return true;
    });

    // --- Map sang sự kiện cho FullCalendar ---
    const formattedEvents = visibleMeetings.map((meeting) => {
      const isCreator = meeting.creator?.id === userId;
      const isParticipant = meeting.participants?.some(
        (p) => p.user?.id === userId && p.status === "ACCEPTED"
      );
      const isMyMeeting = isCreator || isParticipant;

      // 'ended' chỉ phục vụ style trong eventDidMount; không ảnh hưởng hiển thị vì đã lọc ở trên
      const ended = meeting.hasConcluded === true;

      let backgroundColor = "#3f9bf7ff"; // mặc định xanh dương
      let borderColor = "#1565c0";

      if (ended || meeting.status === "CANCELLED") {
        backgroundColor = "#f88a8aff";
        borderColor = "#f88a8aff";
      } else if (meeting.status === "PENDING_APPROVAL") {
        backgroundColor = "#b1b1b1ff";
        borderColor = "#b1b1b1ff";
      } else if (!isMyMeeting) {
        // Của người khác → xanh lá
        backgroundColor = "#00ce22ff";
        borderColor = "#27e900ff";
      }

      return {
        id: meeting.id,
        title: `${meeting.title} – ${meeting.room?.name ?? "Unknown Room"}`,
        start: meeting.startTime,
        end: meeting.endTime,
        backgroundColor,
        borderColor,
        textColor: "white",
        extendedProps: {
          ...meeting,
          isMyMeeting,
          ended,
        },
      };
    });

    setEvents(formattedEvents);
  } catch (error) {
    console.error("Error fetching events:", error);
    toast.error("Không thể tải lịch họp");
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchEvents();
  }, [filterMode]);

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
    fetchEvents();
  };

  const handleDeleteSuccess = () => {
    fetchEvents();
  };

  const getBookedRooms = () => {
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const currentEvents = getFilteredEvents.filter((e) =>
      e.start.startsWith(today)
    );
    return [...new Set(currentEvents.map((e) => e.extendedProps.room.id))];
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
        style={{ top: "70px" }}
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
          {/* Room/Meeting Filter Dropdown */}
          <div ref={filterDropdownRef} className="room-filter-dropdown">
            {/* Nút chính */}
            <button
              className="filter-btn"
              onClick={() => setShowRoomFilter(!showRoomFilter)}
            >
              <span className="filter-btn-text">
                {filterMode === "my-meetings"
                  ? "My Meetings"
                  : rooms.find((r) => r.id === filterMode)?.name ||
                    "Select Room"}
              </span>
              <span className="filter-btn-arrow">
                {showRoomFilter ? "▲" : "▼"}
              </span>
            </button>

            {/* Dropdown menu */}
            {showRoomFilter && (
              <div className="filter-dropdown-menu">
                {/* Ô tìm kiếm */}
                <div className="filter-search-box">
                  <input
                    type="text"
                    placeholder="Search rooms..."
                    value={roomSearchTerm}
                    onChange={(e) => setRoomSearchTerm(e.target.value)}
                    className="filter-search-input"
                    autoFocus
                  />
                </div>

                {/* Option My Meetings */}
                <div
                  className={`filter-item ${
                    filterMode === "my-meetings" ? "active" : ""
                  }`}
                  onClick={() => {
                    setFilterMode("my-meetings");
                    setShowRoomFilter(false);
                    setRoomSearchTerm("");
                  }}
                >
                  ⭐ My Meetings
                </div>

                {/* Danh sách phòng */}
                <div className="filter-room-list">
                  {filteredRoomsForFilter.length > 0 ? (
                    filteredRoomsForFilter.map((room) => (
                      <div
                        key={room.id}
                        className={`filter-item ${
                          filterMode === room.id ? "active" : ""
                        }`}
                        onClick={() => {
                          setFilterMode(room.id);
                          setShowRoomFilter(false);
                          setRoomSearchTerm("");
                        }}
                      >
                        {room.name}
                      </div>
                    ))
                  ) : (
                    <div className="filter-no-results">No rooms found</div>
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            className="google-calendar-btn"
            onClick={
              isGoogleConnected ? handleGoogleDisconnect : handleGoogleSync
            }
            disabled={loading}
          >
            <img
              src={ggCalendar}
              alt="Google Calendar"
              className="google-calendar-icon"
            />
            <span>
              {isGoogleConnected
                ? "Disconnect G-Calendar"
                : "Connect G-Calendar"}
            </span>
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
              initialView="timeGridDay"
              locale="en-EN"
              events={getFilteredEvents}
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
              allDaySlot={false}
              nowIndicator={true}
              slotMinTime="07:00:00"
              slotMaxTime="24:00:00"
              slotDuration="00:30:00"
              slotLabelInterval="01:00"
              height="100%"
              contentHeight="auto"
              slotLabelFormat={{
                hour: "numeric",
                hour12: true,
                meridiem: "short",
              }}
              selectable={true}
              selectMirror={true}
              dayMaxEvents={true}
              aspectRatio={2.5}
              dateClick={(arg) => {
                const now = new Date();
                if (arg.date < now) {
                  toast.warn("Unable to create past meetings.");
                  return;
                }
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
              select={(arg) => {
                const now = new Date();
                if (arg.start < now) {
                  return;
                }
                const startDate = arg.start;
                const endDate = arg.end;

                setSelectedDate(startDate);

                const dateStr = startDate.toISOString().split("T")[0];
                const startHours = startDate
                  .getHours()
                  .toString()
                  .padStart(2, "0");
                const startMinutes = startDate
                  .getMinutes()
                  .toString()
                  .padStart(2, "0");
                const startTimeStr = `${startHours}:${startMinutes}`;

                const endHours = endDate.getHours().toString().padStart(2, "0");
                const endMinutes = endDate
                  .getMinutes()
                  .toString()
                  .padStart(2, "0");
                const endTimeStr = `${endHours}:${endMinutes}`;

                setPreFillData({
                  date: dateStr,
                  startTime: startTimeStr,
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
              eventDidMount={(info) => {
                const el = info.el;
                const meeting = info.event.extendedProps;

                const statusText = meeting?.ended
                  ? "This meeting has concluded"
                  : meeting.status ?? "UNKNOWN";
                const participantsCount = meeting.participants?.length ?? 0;
                info.el.setAttribute(
                  "title",
                  `${info.event.title}\nStatus: ${statusText}\nParticipants: ${participantsCount}`
                );

                const frame = el.querySelector(".fc-event-main-frame");
                if (frame) {
                  const meta = document.createElement("div");
                  meta.className = "fc-event-extra";
                  meta.textContent = statusText;

                  if (meeting?.ended) {
                    meta.style.background = "transparent";
                    meta.style.color = "#c62828";
                    meta.style.padding = "0";
                    meta.style.borderRadius = "0";
                    meta.style.marginLeft = "6px";
                    meta.style.fontWeight = "700";
                    meta.style.textTransform = "uppercase";
                    meta.style.letterSpacing = "0.3px";
                  }
                  frame.appendChild(meta);
                }

                el.style.margin = "3px 2px";
                el.style.borderRadius = "5px";

                if (meeting?.ended === true) {
                  el.style.backgroundColor =
                    info.event.backgroundColor || "#f88a8aff";
                  el.style.borderColor = info.event.borderColor || "#f88a8aff";

                  const titleContainer = el.querySelector(".fc-event-title");
                  const timeContainer = el.querySelector(".fc-event-time");
                  const startTime = info.event.start
                    ? new Date(info.event.start)
                    : null;
                  const endTime = info.event.end
                    ? new Date(info.event.end)
                    : null;
                  let durationMinutes = 0;

                  if (startTime && endTime) {
                    durationMinutes = (endTime - startTime) / (1000 * 60);
                  }
                  if (durationMinutes > 30) {
                    if (titleContainer) {
                      const strike = document.createElement("div");
                      strike.style.position = "absolute";
                      strike.style.left = "0";
                      strike.style.right = "0";
                      strike.style.top = "50%";
                      strike.style.transform = "translateY(-50%)";
                      strike.style.height = "2px";
                      strike.style.background = "#000";
                      strike.style.opacity = "0.75";
                      strike.style.pointerEvents = "none";
                      strike.style.zIndex = "10";
                      strike.style.margin = "0 6px";

                      titleContainer.style.position = "relative";
                      titleContainer.appendChild(strike);
                    }
                  }
                  if (timeContainer) {
                    const strike = document.createElement("div");
                    strike.style.position = "absolute";
                    strike.style.left = "0";
                    strike.style.right = "0";
                    strike.style.top = "50%";
                    strike.style.transform = "translateY(-50%)";
                    strike.style.height = "2px";
                    strike.style.background = "#000";
                    strike.style.opacity = "0.75";
                    strike.style.pointerEvents = "none";
                    strike.style.zIndex = "10";
                    strike.style.margin = "0 6px";

                    timeContainer.style.position = "relative";
                    timeContainer.appendChild(strike);
                  }
                }
              }}
            />
          </div>

          <aside className="sidebar-user-calender">
            {/* Mini Calendar */}
            <div className="mini-calendar">
              <Calendar
                key={miniCalendarKey}
                value={selectedDate || new Date()}
                locale="en-EN"
                onClickDay={(date) => {
                  setSelectedDate(date);
                  if (calendarRef.current) {
                    calendarRef.current.getApi().gotoDate(date);
                  }
                }}
                tileClassName={({ date, view }) => {
                  if (view === "month") {
                    const today = new Date();
                    if (date.toDateString() === today.toDateString())
                      return "calendar-today";
                    if (
                      selectedDate &&
                      date.toDateString() === selectedDate.toDateString()
                    )
                      return "calendar-selected";
                  }
                  return null;
                }}
              />
              <div className="current-time">{currentTime}</div>
            </div>

            <div className="meeting-notes">
              <h4 className="meeting-notes-title">Meeting Notes</h4>
              <div className="meeting-notes-days">
                <div className="notes-row">
                  <div className="note-item">
                    <span
                      className="note-color"
                      style={{ backgroundColor: "#1976d2" }}
                    ></span>
                    My Meetings
                  </div>
                  <div className="note-item">
                    <span
                      className="note-color"
                      style={{ backgroundColor: "#19d24aff" }}
                    ></span>
                    Other Meetings
                  </div>
                </div>
                <div className="notes-row">
                  <div className="note-item">
                    <span
                      className="note-color"
                      style={{ backgroundColor: "rgb(248, 138, 138)" }}
                    ></span>
                    Meetings Ended
                  </div>
                </div>

                <div className="notes-row">
                  <div className="note-item">
                    <span
                      className="note-color"
                      style={{ backgroundColor: "#ccc" }}
                    ></span>
                    Pending
                  </div>
                </div>
              </div>
            </div>

            <div className="room-box" style={{ marginTop: "20px" }}>
              <h4 className="room-box-title">Rooms Booked Today</h4>
              <ul
                className="room-list"
                style={{ maxHeight: "120px", overflowY: "auto" }}
              >
                {getBookedRooms().length > 0 ? (
                  getBookedRooms().map((roomId, i) => {
                    const event = getFilteredEvents.find(
                      (e) => e.extendedProps.room.id === roomId
                    );
                    return (
                      <li key={i} className="room-item">
                        <span
                          className="room-dot"
                          style={{ backgroundColor: "#e74c3c" }}
                        ></span>
                        {event?.extendedProps.room.name || "Unknown Room"}
                      </li>
                    );
                  })
                ) : (
                  <li className="room-item" style={{ color: "#999" }}>
                    No rooms booked today
                  </li>
                )}
              </ul>
            </div>

            <div className="room-box" style={{ marginTop: "20px" }}>
              <h4 className="room-box-title">All Rooms</h4>
              <ul
                className="room-list"
                style={{ maxHeight: "180px", overflowY: "auto" }}
              >
                {rooms.map((room) => (
                  <li key={room.id} className="room-item">
                    <span
                      className="room-dot"
                      style={{ backgroundColor: "#3498db" }}
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
