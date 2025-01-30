import React from 'react';
import MessageLeft from '../../Components/MessageComponets/MessageLeft/MessageLeft';
import MessageRight from '../../Components/MessageComponets/MessageRight/MessageRight';

const MessagePage = () => {
  return (
    <div className="flex h-screen">
      <div className="w-[23%] border border-slate-500 overflow-y-auto max-h-screen">
        <MessageLeft />
      </div>
      <div className="ml-2 w-full">
        <MessageRight />
      </div>
    </div>
  );
};

export default MessagePage;
