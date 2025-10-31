import React from 'react';
import CharacterCounter from './CharacterCounter';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  showCharacterCount?: boolean;
  characterLimit?: number;
  helperText?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      showCharacterCount = false,
      characterLimit,
      helperText,
      className = '',
      ...props
    },
    ref
  ) => {
    const currentLength = (props.value as string)?.length || 0;

    return (
      <div className="w-full">
        {label && (
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700">
              {label}
            </label>
            {showCharacterCount && characterLimit && (
              <CharacterCounter current={currentLength} limit={characterLimit} />
            )}
          </div>
        )}
        <input
          ref={ref}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
            error ? 'border-red-500' : 'border-gray-300'
          } ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        {helperText && !error && <p className="mt-1 text-xs text-gray-500">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
