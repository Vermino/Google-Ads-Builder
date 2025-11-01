import type { Headline } from '@/types';
import CharacterCounter from '@/components/common/CharacterCounter';
import { CHAR_LIMITS } from '@/utils/constants';

export interface HeadlineInputProps {
  headline: Headline;
  index: number;
  onUpdate: (updates: Partial<Headline>) => void;
  onDelete: () => void;
}

const HeadlineInput: React.FC<HeadlineInputProps> = ({ headline, index, onUpdate, onDelete }) => {
  const handlePinToggle = () => {
    if (headline.pinned) {
      onUpdate({ pinned: false, pinnedPosition: undefined });
    } else {
      onUpdate({ pinned: true, pinnedPosition: 1 });
    }
  };

  return (
    <div className="flex items-start space-x-2">
      <span className="text-sm font-medium text-gray-500 mt-2">{index + 1}.</span>
      <div className="flex-1">
        <div className="flex justify-between mb-1">
          <label className="text-xs text-gray-500">Headline {index + 1}</label>
          <CharacterCounter current={headline.text.length} limit={CHAR_LIMITS.HEADLINE} />
        </div>
        <div className="flex space-x-2">
          <input
            type="text"
            value={headline.text}
            onChange={(e) => onUpdate({ text: e.target.value })}
            maxLength={CHAR_LIMITS.HEADLINE}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            placeholder="Enter headline"
          />
          <button
            onClick={handlePinToggle}
            className={`px-3 py-2 border rounded-lg transition-colors ${
              headline.pinned
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-blue-600'
            }`}
            title={headline.pinned ? 'Unpin headline' : 'Pin headline to position'}
            aria-label={headline.pinned ? 'Unpin headline' : 'Pin headline'}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" />
            </svg>
          </button>
          {headline.pinned && (
            <select
              value={headline.pinnedPosition || 1}
              onChange={(e) => onUpdate({ pinnedPosition: parseInt(e.target.value) })}
              className="w-20 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Pin position"
            >
              <option value={1}>Pos 1</option>
              <option value={2}>Pos 2</option>
              <option value={3}>Pos 3</option>
            </select>
          )}
        </div>
      </div>
      <button
        onClick={onDelete}
        className="mt-8 text-gray-400 hover:text-red-600 transition-colors"
        title="Delete headline"
        aria-label="Delete headline"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

export default HeadlineInput;
