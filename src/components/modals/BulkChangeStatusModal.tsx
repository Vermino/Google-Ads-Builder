import React, { useState } from 'react';
import Modal from '@/components/common/Modal';
import { Circle, CirclePause, X, Loader2 } from 'lucide-react';

export interface BulkChangeStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (status: string) => Promise<void> | void;
  itemCount: number;
  itemNames: string[];
  entityType: 'ad group' | 'ad';
  statusType?: 'adGroup' | 'ad';
}

const BulkChangeStatusModal: React.FC<BulkChangeStatusModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  itemCount,
  itemNames,
  entityType,
  statusType = 'adGroup',
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>(
    statusType === 'adGroup' ? 'active' : 'enabled'
  );

  const displayNames = itemNames.slice(0, 5);
  const remainingCount = itemCount - displayNames.length;

  const statusOptions = statusType === 'adGroup'
    ? [
        { value: 'active', label: 'Active', icon: Circle, color: 'text-green-600' },
        { value: 'paused', label: 'Paused', icon: CirclePause, color: 'text-yellow-600' },
      ]
    : [
        { value: 'enabled', label: 'Enabled', icon: Circle, color: 'text-green-600' },
        { value: 'paused', label: 'Paused', icon: CirclePause, color: 'text-yellow-600' },
        { value: 'disabled', label: 'Disabled', icon: X, color: 'text-red-600' },
      ];

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true);
      await onConfirm(selectedStatus);
      onClose();
    } catch (error) {
      console.error('Bulk status update failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Change status for ${itemCount} ${entityType}${itemCount !== 1 ? 's' : ''}`}
      size="md"
      footer={
        <>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Updating...
              </span>
            ) : (
              'Change Status'
            )}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Status Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select new status
          </label>
          <div className="grid grid-cols-1 gap-2">
            {statusOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = selectedStatus === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => setSelectedStatus(option.value)}
                  className={`
                    flex items-center space-x-3 px-4 py-3 rounded-lg border-2 transition-all
                    ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }
                  `}
                  disabled={isSubmitting}
                >
                  <div
                    className={`
                      w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
                      ${isSelected ? 'border-blue-500' : 'border-gray-300'}
                    `}
                  >
                    {isSelected && (
                      <div className="w-3 h-3 bg-blue-600 rounded-full" />
                    )}
                  </div>
                  <Icon className={`w-5 h-5 ${option.color}`} />
                  <span className={`text-sm font-medium ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* List of Items to Update */}
        {itemNames.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Items to be updated:
            </p>
            <ul className="space-y-1">
              {displayNames.map((name, index) => (
                <li key={index} className="text-sm text-gray-900 flex items-start">
                  <span className="text-gray-400 mr-2">•</span>
                  <span className="flex-1 truncate">{name}</span>
                </li>
              ))}
              {remainingCount > 0 && (
                <li className="text-sm text-gray-500 italic flex items-start">
                  <span className="text-gray-400 mr-2">•</span>
                  <span>and {remainingCount} more...</span>
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Info Message */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-800">
            This will update the status of all {itemCount} selected {entityType}
            {itemCount !== 1 ? 's' : ''}.
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default BulkChangeStatusModal;
