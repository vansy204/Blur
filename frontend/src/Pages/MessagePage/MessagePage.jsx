import React, { useState, useEffect, useRef, useCallback } from "react";
import { getUserId } from '../../utils/auth';
import { apiCall } from '../../service/api';
import { useSocket } from '../../hooks/useSocket';
import ConnectionStatus from '../../Components/Message/ConnectionStatus';
import ConversationList from '../../Components/Message/ConversationList';
import ChatArea from '../../Components/Message/ChatArea';

export default function MessagePage() {
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  
  const currentConversationRef = useRef(null);

  // Handle message received from socket
  const handleMessageReceived = useCallback((data) => {
    console.log("📨 Message received:", data);
    const messageSenderId = data.senderId || data.sender?.userId;
    
    setConversations(prev => {
      const idx = prev.findIndex(c => c.id === data.conversationId);
      if (idx === -1) return prev;
      
      const updated = [...prev];
      const conv = {
        ...updated[idx],
        lastMessage: data.message || 'Tệp đính kèm',
        lastMessageTime: data.createdDate || new Date().toISOString()
      };
      updated.splice(idx, 1);
      updated.unshift(conv);
      return updated;
    });

    if (data.conversationId === currentConversationRef.current) {
      setMessages(prev => {
        if (prev.some(m => m.id === data.id)) {
          console.log("⚠️ Duplicate message ignored:", data.id);
          return prev;
        }
        
        if (data.tempMessageId) {
          const idx = prev.findIndex(m => m.id === data.tempMessageId);
          if (idx !== -1) {
            console.log("🔄 Replacing temp message:", data.tempMessageId, "with:", data.id);
            const updated = [...prev];
            updated[idx] = {
              id: data.id,
              message: data.message,
              senderId: messageSenderId,
              conversationId: data.conversationId,
              createdDate: data.createdDate,
              sender: data.sender,
              messageType: data.messageType,
              attachments: data.attachments
            };
            return updated;
          }
        }

        console.log("➕ Adding new message:", data.id);
        return [...prev, {
          id: data.id,
          message: data.message,
          senderId: messageSenderId,
          conversationId: data.conversationId,
          createdDate: data.createdDate || new Date().toISOString(),
          sender: data.sender,
          messageType: data.messageType,
          attachments: data.attachments
        }];
      });
    }
  }, []);

  const { socketRef, isConnected, error } = useSocket(handleMessageReceived);

  useEffect(() => {
    const userId = getUserId();
    setCurrentUserId(userId);
    console.log("👤 Current user ID:", userId);
  }, []);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const data = await apiCall('/conversations/my-conversations');
        console.log("💬 Loaded conversations:", data.result?.length);
        setConversations(data.result || []);
      } catch (err) {
        console.error("❌ Error loading conversations:", err);
      }
    };
    fetchConversations();
  }, []);

  useEffect(() => {
    if (!selectedChat || !currentUserId) return;
    
    currentConversationRef.current = selectedChat.id;
    console.log("📂 Selected conversation:", selectedChat.id);

    const fetchMessages = async () => {
      try {
        const data = await apiCall(`/messages?conversationId=${selectedChat.id}`);
        
        const msgs = (data.result || []).map(msg => {
          const senderId = msg.sender?.userId;
      
          return {
            id: msg.id,
            message: msg.message,
            senderId: senderId,
            conversationId: msg.conversationId,
            createdDate: msg.createdDate,
            sender: msg.sender,
            messageType: msg.messageType,
            attachments: msg.attachments
          };
        });
        
        console.log(`📥 Loaded ${msgs.length} messages`);
        setMessages(msgs);
      } catch (err) {
        console.error("❌ Error fetching messages:", err);
      }
    };

    fetchMessages();
  }, [selectedChat, currentUserId]);

  const handleSelectUser = useCallback(async (user) => {
    console.log("👤 Selected user:", user);
    
    // Tìm xem đã có conversation với user này chưa
    const existingConv = conversations.find(conv => 
      conv.conversationName === `${user.firstName} ${user.lastName}` ||
      conv.conversationName === user.username
    );
    
    if (existingConv) {
      console.log("✅ Found existing conversation:", existingConv.id);
      setSelectedChat(existingConv);
    } else {
      console.log("🆕 Creating new conversation placeholder");
      // Tạo một conversation tạm thời để bắt đầu chat
      // Backend sẽ tự động tạo conversation khi gửi tin nhắn đầu tiên
      const tempConv = {
        id: `temp-${user.userId}`,
        conversationName: `${user.firstName} ${user.lastName}`,
        conversationAvatar: user.imageUrl || user.avatar,
        userId: user.userId,
        isTemporary: true
      };
      setSelectedChat(tempConv);
      setMessages([]);
    }
  }, [conversations]);

  const handleSendMessage = useCallback(async (text, attachments = []) => {
    if ((!text.trim() && attachments.length === 0) || !selectedChat || !currentUserId) {
      return;
    }

    if (!socketRef.current?.connected) {
      alert("Không có kết nối. Vui lòng thử lại.");
      return;
    }

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    console.log("=== 📤 SENDING MESSAGE ===");
    console.log("Text:", text);
    console.log("Attachments count:", attachments.length);
    console.log("Attachments data:", JSON.stringify(attachments, null, 2));
    
    const validAttachments = attachments.filter(att => {
      const isValid = att && att.url && att.url.trim() !== '';
      if (!isValid) {
        console.error("❌ Invalid attachment found:", att);
      }
      return isValid;
    });
    
    console.log("✅ Valid attachments count:", validAttachments.length);
    
    // Add to UI optimistically
    setMessages(prev => [...prev, {
      id: tempId,
      message: text,
      senderId: currentUserId,
      conversationId: selectedChat.id,
      createdDate: new Date().toISOString(),
      isPending: true,
      attachments: validAttachments
    }]);

    const dataToSend = {
      conversationId: selectedChat.id,
      message: text,
      messageId: tempId,
      attachments: validAttachments
    };
    
    // Nếu là conversation tạm thời, gửi thêm thông tin userId
    if (selectedChat.isTemporary) {
      dataToSend.recipientUserId = selectedChat.userId;
    }
    
    console.log("🚀 Data to send via socket:", JSON.stringify(dataToSend, null, 2));

    socketRef.current.emit("send_message", dataToSend);
  }, [selectedChat, currentUserId, socketRef]);

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
