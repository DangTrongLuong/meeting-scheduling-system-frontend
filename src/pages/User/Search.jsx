import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
  useCallback,
} from "react";
import {
  Search as SearchIcon,
  Calendar as CalendarIcon,
  Clock,
  Users,
  Wrench,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

// Layout components
import SideBarUser from "../../components/SideBarUser";
import NavBarUser from "../../components/NavBarUser";

// Styles
import "../../styles/User/Search.css";
import "../../styles/User/SideBarUser.css";
import "../../styles/ProgressBar.css";

// API base
const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ??
  (typeof process !== "undefined" && process.env?.REACT_APP_API_BASE_URL) ??
  (typeof window !== "undefined" && window.__ENV__?.API_BASE_URL) ??
  "";

const Search = () => {
  const navigate = useNavigate();

  // Layout state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenuItem, setActiveMenuItem] = useState("search");

  // Form state
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [participants, setParticipants] = useState(1);
  const [activeDevices, setActiveDevices] = useState([]);
  const [selectedDeviceIds, setSelectedDeviceIds] = useState([]);

  // Results
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [rooms, setRooms] = useState([]); // Tất cả phòng
  const [filteredRooms, setFilteredRooms] = useState([]); // Kết quả tìm kiếm
  const [availabilityChecked, setAvailabilityChecked] = useState(false);

  // Right Sidebar State
  const [roomSearchTerm, setRoomSearchTerm] = useState("");
  const [selectedRoomIds, setSelectedRoomIds] = useState([]); // Lọc theo phòng được chọn
  const [bookedRoomsToday, setBookedRoomsToday] = useState([]); // Danh sách phòng đã đặt hôm nay

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const closeSidebar = () => setSidebarOpen(false);
  const handleMenuClick = (itemId) => setActiveMenuItem(itemId);

  // Fetch active devices
  useEffect(() => {
    async function fetchActiveDevices() {
      try {
        const res = await fetch(`${API_BASE}/devices/active`);
        const data = await res.json();
        setActiveDevices(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        setActiveDevices([]);
      }
    }
    fetchActiveDevices();
  }, []);

  // Giả lập: Lấy danh sách phòng đã đặt hôm nay (thay bằng API thật)
  useEffect(() => {
    // Ví dụ: gọi API /bookings/today
    // setBookedRoomsToday([1, 5, 8]);
  }, []);

  // Validation
  const validationErrors = useMemo(() => {
    const errs = [];
    if (!date) errs.push("Vui lòng chọn ngày.");
    if (!startTime) errs.push("Vui lòng chọn giờ bắt đầu.");
    if (!endTime) errs.push("Vui lòng chọn giờ kết thúc.");
    if (startTime && endTime && startTime >= endTime)
      errs.push("Giờ bắt đầu phải nhỏ hơn giờ kết thúc.");
    if (!participants || Number(participants) <= 0)
      errs.push("Số lượng tham gia phải lớn hơn 0.");
    if (date && new Date(date) < new Date().setHours(0, 0, 0, 0))
      errs.push("Không thể chọn ngày trong quá khứ.");
    return errs;
  }, [date, startTime, endTime, participants]);

  // Reset kết quả khi thay đổi form
  useEffect(() => {
    setFilteredRooms([]);
    setAvailabilityChecked(false);
    setErrors([]);
  }, [date, startTime, endTime, participants, selectedDeviceIds]);

  // API calls
  async function fetchAllRooms() {
    const res = await fetch(`${API_BASE}/get-all-rooms?sortBy=name&direction=asc`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  }

  async function fetchRoomDevices(roomId) {
    const res = await fetch(`${API_BASE}/rooms/${roomId}/devices`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  }

  async function checkRoomAvailability(roomId, dateStr, start, end) {
    try {
      const url = `${API_BASE}/rooms/${roomId}/availability?date=${dateStr}&start=${start}&end=${end}`;
      const res = await fetch(url);
      if (!res.ok) return { available: null };
      const data = await res.json();
      return { available: !!data?.available };
    } catch {
      return { available: null };
    }
  }

  // Search handler
  async function handleSearch(e) {
    e.preventDefault();
    setErrors(validationErrors);
    if (validationErrors.length) return;

    setLoading(true);
    setAvailabilityChecked(false);

    try {
      const roomList = await fetchAllRooms();
      const roomsWithDevices = await Promise.all(
        roomList.map(async (room) => {
          const id = room.id ?? room.roomId;
          const devices = await fetchRoomDevices(id);
          return { ...room, _devices: devices, _id: id };
        })
      );

      const filteredByCapacityAndDevices = roomsWithDevices.filter((room) => {
        const capacity = room.capacity ?? room.maxCapacity ?? room.seatCount ?? 0;
        if (capacity < Number(participants)) return false;

        if (!selectedDeviceIds.length) return true;
        const deviceIdsInRoom = (room._devices || []).map((d) => d.id ?? d.deviceId);
        return selectedDeviceIds.every((id) => deviceIdsInRoom.includes(id));
      });

      setRooms(roomsWithDevices);
      setFilteredRooms(filteredByCapacityAndDevices);

      // Kiểm tra availability
      const availabilityResults = await Promise.all(
        filteredByCapacityAndDevices.map((room) =>
          checkRoomAvailability(room._id, date, startTime, endTime)
        )
      );

      const finalResults = filteredByCapacityAndDevices.map((room, idx) => ({
        ...room,
        _availability: availabilityResults[idx]?.available,
      }));

      setFilteredRooms(finalResults);
      setAvailabilityChecked(true);
    } catch (err) {
      console.error(err);
      setErrors(["Có lỗi xảy ra khi tìm kiếm. Vui lòng thử lại."]);
    } finally {
      setLoading(false);
    }
  }

  // Toggle device
  function toggleDeviceSelection(deviceId) {
    setSelectedDeviceIds((prev) =>
      prev.includes(deviceId) ? prev.filter((id) => id !== deviceId) : [...prev, deviceId]
    );
  }

  // Right sidebar: Toggle room selection
  const toggleRoomSelection = (roomId) => {
    setSelectedRoomIds((prev) =>
      prev.includes(roomId) ? prev.filter((id) => id !== roomId) : [...prev, roomId]
    );
  };

  // Lọc phòng trong sidebar theo từ khóa
  const filteredRoomsForSidebar = useMemo(() => {
    if (!roomSearchTerm) return rooms;
    return rooms.filter((room) =>
      (room.name || "").toLowerCase().includes(roomSearchTerm.toLowerCase())
    );
  }, [rooms, roomSearchTerm]);

  // Kiểm tra phòng đã full hôm nay (giả lập)
  const isRoomFullyBookedToday = (roomId) => bookedRoomsToday.includes(roomId);

  return (
    <div className="user-layout">
      <NavBarUser onToggleSidebar={toggleSidebar} />

      <div className="main-content-user" style={{ display: "flex", minHeight: "100vh" }}>
        {/* Sidebar trái */}
        <SideBarUser
          activeItem={activeMenuItem}
          onItemClick={handleMenuClick}
          isOpen={sidebarOpen}
          onClose={closeSidebar}
        />

        {/* Nội dung chính - trải rộng */}
        <div className="user-content" style={{ flex: 1, padding: "24px", overflow: "auto" }}>
          <div className="search-page">
            <div className="search-header">
              <h2 className="search-title">Tìm phòng trống</h2>
              <p className="search-subtitle">
                Lọc theo ngày, giờ, thiết bị và số lượng tham gia.
              </p>
            </div>

            <form className="search-form" onSubmit={handleSearch}>
              {/* Form fields như cũ */}
              <div className="form-row">
                <div className="form-field">
                  <label className="form-label"><CalendarIcon size={16} /> Ngày</label>
                  <input type="date" className="form-input" value={date} onChange={(e) => setDate(e.target.value)} required />
                </div>
                <div className="form-field">
                  <label className="form-label"><Clock size={16} /> Bắt đầu</label>
                  <input type="time" className="form-input" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
                </div>
                <div className="form-field">
                  <label className="form-label"><Clock size={16} /> Kết thúc</label>
                  <input type="time" className="form-input" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
                </div>
                <div className="form-field">
                  <label className="form-label"><Users size={16} /> Số lượng</label>
                  <input type="number" min={1} className="form-input" value={participants} onChange={(e) => setParticipants(e.target.value)} required />
                </div>
              </div>

              <div className="form-field">
                <label className="form-label"><Wrench size={16} /> Trang thiết bị</label>
                <div className="device-list">
                  {activeDevices.map((dev) => {
                    const id = dev.id ?? dev.deviceId;
                    const name = dev.name ?? dev.deviceName ?? `Device ${id}`;
                    const checked = selectedDeviceIds.includes(id);
                    return (
                      <label key={id} className={`device-chip ${checked ? "selected" : ""}`}>
                        <input type="checkbox" checked={checked} onChange={() => toggleDeviceSelection(id)} />
                        <span>{name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {errors.length > 0 && (
                <div className="errors">
                  {errors.map((err, i) => (
                    <div key={i} className="error-item"><AlertCircle size={16} /> {err}</div>
                  ))}
                </div>
              )}

              <div className="actions">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  <SearchIcon size={16} /> {loading ? "Đang tìm..." : "Tìm phòng trống"}
                </button>
              </div>
            </form>

            {/* Kết quả tìm kiếm */}
            <div className="search-results" style={{ marginTop: "32px" }}>
              {loading ? (
                <div className="skeleton">Đang tải kết quả...</div>
              ) : filteredRooms.length === 0 ? (
                <div className="empty">
                  {availabilityChecked ? "Không có phòng phù hợp." : "Nhập tiêu chí và bấm tìm để xem kết quả."}
                </div>
              ) : (
                filteredRooms
                  .filter((room) => selectedRoomIds.length === 0 || selectedRoomIds.includes(room._id))
                  .map((room) => {
                    const roomName = room.name ?? `Phòng ${room._id}`;
                    const capacity = room.capacity ?? room.maxCapacity ?? "—";
                    const devices = (room._devices || []).map((d) => d.name ?? d.deviceName ?? "Thiết bị").join(", ");
                    const availability = room._availability;

                    const badge = availability === true
                      ? { text: "Trống", cls: "badge-available", icon: <CheckCircle2 size={14} /> }
                      : availability === false
                      ? { text: "Đã bận", cls: "badge-busy" }
                      : { text: "Chưa kiểm tra", cls: "badge-unknown" };

                    return (
                      <div key={room._id} className="search-card">
                        <div className={`badge ${badge.cls}`}>
                          {badge.icon} <span>{badge.text}</span>
                        </div>
                        <div className="search-card-body">
                          <div className="search-card-title">{roomName}</div>
                          <div className="search-card-desc"><strong>Sức chứa:</strong> {capacity}</div>
                          <div className="search-card-desc"><strong>Thiết bị:</strong> {devices || "—"}</div>
                        </div>
                        <div className="search-card-actions">
                          <button className="btn btn-outline" onClick={() => navigate(`/rooms/${room._id}`)}>
                            Xem chi tiết
                          </button>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </div>

        {/* SIDEBAR PHẢI - CỐ ĐỊNH */}
        <aside
          className="right-sidebar"
          style={{
            width: "850px",
            backgroundColor: "#f9f9fb",
            borderLeft: "1px solid #e0e0e0",
            padding: "24px 16px",
            overflowY: "auto",
            flexShrink: 0,
          }}
        >
          {/* 1. Rooms Booked Today */}
          <div className="room-box" style={{ marginBottom: "24px" }}>
            <h4 style={{ margin: "0 0 12px 0", fontSize: "15px", color: "#2c3e50" }}>
              Rooms Booked Today
            </h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, maxHeight: "120px", overflowY: "auto" }}>
              {bookedRoomsToday.length > 0 ? (
                bookedRoomsToday.map((roomId) => {
                  const room = rooms.find((r) => (r.id ?? r.roomId) === roomId);
                  return (
                    <li key={roomId} style={{ padding: "6px 0", display: "flex", alignItems: "center" }}>
                      <span style={{ display: "inline-block", width: "10px", height: "10px", backgroundColor: "#e74c3c", borderRadius: "50%", marginRight: "10px" }}></span>
                      <span style={{ fontSize: "14px" }}>{room?.name || `Phòng ${roomId}`}</span>
                    </li>
                  );
                })
              ) : (
                <li style={{ color: "#999", fontStyle: "italic", padding: "8px 0" }}>
                  No rooms booked today
                </li>
              )}
            </ul>
          </div>

          {/* 2. Filter by Room */}
          <div className="room-filter-panel" style={{ marginBottom: "24px" }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", color: "#2c3e50" }}>Filter by Room</h3>

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

            <div
              style={{
                maxHeight: "240px",
                overflowY: "auto",
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                padding: "8px",
                backgroundColor: "#fff",
              }}
            >
              {filteredRoomsForSidebar.map((room) => {
                const id = room.id ?? room.roomId;
                const isFullyBooked = isRoomFullyBookedToday(id);
                const isSelected = selectedRoomIds.includes(id);

                return (
                  <label
                    key={id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "10px 8px",
                      margin: "4px 0",
                      backgroundColor: isSelected ? "#e3f2fd" : "white",
                      borderRadius: "6px",
                      cursor: "pointer",
                      border: isSelected ? "2px solid #2196f3" : "1px solid #eee",
                      opacity: isFullyBooked ? 0.6 : 1,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleRoomSelection(id)}
                      style={{ marginRight: "10px" }}
                    />
                    <span style={{ fontWeight: "500", fontSize: "14px", flex: 1 }}>
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
                <p style={{ textAlign: "center", color: "#999", padding: "20px", fontStyle: "italic" }}>
                  No rooms match
                </p>
              )}
            </div>

            <div style={{ marginTop: "12px", textAlign: "center" }}>
              <button
                onClick={() =>
                  setSelectedRoomIds(
                    selectedRoomIds.length === rooms.length
                      ? []
                      : rooms.map((r) => r.id ?? r.roomId)
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
                {selectedRoomIds.length === rooms.length ? "Unselect All" : "Select All"}
              </button>
            </div>
          </div>

          {/* 3. All Rooms */}
          <div className="room-box">
            <h4 style={{ margin: "0 0 12px 0", fontSize: "15px", color: "#2c3e50" }}>All Rooms</h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, maxHeight: "180px", overflowY: "auto" }}>
              {rooms.map((room) => {
                const id = room.id ?? room.roomId;
                return (
                  <li key={id} style={{ padding: "6px 0", display: "flex", alignItems: "center" }}>
                    <span style={{ display: "inline-block", width: "10px", height: "10px", backgroundColor: "#3498db", borderRadius: "50%", marginRight: "10px" }}></span>
                    <span style={{ fontSize: "14px" }}>{room.name}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Search;