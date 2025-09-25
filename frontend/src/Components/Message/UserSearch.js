
// components/UserSearch.js
import React from 'react';
import { Input, Avatar, Text } from '@chakra-ui/react';
import { Search } from 'lucide-react';

const UserSearch = ({ searchQuery, onSearch, filteredUsers, onSelectUser }) => {
  return (
    <div className="p-4 border-b border-gray-200">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-3 text-gray-400" />
        <Input
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => onSearch(e.target.value)}
          pl={10}
        />
      </div>
      
      {filteredUsers.length > 0 && (
        <div className="mt-2 max-h-40 overflow-y-auto">
          {filteredUsers.map((user) => (
            <div
              key={user.userId}
              className="flex items-center p-2 hover:bg-gray-100 cursor-pointer rounded"
              onClick={() => onSelectUser(user)}
            >
              <Avatar src={user.imageUrl} size="sm" mr={2} />
              <Text fontSize="sm">{user.firstName} {user.lastName}</Text>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserSearch;