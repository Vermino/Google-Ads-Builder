import React from 'react';
import Modal from '@/components/common/Modal';
import { AlertTriangle } from 'lucide-react';

export interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  entityType: 'campaign' | 'ad group' | 'ad';
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  entityType,
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  // Determine cascade warning message
  const getCascadeWarning = () => {
    if (entityType === 'campaign') {
      return 'Deleting this campaign will also delete all associated ad groups, ads, and keywords.';
    }
    if (entityType === 'ad group') {
      return 'Deleting this ad group will also delete all associated ads and keywords.';
    }
    return null;
  };

  const cascadeWarning = getCascadeWarning();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Delete ${entityType}?`}
      size="md"
      footer={
        <>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
          >
            Delete {entityType}
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
              <span className="font-semibold">"{itemName}"</span>? This action cannot be undone.
            </p>
          </div>
        </div>

        {/* Cascade Warning */}
        {cascadeWarning && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-yellow-800">{cascadeWarning}</p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default DeleteConfirmModal;
