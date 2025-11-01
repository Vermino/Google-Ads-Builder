import type { Description } from '@/types';
import CharacterCounter from '@/components/common/CharacterCounter';
import { CHAR_LIMITS } from '@/utils/constants';

export interface DescriptionInputProps {
  description: Description;
  index: number;
  onUpdate: (updates: Partial<Description>) => void;
  onDelete: () => void;
}

const DescriptionInput: React.FC<DescriptionInputProps> = ({ description, index, onUpdate, onDelete }) => {
  const handlePinToggle = () => {
    if (description.pinned) {
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
          <label className="text-xs text-gray-500">Description {index + 1}</label>
          <div className="flex items-center space-x-2">
            {description.pinned && (
              <span className="text-xs text-blue-600 font-medium">Pinned to Pos {description.pinnedPosition}</span>
            )}
            <CharacterCounter current={description.text.length} limit={CHAR_LIMITS.DESCRIPTION} />
          </div>
        </div>
        <div className="flex space-x-2">
          <textarea
            value={description.text}
            onChange={(e) => onUpdate({ text: e.target.value })}
            maxLength={CHAR_LIMITS.DESCRIPTION}
            rows={2}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-colors"
            placeholder="Enter description"
          />
          <div className="flex flex-col space-y-2">
            <button
              onClick={handlePinToggle}
              className={`px-3 py-2 border rounded-lg transition-colors ${
                description.pinned
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-blue-600'
              }`}
              title={description.pinned ? 'Unpin description' : 'Pin description to position'}
              aria-label={description.pinned ? 'Unpin description' : 'Pin description'}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" />
              </svg>
            </button>
            {description.pinned && (
              <select
                value={description.pinnedPosition || 1}
                onChange={(e) => onUpdate({ pinnedPosition: parseInt(e.target.value) })}
                className="w-20 px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                aria-label="Pin position"
              >
                <option value={1}>Pos 1</option>
                <option value={2}>Pos 2</option>
              </select>
            )}
          </div>
        </div>
      </div>
      <button
        onClick={onDelete}
        className="mt-8 text-gray-400 hover:text-red-600 transition-colors"
        title="Delete description"
        aria-label="Delete description"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

export default DescriptionInput;
