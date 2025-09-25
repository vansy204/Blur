
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

  /** Kết nối socket.io */
  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const socket = io(`http://www.blur.io.vn:8099?token=${token}`, {
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
        const res = await getMyConversations();
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
        const res = await axios.get(`/api/chat/messages`, {
          params: { conversationId: selectedChat.id },
          headers: { Authorization: `Bearer ${getToken()}` },
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
        `/api/chat/messages/create`,
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
=======
  }, [currentUserId]);


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

      const res = await axios.get(`/api/chat/messages`, {
        params: { conversationId },
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
      });
      const data = res.data;
      if (data?.code !== 1000) throw new Error(data?.message || "Failed to fetch messages");
      const messages = (data?.result || [])
        .map((m) => ({
          ...m,
          createdDate: normalizeDate(m.createdDate),
          me: currentUserId ? m.senderId === currentUserId : !!m.me,
        }))
        .sort((a, b) => new Date(a.createdDate) - new Date(b.createdDate));
      return messages;
    } catch (err) {
      throw err;
    }
  };


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