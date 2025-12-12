import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Search,
  Calendar,
  Users,
  MapPin,
  Clock,
  ChevronRight,
  X,
} from "lucide-react";
import "../../styles/User/RoomMeeting.css";
import NavBar from "../../components/NavBar";
import SideBarUser from "../../components/SideBarUser";
import Calendar2 from "react-calendar";
import "react-calendar/dist/Calendar.css";

const RoomMeeting = () => {
  const [rooms, setRooms] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [meetingLoading, setMeetingLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenuItem, setActiveMenuItem] = useState("room-meeting");
  const [showCalendar, setShowCalendar] = useState(false);

  // Fetch all rooms
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("accessToken");
        const response = await axios.get(
          "http://localhost:8080/api/meetings/get-all-rooms",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setRooms(response.data || []);
        if (response.data && response.data.length > 0) {
          setSelectedRoom(response.data[0]);
        }
      } catch (error) {
        console.error("Lỗi tải phòng:", error);
        toast.error("Không thể tải danh sách phòng!");
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, []);

  // Fetch meetings whenever room or date changes
  useEffect(() => {
    if (!selectedRoom) {
      setMeetings([]);
      return;
    }

    const fetchMeetings = async () => {
      try {
        setMeetingLoading(true);
        const token = localStorage.getItem("accessToken");

        let startDate = new Date();
        let endDate = new Date();

        if (selectedDate) {
          // Nếu chọn ngày cụ thể
          startDate = new Date(selectedDate);
          endDate = new Date(selectedDate);
        } else {
          // Mặc định 90 ngày tới
          endDate = new Date(startDate.getTime() + 90 * 24 * 60 * 60 * 1000);
        }

        // Set time to start and end of day
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);

        const startISO = startDate.toISOString();
        const endISO = endDate.toISOString();

        console.log("Fetching meetings:");
        console.log("Room ID:", selectedRoom.id);
        console.log("Start:", startISO);
        console.log("End:", endISO);

        const response = await axios.get(
          `http://localhost:8080/api/meetings/room/${selectedRoom.id}/schedule`,
          {
            params: {
              startDate: startISO,
              endDate: endISO,
            },
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log("Response:", response.data);

        // API returns {code, message, data: Array}
        const meetingsArray = response.data?.data || [];
        setMeetings(meetingsArray);
      } catch (error) {
        console.error("Lỗi tải cuộc họp:", error);
        toast.error("Không thể tải danh sách cuộc họp!");
        setMeetings([]);
      } finally {
        setMeetingLoading(false);
      }
    };

    fetchMeetings();
  }, [selectedRoom, selectedDate]);

  const filteredRooms = rooms.filter((room) =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusText = (status) => {
    const statusMap = {
      SCHEDULED: "Scheduled",
      CANCELLED: "Cancelled",
      COMPLETED: "Completed",
      PENDING_APPROVAL: "Pending",
    };
    return statusMap[status] || status;
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const handleMenuClick = (itemId) => {
    setActiveMenuItem(itemId);
  };

  const handleDateSelect = (date) => {
    console.log("Date selected:", date);
    setSelectedDate(date);
    setShowCalendar(false);
  };

  const handleClearDate = () => {
    setSelectedDate(null);
  };

  return (
    <div className="my-project-container">
      <ToastContainer autoClose={1500} style={{ top: "70px" }} />
      <NavBar onToggleSidebar={toggleSidebar} />
      <SideBarUser
        activeItem={activeMenuItem}
        onItemClick={handleMenuClick}
        isOpen={sidebarOpen}
        onClose={closeSidebar}
      />

      <div className="main-layout">
        <main className="main-content-i">
          <div className="room-meeting-container">
            <div className="room-meeting-header">
              <div>
                <h1>Meeting Room Management</h1>
                <p>View meeting schedule by room</p>
              </div>
              <div className="room-meeting-header-icon">
                <Calendar size={40} color="#2563eb" strokeWidth={1.5} />
              </div>
            </div>

            <div className="room-meeting-main-content">
              {/* Left Panel - Rooms */}
              <div className="room-meeting-left-panel">
                <div className="room-meeting-search-container">
                  <Search size={20} color="#666" />
                  <input
                    type="text"
                    placeholder="Search rooms..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="room-meeting-search-input"
                  />
                </div>

                <div className="room-meeting-rooms-section">
                  <h2 className="room-meeting-section-title">Room List</h2>
                  {loading ? (
                    <div className="room-meeting-loading-text">Loading...</div>
                  ) : filteredRooms.length > 0 ? (
                    <div className="room-meeting-rooms-list">
                      {filteredRooms.map((room) => (
                        <div
                          key={room.id}
                          onClick={() => setSelectedRoom(room)}
                          className={`room-meeting-room-item ${
                            selectedRoom?.id === room.id ? "active" : ""
                          }`}
                        >
                          <div className="room-meeting-room-item-content">
                            <div className="room-meeting-room-item-header">
                              <MapPin size={16} color="#2563eb" />
                              <h3 className="room-meeting-room-name">
                                {room.name}
                              </h3>
                            </div>
                            {room.capacity && (
                              <p className="room-meeting-room-capacity">
                                Capacity: {room.capacity} people
                              </p>
                            )}
                            {room.location && (
                              <p className="room-meeting-room-location">
                                {room.location}
                              </p>
                            )}
                          </div>
                          {selectedRoom?.id === room.id && (
                            <ChevronRight size={20} color="#2563eb" />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="room-meeting-empty-state">
                      No rooms found
                    </div>
                  )}
                </div>
              </div>

              {/* Right Panel - Meetings */}
              <div className="room-meeting-right-panel">
                {selectedRoom ? (
                  <>
                    <div className="room-meeting-selected-room-header">
                      <div style={{ flex: 1 }}>
                        <h2 className="room-meeting-selected-room-title">
                          {selectedRoom.name}
                        </h2>
                        <p className="room-meeting-selected-room-info">
                          {selectedRoom.capacity &&
                            `${selectedRoom.capacity} seats`}
                          {selectedRoom.capacity &&
                            selectedRoom.location &&
                            " • "}
                          {selectedRoom.location}
                        </p>
                      </div>
                      <div className="room-meeting-calendar-trigger">
                        <button
                          className="room-meeting-calendar-btn"
                          onClick={() => setShowCalendar(!showCalendar)}
                        >
                          <Calendar size={20} />
                          {selectedDate
                            ? formatDate(selectedDate)
                            : "Select date"}
                        </button>
                        {selectedDate && (
                          <button
                            className="room-meeting-clear-date-btn"
                            onClick={handleClearDate}
                            title="Clear date filter"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    </div>

                    {showCalendar && (
                      <div className="room-meeting-calendar-wrapper">
                        <Calendar2
                          value={selectedDate || new Date()}
                          onChange={handleDateSelect}
                          locale="vi-VN"
                          className="room-meeting-mini-calendar"
                        />
                      </div>
                    )}

                    <div className="room-meeting-meetings-section">
                      <h2 className="room-meeting-section-title">
                        Upcoming meetings{" "}
                        {selectedDate ? `on ${formatDate(selectedDate)}` : ""} (
                        {meetings.length})
                      </h2>

                      {meetingLoading ? (
                        <div className="room-meeting-loading-text">
                          Loading meetings...
                        </div>
                      ) : meetings.length > 0 ? (
                        <div className="room-meeting-meetings-list">
                          {meetings.map((meeting) => (
                            <div key={meeting.id} className="room-meeting-card">
                              <div className="room-meeting-card-header">
                                <div style={{ flex: 1 }}>
                                  <h3 className="room-meeting-card-title">
                                    {meeting.title}
                                  </h3>
                                  <div className="room-meeting-card-meta">
                                    <Clock size={14} color="#666" />
                                    <span>
                                      {formatDate(meeting.startTime)} •{" "}
                                      {formatTime(meeting.startTime)} -{" "}
                                      {formatTime(meeting.endTime)}
                                    </span>
                                  </div>
                                </div>
                                <span
                                  className={`room-meeting-status-badge room-meeting-status-${meeting.status
                                    .toLowerCase()
                                    .replace("_", "-")}`}
                                >
                                  {getStatusText(meeting.status)}
                                </span>
                              </div>

                              {meeting.description && (
                                <p className="room-meeting-description">
                                  {meeting.description}
                                </p>
                              )}

                              {meeting.participants &&
                                meeting.participants.length > 0 && (
                                  <div className="room-meeting-participants-section">
                                    <div className="room-meeting-participants-label">
                                      <Users size={14} color="#666" />
                                      <span>
                                        Attendees: {meeting.participants.length}
                                      </span>
                                    </div>
                                    <div className="room-meeting-participants-list">
                                      {meeting.participants
                                        .slice(0, 3)
                                        .map((p, idx) => (
                                          <div
                                            key={idx}
                                            className="room-meeting-participant-badge"
                                            title={p.user?.email}
                                          >
                                            {p.user?.email
                                              ?.charAt(0)
                                              .toUpperCase()}
                                          </div>
                                        ))}
                                      {meeting.participants.length > 3 && (
                                        <div className="room-meeting-participant-badge-more">
                                          +{meeting.participants.length - 3}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                              {meeting.creator && (
                                <p className="room-meeting-creator-info">
                                  Created by:{" "}
                                  {meeting.creator?.name ||
                                    meeting.creator?.email}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="room-meeting-empty-state">
                          No meetings found
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="room-meeting-no-room-selected">
                    <Calendar size={48} color="#ccc" />
                    <p>Select a room to view meetings</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default RoomMeeting;
