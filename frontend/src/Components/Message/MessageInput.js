// components/MessageInput.js
import React from 'react';
import { Flex, Input, Button } from '@chakra-ui/react';
import { Send } from 'lucide-react';

const MessageInput = ({ 
  message, 
  onChange, 
  onSend, 
  isConnected 
}) => {
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      onSend();
    }
  };

  return (
    <div className="p-4 border-t border-gray-200">
      <Flex gap={2}>
        <Input
          placeholder={isConnected ? "Type a message..." : "Connecting..."}
          value={message}
          onChange={(e) => onChange(e.target.value)}
          disabled={!isConnected}
          onKeyPress={handleKeyPress}
        />
        <Button
          leftIcon={<Send size={16} />}
          onClick={onSend}
          isDisabled={!message.trim() || !isConnected}
          colorScheme="blue"
        >
          Send
        </Button>
      </Flex>
    </div>
  );
};

export default MessageInput;