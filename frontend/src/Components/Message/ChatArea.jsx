import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Image, Mic, Paperclip, PlusCircle, Send, Loader } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import MessageBubble from './MessageBubble';
import MediaPreview from './MediaPreview';
import { uploadToCloudnary } from '../../Config/UploadToCloudnary';

const ChatArea = ({ conversation, messages, onSendMessage, isConnected, currentUserId }) => {
  const [input, setInput] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      return isImage || isVideo;
    });
    
    if (validFiles.length !== files.length) {
      toast.error('Chỉ chấp nhận file ảnh và video', {
        duration: 3000,
        position: 'top-center',
      });
    }
    
    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = useCallback(async () => {
    if ((!input.trim() && selectedFiles.length === 0) || !conversation || !isConnected) {
      return;
    }

    setIsUploading(true);
    
    const uploadingToast = selectedFiles.length > 0 
      ? toast.loading('Đang tải file lên Cloudinary...', { position: 'bottom-center' })
      : null;
    
    try {
      let attachments = [];
      
      if (selectedFiles.length > 0) {
        const uploadPromises = selectedFiles.map(file => uploadToCloudnary(file));
        attachments = await Promise.all(uploadPromises);
        attachments = attachments.filter(att => att !== null);
        
        const invalidAttachments = attachments.filter(att => !att.url || att.url.trim() === '');
        if (invalidAttachments.length > 0) {
          console.error("❌ Some attachments have empty URLs:", invalidAttachments);
          throw new Error("Some files failed to upload properly");
        }
      }
      
      await onSendMessage(input, attachments);
      
      if (uploadingToast) {
        toast.dismiss(uploadingToast);
      }
      
      setInput("");
      setSelectedFiles([]);
      
      // Focus lại input field ngay lập tức
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    } catch (error) {
      console.error("❌ Error uploading files:", error);
      if (uploadingToast) {
        toast.error('Lỗi khi tải file lên. Vui lòng thử lại.', {
          id: uploadingToast,
          duration: 4000,
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

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
            <Send size={48} className="text-blue-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Chọn cuộc trò chuyện
          </h3>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      <Toaster />
      
      <div className="border-b p-4 bg-white shadow-sm flex items-center gap-3">
        <img 
          src={conversation.conversationAvatar || '/api/placeholder/40/40'} 
          alt={conversation.conversationName}
          className="w-10 h-10 rounded-full"
        />
        <div className="flex-1">
          <h3 className="font-semibold">{conversation.conversationName}</h3>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
            <span>{isConnected ? 'Đang hoạt động' : 'Không có kết nối'}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            Chưa có tin nhắn. Hãy bắt đầu cuộc trò chuyện!
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble 
                key={msg.id} 
                msg={msg} 
                currentUserId={currentUserId}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div className="border-t p-4 bg-white">
        {selectedFiles.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1 p-3 bg-gray-50 rounded-lg max-h-32 overflow-y-auto">
            {selectedFiles.map((file, idx) => (
              <MediaPreview key={idx} file={file} onRemove={() => removeFile(idx)} />
            ))}
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            multiple
            accept="image/*,video/*"
            className="hidden"
          />
          
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <PlusCircle size={22} className="text-gray-600" />
          </button>
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={isUploading}
            title="Chọn ảnh hoặc video"
          >
            <Image size={22} className="text-gray-600" />
          </button>
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={isUploading}
            title="Đính kèm file"
          >
            <Paperclip size={22} className="text-gray-600" />
          </button>
          
          <input
            ref={inputRef}
            type="text"
            className="flex-1 border-2 rounded-full px-4 py-2 focus:outline-none focus:border-blue-500 transition-colors"
            placeholder="Nhập tin nhắn..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={isUploading}
          />
          
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Mic size={22} className="text-gray-600" />
          </button>
          
          <button
            onClick={handleSend}
            disabled={(!input.trim() && selectedFiles.length === 0) || isUploading}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-full p-2 transition-colors relative"
          >
            {isUploading ? (
              <Loader size={22} className="animate-spin" />
            ) : (
              <Send size={22} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;