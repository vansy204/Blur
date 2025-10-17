import React from 'react';
import UserSearchBar from './UserSearchBar';
import { useUnreadMessages } from '../../hooks/useUnreadMessages';

const ConversationList = ({ conversations, selected, onSelect, onSelectUser }) => {
  // 🔥 Lấy unread count từ hook
  const { unreadByConversation } = useUnreadMessages();

  return (
    <div className="w-80 border-r bg-white overflow-y-auto flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-blue-500 to-blue-600">
        <h2 className="text-lg font-semibold text-white">Tin nhắn</h2>
      </div>
      
      {/* User Search Bar */}
      <UserSearchBar onSelectUser={onSelectUser} />
      
      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="mb-2">Chưa có cuộc trò chuyện</p>
          </div>
        ) : (
          <div className="divide-y">
            {conversations.map((conv) => {
              const isSelected = selected?.id === conv.id;
              
              // 🔥 Lấy unread count cho conversation này
              const unreadCount = unreadByConversation[conv.id] || 0;
              const hasUnread = unreadCount > 0;
              
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
                    isSelected 
                      ? 'bg-blue-50 border-l-4 border-l-blue-500' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <img 
                      src={conv.conversationAvatar || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png'} 
                      alt={conv.conversationName}
                      className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                    />
                    {/* Online indicator */}
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0 ml-3">
                    <div className="flex items-center justify-between mb-1">
                      {/* Name - Bold nếu có unread */}
                      <h3 className={`truncate ${
                        hasUnread ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'
                      }`}>
                        {conv.conversationName}
                      </h3>
                      
                      {/* Time - Blue nếu có unread */}
                      {messageTime && (
                        <span className={`text-xs ml-2 flex-shrink-0 ${
                          hasUnread ? 'text-blue-600 font-semibold' : 'text-gray-400'
                        }`}>
                          {messageTime}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between gap-2">
                      {/* Last message - Bold nếu có unread */}
                      <p className={`text-sm truncate ${
                        hasUnread ? 'text-gray-900 font-medium' : 'text-gray-500'
                      }`}>
                        {conv.lastMessage || 'Chưa có tin nhắn'}
                      </p>
                      
                      {/* 🔥 UNREAD BADGE */}
                      {hasUnread && (
                        <div className="flex-shrink-0 min-w-[20px] h-5 px-2 flex items-center justify-center bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-bold rounded-full shadow-md animate-pulse">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </div>
                      )}
                    </div>
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