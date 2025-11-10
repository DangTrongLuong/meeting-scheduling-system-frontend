import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import "../../styles/Devices.css";
import "../../styles/DashboardAdmin.css";
import NavBar from "../../components/NavBar";
import SideBarAdmin from "../../components/SideBarAdmin";

const Devices = () => {
  const [devices, setDevices] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    quantity: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenuItem, setActiveMenuItem] = useState("devices");
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

  useEffect(() => {
    fetch("http://localhost:8080/api/devices")
      .then((res) => res.json())
      .then((data) => setDevices(data))
      .catch((err) => console.error("Error fetching devices:", err));
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch("http://localhost:8080/api/devices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    })
      .then((res) => res.json())
      .then((newDevice) => {
        setDevices([...devices, newDevice]);
        setFormData({ name: "", type: "", quantity: "" });
      })
      .catch((err) => console.error("Error adding device:", err));
  };

  const filteredDevices = devices.filter((d) =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="my-project-container">
      <NavBar onToggleSidebar={toggleSidebar} />
      <div className="main-layout">
        <SideBarAdmin
          activeItem={activeMenuItem}
          onItemClick={handleMenuClick}
          isOpen={sidebarOpen}
          onClose={closeSidebar}
        />
        <main className="main-content">
          <h2 className="device-management">Device Management</h2>

          <div className="device-controls">
            <input
              type="text"
              className="device-search-input"
              placeholder="Search by name, type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="device-sort-dropdown">Sort by Name</button>
            <button className="device-btn-add" onClick={handleSubmit}>
              + Add Device
            </button>
          </div>

          <div className="device-summary">
            Total: {filteredDevices.length} / {devices.length}
          </div>

          {/* Danh sách thiết bị */}
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
                  </tr>
                </thead>
                <tbody>
                  {filteredDevices.map((d, index) => (
                    <tr key={index}>
                      <td>{d.name}</td>
                      <td>{d.type}</td>
                      <td>{d.quantity}</td>
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
