import React, { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import "../../../styles/Device/Devices.css";
import "../../../styles/DashboardAdmin.css";
import NavBar from "../../../components/NavBar";
import SideBarAdmin from "../../../components/SideBarAdmin";
import AddDeviceModal from "./AddDeviceModal";
import Swal from "sweetalert2";
import { Trash2 } from "lucide-react";

const Devices = () => {
  const [devices, setDevices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenuItem, setActiveMenuItem] = useState("devices");
  const [showModal, setShowModal] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const location = useLocation();
  const inputRef = useRef(null);

  const API_URL = "http://localhost:8080/api/admin/devices";

  useEffect(() => {
    const pathToItem = {
      "/dashboardAdmin": "home",
      "/devices": "devices",
      "/rooms": "rooms",
      "/users": "users",
    };
    setActiveMenuItem(pathToItem[location.pathname] || "devices");
  }, [location.pathname]);

  // Load danh sách thiết bị từ backend
  const loadDevices = async () => {
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error("Failed to fetch devices");
      const data = await res.json();
      
      setDevices(data);
    } catch (err) {
      console.error("Error fetching devices:", err);
      alert("Cannot load devices. Please check your server.");
    }
  };

  useEffect(() => {
    loadDevices();
  }, []);


  const handleDeleteDevice = async (id) => {
    const result = await Swal.fire({
      title: "Delete Device?",
      text: "Are you sure you want to delete this device?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e74c3c",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
        if (res.ok) {
          setDevices((prevDevices) => prevDevices.filter((d) => d.id !== id));
          Swal.fire("Deleted!", "The device has been removed.", "success");
        } else {
          Swal.fire("Error", "Failed to delete device.", "error");
        }
      } catch (err) {
        console.error("Error deleting device:", err);
        Swal.fire("Error", "Something went wrong.", "error");
      }
    }
  };

  // Lọc theo search
  const filteredDevices = devices.filter((d) =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Gợi ý autocomplete
  const suggestions = devices.filter((d) =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Ẩn dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (inputRef.current && !inputRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

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

          {/* Controls */}
          <div className="device-controls" ref={inputRef}>
            <div className="device-search-wrapper">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="device-search-input"
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowSuggestions(true);
                }}
                onClick={() => setShowSuggestions(true)}
              />
              {showSuggestions && suggestions.length > 0 && (
                <ul className="suggestion-dropdown">
                  {suggestions.map((item) => {
                    const regex = new RegExp(`(${searchTerm})`, "gi");
                    const highlightedName = item.name.replace(
                      regex,
                      `<span class="highlight">$1</span>`
                    );
                    return (
                      <li
                        key={item.id}
                        onClick={() => {
                          setSearchTerm(item.name);
                          setShowSuggestions(false);
                        }}
                        dangerouslySetInnerHTML={{ __html: highlightedName }}
                      />
                    );
                  })}
                </ul>
              )}
            </div>
            <button className="device-sort-dropdown">Sort by Name</button>
            <button
              className="device-btn-add"
              onClick={() => setShowModal(true)}
            >
              + Add Device
            </button>
          </div>

          {/* Modal */}
          {showModal && (
            <AddDeviceModal
              onClose={() => setShowModal(false)}
              
              onSave={() => {
                loadDevices(); 
              }}

            />
          )}

          {/* Summary */}
          <div className="device-summary">
            Total: {filteredDevices.length} / {devices.length}
          </div>

          {/* Device List */}
          <div className="device-list">
            {filteredDevices.length === 0 ? (
              <p className="device-no-data">No devices found</p>
            ) : (
              <table className="device-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Quantity</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDevices.map((d) => (
                    <tr key={d.id}>
                      <td>{d.name}</td>
                      <td>{d.quantity}</td>
                      <td>{d.active ? "Active" : "Inactive"}</td>
                      <td>
                        <button
                          className="btn-delete"
                          onClick={() => handleDeleteDevice(d.id)}
                        >
                          <Trash2 size={20} />
                        </button>
                      </td>
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