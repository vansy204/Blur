import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { getToken } from "../../service/LocalStorageService";
import { getMyConversations } from "../../api/messageAPi";
import { searchUsersByUserName } from "../../api/userApi";

import ConnectionStatus from "./../../Components/Message/ConnectionStatus";
import ConversationList from "./../../Components/Message/ConversationList";
import MessageList from "./../../Components/Message/MessageList";
import MessageInput from "./../../Components/Message/MessageInput";

export default function MessagePage() {
  const [message, setMessage] = useState("");
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState("");
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const maxReconnectAttempts = 5;

  const socketRef = useRef(null);
const token = getToken();
  /** Kết nối socket.io */
  useEffect(() => {
    
    if (!token) return;

    const socket = io(`http://localhost:8099?token=${token}`, {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: maxReconnectAttempts,
      timeout: 20000,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      setConnectionError("");
      setReconnectAttempts(0);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("connect_error", () => {
      setIsConnected(false);
      setConnectionError("Failed to connect to real-time messaging");
    });

    socket.on("reconnect_attempt", (attempt) => {
      setReconnectAttempts(attempt);
    });

    socket.on("message", (data) => {
      const msg = typeof data === "string" ? JSON.parse(data) : data;
      setMessages((prev) => [...prev, msg]);
    });

    return () => socket.disconnect();
  }, []);

  /** Lấy danh sách hội thoại */
  
  useEffect(() => {
    (async () => {
      try {
        const res = await getMyConversations(token);
        setConversations(res?.data?.result || []);
      } catch (err) {
        setConnectionError("Failed to load conversations");
      }
    })();
  }, []);

  /** Lấy tin nhắn của cuộc trò chuyện */
  useEffect(() => {
    if (!selectedChat) return;
    (async () => {
      try {
        const res = await axios.get(`http://localhost:8888/api/chat/messages`, {
          params: { conversationId: selectedChat.id },
          headers: { Authorization: `Bearer ${token}` },
        });
        const list = (res.data?.result || []).map((m) => ({
          id: m.id,
          sender: m.me ? "me" : "other",
          text: m.message,
        }));
        setMessages(list);
      } catch {
        setConnectionError("Failed to load messages");
      }
    })();
  }, [selectedChat]);

  /** Gửi tin nhắn */
  const sendMessage = async () => {
    if (!message.trim() || !selectedChat) return;
    const newMsg = {
      sender: "me",
      text: message,
      conversationId: selectedChat.id,
    };
    setMessages((prev) => [...prev, newMsg]);
    setMessage("");

    try {
      await axios.post(
        `http://localhost:8888/api/chat/messages/create`,
        { conversationId: selectedChat.id, message },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      socketRef.current?.emit("send_message", {
        conversationId: selectedChat.id,
        message,
      });
    } catch {
      setConnectionError("Failed to send message");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-screen">
      <ConnectionStatus
        connectionError={connectionError}
        reconnectAttempts={reconnectAttempts}
        maxReconnectAttempts={maxReconnectAttempts}
      />
      <ConversationList
        conversations={conversations.map((c) => ({
          ...c,
          name: c.conversationName,
          avatar: c.conversationAvatar,
        }))}
        selectedChat={selectedChat}
        setSelectedChat={setSelectedChat}
      />
      <div className="flex flex-col flex-1">
        <MessageList messages={messages} />
        <MessageInput
          message={message}
          setMessage={setMessage}
          sendMessage={sendMessage}
          handleKeyPress={handleKeyPress}
        />
      </div>
    </div>
  );
}