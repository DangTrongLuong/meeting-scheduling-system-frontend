import React, { useEffect, useState, useContext } from "react";
import { WebSocketContext } from "../context/WebSocketContext";

const NotificationPopup = () => {
  const { client } = useContext(WebSocketContext);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (client) {
      client.subscribe("/user/queue/reminders", (message) => {
        const data = JSON.parse(message.body);
        setNotification(data);
      });
    }
  }, [client]);

  if (!notification) return null;

  return (
    <div style={popupStyle}>
      <h4>Nhắc nhở cuộc họp</h4>
      <p><strong>{notification.title}</strong></p>
      <p>Bắt đầu lúc: {new Date(notification.startTime).toLocaleString()}</p>
      <p>Phòng: {notification.roomName}</p>
      <button onClick={() => setNotification(null)}>Đóng</button>
    </div>
  );
};

const popupStyle = {
  position: "fixed",
  bottom: "20px",
  right: "20px",
  backgroundColor: "#fff",
  padding: "15px",
  border: "1px solid #ccc",
  borderRadius: "8px",
  boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
  zIndex: 9999,
};

export default NotificationPopup;
