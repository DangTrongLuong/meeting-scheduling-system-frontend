import React, { createContext, useEffect, useState } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useAuth } from "./AuthContext"; // giả sử bạn có AuthContext để lấy token
 
export const WebSocketContext = createContext();
 
export const WebSocketProvider = ({ children }) => {
  const { token, isAuthenticated } = useAuth(); // lấy JWT token từ AuthContext
  const [client, setClient] = useState(null);
 
  useEffect(() => {
    if (isAuthenticated && token) {
      const stompClient = new Client({
        webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
        connectHeaders: {
          Authorization: `Bearer ${token}`,
        },
        onConnect: () => {
          console.log("Connected to WebSocket");
        },
        onDisconnect: () => {
          console.log("Disconnected");
        },
      });
 
      stompClient.activate();
      setClient(stompClient);
 
      return () => {
        stompClient.deactivate();
      };
    }
  }, [isAuthenticated, token]);
 
  return (
    <WebSocketContext.Provider value={{ client }}>
      {children}
    </WebSocketContext.Provider>
  );
};