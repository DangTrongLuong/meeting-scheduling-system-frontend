import React, { useState, useEffect, useRef } from "react";
import { Send, Search, Plus, X, ChevronLeft } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../../styles/Chat_Call/Chat.css";
import axios from "axios";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import NavBar from "../../components/NavBar";
import SideBarUser from "../../components/SideBarUser";

export default function Chat() {
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenuItem, setActiveMenuItem] = useState("chat");

  const messagesEndRef = useRef(null);
  const stompClientRef = useRef(null);

  const currentUserId = localStorage.getItem("userId");
  const token = localStorage.getItem("accessToken");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ==================== WEBSOCKET CONNECTION ====================
  useEffect(() => {
    if (!currentUserId || !token) {
      setLoading(false);
      return;
    }

    const socket = new SockJS("http://localhost:8080/ws");
    const client = new Client({
      webSocketFactory: () => socket,
      connectHeaders: {
        userId: currentUserId,
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
      console.log("✅ WebSocket connected successfully");

      client.subscribe("/user/topic/chat", (message) => {
        console.log("📨 NEW MESSAGE RECEIVED:", message.body);

        try {
          let payload = JSON.parse(message.body);

          if (Array.isArray(payload)) {
            payload = payload[0];
          }

          const msg = payload;

          if (selectedUser) {
            const isCurrent =
              (msg.senderId === currentUserId &&
                msg.recipientId === selectedUser.userId) ||
              (msg.recipientId === currentUserId &&
                msg.senderId === selectedUser.userId);

            if (isCurrent) {
              console.log("✅ ADDING MESSAGE TO CURRENT CHAT");
              setMessages((prev) => {
                if (prev.some((m) => m.id === msg.id)) {
                  return prev.map((m) =>
                    m.id === msg.id
                      ? { ...msg, isRead: msg.read || msg.isRead }
                      : m
                  );
                }
                return [...prev, { ...msg, isRead: msg.read || msg.isRead }];
              });
              scrollToBottom();
            }
          }

          setTimeout(() => fetchConversations(), 100);
        } catch (e) {
          console.error("❌ Error parsing message:", e);
        }
      });
    };

    client.onStompError = (frame) => {
      console.error("❌ STOMP Error:", frame);
    };

    client.activate();
    stompClientRef.current = client;

    return () => {
      if (client.connected) {
        client.deactivate();
      }
    };
  }, [currentUserId, token, selectedUser]);

  // ==================== FETCH CONVERSATIONS + STATUS ====================
  const fetchConversations = async () => {
    if (!currentUserId || !token) {
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get("/api/chat/conversations", {
        headers: {
          userId: currentUserId,
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data?.data) {
        const sorted = response.data.data.sort(
          (a, b) =>
            new Date(b.lastMessageTime || 0) - new Date(a.lastMessageTime || 0)
        );

        setConversations(sorted);

        const client = stompClientRef.current;
        if (client && client.connected) {
          sorted.forEach((conv) => {
            const partnerId = conv.userId.toString();

            client.subscribe(`/topic/user-status/${partnerId}`, (statusMsg) => {
              try {
                const statusUpdate = JSON.parse(statusMsg.body);
                const newStatus = statusUpdate.status || "OFFLINE";

                console.log(`🟢 Status update for ${partnerId}: ${newStatus}`);

                setConversations((prev) =>
                  prev.map((c) =>
                    c.userId.toString() === partnerId
                      ? { ...c, status: newStatus }
                      : c
                  )
                );

                if (
                  selectedUser &&
                  selectedUser.userId.toString() === partnerId
                ) {
                  setSelectedUser((prev) => ({ ...prev, status: newStatus }));
                }
              } catch (e) {
                console.error("❌ Status parse error:", e);
              }
            });
          });
        }
      } else {
        setConversations([]);
      }
    } catch (error) {
      console.error("❌ Error fetching conversations:", error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 15000);
    return () => clearInterval(interval);
  }, []);

  // ==================== FETCH MESSAGES ====================
  const fetchMessages = async (userId) => {
    try {
      const response = await axios.get(
        `/api/chat/history/${userId}?page=0&size=30`,
        {
          headers: {
            userId: currentUserId,
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data?.data?.content) {
        setMessages(response.data.data.content.reverse());
      }
    } catch (error) {
      console.error("❌ Error fetching messages:", error);
    }
  };

  // ==================== SELECT USER ====================
  const handleSelectUser = (user) => {
    const normalizedUser = {
      userId: user.userId.toString(),
      name: user.name,
      avatar: user.avatar,
      status: user.status || "OFFLINE",
      lastMessage: user.lastMessage,
      lastMessageTime: user.lastMessageTime,
      unreadCount: user.unreadCount,
      lastSeenAt: user.lastSeenAt,
    };

    setSelectedUser(normalizedUser);
    setMessages([]);

    fetchMessages(normalizedUser.userId);

    setTimeout(() => {
      axios
        .patch(
          `/api/chat/mark-all-as-read/${normalizedUser.userId}`,
          {},
          {
            headers: {
              userId: currentUserId,
              Authorization: `Bearer ${token}`,
            },
          }
        )
        .then(() => {
          console.log("✅ Marked all as read");
          fetchConversations();
        })
        .catch((err) => console.error("❌ Mark read error:", err));
    }, 500);
  };

  // ==================== SEND MESSAGE ====================
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    const content = newMessage.trim();
    const messageData = {
      content: content,
      recipientId: selectedUser.userId,
    };

    setNewMessage("");

    const client = stompClientRef.current;
    if (client && client.connected) {
      console.log("📤 Sending via WebSocket to", selectedUser.userId);
      client.publish({
        destination: "/app/chat.send",
        body: JSON.stringify(messageData),
      });
    } else {
      console.warn("⚠️ WebSocket not connected - fallback to REST");
      axios
        .post("/api/chat/send", messageData, {
          headers: {
            "Content-Type": "application/json",
            userId: currentUserId,
            Authorization: `Bearer ${token}`,
          },
        })
        .then((res) => {
          if (res.data.data) {
            setMessages((prev) => [...prev, res.data.data]);
            scrollToBottom();
            fetchConversations();
          }
        })
        .catch((err) => console.error("❌ Send failed:", err));
    }
  };

  // ==================== SEARCH USERS ====================
  const searchUsers = async (keyword) => {
    if (!keyword.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const response = await axios.get("/api/chat/search-users", {
        params: { keyword },
        headers: {
          userId: currentUserId,
          Authorization: `Bearer ${token}`,
        },
      });
      setSearchResults(response.data.data || []);
    } catch (error) {
      console.error("❌ Error searching users:", error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleStartChat = (user) => {
    const newUser = {
      userId: user.id.toString(),
      name: user.name,
      avatar:
        user.avatarUrl ||
        "http://localhost:8080/uploads/avatars/user-avatar.png",
      status: "OFFLINE",
      lastMessage: null,
      lastMessageTime: null,
      unreadCount: 0,
    };

    setSelectedUser(newUser);
    setMessages([]);
    setShowSearchModal(false);
    setSearchKeyword("");
    setSearchResults([]);

    fetchConversations();
  };

  // ==================== HELPER ====================
  const getStatusColor = (status) => {
    return status === "ONLINE" ? "#10b981" : "#6b7280";
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffMins = Math.floor((now - date) / 60000);
    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins}p`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}g`;
    return date.toLocaleDateString("vi-VN");
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  // ==================== RENDER ====================
  return (
    <div className="my-project-container">
      <ToastContainer autoClose={1500} style={{ top: "70px" }} />
      <NavBar onToggleSidebar={toggleSidebar} />
      <SideBarUser
        activeItem={activeMenuItem}
        onItemClick={() => {}}
        isOpen={sidebarOpen}
        onClose={closeSidebar}
      />
      <div className="main-layout">
        <main className="main-content-i">
          <div className="chat-wrapper">
            {/* Sidebar - Conversations List */}
            <div
              className={`chat-sidebar ${sidebarOpen ? "open" : ""}`}
              style={{
                display:
                  selectedUser && window.innerWidth < 768 ? "none" : "flex",
              }}
            >
              <div className="sidebar-header">
                <h2>Messages</h2>
                <button
                  className="new-chat-btn"
                  onClick={() => setShowSearchModal(true)}
                >
                  <Plus size={24} />
                </button>
              </div>

              <div className="conversations-list">
                {loading ? (
                  <div className="loading">Loading...</div>
                ) : conversations.length === 0 ? (
                  <div className="no-conversations">No conversations yet</div>
                ) : (
                  conversations.map((conv) => (
                    <div
                      key={conv.userId}
                      className={`conversation-item ${
                        selectedUser?.userId === conv.userId ? "active" : ""
                      }`}
                      onClick={() => handleSelectUser(conv)}
                    >
                      <div className="conversation-avatar">
                        <img
                          src={
                            conv.avatar
                              ? conv.avatar.startsWith("http")
                                ? conv.avatar
                                : `http://localhost:8080${conv.avatar}`
                              : "http://localhost:8080/uploads/avatars/user-avatar.png"
                          }
                          alt={conv.name}
                        />
                        <span
                          className="status-indicator"
                          style={{
                            backgroundColor: getStatusColor(conv.status),
                          }}
                        />
                      </div>
                      <div className="conversation-info">
                        <div className="conversation-name">{conv.name}</div>
                        <div className="last-message">
                          {conv.lastMessage || "Start conversation"}
                        </div>
                      </div>
                      <div className="conversation-meta">
                        <span className="last-time">
                          {formatTime(conv.lastMessageTime)}
                        </span>
                        {conv.unreadCount > 0 && (
                          <span className="unread-badge">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Main Chat */}
            <div className="chat-main">
              {selectedUser ? (
                <>
                  <div className="chat-header">
                    <button
                      className="new-chat-btn"
                      onClick={() => setSelectedUser(null)}
                      style={{
                        marginRight: "8px",
                        display: window.innerWidth < 768 ? "flex" : "none",
                      }}
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <div className="chat-user-info">
                      <img
                        src={
                          selectedUser.avatar
                            ? selectedUser.avatar.startsWith("http")
                              ? selectedUser.avatar
                              : `http://localhost:8080${selectedUser.avatar}`
                            : "http://localhost:8080/uploads/avatars/user-avatar.png"
                        }
                        alt={selectedUser.name}
                        className="chat-avatar"
                      />
                      <div>
                        <h3>{selectedUser.name}</h3>
                        <span
                          className="user-status"
                          style={{
                            color: getStatusColor(selectedUser.status),
                          }}
                        >
                          {selectedUser.status === "ONLINE"
                            ? "ONLINE"
                            : "Offline"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="messages-container">
                    {messages.length === 0 ? (
                      <div className="empty-messages">
                        <p>Start conversation with {selectedUser.name}</p>
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
                                msg.senderAvatar
                                  ? msg.senderAvatar.startsWith(
                                      "http://localhost:8080"
                                    )
                                    ? msg.senderAvatar
                                    : `http://localhost:8080${msg.senderAvatar}`
                                  : "http://localhost:8080/uploads/avatars/user-avatar.png"
                              }
                              alt=""
                              className="message-avatar"
                            />
                          )}

                          <div className="message-bubble">
                            <p>{msg.content}</p>
                            <span className="message-time">
                              {formatTime(msg.sentAt)}
                              {msg.senderId === currentUserId && (
                                <span className="read-status">
                                  {msg.isRead ? "✔✔" : "✔"}
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
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
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
                    <p>Choose a conversation to start.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Search Modal */}
          {showSearchModal && (
            <div
              className="modal-overlay"
              onClick={() => setShowSearchModal(false)}
            >
              <div
                className="search-modal"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-header">
                  <h2>Start a new chat</h2>
                  <button
                    className="close-btn"
                    onClick={() => setShowSearchModal(false)}
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="modal-search-box">
                  <Search size={20} />
                  <input
                    type="text"
                    placeholder="Tìm kiếm theo tên hoặc email..."
                    value={searchKeyword}
                    onChange={(e) => {
                      setSearchKeyword(e.target.value);
                      searchUsers(e.target.value);
                    }}
                    autoFocus
                  />
                </div>

                <div className="search-results">
                  {searching ? (
                    <div className="loading">Searching...</div>
                  ) : searchKeyword && searchResults.length === 0 ? (
                    <div className="no-results">User not found</div>
                  ) : !searchKeyword ? (
                    <div className="no-results">
                      Enter your name or email address to search.
                    </div>
                  ) : (
                    searchResults.map((user) => (
                      <div key={user.id} className="search-result-item">
                        <img
                          src={
                            user.avatarUrl
                              ? user.avatarUrl.startsWith("http")
                                ? user.avatarUrl
                                : `http://localhost:8080${user.avatarUrl}`
                              : "http://localhost:8080/uploads/avatars/user-avatar.png"
                          }
                          alt={user.name}
                          className="result-avatar"
                        />
                        <div className="result-info">
                          <p className="result-name">{user.name}</p>
                          <p className="result-email">{user.email}</p>
                        </div>
                        <button
                          className="start-chat-btn"
                          onClick={() => handleStartChat(user)}
                        >
                          Chat
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
