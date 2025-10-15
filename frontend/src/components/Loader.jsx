import React from 'react';
import { Loader2 } from 'lucide-react';

const Loader = ({ size = 'md', text = 'Loading...' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-primary-600 mb-2`} />
      <p className="text-gray-600 text-sm">{text}</p>
    </div>
  );
};

export default Loader;