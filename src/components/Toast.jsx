// src/components/Toast.jsx (corregido: z-index aumentado a z-[60] para que aparezca siempre encima del header z-50 y modal)
import React from 'react';

const Toast = ({ message, type, onClose }) => {
  const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';

  return (
    <div className={`fixed top-4 right-4 z-[60] p-4 rounded-lg shadow-lg text-white ${bgColor} max-w-sm animate-fadeIn`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{message}</span>
        <button onClick={onClose} className="ml-4 text-white hover:text-gray-200">
          ×
        </button>
      </div>
    </div>
  );
};

export default Toast;