import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import NavBar from "../../../components/NavBar";
import SideBarAdmin from "../../../components/SideBarAdmin";
import { UserPlus, ArrowLeft, Plus, X } from "lucide-react";
import "../../../styles/UserManagement/UserManagement.css";
import axios from "axios";

const CreateUser = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenuItem, setActiveMenuItem] = useState("users-management");
  const navigate = useNavigate();

  const [defaultPassword, setDefaultPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [users, setUsers] = useState([{ name: "", emailPrefix: "" }]);

  const validatePassword = (pwd) => {
    const regex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(pwd);
  };

  const handleAddUser = () => {
    setUsers([...users, { name: "", emailPrefix: "" }]);
  };

  const handleRemoveUser = (index) => {
    if (users.length > 1) {
      setUsers(users.filter((_, i) => i !== index));
    }
  };

  const handleUserChange = (index, field, value) => {
    const updated = [...users];
    updated[index][field] = value;
    setUsers(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!defaultPassword || defaultPassword.length < 8) {
      toast.error("Default password must be at least 8 characters!");
      return;
    }
    if (!validatePassword(defaultPassword)) {
      setPasswordError(
        "Password must be at least 8 characters and include uppercase, lowercase, number, and special character"
      );
      return;
    }
    setPasswordError("");

    const validUsers = users
      .map((u) => ({
        name: u.name.trim(),
        emailPrefix: u.emailPrefix.trim(),
      }))
      .filter((u) => u.name && u.emailPrefix);

    if (validUsers.length === 0) {
      toast.error("Please add at least one user");
      return;
    }

    const payload = validUsers.map((u) => ({
      name: u.name,
      email: `${u.emailPrefix}@gmail.com`,
      password: defaultPassword,
    }));

    try {
      const token = localStorage.getItem("accessToken");
      const { data } = await axios.post("/api/auth/register-bulk", payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (data.success) {
        localStorage.setItem("lastUsedDefaultPassword", defaultPassword);
        toast.success(`Successfully created ${data.createdCount} account(s)!`);
        setTimeout(() => navigate("/admin/managementUsers"), 2000);
      } else {
        toast.error(data.message || "Failed to create some accounts");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "System error occurred");
    }
  };

  const handleMenuClick = (itemId) => setActiveMenuItem(itemId);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="my-project-container">
      <ToastContainer
        autoClose={2000}
        position="top-right"
        toastStyle={{ marginTop: "70px" }}
      />

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
                User Management / Create Users
              </h1>
            </div>

            <div className="um-modal-box">
              <div className="um-modal-top">
                <h2>
                  <UserPlus size={24} />
                  Create Gmail Accounts
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="um-form-container">
                {/* User List */}
                <div className="um-field-group">
                  <label>
                    User Information <span style={{ color: "red" }}>*</span>
                  </label>

                  {users.map((user, index) => (
                    <div
                      key={index}
                      className="um-field-row"
                      style={{
                        marginBottom: "16px",
                        alignItems: "center",
                        display: "flex",
                      }}
                    >
                      {/* Name */}
                      <div style={{ flex: 1 }}>
                        <input
                          type="text"
                          placeholder="Full Name"
                          value={user.name}
                          onChange={(e) =>
                            handleUserChange(index, "name", e.target.value)
                          }
                          required={index === 0}
                          minLength={5}
                          maxLength={20}
                        />
                      </div>

                      {/* Email Prefix + @gmail.com */}
                      <div style={{ flex: 1, display: "flex" }}>
                        <input
                          type="text"
                          placeholder="Enter email"
                          value={user.emailPrefix}
                          onChange={(e) => {
                            const value = e.target.value
                              .toLowerCase()
                              .replace(/[^a-z0-9._-]/g, "");
                            handleUserChange(index, "emailPrefix", value);
                          }}
                          required={index === 0}
                          style={{
                            borderRadius: "8px 0 0 8px",
                            borderRight: "none",
                          }}
                        />
                        <div
                          style={{
                            padding: "12px 16px",
                            background: "#f1f5f9",
                            border: "2px solid #e2e8f0",
                            borderLeft: "none",
                            borderRadius: "0 8px 8px 0",
                            fontWeight: "600",
                            color: "#475569",
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          @gmail.com
                        </div>
                      </div>

                      {/* Remove Button */}
                      {users.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveUser(index)}
                          className="um-cancel-btn"
                          style={{
                            width: "40px",
                            height: "40px",
                            padding: 0,
                            marginLeft: "8px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                          title="Remove this row"
                        >
                          <X size={18} />
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={handleAddUser}
                    style={{
                      marginTop: "12px",
                      padding: "10px 20px",
                      background: "transparent",
                      border: "2px dashed #0ea5e9",
                      borderRadius: "8px",
                      color: "#0ea5e9",
                      fontWeight: "600",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      width: "100%",
                      justifyContent: "center",
                    }}
                  >
                    <Plus size={20} />
                    Add Another User
                  </button>
                </div>

                {/* Default Password */}
                <div className="um-field-group">
                  <label>
                    Default Password (applies to all accounts){" "}
                    <span style={{ color: "red" }}>*</span>
                  </label>
                  <input
                    type="password"
                    value={defaultPassword}
                    onChange={(e) => {
                      setDefaultPassword(e.target.value);
                      setPasswordError("");
                    }}
                    required
                    minLength={8}
                    placeholder="Enter strong default password"
                  />
                  <small className="um-field-hint">
                    This password will be used for all created accounts
                  </small>
                </div>

                {/* Footer */}
                <div className="um-modal-bottom">
                  <button
                    type="button"
                    onClick={() => navigate("/admin/managementUsers")}
                    className="um-cancel-btn"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="um-submit-btn">
                    Create {users.filter((u) => u.name && u.emailPrefix).length}{" "}
                    Account(s)
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
