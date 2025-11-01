import React, { useState, useEffect } from 'react';
import { Download, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import type { Campaign } from '@/types';

export interface ExportOptions {
  campaignIds: string[];
  includeAdGroups?: boolean;
  includeAds?: boolean;
  includeKeywords?: boolean;
}

export interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaigns: Campaign[];
  onExport: (options: ExportOptions) => Promise<void>;
}

const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  campaigns,
  onExport,
}) => {
  const [selectedCampaigns, setSelectedCampaigns] = useState<Set<string>>(new Set());
  const [includeAdGroups, setIncludeAdGroups] = useState(true);
  const [includeAds, setIncludeAds] = useState(true);
  const [includeKeywords, setIncludeKeywords] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedCampaigns(new Set());
      setIncludeAdGroups(true);
      setIncludeAds(true);
      setIncludeKeywords(true);
      setIsExporting(false);
      setExportStatus('idle');
      setErrorMessage('');
    }
  }, [isOpen]);

  const handleToggleCampaign = (campaignId: string) => {
    setSelectedCampaigns((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(campaignId)) {
        newSet.delete(campaignId);
      } else {
        newSet.add(campaignId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedCampaigns.size === campaigns.length) {
      setSelectedCampaigns(new Set());
    } else {
      setSelectedCampaigns(new Set(campaigns.map((c) => c.id)));
    }
  };

  const handleExport = async () => {
    if (selectedCampaigns.size === 0) {
      setExportStatus('error');
      setErrorMessage('Please select at least one campaign to export');
      return;
    }

    setIsExporting(true);
    setExportStatus('idle');
    setErrorMessage('');

    try {
      await onExport({
        campaignIds: Array.from(selectedCampaigns),
        includeAdGroups,
        includeAds,
        includeKeywords,
      });
      setExportStatus('success');

      // Auto-close after success
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      setExportStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to export campaigns');
      setIsExporting(false);
    }
  };

  const allSelected = campaigns.length > 0 && selectedCampaigns.size === campaigns.length;

  const footer = (
    <>
      <Button variant="secondary" onClick={onClose} disabled={isExporting}>
        Cancel
      </Button>
      <Button
        variant="primary"
        onClick={handleExport}
        disabled={isExporting || selectedCampaigns.size === 0}
        className="inline-flex items-center gap-2"
      >
        {isExporting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Exporting...</span>
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            <span>Export to CSV</span>
          </>
        )}
      </Button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Export to Google Ads CSV" footer={footer} size="lg">
      <div className="space-y-6">
        {/* Status Messages */}
        {exportStatus === 'success' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div className="text-sm text-green-800">
              <strong>Export successful!</strong> Your CSV file has been downloaded.
            </div>
          </div>
        )}

        {exportStatus === 'error' && errorMessage && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div className="text-sm text-red-800">
              <strong>Export failed:</strong> {errorMessage}
            </div>
          </div>
        )}

        {/* Campaign Selection */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-900">
              Select Campaigns
            </label>
            <button
              onClick={handleSelectAll}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              type="button"
            >
              {allSelected ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          {campaigns.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No campaigns available to export</p>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg divide-y divide-gray-200 max-h-64 overflow-y-auto">
              {campaigns.map((campaign) => (
                <label
                  key={campaign.id}
                  className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedCampaigns.has(campaign.id)}
                    onChange={() => handleToggleCampaign(campaign.id)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    disabled={isExporting}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{campaign.name}</div>
                    <div className="text-sm text-gray-500">
                      {campaign.adGroups.length} ad group{campaign.adGroups.length !== 1 ? 's' : ''} •
                      {' '}{campaign.adGroups.reduce((sum, ag) => sum + ag.ads.length, 0)} ad{campaign.adGroups.reduce((sum, ag) => sum + ag.ads.length, 0) !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      campaign.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : campaign.status === 'paused'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {campaign.status}
                  </span>
                </label>
              ))}
            </div>
          )}

          {selectedCampaigns.size > 0 && (
            <p className="mt-2 text-sm text-gray-600">
              {selectedCampaigns.size} campaign{selectedCampaigns.size !== 1 ? 's' : ''} selected
            </p>
          )}
        </div>

        {/* Export Options */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-3">
            Export Options
          </label>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includeAdGroups}
                onChange={(e) => setIncludeAdGroups(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                disabled={isExporting}
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">Include Ad Groups</div>
                <div className="text-xs text-gray-500">Export all ad groups within selected campaigns</div>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includeAds}
                onChange={(e) => setIncludeAds(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                disabled={isExporting}
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">Include Ads</div>
                <div className="text-xs text-gray-500">Export all responsive search ads with headlines and descriptions</div>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includeKeywords}
                onChange={(e) => setIncludeKeywords(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                disabled={isExporting}
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">Include Keywords</div>
                <div className="text-xs text-gray-500">Export all keywords and match types for each ad group</div>
              </div>
            </label>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            The exported CSV file will be formatted for direct import into Google Ads Editor.
            Make sure to review the data before importing to your Google Ads account.
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default ExportModal;
