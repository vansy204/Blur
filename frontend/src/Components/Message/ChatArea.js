// components/ChatArea.js
import React from 'react';
import { Text } from '@chakra-ui/react';
import ChatHeader from './ChatHeader';
import MessagesList from './MessagesList';
import MessageInput from './MessageInput';

const ChatArea = ({ 
  selectedConversation,
  messages,
  isConnected,
  message,
  onMessageChange,
  onSendMessage
}) => {
  if (!selectedConversation) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Text color="gray.500">Select a conversation to start messaging</Text>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <ChatHeader 
        conversation={selectedConversation} 
        isConnected={isConnected} 
      />
      <MessagesList messages={messages} />
      <MessageInput
        message={message}
        onChange={onMessageChange}
        onSend={onSendMessage}
        isConnected={isConnected}
      />
    </div>
  );
};

export default ChatArea;
