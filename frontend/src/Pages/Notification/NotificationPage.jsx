import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import Header from '../../Components/Notification/Header';
import NotificationItem from '../../Components/Notification/NotificationItem';
import { getToken } from '../../service/LocalStorageService';
import { fetchPostById } from "../../api/postApi";
import { jwtDecode } from 'jwt-decode';
import { getAllNotifications, markAllNotificationsAsRead, markNotificationAsRead } from '../../api/notificationAPI';
import { useToast } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const token = getToken();
  const toast = useToast();
  const navigate = useNavigate();

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
      try {
        setIsLoading(true);
        const result = await getAllNotifications(token, userId);
        setNotifications(result || []);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        setIsLoading(false);
      }
    };
    getNotifications();
  }, [token, userId]);

  const unreadCount = notifications.filter(n => !n.seen).length;

  const handleMarkRead = async (id) => {
    try {
      await markNotificationAsRead(token, id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, seen: true } : n)
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead(token);
      toast({
        title: "All marked as read",
        status: "success",
        duration: 2000,
        isClosable: true,
        position: "top-right",
      });
      setNotifications(prev => prev.map(n => ({ ...n, seen: true })));
    } catch (error) {
      console.error("Error marking all as read:", error);
      toast({
        title: "Failed to mark all as read",
        status: "error",
        duration: 2000,
        isClosable: true,
        position: "top-right",
      });
    }
  };

  // ✅ Khi click vào notification → mở bài viết chi tiết
  const handleNotificationClick = async (notification) => {
    if (!notification.postId) {
      toast({
        title: "Notification không có bài viết liên kết",
        status: "info",
        duration: 2000,
        isClosable: true,
        position: "top-right",
      });
      return;
    }

    try {
      // Mark as read
      if (!notification.seen) {
        await markNotificationAsRead(token, notification.id);
        setNotifications(prev =>
          prev.map(n => n.id === notification.id ? { ...n, seen: true } : n)
        );
      }

      // Fetch post detail
      const post = await fetchPostById(notification.postId, token);

      if (!post) {
        toast({
          title: "Không tìm thấy bài viết",
          status: "warning",
          duration: 2000,
          isClosable: true,
          position: "top-right",
        });
        return;
      }

      // Navigate đến PostDetailPage
      navigate(`/post/${notification.postId}`, { state: { post } });

    } catch (error) {
      console.error("Error opening post:", error);
      toast({
        title: "Không thể mở bài viết",
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

  const sortedNotifications = [...filteredNotifications].sort((a, b) => {
    if (a.seen === b.seen) return 0;
    return a.seen ? 1 : -1;
  });

  const LoadingSkeleton = () => (
    <div className="space-y-3 p-4">
      {[...Array(5)].map((_, index) => (
        <div key={index} className="flex items-start gap-4 p-4 bg-white rounded-xl border border-gray-100 animate-pulse">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-100 to-blue-100"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-100 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="w-24 h-24 bg-gradient-to-br from-sky-100 to-blue-100 rounded-full flex items-center justify-center mb-6 animate-pulse">
        <Bell size={40} className="text-sky-500" />
      </div>
      <h3 className="text-xl font-bold text-gray-800 mb-2">
        {searchTerm ? 'No matching notifications' : 'All caught up!'}
      </h3>
      <p className="text-gray-500 text-sm max-w-sm mb-4">
        {searchTerm 
          ? `No notifications found for "${searchTerm}"`
          : "You're all up to date. New notifications will appear here."
        }
      </p>
      {searchTerm && (
        <button
          onClick={() => setSearchTerm('')}
          className="px-6 py-2 bg-gradient-to-r from-sky-400 to-blue-500 text-white rounded-xl font-semibold hover:from-sky-500 hover:to-blue-600 transition-all shadow-md hover:shadow-lg"
        >
          Clear search
        </button>
      )}
    </div>
  );

  return (
    <div className="max-w-full min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col">
      <Header
        unreadCount={unreadCount}
        onMarkAllRead={handleMarkAllRead}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      <div className="flex-grow overflow-auto">
        {isLoading ? (
          <LoadingSkeleton />
        ) : sortedNotifications.length > 0 ? (
          <div className="p-4 space-y-2">
            {sortedNotifications.map((notification) => (
              <NotificationItem 
                key={notification.id} 
                notification={notification}
                onMarkRead={handleMarkRead}
                onClick={() => handleNotificationClick(notification)} // ✅ thêm vào đây
              />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
