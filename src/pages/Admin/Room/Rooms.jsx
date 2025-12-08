import React, { useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../../../styles/Room/Rooms.css";
import NavBar from "../../../components/NavBar";
import SideBarAdmin from "../../../components/SideBarAdmin";
import { Edit, Trash2, Search } from "lucide-react";
import Pagination from '../../../components/Pagination'; 

const Rooms = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenuItem, setActiveMenuItem] = useState("management-rooms");
  const [sortBy, setSortBy] = useState("name");
  const [direction, setDirection] = useState("asc");
  const location = useLocation();

  const API_URL = "http://localhost:8080/api/admin/rooms";
  const token = localStorage.getItem("accessToken");

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    roomId: null,
    roomName: "",
  });
  const [deleting, setDeleting] = useState(false);

  const openDeleteModal = (id, name) => {
    setDeleteModal({ isOpen: true, roomId: id, roomName: name });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, roomId: null, roomName: "" });
  };

  useEffect(() => {
    const pathToItem = { "/admin/managementRooms": "management-rooms" };
    setActiveMenuItem(pathToItem[location.pathname] || "management-rooms");
  }, [location.pathname]);

  const loadRooms = async () => {
    try {
      const res = await fetch(
        `${API_URL}?sortBy=${sortBy}&direction=${direction}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Failed to load rooms");
      const data = await res.json();
      setRooms(data);
    } catch (err) {
      toast.error(err.message || "Cannot load rooms");
    }
  };

  useEffect(() => {
    loadRooms();
  }, [sortBy, direction]);

  const confirmDelete = async () => {
    const { roomId } = deleteModal;
    setDeleting(true);
    try {
      const res = await fetch(`${API_URL}/${roomId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Delete failed");
      setRooms((prev) => prev.filter((r) => r.id !== roomId));
      toast.success("Room deleted successfully!");
      // [ADD] Sau khi xóa, nếu trang hiện tại rỗng thì sẽ được clamp lại bên dưới
    } catch (err) {
      toast.error(err.message || "Failed to delete room");
    } finally {
      setDeleting(false);
      closeDeleteModal();
    }
  };

  const filteredRooms = rooms.filter((r) =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
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

  // ---------------------------
  // [ADD] Phân trang client-side
  // ---------------------------
  const [currentPage, setCurrentPage] = useState(1); // 1-based
  const [pageSize, setPageSize] = useState(10);      // số dòng/trang

  // [ADD] Khi search/sort đổi => quay về trang 1
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy, direction]);

  const totalItems = filteredRooms.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // [ADD] Clamp currentPage khi data thay đổi (ví dụ sau khi xóa/search)
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
    if (currentPage < 1 && totalPages >= 1) setCurrentPage(1);
  }, [totalPages, currentPage]);

  const startIndex = (currentPage - 1) * pageSize;

  // [ADD] Dữ liệu hiển thị theo trang
  const pagedRooms = useMemo(
    () => filteredRooms.slice(startIndex, startIndex + pageSize),
    [filteredRooms, startIndex, pageSize]
  );

  // [ADD] Render các nút phân trang (không dùng inline style để giữ nguyên CSS tổng thể)
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const go = (p) => setCurrentPage(Math.min(Math.max(1, p), totalPages));

    const maxButtons = 5;
    const half = Math.floor(maxButtons / 2);
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + maxButtons - 1);
    if (end - start + 1 < maxButtons) {
      start = Math.max(1, end - maxButtons + 1);
    }

    const pages = [];
    for (let i = start; i <= end; i++) pages.push(i);

    return (
      <div className="meeting-room-pagination">
        <button
          className="pagination-btn pagination-first"
          onClick={() => go(1)}
          disabled={currentPage === 1}
        >
          « First
        </button>
        <button
          className="pagination-btn pagination-prev"
          onClick={() => go(currentPage - 1)}
          disabled={currentPage === 1}
        >
          ‹ Prev
        </button>

        {start > 1 && <span className="pagination-ellipsis">…</span>}
        {pages.map((p) => (
          <button
            key={p}
            className={`pagination-btn ${p === currentPage ? "active" : ""}`}
            onClick={() => go(p)}
          >
            {p}
          </button>
        ))}
        {end < totalPages && <span className="pagination-ellipsis">…</span>}

        <button
          className="pagination-btn pagination-next"
          onClick={() => go(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next ›
        </button>
        <button
          className="pagination-btn pagination-last"
          onClick={() => go(totalPages)}
          disabled={currentPage === totalPages}
        >
          Last »
        </button>
      </div>
    );
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
          <h1 className="meeting-room-management">Meeting Room Management</h1>

          <div className="meeting-room-controls">
            <div className="meeting-room-search-wrapper">
              <Search className="search-icon" size={20} />
              <input
                type="text"
                placeholder="Search rooms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="meeting-room-search-input"
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
                <option value="location">Location</option>
                <option value="capacity">Capacity</option>
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
              className="meeting-room-btn-add"
              onClick={() => navigate("/admin/addRoom")}
            >
              + Add Room
            </button>
          </div>

          {/* [CHANGE MINOR] Summary hiển thị theo trang để người dùng biết dải hiện tại */}
          <div className="meeting-room-summary">
            Total: {filteredRooms.length} / {rooms.length}
            {filteredRooms.length > 0 && (
              <>{" "}
                (Show {startIndex + 1}–{Math.min(startIndex + pageSize, filteredRooms.length)} / {filteredRooms.length})
              </>
            )}
          </div>

          <div className="meeting-room-list">
            {filteredRooms.length === 0 ? (
              <p className="meeting-room-no-data">No rooms found</p>
            ) : (
              <table className="meeting-room-table">
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>Name</th>
                    <th>Location</th>
                    <th>Capacity</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {/* [CHANGE MINOR] dùng pagedRooms + STT theo trang */}
                  {pagedRooms.map((r, index) => (
                    <tr key={r.id}>
                      <td>{startIndex + index + 1}</td>
                      <td>{r.name}</td>
                      <td>{r.location}</td>
                      <td>{r.capacity}</td>
                      <td>
                        <button
                          className="btn-edit"
                          onClick={() => navigate(`/admin/editRoom/${r.id}`)}
                          title="Edit room"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          className="btn-delete"
                          onClick={() => openDeleteModal(r.id, r.name)}
                          title="Delete room"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* [ADD] Thanh phân trang – nằm dưới bảng, không thay đổi layout/các class hiện có */}
            {/* {renderPagination()}

            {deleteModal.isOpen && (
              <div className="delete-modal-overlay" onClick={closeDeleteModal}>
                <div
                  className="delete-modal-content"
                  onClick={(e) => e.stopPropagation()}
                > */}
            {/* Thanh phân trang – CHỈ dưới bảng, dùng component sẵn có */}
            {totalPages > 1 && (
              <div className="pagination-container">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                showFirstLast
                maxButtons={5}
              /></div>
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
                    <strong>{deleteModal.roomName}</strong>?
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

export default Rooms;
