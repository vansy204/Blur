import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import { profileApiCall } from '../../service/api';

const UserSearchBar = ({ onSelectUser, onConversationCreated }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const searchTimeoutRef = useRef(null);
  const searchContainerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const data = await profileApiCall(`/users/search/${encodeURIComponent(searchQuery)}`);
        setSearchResults(data.result || []);
        setShowResults(true);
      } catch (error) {
        console.error("❌ Error searching users:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const createConversation = async (userId) => {
    try {
      const response = await fetch('http://localhost:8888/api/chat/conversations/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` // Hoặc cách lấy token của bạn
        },
        body: JSON.stringify({
          type: 'DIRECT',
          participantIds: [userId]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create conversation');
      }

      const data = await response.json();
      return data.result || data;
    } catch (error) {
      console.error("❌ Error creating conversation:", error);
      throw error;
    }
  };

  const handleSelectUser = async (user) => {
    if (isCreatingConversation) return;

    setIsCreatingConversation(true);
    const loadingToast = toast.loading('Đang tạo cuộc trò chuyện...');

    try {
      const conversation = await createConversation(user.userId);
      
      toast.dismiss(loadingToast);
      
      // Gọi callback để parent component xử lý
      if (onConversationCreated) {
        onConversationCreated(conversation);
      }
      
      // Gọi callback cũ nếu có
      if (onSelectUser) {
        onSelectUser(user);
      }

      setSearchQuery("");
      setSearchResults([]);
      setShowResults(false);
    } catch (error) {
      toast.error('Không thể tạo cuộc trò chuyện. Vui lòng thử lại.', {
        id: loadingToast,
        duration: 3000
      });
    } finally {
      setIsCreatingConversation(false);
    }
  };

  return (
    <div ref={searchContainerRef} className="relative p-3 border-b bg-white">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Tìm kiếm người dùng..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => searchQuery.trim() && setShowResults(true)}
          disabled={isCreatingConversation}
          className="w-full pl-10 pr-4 py-2 border rounded-full focus:outline-none focus:border-blue-500 transition-colors disabled:bg-gray-100"
        />
        {isSearching && (
          <Loader className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-500 animate-spin" size={18} />
        )}
      </div>

      {showResults && searchResults.length > 0 && (
        <div className="absolute top-full left-3 right-3 mt-1 bg-white border rounded-lg shadow-lg max-h-80 overflow-y-auto z-50">
          {searchResults.map((user) => (
            <div
              key={user.userId}
              onClick={() => !isCreatingConversation && handleSelectUser(user)}
              className={`flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors border-b last:border-b-0 ${
                isCreatingConversation ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <img
                src={user.imageUrl || user.avatar || '/api/placeholder/40/40'}
                alt={user.username}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">
                  {user.firstName} {user.lastName}
                </div>
                <div className="text-sm text-gray-500 truncate">@{user.username}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showResults && searchQuery.trim() && !isSearching && searchResults.length === 0 && (
        <div className="absolute top-full left-3 right-3 mt-1 bg-white border rounded-lg shadow-lg p-4 text-center text-gray-500 z-50">
          Không tìm thấy người dùng
        </div>
      )}
    </div>
  );
};

export default UserSearchBar;