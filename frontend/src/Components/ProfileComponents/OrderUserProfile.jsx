import React, { useState } from 'react';

export default function OtherUserProfile() {
  const [activeTab, setActiveTab] = useState('post');

  const user = {
    avatar: 'https://via.placeholder.com/150',
    username: 'van_sy',
    fullName: 'Văn Sỹ',
    bio: 'this is bio',
    posts: 13,
    followers: 99,
    following: 99,
    media: [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
      // add more URLs...
    ],
  };

  return (
    <div className="flex w-full">
      <div className="flex-1 max-w-4xl mx-auto mt-8">
        {/* Profile Info */}
        <div className="flex items-center gap-8 px-4">
          <img src={user.avatar} className="w-28 h-28 rounded-full object-cover" alt="Avatar" />
          <div>
            <h2 className="text-2xl font-semibold">{user.fullName}</h2>
            <div className="flex gap-6 mt-2 text-sm text-gray-600">
              <span><strong>{user.posts}</strong> posts</span>
              <span><strong>{user.followers}</strong> followers</span>
              <span><strong>{user.following}</strong> following</span>
            </div>
            <p className="mt-2 text-gray-700">{user.bio}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-8 border-t">
          <div className="flex justify-center gap-10 text-sm font-medium text-gray-500 mt-4">
            <button
              onClick={() => setActiveTab('post')}
              className={`pb-2 ${activeTab === 'post' ? 'border-b-2 border-black text-black' : ''}`}
            >
              Post
            </button>
            <button
              onClick={() => setActiveTab('reels')}
              className={`pb-2 ${activeTab === 'reels' ? 'border-b-2 border-black text-black' : ''}`}
            >
              Reels
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`pb-2 ${activeTab === 'saved' ? 'border-b-2 border-black text-black' : ''}`}
            >
              Saved
            </button>
          </div>

          {/* Media Grid */}
          <div className="grid grid-cols-3 gap-1 mt-6">
            {user.media.map((url, index) => (
              <img
                key={index}
                src={url}
                alt="post"
                className="w-full h-[300px] object-cover"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
