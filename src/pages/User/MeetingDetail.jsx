
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const MeetingDetail = () => {
  const { id } = useParams(); // Lấy ID từ URL
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`/api/meetings/${id}`)
      .then(response => {
        setMeeting(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error(error);
        alert("Không thể tải thông tin cuộc họp!");
        setLoading(false);
      });
  }, [id]);

  const handleCancel = () => {
    const confirmCancel = window.confirm("Bạn có chắc muốn hủy cuộc họp này?");
    if (!confirmCancel) return;

    axios.patch(`/api/meetings/cancel/${id}`, {}, {
      headers: { createdBy: "ngoc@example.com" } // TODO: Thay bằng user thực tế từ context/auth
    })
    .then(() => {
      alert("Cuộc họp đã được hủy!");
      navigate("/calendar"); // Quay lại trang lịch
    })
    .catch(error => {
      console.error(error);
           alert("Có lỗi xảy ra khi hủy cuộc họp!");
    });
  };

  if (loading) return <p>Đang tải...</p>;
  if (!meeting) return <p>Không tìm thấy cuộc họp!</p>;

  // ====== Helpers ======
  // Nếu backend đã có cờ hasConcluded, dùng trực tiếp; nếu chưa thì tự tính từ endTime.
  const hasConcluded =
    typeof meeting.hasConcluded === "boolean"
      ? meeting.hasConcluded
      : (meeting?.endTime
          ? new Date(meeting.endTime).getTime() < Date.now()
          : false);

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN", { hour12: false });
  };

  return (
    <div
      style={{
        padding: "20px",
        maxWidth: "600px",
        margin: "0 auto",
        border: "1px solid",
        borderColor: hasConcluded ? "#e53935" : "#ddd",        // 🔴 viền đỏ khi kết thúc
        borderRadius: "8px",
        backgroundColor: hasConcluded ? "#ffebee" : "#f9f9f9", // 🔴 nền đỏ nhạt khi kết thúc
      }}
    >
      <h2 style={{ marginBottom: "20px" }}>Chi tiết cuộc họp</h2>

      {/* Badge thông báo đã kết thúc */}
      {hasConcluded && (
        <div
          style={{
            display: "inline-block",
            background: "#e53935",
            color: "#fff",
            padding: "6px 10px",
            borderRadius: "4px",
            marginBottom: "12px",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.3px",
          }}
        >
          meeting has concluded
        </div>
      )}

      <p><strong>Tiêu đề:</strong> {meeting.title}</p>
      <p><strong>Phòng:</strong> {meeting.room?.name ?? meeting.roomName}</p>
      <p><strong>Bắt đầu:</strong> {formatDateTime(meeting.startTime)}</p>
      <p><strong>Kết thúc:</strong> {formatDateTime(meeting.endTime)}</p>
      <p><strong>Người tạo:</strong> {meeting.creator?.name ?? meeting.createdBy} {meeting.creator?.email ? `(${meeting.creator.email})` : ""}</p>
      <p><strong>Trạng thái:</strong> {meeting.status}</p>

      {/* Ẩn nút hủy nếu đã kết thúc */}
      {!hasConcluded && meeting.status === "ACTIVE" && (
        <button
          onClick={handleCancel}
          style={{
            background: "red",
            color: "#fff",
            padding: "10px 15px",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            marginTop: "20px",
          }}
        >
          Hủy cuộc họp
        </button>
      )}
    </div>
  );
};
export default MeetingDetail;