import React, { useState, useEffect, useRef, useCallback } from "react";
import { getUserId } from "../../utils/auth";
import { apiCall } from "../../service/api";
import { useSocket } from "../../contexts/SocketContext"; // ✅ Dùng socket global
import ConnectionStatus from "../../Components/Message/ConnectionStatus";
import ConversationList from "../../Components/Message/ConversationList";
import ChatArea from "../../Components/Message/ChatArea";

export default function MessagePage() {
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const currentConversationRef = useRef(null);

  // ✅ Lấy socket từ context (global)
  const { socket, isConnected, error } = useSocket();

  // === INIT USER ===
  useEffect(() => {
    const userId = getUserId();
    setCurrentUserId(userId);
    console.log("👤 Current user ID:", userId);
  }, []);

  // === FETCH CONVERSATIONS ===
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const data = await apiCall("/conversations/my-conversations");
        console.log("💬 Loaded conversations:", data.result?.length);
        setConversations(data.result || []);
      } catch (err) {
        console.error("❌ Error loading conversations:", err);
      }
    };
    fetchConversations();
  }, []);

  // === FETCH MESSAGES WHEN SELECT CHAT ===
  useEffect(() => {
    if (!selectedChat || !currentUserId) return;

    currentConversationRef.current = selectedChat.id;
    console.log("📂 Selected conversation:", selectedChat.id);

    const fetchMessages = async () => {
      try {
        const data = await apiCall(`/messages?conversationId=${selectedChat.id}`);
        const msgs = (data.result || []).map((msg) => ({
          id: msg.id,
          message: msg.message,
          senderId: msg.sender?.userId,
          conversationId: msg.conversationId,
          createdDate: msg.createdDate,
          sender: msg.sender,
          messageType: msg.messageType,
          attachments: msg.attachments,
        }));
        console.log(`📥 Loaded ${msgs.length} messages`);
        setMessages(msgs);
      } catch (err) {
        console.error("❌ Error fetching messages:", err);
      }
    };

    fetchMessages();
  }, [selectedChat, currentUserId]);

  // === HANDLE SOCKET MESSAGE RECEIVED ===
  useEffect(() => {
    if (!socket) return;

    const handleMessageReceived = (data) => {
      console.log("📨 Message received:", data);
      const messageSenderId = data.senderId || data.sender?.userId;

      // Update conversation list
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === data.conversationId);
        if (idx === -1) return prev;
        const updated = [...prev];
        const conv = {
          ...updated[idx],
          lastMessage: data.message || "Tệp đính kèm",
          lastMessageTime: data.createdDate || new Date().toISOString(),
        };
        updated.splice(idx, 1);
        updated.unshift(conv);
        return updated;
      });

      // Add message to current chat
      if (data.conversationId === currentConversationRef.current) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.id)) return prev;

          if (data.tempMessageId) {
            const idx = prev.findIndex((m) => m.id === data.tempMessageId);
            if (idx !== -1) {
              const updated = [...prev];
              updated[idx] = {
                id: data.id,
                message: data.message,
                senderId: messageSenderId,
                conversationId: data.conversationId,
                createdDate: data.createdDate,
                sender: data.sender,
                messageType: data.messageType,
                attachments: data.attachments,
              };
              return updated;
            }
          }

          return [
            ...prev,
            {
              id: data.id,
              message: data.message,
              senderId: messageSenderId,
              conversationId: data.conversationId,
              createdDate: data.createdDate || new Date().toISOString(),
              sender: data.sender,
              messageType: data.messageType,
              attachments: data.attachments,
            },
          ];
        });
      }
    };

    socket.on("message_received", handleMessageReceived);

    return () => {
      socket.off("message_received", handleMessageReceived);
    };
  }, [socket]);

  // === HANDLE SELECT USER ===
  const handleSelectUser = useCallback(
    async (user) => {
      console.log("👤 Selected user:", user);
      const existingConv = conversations.find(
        (conv) =>
          conv.conversationName === `${user.firstName} ${user.lastName}` ||
          conv.conversationName === user.username
      );

      if (existingConv) {
        console.log("✅ Found existing conversation:", existingConv.id);
        setSelectedChat(existingConv);
      } else {
        console.log("🆕 Creating new conversation placeholder");
        const tempConv = {
          id: `temp-${user.userId}`,
          conversationName: `${user.firstName} ${user.lastName}`,
          conversationAvatar: user.imageUrl || user.avatar,
          userId: user.userId,
          isTemporary: true,
        };
        setSelectedChat(tempConv);
        setMessages([]);
      }
    },
    [conversations]
  );

  // === HANDLE SEND MESSAGE ===
  const handleSendMessage = useCallback(
    async (text, attachments = []) => {
      if ((!text.trim() && attachments.length === 0) || !selectedChat || !currentUserId) return;
      if (!socket || !isConnected) {
        alert("Không có kết nối socket. Vui lòng thử lại.");
        return;
      }

      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const validAttachments = attachments.filter(
        (att) => att && att.url && att.url.trim() !== ""
      );

      // Hiển thị tin nhắn tạm
      setMessages((prev) => [
        ...prev,
        {
          id: tempId,
          message: text,
          senderId: currentUserId,
          conversationId: selectedChat.id,
          createdDate: new Date().toISOString(),
          isPending: true,
          attachments: validAttachments,
        },
      ]);

      const dataToSend = {
        conversationId: selectedChat.id,
        message: text,
        messageId: tempId,
        attachments: validAttachments,
      };

      if (selectedChat.isTemporary) {
        dataToSend.recipientUserId = selectedChat.userId;
      }

      console.log("🚀 Sending message via socket:", JSON.stringify(dataToSend, null, 2));
      socket.emit("send_message", dataToSend);
    },
    [selectedChat, currentUserId, socket, isConnected]
  );

  return (
    <div className="flex h-screen bg-gray-100">
      <ConnectionStatus error={error} />
      <ConversationList
        conversations={conversations}
        selected={selectedChat}
        onSelect={setSelectedChat}
        onSelectUser={handleSelectUser}
      />
      <ChatArea
        conversation={selectedChat}
        messages={messages}
        onSendMessage={handleSendMessage}
        isConnected={isConnected}
        currentUserId={currentUserId}
      />
    </div>
  );
}
