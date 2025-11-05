import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";

import NavBarUser from "../components/NavBarUser";

export default function Dashboard() {
  const navigate = useNavigate();

  const teamMembers = [
    { name: "QT", icon: "👤" },
    { name: "HT", icon: "👤" },
    { name: "LT", icon: "👤" },
    { name: "MT", icon: "👤" },
    { name: "NT", icon: "👤" },
    { name: "V", icon: "👤" },
  ];

  const weekDays = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN"];
  const timeSlots = Array.from(
    { length: 18 },
    (_, i) => `${(6 + i).toString().padStart(2, "0")}:00`
  );
  const [currentTime, setCurrentTime] = useState("");
  const [showMore, setShowMore] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Tạo lịch tháng 11
  const generateNovemberCalendar = () => {
    const days = [];
    const year = new Date().getFullYear();
    const month = 10; // Tháng 11 (0-based)
    const totalDays = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(year, month, day);
      const weekday = date.toLocaleDateString("vi-VN", { weekday: "short" });
      days.push({ day, weekday });
    }
    return days;
  };

  const novemberDays = generateNovemberCalendar();

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options = { weekday: "short", month: "short", day: "numeric" };
      setCurrentTime(
        `${now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })} - ${now.toLocaleDateString("vi-VN", options)}`
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <NavBarUser />
      <div className="dashboard">
        {/* Content */}
        <div className="content">
          {/* Sidebar */}
          <aside className="sidebar">
            <h3>Tháng 11</h3>
            <div className="calendar-box">
              {novemberDays.map((d, i) => (
                <div key={i} className="calendar-day">
                  <span className="calendar-weekday">{d.weekday}</span>
                  <span className="calendar-date">{d.day}/11</span>
                </div>
              ))}
            </div>

            <div className="room-box">
              <h4>Phòng đã đặt</h4>
              <ul>
                <li>Phòng 101</li>
                <li>Phòng 202</li>
              </ul>
              <h4>Phòng trống</h4>
              <ul>
                <li>Phòng 303</li>
                <li>Phòng 404</li>
              </ul>
            </div>
          </aside>

          {/* Main content */}
          <main className="main-content">
            <div className="week-calendar">
              {/* Header: ngày trong tuần */}
              <div className="week-header">
                <div className="time-header">Giờ</div>
                {weekDays.map((day, i) => (
                  <div key={i} className="week-day">
                    {day}
                  </div>
                ))}
              </div>

              {/* Grid: thời gian theo hàng, ngày theo cột */}
              <div className="schedule-grid">
                {timeSlots.map((time, rowIndex) => (
                  <React.Fragment key={time}>
                    <div className="time-slot">{time}</div>
                    {weekDays.map((day, colIndex) => (
                      <div
                        key={`${day}-${time}`}
                        className="schedule-cell"
                        onClick={() => setSelectedSlot(`${day} - ${time}`)}
                      ></div>
                    ))}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </main>
        </div>

        {/* Popup chi tiết */}
        {selectedSlot && (
          <div className="event-popup">
            <div className="popup-content">
              <h3>Chi tiết đặt phòng</h3>
              <p>Khung giờ: {selectedSlot}</p>
              <button onClick={() => setSelectedSlot(null)}>Đóng</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
