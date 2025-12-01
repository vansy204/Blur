// src/contexts/SocketContext.jsx
import React, { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from "react";
import { SOCKET_URL } from "../utils/constants";
import { getToken } from "../utils/auth";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState("");
  
  const messageCallbacksRef = useRef({
    onMessageSent: null,
    onMessageReceived: null,
  });

  const callCallbacksRef = useRef({
    onCallInitiated: null,
    onIncomingCall: null,
    onCallAnswered: null,
    onCallRejected: null,
    onCallEnded: null,
    onCallFailed: null,
    onWebRTCOffer: null,
    onWebRTCAnswer: null,
    onICECandidate: null,
  });

  const registerMessageCallbacks = useCallback((callbacks) => {
    messageCallbacksRef.current = {
      ...messageCallbacksRef.current,
      ...callbacks
    };
  }, []);

  const registerCallCallbacks = useCallback((callbacks) => {
    const hasChanged = Object.keys(callbacks).some(key => 
      callCallbacksRef.current[key] !== callbacks[key]
    );
    
    if (!hasChanged) {
      return;
    }
    
    callCallbacksRef.current = {
      ...callCallbacksRef.current,
      ...callbacks
    };
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.socket.io/4.5.4/socket.io.min.js";
    script.async = true;

    script.onload = () => {
      if (socketRef.current) {
        return;
      }
      const socket = window.io(SOCKET_URL, {
        query: { token },
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 10,
        timeout: 20000,
        transports: ["websocket", "polling"],
      });

      socketRef.current = socket;

      socket.on("connect", () => {
        setIsConnected(true);
        setError("");
      });

      socket.on("disconnect", (reason) => {
        setIsConnected(false);
      });

      socket.on("connect_error", (err) => {
        setError("Không thể kết nối socket");
        setIsConnected(false);
      });

      socket.on("reconnect_attempt", (attemptNumber) => {
        // Reconnecting...
      });

      socket.on("reconnect", (attemptNumber) => {
        setIsConnected(true);
        setError("");
      });

      socket.on("connected", (data) => {
        // Connected event received
      });

      // Chat events
      socket.on("message_sent", (data) => {
        if (messageCallbacksRef.current.onMessageSent) {
          messageCallbacksRef.current.onMessageSent(data);
        }
      });

      socket.on("message_received", (data) => {
        if (messageCallbacksRef.current.onMessageReceived) {
          messageCallbacksRef.current.onMessageReceived(data);
        }
      });

      socket.on("user_typing", (data) => {
        // User typing event
      });

      socket.on("message_error", (error) => {
        setError(error.message || "Lỗi khi gửi tin nhắn");
      });

      socket.on("auth_error", (error) => {
        setError("Lỗi xác thực. Vui lòng đăng nhập lại.");
      });

      // Call events
      socket.on("call:initiated", (data) => {
        console.log("✅ Received call:initiated event:", data);
        if (callCallbacksRef.current.onCallInitiated) {
          callCallbacksRef.current.onCallInitiated(data);
        }
      });

      socket.on("call:incoming", (data) => {
        console.log("📞 Received call:incoming event:", data);
        if (callCallbacksRef.current.onIncomingCall) {
          callCallbacksRef.current.onIncomingCall(data);
        }
      });

      socket.on("call:answered", (data) => {
        console.log("✅ Received call:answered event:", data);
        if (callCallbacksRef.current.onCallAnswered) {
          callCallbacksRef.current.onCallAnswered(data);
        }
      });

      socket.on("call:rejected", (data) => {
        if (callCallbacksRef.current.onCallRejected) {
          callCallbacksRef.current.onCallRejected(data);
        }
      });

      socket.on("call:ended", (data) => {
        if (callCallbacksRef.current.onCallEnded) {
          callCallbacksRef.current.onCallEnded(data);
        }
      });

      socket.on("call:failed", (data) => {
        if (callCallbacksRef.current.onCallFailed) {
          callCallbacksRef.current.onCallFailed(data);
        }
      });

      socket.on("webrtc:offer", (data) => {
        if (callCallbacksRef.current.onWebRTCOffer) {
          callCallbacksRef.current.onWebRTCOffer(data);
        }
      });

      socket.on("webrtc:answer", (data) => {
        if (callCallbacksRef.current.onWebRTCAnswer) {
          callCallbacksRef.current.onWebRTCAnswer(data);
        }
      });

      socket.on("webrtc:ice-candidate", (data) => {
        if (callCallbacksRef.current.onICECandidate) {
          callCallbacksRef.current.onICECandidate(data);
        }
      });
    };

    script.onerror = () => {
      setError("Không thể tải thư viện Socket.IO");
    };
    
    document.head.appendChild(script);

    return () => {
      if (socketRef.current) {
        socketRef.current.off("connect");
        socketRef.current.off("disconnect");
        socketRef.current.off("connect_error");
        socketRef.current.off("reconnect_attempt");
        socketRef.current.off("reconnect");
        socketRef.current.off("connected");
        socketRef.current.off("message_sent");
        socketRef.current.off("message_received");
        socketRef.current.off("user_typing");
        socketRef.current.off("message_error");
        socketRef.current.off("auth_error");
        socketRef.current.off("call:initiated");
        socketRef.current.off("call:incoming");
        socketRef.current.off("call:answered");
        socketRef.current.off("call:rejected");
        socketRef.current.off("call:ended");
        socketRef.current.off("call:failed");
        socketRef.current.off("webrtc:offer");
        socketRef.current.off("webrtc:answer");
        socketRef.current.off("webrtc:ice-candidate");
        
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  const sendMessage = useCallback((messageData) => {
    if (!socketRef.current || !isConnected) {
      return false;
    }

    try {
      socketRef.current.emit("send_message", messageData);
      return true;
    } catch (error) {
      return false;
    }
  }, [isConnected]);

  const sendTypingIndicator = useCallback((conversationId, isTyping) => {
    if (!socketRef.current || !isConnected) {
      return;
    }
    
    try {
      socketRef.current.emit("typing", { conversationId, isTyping });
    } catch (error) {
      // Error sending typing indicator
    }
  }, [isConnected]);

  const initiateCall = useCallback((callData) => {
    if (!socketRef.current || !isConnected) {
      console.error("❌ Socket not connected or socketRef is null");
      return false;
    }

    try {
      console.log("📡 Emitting call:initiate event:", callData);
      socketRef.current.emit("call:initiate", callData);
      return true;
    } catch (error) {
      console.error("❌ Error emitting call:initiate:", error);
      return false;
    }
  }, [isConnected]);

  const answerCall = useCallback((callId) => {
    if (!socketRef.current || !isConnected) {
      return false;
    }

    try {
      socketRef.current.emit("call:answer", { callId });
      return true;
    } catch (error) {
      return false;
    }
  }, [isConnected]);

  const rejectCall = useCallback((callId) => {
    if (!socketRef.current || !isConnected) {
      return false;
    }

    try {
      socketRef.current.emit("call:reject", { callId });
      return true;
    } catch (error) {
      return false;
    }
  }, [isConnected]);

  const endCall = useCallback((callId) => {
    if (!socketRef.current || !isConnected) {
      return false;
    }

    try {
      socketRef.current.emit("call:end", { callId });
      return true;
    } catch (error) {
      return false;
    }
  }, [isConnected]);

  const sendWebRTCOffer = useCallback((toUserId, offer) => {
    if (!socketRef.current || !isConnected) {
      return false;
    }

    try {
      socketRef.current.emit("webrtc:offer", { to: toUserId, offer });
      return true;
    } catch (error) {
      return false;
    }
  }, [isConnected]);

  const sendWebRTCAnswer = useCallback((toUserId, answer) => {
    if (!socketRef.current || !isConnected) {
      return false;
    }

    try {
      socketRef.current.emit("webrtc:answer", { to: toUserId, answer });
      return true;
    } catch (error) {
      return false;
    }
  }, [isConnected]);

  const sendICECandidate = useCallback((toUserId, candidate) => {
    if (!socketRef.current || !isConnected) {
      return false;
    }

    try {
      socketRef.current.emit("webrtc:ice-candidate", { to: toUserId, candidate });
      return true;
    } catch (error) {
      return false;
    }
  }, [isConnected]);

  const contextValue = useMemo(() => ({
    socket: socketRef.current,
    isConnected,
    error,
    sendMessage,
    sendTypingIndicator,
    registerMessageCallbacks,
    initiateCall,
    answerCall,
    rejectCall,
    endCall,
    sendWebRTCOffer,
    sendWebRTCAnswer,
    sendICECandidate,
    registerCallCallbacks,
  }), [
    isConnected,
    error,
    sendMessage,
    sendTypingIndicator,
    registerMessageCallbacks,
    initiateCall,
    answerCall,
    rejectCall,
    endCall,
    sendWebRTCOffer,
    sendWebRTCAnswer,
    sendICECandidate,
    registerCallCallbacks,
  ]);

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within SocketProvider");
  }
  return context;
};