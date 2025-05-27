import { Dot, MoreHorizontal } from 'lucide-react';
import React from 'react'
import NotificationIcon from './NotificationIcon';


const NotificationItem = ({ notification, onMarkRead }) => {
  const { id, user, userImage, content, time, type, postImage, seen } = notification;

  return (
    <div className={`flex items-center p-4 hover:bg-blue-50/50 transition-colors duration-200 cursor-pointer border-l-4 ${
      seen ? 'border-l-transparent bg-white' : 'border-l-blue-500 bg-blue-50/30'
    }`}>
      {/* Avatar */}
      <div className="relative mr-4 flex-shrink-0">
        <img
          src={userImage}
          alt={user}
          className="w-11 h-11 rounded-full object-cover border-2 border-blue-100"
        />
        <div className="absolute -bottom-1 -right-1">
          <NotificationIcon type={type} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">
              {user}
              <span className="font-normal text-gray-600 ml-1">{content}</span>
            </p>
            <p className="text-xs text-blue-600 font-medium mt-1">{time}</p>
          </div>

          {/* Post image or action buttons */}
          <div className="ml-4 flex items-center space-x-2 flex-shrink-0">
            {type === 'follow' && (
              <button className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-full font-medium transition-colors">
                Follow
              </button>
            )}
            {type === 'message' && (
              <button className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-full font-medium transition-colors">
                Reply
              </button>
            )}
            {(type === 'like' || type === 'comment') && postImage && (
              <img
                src={postImage}
                alt="Post"
                className="w-10 h-10 object-cover rounded-lg border border-blue-200"
              />
            )}
            
            {/* More options */}
            <button className="p-1 hover:bg-blue-100 rounded-full transition-colors opacity-0 group-hover:opacity-100">
              <MoreHorizontal size={16} className="text-blue-600" />
            </button>
          </div>
        </div>

        {/* Unread indicator */}
        {!seen && (
          <button
            onClick={() => onMarkRead(id)}
            className="mt-2 flex items-center text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            <Dot size={16} className="text-blue-500" />
            Mark as read
          </button>
        )}
      </div>
    </div>
  );
};

export default NotificationItem