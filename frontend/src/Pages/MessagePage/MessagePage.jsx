import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getUserId } from "../../utils/auth";
import { apiCall } from "../../service/api";
import { useSocket } from "../../contexts/SocketContext";
import { useNotification, requestNotificationPermission } from "../../contexts/NotificationContext";
import { useUnreadMessages } from "../../hooks/useUnreadMessages";
import ConnectionStatus from "../../Components/Message/ConnectionStatus";
import ConversationList from "../../Components/Message/ConversationList";
import ChatArea from "../../Components/Message/ChatArea";

export default function MessagePage() {
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const currentConversationRef = useRef(null);

  const navigate = useNavigate();
  const { sendMessage, isConnected, error, registerMessageCallbacks } = useSocket();
  const { addNotification } = useNotification();

  // === REQUEST NOTIFICATION PERMISSION KHI MOUNT ===
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // === INIT USER ID ===
  useEffect(() => {
    const userId = getUserId();
    setCurrentUserId(userId);
    console.log("👤 Current user ID:", userId);
  }, []);

  // === FETCH CONVERSATIONS ===
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        console.log("📋 Fetching conversations...");
        const data = await apiCall("/conversations/my-conversations");
        const convs = data.result || [];
        setConversations(convs);
        console.log(`✅ Loaded ${convs.length} conversations`);
      } catch (err) {
        console.error("❌ Error fetching conversations:", err);
      }
    };
    fetchConversations();
  }, []);

  // === FETCH MESSAGES KHI CHỌN CONVERSATION ===
  useEffect(() => {
    if (!selectedChat || !currentUserId) return;

    currentConversationRef.current = selectedChat.id;
    
    const fetchMessages = async () => {
      try {
        console.log(`📥 Fetching messages for conversation: ${selectedChat.id}`);
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
          isPending: false,
        }));
        console.log(`✅ Loaded ${msgs.length} messages`);
        setMessages(msgs);
      } catch (err) {
        console.error("❌ Error fetching messages:", err);
      }
    };

    fetchMessages();
  }, [selectedChat, currentUserId]);

  // === CALLBACK 1: XỬ LÝ KHI TIN NHẮN ĐÃ GỬI THÀNH CÔNG ===
  const handleMessageSent = useCallback((data) => {
    console.log("✅ [Callback] Message sent:", {
      realId: data.id,
      tempId: data.tempMessageId,
      conversationId: data.conversationId,
    });
    
    // Cập nhật conversation list - đưa lên đầu
    setConversations((prev) => {
      const idx = prev.findIndex((c) => c.id === data.conversationId);
      if (idx === -1) return prev;
      
      const updated = [...prev];
      const conv = {
        ...updated[idx],
        lastMessage: data.message || "Tệp đính kèm",
        lastMessageTime: data.createdDate || new Date().toISOString(),
      };
      
      // Di chuyển conversation lên đầu
      updated.splice(idx, 1);
      updated.unshift(conv);
      return updated;
    });

    // Thay thế tempId bằng real ID trong messages (CHỈ KHI ĐÚNG CONVERSATION)
    if (data.conversationId === currentConversationRef.current) {
      setMessages((prev) => {
        const tempIdx = prev.findIndex((m) => m.id === data.tempMessageId);
        
        if (tempIdx === -1) {
          console.warn("⚠️ Temp message not found:", data.tempMessageId);
          return prev;
        }

        const updated = [...prev];
        updated[tempIdx] = {
          id: data.id,
          message: data.message,
          senderId: data.senderId || data.sender?.userId,
          conversationId: data.conversationId,
          createdDate: data.createdDate,
          sender: data.sender,
          messageType: data.messageType,
          attachments: data.attachments,
          isPending: false,
        };
        
        console.log(`✅ Updated temp message ${data.tempMessageId} → ${data.id}`);
        return updated;
      });
    }
  }, []);

  // === CALLBACK 2: XỬ LÝ KHI NHẬN TIN NHẮN MỚI ===
  const handleMessageReceived = useCallback((data) => {
    console.log("📨 [Callback] Message received:", {
      messageId: data.id,
      from: data.sender?.username || data.senderId,
      conversationId: data.conversationId,
    });
    
    const messageSenderId = data.senderId || data.sender?.userId;
    const isCurrentConversation = data.conversationId === currentConversationRef.current;

    // Cập nhật conversation list - đưa lên đầu
    setConversations((prev) => {
      const idx = prev.findIndex((c) => c.id === data.conversationId);
      if (idx === -1) {
        console.warn("⚠️ Conversation not found:", data.conversationId);
        return prev;
      }
      
      const updated = [...prev];
      const conv = {
        ...updated[idx],
        lastMessage: data.message || "Tệp đính kèm",
        lastMessageTime: data.createdDate || new Date().toISOString(),
      };
      
      // Di chuyển conversation lên đầu
      updated.splice(idx, 1);
      updated.unshift(conv);
      return updated;
    });

    // === HIỂN THỊ NOTIFICATION ===
    // Chỉ hiển thị nếu KHÔNG PHẢI conversation đang mở
    // hoặc user đang ở page khác (không focus vào MessagePage)
    if (!isCurrentConversation || document.hidden) {
      const senderName = `${data.sender?.firstName || ''} ${data.sender?.lastName || ''}`.trim() 
        || data.sender?.username 
        || 'Người dùng';

      addNotification({
        id: data.id,
        conversationId: data.conversationId,
        senderName,
        senderUsername: data.sender?.username,
        avatar: data.sender?.avatar,
        message: data.message,
        attachments: data.attachments,
        createdDate: data.createdDate,
        onClick: (notification) => {
          // Navigate đến MessagePage và chọn conversation
          console.log("📍 Navigating to conversation:", notification.conversationId);
          
          // Tìm conversation
          setConversations(prev => {
            const conv = prev.find(c => c.id === notification.conversationId);
            if (conv) {
              setSelectedChat(conv);
            }
            return prev;
          });
          
          // Navigate nếu đang ở page khác
          if (window.location.pathname !== '/messages') {
            navigate('/messages');
          }
        },
      });

      console.log("🔔 Notification added for message:", data.id);
    }

    // Thêm tin nhắn vào chat hiện tại (CHỈ NẾU ĐÚNG CONVERSATION)
    if (isCurrentConversation) {
      setMessages((prev) => {
        // Kiểm tra trùng lặp
        if (prev.some((m) => m.id === data.id)) {
          console.log("⚠️ Duplicate message ignored:", data.id);
          return prev;
        }

        const newMessage = {
          id: data.id,
          message: data.message,
          senderId: messageSenderId,
          conversationId: data.conversationId,
          createdDate: data.createdDate || new Date().toISOString(),
          sender: data.sender,
          messageType: data.messageType,
          attachments: data.attachments,
          isPending: false,
        };

        console.log("✅ Added new message to chat:", data.id);
        return [...prev, newMessage];
      });
    }
  }, [addNotification, navigate]);

  // === ĐĂNG KÝ CALLBACKS VỚI SOCKET CONTEXT ===
  useEffect(() => {
    console.log("🔗 Registering socket callbacks...");
    registerMessageCallbacks({
      onMessageSent: handleMessageSent,
      onMessageReceived: handleMessageReceived,
    });
  }, [registerMessageCallbacks, handleMessageSent, handleMessageReceived]);

  // === HANDLE SELECT USER (TẠO CONVERSATION MỚI) ===
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
      if ((!text.trim() && attachments.length === 0) || !selectedChat || !currentUserId) {
        console.warn("⚠️ Cannot send message: invalid input");
        return;
      }

      if (!isConnected) {
        alert("❌ Không có kết nối socket. Vui lòng thử lại.");
        return;
      }

      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const validAttachments = attachments.filter(
        (att) => att && att.url && att.url.trim() !== ""
      );

      console.log("📤 Preparing to send message:", {
        tempId,
        text: text.substring(0, 50) + (text.length > 50 ? "..." : ""),
        attachmentsCount: validAttachments.length,
      });

      const tempMessage = {
        id: tempId,
        message: text,
        senderId: currentUserId,
        conversationId: selectedChat.id,
        createdDate: new Date().toISOString(),
        isPending: true,
        attachments: validAttachments,
        sender: null,
      };

      setMessages((prev) => [...prev, tempMessage]);
      console.log("✅ Added temp message to UI:", tempId);

      const payload = {
        conversationId: selectedChat.id,
        message: text,
        messageId: tempId,
        attachments: validAttachments,
      };

      if (selectedChat.isTemporary) {
        payload.recipientUserId = selectedChat.userId;
        console.log("🆕 Sending to new conversation with user:", selectedChat.userId);
      }

      console.log("🚀 Emitting send_message event");
      
      const success = sendMessage(payload);
      
      if (!success) {
        console.error("❌ Failed to send message via socket");
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId ? { ...m, isPending: false, isFailed: true } : m
          )
        );
      }
    },
    [selectedChat, currentUserId, isConnected, sendMessage]
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