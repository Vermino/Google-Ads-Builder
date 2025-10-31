import React from 'react';
import type { Keyword } from '@/types';
import KeywordRow from './KeywordRow';

export interface KeywordManagerProps {
  keywords: Keyword[];
  onAddKeyword: () => void;
  onUpdateKeyword: (keywordId: string, updates: Partial<Keyword>) => void;
  onDeleteKeyword: (keywordId: string) => void;
}

const KeywordManager: React.FC<KeywordManagerProps> = ({
  keywords,
  onAddKeyword,
  onUpdateKeyword,
  onDeleteKeyword,
}) => {
  return (
    <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
            />
          </svg>
          <h2 className="text-lg font-semibold text-gray-900">Keywords ({keywords.length})</h2>
        </div>
        <button
          onClick={onAddKeyword}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add Keyword</span>
        </button>
      </div>

      {keywords.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No keywords yet. Click "Add Keyword" to get started.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {keywords.map((keyword) => (
            <KeywordRow
              key={keyword.id}
              keyword={keyword}
              onUpdate={(updates) => onUpdateKeyword(keyword.id, updates)}
              onDelete={() => onDeleteKeyword(keyword.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default KeywordManager;
