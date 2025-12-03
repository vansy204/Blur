// hooks/useConversations.js
import { useState, useEffect } from 'react';
import { getMyConversations } from '../api/messageAPi';
import { getToken } from '../service/LocalStorageService';

export const useConversations = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
    const token = getToken();
  const loadConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Token in useConversations:", token);
      
      if (!token) {
        setError("Authentication required. Please login again.");
        return;
      }

      console.log("Loading conversations with token:", token ? "Token exists" : "No token");
      
      const res = await getMyConversations(token);
      console.log("Conversations response:", res);
      
      setConversations(res?.data?.result || []);
    } catch (err) {
      console.error("Error loading conversations:", err);
      
      // Handle different error types
      if (err.response?.status === 403) {
        setError("Access forbidden. Please check your permissions or login again.");
      } else if (err.response?.status === 401) {
        setError("Authentication failed. Please login again.");
      } else if (err.response?.status === 500) {
        setError("Server error. Please try again later.");
      } else if (!err.response) {
        setError("Network error. Please check your connection.");
      } else {
        setError(`Failed to load conversations: ${err.response?.data?.message || err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  return {
    conversations,
    loading,
    error,
    refreshConversations: loadConversations
  };
};