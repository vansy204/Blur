import React from 'react'

const ConnectionStatus = ({ connectionError, reconnectAttempts, maxReconnectAttempts }) => {
    if (!connectionError) return null;
  
    return (
      <div className="absolute top-0 left-0 right-0 bg-red-500 text-white text-center py-1 text-sm">
        {connectionError}
        {reconnectAttempts < maxReconnectAttempts && ` (Reconnect attempt ${reconnectAttempts}/${maxReconnectAttempts})`}
      </div>
    );
  };
export default ConnectionStatus