import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../../../styles/RoomDevice/AssignDevice.css";
import NavBar from "../../../components/NavBar";
import SideBarAdmin from "../../../components/SideBarAdmin";
import { ArrowLeft, ChevronDown } from "lucide-react";

const AssignDevice = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenuItem, setActiveMenuItem] = useState("device-room");

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
  const [loading, setLoading] = useState(false);

  const API_ROOMS = "http://localhost:8080/api/admin/rooms";
  const API_DEVICES = "http://localhost:8080/api/admin/devices?status=ACTIVE";
  const API_ASSIGN = "http://localhost:8080/api/admin/room-devices/assign";
  const token = localStorage.getItem("accessToken");

  useEffect(() => {
    loadRooms();
    loadDevices();
  }, []);

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
      const active = data.filter(
        (d) => d.status === "ACTIVE" && d.availableQuantity > 0
      );
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
  };

  const handleSelectDevice = (device) => {
    setSelectedDevice(device.id);
    setSelectedDeviceName(device.name);
    setDeviceDropdownOpen(false);
    setDeviceSearch("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate frontend
    if (!selectedRoom || !selectedDevice || quantity < 1) {
      return toast.error("Please select room, device, and valid quantity");
    }

    const device = devices.find((d) => d.id === selectedDevice);
    if (quantity > device.availableQuantity) {
      return toast.error(
        `Only ${device.availableQuantity} available for ${device.name}`
      );
    }

    setLoading(true);
    try {
      const res = await fetch(API_ASSIGN, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          roomId: selectedRoom,
          deviceId: selectedDevice,
          quantity: parseInt(quantity),
        }),
      });

      const contentType = res.headers.get("content-type");
      let errorMessage = "Assign failed";

      if (contentType && contentType.includes("application/json")) {
        const errorData = await res.json();

        errorMessage = errorData.message || errorMessage;
      } else {
        errorMessage = await res.text();
      }

      if (!res.ok) {
        toast.error(errorMessage);
        return;
      }

      toast.success("Device assigned successfully!");
      setTimeout(() => {
        navigate("/admin/deviceRoom");
      }, 1200);
    } catch (err) {
      toast.error(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => navigate("/admin/deviceRoom");

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
      <ToastContainer autoClose={1500} style={{ top: "70px" }} />
      <NavBar onToggleSidebar={toggleSidebar} />
      <SideBarAdmin
        activeItem={activeMenuItem}
        onItemClick={handleMenuClick}
        isOpen={sidebarOpen}
        onClose={closeSidebar}
      />
      <div className="main-layout">
        <main className="main-content">
          <div className="assign-device-header">
            <button
              onClick={handleCancel}
              className="assign-device-btn-back"
              title="Back to list"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="assign-device-h1">
              Room Device Assignment/ Assign Device to Room
            </h1>
          </div>

          <div className="assign-device-wrapper">
            <div className="assign-device-container">
              <form onSubmit={handleSubmit} className="assign-device-form">
                {/* Select Room */}
                <div className="assign-device-section">
                  <h2>Select Room</h2>

                  <div className="assign-device-group">
                    <label htmlFor="room">
                      Room <span className="assign-device-required">*</span>
                    </label>
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
                  </div>
                </div>

                {/* Select Device */}
                <div className="assign-device-section">
                  <h2>Select Device</h2>

                  <div className="assign-device-group">
                    <label htmlFor="device">
                      Device <span className="assign-device-required">*</span>
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
                                    Available: {device.availableQuantity}
                                  </div>
                                </li>
                              ))
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quantity */}
                <div className="assign-device-section">
                  <h2>Quantity</h2>

                  <div className="assign-device-group">
                    <label htmlFor="quantity">
                      Quantity <span className="assign-device-required">*</span>
                    </label>
                    <input
                      id="quantity"
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="assign-device-input"
                      required
                    />
                  </div>
                </div>

                <div className="assign-device-actions">
                  <button
                    type="submit"
                    className="assign-device-btn-submit"
                    disabled={loading}
                  >
                    {loading ? "Assigning..." : "Assign Device"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="assign-device-btn-cancel"
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

export default AssignDevice;
