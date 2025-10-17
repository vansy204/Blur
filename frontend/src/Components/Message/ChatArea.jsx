import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Image, Send, Loader, Smile, Plus, X, Phone, Video, Info } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import MessageBubble from './MessageBubble';
import MediaPreview from './MediaPreview';
import { uploadToCloudnary } from '../../Config/UploadToCloudnary';

const ChatArea = ({ conversation, messages, onSendMessage, isConnected, currentUserId }) => {
  const [input, setInput] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);

  // Optimize scroll với useCallback
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, scrollToBottom]);

  // Memoize file validation để tránh re-calculate
  const validateFiles = useCallback((files) => {
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      return isImage || isVideo;
    });
    
    if (validFiles.length !== files.length) {
      toast.error('Chỉ chấp nhận ảnh và video', {
        duration: 2000,
        style: {
          borderRadius: '16px',
          fontSize: '14px',
          background: '#1e293b',
          color: '#fff',
        }
      });
    }
    
    return validFiles;
  }, []);

  const handleFileSelect = useCallback((e) => {
    const files = Array.from(e.target.files);
    const validFiles = validateFiles(files);
    setSelectedFiles(prev => [...prev, ...validFiles]);
    setShowActions(false);
  }, [validateFiles]);

  const removeFile = useCallback((index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleSend = useCallback(async () => {
    if ((!input.trim() && selectedFiles.length === 0) || !conversation || !isConnected) {
      return;
    }

    setIsUploading(true);
    
    const uploadingToast = selectedFiles.length > 0 
      ? toast.loading('Đang tải lên...', { 
          position: 'bottom-center',
          style: {
            borderRadius: '16px',
            fontSize: '14px',
            background: '#0ea5e9',
            color: '#fff',
          }
        })
      : null;
    
    try {
      let attachments = [];
      
      if (selectedFiles.length > 0) {
        const uploadPromises = selectedFiles.map(file => uploadToCloudnary(file));
        attachments = await Promise.all(uploadPromises);
        attachments = attachments.filter(att => att?.url?.trim());
        
        if (attachments.length !== selectedFiles.length) {
          throw new Error("Upload failed");
        }
      }
      
      await onSendMessage(input, attachments);
      
      if (uploadingToast) {
        toast.dismiss(uploadingToast);
      }
      
      setInput("");
      setSelectedFiles([]);
      
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    } catch (error) {
      console.error("❌ Error uploading:", error);
      if (uploadingToast) {
        toast.error('Không thể tải lên', {
          id: uploadingToast,
          duration: 2000,
          style: {
            borderRadius: '16px',
            fontSize: '14px',
            background: '#dc2626',
            color: '#fff',
          }
        });
      }
    } finally {
      setIsUploading(false);
    }
  }, [input, selectedFiles, conversation, isConnected, onSendMessage]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey && !isUploading) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend, isUploading]);

  // Memoize để tránh re-render không cần thiết
  const canSend = useMemo(() => 
    (input.trim() || selectedFiles.length > 0) && !isUploading,
    [input, selectedFiles.length, isUploading]
  );

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50">
        <div className="text-center">
          <div className="w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-sky-400 via-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-2xl shadow-blue-500/30">
            <Send size={48} className="text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-3">
            Tin nhắn của bạn
          </h3>
          <p className="text-base text-gray-600">
            Gửi ảnh và tin nhắn riêng tư cho bạn bè
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      <Toaster />
      
      {/* Header - Instagram Blue Style */}
      <div className="bg-gradient-to-r from-sky-500 via-blue-600 to-cyan-500 px-4 py-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-sky-300 to-cyan-400 p-[2.5px] shadow-lg">
                <img 
                  src={conversation.conversationAvatar || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png'} 
                  alt={conversation.conversationName}
                  className="w-full h-full rounded-full object-cover bg-white"
                />
              </div>
              {isConnected && (
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-400 border-2 border-white rounded-full shadow-md"></div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white text-base truncate">{conversation.conversationName}</h3>
              {isConnected && (
                <span className="text-xs text-blue-100">Đang hoạt động</span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="w-9 h-9 flex items-center justify-center text-white hover:bg-white/20 rounded-full transition-all">
              <Phone size={20} />
            </button>
            <button className="w-9 h-9 flex items-center justify-center text-white hover:bg-white/20 rounded-full transition-all">
              <Video size={20} />
            </button>
            <button className="w-9 h-9 flex items-center justify-center text-white hover:bg-white/20 rounded-full transition-all">
              <Info size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-sky-50/30 to-white">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 px-4">
            <div className="w-20 h-20 mb-4 bg-gradient-to-br from-sky-100 to-blue-100 rounded-full flex items-center justify-center shadow-lg">
              <Send size={32} className="text-blue-400" />
            </div>
            <p className="text-center text-base font-medium text-gray-600">Chưa có tin nhắn</p>
            <p className="text-center text-sm mt-2 text-gray-400">Bắt đầu cuộc trò chuyện ngay!</p>
          </div>
        ) : (
          <div className="py-4">
            {messages.map((msg) => (
              <MessageBubble 
                key={msg.id} 
                msg={msg} 
                currentUserId={currentUserId}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area - Instagram Blue Style */}
      <div className="bg-white border-t border-gray-100 p-4 shadow-lg">
        {/* File Preview */}
        {selectedFiles.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-blue-600">
                {selectedFiles.length} tệp đã chọn
              </span>
              <button 
                onClick={() => setSelectedFiles([])}
                className="text-sm text-blue-500 font-medium hover:text-blue-700 transition-colors"
              >
                Xóa tất cả
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedFiles.map((file, idx) => (
                <MediaPreview key={idx} file={file} onRemove={() => removeFile(idx)} />
              ))}
            </div>
          </div>
        )}
        
        {/* Input Box */}
        <div className="flex items-center gap-3">
          {/* Actions Button */}
          <div className="relative">
            <button 
              onClick={() => setShowActions(!showActions)}
              className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-sky-500 to-blue-600 text-white hover:from-sky-600 hover:to-blue-700 rounded-full transition-all shadow-md hover:shadow-lg"
            >
              <Plus size={22} />
            </button>
            
            {showActions && (
              <div className="absolute bottom-full left-0 mb-3 bg-white shadow-2xl rounded-2xl p-2 min-w-[200px] border border-blue-100">
                <button
                  onClick={() => {
                    fileInputRef.current?.click();
                    setShowActions(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gradient-to-r hover:from-sky-50 hover:to-blue-50 rounded-xl transition-all text-left group"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-blue-500 rounded-full flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all">
                    <Image size={18} className="text-white" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700 group-hover:text-blue-600">Ảnh/Video</span>
                </button>
              </div>
            )}
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            multiple
            accept="image/*,video/*"
            className="hidden"
          />
          
          {/* Text Input */}
          <div className="flex-1 flex items-center gap-3 bg-gradient-to-r from-sky-50 to-blue-50 rounded-full px-5 py-3 border-2 border-transparent focus-within:border-blue-400 transition-all shadow-sm">
            <input
              ref={inputRef}
              type="text"
              className="flex-1 bg-transparent focus:outline-none text-sm text-gray-900 placeholder-gray-400 font-medium"
              placeholder="Nhắn tin..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isUploading}
            />
            <button className="text-blue-500 hover:text-blue-600 transition-colors hover:scale-110">
              <Smile size={22} />
            </button>
          </div>
          
          {/* Send Button */}
          {canSend && (
            <button
              onClick={handleSend}
              disabled={isUploading}
              className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-sky-500 to-blue-600 text-white hover:from-sky-600 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 rounded-full transition-all shadow-md hover:shadow-lg hover:scale-110 disabled:scale-100"
            >
              {isUploading ? (
                <Loader size={20} className="animate-spin" />
              ) : (
                <Send size={18} />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatArea;