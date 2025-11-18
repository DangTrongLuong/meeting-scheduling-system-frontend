import React, { useEffect, useState } from "react";
import "../../styles/EditMeeting.css";
import { toast } from "react-toastify";

export default function EditMeeting({ meetingId, onClose, rooms }) {
  const [loading, setLoading] = useState(false);
  const [meetingData, setMeetingData] = useState({
    title: "",
    description: "",
    date: "",
    startTime: "",
    endTime: "",
    roomId: "",
  });

  // Load meeting info
  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    fetch(`http://localhost:8080/api/meetings/${meetingId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setMeetingData({
          title: data.title,
          description: data.description || "",
          date: data.startTime.split("T")[0],
          startTime: data.startTime.slice(11, 16),
          endTime: data.endTime.slice(11, 16),
          roomId: data.roomId,
        });
      })
      .catch(() => toast.error("Không thể tải thông tin cuộc họp"));
  }, [meetingId]);

  // Generate 30-min time slots
  const generateTime = () => {
    const list = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 30) {
        list.push(
          `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
        );
      }
    }
    return list;
  };

  const timeSlots = generateTime();

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");

      const startDT = `${meetingData.date}T${meetingData.startTime}:00`;
      const endDT = `${meetingData.date}T${meetingData.endTime}:00`;

      const response = await fetch(
        `http://localhost:8080/api/meetings/update/${meetingId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: meetingData.title,
            description: meetingData.description,
            roomId: meetingData.roomId,
            startTime: startDT,
            endTime: endDT,
          }),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message);
      }

      toast.success("Cập nhật thành công!");
      onClose();
    } catch (e) {
      toast.error(e.message || "Lỗi cập nhật!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="edit-modal" onClick={onClose}>
      <div className="edit-modal-content" onClick={(e) => e.stopPropagation()}>
        <h3 className="edit-title">Edit Meeting</h3>

        <div className="edit-body">
          <label>Title:</label>
          <input
            className="edit-input"
            value={meetingData.title}
            onChange={(e) =>
              setMeetingData({ ...meetingData, title: e.target.value })
            }
          />

          <label>Description:</label>
          <textarea
            className="edit-input"
            rows="3"
            value={meetingData.description}
            onChange={(e) =>
              setMeetingData({ ...meetingData, description: e.target.value })
            }
          />

          <label>Date:</label>
          <input
            type="date"
            className="edit-input"
            value={meetingData.date}
            onChange={(e) =>
              setMeetingData({ ...meetingData, date: e.target.value })
            }
          />

          <label>Room:</label>
          <select
            className="edit-input"
            value={meetingData.roomId}
            onChange={(e) =>
              setMeetingData({ ...meetingData, roomId: e.target.value })
            }
          >
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name}
              </option>
            ))}
          </select>

          <label>Start Time:</label>
          <select
            className="edit-input"
            value={meetingData.startTime}
            onChange={(e) =>
              setMeetingData({ ...meetingData, startTime: e.target.value })
            }
          >
            {timeSlots.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>

          <label>End Time:</label>
          <select
            className="edit-input"
            value={meetingData.endTime}
            onChange={(e) =>
              setMeetingData({ ...meetingData, endTime: e.target.value })
            }
          >
            {timeSlots.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="edit-footer">
          <button className="edit-save" onClick={handleUpdate} disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </button>
          <button className="edit-cancel" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
