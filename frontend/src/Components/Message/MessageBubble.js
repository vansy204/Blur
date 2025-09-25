// components/MessageBubble.js
import React from 'react';
import { Avatar, Text } from '@chakra-ui/react';

const MessageBubble = ({ message }) => {
  return (
    <div className={`flex ${message.me ? "justify-end" : "justify-start"}`}>
      {!message.me && (
        <Avatar src={message.sender?.avatar} size="xs" mr={2} />
      )}
      <div
        className={`max-w-xs px-3 py-2 rounded-lg ${
          message.me
            ? message.failed
              ? "bg-red-100 text-red-800"
              : "bg-blue-500 text-white"
            : "bg-gray-100 text-gray-800"
        } ${message.pending ? "opacity-60" : ""}`}
      >
        <Text fontSize="sm">{message.message}</Text>
        <Text fontSize="xs" className="mt-1 opacity-70">
          {message.failed 
            ? "Failed" 
            : message.pending 
              ? "Sending..." 
              : new Date(message.createdDate).toLocaleTimeString()
          }
        </Text>
      </div>
    </div>
  );
};

export default MessageBubble;