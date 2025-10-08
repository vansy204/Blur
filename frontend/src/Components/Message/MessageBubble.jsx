import React from 'react';
import MessageAttachment from './MessageAttachment';

const MessageBubble = React.memo(({ msg, currentUserId }) => {
  const isMe = msg.senderId === currentUserId;
  const time = new Date(msg.createdDate || Date.now()).toLocaleTimeString('vi-VN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex items-end gap-2 max-w-[70%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
        {!isMe && (
          <img 
            src={msg.sender?.avatar || '/api/placeholder/32/32'} 
            alt={msg.sender?.username || 'User'}
            className="w-8 h-8 rounded-full flex-shrink-0"
          />
        )}
        <div className="flex flex-col">
          {!isMe && msg.sender?.firstName && (
            <span className="text-xs text-gray-500 mb-1 ml-2">
              {msg.sender.firstName} {msg.sender.lastName}
            </span>
          )}
          <div className={`px-4 py-2 rounded-2xl ${
            isMe 
              ? 'bg-blue-500 text-white rounded-br-sm' 
              : 'bg-gray-200 text-gray-900 rounded-bl-sm'
          } ${msg.isPending ? 'opacity-60' : ''}`}>
            {msg.message && (
              <div className="break-words mb-2">{msg.message}</div>
            )}
            {msg.attachments && msg.attachments.length > 0 && (
              <div className="space-y-2 mt-2">
                {msg.attachments.map((att, idx) => (
                  <MessageAttachment key={att.id || idx} attachment={att} />
                ))}
              </div>
            )}
          </div>
          <span className={`text-xs text-gray-400 mt-1 ${isMe ? 'text-right mr-2' : 'text-left ml-2'}`}>
            {time} {msg.isPending && '⏳'}
          </span>
        </div>
      </div>
    </div>
  );
});

export default MessageBubble;