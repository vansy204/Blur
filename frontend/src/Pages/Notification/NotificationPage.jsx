import { useState, useEffect } from 'react';
import {
  Heart,
  MessageCircle,
  Clock,
  UserPlus,
  Bell,
} from 'lucide-react';
import Header from '../../Components/Notification/Header';
import NotificationStats from '../../Components/Notification/Stats';
import NotificationItem from '../../Components/Notification/NotificationItem';

// Main Page component
const NotificationsPage = () => {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [searchTerm, setSearchTerm] = useState('');

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

  const unreadCount = notifications.filter(n => !n.seen).length;

  const handleMarkRead = (id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, seen: true } : n)
    );
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, seen: true }))
    );
  };

  const filteredNotifications = notifications.filter(notification =>
    notification.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    notification.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort notifications: unread first
  const sortedNotifications = [...filteredNotifications].sort((a, b) => {
    if (a.seen === b.seen) return 0;
    return a.seen ? 1 : -1;
  });

  return (
    <div className="w-screen h-screen bg-white flex flex-col">
      <Header
        unreadCount={unreadCount}
        onMarkAllRead={handleMarkAllRead}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />
      
      <NotificationStats notifications={notifications} />
      
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
                ? `No notifications found for "${searchTerm}"`
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

// Sample data with blue theme
const initialNotifications = [
  {
    id: 1,
    type: 'like',
    user: 'Alex Chen',
    userImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    content: 'liked your photo',
    time: '2 hours ago',
    postImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=100&h=100&fit=crop',
    seen: false
  },
  {
    id: 2,
    type: 'follow',
    user: 'Sarah Wilson',
    userImage: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face",
    content: 'started following you',
    time: '5 hours ago',
    seen: false
  },
  {
    id: 3,
    type: 'comment',
    user: 'Mike Johnson',
    userImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    content: 'commented: "Beautiful work! 👏"',
    time: '1 day ago',
    postImage: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=100&h=100&fit=crop',
    seen: false
  },
  {
    id: 4,
    type: 'message',
    user: 'Emma Davis',
    userImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
    content: 'sent you a message',
    time: '3 hours ago',
    seen: false
  },
  {
    id: 5,
    type: 'like',
    user: 'David Kim',
    userImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
    content: 'and 12 others liked your post',
    time: '2 days ago',
    postImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=100&h=100&fit=crop',
    seen: true
  },
  {
    id: 6,
    type: 'follow',
    user: 'Lisa Park',
    userImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face",
    content: 'started following you',
    time: '3 days ago',
    seen: true
  },
  {
    id: 7,
    type: 'comment',
    user: 'Tom Brown',
    userImage: "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=100&h=100&fit=crop&crop=face",
    content: 'mentioned you in a comment',
    time: '5 days ago',
    seen: true
  },
  {
    id: 8,
    type: 'like',
    user: 'Anna Taylor',
    userImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face",
    content: 'liked your comment',
    time: '1 week ago',
    seen: true
  }
];

export default NotificationsPage;