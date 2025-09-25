// hooks/useSocket.js
import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { getToken } from '../service/LocalStorageService';


export const useSocket = (currentUserId, onMessageReceived) => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  const initializeSocket = useCallback(() => {
    const token = getToken();
    if (!token) return;

    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
    }

    const connectionUrl = `http://localhost:8099?token=${token}`;
    socketRef.current = io(connectionUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 20000,
      forceNew: true,
    });

    const socket = socketRef.current;

    socket.on("connect", () => {
      setIsConnected(true);
      console.log("Socket connected:", socket.id);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
      console.log("Socket disconnected");
    });

    socket.on("message_received", (messageData) => {
      console.log("Received message:", messageData);
      onMessageReceived(messageData);
    });

    return socket;
  }, [onMessageReceived]);

  useEffect(() => {
    const socket = initializeSocket();
    
    return () => {
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
      }
    };
  }, [initializeSocket]);

  const emit = (event, data) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit(event, data);
    }
  };

  return { isConnected, emit };
};