import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Heart, PlusCircle, MoreHorizontal, Image, Mic, Paperclip } from 'lucide-react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { getToken } from '../../service/LocalStorageService';
import axios from 'axios';

const MessagePage = () => {
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);
  const stompClientRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const maxReconnectAttempts = 5;
  
  // Current user ID (should be fetched from auth system in a real app)
  const currentUserId = "current_user"; 
  
  const [conversations, setConversations] = useState([
    { id: 1, name: 'john_doe', avatar: 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png', status: 'online', lastMessage: 'Hey, how are you?', unread: 2, time: '2h' },
    { id: 2, name: 'jane_smith', avatar: 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png', status: 'offline', lastMessage: 'See you tomorrow!', unread: 0, time: '3h' },
    { id: 3, name: 'alex_johnson', avatar: 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png', status: 'online', lastMessage: 'Thanks for your help!', unread: 1, time: '1d' },
    { id: 4, name: 'sarah_williams', avatar: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png", status: 'offline', lastMessage: 'That sounds good!', unread: 0, time: '2d' },
  ]);

  const [messages, setMessages] = useState([
    { id: 1, sender: 'them', text: 'Hi there!', time: '10:30 AM' },
    { id: 2, sender: 'me', text: 'Hello! How are you?', time: '10:31 AM' },
    { id: 3, sender: 'them', text: 'I\'m good, thanks! Just wanted to check in.', time: '10:32 AM' },
    { id: 4, sender: 'me', text: 'Great to hear from you. I was just thinking about our project.', time: '10:33 AM' },
  ]);
  
  // Initialize WebSocket connection directly with token from localStorage
  useEffect(() => {
    const token = getToken();
    
    if (!token) {
      setConnectionError("Authentication token not found. Please login again.");
      return;
    }
    
    console.log("Initializing WebSocket connection with token from localStorage");
    initializeWebSocketConnection(token);
  }, []);
  
  // Function to initialize WebSocket connection
  const initializeWebSocketConnection = (token) => {
    if (!token) {
      setConnectionError("Authentication token not found. Please login again.");
      return;
    }
    
    console.log("Setting up WebSocket connection...");
    
    // Updated WebSocket endpoint to match the gateway configuration
    const socket = new SockJS("http://localhost:8888/api/chat/ws");
    
    // Apply headers directly to the underlying transport
    socket.onopen = function() {
      const xhr = socket._transport.xhr;
      if (xhr) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
    };
    
    // Configure STOMP client with multiple auth mechanisms
    const stompClient = new Client({
      webSocketFactory: () => socket,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
        'X-Authorization': `Bearer ${token}`,
        'X-Auth-Token': token
      },
      onConnect: () => {
        console.log('✅ Connected to WebSocket');
        setIsConnected(true);
        setConnectionError(null);
        setReconnectAttempts(0);
  
        // Subscribe to personal message topic - match the backend configuration
        try {
          stompClient.subscribe('/user/topic/messages', (message) => {
            const receivedMessage = JSON.parse(message.body);
            console.log('📩 Message received:', receivedMessage);
            setMessages((prev) => [...prev, {
              id: Date.now(),
              sender: receivedMessage.senderId === currentUserId ? 'me' : 'them',
              text: receivedMessage.content,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);
          }, { Authorization: `Bearer ${token}` });
          console.log('✅ Subscribed to /user/topic/messages');
          
          // Fetch conversation history when connected
          fetchConversations(token);
        } catch (err) {
          console.error('❌ Subscription error:', err);
          setConnectionError(`Subscription error: ${err.message}`);
        }
      },
      onStompError: (frame) => {
        console.error('❌ STOMP error:', frame);
        setConnectionError(`Connection failed: ${frame.headers?.message || 'Unknown error'}`);
      },
      onWebSocketClose: (event) => {
        console.error('❌ WebSocket closed:', event);
        
        if (event.code === 1000) {
          // Normal closure
          setConnectionError('Connection closed normally');
        } else if (event.code === 1008) {
          // Policy violation (often auth issues)
          setConnectionError('Connection failed: Authentication error');
        } else {
          // Other issues
          if (reconnectAttempts < maxReconnectAttempts) {
            setConnectionError(`Connection lost. Reconnecting (${reconnectAttempts + 1}/${maxReconnectAttempts})...`);
            setReconnectAttempts((prev) => prev + 1);
            setTimeout(() => {
              // Try reconnecting with a new socket
              initializeWebSocketConnection(token);
            }, 2000);
          } else {
            setConnectionError('Unable to reconnect after multiple attempts.');
          }
        }
      },
      onWebSocketError: (event) => {
        console.error('❌ WebSocket error:', event);
        setConnectionError('WebSocket connection error');
      },
      debug: (str) => {
        console.debug('STOMP Debug:', str);
      },
    });
  
    // Attempt connection
    try {
      stompClient.activate();
      stompClientRef.current = stompClient;
    } catch (err) {
      console.error('❌ Activation error:', err);
      setConnectionError(`Connection activation failed: ${err.message}`);
    }
  };
  
  // Fetch user conversations from the backend
  const fetchConversations = async (token) => {
    try {
      const response = await axios.get('http://localhost:8888/api/chat/conversations', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data && Array.isArray(response.data)) {
        // Map the backend data to our frontend format
        const mappedConversations = response.data.map(conv => ({
          id: conv.userId || conv.id,
          name: conv.username || conv.name,
          avatar: conv.profileImage || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png',
          status: conv.status || 'offline',
          lastMessage: conv.lastMessage?.content || 'Start a conversation',
          unread: conv.unreadCount || 0,
          time: formatTimestamp(conv.lastMessage?.timestamp) || ''
        }));
        
        setConversations(mappedConversations.length > 0 ? mappedConversations : conversations);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      // Keep the mock data if fetching fails
    }
  };
  
  // Helper function to format timestamps
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffHrs = diffMs / (1000 * 60 * 60);
    
    if (diffHrs < 24) {
      return `${Math.round(diffHrs)}h`;
    } else {
      return `${Math.round(diffHrs / 24)}d`;
    }
  };
  
  // Load chat history when a conversation is selected
  useEffect(() => {
    if (selectedChat && isConnected) {
      loadChatHistory(selectedChat.id);
    }
  }, [selectedChat, isConnected]);
  
  // Function to load chat history for a selected conversation
  const loadChatHistory = async (receiverId) => {
    const token = getToken();
    try {
      const response = await axios.get(`http://localhost:8888/api/chat/history/${receiverId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data && Array.isArray(response.data)) {
        // Map the backend messages to our frontend format
        const mappedMessages = response.data.map(msg => ({
          id: msg.id || Date.now() + Math.random(),
          sender: msg.senderId === currentUserId ? 'me' : 'them',
          text: msg.content,
          time: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }));
        
        setMessages(mappedMessages.length > 0 ? mappedMessages : messages);
      }
    } catch (error) {
      console.error('Failed to fetch chat history:', error);
      // Keep the mock data if fetching fails
    }
  };
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Clean up connection on unmount
  useEffect(() => {
    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
        console.log('WebSocket connection closed');
      }
    };
  }, []);
  
  const sendMessage = () => {
    if (!message.trim()) return;
    
    if (stompClientRef.current && stompClientRef.current.connected && selectedChat) {
      const chatMessage = {
        senderId: currentUserId,
        receiverId: selectedChat.id,
        content: message,
        timestamp: new Date().toISOString()
      };
  
      try {
        // Match the application destination prefix from backend config
        stompClientRef.current.publish({
          destination: '/app/private-message',
          body: JSON.stringify(chatMessage),
          headers: {
            Authorization: `Bearer ${getToken()}`
          }
        });
        
        // Add message to local state
        setMessages((prev) => [...prev, {
          id: Date.now(),
          sender: 'me',
          text: message,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
        
        // Update the last message in conversations list
        setConversations(prevConversations => 
          prevConversations.map(conv => 
            conv.id === selectedChat.id 
              ? { ...conv, lastMessage: message, time: 'now' }
              : conv
          )
        );
        
        setMessage('');
      } catch (err) {
        console.error('❌ Failed to send message:', err);
        setConnectionError(`Failed to send message: ${err.message}`);
      }
    } else {
      setConnectionError('Cannot send message: Not connected to server');
    }
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && message.trim() && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  
  return (
    <div className="flex h-screen max-h-screen overflow-hidden bg-white">
      {/* Connection status indicator */}
      {connectionError && (
        <div className="absolute top-0 left-0 right-0 bg-red-500 text-white text-center py-1 text-sm">
          {connectionError} {reconnectAttempts < maxReconnectAttempts && !isConnected ? `(Reconnect attempt ${reconnectAttempts}/${maxReconnectAttempts})` : ''}
        </div>
      )}
      
      {/* Conversation List - Instagram style */}
      <div className="w-72 h-full border-r bg-white">
        <div className="p-4 border-b flex justify-between items-center">
          <div className="flex items-center">
            <h2 className="text-xl font-semibold">{currentUserId}</h2>
            <PlusCircle size={18} className="ml-2 text-sky-400" />
          </div>
          <div className="cursor-pointer">
            <MoreHorizontal size={20} />
          </div>
        </div>
        
        <div className="px-4 py-3 flex justify-between">
          <span className="font-medium text-sky-400">Messages</span>
          <span className="text-gray-500">Requests</span>
        </div>
        
        <div className="overflow-y-auto h-[calc(100vh-120px)]">
          {conversations.map((chat, index) => (
            <div 
              key={`${chat.id}-${index}`}
              onClick={() => setSelectedChat(chat)}
              className={`flex items-center px-4 py-3 cursor-pointer ${selectedChat?.id === chat.id ? 'bg-blue-50' : ''}`}
            >
              <div className="relative mr-3">
                <div className={`w-12 h-12 rounded-full overflow-hidden border-2 ${chat.status === 'online' ? 'border-sky-400' : 'border-transparent'}`}>
                  <img src={chat.avatar} alt={chat.name} className="w-full h-full object-cover" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium truncate">{chat.name}</h3>
                  <span className="text-xs text-gray-400">{chat.time}</span>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-500 truncate">{chat.lastMessage}</p>
                  {chat.unread > 0 && (
                    <span className="ml-2 bg-sky-400 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {chat.unread}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Chat Area - Instagram style */}
      <div className="flex-1 flex flex-col h-screen max-h-screen overflow-hidden">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center justify-between p-3 border-b bg-white">
              <div className="flex items-center">
                <div className="relative mr-3">
                  <div className={`w-8 h-8 rounded-full overflow-hidden border-2 ${selectedChat.status === 'online' ? 'border-sky-400' : 'border-transparent'}`}>
                    <img src={selectedChat.avatar} alt={selectedChat.name} className="w-full h-full object-cover" />
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-sm">{selectedChat.name}</h3>
                  <p className="text-xs text-gray-500">{selectedChat.status === 'online' ? 'Active now' : 'Active 3h ago'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button className="text-sky-400">
                  <Phone size={20} />
                </button>
                <button className="text-sky-400">
                  <Video size={20} />
                </button>
                <button className="text-gray-500">
                  <Info size={20} />
                </button>
              </div>
            </div>
            
            {/* Connection status in chat area */}
            {!isConnected && (
              <div className="bg-yellow-50 text-yellow-700 px-4 py-2 text-sm text-center">
                {connectionError ? 'Reconnecting...' : 'Connecting to messaging server...'}
              </div>
            )}
            
            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto bg-white" style={{ height: 'calc(100vh - 130px)' }}>
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                    {msg.sender !== 'me' && (
                      <div className="w-8 h-8 rounded-full overflow-hidden mr-2">
                        <img src={selectedChat.avatar} alt={selectedChat.name} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className={`max-w-xs p-3 rounded-3xl ${msg.sender === 'me' ? 'bg-sky-400 text-white' : 'bg-gray-100'}`}>
                      <p>{msg.text}</p>
                      <span className={`text-xs block mt-1 ${msg.sender === 'me' ? 'text-sky-100' : 'text-gray-500'}`}>
                        {msg.time}
                      </span>
                    </div>
                  </div>
                ))}
                {/* Invisible element to scroll to */}
                <div ref={messagesEndRef} />
              </div>
            </div>
            
            {/* Message Input - Instagram style */}
            <div className="p-3 border-t bg-white">
              <div className="flex items-center bg-gray-100 rounded-full p-1 pl-4">
                <button className="p-1 text-sky-400 hover:text-sky-500">
                  <Paperclip size={20} />
                </button>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={isConnected ? "Message..." : "Connecting..."}
                  className="flex-1 bg-transparent outline-none px-2 py-1 text-sm"
                  disabled={!isConnected}
                />
                <button className="p-1 text-sky-400 hover:text-sky-500">
                  <Image size={20} />
                </button>
                <button className="p-1 text-sky-400 hover:text-sky-500">
                  <Heart size={20} />
                </button>
                {message.trim() ? (
                  <button 
                    className={`px-2 ${isConnected ? 'text-sky-400 hover:text-sky-600' : 'text-gray-400'}`}
                    disabled={!isConnected}
                    onClick={sendMessage}
                  >
                    Send
                  </button>
                ) : (
                  <button className="p-1 text-sky-400 hover:text-sky-500">
                    <Mic size={20} />
                  </button>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-white">
            <div className="w-16 h-16 rounded-full bg-sky-100 flex items-center justify-center mb-4">
              <MessageCircle size={32} className="text-sky-400" />
            </div>
            <h3 className="text-xl font-medium text-gray-700">Your Messages</h3>
            <p className="text-gray-500 mt-2 text-sm">Send private photos and messages to a friend or group</p>
            <button 
              className="mt-4 bg-sky-400 text-white px-4 py-2 rounded-lg font-medium"
              onClick={() => isConnected ? setSelectedChat(conversations[0]) : null}
              disabled={!isConnected}
            >
              {isConnected ? "Send Message" : "Connecting..."}
            </button>
            
            {/* Connection status indicator */}
            {!isConnected && (
              <p className="text-yellow-600 mt-2 text-sm">
                {connectionError || "Connecting to server..."}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const Phone = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const Video = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polygon points="23 7 16 12 23 17 23 7" />
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
  </svg>
);

const Info = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

export default MessagePage;