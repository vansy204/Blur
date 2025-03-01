import React, { useState, useEffect } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

function Chat() {
  const [stompClient, setStompClient] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = new SockJS('http://localhost:8080/ws');
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000, // Tự động kết nối lại sau 5 giây
      onConnect: () => {
        console.log('Connected to STOMP');
        setIsConnected(true);
        client.subscribe('/topic/messages', (msg) => {
          setMessages((prev) => [...prev, msg.body]);
        });
      },
      onStompError: (error) => {
        console.error('STOMP error:', error);
        setIsConnected(false);
      },
      onWebSocketClose: () => {
        console.log('Disconnected');
        setIsConnected(false);
      },
    });

    client.activate();
    setStompClient(client);

    return () => {
      if (client) client.deactivate();
    };
  }, []);

  const sendMessage = () => {
    if (stompClient && isConnected) {
      stompClient.publish({
        destination: '/app/chat',
        body: message,
      });
      setMessage('');
    }
  };

  return (
    <div>
      <h2>Chat</h2>
      <div>
        {messages.map((msg, index) => (
          <p key={index}>{msg}</p>
        ))}
      </div>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Nhập tin nhắn..."
        disabled={!isConnected}
      />
      <button onClick={sendMessage} disabled={!isConnected}>
        Gửi
      </button>
      {!isConnected && <p style={{ color: 'red' }}>Không kết nối được</p>}
    </div>
  );
}

export default Chat;