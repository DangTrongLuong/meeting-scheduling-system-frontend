
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Pencil, Trash2 } from "lucide-react";
import SideBarAdmin from "../../../components/SideBarAdmin.jsx";
import NavBarUser from "../../../components/NavBarUser.jsx";
import "../../styles/Meeting/MeetingList.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080";

export default function MeetingList() {
  const navigate = useNavigate();

  // Đảm bảo Sidebar highlight đúng "Meeting"
  const [activeItem, setActiveItem] = useState("meetting-management");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Data
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Controls
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState("title");
  const [sortDir, setSortDir] = useState("asc");

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/api/meetings`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
      .then((res) => res.json())
      .then((data) => {
        setMeetings(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const text = q.trim().toLowerCase();
    let list = meetings.filter((m) => {
      if (!text) return true;
      return (
        (m.title || "").toLowerCase().includes(text) ||
        (m.room || "").toLowerCase().includes(text) ||
        (m.location || "").toLowerCase().includes(text)
      );
    });

    list.sort((a, b) => {
      const A = String(a[sortKey] ?? "").toLowerCase();
      const B = String(b[sortKey] ?? "").toLowerCase();
      if (A < B) return sortDir === "asc" ? -1 : 1;
      if (A > B) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [meetings, q, sortKey, sortDir]);

  const openDeleteModal = (m) => setDeleteTarget({ id: m.id, title: m.title });
  const closeDeleteModal = () => setDeleteTarget(null);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fetch(`${API_BASE}/api/meetings/${deleteTarget.id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      setMeetings((prev) => prev.filter((m) => m.id !== deleteTarget.id));
    } catch {
      // TODO: toast error nếu cần
    } finally {
      setDeleting(false);
      closeDeleteModal();
    }
  };

  return (
    <div className="admin-shell">
      {/* Sidebar cố định trái */}
      <SideBarAdmin
        activeItem={activeItem}
        onItemClick={setActiveItem}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Phần nội dung */}
      <main className="admin-main">
        {/* Top bar như các trang Admin */}
        <NavBarUser />

        {/* KHUNG PAGE: bù topbar & căn giữa body */}
        <div className="admin-page">
          <div className="admin-page-body">
            <div className="page meeting-list">
              <div className="page-header">
                <h1 className="meeting-room-management">Meeting Management</h1>

                <div className="meeting-room-controls">
                  <div className="meeting-room-search-wrapper">
                    <Search size={16} className="search-icon" />
                    <input
                      className="meeting-room-search-input"
                      placeholder="Search meetings..."
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                    />
                  </div>

                  <div className="sort-container">
                    <span className="sort-label">Sort by:</span>
                    <select
                      className="sort-select"
                      value={sortKey}
                      onChange={(e) => setSortKey(e.target.value)}
                    >
                      <option value="title">Title</option>
                      <option value="date">Date</option>
                      <option value="room">Room</option>
                    </select>

                    <button
                      className="sort-direction-btn"
                      onClick={() =>
                        setSortDir((d) => (d === "asc" ? "desc" : "asc"))
                      }
                    >
                      {sortDir === "asc" ? "Asc" : "Desc"}
                    </button>
                  </div>

                  <Link
                    to="/admin/meeting-management/create"
                    className="meeting-room-btn-add"
                  >
                    + Add Meeting
                  </Link>
                </div>
              </div>

              <div className="page-body">
                <div className="meeting-room-summary">
                  Total: {filtered.length} / {meetings.length}
                </div>

                {loading ? (
                  <div className="meeting-room-list">
                    <div className="meeting-room-no-data">Loading...</div>
                  </div>
                ) : (
                  <div className="meeting-room-list">
                    <table className="meeting-room-table">
                      <thead>
                        <tr>
                          <th>Id</th>
                          <th>Title</th>
                          <th>Room</th>
                          <th>Location</th>
                          <th>Capacity</th>
                          <th>Date</th>
                          <th>Time</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((m) => (
                          <tr key={m.id}>
                            <td>{m.id}</td>
                            <td>{m.title}</td>
                            <td>{m.room}</td>
                            <td>{m.location}</td>
                            <td>{m.capacity}</td>
                            <td>{m.date}</td>
                            <td>{m.time}</td>
                            <td>
                              <button
                                className="btn-edit"
                                title="Edit"
                                onClick={() =>
                                  navigate(
                                    `/admin/meeting-management/edit/${m.id}`
                                  )
                                }
                              >
                                <Pencil size={18} />
                              </button>
                              <button
                                className="btn-delete"
                                title="Delete"
                                onClick={() => openDeleteModal(m)}
                              >
                                <Trash2 size={18} />
                              </button>
                            </td>
                          </tr>
                        ))}

                        {filtered.length === 0 && (
                          <tr>
                            <td colSpan={8} className="meeting-room-no-data">
                              No meetings found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Delete modal */}
      {deleteTarget && (
        <div className="delete-modal-overlay" onClick={closeDeleteModal}>
          <div
            className="delete-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Delete Meeting</h2>
            <p>
              Bạn có chắc muốn xóa: <b>{deleteTarget.title}</b>?
            </p>
            <p className="delete-modal-warning">
              Hành động này không thể hoàn tác.
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
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
