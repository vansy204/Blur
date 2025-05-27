import { Heart, MessageCircle, UserPlus } from 'lucide-react';
import React from 'react'


// Stats component
const NotificationStats = ({ notifications }) => {
  const stats = {
    likes: notifications.filter(n => n.type === 'like').length,
    comments: notifications.filter(n => n.type === 'comment').length,
    follows: notifications.filter(n => n.type === 'follow').length,
    messages: notifications.filter(n => n.type === 'message').length,
  };

  return (
    <div className="px-6 py-4 bg-blue-50/50 border-b border-blue-100">
      <div className="grid grid-cols-4 gap-4">
        <div className="text-center">
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-1">
            <Heart size={14} className="text-red-500" />
          </div>
          <p className="text-xs font-semibold text-gray-900">{stats.likes}</p>
          <p className="text-xs text-gray-500">Likes</p>
        </div>
        <div className="text-center">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-1">
            <MessageCircle size={14} className="text-blue-500" />
          </div>
          <p className="text-xs font-semibold text-gray-900">{stats.comments}</p>
          <p className="text-xs text-gray-500">Comments</p>
        </div>
        <div className="text-center">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-1">
            <UserPlus size={14} className="text-green-500" />
          </div>
          <p className="text-xs font-semibold text-gray-900">{stats.follows}</p>
          <p className="text-xs text-gray-500">Follows</p>
        </div>
        <div className="text-center">
          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-1">
            <MessageCircle size={14} className="text-purple-500" />
          </div>
          <p className="text-xs font-semibold text-gray-900">{stats.messages}</p>
          <p className="text-xs text-gray-500">Messages</p>
        </div>
      </div>
    </div>
  );
};
export default NotificationStats;