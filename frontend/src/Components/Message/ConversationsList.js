 // components/ConversationsList.js
import React from 'react';
import ConversationItem from './ConversationItem';

const ConversationsList = ({ conversations, selectedConversation, onSelectConversation }) => {
  return (
    <div className="flex-1 overflow-y-auto">
      {conversations.map((conv) => (
        <ConversationItem
          key={conv.id}
          conversation={conv}
          isSelected={selectedConversation?.id === conv.id}
          onClick={onSelectConversation}
        />
      ))}
    </div>
  );
};

export default ConversationsList;
