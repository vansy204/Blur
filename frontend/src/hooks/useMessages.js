// hooks/useMessages.js
import { useState, useEffect } from 'react';
import { createChatMessage } from '../api/messageAPi';
import httpClient from '../service/httpClient';
import { getToken } from '../service/LocalStorageService';
import { API } from '../service/configuration';

export const useMessages = (selectedChat) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadMessages = async (conversationId) => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = getToken();
      if (!token) {
        setError("Authentication required");
        return;
      }

      const res = await httpClient.get(`${API.GET_MESSAGES}`, {
        params: { conversationId },
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log("Messages response:", res);
      
      const list = (res.data?.result || []).map((m) => ({
        id: m.id,
        sender: m.me ? "me" : "other",
        text: m.message,
        timestamp: m.timestamp || m.createdAt || new Date().toISOString()
      }));
      
      setMessages(list);
    } catch (err) {
      console.error("Error loading messages:", err);
      
      if (err.response?.status === 403) {
        setError("Access forbidden to messages");
      } else if (err.response?.status === 401) {
        setError("Authentication failed");
      } else {
        setError(`Failed to load messages: ${err.response?.data?.message || err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedChat?.id) {
      loadMessages(selectedChat.id);
    }
  }, [selectedChat]);

  const addMessage = (message) => {
    setMessages(prev => [...prev, message]);
  };

  const sendMessage = async (conversationId, messageText, socketEmit) => {
    if (!messageText.trim() || !conversationId) return false;

    const newMsg = {
      id: Date.now(), // temporary ID
      sender: "me",
      text: messageText,
      timestamp: new Date().toISOString()
    };

    // Add optimistic message
    addMessage(newMsg);

    try {
      const token = getToken();
      if (!token) {
        throw new Error("No authentication token");
      }

      // Use the API function instead of direct axios
      await createChatMessage({
        conversationId,
        message: messageText
      });

      // Emit via socket
      socketEmit("send_message", {
        conversationId,
        message: messageText,
      });

      console.log("Message sent successfully");
      return true;
    } catch (err) {
      console.error("Failed to send message:", err);
      
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== newMsg.id));
      
      // Set error message based on response
      if (err.response?.status === 403) {
        setError("Access forbidden to send message");
      } else if (err.response?.status === 401) {
        setError("Authentication failed");
      } else {
        setError(`Failed to send message: ${err.response?.data?.message || err.message}`);
      }
      
      return false;
    }
  };

  return {
    messages,
    loading,
    error,
    addMessage,
    sendMessage
  };
};
