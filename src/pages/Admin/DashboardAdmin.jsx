import React, { useState, useEffect } from "react";
import NavBar from "../../components/NavBar";
import SideBarAdmin from "../../components/SideBarAdmin";
import { Book, User, Package, BarChart3 } from "lucide-react";
import axios from "axios";
import "../../styles/DashboardAdmin.css";

const DashboardAdmin = () => {
  const [activeMenuItem, setActiveMenuItem] = useState("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userName, setUserName] = useState("Admin");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      fetchUserInfo(userId);
    }
  }, []);

  const fetchUserInfo = async (userId) => {
    try {
      const response = await axios.get(`/api/auth/get-users/${userId}`);
      const data = response.data;
      setUserName(data.name || "Admin");
    } catch (error) {
      console.error("Error fetching user info:", error);
      setUserName("Admin");
    } finally {
      setLoading(false);
    }
  };

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
      <NavBar onToggleSidebar={toggleSidebar} />

      <div className="main-layout">
        <SideBarAdmin
          activeItem={activeMenuItem}
          onItemClick={handleMenuClick}
          isOpen={sidebarOpen}
          onClose={closeSidebar}
        />

        <main className="main-content">
          <div className="content-inner">
            <h1 className="page-title">
              Chào mừng đến với Hệ thống Quản lý Thiết bị
            </h1>
            <p className="page-subtitle">
              {loading ? "Đang tải..." : `Xin chào, ${userName}`}
            </p>

            <div className="card-grid">
              <div className="card">
                <Book size={40} color="#0084FF" />
                <h3 className="card-title">Quản lý Thiết bị</h3>
                <p className="card-text">Thêm, sửa, xóa thông tin thiết bị</p>
              </div>

              <div className="card">
                <User size={40} color="#0084FF" />
                <h3 className="card-title">Quản lý Phòng</h3>
                <p className="card-text">Quản lý thông tin các phòng họp</p>
              </div>

              <div className="card">
                <Package size={40} color="#0084FF" />
                <h3 className="card-title">Quản lý Người dùng</h3>
                <p className="card-text">Xử lý thông tin người dùng</p>
              </div>

              <div className="card">
                <BarChart3 size={40} color="#0084FF" />
                <h3 className="card-title">Báo cáo</h3>
                <p className="card-text">Thống kê và báo cáo hệ thống</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardAdmin;
