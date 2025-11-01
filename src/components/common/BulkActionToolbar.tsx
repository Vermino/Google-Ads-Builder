import React, { useState } from 'react';
import { Trash2, Copy, Circle, CirclePause, X } from 'lucide-react';

export interface BulkActionToolbarProps {
  selectedCount: number;
  onDelete: () => void;
  onDuplicate: () => void;
  onChangeStatus: (status: 'active' | 'paused' | 'enabled' | 'disabled') => void;
  onCancel: () => void;
  entityType: 'ad group' | 'ad';
  statusType?: 'adGroup' | 'ad'; // Different status types for different entities
}

const BulkActionToolbar: React.FC<BulkActionToolbarProps> = ({
  selectedCount,
  onDelete,
  onDuplicate,
  onChangeStatus,
  onCancel,
  entityType,
  statusType = 'adGroup',
}) => {
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const statusOptions = statusType === 'adGroup'
    ? [
        { value: 'active', label: 'Active', icon: Circle },
        { value: 'paused', label: 'Paused', icon: CirclePause },
      ]
    : [
        { value: 'enabled', label: 'Enabled', icon: Circle },
        { value: 'paused', label: 'Paused', icon: CirclePause },
        { value: 'disabled', label: 'Disabled', icon: X },
      ];

  const handleStatusChange = (status: any) => {
    onChangeStatus(status);
    setShowStatusMenu(false);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-blue-500 shadow-2xl z-50 animate-slide-up">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Selection Counter */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {selectedCount} {entityType}{selectedCount !== 1 ? 's' : ''} selected
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {/* Duplicate Button */}
            <button
              onClick={onDuplicate}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              title="Duplicate selected items"
            >
              <Copy className="w-4 h-4 mr-2" />
              Duplicate
            </button>

            {/* Change Status Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                title="Change status"
              >
                <Circle className="w-4 h-4 mr-2" />
                Change Status
                <svg
                  className={`ml-2 w-4 h-4 transition-transform ${showStatusMenu ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {showStatusMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowStatusMenu(false)}
                  />
                  <div className="absolute bottom-full mb-2 right-0 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                    {statusOptions.map((option) => {
                      const Icon = option.icon;
                      return (
                        <button
                          key={option.value}
                          onClick={() => handleStatusChange(option.value)}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2 transition-colors"
                        >
                          <Icon className="w-4 h-4" />
                          <span>{option.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Delete Button */}
            <button
              onClick={onDelete}
              className="inline-flex items-center px-4 py-2 border border-red-300 rounded-lg text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              title="Delete selected items"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </button>

            {/* Divider */}
            <div className="w-px h-8 bg-gray-300" />

            {/* Cancel Button */}
            <button
              onClick={onCancel}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              title="Clear selection"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkActionToolbar;
