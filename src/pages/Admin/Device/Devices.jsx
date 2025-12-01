import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../../../styles/Device/Devices.css";
import NavBar from "../../../components/NavBar";
import SideBarAdmin from "../../../components/SideBarAdmin";
import { Edit, Trash2, Search } from "lucide-react";

const Devices = () => {
  const navigate = useNavigate();
  const [devices, setDevices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenuItem, setActiveMenuItem] = useState("devices");
  const [sortBy, setSortBy] = useState("name");
  const [direction, setDirection] = useState("asc");
  const location = useLocation();

  const API_URL = "http://localhost:8080/api/admin/devices";
  const token = localStorage.getItem("accessToken");

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    deviceId: null,
    deviceName: "",
  });
  const [deleting, setDeleting] = useState(false);

  const openDeleteModal = (id, name) => {
    setDeleteModal({
      isOpen: true,
      deviceId: id,
      deviceName: name,
    });
  };

  const closeDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      deviceId: null,
      deviceName: "",
    });
  };

  useEffect(() => {
    const pathToItem = {
      "/admin/devices": "devices",
      "/admin/managementRooms": "management-rooms",
      "/admin/deviceRoom": "device-room",
    };
    setActiveMenuItem(pathToItem[location.pathname] || "devices");
  }, [location.pathname]);

  const loadDevices = async () => {
    try {
      const res = await fetch(
        `${API_URL}?sortBy=${sortBy}&direction=${direction}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Failed to load devices");
      const data = await res.json();

      setDevices(data);
    } catch (err) {
      toast.error(err.message || "Cannot load devices");
    }
  };

  useEffect(() => {
    loadDevices();
  }, [sortBy, direction]);

  const confirmDelete = async () => {
    const { deviceId } = deleteModal;
    setDeleting(true);

    try {
      const res = await fetch(`${API_URL}/${deviceId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Delete failed");

      setDevices((prev) => prev.filter((d) => d.id !== deviceId));
      toast.success("Device deleted successfully");
      closeDeleteModal();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const filteredDevices = devices.filter((d) =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <h1 className="device-management">Device Management</h1>

          <div className="device-controls">
            <div className="device-search-wrapper">
              <Search className="search-icon" size={20} />
              <input
                type="text"
                placeholder="Search devices name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="device-search-input"
              />
            </div>
            <div className="sort-container">
              <label className="sort-label">Sort by:</label>
              <select
                className="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="name">Name</option>
                <option value="status">Status</option>
                <option value="totalQuantity">Quantity</option>
              </select>
              <button
                className="sort-direction-btn"
                onClick={() =>
                  setDirection(direction === "asc" ? "desc" : "asc")
                }
              >
                {direction === "asc" ? "Asc" : "Desc"}
              </button>
            </div>
            <button
              className="device-btn-add"
              onClick={() => navigate("/admin/createDevice")}
            >
              + Add Device
            </button>
          </div>

          <div className="device-summary">Total: {filteredDevices.length} / {devices.length}</div>

          <div className="device-list">
            {filteredDevices.length === 0 ? (
              <p className="device-no-data">No devices found</p>
            ) : (
              <table className="device-table">
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Total</th>
                    <th>Available</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDevices.map((d, index) => (
                    <tr key={d.id}>
                      <td>{index + 1}</td>
                      <td>
                        {d.imagePath ? (
                          <img
                            src={`http://localhost:8080${d.imagePath}`}
                            alt={d.name}
                            className="device-image-preview"
                          />
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>{d.name}</td>
                      <td>{d.totalQuantity}</td>
                      <td>{d.availableQuantity}</td>
                      <td>
                        <span
                          className={`status-badge ${d.status.toLowerCase()}`}
                        >
                          {d.status}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn-edit"
                          onClick={() => {
                            navigate(`/admin/editDevice/${d.id}`);
                          }}
                          title="Edit device"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          className="btn-delete"
                          onClick={() => openDeleteModal(d.id, d.name)}
                          title="Delete device"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {deleteModal.isOpen && (
              <div className="delete-modal-overlay" onClick={closeDeleteModal}>
                <div
                  className="delete-modal-content"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h2>Confirm Delete</h2>
                  <p>
                    Are you sure you want to delete{" "}
                    <strong>{deleteModal.deviceName}</strong>?
                  </p>
                  <p className="delete-modal-warning">
                    This action cannot be undone.
                  </p>
                  <div className="delete-modal-actions">
                    <button
                      className="delete-modal-btn-confirm"
                      onClick={confirmDelete}
                      disabled={deleting}
                    >
                      {deleting ? "Deleting..." : "Delete"}
                    </button>
                    <button
                      className="delete-modal-btn-cancel"
                      onClick={closeDeleteModal}
                      disabled={deleting}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Devices;
