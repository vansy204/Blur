import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { SOCKET_URL } from "../utils/constants";
import { getToken } from "../utils/auth";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState("");
  
  // Callback refs để tránh stale closure
  const messageCallbacksRef = useRef({
    onMessageSent: null,      // Callback khi tin nhắn đã được gửi thành công
    onMessageReceived: null,   // Callback khi nhận tin nhắn từ người khác
  });

  // Register callbacks từ components
  const registerMessageCallbacks = useCallback((callbacks) => {
    console.log("📝 Registering message callbacks");
    messageCallbacksRef.current = {
      ...messageCallbacksRef.current,
      ...callbacks
    };
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      console.warn("⚠️ Không có token — không kết nối socket.");
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.socket.io/4.5.4/socket.io.min.js";
    script.async = true;

    script.onload = () => {
      if (socketRef.current) {
        console.log("♻️ Socket đã tồn tại — bỏ qua tạo mới.");
        return;
      }

      console.log("🔌 Initializing socket connection to:", SOCKET_URL);

      const socket = window.io(SOCKET_URL, {
        query: { token },
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 10,
        timeout: 20000,
        transports: ["websocket", "polling"],
      });

      socketRef.current = socket;

      // === SỰ KIỆN KẾT NỐI ===
      socket.on("connect", () => {
        console.log("🟢 [Socket] Connected successfully");
        console.log("   - Socket ID:", socket.id);
        console.log("   - Transport:", socket.io.engine.transport.name);
        setIsConnected(true);
        setError("");
      });

      socket.on("disconnect", (reason) => {
        console.log("🔴 [Socket] Disconnected:", reason);
        setIsConnected(false);
        
        if (reason === "io server disconnect") {
          console.warn("⚠️ Server disconnected - may need to re-authenticate");
        }
      });

      socket.on("connect_error", (err) => {
        console.error("❌ [Socket] Connection error:", err.message);
        setError("Không thể kết nối socket");
        setIsConnected(false);
      });

      socket.on("reconnect_attempt", (attemptNumber) => {
        console.log(`🔄 [Socket] Reconnecting... (attempt ${attemptNumber})`);
      });

      socket.on("reconnect", (attemptNumber) => {
        console.log(`✅ [Socket] Reconnected after ${attemptNumber} attempts`);
        setIsConnected(true);
        setError("");
      });

      // === SỰ KIỆN XÁC NHẬN KẾT NỐI ===
      socket.on("connected", (data) => {
        console.log("✅ [Socket] Connected event received:", data);
      });

      // === SỰ KIỆN 1: MESSAGE_SENT (Xác nhận tin nhắn đã gửi) ===
      socket.on("message_sent", (data) => {
        console.log("✅ [Socket] Message sent confirmed:");
        console.log("   - Real ID:", data.id);
        console.log("   - Temp ID:", data.tempMessageId);
        console.log("   - Conversation:", data.conversationId);
        console.log("   - Message:", data.message?.substring(0, 50));

        // Gọi callback để cập nhật UI (thay tempId bằng real ID)
        if (messageCallbacksRef.current.onMessageSent) {
          messageCallbacksRef.current.onMessageSent(data);
        } else {
          console.warn("⚠️ No onMessageSent callback registered");
        }
      });

      // === SỰ KIỆN 2: MESSAGE_RECEIVED (Nhận tin nhắn mới) ===
      socket.on("message_received", (data) => {
        console.log("📨 [Socket] Message received:");
        console.log("   - Message ID:", data.id);
        console.log("   - From:", data.sender?.username || data.senderId);
        console.log("   - Conversation:", data.conversationId);
        console.log("   - Message:", data.message?.substring(0, 50));
        console.log("   - Attachments:", data.attachments?.length || 0);

        // Gọi callback để thêm tin nhắn vào UI
        if (messageCallbacksRef.current.onMessageReceived) {
          messageCallbacksRef.current.onMessageReceived(data);
        } else {
          console.warn("⚠️ No onMessageReceived callback registered");
        }
      });

      // === SỰ KIỆN PHỤ: TYPING ===
      socket.on("user_typing", (data) => {
        console.log("⌨️ [Socket] User typing:", {
          user: data.userId,
          conversation: data.conversationId,
          isTyping: data.isTyping,
        });
        // TODO: Implement typing indicator UI
      });

      // === SỰ KIỆN LỖI ===
      socket.on("message_error", (error) => {
        console.error("❌ [Socket] Message error:");
        console.error("   - Code:", error.code);
        console.error("   - Message:", error.message);
        setError(error.message || "Lỗi khi gửi tin nhắn");
      });

      socket.on("auth_error", (error) => {
        console.error("❌ [Socket] Auth error:");
        console.error("   - Code:", error.code);
        console.error("   - Message:", error.message);
        setError("Lỗi xác thực. Vui lòng đăng nhập lại.");
      });
    };

    script.onerror = () => {
      console.error("❌ Failed to load Socket.IO library");
      setError("Không thể tải thư viện Socket.IO");
    };
    
    document.head.appendChild(script);

    // Cleanup function
    return () => {
      if (socketRef.current) {
        console.log("🔌 [Socket] Cleaning up connection");
        
        // Remove all listeners
        socketRef.current.off("connect");
        socketRef.current.off("disconnect");
        socketRef.current.off("connect_error");
        socketRef.current.off("reconnect_attempt");
        socketRef.current.off("reconnect");
        socketRef.current.off("connected");
        socketRef.current.off("message_sent");
        socketRef.current.off("message_received");
        socketRef.current.off("user_typing");
        socketRef.current.off("message_error");
        socketRef.current.off("auth_error");
        
        // Disconnect and cleanup
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []); // Empty deps - chỉ chạy 1 lần khi mount

  // === Helper function để gửi tin nhắn ===
  const sendMessage = useCallback((messageData) => {
    if (!socketRef.current || !isConnected) {
      console.error("❌ Cannot send message: Socket not connected");
      return false;
    }

    console.log("📤 [Socket] Emitting send_message:", {
      conversationId: messageData.conversationId,
      tempId: messageData.messageId,
      messageLength: messageData.message?.length || 0,
      attachmentsCount: messageData.attachments?.length || 0,
    });

    try {
      socketRef.current.emit("send_message", messageData);
      return true;
    } catch (error) {
      console.error("❌ Error emitting message:", error);
      return false;
    }
  }, [isConnected]);

  // === Helper function để gửi typing indicator ===
  const sendTypingIndicator = useCallback((conversationId, isTyping) => {
    if (!socketRef.current || !isConnected) {
      console.warn("⚠️ Cannot send typing indicator: Socket not connected");
      return;
    }
    
    console.log(`⌨️ [Socket] Sending typing indicator: ${isTyping ? "typing..." : "stopped"}`);
    
    try {
      socketRef.current.emit("typing", {
        conversationId,
        isTyping,
      });
    } catch (error) {
      console.error("❌ Error sending typing indicator:", error);
    }
  }, [isConnected]);

  const contextValue = {
    socket: socketRef.current,
    isConnected,
    error,
    sendMessage,
    sendTypingIndicator,
    registerMessageCallbacks,
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};

// Hook để sử dụng socket context
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within SocketProvider");
  }
  return context;
};