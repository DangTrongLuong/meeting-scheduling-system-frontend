import React, { useState, useEffect } from "react";
import axios from "axios";

const Dashboard = () => {
  const [showRoomManager, setShowRoomManager] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [formData, setFormData] = useState({ name: "", location: "", capacity: "" });
  const [editingRoom, setEditingRoom] = useState(null);

  const API_URL = "http://localhost:8080/api/v1/rooms";

  const fetchRooms = async () => {
    try {
      const response = await axios.get(API_URL);
      setRooms(response.data);
    } catch (error) {
      console.error("Error fetching rooms:", error);
    }
  };

  useEffect(() => {
    if (showRoomManager) {
      fetchRooms();
    }
  }, [showRoomManager]);

  const handleAddRoom = async (e) => {
    e.preventDefault();
    try {
      await axios.post(API_URL, formData);
      setFormData({ name: "", location: "", capacity: "" });
      fetchRooms();
    } catch (error) {
      console.error("Error adding room:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      fetchRooms();
    } catch (error) {
      console.error("Error deleting room:", error);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_URL}/${editingRoom.id}`, editingRoom);
      setEditingRoom(null);
      fetchRooms();
    } catch (error) {
      console.error("Error updating room:", error);
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Taskbar */}
      <div style={{ width: "200px", background: "#007bff", color: "#fff", padding: "20px" }}>
        <h3>Menu</h3>
        <button
          style={{ display: "block", marginBottom: "10px", width: "100%" }}
          onClick={() => setShowRoomManager(false)}
        >
          Lịch đặt phòng
        </button>
        <button
          style={{ display: "block", width: "100%" }}
          onClick={() => setShowRoomManager(true)}
        >
          Quản lý phòng
        </button>
      </div>

      {/* Nội dung chính */}
      <div style={{ flex: 1, padding: "20px" }}>
        {!showRoomManager ? (
          // Giao diện lịch giữ nguyên
          <div>
            <h2>Lịch đặt phòng</h2>
            {/* Đây là phần lịch hiện tại của bạn */}
            <div style={{ border: "1px solid #ccc", padding: "10px" }}>
              {/* Copy nguyên giao diện lịch cũ vào đây */}
              <p>Hiển thị lịch như hình bạn gửi</p>
            </div>
          </div>
        ) : (
          // Giao diện quản lý phòng
          <div>
            <h2>Quản lý phòng họp</h2>
            <table border="1" cellPadding="10" style={{ marginBottom: "20px", width: "100%" }}>
              <thead>
                <tr>
                  <th>Tên phòng</th>
                  <th>Vị trí</th>
                  <th>Sức chứa</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((room) => (
                  <tr key={room.id}>
                    <td>{room.name}</td>
                    <td>{room.location}</td>
                    <td>{room.capacity}</td>
                    <td>
                      <button onClick={() => setEditingRoom(room)}>Sửa</button>
                      <button onClick={() => handleDelete(room.id)}>Xóa</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Form thêm phòng */}
            <h3>Thêm phòng mới</h3>
            <form onSubmit={handleAddRoom}>
              <input
                name="name"
                placeholder="Tên phòng"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <input
                name="location"
                placeholder="Vị trí"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
              <input
                name="capacity"
                placeholder="Sức chứa"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              />
              <button type="submit">Thêm</button>
            </form>

            {/* Form sửa phòng */}
            {editingRoom && (
              <div style={{ marginTop: "20px" }}>
                <h3>Sửa phòng</h3>
                <form onSubmit={handleUpdate}>
                  <input
                    value={editingRoom.name}
                    onChange={(e) => setEditingRoom({ ...editingRoom, name: e.target.value })}
                  />
                  <input
                    value={editingRoom.location}
                    onChange={(e) => setEditingRoom({ ...editingRoom, location: e.target.value })}
                  />
                  <input
                    value={editingRoom.capacity}
                    onChange={(e) => setEditingRoom({ ...editingRoom, capacity: e.target.value })}
                  />
                  <button type="submit">Cập nhật</button>
                  <button type="button" onClick={() => setEditingRoom(null)}>Hủy</button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;