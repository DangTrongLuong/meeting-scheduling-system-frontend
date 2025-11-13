import React, { useState, useEffect, useRef } from "react";
import {
  User,
  ChevronRight,
  X,
  LogOut,
  BedDouble,
  Monitor,
  Calendar,
  MessageSquare,
  PhoneCall,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../styles/SideBarAdmin.css";
import "../styles/SideBarUser.css";
import "../styles/ProgressBar.css";

const SideBarUser = ({ activeItem, onItemClick, isOpen, onClose }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const sidebarRef = useRef(null);

  const menuItems = [
    {
      id: "meetting",
      icon: Calendar,
      label: "Schedule",
      hasSubmenu: true,
      path: "/dashboardUser",
    },
    {
      id: "message",
      icon: MessageSquare,
      label: "Chat",
      hasSubmenu: true,
      path: "/chat-message",
    },
    {
      id: "call",
      icon: PhoneCall,
      label: "Call",
      hasSubmenu: true,
      path: "/call",
    },
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
        className={`sidebar-user ${isMobile && isOpen ? "open" : ""} ${
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
                className={`menu-item-user ${isActive ? "active" : ""}`}
                onClick={() => handleItemClick(item.id, item.path)}
              >
                <div className="div-menu-user-icon">
                  <Icon className="menu-icon-user" />
                </div>
                <div className="div-menu-label-user">
                  <span className="menu-label-user">{item.label}</span>
                  {item.hasSubmenu && (
                    <ChevronRight size={16} className="menu-chevron-user" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="btn-logout-user">
          <button className="logout-btn-user" onClick={handleLogout}>
            {/* <LogOut size={25} /> */}Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default SideBarUser;
