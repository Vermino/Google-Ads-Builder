import React, { useState } from 'react';
import Modal from '@/components/common/Modal';
import { AlertTriangle, Loader2 } from 'lucide-react';

export interface BulkDeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  itemCount: number;
  itemNames: string[];
  entityType: 'ad group' | 'ad';
}

const BulkDeleteConfirmModal: React.FC<BulkDeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  itemCount,
  itemNames,
  entityType,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const displayNames = itemNames.slice(0, 5);
  const remainingCount = itemCount - displayNames.length;

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true);
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Bulk deletion failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Delete ${itemCount} ${entityType}${itemCount !== 1 ? 's' : ''}?`}
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
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </span>
            ) : (
              <>Delete {entityType}{itemCount !== 1 ? 's' : ''}</>
            )}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Warning Icon & Message */}
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-700">
              Are you sure you want to delete{' '}
              <span className="font-semibold">
                {itemCount} {entityType}
                {itemCount !== 1 ? 's' : ''}
              </span>
              ? This action cannot be undone.
            </p>
          </div>
        </div>

        {/* List of Items to Delete */}
        {itemNames.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Items to be deleted:
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

        {/* Additional Warning for Nested Content */}
        {entityType === 'ad group' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-yellow-800">
                Deleting {itemCount !== 1 ? 'these ad groups' : 'this ad group'} will also delete all
                associated ads and keywords.
              </p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default BulkDeleteConfirmModal;
