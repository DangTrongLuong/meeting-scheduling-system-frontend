// src/pages/Admin/Room/RoomsList.jsx
import React, { useEffect, useState } from "react";
import NavBar from "../../../components/NavBar";
import SideBarAdmin from "../../../components/SideBarAdmin";
import axios from "axios";
import "../../../styles/DashboardAdmin.css";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react"; // 💡 Import icon Plus
import "../../../styles/Room/RoomsList.css";

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
      // API lấy danh sách phòng
      const response = await axios.get("/api/admin/rooms"); 
      setRooms(response.data);
    } catch (error) {
      console.error("Error fetching rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  // 1. Xử lý click vào Card (chuyển sang màn hình Edit/Details)
  const handleRoomClick = (roomId) => {
    // Chuyển hướng đến màn hình chi tiết/chỉnh sửa phòng với ID
    navigate(`/admin/rooms/${roomId}`); 
  };

  // 2. Xử lý click vào nút Add Room (chuyển sang màn hình Create New Room)
  const handleAddRoomClick = () => {
    // Chuyển hướng đến màn hình tạo phòng mới
    navigate("/admin/rooms/new"); 
  };

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
            
            {/* Khung chứa tiêu đề và nút Add Room */}
            <div className="header-actions">
              <h1 className="page-title">Meeting Rooms</h1>
              {/* Nút + Add Room */}
              <button 
                className="add-room-btn" 
                onClick={handleAddRoomClick}
              >
                <Plus size={20} />
                <span>Add Room</span>
              </button>
            </div>
            
            {loading ? (
              <p>Loading...</p>
            ) : (
              <div className="card-grid">
                {rooms.map((room) => (
                  <div 
                    key={room.id} 
                    className="card room-card-clickable" // Thêm class để dễ CSS hover/pointer
                    onClick={() => handleRoomClick(room.id)} // Gán sự kiện click vào Card
                  >
                    {/* /assets/room-placeholder.jpg */}
                    <h3 className="card-title">{room.name}</h3>
                    <p className="card-text">Location: {room.location}</p>
                    <p className="card-text">Capacity: {room.capacity}</p>
                    {/* Nút Edit đã bị loại bỏ */}
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