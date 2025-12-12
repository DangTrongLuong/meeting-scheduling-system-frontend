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
  const [formError, setFormError] = useState("");

  const validatePassword = (pwd) => {
    // 8+ ký tự, có ít nhất 1 thường, 1 hoa, 1 số, 1 ký tự đặc biệt trong nhóm này
    const regex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(pwd);
  };

  const getPasswordErrorMessage = (pwd) => {
    if (!pwd || pwd.trim() === "") return "";
    if (!pwd || pwd.length < 8)
      return "Password must be at least 8 characters.";
    const errs = [];
    if (!/[a-z]/.test(pwd)) errs.push("lowercase letter");
    if (!/[A-Z]/.test(pwd)) errs.push("uppercase letter");
    if (!/\d/.test(pwd)) errs.push("number");
    if (!/[@$!%*?&]/.test(pwd)) errs.push("special character (@$!%*?&)");
    return errs.length ? "Password must include: " + errs.join(", ") : "";
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
        emailPrefix: u.emailPrefix.trim().toLowerCase(),
      }))
      .filter((u) => u.name && u.emailPrefix);

    if (validUsers.length === 0) {
      setFormError("Please add at least one user");
      return;
    }

    // 1) Check trùng ngay trong form (payload)
    const prefixes = validUsers.map((u) => u.emailPrefix);
    const dupInForm = prefixes.filter((p, i) => prefixes.indexOf(p) !== i);
    if (dupInForm.length > 0) {
      const emails = [...new Set(dupInForm)].map((p) => `${p}@gmail.com`);
      setFormError(`Duplicate emails in form: ${emails.join(", ")}`);
      return;
    }

    // Chuẩn bị payload
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

        navigate("/admin/managementUsers");
      } else {
        setFormError(data.message ?? "Failed to create accounts");
      }
    } catch (error) {
      const resp = error.response?.data;
      if (error.response?.status === 400 && resp) {
        const dupPayload = resp.duplicateInPayload || [];
        const dupDb = resp.duplicateInDb || [];

        // Tạo thông điệp chi tiết hiển thị ngay trên nút
        let parts = [];
        if (dupPayload.length > 0) {
          parts.push(`Duplicate in form: ${dupPayload.join(", ")}`);
        }
        if (dupDb.length > 0) {
          parts.push(`Already exists in system: ${dupDb.join(", ")}`);
        }
        setFormError(
          parts.length ? parts.join(" | ") : resp.message || "Validation error"
        );
      } else {
        setFormError(resp?.message ?? "System error occurred");
      }
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
                      <div style={{ flex: 1, width: "100%" }}>
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
                      <div style={{ flex: 1, display: "flex", width: "100%" }}>
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
                      const pwd = e.target.value;
                      setDefaultPassword(pwd);

                      const msg = getPasswordErrorMessage(pwd);
                      setPasswordError(msg);
                    }}
                    onBlur={(e) => {
                      const msg = getPasswordErrorMessage(e.target.value);
                      setPasswordError(msg);
                    }}
                    aria-invalid={!!passwordError}
                    required
                    minLength={8}
                    placeholder="Enter strong default password"
                  />
                  <small className="um-field-hint">
                    This password will be used for all created accounts
                  </small>

                  {passwordError && (
                    <div className="um-input-error">{passwordError}</div>
                  )}
                </div>

                {formError && (
                  <div className="um-error-inline">{formError}</div>
                )}

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
