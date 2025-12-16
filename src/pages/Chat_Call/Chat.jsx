import React, { useState, useEffect, useRef } from "react";
import { Send, Search, MoreVertical } from "lucide-react";
import "../../styles/Chat_Call/Chat.css";
import axios from "axios";

export default function Chat() {
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const messagesEndRef = useRef(null);
  const currentUserId = localStorage.getItem("userId");
  const token = localStorage.getItem("accessToken");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await axios.get("/api/chat/conversations", {
        headers: {
          userId: currentUserId,
          Authorization: `Bearer ${token}`,
        },
      });

      const data = response.data;
      if (data.data) {
        setConversations(
          data.data.sort(
            (a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
          )
        );
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (userId, page = 0) => {
    try {
      const response = await axios.get(
        `/api/chat/history/${userId}?page=${page}&size=30`,
        {
          headers: {
            userId: currentUserId,
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = response.data;
      if (data.data?.content) {
        setMessages(data.data.content.reverse());
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    fetchMessages(user.userId);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    const messageData = {
      content: newMessage,
      recipientId: selectedUser.userId,
    };

    try {
      const response = await axios.post("/api/chat/send", messageData, {
        headers: {
          "Content-Type": "application/json",
          userId: currentUserId,
          Authorization: `Bearer ${token}`,
        },
      });

      const data = response.data;
      if (data.data) {
        setMessages([...messages, data.data]);
        setNewMessage("");
        fetchConversations();
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "ONLINE":
        return "#10b981";
      case "AWAY":
        return "#f59e0b";
      case "BUSY":
        return "#ef4444";
      default:
        return "#9ca3af";
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return date.toLocaleDateString("vi-VN", { month: "short", day: "numeric" });
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="chat-container">
      {/* Left Panel - Conversations */}
      <div className="chat-sidebar">
        <div className="sidebar-header">
          <h1>Tin nhắn</h1>
        </div>

        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm cuộc trò chuyện..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="conversations-list">
          {loading ? (
            <div className="loading">Đang tải...</div>
          ) : filteredConversations.length === 0 ? (
            <div className="empty-state">
              <p>Chưa có cuộc trò chuyện nào</p>
              <span>Bắt đầu chat với ai đó để tạo cuộc trò chuyện</span>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <div
                key={conv.userId}
                className={`conversation-item ${
                  selectedUser?.userId === conv.userId ? "active" : ""
                }`}
                onClick={() => handleSelectUser(conv)}
              >
                <div className="avatar-container">
                  <img
                    src={conv.avatar || "https://via.placeholder.com/48"}
                    alt={conv.name}
                    className="avatar"
                  />
                  <div
                    className="status-indicator"
                    style={{ backgroundColor: getStatusColor(conv.status) }}
                    title={conv.status}
                  />
                </div>

                <div className="conversation-info">
                  <div className="conversation-header">
                    <span className="conversation-name">{conv.name}</span>
                    <span className="message-time">
                      {formatTime(conv.lastMessageTime)}
                    </span>
                  </div>
                  <div className="conversation-preview">
                    <p className={conv.unreadCount > 0 ? "unread" : ""}>
                      {conv.lastMessage?.substring(0, 50) ||
                        "Không có tin nhắn"}
                      {conv.lastMessage?.length > 50 ? "..." : ""}
                    </p>
                    {conv.unreadCount > 0 && (
                      <span className="unread-badge">{conv.unreadCount}</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Panel - Messages */}
      <div className="chat-main">
        {selectedUser ? (
          <>
            <div className="chat-header">
              <div className="header-info">
                <img
                  src={selectedUser.avatar || "https://via.placeholder.com/40"}
                  alt={selectedUser.name}
                  className="header-avatar"
                />
                <div>
                  <h2>{selectedUser.name}</h2>
                  <p className="online-status">
                    {selectedUser.status === "ONLINE"
                      ? "🟢 Đang hoạt động"
                      : "⚫ Không hoạt động"}
                  </p>
                </div>
              </div>
              <button className="header-action">
                <MoreVertical size={20} />
              </button>
            </div>

            <div className="messages-area">
              {messages.length === 0 ? (
                <div className="empty-messages">
                  <p>Bắt đầu cuộc trò chuyện với {selectedUser.name}</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`message ${
                      msg.senderId === currentUserId ? "sent" : "received"
                    }`}
                  >
                    {msg.senderId !== currentUserId && (
                      <img
                        src={
                          msg.senderAvatar || "https://via.placeholder.com/32"
                        }
                        alt={msg.senderName}
                        className="message-avatar"
                      />
                    )}
                    <div className="message-bubble">
                      <p>{msg.content}</p>
                      <span className="message-time">
                        {formatTime(msg.sentAt)}
                        {msg.senderId === currentUserId && (
                          <span className="read-status">
                            {msg.isRead ? "✓✓" : "✓"}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="message-input-area">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Nhập tin nhắn..."
                className="message-input"
              />
              <button
                onClick={handleSendMessage}
                className="send-button"
                disabled={!newMessage.trim()}
              >
                <Send size={20} />
              </button>
            </div>
          </>
        ) : (
          <div className="no-chat-selected">
            <div className="empty-illustration">
              <p>Chọn một cuộc trò chuyện để bắt đầu</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
