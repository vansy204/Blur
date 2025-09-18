
// components/Sidebar.js
import React from 'react';
import { Text, Flex, Button } from '@chakra-ui/react';
import { Plus, Wifi, WifiOff } from 'lucide-react';
import ConversationsList from './ConversationsList';
import UserSearch from './UserSearch';

const Sidebar = ({ 
  isConnected, 
  showUserSearch, 
  onToggleUserSearch,
  searchQuery,
  onSearch,
  filteredUsers,
  onSelectUser,
  conversations,
  selectedConversation,
  onSelectConversation
}) => {
  return (
    <div className="w-80 border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <Text fontSize="xl" fontWeight="bold">Messages</Text>
        <Flex align="center" gap={2}>
          {isConnected ? (
            <Wifi size={20} className="text-green-500" />
          ) : (
            <WifiOff size={20} className="text-red-500" />
          )}
          <Button
            size="sm"
            leftIcon={<Plus size={16} />}
            onClick={onToggleUserSearch}
            colorScheme="blue"
            variant="ghost"
          >
            New
          </Button>
        </Flex>
      </div>

      {/* User Search */}
      {showUserSearch && (
        <UserSearch
          searchQuery={searchQuery}
          onSearch={onSearch}
          filteredUsers={filteredUsers}
          onSelectUser={onSelectUser}
        />
      )}

      {/* Conversations List */}
      <ConversationsList
        conversations={conversations}
        selectedConversation={selectedConversation}
        onSelectConversation={onSelectConversation}
      />
    </div>
  );
};

export default Sidebar;