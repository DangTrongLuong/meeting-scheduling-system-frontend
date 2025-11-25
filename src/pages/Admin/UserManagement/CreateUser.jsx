import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import NavBar from "../../../components/NavBar";
import SideBarAdmin from "../../../components/SideBarAdmin";
import { UserPlus, ArrowLeft } from "lucide-react";
import "../../../styles/UserManagement/UserManagement.css";
import axios from "axios";

const CreateUser = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenuItem, setActiveMenuItem] = useState("users-management");
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    age: "",
    address: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("accessToken");

      const { data } = await axios.post("/api/auth/register", formData, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (data.success) {
        toast.success("User created successfully!");
        setTimeout(() => {
          navigate("/admin/managementUsers");
        }, 1500);
      } else {
        toast.error(data.message || "Failed to create user");
      }
    } catch (error) {
      toast.error("Error creating user");
      console.error(error);
    }
  };

  const handleMenuClick = (itemId) => setActiveMenuItem(itemId);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

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
          <div className="um-header-create-user">
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
              <h1 className="user-management-create-user" style={{ margin: 0 }}>
                User Management/ Create New User
              </h1>
            </div>

            <div
              className="um-modal-box"
              style={{ position: "relative", animation: "none" }}
            >
              <div className="um-modal-top">
                <h2>
                  <UserPlus size={24} />
                  User Information
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
                    placeholder="Enter full name (5-20 characters)"
                  />
                </div>

                <div className="um-field-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                    placeholder="Enter email address"
                  />
                </div>

                <div className="um-field-group">
                  <label>Password *</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                    minLength={8}
                    placeholder="Min 8 chars, include uppercase, number & special char"
                  />
                  <small className="um-field-hint">
                    Must contain uppercase, lowercase, number, and special
                    character
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
                      placeholder="Enter age"
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
                      placeholder="Enter address"
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
                    Create User
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

export default CreateUser;
