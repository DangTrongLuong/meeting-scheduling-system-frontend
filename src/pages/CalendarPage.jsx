import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import axios from 'axios';
import Modal from 'react-modal';

Modal.setAppElement('#root'); // Đảm bảo modal hoạt động đúng

export default function CalendarPage() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    axios.get('http://localhost:8080/api/meetings')
      .then(res => {
        const formatted = res.data.map(m => ({
          id: m.id,
          title: m.title,
          start: new Date(m.startTime),
          end: new Date(m.endTime),
          roomId: m.roomId,
          invitedEmails: m.invitedEmails
        }));
        setEvents(formatted);
      })
      .catch(err => console.error(err));
  }, []);

  // Màu sắc theo phòng họp
  const eventColor = (roomId) => {
    const colors = {
      1: '#FFB6C1',
      2: '#ADD8E6',
      3: '#90EE90'
    };
    return colors[roomId] || '#D3D3D3';
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Lịch họp</h2>
      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        events={events}
        locale="vi"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth'
        }}
        eventClick={(info) => {
          setSelectedEvent(info.event);
        }}
        eventDidMount={(info) => {
          const roomId = info.event.extendedProps.roomId;
          info.el.style.backgroundColor = eventColor(roomId);
        }}
      />

      {/* Popup chi tiết meeting */}
      <Modal
        isOpen={!!selectedEvent}
        onRequestClose={() => setSelectedEvent(null)}
        contentLabel="Chi tiết cuộc họp"
        style={{
          content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)'
          }
        }}
      >
        {selectedEvent && (
          <div>
            <h3>{selectedEvent.title}</h3>
            <p><strong>Thời gian bắt đầu:</strong> {selectedEvent.start.toLocaleString()}</p>
            <p><strong>Thời gian kết thúc:</strong> {selectedEvent.end.toLocaleString()}</p>
            <p><strong>Phòng họp:</strong> {selectedEvent.extendedProps.roomId}</p>
            <p><strong>Người được mời:</strong> {selectedEvent.extendedProps.invitedEmails.join(', ')}</p>
            <button onClick={() => setSelectedEvent(null)}>Đóng</button>
          </div>
        )}
      </Modal>
    </div>
  );
}