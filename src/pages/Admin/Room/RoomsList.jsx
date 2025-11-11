// src/pages/Admin/RoomList.jsx
import React, { useEffect, useState } from "react";
import NavBar from "../../../components/NavBar";
import SideBarAdmin from "../../../components/SideBarAdmin";
import axios from "axios";
import "../../../styles/DashboardAdmin.css";
import { useNavigate } from "react-router-dom";

const RoomList = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await axios.get("/api/admin/rooms"); // ✅ API từ backend
      setRooms(response.data);
    } catch (error) {
      console.error("Error fetching rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="my-project-container">
      <NavBar onToggleSidebar={toggleSidebar} />
      <div className="main-layout">
        <SideBarAdmin
          activeItem="management-rooms"
          onItemClick={() => {}}
          isOpen={sidebarOpen}
          onClose={closeSidebar}
        />
        <main className="main-content">
          <div className="content-inner">
            <h1 className="page-title">Meeting Rooms</h1>
            {loading ? (
              <p>Loading...</p>
            ) : (
              <div className="card-grid">
                {rooms.map((room) => (
                  <div key={room.id} className="card">
                    {/* /assets/room-placeholder.jpg */}
                    <h3 className="card-title">{room.name}</h3>
                    <p className="card-text">Location: {room.location}</p>
                    <p className="card-text">Capacity: {room.capacity}</p>
                    <button
                      className="card-btn"
                      onClick={() => navigate(`/managementRooms/${room.id}`)}
                    >
                      Edit
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default RoomList;