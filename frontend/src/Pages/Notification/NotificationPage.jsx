import { useState, useEffect } from 'react';
import {

  Bell,
} from 'lucide-react';
import Header from '../../Components/Notification/Header';

import NotificationItem from '../../Components/Notification/NotificationItem';
import { getToken } from '../../service/LocalStorageService';
import {jwtDecode} from 'jwt-decode';
import { getAllNotifications, markAllNotificationsAsRead, markNotificationAsRead } from '../../api/notificationAPI';
import { useToast } from '@chakra-ui/react';
import { connectNotificationSocket, disconnectNotificationSocket } from '../../service/notificationSocket';
// Main Page component
const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const token = getToken();
  const toast = useToast();
  let userId = "";
  if (token) {
    const decodedToken = jwtDecode(token);
    userId = decodedToken.sub;
  }

  useEffect(() => {
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.margin = '';
      document.body.style.padding = '';
      document.body.style.overflow = '';
    };

  }, []);
  useEffect(() => {
    const getNotifications = async () => {
      try{
        const result = await getAllNotifications(token, userId);
        setNotifications(result || []);
      }catch (error) {
        console.error("Error fetching notifications:", error);
      }
    }
    getNotifications();
  },[token,notifications]);
  useEffect(() => {
    connectNotificationSocket((newNotification) => {
      setNotifications(prev => [newNotification, ...prev]);
      toast({
        title: "New notification received",
        description: newNotification.content,
        status: "info",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
    }
  );
    return () => {
      disconnectNotificationSocket();
    };
  }, [token]);
  const unreadCount = notifications.filter(n => !n.seen).length;

  const handleMarkRead = (id) => {
    try{
      const result = markNotificationAsRead(token, id);
      toast({
        title: result.message || "Notification marked as read",
        status: "success",
        duration: 2000,
        isClosable: true,
        position: "top-right",
      });
        setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, seen: true } : n)
    );
    }catch (error) {
      console.error("Error marking notification as read:", error);
      toast({
        title: "Failed to mark notification as read",
        status: "error",
        duration: 2000,
        isClosable: true,
        position: "top-right",
      });
    }
  
  };

  const handleMarkAllRead = () => {
    try{
      const result = markAllNotificationsAsRead(token)
       toast({
        title: result.message || "Notification marked as read",
        status: "success",
        duration: 2000,
        isClosable: true,
        position: "top-right",
      });
       setNotifications(prev => 
      prev.map(n => ({ ...n, seen: true }))
    );
  
    }catch (error) {
      console.error("Error marking notification as read:", error);
      toast({
        title: "Failed to mark notification as read",
        status: "error",
        duration: 2000,
        isClosable: true,
        position: "top-right",
      });
    }
   
  };

const filteredNotifications = notifications.filter(notification =>
  (notification.user && notification.user.toLowerCase().includes(searchTerm.toLowerCase())) ||
  (notification.content && notification.content.toLowerCase().includes(searchTerm.toLowerCase()))
);

  // Sort notifications: unread first
  const sortedNotifications = [...filteredNotifications].sort((a, b) => {
    if (a.seen === b.seen) return 0;
    return a.seen ? 1 : -1;
  });

  return (
    <div className="max-w-full min-h-screen bg-white flex flex-col">
      <Header
        unreadCount={unreadCount}
        onMarkAllRead={handleMarkAllRead}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      <div className="flex-grow overflow-auto">
        {sortedNotifications.length > 0 ? (
          <div className="group">
            {sortedNotifications.map((notification) => (
              <NotificationItem 
                key={notification.id} 
                notification={notification}
                onMarkRead={handleMarkRead}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Bell size={24} className="text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm ? 'No matching notifications' : 'All caught up!'}
            </h3>
            <p className="text-gray-500 text-sm max-w-sm">
              {searchTerm 
                ?  `No notifications found for ${searchTerm}`
                : "You're all up to date. New notifications will appear here."
              }
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Clear search
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;