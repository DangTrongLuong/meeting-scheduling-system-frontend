import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "../../../styles/Room/AddRoom.css";
import NavBar from "../../../components/NavBar";
import SideBarAdmin from "../../../components/SideBarAdmin";
import { ArrowLeft } from "lucide-react";

const AddRoom = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenuItem, setActiveMenuItem] = useState("management-rooms");
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    capacity: 0,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const API_URL = "http://localhost:8080/api/admin/rooms";
  const token = localStorage.getItem("accessToken");

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name?.trim()) newErrors.name = "Room name is required";
    if (!formData.location?.trim()) newErrors.location = "Location is required";
    if (!formData.capacity || formData.capacity < 1)
      newErrors.capacity = "Capacity must be >= 1";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm())
      return toast.error("Please fix the errors in the form!");

    setLoading(true);
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(
          err.includes("already exists") ? "Room name already exists!" : err
        );
      }

      toast.success("Room added successfully!");
      setTimeout(() => {
        navigate("/admin/managementRooms");
      }, 1200);
    } catch (err) {
      toast.error(err.message || "Failed to add room");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => navigate("/admin/managementRooms");

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
          <div className="meeting-room-wrapper">
            <div className="meeting-room-header">
              <button className="meeting-room-btn-back" onClick={handleCancel}>
                <ArrowLeft size={20} />
              </button>
              <h1 className="meeting-room-h1">
                Meeting Room Management/ Add New Room
              </h1>
            </div>

            <div className="meeting-room-container">
              <form onSubmit={handleSubmit} className="meeting-room-form">
                <div className="meeting-room-section">
                  <h2>Basic Information</h2>
                  <div className="meeting-room-row">
                    <div className="meeting-room-group">
                      <label>Room Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="meeting-room-input"
                        placeholder="Enter room name..."
                      />
                      {errors.name && (
                        <span className="meeting-room-error">
                          {errors.name}
                        </span>
                      )}
                    </div>
                    <div className="meeting-room-group">
                      <label>Location *</label>
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        className="meeting-room-input"
                        placeholder="Enter location..."
                      />
                      {errors.location && (
                        <span className="meeting-room-error">
                          {errors.location}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="meeting-room-row">
                    <div className="meeting-room-group">
                      <label>Capacity *</label>
                      <input
                        type="number"
                        name="capacity"
                        value={formData.capacity}
                        onChange={handleChange}
                        className="meeting-room-input"
                        min="1"
                        placeholder="Enter capacity..."
                      />
                      {errors.capacity && (
                        <span className="meeting-room-error">
                          {errors.capacity}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="meeting-room-actions">
                  <button
                    type="submit"
                    className="meeting-room-btn-submit"
                    disabled={loading}
                  >
                    {loading ? "Creating..." : "Add Room"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="meeting-room-btn-cancel"
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

export default AddRoom;
