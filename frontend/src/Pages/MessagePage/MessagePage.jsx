import React, { useState, useEffect, useRef } from "react";
import { Image, Mic, Paperclip, PlusCircle, Send, AlertCircle } from "lucide-react";

const API_BASE = "http://localhost:8888/api/chat";
const SOCKET_URL = "http://localhost:8099";

const getToken = () => localStorage.getItem("token");

// ✅ Decode JWT token để lấy userId
const getUserId = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;
  
  try {
    // JWT format: header.payload.signature
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    
    // Backend có thể lưu userId trong các field khác nhau
    return decoded.sub || decoded.userId || decoded.user_id || decoded.id;
  } catch (error) {
    console.error("❌ Cannot decode token:", error);
    return null;
  }
};

const apiCall = async (endpoint, options = {}) => {
  const token = getToken();
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    }
  });
  
  if (!response.ok) throw new Error(`API Error: ${response.status}`);
  return response.json();
};

const ConnectionStatus = ({ error }) => {
  if (!error) return null;
  
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-500 text-white px-4 py-2 flex items-center gap-2 shadow-lg">
      <AlertCircle size={18} />
      <span className="text-sm">{error}</span>
    </div>
  );
};

const ConversationList = ({ conversations, selected, onSelect }) => {
  return (
    <div className="w-80 border-r bg-white overflow-y-auto">
      <div className="p-4 border-b bg-gradient-to-r from-blue-500 to-blue-600">
        <h2 className="text-lg font-semibold text-white">Tin nhắn</h2>
      </div>
      
      {conversations.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          <p className="mb-2">Chưa có cuộc trò chuyện</p>
        </div>
      ) : (
        <div className="divide-y">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => onSelect(conv)}
              className={`flex items-center p-4 cursor-pointer transition-all ${
                selected?.id === conv.id 
                  ? 'bg-blue-50 border-l-4 border-l-blue-500' 
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="relative">
                <img 
                  src={conv.conversationAvatar || '/api/placeholder/48/48'} 
                  alt={conv.conversationName}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
              </div>
              
              <div className="flex-1 min-w-0 ml-3">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold truncate">{conv.conversationName}</h3>
                </div>
                <p className="text-sm text-gray-500 truncate">
                  {conv.lastMessage || 'Chưa có tin nhắn'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const MessageBubble = ({ msg, currentUserId }) => {
  const isMe = msg.me === true || msg.senderId === currentUserId;
  const time = new Date(msg.createdDate || Date.now()).toLocaleTimeString('vi-VN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex items-end gap-2 max-w-[70%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
        {!isMe && (
          <img 
            src={msg.sender?.avatar || '/api/placeholder/32/32'} 
            alt={msg.sender?.username || 'User'}
            className="w-8 h-8 rounded-full flex-shrink-0"
          />
        )}
        <div className="flex flex-col">
          {!isMe && msg.sender?.firstName && (
            <span className="text-xs text-gray-500 mb-1 ml-2">
              {msg.sender.firstName} {msg.sender.lastName}
            </span>
          )}
          <div className={`px-4 py-2 rounded-2xl break-words ${
            isMe 
              ? 'bg-blue-500 text-white rounded-br-sm' 
              : 'bg-gray-200 text-gray-900 rounded-bl-sm'
          } ${msg.isPending ? 'opacity-60' : ''}`}>
            {msg.message}
          </div>
          <span className={`text-xs text-gray-400 mt-1 ${isMe ? 'text-right mr-2' : 'text-left ml-2'}`}>
            {time} {msg.isPending && '⏳'}
          </span>
        </div>
      </div>
    </div>
  );
};

const ChatArea = ({ conversation, messages, onSendMessage, isConnected, currentUserId }) => {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (input.trim() && conversation && isConnected) {
      onSendMessage(input);
      setInput("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
            <Send size={48} className="text-blue-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Chọn cuộc trò chuyện
          </h3>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      <div className="border-b p-4 bg-white shadow-sm flex items-center gap-3">
        <img 
          src={conversation.conversationAvatar || '/api/placeholder/40/40'} 
          alt={conversation.conversationName}
          className="w-10 h-10 rounded-full"
        />
        <div className="flex-1">
          <h3 className="font-semibold">{conversation.conversationName}</h3>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
            <span>{isConnected ? 'Đang hoạt động' : 'Không có kết nối'}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            Chưa có tin nhắn. Hãy bắt đầu cuộc trò chuyện!
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble 
                key={msg.id} 
                msg={msg} 
                currentUserId={currentUserId}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div className="border-t p-4 bg-white">
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <PlusCircle size={22} className="text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Image size={22} className="text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Paperclip size={22} className="text-gray-600" />
          </button>
          
          <input
            type="text"
            className="flex-1 border-2 rounded-full px-4 py-2 focus:outline-none focus:border-blue-500 transition-colors"
            placeholder="Nhập tin nhắn..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={!isConnected}
          />
          
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Mic size={22} className="text-gray-600" />
          </button>
          
          <button
            onClick={handleSend}
            disabled={!input.trim() || !isConnected}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-full p-2 transition-colors"
          >
            <Send size={22} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default function MessagePage() {
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null);
  
  const socketRef = useRef(null);
  const currentConversationRef = useRef(null);

  useEffect(() => {
    const userId = getUserId();
    console.log("🔍 DEBUG - Decoded userId from token:", userId);
    setCurrentUserId(userId);
  }, []);

  // Socket.IO connection
  useEffect(() => {
    const token = getToken();
    const userId = getUserId();
    
    console.log("🔍 DEBUG - Token:", token ? "✅ Có" : "❌ Không có");
    console.log("🔍 DEBUG - UserId:", userId);
    
    // Set currentUserId ngay lập tức
    setCurrentUserId(userId);
    
    if (!token) {
      setError("Vui lòng đăng nhập để sử dụng chat");
      console.error("❌ Không có token, không thể kết nối socket");
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.socket.io/4.5.4/socket.io.min.js';
    script.onload = () => {
      console.log("🔧 Socket.IO loaded");
      
      const socket = window.io(`${SOCKET_URL}?token=${token}`, {
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        timeout: 20000,
        transports: ['websocket', 'polling']
      });

      socketRef.current = socket;

      socket.on("connect", () => {
        console.log("✅ Socket connected:", socket.id);
        console.log("🔍 DEBUG - Socket transport:", socket.io.engine.transport.name);
        setIsConnected(true);
        setError("");
      });

      socket.on("disconnect", (reason) => {
        console.log("❌ Socket disconnected:", reason);
        console.log("🔍 DEBUG - Disconnect reason:", reason);
        setIsConnected(false);
      });
      
      socket.on("connect_error", (err) => {
        console.error("❌ Connection error:", err.message);
        setError("Không thể kết nối tới server");
      });

      // ✅ XỬ LÝ MESSAGE_RECEIVED - LOGIC TỐI ƯU
      socket.on("message_received", (data) => {
        console.log("📨 MESSAGE RECEIVED:", data);
        
        setMessages((prev) => {
          // Check đúng conversation TRƯỚC
          if (data.conversationId !== currentConversationRef.current) {
            console.log("⚠️ Wrong conversation, ignoring");
            return prev;
          }
          
          // ✅ Lấy currentUserId từ trong callback
          const currentUser = getUserId();
          const messageSenderId = data.senderId || data.sender?.userId;
          const isMe = messageSenderId === currentUser;
          
          console.log("🔍 COMPARE:");
          console.log("   messageSenderId:", messageSenderId);
          console.log("   currentUser:", currentUser);
          console.log("   isMe:", isMe);
          
          // ✅ CHECK DUPLICATE NGAY - Trước khi xử lý
          const isDuplicate = prev.some(m => 
            (m.id === data.id) || 
            (m.id === data.tempMessageId) ||
            (data.tempMessageId && m.id === data.tempMessageId && !m.isPending)
          );
          
          if (isDuplicate && !data.tempMessageId) {
            console.log("⚠️ Duplicate message (no tempId), ignoring:", data.id);
            return prev;
          }
          
          const processedData = {
            ...data,
            me: isMe,
            senderId: messageSenderId
          };
          
          // ✅ CASE 1: Replace pending message bằng tempMessageId
          if (data.tempMessageId) {
            const pendingIndex = prev.findIndex(
              m => m.id === data.tempMessageId && m.isPending
            );
            
            if (pendingIndex !== -1) {
              console.log("🔄 Replacing pending message:", data.tempMessageId, "→", data.id);
              const updated = [...prev];
              updated[pendingIndex] = {
                ...processedData,
                isPending: false
              };
              return updated;
            }
            
            // Nếu không tìm thấy pending message, check duplicate với real ID
            const existsById = prev.some(m => m.id === data.id);
            if (existsById) {
              console.log("⚠️ Duplicate message (with tempId), ignoring:", data.id);
              return prev;
            }
          }

          // ✅ CASE 2: Message mới từ người khác hoặc tab khác
          console.log("✅ Adding new message with isMe =", isMe);
          return [...prev, processedData];
        });
      });

      socket.on("connected", (data) => {
        console.log("✅ Connection confirmed:", data);
      });

      socket.on("auth_error", (data) => {
        console.error("❌ Auth error:", data);
        setError(data.message);
      });

      socket.on("message_error", (data) => {
        console.error("❌ Message error:", data);
        setError(data.message);
      });
    };
    
    script.onerror = () => {
      setError("Không thể tải Socket.IO library");
    };
    
    document.head.appendChild(script);

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const data = await apiCall('/conversations/my-conversations');
        setConversations(data.result || []);
      } catch (err) {
        console.error("Lỗi tải conversations:", err);
        setError("Không thể tải danh sách cuộc trò chuyện");
      }
    };

    fetchConversations();
  }, []);

  // Fetch messages khi chọn conversation
  useEffect(() => {
    if (!selectedChat) return;

    // ✅ Update conversation ref NGAY
    currentConversationRef.current = selectedChat.id;

    const fetchMessages = async () => {
      try {
        const data = await apiCall(`/messages?conversationId=${selectedChat.id}`);
        const fetchedMessages = (data.result || []).map(msg => {
          const senderId = msg.sender?.userId;
          return {
            ...msg,
            senderId: senderId,
            me: senderId === currentUserId // ✅ Tự set dựa trên currentUserId
          };
        });
        
        console.log("📥 Loaded messages:", fetchedMessages.length);
        console.log("   CurrentUserId:", currentUserId);
        
        setMessages(fetchedMessages);
      } catch (err) {
        console.error("Lỗi tải messages:", err);
        setError("Không thể tải tin nhắn");
      }
    };

    fetchMessages();
  }, [selectedChat, currentUserId]);

  // ✅ Send message handler
  const handleSendMessage = (text) => {
    if (!text.trim() || !selectedChat || !currentUserId) {
      console.warn("⚠️ Cannot send message:");
      console.warn("   Text:", text.trim() ? "✅" : "❌ Empty");
      console.warn("   Chat selected:", selectedChat ? "✅" : "❌ No");
      console.warn("   User ID:", currentUserId ? "✅" : "❌ No");
      return;
    }

    const tempMessageId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // ✅ Tạo tin nhắn tạm (Optimistic UI)
    const tempMsg = {
      id: tempMessageId,
      message: text,
      senderId: currentUserId,
      me: true,
      createdDate: new Date().toISOString(),
      conversationId: selectedChat.id,
      isPending: true
    };
    
    console.log("📤 SENDING MESSAGE:");
    console.log("   TempId:", tempMessageId);
    console.log("   ConversationId:", selectedChat.id);
    console.log("   Message:", text);
    console.log("   Socket connected:", socketRef.current?.connected);
    
    // ✅ Thêm tin nhắn tạm vào UI ngay
    setMessages((prev) => [...prev, tempMsg]);

    // ✅ Emit qua socket
    if (socketRef.current?.connected) {
      const payload = {
        conversationId: selectedChat.id,
        message: text,
        messageId: tempMessageId
      };
      console.log("📤 Emitting payload:", payload);
      socketRef.current.emit("send_message", payload);
      console.log("✅ Message emitted via socket");
    } else {
      console.error("❌ Socket not connected!");
      console.error("   Socket exists:", !!socketRef.current);
      console.error("   Socket connected:", socketRef.current?.connected);
      setError("Mất kết nối. Đang thử kết nối lại...");
      
      // Remove tin nhắn tạm nếu không gửi được
      setMessages((prev) => prev.filter(m => m.id !== tempMessageId));
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <ConnectionStatus error={error} />
      
      <ConversationList
        conversations={conversations}
        selected={selectedChat}
        onSelect={setSelectedChat}
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