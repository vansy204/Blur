import React, { createContext, useContext, useEffect, useRef } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { getToken } from "../service/LocalStorageService";
import { jwtDecode } from "jwt-decode";
import { useNotification } from "./NotificationContext";

const NotificationSocketContext = createContext(null);

export const NotificationSocketProvider = ({ children }) => {
  const stompClientRef = useRef(null);
  const { addNotification } = useNotification();

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const decoded = jwtDecode(token);
    const userId = decoded.sub;

    const client = new Client({
      webSocketFactory: () => new SockJS(`http://localhost:8082/notification/ws-notification?token=${token}`),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000, // tự động reconnect sau 5s nếu mất kết nối
      debug: (str) => console.log(str),
      onConnect: () => {
        console.log("✅ Connected to /ws-notification");

        client.subscribe("/topic/notification", (message) => {
          try {
            const data = JSON.parse(message.body);
            console.log("🔔 New notification:", data);

            if (data.receiverId && data.receiverId !== userId) return;

            addNotification({
              senderName: data.senderName || "Người dùng",
              message: data.content || "Bạn có thông báo mới",
              avatar: data.avatarUrl,
              createdDate: data.createdAt,
            });
          } catch (err) {
            console.error("❌ Error parsing notification:", err);
          }
        });
      },
      onStompError: (frame) => {
        console.error("❌ STOMP Error:", frame.headers["message"]);
      },
    });

    client.activate();
    stompClientRef.current = client;

    return () => {
      if (stompClientRef.current) stompClientRef.current.deactivate();
    };
  }, []);

  return (
    <NotificationSocketContext.Provider value={stompClientRef.current}>
      {children}
    </NotificationSocketContext.Provider>
  );
};

export const useNotificationSocket = () => useContext(NotificationSocketContext);