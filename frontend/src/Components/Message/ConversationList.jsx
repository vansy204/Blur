import React from 'react';
import UserSearchBar from './UserSearchBar';

const ConversationList = ({ conversations, selected, onSelect, onSelectUser }) => {
  return (
    <div className="w-80 border-r bg-white overflow-y-auto flex flex-col">
      <div className="p-4 border-b bg-gradient-to-r from-blue-500 to-blue-600">
        <h2 className="text-lg font-semibold text-white">Tin nhắn</h2>
      </div>
      
      <UserSearchBar onSelectUser={onSelectUser} />
      
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="mb-2">Chưa có cuộc trò chuyện</p>
          </div>
        ) : (
          <div className="divide-y">
            {conversations.map((conv) => {
              const messageTime = conv.lastMessageTime 
                ? new Date(conv.lastMessageTime).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : '';
              
              return (
                <div
                  key={conv.id}
                  onClick={() => onSelect(conv)}
                  className={`flex items-center p-4 cursor-pointer transition-all ${
                    selected?.id === conv.id 
                      ? 'bg-blue-50 border-l-4 border-l-blue-500' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="relative">
                    <img 
                      src={conv.conversationAvatar || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png'} 
                      alt={conv.conversationName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                  </div>
                  
                  <div className="flex-1 min-w-0 ml-3">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold truncate">{conv.conversationName}</h3>
                      {messageTime && (
                        <span className="text-xs text-gray-400">{messageTime}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {conv.lastMessage || 'Chưa có tin nhắn'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationList;