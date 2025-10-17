import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, MessageCircle } from 'lucide-react';

// ===== CONTEXT =====
const NotificationContext = createContext(null);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

// ===== TOAST NOTIFICATION COMPONENT =====
const MessageToast = ({ notification, onClose, onClick }) => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose(notification.id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [notification.id, onClose]);

  return (
    <div
      onClick={() => {
        onClick(notification);
        onClose(notification.id);
      }}
      className="bg-white rounded-lg shadow-2xl border border-gray-200 p-4 mb-3 min-w-[320px] max-w-[400px] cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-x-2 animate-slide-in-right"
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <img
            src={notification.avatar || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png'}
            alt={notification.senderName}
            className="w-12 h-12 rounded-full object-cover border-2 border-blue-500"
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <MessageCircle size={16} className="text-blue-500 flex-shrink-0" />
              <h4 className="font-semibold text-gray-900 truncate">
                {notification.senderName}
              </h4>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose(notification.id);
              }}
              className="text-gray-400 hover:text-gray-600 flex-shrink-0 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
            {notification.message || 'Đã gửi tệp đính kèm'}
          </p>

          {notification.attachments && notification.attachments.length > 0 && (
            <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
              <span>📎</span>
              <span>{notification.attachments.length} tệp đính kèm</span>
            </div>
          )}

          <p className="text-xs text-gray-400 mt-1">
            {formatTime(notification.createdDate)}
          </p>
        </div>
      </div>
    </div>
  );
};

// ===== MODAL NOTIFICATION COMPONENT =====
const MessageModal = ({ notification, onClose, onClick }) => {
  if (!notification) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white p-2 rounded-full">
                <MessageCircle size={24} className="text-blue-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Tin nhắn mới</h3>
                <p className="text-sm text-blue-100">
                  {formatTime(notification.createdDate)}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-blue-100 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <img
              src={notification.avatar || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png'}
              alt={notification.senderName}
              className="w-16 h-16 rounded-full object-cover border-4 border-blue-100"
            />
            <div className="flex-1">
              <h4 className="font-bold text-gray-900 text-lg">
                {notification.senderName}
              </h4>
              <p className="text-sm text-gray-500">
                @{notification.senderUsername || 'user'}
              </p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-gray-800 whitespace-pre-wrap break-words">
              {notification.message || 'Đã gửi tệp đính kèm'}
            </p>

            {notification.attachments && notification.attachments.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>📎</span>
                  <span className="font-medium">
                    {notification.attachments.length} tệp đính kèm
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {notification.attachments.slice(0, 3).map((att, idx) => (
                    <div key={idx} className="flex items-center gap-1 bg-white px-3 py-1 rounded-full text-xs border border-gray-200">
                      {att.fileType?.startsWith('image/') ? '🖼️' : 
                       att.fileType?.startsWith('video/') ? '🎥' : '📄'}
                      <span className="truncate max-w-[100px]">
                        {att.fileName || 'File'}
                      </span>
                    </div>
                  ))}
                  {notification.attachments.length > 3 && (
                    <div className="flex items-center px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
                      +{notification.attachments.length - 3} khác
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors font-medium"
          >
            Đóng
          </button>
          <button
            onClick={() => {
              onClick(notification);
              onClose();
            }}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            Xem tin nhắn
          </button>
        </div>
      </div>
    </div>
  );
};

// ===== NOTIFICATION PROVIDER =====
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [mode, setMode] = useState('toast'); // 'toast' | 'modal'

  // Thêm notification mới
  const addNotification = useCallback((notificationData) => {
    const notification = {
      id: notificationData.id || Date.now().toString(),
      conversationId: notificationData.conversationId,
      senderName: notificationData.senderName,
      senderUsername: notificationData.senderUsername,
      avatar: notificationData.avatar,
      message: notificationData.message,
      attachments: notificationData.attachments || [],
      createdDate: notificationData.createdDate || new Date().toISOString(),
      onClick: notificationData.onClick,
    };

    setNotifications(prev => [...prev, notification]);

    // Play sound
    playNotificationSound();

    // Browser notification nếu tab không active
    if (document.hidden) {
      showBrowserNotification(notification);
    }
  }, []);

  // Xóa notification
  const removeNotification = useCallback((notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  // Clear tất cả notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Handle click notification
  const handleNotificationClick = useCallback((notification) => {
    if (notification.onClick) {
      notification.onClick(notification);
    }
    removeNotification(notification.id);
  }, [removeNotification]);

  const value = {
    addNotification,
    removeNotification,
    clearAll,
    setMode,
    mode,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      
      {/* Render notifications */}
      <div className="fixed top-4 right-4 z-[9999] space-y-3 max-h-screen overflow-y-auto notification-container pointer-events-none">
        <div className="pointer-events-auto">
          {mode === 'toast' && notifications.map((notification) => (
            <MessageToast
              key={notification.id}
              notification={notification}
              onClose={removeNotification}
              onClick={handleNotificationClick}
            />
          ))}
        </div>
      </div>

      {/* Modal mode */}
      {mode === 'modal' && notifications.length > 0 && (
        <MessageModal
          notification={notifications[0]}
          onClose={() => removeNotification(notifications[0].id)}
          onClick={handleNotificationClick}
        />
      )}
    </NotificationContext.Provider>
  );
};

// ===== HELPER FUNCTIONS =====

const formatTime = (dateString) => {
  if (!dateString) return 'Vừa xong';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Vừa xong';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
  
  return date.toLocaleTimeString('vi-VN', { 
    hour: '2-digit', 
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit'
  });
};

const playNotificationSound = () => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (error) {
    console.log('Could not play notification sound:', error);
  }
};

const showBrowserNotification = (notification) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    const nativeNotif = new Notification(notification.senderName, {
      body: notification.message || 'Đã gửi tệp đính kèm',
      icon: notification.avatar,
      badge: notification.avatar,
      tag: notification.conversationId,
      requireInteraction: false,
    });

    nativeNotif.onclick = () => {
      window.focus();
      nativeNotif.close();
    };

    setTimeout(() => nativeNotif.close(), 5000);
  }
};

export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('Browser không hỗ trợ notification');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};