import React from 'react';
import type { Headline } from '@/types';
import CharacterCounter from '@/components/common/CharacterCounter';
import { CHAR_LIMITS } from '@/utils/constants';

export interface HeadlineInputProps {
  headline: Headline;
  index: number;
  onUpdate: (text: string) => void;
  onDelete: () => void;
}

const HeadlineInput: React.FC<HeadlineInputProps> = ({ headline, index, onUpdate, onDelete }) => {
  return (
    <div className="flex items-start space-x-2">
      <span className="text-sm font-medium text-gray-500 mt-2">{index + 1}.</span>
      <div className="flex-1">
        <div className="flex justify-between mb-1">
          <label className="text-xs text-gray-500">Headline {index + 1}</label>
          <CharacterCounter current={headline.text.length} limit={CHAR_LIMITS.HEADLINE} />
        </div>
        <input
          type="text"
          value={headline.text}
          onChange={(e) => onUpdate(e.target.value)}
          maxLength={CHAR_LIMITS.HEADLINE}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          placeholder="Enter headline"
        />
      </div>
      <button
        onClick={onDelete}
        className="mt-8 text-gray-400 hover:text-red-600 transition-colors"
        title="Delete headline"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

export default HeadlineInput;
