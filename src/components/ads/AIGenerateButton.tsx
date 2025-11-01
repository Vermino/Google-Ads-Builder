import React from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

export interface AIGenerateButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
  className?: string;
}

const AIGenerateButton: React.FC<AIGenerateButtonProps> = ({
  onClick,
  isLoading = false,
  disabled = false,
  variant = 'primary',
  className = '',
}) => {
  const baseStyles =
    'inline-flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantStyles = {
    primary:
      'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 focus:ring-purple-500 shadow-md hover:shadow-lg',
    secondary:
      'bg-white text-purple-600 border-2 border-purple-600 hover:bg-purple-50 focus:ring-purple-500',
  };

  return (
    <div className="relative group">
      <button
        onClick={onClick}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variantStyles[variant]} ${className}`}
        aria-label="Generate ad copy with AI"
        title="Generate ad copy with AI"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Generating...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            <span>Generate with AI</span>
          </>
        )}
      </button>

      {/* Tooltip */}
      {!isLoading && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-lg">
          <div className="font-semibold mb-1">AI-Powered Ad Copy</div>
          <div className="text-xs text-gray-300">Generate compelling headlines & descriptions</div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
            <div className="border-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIGenerateButton;
