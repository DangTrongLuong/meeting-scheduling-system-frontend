
import React, { useEffect, useMemo, useState, useRef } from "react";
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

// 👉 Import layout components có sẵn
import SideBarUser from "../../components/SideBarUser";
import NavBarUser from "../../components/NavBarUser";

// Styles
import "../../styles/User/Search.css";
import "../../styles/User/SideBarUser.css";
import "../../styles/ProgressBar.css";

// ✅ API base an toàn theo môi trường (Vite/CRA/runtime)
const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ??
  (typeof process !== "undefined" && process.env?.REACT_APP_API_BASE_URL) ??
  (typeof window !== "undefined" && window.__ENV__?.API_BASE_URL) ??
  "";

// Helper: convert date + time -> ISO nếu cần
function toISOString(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = timeStr.split(":").map(Number);
  const dt = new Date(y, m - 1, d, hh, mm, 0);
  return dt.toISOString();
}

const Search = () => {
  const navigate = useNavigate();

  /** -------------------------
   * Layout state (NavBar + Sidebar)
   * ------------------------- */
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenuItem, setActiveMenuItem] = useState("search"); // đánh dấu mục Search

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const closeSidebar = () => setSidebarOpen(false);
  const handleMenuClick = (itemId) => setActiveMenuItem(itemId);

  /** -------------------------
   * Search form state
   * ------------------------- */
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [participants, setParticipants] = useState(1);
  const [activeDevices, setActiveDevices] = useState([]); // /devices/active
  const [selectedDeviceIds, setSelectedDeviceIds] = useState([]);

  /** -------------------------
   * Results & status
   * ------------------------- */
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [availabilityChecked, setAvailabilityChecked] = useState(false);

  /** -------------------------
   * Fetch devices (active)
   * ------------------------- */
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

  /** -------------------------
   * Validation
   * ------------------------- */
  const validationErrors = useMemo(() => {
    const errs = [];
    if (!date) errs.push("Vui lòng chọn ngày.");
    if (!startTime) errs.push("Vui lòng chọn giờ bắt đầu.");
    if (!endTime) errs.push("Vui lòng chọn giờ kết thúc.");
    if (startTime && endTime && startTime >= endTime)
      errs.push("Giờ bắt đầu phải nhỏ hơn giờ kết thúc.");
    if (!participants || Number(participants) <= 0)
      errs.push("Số lượng tham gia phải lớn hơn 0.");
    return errs;
  }, [date, startTime, endTime, participants]);

  /** -------------------------
   * Backend calls
   * ------------------------- */
  async function fetchAllRooms(sortBy = "name", direction = "asc") {
    const res = await fetch(
      `${API_BASE}/get-all-rooms?sortBy=${encodeURIComponent(
        sortBy
      )}&direction=${encodeURIComponent(direction)}`
    );
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  }

  async function fetchRoomDevices(roomId) {
    const res = await fetch(`${API_BASE}/rooms/${roomId}/devices`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  }

  // Gợi ý endpoint availability (nếu có trên backend)
  async function checkRoomAvailability(roomId, dateStr, start, end) {
    try {
      const url = `${API_BASE}/rooms/${roomId}/availability?date=${encodeURIComponent(
        dateStr
      )}&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`;
      const res = await fetch(url);
      if (!res.ok) return { available: null };
      const data = await res.json();
      return { available: !!data?.available };
    } catch {
      return { available: null };
    }
  }

  /** -------------------------
   * Search handler
   * ------------------------- */
  async function handleSearch(e) {
    e.preventDefault();
    setErrors(validationErrors);
    if (validationErrors.length) return;

    setLoading(true);
    setAvailabilityChecked(false);

    try {
      // 1) rooms
      const roomList = await fetchAllRooms("name", "asc");

      // 2) devices per room
      const roomsWithDevices = await Promise.all(
        roomList.map(async (room) => {
          const id = room.id ?? room.roomId;
          const devices = await fetchRoomDevices(id);
          return { ...room, _devices: devices, _id: id };
        })
      );

      // 3) filter by equipment & capacity
      const filteredByEquipmentAndCapacity = roomsWithDevices.filter((room) => {
        const capacity =
          room.capacity ?? room.maxCapacity ?? room.seatCount ?? 0;
        if (capacity < Number(participants)) return false;

        if (!selectedDeviceIds.length) return true;

        const deviceIdsInRoom = (room._devices || []).map(
          (d) => d.id ?? d.deviceId
        );
        return selectedDeviceIds.every((needId) =>
          deviceIdsInRoom.includes(needId)
        );
      });

      setRooms(filteredByEquipmentAndCapacity);

      // 4) optional availability
      const dateStr = date;
      const startStr = startTime;
      const endStr = endTime;

      const availabilityResults = await Promise.all(
        filteredByEquipmentAndCapacity.map((room) =>
          checkRoomAvailability(room._id, dateStr, startStr, endStr)
        )
      );

      const merged = filteredByEquipmentAndCapacity.map((room, idx) => ({
        ...room,
        _availability: availabilityResults[idx]?.available, // true|false|null
      }));

      setFilteredRooms(merged);
      setAvailabilityChecked(true);
    } catch (err) {
      console.error(err);
      setErrors(["Có lỗi xảy ra khi tìm kiếm. Vui lòng thử lại."]);
      setRooms([]);
      setFilteredRooms([]);
    } finally {
      setLoading(false);
    }
  }

  /** -------------------------
   * Device multi-select
   * ------------------------- */
  function toggleDeviceSelection(deviceId) {
    setSelectedDeviceIds((prev) =>
      prev.includes(deviceId)
        ? prev.filter((id) => id !== deviceId)
        : [...prev, deviceId]
    );
  }

  /** -------------------------
   * Render
   * ------------------------- */
  return (
    <div className="user-layout">
      {/* NavBar ở trên, nhận toggle sidebar */}
      <NavBarUser onToggleSidebar={toggleSidebar} />

      <div className="main-content-user">
        {/* Sidebar bên trái */}
        <SideBarUser
          activeItem={activeMenuItem}
          onItemClick={handleMenuClick}
          isOpen={sidebarOpen}
          onClose={closeSidebar}
        />

        {/* Nội dung Search ở bên phải */}
        <div className="user-content">
          <div className="search-page">
            <div className="search-header">
              <h2 className="search-title">Tìm phòng trống</h2>
              <p className="search-subtitle">
                Lọc theo ngày, giờ, trang thiết bị và số lượng tham gia.
              </p>
            </div>

            <form className="search-form" onSubmit={handleSearch}>
              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">
                    <CalendarIcon size={16} /> Ngày
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">
                    <Clock size={16} /> Bắt đầu
                  </label>
                  <input
                    type="time"
                    className="form-input"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">
                    <Clock size={16} /> Kết thúc
                  </label>
                  <input
                    type="time"
                    className="form-input"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">
                    <Users size={16} /> Số lượng
                  </label>
                  <input
                    type="number"
                    min={1}
                    className="form-input"
                    value={participants}
                    onChange={(e) => setParticipants(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-field">
                <label className="form-label">
                  <Wrench size={16} /> Trang thiết bị yêu cầu
                </label>
                <div className="device-list">
                  {activeDevices.length === 0 ? (
                    <div className="muted">
                      Không có thiết bị khả dụng hoặc tải lỗi.
                    </div>
                  ) : (
                    activeDevices.map((dev) => {
                      const id = dev.id ?? dev.deviceId;
                      const name = dev.name ?? dev.deviceName ?? `Device ${id}`;
                      const checked = selectedDeviceIds.includes(id);
                      return (
                        <label
                          key={id}
                          className={`device-chip ${
                            checked ? "selected" : ""
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleDeviceSelection(id)}
                          />
                          <span>{name}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              {errors.length > 0 && (
                <div className="errors">
                  {errors.map((err, i) => (
                    <div key={i} className="error-item">
                      <AlertCircle size={16} /> {err}
                    </div>
                  ))}
                </div>
              )}

              <div className="actions">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  <SearchIcon size={16} /> {loading ? "Đang tìm..." : "Tìm phòng trống"}
                </button>
              </div>
            </form>

            {/* Kết quả */}
            <div className="search-results">
              {loading ? (
                <div className="skeleton">Đang tải kết quả...</div>
              ) : filteredRooms.length === 0 ? (
                <div className="empty">
                  {availabilityChecked
                    ? "Không có phòng phù hợp."
                    : "Nhập tiêu chí và bấm tìm để xem kết quả."}
                </div>
              ) : (
                filteredRooms.map((room) => {
                  const roomName = room.name ?? room.roomName ?? `Phòng ${room._id}`;
                  const capacity =
                    room.capacity ?? room.maxCapacity ?? room.seatCount ?? "—";
                  const devices = (room._devices || []).map(
                    (d) => d.name ?? d.deviceName ?? d.type ?? `Thiết bị ${d.id}`
                  );

                  const availability = room._availability; // true|false|null
                  const badge =
                    availability === true
                      ? {
                          text: "Trống",
                          cls: "badge-available",
                          icon: <CheckCircle2 size={14} />,
                        }
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
                        <div className="search-card-desc">
                          <strong>Sức chứa:</strong> {capacity}
                        </div>
                        <div className="search-card-desc">
                          <strong>Thiết bị:</strong>{" "}
                          {devices.length ? devices.join(", ") : "—"}
                        </div>
                      </div>
                      <div className="search-card-actions">
                        {/* Điều hướng tới trang chi tiết phòng nếu bạn có */}
                        <button
                          className="btn btn-outline"
                          onClick={() => navigate(`/rooms/${room._id}`)}
                        >
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
      </div>
    </div>
  );
};

export default Search;
