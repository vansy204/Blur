// hooks/useSocket.js
import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { getToken } from '../service/LocalStorageService';

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState("");
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const maxReconnectAttempts = 5;
  const socketRef = useRef(null);

  const initializeSocket = useCallback(() => {
    const token = getToken();
    if (!token) return;

    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
    }

    const socket = io(`http://localhost:8099?token=${token}`, {
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

    return socket;
  }, []);

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

  const onMessage = (callback) => {
    if (socketRef.current) {
      socketRef.current.on("message", callback);
    }
  };

  const offMessage = () => {
    if (socketRef.current) {
      socketRef.current.off("message");
    }
  };

  return {
    isConnected,
    connectionError,
    reconnectAttempts,
    maxReconnectAttempts,
    emit,
    onMessage,
    offMessage
  };
};