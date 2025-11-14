import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../../../styles/RoomDevice/EditAssignment.css";
import NavBar from "../../../components/NavBar";
import SideBarAdmin from "../../../components/SideBarAdmin";
import { ArrowLeft, ChevronDown } from "lucide-react";

const EditAssignment = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenuItem, setActiveMenuItem] = useState("room-devices");

  const [rooms, setRooms] = useState([]);
  const [devices, setDevices] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [filteredDevices, setFilteredDevices] = useState([]);

  const [roomSearch, setRoomSearch] = useState("");
  const [deviceSearch, setDeviceSearch] = useState("");
  const [roomDropdownOpen, setRoomDropdownOpen] = useState(false);
  const [deviceDropdownOpen, setDeviceDropdownOpen] = useState(false);

  const [selectedRoom, setSelectedRoom] = useState("");
  const [selectedRoomName, setSelectedRoomName] = useState("");
  const [selectedDevice, setSelectedDevice] = useState("");
  const [selectedDeviceName, setSelectedDeviceName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState("IN_USE");
  const [maxQuantity, setMaxQuantity] = useState(999);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  // Store original values để so sánh
  const [originalData, setOriginalData] = useState({
    roomId: "",
    deviceId: "",
    quantity: 1,
    status: "IN_USE",
  });

  const API_ROOMS = "http://localhost:8080/api/admin/rooms";
  const API_DEVICES = "http://localhost:8080/api/admin/devices?status=ACTIVE";
  const API_ASSIGNMENT = "http://localhost:8080/api/admin/room-devices";
  const token = localStorage.getItem("accessToken");

  // Load assignment data
  useEffect(() => {
    loadAssignmentData();
    loadRooms();
    loadDevices();
  }, [id]);

  const loadAssignmentData = async () => {
    try {
      const res = await fetch(`${API_ASSIGNMENT}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load assignment");
      const data = await res.json();

      const roomId = String(data.meetingRoom);
      const deviceId = String(data.device);

      setSelectedRoom(roomId);
      setSelectedRoomName(data.roomName);
      setSelectedDevice(deviceId);
      setSelectedDeviceName(data.deviceName);
      setQuantity(String(data.quantity));
      setStatus(data.status || "IN_USE");
      setMaxQuantity(data.quantity + (data.availableQuantity || 0));

      // Store original values
      setOriginalData({
        roomId: roomId,
        deviceId: deviceId,
        quantity: data.quantity,
        status: data.status || "IN_USE",
      });

      setPageLoading(false);
    } catch (err) {
      console.error("Error loading:", err);
      toast.error(err.message || "Failed to load assignment data");
      navigate("/deviceRoom");
    }
  };

  const loadRooms = async () => {
    try {
      const res = await fetch(API_ROOMS, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load rooms");
      const data = await res.json();
      setRooms(data);
      setFilteredRooms(data);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const loadDevices = async () => {
    try {
      const res = await fetch(API_DEVICES, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load devices");
      const data = await res.json();
      const active = data.filter((d) => d.status === "ACTIVE");
      setDevices(active);
      setFilteredDevices(active);
    } catch (err) {
      toast.error(err.message);
    }
  };

  useEffect(() => {
    const filtered = rooms.filter((r) =>
      r.name.toLowerCase().includes(roomSearch.toLowerCase())
    );
    setFilteredRooms(filtered);
  }, [roomSearch, rooms]);

  useEffect(() => {
    const filtered = devices.filter((d) =>
      d.name.toLowerCase().includes(deviceSearch.toLowerCase())
    );
    setFilteredDevices(filtered);
  }, [deviceSearch, devices]);

  const handleSelectRoom = (room) => {
    setSelectedRoom(room.id);
    setSelectedRoomName(room.name);
    setRoomDropdownOpen(false);
    setRoomSearch("");
    if (errors.room) {
      setErrors({ ...errors, room: "" });
    }
  };

  const handleSelectDevice = (device) => {
    setSelectedDevice(device.id);
    setSelectedDeviceName(device.name);
    setDeviceDropdownOpen(false);
    setDeviceSearch("");
    setMaxQuantity(device.totalQuantity);
    if (errors.device) {
      setErrors({ ...errors, device: "" });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!selectedRoom || selectedRoom === "") {
      newErrors.room = "Room is required";
    }

    if (!selectedDevice || selectedDevice === "") {
      newErrors.device = "Device is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form!");
      return;
    }

    // Kiểm tra có thay đổi gì không
    const hasChanges =
      String(selectedRoom) !== String(originalData.roomId) ||
      String(selectedDevice) !== String(originalData.deviceId) ||
      parseInt(quantity) !== originalData.quantity ||
      status !== originalData.status;

    console.log("HasChanges check:", {
      selectedRoom: String(selectedRoom),
      originalRoomId: String(originalData.roomId),
      selectedDevice: String(selectedDevice),
      originalDeviceId: String(originalData.deviceId),
      quantity: parseInt(quantity),
      originalQuantity: originalData.quantity,
      status,
      originalStatus: originalData.status,
      hasChanges,
    });

    if (!hasChanges) {
      toast.info("No changes to update");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_ASSIGNMENT}/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          roomId: selectedRoom,
          deviceId: selectedDevice,
          quantity: parseInt(quantity),
          status: status,
        }),
      });

      const contentType = res.headers.get("content-type");
      let errorMessage = "Update failed";
      let responseData = null;

      if (contentType && contentType.includes("application/json")) {
        responseData = await res.json();
        errorMessage = responseData.message || errorMessage;
      } else {
        errorMessage = await res.text();
      }

      if (!res.ok) {
        console.error("Error Response:", responseData);
        toast.error(errorMessage);
        return;
      }

      toast.success("Assignment updated successfully!");
      setTimeout(() => {
        navigate("/deviceRoom");
      }, 1500);
    } catch (err) {
      console.error("Catch Error:", err);
      toast.error(err.message || "Failed to update assignment!");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/deviceRoom");
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

  if (pageLoading) {
    return (
      <div className="my-project-container">
        <ToastContainer position="top-right" autoClose={3000} />
        <NavBar onToggleSidebar={toggleSidebar} />
        <SideBarAdmin
          activeItem={activeMenuItem}
          onItemClick={handleMenuClick}
          isOpen={sidebarOpen}
          onClose={closeSidebar}
        />
        <div className="main-layout">
          <main className="main-content">
            <div className="edit-assignment-loading">Loading...</div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="my-project-container">
      <ToastContainer
        position="top-right"
        autoClose={1200}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <NavBar onToggleSidebar={toggleSidebar} />
      <SideBarAdmin
        activeItem={activeMenuItem}
        onItemClick={handleMenuClick}
        isOpen={sidebarOpen}
        onClose={closeSidebar}
      />
      <div className="main-layout">
        <main className="main-content">
          <div className="edit-assignment-header">
            <button
              onClick={handleCancel}
              className="edit-assignment-btn-back"
              title="Back to list"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="edit-assignment-h1">
              Room Device Assignment/ Edit Device Assignment
            </h1>
          </div>

          <div className="edit-assignment-wrapper">
            <div className="edit-assignment-container">
              <form onSubmit={handleSubmit} className="edit-assignment-form">
                {/* Select Room */}
                <div className="edit-assignment-section">
                  <h2>Select Room</h2>

                  <div className="edit-assignment-group">
                    <label htmlFor="room">Room</label>
                    <div
                      className="searchable-select-wrapper"
                      onClick={() => setRoomDropdownOpen(!roomDropdownOpen)}
                    >
                      <div className="searchable-select-input">
                        {selectedRoomName || "Select room..."}
                        <ChevronDown
                          size={20}
                          className={`chevron ${
                            roomDropdownOpen ? "open" : ""
                          }`}
                        />
                      </div>
                      {roomDropdownOpen && (
                        <div className="searchable-select-dropdown">
                          <input
                            type="text"
                            placeholder="Search room..."
                            value={roomSearch}
                            onChange={(e) => setRoomSearch(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="searchable-select-search"
                            autoFocus
                          />
                          <ul className="searchable-select-options">
                            {filteredRooms.length === 0 ? (
                              <li className="no-results">No rooms found</li>
                            ) : (
                              filteredRooms.map((room) => (
                                <li
                                  key={room.id}
                                  onClick={() => handleSelectRoom(room)}
                                  className={
                                    selectedRoom === room.id ? "selected" : ""
                                  }
                                >
                                  <div className="option-name">{room.name}</div>
                                  <div className="option-detail">
                                    {room.location}
                                  </div>
                                </li>
                              ))
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                    {errors.room && (
                      <span className="edit-assignment-error">
                        {errors.room}
                      </span>
                    )}
                  </div>
                </div>

                {/* Select Device */}
                <div className="edit-assignment-section">
                  <h2>Select Device</h2>

                  <div className="edit-assignment-group">
                    <label htmlFor="device">
                      Device <span className="edit-assignment-required">*</span>
                    </label>
                    <div
                      className="searchable-select-wrapper"
                      onClick={() => setDeviceDropdownOpen(!deviceDropdownOpen)}
                    >
                      <div className="searchable-select-input">
                        {selectedDeviceName || "Select device..."}
                        <ChevronDown
                          size={20}
                          className={`chevron ${
                            deviceDropdownOpen ? "open" : ""
                          }`}
                        />
                      </div>
                      {deviceDropdownOpen && (
                        <div className="searchable-select-dropdown">
                          <input
                            type="text"
                            placeholder="Search device..."
                            value={deviceSearch}
                            onChange={(e) => setDeviceSearch(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="searchable-select-search"
                            autoFocus
                          />
                          <ul className="searchable-select-options">
                            {filteredDevices.length === 0 ? (
                              <li className="no-results">No devices found</li>
                            ) : (
                              filteredDevices.map((device) => (
                                <li
                                  key={device.id}
                                  onClick={() => handleSelectDevice(device)}
                                  className={
                                    selectedDevice === device.id
                                      ? "selected"
                                      : ""
                                  }
                                >
                                  <div className="option-name">
                                    {device.name}
                                  </div>
                                  <div className="option-detail">
                                    Total: {device.totalQuantity}
                                  </div>
                                </li>
                              ))
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                    {errors.device && (
                      <span className="edit-assignment-error">
                        {errors.device}
                      </span>
                    )}
                  </div>
                </div>

                {/* Quantity */}
                <div className="edit-assignment-section">
                  <h2>Quantity & Status</h2>

                  <div className="edit-assignment-row">
                    <div className="edit-assignment-group">
                      <label htmlFor="quantity">
                        Quantity{" "}
                        <span className="edit-assignment-required">*</span>
                      </label>
                      <input
                        id="quantity"
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => {
                          setQuantity(e.target.value);
                          if (errors.quantity) {
                            setErrors({ ...errors, quantity: "" });
                          }
                        }}
                        className={`edit-assignment-input ${
                          errors.quantity ? "error" : ""
                        }`}
                        required
                      />
                      {errors.quantity && (
                        <span className="edit-assignment-error">
                          {errors.quantity}
                        </span>
                      )}
                    </div>

                    <div className="edit-assignment-group">
                      <label htmlFor="status">
                        Status{" "}
                        <span className="edit-assignment-required">*</span>
                      </label>
                      <select
                        id="status"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="edit-assignment-input edit-assignment-select"
                      >
                        <option value="IN_USE">In Use</option>
                        <option value="RETURNED">Returned</option>
                        <option value="DAMAGED">Damaged</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="edit-assignment-actions">
                  <button
                    type="submit"
                    className="edit-assignment-btn-submit"
                    disabled={loading}
                  >
                    {loading ? "Updating..." : "Update Assignment"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="edit-assignment-btn-cancel"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default EditAssignment;
