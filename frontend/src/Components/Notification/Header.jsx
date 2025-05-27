import { CheckCircle2, Search } from 'lucide-react';
import React from 'react'


// Clean Header with blue theme
const Header = ({ unreadCount, onMarkAllRead, searchTerm, setSearchTerm }) => {
  return (
    <div className="bg-white border-b border-blue-100 sticky top-0 z-10">
      {/* Top section */}
      <div className="px-6 py-5 border-b border-blue-50">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            {unreadCount > 0 && (
              <div className="flex items-center mt-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                <span className="text-sm text-blue-600 font-medium">
                  {unreadCount} new notification{unreadCount !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
          
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllRead}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors"
            >
              <CheckCircle2 size={16} />
              <span>Mark all read</span>
            </button>
          )}
        </div>
      </div>

      {/* Search section */}
      <div className="px-6 py-4">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400" />
          <input
            type="text"
            placeholder="Search notifications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-blue-50 border border-blue-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
      </div>
    </div>
  );
};

export default Header