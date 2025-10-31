import React from 'react';

export interface CharacterCounterProps {
  current: number;
  limit: number;
  className?: string;
}

const CharacterCounter: React.FC<CharacterCounterProps> = ({ current, limit, className = '' }) => {
  const isOverLimit = current > limit;
  const isNearLimit = current >= limit * 0.9 && !isOverLimit;

  const colorClass = isOverLimit
    ? 'text-red-600 font-semibold'
    : isNearLimit
    ? 'text-yellow-600'
    : 'text-gray-500';

  return (
    <span className={`text-xs ${colorClass} ${className}`}>
      {current}/{limit}
    </span>
  );
};

export default CharacterCounter;
