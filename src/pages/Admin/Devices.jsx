import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import "../../styles/Devices.css";
import "../../styles/DashboardAdmin.css";
import NavBar from "../../components/NavBar";
import SideBarAdmin from "../../components/SideBarAdmin";
import AddDeviceModal from "../../components/AddDeviceModal";

const Devices = () => {
  const [devices, setDevices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenuItem, setActiveMenuItem] = useState("devices");
  const [showModal, setShowModal] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const pathToItem = {
      "/dashboardAdmin": "home",
      "/devices": "devices",
      "/rooms": "rooms",
      "/users": "users",
    };
    setActiveMenuItem(pathToItem[location.pathname] || "devices");
  }, [location.pathname]);

  const loadDevices = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/devices");
      const data = await res.json();
      setDevices(data);
    } catch (err) {
      console.error("Error fetching devices:", err);
    }
  };

  useEffect(() => {
    loadDevices();
  }, []);

  const handleAddDevice = async (device) => {
  try {
    const res = await fetch("http://localhost:8080/api/devices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(device),
    });
    if (res.ok) {
      const newDevice = await res.json();
      setDevices([...devices, newDevice]);
      setShowModal(false);
    } else {
      console.error("Failed to add device");
      alert("Failed to add device");
    }
  } catch (err) {
    console.error("Error adding device:", err);
  }
};

  const filteredDevices = devices.filter((d) =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="my-project-container">
      <NavBar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="main-layout">
        <SideBarAdmin
          activeItem={activeMenuItem}
          onItemClick={setActiveMenuItem}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="main-content">
          <h2 className="device-management">Device Management</h2>

          <div className="device-controls">
            <input
              type="text"
              className="device-search-input"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="device-sort-dropdown">Sort by Name</button>
            <button className="device-btn-add" onClick={() => setShowModal(true)}>
              + Add Device
            </button>
          </div>

          {showModal && (
            <AddDeviceModal onClose={() => setShowModal(false)} onSave={handleAddDevice} />
          )}

          <div className="device-summary">
            Total: {filteredDevices.length} / {devices.length}
          </div>

          <div className="device-list">
            {filteredDevices.length === 0 ? (
              <p className="device-no-data">No devices found</p>
            ) : (
              <table className="device-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Quantity</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDevices.map((d) => (
                    <tr key={d.id}>
                      <td>{d.name}</td>
                      <td>{d.type || "N/A"}</td>
                      <td>{d.quantity}</td>
                      <td>{d.active ? "Active" : "Inactive"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Devices;