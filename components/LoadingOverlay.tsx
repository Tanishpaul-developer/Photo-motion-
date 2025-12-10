import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
  message: string;
  isProcessing: boolean;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message, isProcessing }) => {
  if (!isProcessing) return null;

  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-white p-6 rounded-lg">
      <Loader2 className="w-12 h-12 animate-spin mb-4 text-indigo-500" />
      <h3 className="text-xl font-medium mb-2">Processing Media</h3>
      <p className="text-gray-400 text-center max-w-md animate-pulse">{message}</p>
    </div>
  );
};

export default LoadingOverlay;