import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Search as SearchIcon,
  Calendar as CalendarIcon,
  Clock,
  Users,
  Wrench,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

import SideBarUser from "../../components/SideBarUser";
import NavBarUser from "../../components/NavBarUser";
import "../../styles/User/Search.css";

export default function Search() {
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenuItem, setActiveMenuItem] = useState("search");

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const closeSidebar = () => setSidebarOpen(false);
  const handleMenuClick = (itemId) => setActiveMenuItem(itemId);
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState("");
  const [filteredRooms, setFilteredRooms] = useState([]);

  const [activeDevices, setActiveDevices] = useState([]);
  const [selectedDeviceIds, setSelectedDeviceIds] = useState([]);

  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("07:00");
  const [endTime, setEndTime] = useState("07:30");
  const [participants, setParticipants] = useState("");

  const [availabilityChecked, setAvailabilityChecked] = useState(false);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);

  /** ==================== API ==================== */

  async function fetchRoomDevices(roomId) {
    const res = await axios.get(`/rooms/${roomId}/devices`);
    return res.data;
  }

  async function fetchActiveDevices() {
    try {
      const res = await axios.get("/api/meetings/devices/active");
      setActiveDevices(Array.isArray(res.data) ? res.data : []);
    } catch {
      setActiveDevices([]);
    }
  }

  /** ==================== Init Load ==================== */

  useEffect(() => {
    fetchActiveDevices(); // load thiết bị
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get("/api/meetings/get-all-rooms");
        setRooms(res.data);
      } catch (error) {
        console.error("Error fetching rooms:", error);
      }
    })();
  }, []);

  /** ==================== Check phòng trống ==================== */

  async function checkRoomAvailability(roomId, date, start, end) {
    try {
      const res = await axios.get(`/rooms/${roomId}/availability`, {
        params: { date, start, end },
      });
      return { available: !!res.data?.available };
    } catch {
      return { available: null };
    }
  }

  /** ==================== Validation ==================== */

  function validate() {
    const arr = [];
    if (!date) arr.push("Chưa chọn ngày họp");
    if (!startTime) arr.push("Chưa chọn giờ bắt đầu");
    if (!endTime) arr.push("Chưa chọn giờ kết thúc");
    if (participants && Number(participants) <= 0)
      arr.push("Số người không hợp lệ");
    return arr;
  }

  /** ==================== Main Search ==================== */

  async function handleSearch(e) {
    e.preventDefault();
    const val = validate();
    setErrors(val);
    if (val.length) return;

    setLoading(true);
    setAvailabilityChecked(false);

    try {
      // 1) Xác định danh sách phòng nguồn (toàn bộ hoặc phòng đã chọn)
      const sourceRooms = selectedRoom
        ? rooms.filter((r) => (r.id ?? r.roomId) === selectedRoom)
        : rooms;

      // 2) Lấy thiết bị từng phòng
      const roomsWithDevices = await Promise.all(
        sourceRooms.map(async (room) => {
          const id = room.id ?? room.roomId;
          const devices = await fetchRoomDevices(id);
          return { ...room, _id: id, _devices: devices };
        })
      );

      // 3) Lọc theo sức chứa + thiết bị
      const filtered = roomsWithDevices.filter((room) => {
        const capacity = room.capacity ?? room.maxCapacity ?? 0;
        if (participants && capacity < Number(participants)) return false;
        if (!selectedDeviceIds.length) return true;

        // Lấy danh sách device id trong phòng
        const deviceIds = (room._devices ?? []).map(
          (x) => x.device?.id ?? x.id
        );
        return selectedDeviceIds.every((id) => deviceIds.includes(id));
      });

      // 4) Kiểm tra phòng trống
      const availability = await Promise.all(
        filtered.map((room) =>
          checkRoomAvailability(room._id, date, startTime, endTime)
        )
      );

      const results = filtered.map((room, idx) => ({
        ...room,
        _availability: availability[idx]?.available,
      }));

      // 5) Cập nhật state
      setRooms(roomsWithDevices);
      setFilteredRooms(results);
      setAvailabilityChecked(true);
    } finally {
      setLoading(false);
    }
  }

  /** ==================== UI state ==================== */

  function toggleDevice(id) {
    setSelectedDeviceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  return (
    <div className="search-wrapper">
      <div className="search-page">
        <NavBarUser onToggleSidebar={toggleSidebar} />
        <SideBarUser
          activeItem={activeMenuItem}
          onItemClick={handleMenuClick}
          isOpen={sidebarOpen}
          onClose={closeSidebar}
        />

        <div className="search-header">
          <h1 className="search-title">Tìm phòng họp</h1>
          <p className="search-subtitle">
            Lọc theo ngày, giờ, sức chứa và thiết bị
          </p>
        </div>

        {/* ==================== FORM ==================== */}
        <form className="search-form" onSubmit={handleSearch}>
          <div className="form-row">
            <div className="form-field">
              <label className="form-label">
                <CalendarIcon size={14} /> Ngày họp
              </label>
              <input
                className="form-input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="form-field">
              <label className="form-label">
                <Clock size={14} /> Bắt đầu
              </label>
              <input
                className="form-input"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>

            <div className="form-field">
              <label className="form-label">
                <Clock size={14} /> Kết thúc
              </label>
              <input
                className="form-input"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>

            <div className="form-field">
              <label className="form-label">
                <Users size={14} /> Số người
              </label>
              <input
                className="form-input"
                type="number"
                min={1}
                value={participants}
                onChange={(e) => setParticipants(e.target.value)}
              />
            </div>

            <div className="form-field">
              <label className="form-label">
                <SearchIcon size={14} /> Phòng họp
              </label>
              <select
                className="form-input"
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
              >
                <option value="">-- Chọn phòng --</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ==================== DEVICES ==================== */}
          <div className="form-field">
            <label className="form-label">
              <Wrench size={14} /> Thiết bị yêu cầu
            </label>

            <div className="device-list">
              {activeDevices.map((d) => (
                <label
                  key={d.device.id}
                  className={
                    "device-chip" +
                    (selectedDeviceIds.includes(d.device.id) ? " selected" : "")
                  }
                  onClick={() => toggleDevice(d.device.id)}
                >
                  <input
                    type="checkbox"
                    checked={selectedDeviceIds.includes(d.device.id)}
                    readOnly
                  />
                  {d.device.name}
                </label>
              ))}
            </div>
          </div>

          {/* ==================== ERRORS ==================== */}
          {!!errors.length && (
            <div className="errors">
              {errors.map((e, i) => (
                <div key={i} className="error-item">
                  <AlertCircle size={14} /> {e}
                </div>
              ))}
            </div>
          )}

          {/* ==================== BUTTON ==================== */}
          <div className="actions">
            <button className="btn btn-primary" disabled={loading}>
              <SearchIcon size={16} />
              {loading ? "Đang tìm…" : "Tìm phòng"}
            </button>

            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                setFilteredRooms([]);
                setAvailabilityChecked(false);
                setErrors([]);
              }}
            >
              Xóa kết quả
            </button>
          </div>
        </form>

        {/* ==================== RESULTS ==================== */}
        <div className="search-results">
          {/* Skeleton */}
          {loading && <div className="skeleton">Đang kiểm tra phòng…</div>}

          {/* No result */}
          {!loading && availabilityChecked && !filteredRooms.length && (
            <div className="empty">Không có phòng phù hợp</div>
          )}

          {/* Cards */}
          {!loading &&
            filteredRooms.map((room) => (
              <div key={room._id} className="search-card">
                {/* Badge trạng thái */}
                <span
                  className={
                    "badge " +
                    (room._availability === true
                      ? "badge-available"
                      : room._availability === false
                      ? "badge-busy"
                      : "badge-unknown")
                  }
                >
                  {room._availability === true && (
                    <>
                      <CheckCircle2 size={14} /> Trống
                    </>
                  )}
                  {room._availability === false && (
                    <>
                      <AlertCircle size={14} /> Bận
                    </>
                  )}
                  {room._availability === null && (
                    <>
                      <AlertCircle size={14} /> Không xác định
                    </>
                  )}
                </span>

                <div>
                  <div className="search-card-title">{room.name}</div>
                  <div className="search-card-desc">
                    Sức chứa: {room.capacity ?? room.maxCapacity} người
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
