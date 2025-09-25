// components/ChatHeader.js
import React from 'react';
import { Avatar, Flex, Text } from '@chakra-ui/react';

const ChatHeader = ({ conversation, isConnected }) => {
  return (
    <div className="p-4 border-b border-gray-200">
      <Flex align="center" gap={3}>
        <Avatar src={conversation.conversationAvatar} size="sm" />
        <div>
          <Text fontWeight="medium">{conversation.conversationName}</Text>
          <Text fontSize="xs" color="gray.500">
            {isConnected ? "Online" : "Connecting..."}
          </Text>
        </div>
      </Flex>
    </div>
  );
};

export default ChatHeader;