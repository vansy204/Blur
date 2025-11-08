import React, { createContext, useContext, useState, useCallback } from "react";
import { X, MessageCircle } from "lucide-react";

// ===== CONTEXT =====
const NotificationContext = createContext(null);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within NotificationProvider");
  }
  return context;
};

export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) {
    console.log("Browser không hỗ trợ notification");
    return false;
  }

  if (Notification.permission === "granted") return true;
  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }
  return false;
};

// ===== TOAST COMPONENT =====
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
        <img
          src={
            notification.avatar ||
            "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png"
          }
          alt={notification.senderName}
          className="w-12 h-12 rounded-full object-cover border-2 border-blue-500"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle size={16} className="text-blue-500" />
              <h4 className="font-semibold text-gray-900 truncate">
                {notification.senderName}
              </h4>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose(notification.id);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
            {notification.message || "Đã gửi tệp đính kèm"}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {formatTime(notification.createdDate)}
          </p>
        </div>
      </div>
    </div>
  );
};

// ===== PROVIDER =====
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [mode, setMode] = useState("toast");
  const [notificationCounter, setNotificationCounter] = useState(0);

  const addNotification = useCallback((notificationData) => {
    console.log("🔔 Adding notification:", notificationData); // Debug log
    
    setNotifications((prev) => {
      if (!notificationData?.id) {
        console.warn("⚠️ Notification missing ID");
        return prev;
      }
      
      const exists = prev.some((n) => n.id === notificationData.id);
      if (exists) {
        console.log("⚠️ Notification already exists:", notificationData.id);
        return prev;
      }

      const notification = {
        id: notificationData.id,
        senderName: notificationData.senderName,
        avatar: notificationData.avatar,
        message: notificationData.message,
        createdDate: notificationData.createdDate || new Date().toISOString(),
        type: notificationData.type || "general",
        seen: notificationData.seen ?? false,
        postId: notificationData.postId, // ⭐ THÊM DÒNG NÀY
      };

      playNotificationSound();
      if (document.hidden) showBrowserNotification(notification);
      setNotificationCounter(c => c + 1);
      console.log("✅ Notification added to state"); // Debug log
      return [notification, ...prev];
    });
  }, []);

  const setNotificationsList = useCallback((list) => {
    setNotifications(list);
  }, []);

  const removeNotification = useCallback((notificationId) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  }, []);

  const handleNotificationClick = useCallback(
    (notification) => {
      if (notification.onClick) notification.onClick(notification);
      removeNotification(notification.id);
    },
    [removeNotification]
  );

  const value = {
    notifications,
    addNotification,
    removeNotification,
    setNotificationsList,
    setMode,
    mode,
    notificationCounter,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] space-y-3 max-h-screen overflow-y-auto pointer-events-none">
        <div className="pointer-events-auto">
          {mode === "toast" &&
            notifications.map((notification) => (
              <MessageToast
                key={notification.id}
                notification={notification}
                onClose={removeNotification}
                onClick={handleNotificationClick}
              />
            ))}
        </div>
      </div>
    </NotificationContext.Provider>
  );
};

// ===== Helpers =====
const formatTime = (dateString) => {
  if (!dateString) return "Vừa xong";
  const date = new Date(dateString);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return "Vừa xong";
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
};

const playNotificationSound = () => {
  try {
    const audio = new Audio("/notification.mp3");
    audio.play().catch(() => {});
  } catch {}
};

const showBrowserNotification = (notification) => {
  if ("Notification" in window && Notification.permission === "granted") {
    const n = new Notification(notification.senderName, {
      body: notification.message,
      icon: notification.avatar,
    });
    setTimeout(() => n.close(), 5000);
  }
};
