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

  const [rooms, setRooms] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const [roomSearchTerm, setRoomSearchTerm] = useState("");
  const [selectedRoomIds, setSelectedRoomIds] = useState([]); // Thay cho filterRoomId

  const [isGoogleConnected, setIsGoogleConnected] = useState(false);

  // Khởi tạo mặc định chọn hết phòng
  useEffect(() => {
    if (rooms.length > 0 && selectedRoomIds.length === 0) {
      setSelectedRoomIds(rooms.map((r) => r.id));
    }
  }, [rooms]);

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
  const [miniCalendarKey, setMiniCalendarKey] = useState(0);

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

        // Redirect trực tiếp - KHÔNG dùng axios
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
          handleCreateSuccess(); // Refresh meetings
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

      // Gọi API DELETE tới backend
      await axios.delete("/api/google-calendar/disconnect", {
        headers: {
          Authorization: `Bearer ${token}`,
          userId,
        },
      });

      // Cập nhật UI
      setIsGoogleConnected(false);
      toast.success("Disconnected Google Calendar!");
    } catch (error) {
      console.error("Error disconnecting:", error);
      toast.error("Failed to disconnect Google Calendar!");
    } finally {
      setLoading?.(false);
    }
  };

  const filteredEvents = React.useMemo(() => {
    if (selectedRoomIds.length === 0) return events;

    return events.filter((event) => {
      const eventRoomId = event.extendedProps?.room?.id;

      return selectedRoomIds.includes(eventRoomId);
    });
  }, [events, selectedRoomIds]);

  const isRoomFullyBookedToday = (roomId) => {
    const today = new Date().toISOString().split("T")[0];
    const roomEvents = events.filter(
      (e) => e.extendedProps.roomId === roomId && e.start.startsWith(today)
    );

    return roomEvents.length >= 10;
  };

  // Toggle chọn phòng
  const toggleRoomSelection = (roomId) => {
    setSelectedRoomIds((prev) =>
      prev.includes(roomId)
        ? prev.filter((id) => id !== roomId)
        : [...prev, roomId]
    );
  };

  // Lọc phòng theo từ khóa tìm kiếm
  const filteredRoomsForSidebar = rooms
    .filter((room) =>
      room.name.toLowerCase().includes(roomSearchTerm.toLowerCase())
    )
    .sort((a, b) => a.name.localeCompare(b.name));

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

  // Fetch meetings lần đầu
  const currentUserId = localStorage.getItem("userId");

  const fetchAllEvents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");

      const res = await axios.get("/api/meetings/getAllMeetings", {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: 0,
          size: 1000,
          sortBy: "startTime",
          direction: "desc",
        },
      });

      const meetings = res.data.data?.content || res.data.data || [];
      const visibleMeetings = meetings.filter((m) => m.status !== "CANCELLED");

      const formattedEvents = visibleMeetings.map((meeting) => {
        const isCreator = meeting.creator?.id === currentUserId;
        const isParticipant = meeting.participants?.some(
          (p) => p.user?.id === currentUserId && p.status === "ACCEPTED"
        );

        let backgroundColor, borderColor;

        if (meeting.status === "CANCELLED") {
          backgroundColor = "#f88a8aff";
          borderColor = "#f88a8aff";
        } else if (meeting.status === "PENDING_APPROVAL") {
          backgroundColor = "#b1b1b1ff";
          borderColor = "#b1b1b1ff";
        } else {
          if (isCreator || isParticipant) {
            backgroundColor = "#3f9bf7ff";
            borderColor = "#1565c0";
          } else {
            backgroundColor = "#00ce22ff";
            borderColor = "#27e900ff";
          }
        }

        return {
          id: meeting.id,
          title: `${meeting.title} – ${meeting.room?.name}`,
          start: meeting.startTime,
          end: meeting.endTime,
          backgroundColor,
          borderColor,
          textColor: "white",
          extendedProps: {
            ...meeting,
            isCreator,
            isParticipant,
            isMyMeeting: isCreator || isParticipant,
          },
        };
      });

      setEvents(formattedEvents);
    } catch (error) {
      console.error("Error loading meetings:", error);
      toast.error("Không tải được lịch họp");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllEvents();
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
    fetchAllEvents();
  };

  const handleDeleteSuccess = () => {
    fetchAllEvents();
  };

  const getBookedRooms = () => {
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const currentEvents = events.filter((e) => e.start.startsWith(today));
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
              events={filteredEvents}
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
              nowIndicator={true}
              slotMinTime="07:00:00"
              slotMaxTime="24:00:00"
              slotDuration="00:15:00"
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
              eventDidMount={(info) => {
                const el = info.el;

                const meeting = info.event.extendedProps;
                const status = meeting.status ?? "UNKNOWN";
                const participantsCount = meeting.participants?.length ?? 0;

                info.el.setAttribute(
                  "title",
                  `${info.event.title}\nStatus: ${status}\nParticipants: ${participantsCount}`
                );

                const frame = el.querySelector(".fc-event-main-frame");
                if (frame) {
                  // Tạo dòng meta: "Status | 👥N"
                  const meta = document.createElement("div");
                  meta.className = "fc-event-extra";
                  meta.textContent = `${status}`;

                  frame.appendChild(meta);
                }

                // Reset mọi style mặc định của FullCalendar
                el.style.margin = "3px 2px";
                el.style.borderRadius = "5px";
                el.style.border = "none";
                // el.style.backgroundColor = "#fff8c5";
                el.style.color = "#5d4037";
              }}
            />
          </div>

          <aside className="sidebar-user-calender">
            {/* Mini Calendar */}
            <div className="mini-calendar">
              <Calendar
                key={miniCalendarKey}
                value={selectedDate || new Date()}
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
                {/* Hàng 1 */}
                <div className="notes-row">
                  <div className="note-item">
                    <span
                      className="note-color"
                      style={{ backgroundColor: "#1976d2" }}
                    ></span>
                    My Meetings
                  </div>
                </div>
                <div className="notes-row">
                  <div className="note-item">
                    <span
                      className="note-color"
                      style={{ backgroundColor: "#4caf50" }}
                    ></span>
                    Other Meetings
                  </div>
                </div>

                {/* Hàng 2 */}
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
                    const event = events.find(
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

            <div className="room-filter-panel" style={{ marginTop: "20px" }}>
              <h3 className="sidebar-title">Filter by Room</h3>

              {/* Ô tìm kiếm */}
              <input
                type="text"
                placeholder="Search room name..."
                value={roomSearchTerm}
                onChange={(e) => setRoomSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                  fontSize: "14px",
                  marginBottom: "12px",
                }}
              />

              {/* Danh sách phòng với checkbox */}
              <div
                style={{
                  maxHeight: "200px",
                  overflowY: "auto",
                  border: "1px solid #e0e0e0",
                  borderRadius: "8px",
                  padding: "8px",
                  backgroundColor: "#fafafa",
                }}
              >
                {filteredRoomsForSidebar.map((room) => {
                  const isFullyBooked = isRoomFullyBookedToday(room.id);
                  const isSelected = selectedRoomIds.includes(room.id);

                  return (
                    <label
                      key={room.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "10px 8px",
                        margin: "4px 0",
                        backgroundColor: isSelected ? "#e3f2fd" : "white",
                        borderRadius: "6px",
                        cursor: "pointer",
                        border: isSelected
                          ? "2px solid #2196f3"
                          : "1px solid #eee",
                        opacity: isFullyBooked ? 0.7 : 1,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleRoomSelection(room.id)}
                        style={{ marginRight: "10px" }}
                      />
                      <span
                        style={{ fontWeight: "500", fontSize: "14px", flex: 1 }}
                      >
                        {room.name}
                      </span>
                      {isFullyBooked && (
                        <span
                          style={{
                            backgroundColor: "#c62828",
                            color: "white",
                            padding: "2px 8px",
                            borderRadius: "12px",
                            fontSize: "10px",
                            fontWeight: "bold",
                          }}
                        >
                          FULL
                        </span>
                      )}
                    </label>
                  );
                })}

                {filteredRoomsForSidebar.length === 0 && (
                  <p
                    style={{
                      textAlign: "center",
                      color: "#999",
                      padding: "20px",
                      fontStyle: "italic",
                    }}
                  >
                    No rooms match
                  </p>
                )}
              </div>

              {/* Nút Select All / Unselect All */}
              <div style={{ marginTop: "12px", textAlign: "center" }}>
                <button
                  onClick={() =>
                    setSelectedRoomIds(
                      selectedRoomIds.length === rooms.length
                        ? []
                        : rooms.map((r) => r.id)
                    )
                  }
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#1976d2",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  {selectedRoomIds.length === rooms.length
                    ? "Unselect All"
                    : "Select All"}
                </button>
              </div>
            </div>

            {/* PHẦN 3: All Rooms (GIỮ LẠI ĐỂ XEM NHANH) */}
            <div className="room-box" style={{ marginTop: "20px" }}>
              <h4 className="room-box-title">All Rooms</h4>
              <ul
                className="room-list"
                style={{ maxHeight: "150px", overflowY: "auto" }}
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
