// components/MessagesList.js
import React, { useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';

const MessagesList = ({ messages }) => {
  const messageContainerRef = useRef(null);

  const scrollToBottom = () => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div
      ref={messageContainerRef}
      className="flex-1 p-4 overflow-y-auto space-y-4"
    >
      {messages.map((msg) => (
        <MessageBubble key={msg.id || msg.clientId} message={msg} />
      ))}
    </div>
  );
};

export default MessagesList;
