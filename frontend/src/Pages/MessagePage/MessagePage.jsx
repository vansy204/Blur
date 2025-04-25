import React, { useState, useEffect, useRef } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { getToken } from '../../service/LocalStorageService'; 
import ConnectionStatus from '../../Components/Message/ConnectionStatus';
import ConversationList from '../../Components/Message/ConversationList';
import MessageList from '../../Components/Message/MessageList';
import MessageInput from '../../Components/Message/MessageInput';

const MessagePage = () => {
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState('');
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const messagesEndRef = useRef(null);
  const stompClientRef = useRef(null);

  const MAX_RECONNECT_ATTEMPTS = 5;
  const currentUserId = "current_user"; // TODO: Replace with real user ID

  // Auto scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    connectWebSocket();

    return () => {
      disconnectWebSocket();
    };
  }, []);

  const connectWebSocket = () => {
    const token = getToken();
    if (!token) {
      setConnectionError('Authentication token missing');
      return;
    }

    const socket = new SockJS('http://localhost:8888/api/chat/ws/websocket'); // ✨ Không thêm ?access_token
    const stompClient = new Client({
      webSocketFactory: () => socket,
   
      
      connectHeaders: { Authorization: `Bearer ${token}` }, // ✨ Header chỉ thêm ở STOMP CONNECT
      debug: console.log,
      reconnectDelay: 5000,
      onConnect: handleConnected,
      onStompError: handleError,
      onWebSocketClose: handleClose,
      onWebSocketError: handleError,
    });
    stompClient.activate();
    stompClientRef.current = stompClient;
  
  };

  const handleConnected = () => {
    console.log('WebSocket connected');
    setIsConnected(true);
    setReconnectAttempts(0);
    setConnectionError(null);

    subscribeToUserChannels();
    fetchConversations();
  };

  const subscribeToUserChannels = () => {
    const stompClient = stompClientRef.current;
    if (!stompClient) return;

    stompClient.subscribe(`/user/${currentUserId}/queue/messages`, ({ body }) => {
      try {
        const newMessage = JSON.parse(body);
        setMessages((prev) => [...prev, newMessage]);
      } catch (error) {
        console.error('Error parsing incoming message:', error);
      }
    });

    stompClient.subscribe(`/user/${currentUserId}/queue/notifications`, ({ body }) => {
      try {
        console.log('Received notification:', JSON.parse(body));
      } catch (error) {
        console.error('Error parsing notification:', error);
      }
    });
  };

  const handleError = (error) => {
    console.error('Connection error:', error);
    setConnectionError('Connection lost. Attempting to reconnect...');
    setIsConnected(false);
    attemptReconnect();
  };

  const handleClose = () => {
    console.warn('WebSocket closed');
    setIsConnected(false);
    attemptReconnect();
  };

  const attemptReconnect = () => {
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      setReconnectAttempts((prev) => prev + 1);
      setTimeout(connectWebSocket, 3000);
    } else {
      setConnectionError('Unable to reconnect. Please refresh the page.');
    }
  };

  const disconnectWebSocket = () => {
    const stompClient = stompClientRef.current;
    if (stompClient?.active) {
      stompClient.deactivate();
      console.log('WebSocket disconnected');
    }
  };

  const fetchConversations = () => {
    // TODO: Replace with real API
    setConversations([
      { id: 'user1', name: 'User 1' },
      { id: 'user2', name: 'User 2' }
    ]);
  };

  const handleSelectChat = (chat) => {
    setSelectedChat(chat);
    setMessages([]);
    // TODO: Fetch previous messages if needed
  };

  const sendMessage = () => {
    if (!message.trim() || !selectedChat || !isConnected) return;

    const msg = {
      senderId: currentUserId,
      receiverId: selectedChat.id,
      content: message,
      timestamp: new Date().toISOString(),
    };

    try {
      stompClientRef.current.publish({
        destination: '/app/chat.sendMessage',
        body: JSON.stringify(msg),
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      setMessages((prev) => [...prev, msg]);
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      setConnectionError('Failed to send message');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-screen max-h-screen overflow-hidden bg-white">
      <ConnectionStatus
        isConnected={isConnected}
        connectionError={connectionError}
        reconnectAttempts={reconnectAttempts}
        maxReconnectAttempts={MAX_RECONNECT_ATTEMPTS}
      />
      <ConversationList
        conversations={conversations}
        selectedChat={selectedChat}
        setSelectedChat={handleSelectChat}
      />
      <div className="flex flex-col flex-1">
        <MessageList
          messages={messages}
          messagesEndRef={messagesEndRef}
          currentUserId={currentUserId}
        />
        <MessageInput
          message={message}
          setMessage={setMessage}
          sendMessage={sendMessage}
          handleKeyPress={handleKeyPress}
          isConnected={isConnected}
          selectedChat={selectedChat}
        />
      </div>
    </div>
  );
};

export default MessagePage;
