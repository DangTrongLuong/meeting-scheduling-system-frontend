// src/components/NavBarUser.jsx
import React, { useState, useEffect, useRef } from "react";
import { User, LogOut, ChevronRight, X, Menu } from "lucide-react";
import "../styles/NavBarUser.css";
import logo_cmc from "../assets/logocmc.png";
import user_img from "../assets/user-avatar.png";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

const NavBarUser = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const { user, setUser } = useUser();
  const [avatarUrl, setAvatarUrl] = useState(user_img);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);

    const userId = localStorage.getItem("userId");
    if (userId) {
      fetchUserInfo(userId);
    }

    // Close dropdown on click outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchUserInfo = async (userId) => {
    try {
      const response = await axios.get(`/api/auth/get-users/${userId}`);
      const data = response.data;

      setAvatarUrl(data.avatar_url || user_img);
    } catch (error) {
      console.error("Error fetching user info:", error);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const handleProfileClick = () => {
    navigate("/profile");
    setIsDropdownOpen(false);
  };

  return (
    <nav className="navbar-user">
      <div className="nav-content-user">
        <div className="logo-section-user">
          {isMobile && (
            <button
              className="toggle-sidebar-btn-user"
              onClick={onToggleSidebar}
            >
              <Menu size={24} />
            </button>
          )}
          <div className="logo-image-user">
            <img src={logo_cmc} alt="logo logocmc" className="img-user" />
          </div>
          {!isMobile && (
            <div className="logo-text-content-user">
              <span className="logo-text-user">MSS</span>
              <p>Meeting Scheduling System</p>
            </div>
          )}
        </div>

        <div className="user-section-user" ref={dropdownRef}>
          <div
            className="user-info-user"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <span className="user-name-user">{user.userName || "User"}</span>
            <div className="avatar-user">
              <div className="admin-avatar-user">
                <img
                  src={
                    user.avatarUrl
                      ? user.avatarUrl.startsWith("http")
                        ? user.avatarUrl
                        : `http://localhost:8080${user.avatarUrl}`
                      : localStorage.getItem("avatarUrl")
                      ? localStorage.getItem("avatarUrl").startsWith("http")
                        ? localStorage.getItem("avatarUrl")
                        : `http://localhost:8080${localStorage.getItem(
                            "avatarUrl"
                          )}`
                      : user_img
                  }
                  className="img-admin-user"
                  alt="Avatar"
                />
              </div>
            </div>
            {/* <ChevronRight
              size={16}
              className={`chevron-user ${isDropdownOpen ? "open" : ""}`}
            /> */}
          </div>

          {isDropdownOpen && (
            <div className="dropdown-menu-user">
              <ul>
                <li onClick={handleProfileClick}>
                  <User size={16} /> Personal Information
                </li>
                <li onClick={handleLogout}>
                  <LogOut size={16} /> Logout
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavBarUser;
