import React, { useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../../../styles/RoomDevice/RoomDevices.css";
import NavBar from "../../../components/NavBar";
import SideBarAdmin from "../../../components/SideBarAdmin";
import { Trash2, Edit, ChevronDown, Search } from "lucide-react";
import Pagination from "../../../components/Pagination.jsx"; // [ADD]

const RoomDevices = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenuItem, setActiveMenuItem] = useState("device-room");
  const [sortBy, setSortBy] = useState("name");
  const [direction, setDirection] = useState("asc");
  const location = useLocation();

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    id: null,
    info: "",
  });
  const [deleting, setDeleting] = useState(false);

  const [sortRoomOpen, setSortRoomOpen] = useState(false);
  const [sortStatusOpen, setSortStatusOpen] = useState(false);
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [roomSearchTerm, setRoomSearchTerm] = useState("");
  const [statusSearchTerm, setStatusSearchTerm] = useState("");

  const API_URL = "http://localhost:8080/api/admin/room-devices";
  const token = localStorage.getItem("accessToken");

  useEffect(() => {
    const pathToItem = { "/admin/deviceRoom": "device-room" };
    setActiveMenuItem(pathToItem[location.pathname] || "device-room");
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".sort-dropdown-wrapper")) {
        setSortRoomOpen(false);
        setSortStatusOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
      toast.error(err.message || "Failed to delete room");
    } finally {
      setDeleting(false);
      closeDeleteModal();
    }
  };

  const handleEdit = (id) => {
    navigate(`/admin/editAssignment/${id}`);
  };

  // Get unique rooms and statuses for dropdown
  const uniqueRooms = [...new Set(assignments.map((a) => a.roomName))].sort();
  const uniqueStatuses = [...new Set(assignments.map((a) => a.status))].sort();

  // Filter rooms and statuses based on search
  const filteredRooms = uniqueRooms.filter((room) =>
    room.toLowerCase().includes(roomSearchTerm.toLowerCase())
  );

  const filteredRoomStatuses = uniqueStatuses.filter((status) =>
    status.toLowerCase().includes(statusSearchTerm.toLowerCase())
  );

  const toggleRoomSelection = (room) => {
    setSelectedRooms((prev) =>
      prev.includes(room) ? prev.filter((r) => r !== room) : [...prev, room]
    );
  };

  const toggleStatusSelection = (status) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  const filteredAssignments = assignments.filter((a) => {
    const matchesSearch = a.roomName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesRoom =
      selectedRooms.length === 0 || selectedRooms.includes(a.roomName);
    const matchesStatus =
      selectedStatuses.length === 0 || selectedStatuses.includes(a.status);
    return matchesSearch && matchesRoom && matchesStatus;
  });

  const handleMenuClick = (itemId) => {
    setActiveMenuItem(itemId);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const clearAllFilters = () => {
    setSelectedRooms([]);
    setSelectedStatuses([]);
    setSearchTerm("");
  };

  // ---------------------------
  // [ADD] Phân trang client-side
  // ---------------------------
  const [currentPage, setCurrentPage] = useState(1); // 1-based
  const pageSize = 10; // số dòng/trang

  // [ADD] Khi search/sort đổi => quay về trang 1
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy, direction]);

  const totalItems = filteredAssignments.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Clamp currentPage khi data thay đổi (ví dụ sau khi xóa/search)
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
    if (currentPage < 1 && totalPages >= 1) setCurrentPage(1);
  }, [totalPages, currentPage]);

  const startIndex = (currentPage - 1) * pageSize;

  // Dữ liệu hiển thị theo trang
  const pagedAssignments = useMemo(
    () => filteredAssignments.slice(startIndex, startIndex + pageSize),
    [filteredAssignments, startIndex]
  );

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
              <Search className="Room-Device-search-icon" size={20} />
              <input
                type="text"
                placeholder="Search by room name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="room-device-search-input"
              />
            </div>

            {/* Sort by Room Dropdown */}
            <div className="sort-dropdown-wrapper">
              <button
                className="sort-dropdown-btn sort-room-btn"
                onClick={() => setSortRoomOpen(!sortRoomOpen)}
              >
                Sort by Room
                <ChevronDown
                  size={18}
                  className={`sort-dropdown-icon ${
                    sortRoomOpen ? "sort-dropdown-icon-open" : ""
                  }`}
                />
              </button>
              {sortRoomOpen && (
                <div className="sort-dropdown-menu sort-room-dropdown">
                  <div className="sort-dropdown-search">
                    <input
                      type="text"
                      placeholder="Search room..."
                      className="sort-dropdown-search-input"
                      value={roomSearchTerm}
                      onChange={(e) => setRoomSearchTerm(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="sort-dropdown-list">
                    {filteredRooms.length > 0 ? (
                      filteredRooms.map((room) => (
                        <label
                          key={room}
                          className="sort-dropdown-item sort-room-item"
                        >
                          <input
                            type="checkbox"
                            checked={selectedRooms.includes(room)}
                            onChange={() => toggleRoomSelection(room)}
                            className="sort-dropdown-checkbox"
                          />
                          <span className="sort-dropdown-label-text">
                            {room}
                          </span>
                        </label>
                      ))
                    ) : (
                      <p className="sort-dropdown-empty">No rooms found</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sort by Status Dropdown */}
            <div className="sort-dropdown-wrapper">
              <button
                className="sort-dropdown-btn sort-status-btn"
                onClick={() => setSortStatusOpen(!sortStatusOpen)}
              >
                Sort by Status
                <ChevronDown
                  size={18}
                  className={`sort-dropdown-icon ${
                    sortStatusOpen ? "sort-dropdown-icon-open" : ""
                  }`}
                />
              </button>
              {sortStatusOpen && (
                <div className="sort-dropdown-menu sort-status-dropdown">
                  <div className="sort-dropdown-list">
                    {uniqueStatuses.length > 0 ? (
                      uniqueStatuses.map((status) => (
                        <label
                          key={status}
                          className="sort-dropdown-item sort-status-item"
                        >
                          <input
                            type="checkbox"
                            checked={selectedStatuses.includes(status)}
                            onChange={() => toggleStatusSelection(status)}
                            className="sort-dropdown-checkbox"
                          />
                          <span className="sort-dropdown-label-text">
                            {status}
                          </span>
                        </label>
                      ))
                    ) : (
                      <p className="sort-dropdown-empty">No statuses</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              className="room-device-btn-add"
              onClick={() => navigate("/admin/addRoomDevice")}
            >
              + Assign Device
            </button>
          </div>

          {/* Active Filters Display */}
          {(selectedRooms.length > 0 || selectedStatuses.length > 0) && (
            <div className="active-filters-container">
              <div className="active-filters">
                {selectedRooms.map((room) => (
                  <span key={room} className="active-filter-tag">
                    {room}
                    <button
                      className="active-filter-remove"
                      onClick={() => toggleRoomSelection(room)}
                    >
                      ×
                    </button>
                  </span>
                ))}
                {selectedStatuses.map((status) => (
                  <span key={status} className="active-filter-tag">
                    {status}
                    <button
                      className="active-filter-remove"
                      onClick={() => toggleStatusSelection(status)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <button className="clear-filters-btn" onClick={clearAllFilters}>
                Clear all
              </button>
            </div>
          )}

          <div className="room-device-summary">
            Total: {filteredAssignments.length} / {assignments.length}
            {filteredAssignments.length > 0 && (
              <>
                {" "}
                (Show {startIndex + 1}–
                {Math.min(startIndex + pageSize, filteredAssignments.length)} /{" "}
                {filteredAssignments.length})
              </>
            )}
          </div>

          <div className="room-device-list">
            {filteredAssignments.length === 0 ? (
              <p className="room-device-no-data">No assignments found</p>
            ) : (
              <table className="room-device-table">
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>Room</th>
                    <th>Device</th>
                    <th>Quantity</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedAssignments.map((a, index) => (
                    <tr key={a.id}>
                      <td>{startIndex + index + 1}</td>
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {totalPages > 1 && (
            <div className="pagination-container">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                showFirstLast
                maxButtons={5}
              />
            </div>
          )}

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
