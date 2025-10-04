import React from 'react'


const ConversationList = ({ conversations, selectedChat, setSelectedChat }) => {
    return (
      <div className="w-1/3 border-r overflow-y-auto">
        {conversations.map((conv) => (
          <div
            key={conv.id}
            className={`flex items-center p-4 cursor-pointer hover:bg-gray-100 ${selectedChat?.id === conv.id ? 'bg-gray-200' : ''}`}
            onClick={() => setSelectedChat(conv)}
          >
            <img src={conv.avatar} alt={conv.name} className="w-12 h-12 rounded-full mr-4" />
            <div className="flex-1">
              <div className="font-bold">{conv.name}</div>
              <div className="text-sm text-gray-500">{conv.lastMessage}</div>
            </div>
            {conv.unread > 0 && (
              <div className="ml-2 bg-blue-500 text-white rounded-full px-2 text-xs">
                {conv.unread}
              </div>
            )}
          </div>
        ))}
      </div>
    );
}
export default ConversationList;