import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import NavBar from "../../../components/NavBar";
import SideBarAdmin from "../../../components/SideBarAdmin";
import {
  ArrowLeft,
  User,
  Mail,
  Calendar,
  MapPin,
  Shield,
  Activity,
  Lock,
} from "lucide-react";
import "../../../styles/UserManagement/UserManagement.css";
import axios from "axios";

const DetailUser = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenuItem, setActiveMenuItem] = useState("users-management");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const { userId } = useParams();

  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isChanging, setIsChanging] = useState(false);

  useEffect(() => {
    fetchUserDetail();
  }, [userId]);

  const fetchUserDetail = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");

      const response = await axios.get(`/api/auth/get-users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUser(response.data);
    } catch (error) {
      toast.error("Failed to load user details");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError("");

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }

    try {
      setIsChanging(true);
      const token = localStorage.getItem("accessToken");

      await axios.post(
        "/api/admin/auth/change-user-password",
        {
          userId: user.id,
          newPassword: newPassword,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("Password changed successfully!");
      setShowChangePasswordModal(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to change password";
      toast.error(msg);
      setPasswordError(msg);
    } finally {
      setIsChanging(false);
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
              <p>Loading user details...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!user) {
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
            <div
              style={{ textAlign: "center", padding: "40px", color: "#666" }}
            >
              <h3>User not found</h3>
              <button
                onClick={() => navigate("/admin/managementUsers")}
                className="um-submit-btn"
                style={{ marginTop: "16px" }}
              >
                Back to Users
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const avatarUrl = user.avatar_url
    ? user.avatar_url.startsWith("http")
      ? user.avatar_url
      : `http://localhost:8080${user.avatar_url}`
    : "http://localhost:8080/uploads/avatars/user-avatar.png";

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
          <div className="um-header-detail-user">
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
              <h1 className="user-management-detail-user" style={{ margin: 0 }}>
                User Management/ User Details
              </h1>
            </div>

            <div
              className="um-modal-box"
              style={{
                position: "relative",
                animation: "none",
                padding: "32px",
              }}
            >
              <div
                className="um-detail-container"
                style={{ display: "flex", gap: "40px", flexWrap: "wrap" }}
              >
                {/* Avatar lớn bên trái */}
                <div style={{ flexShrink: 0 }}>
                  <div
                    style={{
                      width: "220px",
                      height: "220px",
                      borderRadius: "16px",
                      overflow: "hidden",
                      boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
                      border: "5px solid #fff",
                    }}
                  >
                    <img
                      src={avatarUrl}
                      alt={user.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                  <div style={{ textAlign: "center", marginTop: "16px" }}>
                    <p
                      style={{
                        fontSize: "1.1rem",
                        fontWeight: "600",
                        color: "#2d3748",
                      }}
                    >
                      {user.name}
                    </p>
                    <span
                      className={`um-role-tag um-role-${user.role.toLowerCase()}`}
                      style={{ fontSize: "0.9rem" }}
                    >
                      <Shield size={14} />
                      {user.role}
                    </span>
                  </div>
                </div>

                {/* Thông tin chi tiết bên phải */}
                <div style={{ flex: 1, minWidth: "300px" }}>
                  <h2
                    style={{
                      marginBottom: "24px",
                      color: "#1a202c",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <User size={28} />
                    User Information
                  </h2>

                  <div
                    className="um-detail-grid"
                    style={{ display: "grid", gap: "18px", fontSize: "1rem" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <Mail size={20} style={{ color: "#805ad5" }} />
                      <div>
                        <strong>Email:</strong>
                        <p style={{ margin: "4px 0 0", color: "#2d3748" }}>
                          {user.email}
                        </p>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <Calendar size={20} style={{ color: "#3182ce" }} />
                      <div>
                        <strong>Created At:</strong>
                        <p style={{ margin: "4px 0 0", color: "#2d3748" }}>
                          {new Date(user.createdAt).toLocaleDateString("en-GB")}
                        </p>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <Activity
                        size={20}
                        style={{ color: user.active ? "#38a169" : "#e53e3e" }}
                      />
                      <div>
                        <strong>Status:</strong>
                        <span
                          style={{
                            marginLeft: "8px",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            backgroundColor: user.active
                              ? "#d4edda"
                              : "#fde8e8",
                            color: user.active ? "#2f855a" : "#c53030",
                            fontWeight: "600",
                            fontSize: "0.9rem",
                          }}
                        >
                          {user.active ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <Lock size={20} style={{ color: "#dd6b20" }} />
                      <div>
                        <strong>Two-Factor Auth:</strong>
                        <span
                          style={{
                            marginLeft: "8px",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            backgroundColor: user.twoFactorEnabled
                              ? "#d4edda"
                              : "#f7fafc",
                            color: user.twoFactorEnabled
                              ? "#2f855a"
                              : "#718096",
                            fontWeight: "600",
                            fontSize: "0.9rem",
                            border: "1px solid #e2e8f0",
                          }}
                        >
                          {user.twoFactorEnabled ? "ENABLED" : "DISABLED"}
                        </span>
                      </div>
                    </div>

                    {user.age > 0 && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                        }}
                      >
                        <User size={20} style={{ color: "#4a5568" }} />
                        <div>
                          <strong>Age:</strong>
                          <p style={{ margin: "4px 0 0", color: "#2d3748" }}>
                            {user.age} years old
                          </p>
                        </div>
                      </div>
                    )}

                    {user.address && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                        }}
                      >
                        <MapPin size={20} style={{ color: "#e53e3e" }} />
                        <div>
                          <strong>Address:</strong>
                          <p style={{ margin: "4px 0 0", color: "#2d3748" }}>
                            {user.address}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div
                style={{ marginTop: "32px", textAlign: "center", gap: "10px" }}
              >
                <button
                  onClick={() => navigate("/admin/managementUsers")}
                  className="um-cancel-btn"
                  style={{
                    padding: "10px 24px",
                    fontSize: "1rem",
                    marginRight: "10px",
                  }}
                >
                  Back to User List
                </button>
                {user?.role !== "SUPERADMIN" && (
                  <button
                    onClick={() => setShowChangePasswordModal(true)}
                    className="um-submit-btn-change-password"
                    style={{
                      padding: "10px 24px",
                      fontSize: "1rem",
                      backgroundColor: "#f67a28ff",
                      borderRadius: "8px",
                      border: "none",
                    }}
                  >
                    <Lock size={18} style={{ marginRight: "8px" }} />
                    Change Password
                  </button>
                )}
              </div>
            </div>
          </div>
          {showChangePasswordModal && (
            <div
              className="um-modal-backdrop-delete-user"
              onClick={() => setShowChangePasswordModal(false)}
            >
              <div
                className="um-modal-box-delete-user"
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: "520px", width: "100%" }}
              >
                <h3
                  style={{
                    marginTop: 0,
                    color: "#dd6b20",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <Lock size={26} />
                  Change Password
                </h3>
                <p style={{ color: "#4a5568", margin: "8px 0 24px" }}>
                  User: <strong>{user?.name}</strong> ({user?.email})
                </p>

                <form onSubmit={handleChangePassword}>
                  <div className="um-field-group">
                    <label>
                      New Password <span style={{ color: "#e53e3e" }}>*</span>
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={8}
                      placeholder="Enter new password (min 8 characters)"
                      style={{
                        width: "100%",
                        padding: "12px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e0",
                        fontSize: "1rem",
                      }}
                    />
                  </div>

                  <div className="um-field-group" style={{ marginTop: "16px" }}>
                    <label>
                      Confirm New Password{" "}
                      <span style={{ color: "#e53e3e" }}>*</span>
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={8}
                      placeholder="Retype new password"
                      style={{
                        width: "100%",
                        padding: "12px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e0",
                        fontSize: "1rem",
                      }}
                    />
                  </div>

                  {passwordError && (
                    <div
                      style={{
                        color: "#e53e3e",
                        fontSize: "0.95rem",
                        margin: "12px 0",
                        padding: "8px",
                        backgroundColor: "#fff5f5",
                        borderRadius: "6px",
                      }}
                    >
                      {passwordError}
                    </div>
                  )}

                  <div
                    className="um-modal-bottom-delete-user"
                    style={{
                      marginTop: "24px",
                      gap: "12px",
                      width: "100%",
                      display: "flex",
                      justifyContent: "flex-end",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setShowChangePasswordModal(false);
                        setNewPassword("");
                        setConfirmPassword("");
                        setPasswordError("");
                      }}
                      style={{
                        padding: "10px",
                        border: "none",
                        marginRight: "10px",
                        borderRadius: "8px",
                        backgroundColor: "#e2e8f0",
                      }}
                      className="um-cancel-btn-delete-user"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isChanging || !newPassword || !confirmPassword}
                      className="um-submit-btn-delete-user"
                      style={{
                        backgroundColor: "#dd6b20",
                        padding: "12px",
                        border: "none",
                        borderRadius: "8px",
                        color: "#fff",
                      }}
                    >
                      {isChanging ? "Changing..." : "Change Password"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default DetailUser;
