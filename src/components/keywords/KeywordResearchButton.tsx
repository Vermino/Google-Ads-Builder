import React from 'react';
import { Search } from 'lucide-react';

export interface KeywordResearchButtonProps {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Button component to trigger keyword research
 *
 * Displays a prominent button with search icon that opens the
 * keyword research modal when clicked.
 */
const KeywordResearchButton: React.FC<KeywordResearchButtonProps> = ({
  onClick,
  disabled = false,
  className = '',
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center space-x-2 px-4 py-2.5
        bg-blue-50 text-blue-700 border border-blue-200
        rounded-lg font-medium
        hover:bg-blue-100 hover:border-blue-300
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-all duration-200
        ${className}
      `}
      title="Research keywords using AI and keyword expansion tools"
      aria-label="Research keywords"
    >
      <Search className="w-4 h-4" aria-hidden="true" />
      <span>Research Keywords</span>
    </button>
  );
};

export default KeywordResearchButton;
