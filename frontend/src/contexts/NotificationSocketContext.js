import React, { createContext, useContext, useEffect, useRef } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { jwtDecode } from "jwt-decode";
import { getToken } from "../service/LocalStorageService";
import { useNotification } from "../contexts/NotificationContext";

const NotificationSocketContext = createContext(null);

export const NotificationSocketProvider = ({ children }) => {
  const stompClientRef = useRef(null);
  const { addNotification } = useNotification();

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const client = new Client({
      webSocketFactory: () =>
        new SockJS(
          `http://localhost:8082/notification/ws-notification?token=${token}`
        ),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,
      debug: (str) => console.log(str),

      onConnect: () => {
        console.log("✅ Connected to /ws-notification");
        const decoded = jwtDecode(token);
        const userId = decoded.sub;
        console.log("👤 Subscribed userId:", userId);

        client.subscribe(`/user/${userId}/notification`, (message) => {
  try {
    const data = JSON.parse(message.body);
    console.log("🔔 Realtime notification received:", data);

    addNotification({
      id: data.id,
      senderName: data.senderName,
      message: data.content,
      avatar: data.senderImageUrl,
      createdDate: data.timestamp,
      type: data.type || "general", // ⭐ THÊM
      postId: data.postId, // ⭐ THÊM (nếu backend gửi)
      seen: false,
    });
  } catch (e) {
    console.error("❌ Failed to parse message:", e);
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
      client.deactivate();
    };
  }, [addNotification]);

  return (
    <NotificationSocketContext.Provider value={stompClientRef.current}>
      {children}
    </NotificationSocketContext.Provider>
  );
};

export const useNotificationSocket = () =>
  useContext(NotificationSocketContext);
