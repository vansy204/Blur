import React from 'react';
import { AlertCircle } from 'lucide-react';

const ConnectionStatus = ({ error }) => {
  if (!error) return null;
  
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-500 text-white px-4 py-2 flex items-center gap-2 shadow-lg">
      <AlertCircle size={18} />
      <span className="text-sm">{error}</span>
    </div>
  );
};

export default ConnectionStatus;