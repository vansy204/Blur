import { useState, useEffect } from 'react';
import {
  Heart,
  MessageCircle,
  Clock,
  UserPlus,
  Bell
} from 'lucide-react';
import { getToken } from '../../service/LocalStorageService'; // Adjust the import path as necessary
// Notification icon component
const NotificationIcon = ({ type, className = '' }) => {
  const iconProps = { size: 16 };
  const iconClass = `${className} ml-2`;

  switch (type) {
    case 'like':
      return <Heart {...iconProps} className={`${iconClass} text-red-500`} />;
    case 'comment':
      return <MessageCircle {...iconProps} className={`${iconClass} text-blue-500`} />;
    case 'follow':
      return <UserPlus {...iconProps} className={`${iconClass} text-green-500`} />;
    case 'message':
      return <MessageCircle {...iconProps} className={`${iconClass} text-purple-500`} />;
    default:
      return <Clock {...iconProps} className={`${iconClass} text-gray-500`} />;
  }
};
const NotificationItem = ({ notification }) => {
  const { user, userImage, content, time, type, postImage, seen } = notification;

  return (
    <div
      className={`flex items-start p-4 border-b border-gray-100 ${
        seen ? 'bg-white' : 'bg-blue-50'
      }`}
    >
      {/* Avatar + Icon */}
      <div className="relative mr-3">
        <img
          src={userImage}
          alt={user}
          className="w-10 h-10 rounded-full object-cover border border-gray-200"
        />
        <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full">
          <NotificationIcon type={type} />
        </div>
      </div>

      {/* Content + Action */}
      <div className="flex flex-col flex-1 min-w-0">
        <p className="text-sm truncate">
          <span className="font-semibold">{user}</span> {content}
        </p>

        <div className="flex items-center justify-between mt-1">
          <span className="text-gray-500 text-xs">{time}</span>

          <div className="flex items-center space-x-2 ml-2 shrink-0">
            {type === 'follow' && (
              <button className="cursor-pointer bg-blue-500 text-white text-xs py-1 px-3 rounded-md font-medium">
                Follow
              </button>
            )}
            {type === 'message' && (
              <button className="bg-purple-500 text-white text-xs py-1 px-3 rounded-md font-medium cursor-pointer">
                Message
              </button>
            )}
            {(type === 'like' || type === 'comment') && postImage && (
              <img
                src={postImage}
                alt="Post"
                className="w-10 h-10 object-cover rounded"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Header
const Header = () => (
  <div className="border-b border-gray-200 p-4 flex items-center">
    <h1 className="text-xl font-semibold flex-grow">Notifications</h1>
    <button className="text-blue-500 text-sm font-medium">Filter</button>
  </div>
);

// Page component
const NotificationsPage = () => {
  const [notifications, setNotifications] = useState(initialNotifications);
  const token = getToken();
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

  return (
    <div className="w-screen h-screen bg-white flex flex-col">
      <Header />
      <div className="flex-grow overflow-auto">
        {notifications.length > 0 ? (
          notifications.map((n) => (
            <NotificationItem key={n.id} notification={n} />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="mb-4 bg-gray-100 p-4 rounded-full">
              <Bell size={24} />
            </div>
            <p className="text-lg font-medium">No notifications yet</p>
            <p className="text-sm text-gray-500 mt-1">
              When you have notifications, they'll appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Sample data (move to another file if needed)
const initialNotifications = [
  {
    id: 1,
    type: 'like',
    user: 'alex_smith',
    userImage:  "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png",
    content: 'liked your photo',
    time: '2h',
    postImage: '/api/placeholder/40/40',
    seen: false
  },
  {
    id: 2,
    type: 'follow',
    user: 'jessica_wilson',
    userImage:  "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png",
    content: 'started following you',
    time: '5h',
    seen: false
  },
  {
    id: 3,
    type: 'comment',
    user: 'michael_brown',
    userImage: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png",
    content: 'commented: "Amazing shot! 🔥"',
    time: '1d',
    postImage: '/api/placeholder/40/40',
    seen: true
  },
  {
    id: 4,
    type: 'like',
    user: 'emma_davis',
    userImage: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png",
    content: 'liked your comment',
    time: '2d',
    seen: true
  },
  {
    id: 5,
    type: 'follow',
    user: 'john_wilson',
    userImage: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png",
    content: 'started following you',
    time: '3d',
    seen: true
  },
  {
    id: 6,
    type: 'like',
    user: 'sophia_martinez',
    userImage: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png",
    content: 'and 24 others liked your photo',
    time: '4d',
    postImage: '/api/placeholder/40/40',
    seen: true
  },
  {
    id: 7,
    type: 'comment',
    user: 'james_johnson',
    userImage: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png",
    content: 'mentioned you in a comment',
    time: '5d',
    seen: true
  },
  {
    id: 8,
    type: 'follow',
    user: 'olivia_taylor',
    userImage: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png",
    content: 'started following you',
    time: '1w',
    seen: true
  },
  {
    id: 9,
    type: 'message',
    user: 'linda_nguyen',
    userImage:"https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png",
    content: 'sent you a message',
    time: '3h',
    seen: false
  }
];

export default NotificationsPage;
