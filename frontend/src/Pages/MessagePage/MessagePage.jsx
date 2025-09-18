// MessagePage.js (Main Component)
import React, { useState, useEffect, useCallback } from "react";
import { useToast } from "@chakra-ui/react";
import { getMyConversations } from "../../api/messageAPi";
import { searchUsersByUserName } from "../../api/userApi";
import axios from "axios";
import { getToken } from "../../service/LocalStorageService";
import { useSocket } from "../../hooks/useSocket";
import Sidebar from "../../Components/Message/Sidebar";
import ChatArea from "../../Components/Message/ChatArea"

export default function MessagePage() {
  const [message, setMessage] = useState("");
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messagesMap, setMessagesMap] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const toast = useToast();

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      // On desktop, always show sidebar
      if (window.innerWidth >= 768) {
        setShowSidebar(true);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle mobile conversation selection
  const handleConversationSelect = (conversation) => {
    setSelectedConversation(conversation);
    if (isMobile) {
      setShowSidebar(false); // Hide sidebar on mobile when conversation is selected
    }
  };

  // Handle back to conversations list on mobile
  const handleBackToConversations = () => {
    if (isMobile) {
      setShowSidebar(true);
      setSelectedConversation(null);
    }
  };

  const normalizeDate = (dateStr) => dateStr || new Date().toISOString();

  // Get current user
  const getCurrentUser = useCallback(async () => {
    try {
      const response = await axios.get("http://localhost:8888/api/user/profile", {
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
      });
      if (response.data?.result?.userId) {
        setCurrentUserId(response.data.result.userId);
        console.log("Current user ID:", response.data.result.userId);
      }
    } catch (error) {
      console.error("Failed to get current user:", error);
    }
  }, []);

  // Handle incoming messages
  const handleIncomingMessage = useCallback(
    (messageData) => {
      if (!messageData.conversationId || !messageData.message) return;

      const normalizedMessage = {
        ...messageData,
        createdDate: normalizeDate(messageData.createdDate || new Date().toISOString()),
        me: currentUserId ? messageData.senderId === currentUserId : false,
      };

      console.log("Processing message:", normalizedMessage);

      setMessagesMap((prev) => {
        const conversationId = normalizedMessage.conversationId;
        const existingMessages = prev[conversationId] || [];

        // Check for duplicates
        const isDuplicate = existingMessages.some((msg) => {
          if (normalizedMessage.id && msg.id) return msg.id === normalizedMessage.id;
          if (normalizedMessage.clientId && msg.clientId) return msg.clientId === normalizedMessage.clientId;
          return false;
        });

        if (isDuplicate) return prev;

        // Handle optimistic update replacement
        let updatedMessages = existingMessages;
        if (normalizedMessage.clientId) {
          const optimisticIndex = updatedMessages.findIndex(
            (m) => m.clientId === normalizedMessage.clientId && m.pending
          );
          if (optimisticIndex !== -1) {
            updatedMessages = [
              ...updatedMessages.slice(0, optimisticIndex),
              normalizedMessage,
              ...updatedMessages.slice(optimisticIndex + 1)
            ];
          } else {
            updatedMessages = [...updatedMessages, normalizedMessage];
          }
        } else {
          updatedMessages = [...updatedMessages, normalizedMessage];
        }

        updatedMessages.sort((a, b) => new Date(a.createdDate) - new Date(b.createdDate));

        return { ...prev, [conversationId]: updatedMessages };
      });

      // Update conversation list
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === normalizedMessage.conversationId
            ? { ...conv, lastMessage: normalizedMessage.message, modifiedDate: normalizedMessage.createdDate }
            : conv
        )
      );
    },
    [currentUserId]
  );

  // Initialize socket
  const { isConnected, emit } = useSocket(currentUserId, handleIncomingMessage);

  // Send message
  const handleSendMessage = async () => {
    if (!message.trim() || !selectedConversation || !isConnected) return;

    const clientId = `temp-${Date.now()}-${Math.random()}`;
    const messageToSend = message.trim();
    const currentTime = new Date().toISOString();

    // Add optimistic message
    const optimisticMessage = {
      id: null,
      clientId,
      message: messageToSend,
      createdDate: currentTime,
      me: true,
      pending: true,
      senderId: currentUserId,
    };

    setMessagesMap((prev) => ({
      ...prev,
      [selectedConversation.id]: [...(prev[selectedConversation.id] || []), optimisticMessage],
    }));

    setMessage("");

    try {
      // Create message on server
      const response = await axios.post(
        "http://localhost:8888/api/chat/messages/create",
        { conversationId: selectedConversation.id, message: messageToSend, clientId },
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
            "Content-Type": "application/json",
          },
        }
      );

      const sentMessage = response.data.result;

      // Emit via socket
      emit("send_message", {
        conversationId: selectedConversation.id,
        message: messageToSend,
        messageId: sentMessage.id,
        clientId,
      });

      // Update optimistic message to success
      setMessagesMap((prev) => {
        const messages = prev[selectedConversation.id] || [];
        const updated = messages.map((msg) =>
          msg.clientId === clientId 
            ? { ...sentMessage, me: true, pending: false, clientId }
            : msg
        );
        return { ...prev, [selectedConversation.id]: updated };
      });

    } catch (error) {
      console.error("Failed to send message:", error);
      
      // Mark as failed
      setMessagesMap((prev) => {
        const messages = prev[selectedConversation.id] || [];
        const updated = messages.map((msg) =>
          msg.clientId === clientId 
            ? { ...msg, failed: true, pending: false }
            : msg
        );
        return { ...prev, [selectedConversation.id]: updated };
      });

      toast({
        title: "Failed to send message",
        status: "error",
        duration: 3000,
      });
    }
  };

  // Search users
  const searchUsers = async (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredUsers([]);
      return;
    }
    try {
      const users = await searchUsersByUserName(query);
      setFilteredUsers(users || []);
    } catch (error) {
      setFilteredUsers([]);
    }
  };

  // Create new conversation
  const handleSelectUser = async (user) => {
    try {
      const response = await axios.post(
        "http://localhost:8888/api/chat/conversations/create",
        { type: "DIRECT", participantIds: [user.userId] },
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
            "Content-Type": "application/json",
          },
        }
      );
      
      const newConversation = response.data.result;
      const existing = conversations.find((c) => c.id === newConversation.id);
      
      if (existing) {
        handleConversationSelect(existing);
      } else {
        setConversations((prev) => [newConversation, ...prev]);
        handleConversationSelect(newConversation);
      }
      
      setShowUserSearch(false);
      setSearchQuery("");
    } catch (error) {
      console.error("Failed to create conversation:", error);
    }
  };

  // Fetch conversations
  const fetchConversations = async () => {
    try {
      const response = await getMyConversations();
      setConversations(response?.data?.result || []);
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
    }
  };

  // Fetch messages for conversation
  const fetchMessages = async (conversationId) => {
    try {
      const response = await axios.get(`http://localhost:8888/api/chat/messages`, {
        params: { conversationId },
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
      });
      
      const messages = (response.data.result || [])
        .map((m) => ({
          ...m,
          createdDate: normalizeDate(m.createdDate),
          me: currentUserId ? m.senderId === currentUserId : false,
        }))
        .sort((a, b) => new Date(a.createdDate) - new Date(b.createdDate));

      setMessagesMap((prev) => ({ ...prev, [conversationId]: messages }));
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    }
  };

  useEffect(() => {
    getCurrentUser();
    fetchConversations();
  }, [getCurrentUser]);

  useEffect(() => {
    if (selectedConversation && !messagesMap[selectedConversation.id]) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation, messagesMap, currentUserId]);

  const currentMessages = selectedConversation ? messagesMap[selectedConversation.id] || [] : [];

  return (
    <div className="h-screen flex bg-white max-w-full overflow-hidden">
      {/* Mobile: Show sidebar or chat area based on state */}
      {isMobile ? (
        <>
          {showSidebar && (
            <div className="w-full h-full">
              <Sidebar
                isConnected={isConnected}
                showUserSearch={showUserSearch}
                onToggleUserSearch={() => setShowUserSearch(!showUserSearch)}
                searchQuery={searchQuery}
                onSearch={searchUsers}
                filteredUsers={filteredUsers}
                onSelectUser={handleSelectUser}
                conversations={conversations}
                selectedConversation={selectedConversation}
                onSelectConversation={handleConversationSelect}
                isMobile={isMobile}
              />
            </div>
          )}
          
          {!showSidebar && selectedConversation && (
            <div className="w-full h-full">
              <ChatArea
                selectedConversation={selectedConversation}
                messages={currentMessages}
                isConnected={isConnected}
                message={message}
                onMessageChange={setMessage}
                onSendMessage={handleSendMessage}
                isMobile={isMobile}
                onBack={handleBackToConversations}
              />
            </div>
          )}
        </>
      ) : (
        /* Desktop: Show both sidebar and chat area */
        <>
          <div className="w-80 flex-shrink-0 border-r border-gray-200 h-full">
            <Sidebar
              isConnected={isConnected}
              showUserSearch={showUserSearch}
              onToggleUserSearch={() => setShowUserSearch(!showUserSearch)}
              searchQuery={searchQuery}
              onSearch={searchUsers}
              filteredUsers={filteredUsers}
              onSelectUser={handleSelectUser}
              conversations={conversations}
              selectedConversation={selectedConversation}
              onSelectConversation={handleConversationSelect}
              isMobile={isMobile}
            />
          </div>
          
          <div className="flex-1 h-full">
            <ChatArea
              selectedConversation={selectedConversation}
              messages={currentMessages}
              isConnected={isConnected}
              message={message}
              onMessageChange={setMessage}
              onSendMessage={handleSendMessage}
              isMobile={isMobile}
              onBack={handleBackToConversations}
            />
          </div>
        </>
      )}
    </div>
  );
}