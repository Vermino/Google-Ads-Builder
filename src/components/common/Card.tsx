import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

const Card: React.FC<CardProps> = ({ children, className = '', onClick, hoverable = false }) => {
  const hoverClass = hoverable || onClick ? 'hover:shadow-md cursor-pointer' : '';

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-5 transition-shadow ${hoverClass} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default Card;
