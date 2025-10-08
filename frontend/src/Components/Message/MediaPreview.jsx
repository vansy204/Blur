import React, { useState, useEffect } from 'react';
import { X, FileText, Film } from 'lucide-react';

const MediaPreview = ({ file, onRemove }) => {
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);
    }
    return () => {
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [file]);

  return (
    <div className="relative inline-block mr-2 mb-2">
      {file.type.startsWith('image/') ? (
        <img src={preview} alt="Preview" className="w-20 h-20 object-cover rounded border-2 border-gray-300" />
      ) : file.type.startsWith('video/') ? (
        <div className="w-20 h-20 bg-gray-800 rounded flex items-center justify-center border-2 border-gray-300">
          <Film size={32} className="text-white" />
        </div>
      ) : (
        <div className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center border-2 border-gray-300">
          <FileText size={32} className="text-gray-500" />
        </div>
      )}
      <button
        onClick={onRemove}
        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-md"
      >
        <X size={14} />
      </button>
      <div className="text-xs mt-1 truncate w-20 text-center text-gray-600">{file.name}</div>
    </div>
  );
};

export default MediaPreview;