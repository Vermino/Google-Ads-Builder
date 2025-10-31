import React from 'react';
import type { Keyword } from '@/types';

export interface KeywordRowProps {
  keyword: Keyword;
  onUpdate: (updates: Partial<Keyword>) => void;
  onDelete: () => void;
}

const KeywordRow: React.FC<KeywordRowProps> = ({ keyword, onUpdate, onDelete }) => {
  return (
    <div className="flex items-center space-x-3 py-2 border-b border-gray-100 last:border-0">
      <input
        type="text"
        value={keyword.text}
        onChange={(e) => onUpdate({ text: e.target.value })}
        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        placeholder="Enter keyword"
      />

      {/* Match Type Checkboxes */}
      <div className="flex items-center space-x-4">
        <label className="flex items-center space-x-1 cursor-pointer">
          <input
            type="checkbox"
            checked={keyword.matchTypes.broad}
            onChange={(e) =>
              onUpdate({
                matchTypes: { ...keyword.matchTypes, broad: e.target.checked },
              })
            }
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-600">Broad</span>
        </label>

        <label className="flex items-center space-x-1 cursor-pointer">
          <input
            type="checkbox"
            checked={keyword.matchTypes.phrase}
            onChange={(e) =>
              onUpdate({
                matchTypes: { ...keyword.matchTypes, phrase: e.target.checked },
              })
            }
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-600">Phrase</span>
        </label>

        <label className="flex items-center space-x-1 cursor-pointer">
          <input
            type="checkbox"
            checked={keyword.matchTypes.exact}
            onChange={(e) =>
              onUpdate({
                matchTypes: { ...keyword.matchTypes, exact: e.target.checked },
              })
            }
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-600">Exact</span>
        </label>
      </div>

      {/* Delete Button */}
      <button
        onClick={onDelete}
        className="text-gray-400 hover:text-red-600 transition-colors"
        title="Delete keyword"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

export default KeywordRow;
