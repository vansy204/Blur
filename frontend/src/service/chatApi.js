import axios from 'axios';

const API_BASE_URL = '/api';

/**
 * Create a new conversation
 * @param {Object} data - Conversation data
 * @param {string} data.type - Type of conversation (DIRECT, GROUP)
 * @param {Array<string>} data.participantIds - Array of participant user IDs
 * @param {string} token - Authentication token
 * @returns {Promise<Object>} Created conversation object
 */
export const createConversation = async (data, token) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/chat/conversations/create`,
      data,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    // Handle specific error cases
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      if (status === 400) {
        throw new Error(data.message || 'Invalid conversation data');
      } else if (status === 401) {
        throw new Error('Unauthorized. Please log in again.');
      } else if (status === 404) {
        throw new Error('User not found');
      } else if (status === 409) {
        // Conversation already exists - return existing conversation
        return data;
      }
    } else if (error.request) {
      // Request was made but no response
      throw new Error('Network error. Please check your connection.');
    }
    
    throw new Error(error.message || 'Failed to create conversation');
  }
};

/**
 * Get all conversations for current user
 * @param {string} token - Authentication token
 * @returns {Promise<Array>} Array of conversation objects
 */
export const getConversations = async (token) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/chat/conversations`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching conversations:', error);
    throw error;
  }
};

/**
 * Get conversation by ID
 * @param {string} conversationId - Conversation ID
 * @param {string} token - Authentication token
 * @returns {Promise<Object>} Conversation object
 */
export const getConversationById = async (conversationId, token) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/chat/conversations/${conversationId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching conversation:', error);
    throw error;
  }
};

/**
 * Send a message in a conversation
 * @param {string} conversationId - Conversation ID
 * @param {Object} messageData - Message data
 * @param {string} messageData.content - Message content
 * @param {string} token - Authentication token
 * @returns {Promise<Object>} Sent message object
 */
export const sendMessage = async (conversationId, messageData, token) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/chat/conversations/${conversationId}/messages`,
      messageData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

/**
 * Get messages in a conversation with pagination
 * @param {string} conversationId - Conversation ID
 * @param {string} token - Authentication token
 * @param {number} page - Page number (default: 0)
 * @param {number} size - Page size (default: 50)
 * @returns {Promise<Object>} Paginated messages
 */
export const getMessages = async (conversationId, token, page = 0, size = 50) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/chat/conversations/${conversationId}/messages`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: { page, size }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
};

/**
 * Mark a conversation as read
 * @param {string} conversationId - Conversation ID
 * @param {string} token - Authentication token
 * @returns {Promise<Object>} Updated conversation object
 */
export const markConversationAsRead = async (conversationId, token) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/chat/conversations/${conversationId}/read`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    // Silent fail for read receipts - không nên block user experience
    // Chỉ log error cho monitoring
    console.error('Error marking conversation as read:', error);
    
    // Return null thay vì throw error để tránh break UI flow
    return null;
  }
};

/**
 * Delete a conversation
 * @param {string} conversationId - Conversation ID
 * @param {string} token - Authentication token
 * @returns {Promise<void>}
 */
export const deleteConversation = async (conversationId, token) => {
  try {
    await axios.delete(
      `${API_BASE_URL}/chat/conversations/${conversationId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
  } catch (error) {
    console.error('Error deleting conversation:', error);
    throw error;
  }
};

/**
 * Mark a message as read
 * @param {string} conversationId - Conversation ID
 * @param {string} messageId - Message ID
 * @param {string} token - Authentication token
 * @returns {Promise<Object>} Updated message object
 */
export const markMessageAsRead = async (conversationId, messageId, token) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/chat/conversations/${conversationId}/messages/${messageId}/read`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error marking message as read:', error);
    return null;
  }
};

/**
 * Get unread message count
 * @param {string} token - Authentication token
 * @returns {Promise<number>} Unread message count
 */
export const getUnreadCount = async (token) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/chat/unread-count`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    return response.data.count || 0;
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return 0; // Return 0 on error thay vì throw
  }
}