import { Clock, Heart, MessageCircle, UserPlus } from 'lucide-react';
import React from 'react'


// Notification icon component with blue theme
const NotificationIcon = ({ type, className = '' }) => {
  const iconProps = { size: 12 };
  const baseClass = `${className} p-1 rounded-full border-2 border-white shadow-sm`;

  switch (type) {
    case 'likePost':
      return (
        <div className={`${baseClass} bg-red-500`}>
          <Heart {...iconProps} className="text-white fill-white" />
        </div>
      );
    case 'CommentPost':
      return (
        <div className={`${baseClass} bg-blue-500`}>
          <MessageCircle {...iconProps} className="text-white" />
        </div>
      );
    case 'follow':
      return (
        <div className={`${baseClass} bg-green-500`}>
          <UserPlus {...iconProps} className="text-white" />
        </div>
      );
    case 'message':
      return (
        <div className={`${baseClass} bg-purple-500`}>
          <MessageCircle {...iconProps} className="text-white" />
        </div>
      );
    default:
      return (
        <div className={`${baseClass} bg-gray-500`}>
          <Clock {...iconProps} className="text-white" />
        </div>
      );
  }
};

export default NotificationIcon