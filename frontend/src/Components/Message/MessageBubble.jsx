import React from 'react';
import MessageAttachment from './MessageAttachment';

const MessageBubble = React.memo(({ msg, currentUserId }) => {
  const isMe = msg.senderId === currentUserId;
  const time = new Date(msg.createdDate || Date.now()).toLocaleTimeString('vi-VN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-2 px-4`}>
      <div className={`flex items-end gap-2 max-w-[70%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar - Chỉ hiển thị cho người khác */}
        {!isMe && (
          <img 
            src={msg.sender?.avatar || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png'} 
            alt={msg.sender?.username || 'User'}
            className="w-7 h-7 rounded-full flex-shrink-0 mb-1"
          />
        )}
        
        <div className="flex flex-col">
          {/* Tên người gửi - Chỉ cho người khác */}
          {!isMe && msg.sender?.firstName && (
            <span className="text-xs text-gray-500 mb-1 px-3">
              {msg.sender.firstName} {msg.sender.lastName}
            </span>
          )}
          
          {/* Message Bubble */}
          <div className={`relative group ${msg.isPending ? 'opacity-70' : ''}`}>
            <div className={`px-3 py-2 rounded-2xl shadow-sm transition-all ${
              isMe 
                ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-md' 
                : 'bg-gray-100 text-gray-900 rounded-bl-md'
            }`}>
              {/* Text message */}
              {msg.message && (
                <div className="break-words whitespace-pre-wrap leading-5">
                  {msg.message}
                </div>
              )}
              
              {/* Attachments */}
              {msg.attachments && msg.attachments.length > 0 && (
                <div className={`space-y-2 ${msg.message ? 'mt-2' : ''}`}>
                  {msg.attachments.map((att, idx) => (
                    <MessageAttachment key={att.id || idx} attachment={att} isMe={isMe} />
                  ))}
                </div>
              )}
            </div>
            
            {/* Timestamp - Hiển thị khi hover */}
            <span className={`absolute -bottom-5 text-[11px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity ${
              isMe ? 'right-0' : 'left-0'
            }`}>
              {time} {msg.isPending && <span className="text-blue-500">⏳ Đang gửi...</span>}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

export default MessageBubble;