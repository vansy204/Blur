import React from 'react';
import MessageLeft from '../../Components/MessageComponets/MessageLeft/MessageLeft';
import MessageRight from '../../Components/MessageComponets/MessageRight/MessageRight';

const MessagePage = () => {
  return (
    <div className="flex h-screen">
    <div className="fixed top-0 left-0 w-[23%] h-screen border border-slate-500 overflow-y-auto">
      <MessageLeft />
    </div>
    <div className="ml-[23%] w-full">
      <MessageRight />
    </div>
  </div>
  
  );
};

export default MessagePage;
