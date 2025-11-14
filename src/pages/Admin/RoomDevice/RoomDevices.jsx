import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../../../styles/RoomDevice/RoomDevices.css";
import NavBar from "../../../components/NavBar";
import SideBarAdmin from "../../../components/SideBarAdmin";
import { Trash2, Edit } from "lucide-react";

const RoomDevices = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenuItem, setActiveMenuItem] = useState("device-room");
  const location = useLocation();

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    id: null,
    info: "",
  });
  const [deleting, setDeleting] = useState(false);

  const API_URL = "http://localhost:8080/api/admin/room-devices";
  const token = localStorage.getItem("accessToken");

  useEffect(() => {
    const pathToItem = { "/deviceRoom": "device-room" };
    setActiveMenuItem(pathToItem[location.pathname] || "device-room");
  }, [location.pathname]);

  const loadAssignments = async () => {
    try {
      const res = await fetch(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load assignments");
      const data = await res.json();
      setAssignments(data);
    } catch (err) {
      toast.error(err.message || "Cannot load room devices");
    }
  };

  useEffect(() => {
    loadAssignments();
  }, []);

  const openDeleteModal = (id, roomName, deviceName) => {
    setDeleteModal({ isOpen: true, id, info: `${deviceName} in ${roomName}` });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, id: null, info: "" });
  };

  const confirmDelete = async () => {
    const { id } = deleteModal;
    setDeleting(true);
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Delete failed");
      setAssignments((prev) => prev.filter((a) => a.id !== id));
      toast.success("Device removed from room");
    } catch (err) {
      toast.error(err.message || "Failed to remove");
    } finally {
      setDeleting(false);
      closeDeleteModal();
    }
  };

  const handleEdit = (id) => {
    navigate(`/editAssignment/${id}`);
  };

  const filteredAssignments = assignments.filter((a) =>
    a.roomName.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h1 className="room-device-management">Room Device Assignment</h1>

          <div className="room-device-controls">
            <div className="room-device-search-wrapper">
              <input
                type="text"
                placeholder="Search by room name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="room-device-search-input"
              />
            </div>
            <button
              className="room-device-btn-add"
              onClick={() => navigate("/addRoomDevice")}
            >
              + Assign Device
            </button>
          </div>

          <div className="room-device-summary">
            Total Assignments: {filteredAssignments.length}
          </div>

          <div className="room-device-list">
            {filteredAssignments.length === 0 ? (
              <p className="room-device-no-data">No assignments found</p>
            ) : (
              <table className="room-device-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Room</th>
                    <th>Device</th>
                    <th>Quantity</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssignments.map((a) => (
                    <tr key={a.id}>
                      <td>{a.id}</td>
                      <td>{a.roomName}</td>
                      <td>{a.deviceName}</td>
                      <td>{a.quantity}</td>
                      <td>
                        <span
                          className={`status-badge ${a.status.toLowerCase()}`}
                        >
                          {a.status}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn-edit"
                          onClick={() => handleEdit(a.id)}
                          title="Edit assignment"
                        >
                          <Edit size={18} />
                        </button>
                        {/* <button
                          className="btn-delete"
                          onClick={() =>
                            openDeleteModal(a.id, a.roomName, a.deviceName)
                          }
                          title="Delete assignment"
                        >
                          <Trash2 size={18} />
                        </button> */}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {deleteModal.isOpen && (
            <div className="delete-modal-overlay" onClick={closeDeleteModal}>
              <div
                className="delete-modal-content"
                onClick={(e) => e.stopPropagation()}
              >
                <h2>Confirm Remove</h2>
                <p>
                  Remove <strong>{deleteModal.info}</strong> from room?
                </p>
                <p className="delete-modal-warning">
                  This will return the devices to stock.
                </p>
                <div className="delete-modal-actions">
                  <button
                    className="delete-modal-btn-confirm"
                    onClick={confirmDelete}
                    disabled={deleting}
                  >
                    {deleting ? "Removing..." : "Remove"}
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
        </main>
      </div>
    </div>
  );
};

export default RoomDevices;
