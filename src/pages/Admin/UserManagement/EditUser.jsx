import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import NavBar from "../../../components/NavBar";
import SideBarAdmin from "../../../components/SideBarAdmin";
import { Edit2, ArrowLeft } from "lucide-react";
import "../../../styles/UserManagement/UserManagement.css";
import axios from "axios";

const EditUser = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenuItem, setActiveMenuItem] = useState("users-management");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { userId } = useParams();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    age: "",
    address: "",
  });

  useEffect(() => {
    fetchUserData();
  }, [userId]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");

      const response = await axios.get(`/api/auth/get-users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const user = response.data;

      setFormData({
        name: user.name || "",
        email: user.email || "",
        age: user.age ?? "",
        address: user.address || "",
      });
    } catch (error) {
      toast.error("Failed to load user data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("accessToken");

      await axios.put(
        `/api/auth/update-user/${userId}`,
        {
          name: formData.name,
          age: parseInt(formData.age) || 0,
          address: formData.address,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("User updated successfully!");
      setTimeout(() => {
        navigate("/admin/managementUsers");
      }, 1500);
    } catch (error) {
      toast.error("Error updating user");
      console.error(error);
    }
  };

  const handleMenuClick = (itemId) => setActiveMenuItem(itemId);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  if (loading) {
    return (
      <div className="my-project-container">
        <NavBar onToggleSidebar={toggleSidebar} />
        <SideBarAdmin
          activeItem={activeMenuItem}
          onItemClick={handleMenuClick}
          isOpen={sidebarOpen}
          onClose={closeSidebar}
        />
        <div className="main-layout">
          <main className="main-content">
            <div className="um-loading-container">
              <div className="um-loading-spinner"></div>
              <p>Loading user data...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

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
          <div className="um-header-edit-user">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                marginBottom: "24px",
              }}
            >
              <button
                onClick={() => navigate("/admin/managementUsers")}
                className="um-cancel-btn"
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <ArrowLeft size={20} />
                Back
              </button>
              <h1 className="user-management-edit-user" style={{ margin: 0 }}>
                User Management/ Edit User
              </h1>
            </div>

            <div
              className="um-modal-box"
              style={{ position: "relative", animation: "none" }}
            >
              <div className="um-modal-top">
                <h2>
                  <Edit2 size={24} />
                  Update User Information
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="um-form-container">
                <div className="um-field-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    minLength={5}
                    maxLength={20}
                  />
                </div>

                <div className="um-field-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="um-field-disabled"
                  />
                  <small className="um-field-hint">
                    Email cannot be changed
                  </small>
                </div>

                <div className="um-field-row">
                  <div className="um-field-group">
                    <label>Age</label>
                    <input
                      type="number"
                      value={formData.age}
                      onChange={(e) =>
                        setFormData({ ...formData, age: e.target.value })
                      }
                      min="1"
                      max="150"
                    />
                  </div>
                  <div className="um-field-group">
                    <label>Address</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="um-modal-bottom">
                  <button
                    type="button"
                    onClick={() => navigate("/admin/managementUsers")}
                    className="um-cancel-btn"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="um-submit-btn">
                    Update User
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

export default EditUser;
