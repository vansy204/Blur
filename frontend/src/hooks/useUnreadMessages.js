import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { getToken } from '../service/LocalStorageService';
import { useSocket } from '../contexts/SocketContext';

/**
 * Custom Hook để quản lý số lượng tin nhắn chưa đọc
 * 
 * @param {Object} options - Tùy chọn
 * @param {boolean} options.autoRefresh - Tự động refresh mỗi 30 giây (default: true)
 * @param {number} options.refreshInterval - Khoảng thời gian refresh (ms) (default: 30000)
 * @returns {Object} { totalUnread, unreadByConversation, refreshUnreadCount, markAsRead }
 */
export const useUnreadMessages = (options = {}) => {
  const {
    autoRefresh = true,
    refreshInterval = 30000,
  } = options;

  const [totalUnread, setTotalUnread] = useState(0);
  const [unreadByConversation, setUnreadByConversation] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const { registerMessageCallbacks } = useSocket();

  const BASE_URL = '/api';

  const fetchAllUnreadCounts = useCallback(async () => {
    const token = getToken();
    if (!token) {
      console.warn('⚠️ No token found, cannot fetch unread counts');
      return;
    }

    setIsLoading(true);

    try {
      const conversationsRes = await axios.get(
        `${BASE_URL}/chat/conversations/my-conversations`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const conversations = conversationsRes.data?.result || [];
      
      if (conversations.length === 0) {
        setTotalUnread(0);
        setUnreadByConversation({});
        setIsLoading(false);
        return;
      }

      // 2. Fetch unread count cho từng conversation
      const unreadPromises = conversations.map(async (conv) => {
        try {
          const unreadRes = await axios.get(
            `${BASE_URL}/chat/conversations/${conv.id}/unread-count`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          return {
            conversationId: conv.id,
            count: unreadRes.data?.result || 0,
          };
        } catch (error) {
          console.error(`❌ Error fetching unread for ${conv.id}:`, error);
          return {
            conversationId: conv.id,
            count: 0,
          };
        }
      });

      const results = await Promise.all(unreadPromises);

      // 3. Tính tổng và tạo object theo conversationId
      let total = 0;
      const unreadMap = {};

      results.forEach(({ conversationId, count }) => {
        total += count;
        unreadMap[conversationId] = count;
      });

      setTotalUnread(total);
      setUnreadByConversation(unreadMap);

      console.log('📊 Unread counts updated:', {
        total,
        byConversation: unreadMap,
      });
    } catch (error) {
      console.error('❌ Error fetching unread counts:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Đánh dấu conversation là đã đọc
   */
  const markAsRead = useCallback(async (conversationId) => {
    const token = getToken();
    if (!token || !conversationId) return;

    try {
      await axios.put(
        `${BASE_URL}/conversations/mark-as-read`,
        null,
        {
          params: { conversationId },
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log(`✅ Marked conversation ${conversationId} as read`);

      // Cập nhật state ngay lập tức
      setUnreadByConversation(prev => ({
        ...prev,
        [conversationId]: 0,
      }));

      setTotalUnread(prev => Math.max(0, prev - (unreadByConversation[conversationId] || 0)));

      // Refresh lại để đảm bảo chính xác
      setTimeout(() => {
        fetchAllUnreadCounts();
      }, 500);
    } catch (error) {
      console.error('❌ Error marking as read:', error);
    }
  }, [unreadByConversation, fetchAllUnreadCounts]);

  /**
   * Refresh unread count manually
   */
  const refreshUnreadCount = useCallback(() => {
    fetchAllUnreadCounts();
  }, [fetchAllUnreadCounts]);

  // === FETCH INITIAL DATA ===
  useEffect(() => {
    fetchAllUnreadCounts();
  }, [fetchAllUnreadCounts]);

  // === AUTO REFRESH ===
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchAllUnreadCounts();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchAllUnreadCounts]);

  // === LISTEN TO SOCKET EVENTS ===
  useEffect(() => {
    if (!registerMessageCallbacks) return;

    const handleMessageReceived = (data) => {
      console.log('📨 New message received, updating unread count');
      
      // Tăng unread count cho conversation cụ thể
      setUnreadByConversation(prev => ({
        ...prev,
        [data.conversationId]: (prev[data.conversationId] || 0) + 1,
      }));

      // Tăng total
      setTotalUnread(prev => prev + 1);

      // Fetch lại sau 500ms để đảm bảo chính xác
      setTimeout(() => {
        fetchAllUnreadCounts();
      }, 500);
    };

    const handleMessageSent = (data) => {
      console.log('✅ Message sent, may need to refresh unread count');
      
      // Khi gửi tin nhắn, conversation đó được mark as read
      // Refresh lại unread count
      setTimeout(() => {
        fetchAllUnreadCounts();
      }, 500);
    };

    registerMessageCallbacks({
      onMessageReceived: handleMessageReceived,
      onMessageSent: handleMessageSent,
    });
  }, [registerMessageCallbacks, fetchAllUnreadCounts]);

  return {
    totalUnread,              // Tổng số tin nhắn chưa đọc
    unreadByConversation,     // Object: { conversationId: count }
    isLoading,                // Loading state
    refreshUnreadCount,       // Function để refresh manually
    markAsRead,               // Function để mark conversation as read
  };
};

export default useUnreadMessages;