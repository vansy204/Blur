import React, { useMemo } from 'react';
import { Check, CheckCheck, Phone, Video } from 'lucide-react';
import MessageAttachment from './MessageAttachment';

const MessageBubble = React.memo(({ msg, currentUserId }) => {
  const isMe = msg.senderId === currentUserId;
  
  // Memoize time formatting - chỉ format 1 lần
  const time = useMemo(() => {
    const date = new Date(msg.createdDate || Date.now());
    return date.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }, [msg.createdDate]);

  // Memoize sender name - tránh string concatenation mỗi render
  const senderName = useMemo(() => {
    if (!msg.sender) return '';
    const firstName = msg.sender.firstName || '';
    const lastName = msg.sender.lastName || '';
    return `${firstName} ${lastName}`.trim() || msg.sender.username || 'User';
  }, [msg.sender]);

  // Determine message status icon - chỉ render khi status thay đổi
  const StatusIcon = useMemo(() => {
    if (msg.isPending) return null;
    if (msg.isRead) return <CheckCheck size={12} strokeWidth={2.5} />;
    return <Check size={12} strokeWidth={2.5} />;
  }, [msg.isPending, msg.isRead]);

  // Memoize có attachment hay không
  const hasAttachments = useMemo(() => 
    msg.attachments && msg.attachments.length > 0,
    [msg.attachments]
  );

  // Memoize có text hay không
  const hasText = useMemo(() => 
    msg.message && msg.message.trim().length > 0,
    [msg.message]
  );

  // ✅ Check if message is a call
  const isCallMessage = useMemo(() => 
    msg.messageType === 'VOICE_CALL' || msg.messageType === 'VIDEO_CALL',
    [msg.messageType]
  );

  // ✅ RENDER CALL MESSAGE
  if (isCallMessage) {
    const isVideoCall = msg.messageType === 'VIDEO_CALL';
    
    return (
      <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-0.5 group`}>
        <div className={`flex items-end gap-2 max-w-[70%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
          {/* Avatar - Chỉ hiển thị cho người khác */}
          {!isMe && (
            <div className="w-7 h-7 rounded-full flex-shrink-0 mb-0.5 overflow-hidden">
              <img 
                src={msg.sender?.avatar || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png'} 
                alt={senderName}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          )}
          
          <div className="flex flex-col max-w-full">
            {/* Tên người gửi - Chỉ cho người khác */}
            {!isMe && senderName && (
              <span className="text-xs font-normal text-gray-500 mb-1 px-3 opacity-0 group-hover:opacity-100 transition-opacity">
                {senderName}
              </span>
            )}
            
            {/* Call Message Bubble */}
            <div className={`relative ${msg.isPending ? 'opacity-60' : ''}`}>
              <div className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-[20px] ${
                isMe 
                  ? 'bg-blue-500 text-white rounded-br-md' 
                  : 'bg-gray-100 text-gray-700 rounded-bl-md border border-gray-200'
              }`}>
                {/* Call Icon */}
                {isVideoCall ? (
                  <Video size={18} className={isMe ? 'text-white' : 'text-gray-600'} />
                ) : (
                  <Phone size={18} className={isMe ? 'text-white' : 'text-gray-600'} />
                )}
                
                {/* Call Message */}
                <span className="text-[15px] font-normal whitespace-nowrap">
                  {msg.message}
                </span>
              </div>
              
              {/* Time - Hiển thị bên ngoài bubble */}
              <div className={`flex items-center gap-1 mt-0.5 ${
                isMe ? 'justify-end' : 'justify-start'
              } opacity-0 group-hover:opacity-100 transition-opacity`}>
                <span className="text-[11px] text-gray-400 font-normal">
                  {time}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ✅ RENDER NORMAL MESSAGE (TEXT/IMAGE/VIDEO/FILE)
  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-0.5 group`}>
      <div className={`flex items-end gap-2 max-w-[70%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar - Chỉ hiển thị cho người khác */}
        {!isMe && (
          <div className="w-7 h-7 rounded-full flex-shrink-0 mb-0.5 overflow-hidden">
            <img 
              src={msg.sender?.avatar || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png'} 
              alt={senderName}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}
        
        <div className="flex flex-col max-w-full">
          {/* Tên người gửi - Chỉ cho người khác, ẩn mặc định */}
          {!isMe && senderName && (
            <span className="text-xs font-normal text-gray-500 mb-1 px-3 opacity-0 group-hover:opacity-100 transition-opacity">
              {senderName}
            </span>
          )}
          
          {/* Message Bubble */}
          <div className={`relative ${msg.isPending ? 'opacity-60' : ''}`}>
            {/* Main Bubble Container */}
            <div className={`inline-block max-w-full ${
              isMe 
                ? 'bg-blue-500 text-white rounded-[20px] rounded-br-md' 
                : 'bg-gray-100 text-black rounded-[20px] rounded-bl-md border border-gray-200'
            }`}>
              {/* Attachments - Hiển thị trước */}
              {hasAttachments && (
                <div className={`${hasText ? 'mb-1' : ''}`}>
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
              {hasText && (
                <div className={`px-3 py-2 break-words whitespace-pre-wrap text-[15px] leading-[18px] font-normal ${
                  hasAttachments ? 'pt-0' : ''
                }`}>
                  {msg.message}
                </div>
              )}
            </div>
            
            {/* Status & Time - Hiển thị bên ngoài bubble */}
            <div className={`flex items-center gap-1 mt-0.5 ${
              isMe ? 'justify-end' : 'justify-start'
            } opacity-0 group-hover:opacity-100 transition-opacity`}>
              <span className="text-[11px] text-gray-400 font-normal">
                {time}
              </span>
              {isMe && StatusIcon && (
                <span className="text-gray-400">
                  {StatusIcon}
                </span>
              )}
              {msg.isPending && (
                <span className="text-[11px] text-gray-400 font-normal">
                  • Đang gửi
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function cho React.memo
  // Chỉ re-render khi những props quan trọng thay đổi
  return (
    prevProps.msg.id === nextProps.msg.id &&
    prevProps.msg.message === nextProps.msg.message &&
    prevProps.msg.messageType === nextProps.msg.messageType && // ✅ ADD THIS
    prevProps.msg.isPending === nextProps.msg.isPending &&
    prevProps.msg.isRead === nextProps.msg.isRead &&
    prevProps.msg.attachments === nextProps.msg.attachments &&
    prevProps.currentUserId === nextProps.currentUserId
  );
});

MessageBubble.displayName = 'MessageBubble';

export default MessageBubble;