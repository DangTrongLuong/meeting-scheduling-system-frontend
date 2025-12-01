
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import SideBarAdmin from "../../../components/SideBarAdmin.jsx";
import NavBarUser from "../../../components/NavBarUser.jsx";
import "../../styles/Meeting/MeetingForm.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080";

export default function MeetingCreate() {
  const navigate = useNavigate();

  const [activeItem, setActiveItem] = useState("meetting-management");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const token = localStorage.getItem("token");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    room: "",
    location: "",
    capacity: 1,
    date: "",
    time: "",
  });

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "capacity" ? Number(value) : value,
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch(`${API_BASE}/api/meetings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(form),
      });
      navigate("/admin/meeting-management");
    } catch {
      // TODO: toast error
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-shell">
      <SideBarAdmin
        activeItem={activeItem}
        onItemClick={setActiveItem}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="admin-main">
        <NavBarUser />

        <div className="admin-page">
          <div className="admin-page-body">
            <div className="meeting-room-wrapper">
              <div className="meeting-room-header">
                <h1 className="meeting-room-h1">Create Meeting</h1>
                <Link
                  to="/admin/meeting-management"
                  className="meeting-room-btn-back"
                >
                  ← Back
                </Link>
              </div>

              <div className="meeting-room-container">
                <form className="meeting-room-form" onSubmit={onSubmit}>
                  <section className="meeting-room-section">
                    <h2>Thông tin cơ bản</h2>
                    <div className="meeting-room-row">
                      <div className="meeting-room-group">
                        <label>Title</label>
                        <input
                          className="meeting-room-input"
                          name="title"
                          value={form.title}
                          onChange={onChange}
                          placeholder="Ví dụ: Sprint Planning"
                          required
                        />
                      </div>

                      <div className="meeting-room-group">
                        <label>Room</label>
                        <input
                          className="meeting-room-input"
                          name="room"
                          value={form.room}
                          onChange={onChange}
                          placeholder="Ví dụ: RM000822"
                          required
                        />
                      </div>
                    </div>

                    <div className="meeting-room-row">
                      <div className="meeting-room-group">
                        <label>Location</label>
                        <input
                          className="meeting-room-input"
                          name="location"
                          value={form.location}
                          onChange={onChange}
                          placeholder="Ví dụ: Hà Nội"
                          required
                        />
                      </div>

                      <div className="meeting-room-group">
                        <label>Capacity</label>
                        <input
                          className="meeting-room-input"
                          type="number"
                          min="1"
                          name="capacity"
                          value={form.capacity}
                          onChange={onChange}
                          required
                        />
                      </div>
                    </div>
                  </section>

                  <section className="meeting-room-section">
                    <h2>Thời gian</h2>
                    <div className="meeting-room-row">
                      <div className="meeting-room-group">
                        <label>Date</label>
                        <input
                          className="meeting-room-input"
                          type="date"
                          name="date"
                          value={form.date}
                          onChange={onChange}
                          required
                        />
                      </div>

                      <div className="meeting-room-group">
                        <label>Time</label>
                        <input
                          className="meeting-room-input"
                          type="time"
                          name="time"
                          value={form.time}
                          onChange={onChange}
                          required
                        />
                      </div>
                    </div>
                  </section>

                  <div className="meeting-room-actions">
                    <button
                      className="meeting-room-btn-submit"
                      type="submit"
                      disabled={saving}
                    >
                      {saving ? "Saving..." : "Create"}
                    </button>
                    <button
                      type="button"
                      className="meeting-room-btn-cancel"
                      onClick={() => navigate("/admin/meeting-management")}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
