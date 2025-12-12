import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import NavBar from "../../../components/NavBar";
import SideBarAdmin from "../../../components/SideBarAdmin";
import { Search, Plus, Edit2, Trash2, Mail, Shield } from "lucide-react";
import "../../../styles/UserManagement/UserManagement.css";
import axios from "axios";

const UserManagement = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenuItem, setActiveMenuItem] = useState("users-management");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const token = localStorage.getItem("accessToken");

  useEffect(() => {
    const pathToItem = { "/admin/managementUsers": "users-management" };
    setActiveMenuItem(pathToItem[location.pathname] || "users-management");
  }, [location.pathname]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async (pageNumber = 0) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");
      const { data } = await axios.get("/api/auth/page", {
        params: { page: pageNumber, size: 10 },
        headers: { Authorization: `Bearer ${token}` },
      });

      // Lấy danh sách ban đầu
      const base = data.content;

      // Bổ sung trạng thái 2FA cho từng user
      const statusList = await Promise.all(
        base.map((u) =>
          axios
            .get("/api/auth/2fa/status", { params: { email: u.email } })
            .then((res) => {
              const raw =
                res.data?.two_factor_enabled ?? res.data?.twoFactorEnabled ?? 0;
              return { email: u.email, enabled: Boolean(raw) };
            })
            .catch(() => ({ email: u.email, enabled: false }))
        )
      );
      const statusMap = new Map(statusList.map((s) => [s.email, s.enabled]));
      const enriched = base.map((u) => ({
        ...u,
        twoFactorEnabled: statusMap.get(u.email) ?? false,
      }));

      setUsers(enriched);
      setPage(data.number);
      setTotalPages(data.totalPages);
    } catch (error) {
      toast.error("Failed to load users");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async (user) => {
    try {
      const response = await axios.post("/api/auth/2fa/disable", null, {
        params: { email: user.email },
      });
      const ok = response.data === "2FA disabled" || response.data?.success;
      if (ok) {
        toast.success(`2FA disabled for ${user.email}`);
        setUsers((prev) =>
          prev.map((u) =>
            u.id === user.id ? { ...u, twoFactorEnabled: false } : u
          )
        );
      } else {
        toast.error(response.data?.message ?? "Failed to disable 2FA");
      }
    } catch (error) {
      toast.error(error.response?.data?.message ?? "Failed to disable 2FA");
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      await axios.delete(`/api/auth/delete-user/${userToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("User deleted successfully!");
      fetchUsers(page);
    } catch (error) {
      toast.error("Error deleting user");
      console.error(error);
    } finally {
      setShowDeleteModal(false);
      setUserToDelete(null);
    }
  };

  const confirmDeleteUser = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const filteredUsers = users
    .filter(
      (user) =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === "name") {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === "email") {
        comparison = a.email.localeCompare(b.email);
      } else if (sortBy === "role") {
        comparison = a.role.localeCompare(b.role);
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

  const handleMenuClick = (itemId) => setActiveMenuItem(itemId);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await axios.patch(
        "/api/admin/auth/update-user-role",
        {
          userId,
          role: newRole,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      toast.success("Role updated!");
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
      fetchUsers(page); // revert nếu lỗi
    }
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
          <h1 className="user-management-sp">User Management</h1>

          <div className="user-management-controls">
            <div className="um-search-wrapper">
              <Search className="um-search-icon" size={20} />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="um-search-field"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="um-sort-dropdown"
            >
              <option value="name">Sort by Name</option>
              <option value="email">Sort by Email</option>
              <option value="role">Sort by Role</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="um-order-toggle"
            >
              {sortOrder === "asc" ? "↑ Ascending" : "↓ Descending"}
            </button>
            <button
              onClick={() => navigate("/admin/managementUsers/create")}
              className="um-add-button"
            >
              <Plus size={20} />
              Add User
            </button>
            {/* NÚT EXPORT EXCEL – CHỈ XUẤT USER CHƯA ACTIVE */}
            <button
              onClick={() => {
                const XLSX = window.XLSX;
                if (!XLSX) {
                  toast.error("Export library not loaded!");
                  return;
                }

                // LỌC CHỈ NHỮNG USER CÓ active = false
                const inactiveUsers = users.filter((user) => !user.active);

                if (inactiveUsers.length === 0) {
                  toast.warning("No inactive users to export");
                  return;
                }

                const defaultPass =
                  localStorage.getItem("lastUsedDefaultPassword") || "N/A";

                const dataToExport = inactiveUsers.map((user) => ({
                  Name: user.name,
                  Email: user.email,
                  Password: defaultPass,
                  Age: user.age || "N/A",
                  Phone: user.phone_numbers || "N/A",
                  Address: user.address || "N/A",
                }));

                const ws = XLSX.utils.json_to_sheet(dataToExport);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Inactive Users");

                const fileName = `inactive_users_${new Date()
                  .toISOString()
                  .slice(0, 10)}.xlsx`;
                XLSX.writeFile(wb, fileName);

                toast.success(
                  `Exported ${inactiveUsers.length} inactive account(s)!`
                );
              }}
              className="um-add-button"
              style={{
                background: "linear-gradient(135deg, #0bc23cff, #06a83cff)",
                marginLeft: "12px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6" />
                <text
                  x="6"
                  y="16"
                  fontSize="10"
                  fill="white"
                  fontWeight="bold"
                ></text>
              </svg>
              Export Users
            </button>
          </div>

          {loading ? (
            <div className="um-loading-container">
              <div className="um-loading-spinner"></div>
              <p>Loading users...</p>
            </div>
          ) : (
            <div className="um-table-wrapper">
              <table className="um-data-table">
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>Avatar</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>2FA</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="um-no-data">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user, index) => (
                      <tr
                        key={user.id}
                        onClick={() =>
                          navigate(`/admin/managementUsers/detail/${user.id}`)
                        }
                      >
                        <td>{index + 1}</td>

                        <td>
                          <img
                            src={
                              user.avatar_url
                                ? user.avatar_url.startsWith("http")
                                  ? user.avatar_url
                                  : `http://localhost:8080${user.avatar_url}`
                                : "http://localhost:8080/uploads/avatars/user-avatar.png"
                            }
                            alt="avatar"
                            className="um-avatar-img"
                          />
                        </td>

                        <td className="um-name-cell">{user.name}</td>
                        <td className="um-email-cell">
                          <Mail size={16} className="um-icon-inline" />
                          {user.email}
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          {user.role === "SUPERADMIN" ? (
                            <span className={`um-role-tag um-role-superadmin`}>
                              <Shield size={14} />
                              SUPERADMIN
                            </span>
                          ) : (
                            <select
                              value={user.role}
                              onChange={(e) =>
                                handleRoleChange(user.id, e.target.value)
                              }
                              className="um-role-select"
                              style={{
                                padding: "6px 10px",
                                borderRadius: "6px",
                                border: "1px solid #cbd5e0",
                                background: "white",
                                fontWeight: "600",
                                fontSize: "0.875rem",
                                color:
                                  user.role === "ADMIN"
                                    ? "#f50924ff"
                                    : "#3182ce",
                                cursor: "pointer",
                              }}
                            >
                              <option value="USER">USER</option>
                              <option value="ADMIN">ADMIN</option>
                            </select>
                          )}
                        </td>
                        <td>
                          <span
                            style={{
                              backgroundColor: user.active
                                ? "#38a169"
                                : "#fed7d7",
                              color: user.active ? "#fff" : "#c53030",
                              padding: "2px 6px",
                              borderRadius: "5px",
                              fontWeight: "600",
                              fontSize: "0.8rem",
                            }}
                          >
                            {user.active ? "ACTIVE" : "INACTIVE"}
                          </span>
                        </td>

                        <td onClick={(e) => e.stopPropagation()}>
                          <button
                            className={`um-2fa-switch ${
                              user.twoFactorEnabled ? "on" : "off"
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (user.twoFactorEnabled) {
                                // Đang bật → cho phép tắt
                                handleDisable2FA(user);
                              } else {
                                // Đang tắt → không cho bật
                                toast.info(
                                  "2FA cannot be enabled from User Management"
                                );
                              }
                            }}
                            title={
                              user.twoFactorEnabled
                                ? "Click to disable 2FA"
                                : "2FA is OFF (cannot enable)"
                            }
                          >
                            {user.twoFactorEnabled ? "ON" : "OFF"}
                          </button>
                        </td>

                        <td>
                          <div className="um-action-group">
                            {user.role !== "SUPERADMIN" && (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(
                                      `/admin/managementUsers/edit/${user.id}`
                                    );
                                  }}
                                  className="um-edit-action"
                                  title="Edit user"
                                >
                                  <Edit2 size={16} />
                                </button>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    confirmDeleteUser(user);
                                  }}
                                  className="um-delete-action"
                                  title="Delete user"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="um-count-info">
            Showing {filteredUsers.length} of {users.length} users
          </div>

          {totalPages > 1 && (
            <div className="um-pagination">
              <button
                onClick={() => fetchUsers(page - 1)}
                disabled={page === 0}
                className="um-page-btn"
              >
                Previous
              </button>

              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => fetchUsers(i)}
                  className={`um-page-btn ${
                    i === page ? "um-page-active" : ""
                  }`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                onClick={() => fetchUsers(page + 1)}
                disabled={page === totalPages - 1}
                className="um-page-btn"
              >
                Next
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          className="um-modal-backdrop-delete-user"
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="um-modal-box-delete-user"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Confirm Delete</h3>
            <p>
              Are you sure you want to delete{" "}
              <strong>{userToDelete?.name}</strong>?
            </p>
            <div className="um-modal-bottom">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="um-cancel-btn"
              >
                Cancel
              </button>
              <button onClick={handleDeleteUser} className="um-submit-btn">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
