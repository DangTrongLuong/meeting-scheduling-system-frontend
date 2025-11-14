import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import axios from 'axios';
import Modal from 'react-modal';

Modal.setAppElement('#root');

export default function CalendarPage() {
  const [events, setEvents] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Lấy danh sách phòng họp
  useEffect(() => {
    axios.get('http://localhost:8080/api/rooms')
      .then(res => setRooms(res.data))
      .catch(err => console.error(err));
  }, []);

  // Lấy lịch họp theo phòng
  useEffect(() => {
    if (!selectedRoom) return;

    axios.get(`http://localhost:8080/api/meetings?roomId=${selectedRoom}`)
      .then(res => {
        const formatted = res.data.map(m => ({
          id: m.id,
          title: m.title,
          start: m.startTime,
          end: m.endTime,
          roomId: m.roomId,
          invitedEmails: m.invitedEmails
        }));
        setEvents(formatted);
      })
      .catch(err => console.error(err));
  }, [selectedRoom]);

  // Tạo background events cho slot trống (ví dụ: 8h-18h)
  const generateFreeSlots = (date) => {
    const slots = [];
    const startHour = 8;
    const endHour = 18;
    for (let hour = startHour; hour < endHour; hour++) {
      slots.push({
        start: `${date}T${hour.toString().padStart(2, '0')}:00:00`,
        end: `${date}T${(hour + 1).toString().padStart(2, '0')}:00:00`,
        display: 'background',
        color: '#d4edda' // màu xanh nhạt cho slot trống
      });
    }
    return slots;
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Lịch phòng họp</h2>

      {/* Dropdown chọn phòng */}
      <select
        value={selectedRoom}
        onChange={(e) => setSelectedRoom(e.target.value)}
        style={{ marginBottom: '20px', padding: '8px' }}
      >
        <option value="">-- Chọn phòng họp --</option>
        {rooms.map(room => (
          <option key={room.id} value={room.id}>
            {room.name} (Sức chứa: {room.capacity})
          </option>
        ))}
      </select>

      {/* FullCalendar */}
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin]}
        initialView="timeGridWeek"
        locale="vi"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        events={[
          ...events,
          ...generateFreeSlots(new Date().toISOString().split('T')[0]) // slot trống cho hôm nay
        ]}
        eventClick={(info) => setSelectedEvent(info.event)}
      />

      {/* Modal chi tiết cuộc họp */}
      <Modal
        isOpen={!!selectedEvent}
        onRequestClose={() => setSelectedEvent(null)}
        contentLabel="Chi tiết cuộc họp"
        style={{
          content: {
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          }
        }}
      >
        {selectedEvent && (
          <div>
            <h3>{selectedEvent.title}</h3>
            <p><strong>Bắt đầu:</strong> {selectedEvent.start.toLocaleString()}</p>
            <p><strong>Kết thúc:</strong> {selectedEvent.end.toLocaleString()}</p>
            <p><strong>Phòng:</strong> {selectedEvent.extendedProps.roomId}</p>
            <p><strong>Người được mời:</strong> {selectedEvent.extendedProps.invitedEmails?.join(', ')}</p>
            <button onClick={() => setSelectedEvent(null)}>Đóng</button>
          </div>
        )}
      </Modal>
    </div>
  );
}