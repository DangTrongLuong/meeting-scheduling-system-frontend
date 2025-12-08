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

  // Data
  const [rooms, setRooms] = useState([]); // all rooms meta
  const [selectedRoom, setSelectedRoom] = useState("");
  const [filteredRooms, setFilteredRooms] = useState([]); // results shown to user

  const [activeDevices, setActiveDevices] = useState([]); // list of devices available system-wide
  const [selectedDeviceIds, setSelectedDeviceIds] = useState([]);

  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [participants, setParticipants] = useState("");

  const [availabilityChecked, setAvailabilityChecked] = useState(false);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);

  /** ==================== API helpers ==================== */

  async function fetchRoomDevices(roomId) {
    const res = await axios.get(`api/meetings/rooms/${roomId}/devices`);
    return res.data;
  }

  async function fetchActiveDevices() {
    try {
      const res = await axios.get("/api/meetings/devices/active");
      setActiveDevices(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("fetchActiveDevices error", err);
      setActiveDevices([]);
    }
  }

  async function fetchAllRooms() {
    try {
      const res = await axios.get("/api/meetings/get-all-rooms");
      setRooms(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("fetchAllRooms error", err);
    }
  }

  // Check availability for a room in a time range (backend should accept date + start + end)
async function checkRoomAvailability(roomId, date, start, end) {
  try {
    const res = await axios.get(`/api/meetings/rooms/${roomId}/availability`, {
      params: { date, start, end },
    });

    // Thử lấy mọi dạng thường gặp
    const raw =
      res.data?.available ??
      res.data?.data?.available ??
      res.data?.result?.available ??
      res.data?.isAvailable ??
      null;

    // Chuẩn hoá: true/"true" → true, false/"false" → false
    const available =
      raw === true || raw === "true"
        ? true
        : raw === false || raw === "false"
        ? false
        : null;

    return { available };
  } catch (err) {
    console.error("checkRoomAvailability err", err);
    return { available: null };
  }
}


  // Get schedule of a room for a whole day (used when user selects date + room but no times)
async function fetchRoomScheduleForDay(roomId, date) {
  try {
    const startDate = `${date}T00:00:00`;
    const endDate   = `${date}T23:59:59`;

    const res = await axios.get(`api/meetings/rooms/${roomId}/schedule`, {
      params: { startDate, endDate },
    });

    console.log("=== RAW SCHEDULE RESPONSE ===");
    console.log(res.data);

    return Array.isArray(res.data) ? res.data : res.data?.data ?? [];
  } catch (err) {
    console.error("fetchRoomScheduleForDay err", err);
    return [];
  }
}



  // Find rooms that have a specific device (used to suggest borrow locations)
  async function findRoomsWithDevice(deviceId) {
    try {
      // backend endpoint expectation: GET /devices/:deviceId/rooms
      const res = await axios.get(`api/meetings/devices/${deviceId}/rooms`);
      return Array.isArray(res.data) ? res.data : res.data?.data ?? [];
    } catch (err) {
      console.error("findRoomsWithDevice err", err);
      return [];
    }
  }

  /** ==================== Init Load ==================== */

  useEffect(() => {
    fetchActiveDevices();
    fetchAllRooms();
  }, []);

  /** ==================== Validation ==================== */
  function validate() {
    const arr = [];
    if (!date) arr.push("Chưa chọn ngày họp");

    // allow empty start/end (user may want to see daily schedule when room selected)
    // but if one is provided, require the other
    if ((startTime && !endTime) || (!startTime && endTime))
      arr.push("Cần chọn cả giờ bắt đầu và giờ kết thúc hoặc để trống cả hai");

    // check time ordering
    if (startTime && endTime && startTime >= endTime)
      arr.push("Giờ kết thúc phải lớn hơn giờ bắt đầu");

    if (participants && Number(participants) <= 0)
      arr.push("Số người không hợp lệ");

    return arr;
  }

  /** ==================== Main Search ==================== */

  async function handleSearch(e) {
    e.preventDefault();
    setErrors([]);
    const val = validate();
    setErrors(val);
    if (val.length) return;

    setLoading(true);
    setAvailabilityChecked(false);

    try {
      // CASE A: User selected a specific room AND left both startTime & endTime empty:
      // -> show that room's schedule for the chosen date (no availability check).
      if (selectedRoom && !startTime && !endTime) {
        const schedule = await fetchRoomScheduleForDay(selectedRoom, date);

        // map schedule to a format our UI can render
        const results = [
          {
            _id: selectedRoom,
            name:
              (rooms.find((r) => (r.id ?? r.roomId) === selectedRoom)?.name) ||
              `Phòng ${selectedRoom}`,
            _schedule: schedule.map((m) => ({
              startTime: m.startTime?.slice(11, 16) ?? m.start?.slice(11, 16),
              endTime: m.endTime?.slice(11, 16) ?? m.end?.slice(11, 16),
              title: m.title ?? m.subject ?? "-",
            })),
            _availability: null,
          },
        ];

        setFilteredRooms(results);
        setAvailabilityChecked(true);
        return;
      }

      // Otherwise CASE B: We need to check rooms (either all rooms or one selected) for capacity, devices, and availability (if time provided)
      const sourceRooms = selectedRoom
        ? rooms.filter((r) => (r.id ?? r.roomId) === selectedRoom)
        : rooms;

      // fetch devices for each room
      const roomsWithDevices = await Promise.all(
        sourceRooms.map(async (room) => {
          const id = room.id ?? room.roomId;
          let devices = [];
          try {
            devices = await fetchRoomDevices(id);
            // ensure it's an array
            devices = Array.isArray(devices) ? devices : [];
          } catch (err) {
            devices = [];
          }
          return { ...room, _id: id, _devices: devices };
        })
      );

      // for each room, evaluate capacity & missing devices
      const evaluated = await Promise.all(
        roomsWithDevices.map(async (room) => {
          const capacity = room.capacity ?? room.maxCapacity ?? 0;
          const capacityOk =
            !participants || capacity >= Number(participants);

          // device ids present in room
          const deviceIdsInRoom = (room._devices ?? []).map(
            (x) => x.device?.id ?? x.id
          );

          // missing device ids from user's selection
          const missingDeviceIds = selectedDeviceIds.filter(
            (id) => !deviceIdsInRoom.includes(id)
          );

          // for each missing device, find rooms that have it (to suggest borrow)
          let missingDevices = [];
          if (missingDeviceIds.length) {
            missingDevices = await Promise.all(
              missingDeviceIds.map(async (did) => {
                const devMeta =
                  activeDevices.find((d) => d.device.id === did) ??
                  activeDevices.find((d) => d.id === did);
                const devName = devMeta?.device?.name ?? devMeta?.name ?? "Thiết bị";

                const roomsWithIt = await findRoomsWithDevice(did);
                const suggestions = (roomsWithIt || [])
                  .map((r) => r.name ?? r.roomName ?? r.nameRoom ?? r.id)
                  .slice(0, 3); // top 3 suggestions
                return { id: did, name: devName, suggestions };
              })
            );
          }

          // if user provided start & end -> check availability
          let avail = null;
          if (startTime && endTime) {
            const a = await checkRoomAvailability(room._id, date, startTime, endTime);
            avail = a.available;
          }

          return {
            ...room,
            _capacityOk: capacityOk,
            _capacity: capacity,
            _missingDevices: missingDevices,
            _availability: avail,
          };
        })
      );

      // If the user requested devices but some rooms didn't have them, we still show rooms but with missingDevices info.
      // Filter: we will return rooms that satisfy capacity. (If you want to exclude rooms with missing devices, change logic here.)
      const finalFiltered = evaluated.filter((r) => r._capacityOk);

      // If no room passes capacity filter, prepare errors
      if (!finalFiltered.length) {
        setFilteredRooms([]);
        setAvailabilityChecked(true);
        setErrors((prev) => [
          ...prev,
          `Không có phòng nào đáp ứng đủ ${participants} người.`,
        ]);
        return;
      }

      setFilteredRooms(finalFiltered);
      setAvailabilityChecked(true);
    } catch (err) {
      console.error("handleSearch err", err);
      setErrors((prev) => [...prev, "Lỗi khi tìm phòng. Vui lòng thử lại."]);
    } finally {
      setLoading(false);
    }
  }

  /** ==================== UI helpers ==================== */

  function toggleDevice(id) {
    setSelectedDeviceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function clearForm() {
    setFilteredRooms([]);
    setAvailabilityChecked(false);
    setErrors([]);
    setStartTime("");
    setEndTime("");
    setParticipants("");
    setSelectedDeviceIds([]);
    setSelectedRoom("");
    setDate(today);
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
          <p className="search-subtitle">Lọc theo ngày, giờ, sức chứa và thiết bị</p>
        </div>

        {/* FORM */}
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
                  <option key={room.id ?? room.roomId} value={room.id ?? room.roomId}>
                    {room.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* DEVICES */}
          <div className="form-field">
            <label className="form-label">
              <Wrench size={14} /> Thiết bị yêu cầu
            </label>

            <div className="device-list">
              {activeDevices.map((d) => {
                const id = d.device?.id ?? d.id;
                const name = d.device?.name ?? d.name ?? "Thiết bị";
                return (
                  <label
                    key={id}
                    className={
                      "device-chip" + (selectedDeviceIds.includes(id) ? " selected" : "")
                    }
                    onClick={() => toggleDevice(id)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedDeviceIds.includes(id)}
                      readOnly
                    />
                    {name}
                  </label>
                );
              })}
            </div>
          </div>

          {/* ERRORS */}
          {!!errors.length && (
            <div className="errors">
              {errors.map((e, i) => (
                <div key={i} className="error-item">
                  <AlertCircle size={14} /> {e}
                </div>
              ))}
            </div>
          )}

          {/* ACTIONS */}
          <div className="actions">
            <button className="btn btn-primary" disabled={loading}>
              <SearchIcon size={16} />
              {loading ? "Đang tìm…" : "Tìm phòng"}
            </button>

            <button type="button" className="btn btn-outline" onClick={clearForm}>
              Xóa kết quả
            </button>
          </div>
        </form>

        {/* RESULTS */}
        <div className="search-results">
          {loading && <div className="skeleton">Đang kiểm tra phòng…</div>}

          {!loading && availabilityChecked && !filteredRooms.length && (
            <div className="empty">Không có phòng phù hợp</div>
          )}

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

                <div className="search-card-body">
                  <div className="search-card-title">{room.name}</div>
                  <div className="search-card-desc">
                    Sức chứa: {room._capacity ?? room.capacity ?? room.maxCapacity ?? "—"} người
                  </div>

                  {/* If this result is a daily schedule (case: selectedRoom && no times) */}
                  {Array.isArray(room._schedule) && room._schedule.length > 0 && (
                    <div className="room-schedule">
                      <div className="schedule-title">Lịch trong ngày:</div>
                      <ul>
                        {room._schedule.map((s, i) => (
                          <li key={i}>
                            {s.startTime} — {s.endTime} : {s.title}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {Array.isArray(room._schedule) && room._schedule.length === 0 && (
                    <div className="room-schedule empty">Phòng trống trong ngày</div>
                  )}

                  {/* Capacity check */}
                  {!Array.isArray(room._schedule) && room._capacity !== undefined && (
                    <>
                      {!room._capacityOk && (
                        <div className="warning">
                          <AlertCircle size={14} /> Không đủ sức chứa ({room._capacity} người)
                        </div>
                      )}
                    </>
                  )}

                  {/* Missing devices info & suggestions */}
                  {!Array.isArray(room._schedule) &&
                    room._missingDevices &&
                    room._missingDevices.length > 0 && (
                      <div className="missing-devices">
                        <div>
                          <strong>Thiếu thiết bị:</strong>{" "}
                          {room._missingDevices.map((md) => md.name).join(", ")}
                        </div>

                        {room._missingDevices.map((md) => (
                          <div key={md.id} className="device-suggestions">
                            {md.suggestions && md.suggestions.length > 0 ? (
                              <div>
                                Có thể mượn <strong>{md.name}</strong> từ phòng:{" "}
                                {md.suggestions.join(", ")}
                              </div>
                            ) : (
                              <div>Không tìm thấy phòng có {md.name}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                  {/* Availability detail when time provided */}
                  {!Array.isArray(room._schedule) && startTime && endTime && (
                    <div className="availability-detail">
                      {room._availability === true && (
                        <div className="available">
                          <CheckCircle2 size={14} /> Phòng trống trong khoảng {startTime} —{" "}
                          {endTime}. Bạn có thể đặt.
                        </div>
                      )}
                      {room._availability === false && (
                        <div className="busy">
                          <AlertCircle size={14} /> Phòng bận trong khoảng {startTime} —{" "}
                          {endTime}.
                        </div>
                      )}
                      {room._availability === null && (
                        <div className="unknown">
                          <AlertCircle size={14} /> Không thể kiểm tra trạng thái.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
