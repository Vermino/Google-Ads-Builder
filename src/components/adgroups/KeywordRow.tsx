import type { Keyword } from '@/types';

export interface KeywordRowProps {
  keyword: Keyword;
  onUpdate: (updates: Partial<Keyword>) => void;
  onDelete: () => void;
}

const KeywordRow: React.FC<KeywordRowProps> = ({ keyword, onUpdate, onDelete }) => {
  return (
    <div className="flex items-center space-x-3 py-2 border-b border-gray-100 last:border-0">
      {/* Keyword Text */}
      <input
        type="text"
        value={keyword.text}
        onChange={(e) => onUpdate({ text: e.target.value })}
        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        placeholder="Enter keyword"
      />

      {/* Optional Max CPC Override */}
      <div className="flex items-center space-x-2">
        <label className="text-sm text-gray-600 whitespace-nowrap">Max CPC:</label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={keyword.maxCpc || ''}
          onChange={(e) =>
            onUpdate({ maxCpc: e.target.value ? parseFloat(e.target.value) : undefined })
          }
          className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Auto"
        />
      </div>

      {/* Delete Button */}
      <button
        onClick={onDelete}
        className="text-gray-400 hover:text-red-600 transition-colors"
        title="Delete keyword"
        aria-label="Delete keyword"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

export default KeywordRow;
