import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center p-4 text-center">
      <AlertCircle size={48} className="text-red-500 mb-4" />
      <p className="text-gray-700 mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn-primary flex items-center"
        >
          <RefreshCw size={16} className="mr-2" />
          Tentar Novamente
        </button>
      )}
    </div>
  );
};