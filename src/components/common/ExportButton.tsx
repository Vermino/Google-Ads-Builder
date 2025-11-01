import React from 'react';
import { Download } from 'lucide-react';
import Button from './Button';

export interface ExportButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

const ExportButton: React.FC<ExportButtonProps> = ({ onClick, disabled = false }) => {
  return (
    <Button
      variant="secondary"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-2"
      aria-label="Export campaigns to CSV"
    >
      <Download className="w-5 h-5" />
      <span>Export to CSV</span>
    </Button>
  );
};

export default ExportButton;
