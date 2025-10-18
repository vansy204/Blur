import React, { useMemo } from 'react';
import { Check, CheckCheck, Clock } from 'lucide-react';
import MessageAttachment from './MessageAttachment';

const MessageBubble = React.memo(({ msg, currentUserId }) => {
  const isMe = msg.senderId === currentUserId;
  
  // Memoize time formatting để tránh recalculate mỗi render
  const time = useMemo(() => {
    const date = new Date(msg.createdDate || Date.now());
    return date.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }, [msg.createdDate]);

  // Memoize sender name
  const senderName = useMemo(() => {
    if (!msg.sender) return '';
    const firstName = msg.sender.firstName || '';
    const lastName = msg.sender.lastName || '';
    return `${firstName} ${lastName}`.trim() || msg.sender.username || 'User';
  }, [msg.sender]);

  // Determine message status icon
  const StatusIcon = useMemo(() => {
    if (msg.isPending) return <Clock size={14} className="ml-1" />;
    if (msg.isRead) return <CheckCheck size={14} className="ml-1" />;
    return <Check size={14} className="ml-1" />;
  }, [msg.isPending, msg.isRead]);

  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-1 px-4 group`}>
      <div className={`flex items-end gap-2 max-w-[70%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar - Chỉ hiển thị cho người khác */}
        {!isMe && (
          <div className="w-8 h-8 rounded-full flex-shrink-0 mb-1 overflow-hidden bg-gradient-to-br from-sky-300 to-blue-400 p-[1.5px]">
            <img 
              src={msg.sender?.avatar || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png'} 
              alt={senderName}
              className="w-full h-full rounded-full object-cover bg-white"
              loading="lazy"
            />
          </div>
        )}
        
        <div className="flex flex-col max-w-full">
          {/* Tên người gửi - Chỉ cho người khác */}
          {!isMe && senderName && (
            <span className="text-xs font-medium text-gray-600 mb-1 px-3">
              {senderName}
            </span>
          )}
          
          {/* Message Bubble */}
          <div className={`relative ${msg.isPending ? 'opacity-70' : ''}`}>
            <div className={`px-4 py-2.5 rounded-3xl shadow-sm transition-all ${
              isMe 
                ? 'bg-gradient-to-br from-sky-500 via-blue-600 to-cyan-600 text-white rounded-br-md' 
                : 'bg-gray-100 text-gray-900 rounded-bl-md border border-gray-200'
            }`}>
              {/* Attachments - Hiển thị trước */}
              {msg.attachments && msg.attachments.length > 0 && (
                <div className={`space-y-2 ${msg.message ? 'mb-2' : ''}`}>
                  {msg.attachments.map((att, idx) => (
                    <MessageAttachment 
                      key={att.id || idx} 
                      attachment={att} 
                      isMe={isMe} 
                    />
                  ))}
                </div>
              )}
              
              {/* Text message */}
              {msg.message && (
                <div className="break-words whitespace-pre-wrap text-[15px] leading-5">
                  {msg.message}
                </div>
              )}
              
              {/* Time & Status - Inline với message nếu là tin nhắn của mình */}
              {isMe && (
                <div className="flex items-center justify-end gap-1 mt-1">
                  <span className="text-[11px] text-blue-100 opacity-90">
                    {time}
                  </span>
                  <span className="text-blue-100 opacity-90">
                    {StatusIcon}
                  </span>
                </div>
              )}
            </div>
            
            {/* Timestamp - Hiển thị khi hover cho tin nhắn người khác */}
            {!isMe && (
              <span className="absolute -bottom-5 left-0 text-[11px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {time}
              </span>
            )}
            
            {/* Pending indicator */}
            {msg.isPending && (
              <span className={`absolute -bottom-5 text-[11px] text-blue-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap ${
                isMe ? 'right-0' : 'left-0'
              }`}>
                <Clock size={12} className="inline mr-1" />
                Đang gửi...
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

MessageBubble.displayName = 'MessageBubble';

export default MessageBubble;