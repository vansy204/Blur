import React, { useEffect, useRef } from 'react'

const MessageList = ({ messages }) => {
    const messagesEndRef = useRef(null);
  
    useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
  
    return (
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'} mb-2`}
          >
            <div className={`p-2 rounded-lg ${msg.sender === 'me' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'}`}>
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    );
  };
export default MessageList