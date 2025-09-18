// components/ConversationItem.js
import React from 'react';
import { Avatar, Flex, Text } from '@chakra-ui/react';

const ConversationItem = ({ conversation, isSelected, onClick }) => {
  return (
    <div
      className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
        isSelected ? "bg-blue-50 border-blue-200" : ""
      }`}
      onClick={() => onClick(conversation)}
    >
      <Flex align="center" gap={3}>
        <Avatar src={conversation.conversationAvatar} size="md" />
        <div className="flex-1 min-w-0">
          <Text fontWeight="medium" fontSize="sm" noOfLines={1}>
            {conversation.conversationName}
          </Text>
          <Text fontSize="xs" color="gray.500" noOfLines={1}>
            {conversation.lastMessage || "Start conversation"}
          </Text>
        </div>
      </Flex>
    </div>
  );
};

export default ConversationItem;
