import { Image, Mic, Paperclip, PlusCircle } from 'lucide-react';
import React from 'react'


const MessageInput = ({ message, setMessage, sendMessage, handleKeyPress }) => {
    return (
      <div className="border-t p-4 flex items-center">
        <button><PlusCircle className="text-gray-500 mr-2" /></button>
        <button><Image className="text-gray-500 mr-2" /></button>
        <button><Mic className="text-gray-500 mr-2" /></button>
        <button><Paperclip className="text-gray-500 mr-2" /></button>
        <input
          type="text"
          className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyPress}
        />
        <button
          onClick={sendMessage}
          className="ml-2 bg-blue-500 text-white rounded-full px-4 py-2"
        >
          Send
        </button>
      </div>
    );
  };

export default MessageInput