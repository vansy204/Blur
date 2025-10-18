import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from 'react-hot-toast';
import { getUserId } from "../../utils/auth";
import { apiCall } from "../../service/api";
import { useSocket } from "../../contexts/SocketContext";
import { useNotification, requestNotificationPermission } from "../../contexts/NotificationContext";
import { useUnreadMessages } from "../../hooks/useUnreadMessages";
import { markConversationAsRead } from "../../service/chatApi";
import ConnectionStatus from "../../Components/Message/ConnectionStatus";
import ConversationList from "../../Components/Message/ConversationList";
import ChatArea from "../../Components/Message/ChatArea";

export default function MessagePage() {
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const currentConversationRef = useRef(null);
  const messagesFetchedRef = useRef(new Set());

  const navigate = useNavigate();
  const { sendMessage, isConnected, error, registerMessageCallbacks } = useSocket();
  const { addNotification } = useNotification();

  // === MAKE TOAST AVAILABLE GLOBALLY ===
  useEffect(() => {
    window.toast = toast;
    return () => {
      delete window.toast;
    };
  }, []);

  // === REQUEST NOTIFICATION PERMISSION ===
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
  const fetchConversations = useCallback(async () => {
    try {
      console.log("📋 Fetching conversations...");
      const data = await apiCall("/conversations/my-conversations");
      const convs = data.result || [];
      
      // Sort conversations: mới nhất lên đầu
      const sortedConvs = convs.sort((a, b) => {
        const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
        const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
        return timeB - timeA;
      });
      
      setConversations(sortedConvs);
      console.log(`✅ Loaded ${sortedConvs.length} conversations`);
    } catch (err) {
      console.error("❌ Error fetching conversations:", err);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // === FETCH MESSAGES ===
  const fetchMessages = useCallback(async (conversationId) => {
    try {
      console.log(`📥 Fetching messages for conversation: ${conversationId}`);
      const data = await apiCall(`/messages?conversationId=${conversationId}`);
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
        isRead: msg.isRead,
      }));
      
      // Sort messages: CŨ NHẤT LÊN ĐẦU, MỚI NHẤT Ở DƯỚI
      const sortedMsgs = msgs.sort((a, b) => {
        const timeA = new Date(a.createdDate).getTime();
        const timeB = new Date(b.createdDate).getTime();
        return timeA - timeB;
      });
      
      console.log(`✅ Loaded ${sortedMsgs.length} messages`);
      setMessages(sortedMsgs);
      messagesFetchedRef.current.add(conversationId);
    } catch (err) {
      console.error("❌ Error fetching messages:", err);
    }
  }, []);

  // === HANDLE SELECT CONVERSATION ===
  const handleSelectConversation = useCallback(async (conv) => {
    if (!currentUserId || !conv) return;
    
    console.log("📍 Selected conversation:", conv.id);
    
    setSelectedChat(conv);
    currentConversationRef.current = conv.id;
    setMessages([]);
    
    await fetchMessages(conv.id);
    
    // Mark as read (non-blocking)
    try {
      markConversationAsRead(conv.id).catch(err => 
        console.error('Failed to mark as read:', err)
      );
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  }, [currentUserId, fetchMessages]);

  // === HANDLE CONVERSATION DELETED ===
  const handleConversationDeleted = useCallback((deletedConversationId) => {
    console.log('🗑️ Handling conversation deletion:', deletedConversationId);
    
    // Remove from list
    setConversations((prev) => 
      prev.filter((conv) => conv.id !== deletedConversationId)
    );
    
    // Clear if currently selected
    if (selectedChat?.id === deletedConversationId) {
      setSelectedChat(null);
      setMessages([]);
      currentConversationRef.current = null;
    }
    
    console.log('✅ Conversation removed from UI');
  }, [selectedChat]);

  // === CALLBACK: MESSAGE SENT ===
  const handleMessageSent = useCallback((data) => {
    console.log("✅ [Callback] Message sent:", {
      realId: data.id,
      tempId: data.tempMessageId,
      conversationId: data.conversationId,
    });
    
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

    // Update messages if current conversation
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
          isRead: data.isRead,
        };
        
        console.log(`✅ Updated temp message ${data.tempMessageId} → ${data.id}`);
        return updated;
      });
    }
  }, []);

  // === CALLBACK: MESSAGE RECEIVED ===
  const handleMessageReceived = useCallback((data) => {
    console.log("📨 [Callback] Message received:", {
      messageId: data.id,
      from: data.sender?.username || data.senderId,
      conversationId: data.conversationId,
    });
    
    const messageSenderId = data.senderId || data.sender?.userId;
    const isCurrentConversation = data.conversationId === currentConversationRef.current;

    // Update conversation list
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
      
      updated.splice(idx, 1);
      updated.unshift(conv);
      return updated;
    });

    // Show notification if needed
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
          console.log("📍 Navigating to conversation:", notification.conversationId);
          
          setConversations(prev => {
            const conv = prev.find(c => c.id === notification.conversationId);
            if (conv) {
              handleSelectConversation(conv);
            }
            return prev;
          });
          
          if (window.location.pathname !== '/messages') {
            navigate('/messages');
          }
        },
      });

      console.log("🔔 Notification added for message:", data.id);
    }

    // Add message to current conversation
    if (isCurrentConversation) {
      setMessages((prev) => {
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
          isRead: data.isRead,
        };

        console.log("✅ Added new message to chat:", data.id);
        return [...prev, newMessage];
      });
      
      // Auto mark as read
      try {
        markConversationAsRead(data.conversationId).catch(err => 
          console.error('Failed to auto-mark as read:', err)
        );
      } catch (err) {
        console.error('Error auto-marking as read:', err);
      }
    }
  }, [addNotification, navigate, handleSelectConversation]);

  // === REGISTER CALLBACKS ===
  useEffect(() => {
    console.log("🔗 Registering socket callbacks...");
    registerMessageCallbacks({
      onMessageSent: handleMessageSent,
      onMessageReceived: handleMessageReceived,
    });
  }, [registerMessageCallbacks, handleMessageSent, handleMessageReceived]);

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
        handleSelectConversation(existingConv);
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
        currentConversationRef.current = tempConv.id;
        setMessages([]);
      }
    },
    [conversations, handleSelectConversation]
  );

  // === HANDLE SEND MESSAGE ===
  const handleSendMessage = useCallback(
    async (text, attachments = []) => {
      if ((!text.trim() && attachments.length === 0) || !selectedChat || !currentUserId) {
        console.warn("⚠️ Cannot send message: invalid input");
        return;
      }

      if (!isConnected) {
        toast.error("Không có kết nối. Vui lòng thử lại.", {
          duration: 2000,
          style: { borderRadius: '12px', fontSize: '14px' }
        });
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

  // === HANDLE BACK (Mobile) ===
  const handleBack = useCallback(() => {
    setSelectedChat(null);
    currentConversationRef.current = null;
  }, []);

  // Memoize conversations
  const sortedConversations = useMemo(() => conversations, [conversations]);

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-blue-50 overflow-hidden">
      <Toaster position="top-center" />
      <ConnectionStatus error={error} />
      
      {/* Conversation List - Hidden on mobile when chat selected */}
      <div className={`${selectedChat ? 'hidden md:flex' : 'flex'} w-full md:w-80`}>
        <ConversationList
          conversations={sortedConversations}
          selected={selectedChat}
          onSelect={handleSelectConversation}
          onSelectUser={handleSelectUser}
          onConversationDeleted={handleConversationDeleted}
        />
      </div>
      
      {/* Chat Area - Hidden on mobile when no chat selected */}
      <div className={`${!selectedChat ? 'hidden md:flex' : 'flex'} flex-1`}>
        <ChatArea
          conversation={selectedChat}
          messages={messages}
          onSendMessage={handleSendMessage}
          isConnected={isConnected}
          currentUserId={currentUserId}
          onBack={handleBack}
        />
      </div>
    </div>
  );
}