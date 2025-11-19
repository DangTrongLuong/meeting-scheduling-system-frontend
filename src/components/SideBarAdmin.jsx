import React, { useState, useEffect, useRef } from "react";
import {
  Home,
  User,
  ChevronRight,
  X,
  LogOut,
  BedDouble,
  Monitor,
  Server,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../styles/Admin/SideBarAdmin.css";
import "../styles/ProgressBar.css";

const SideBarAdmin = ({ activeItem, onItemClick, isOpen, onClose }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const sidebarRef = useRef(null);

  const menuItems = [
    {
      id: "home",
      icon: Home,
      label: "Home",
      hasSubmenu: true,
      path: "/dashboardAdmin",
    },
    {
      id: "devices",
      icon: Monitor,
      label: "Devices",
      hasSubmenu: true,
      path: "/devices",
    },
    {
      id: "management-rooms",
      icon: BedDouble,
      label: "Rooms",
      hasSubmenu: true,
      path: "/managementRooms",
    },
    {
      id: "device-room",
      icon: Server,
      label: "Device Room",
      hasSubmenu: true,
      path: "/deviceRoom",
    },

    // {
    //   id: "users",
    //   icon: User,
    //   label: "Users",
    //   hasSubmenu: true,
    //   path: "/managementsUsers",
    // },
  ];

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    const handleClickOutside = (event) => {
      if (
        isMobile &&
        isOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        !event.target.closest(".toggle-sidebar-btn")
      ) {
        onClose();
      }
    };

    window.addEventListener("resize", handleResize);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobile, isOpen, onClose]);

  const handleItemClick = (itemId, path) => {
    setIsLoading(true);
    onItemClick(itemId);

    if (isMobile) {
      setTimeout(() => {
        navigate(path);
        onClose();
        setTimeout(() => setIsLoading(false), 1000);
      }, 600);
    } else {
      setTimeout(() => {
        navigate(path);
        setTimeout(() => setIsLoading(false), 1000);
      }, 600);
    }
  };

  const handleLogout = () => {
    localStorage.clear();

    sessionStorage.clear();

    document.cookie.split(";").forEach((cookie) => {
      const name = cookie.split("=")[0].trim();
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });

    window.location.href = "/";
  };

  return (
    <>
      {isMobile && isOpen && (
        <div className="sidebar-overlay" onClick={onClose}></div>
      )}
      <div className={`progress-bar ${isLoading ? "active" : ""}`}></div>
      <aside
        ref={sidebarRef}
        className={`sidebar-admin ${isMobile && isOpen ? "open" : ""} ${
          isMobile && !isOpen ? "closed" : ""
        }`}
      >
        {isMobile && (
          <button className="close-sidebar-btn" onClick={onClose}>
            <X size={24} />
          </button>
        )}
        <div className="sidebar-content">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.id;

            return (
              <div
                key={item.id}
                className={`menu-item ${isActive ? "active" : ""}`}
                onClick={() => handleItemClick(item.id, item.path)}
              >
                <Icon size={20} className="menu-icon" />
                <span className="menu-label">{item.label}</span>
                {item.hasSubmenu && (
                  <ChevronRight size={16} className="menu-chevron" />
                )}
              </div>
            );
          })}
        </div>
        <div className="btn-logout">
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default SideBarAdmin;
