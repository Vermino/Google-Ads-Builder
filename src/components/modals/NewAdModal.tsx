import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '@/components/common/Modal';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import { useCampaignStore } from '@/stores/useCampaignStore';
import type { ResponsiveSearchAd } from '@/types';

export interface NewAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId: string;
  adGroupId: string;
}

const NewAdModal: React.FC<NewAdModalProps> = ({ isOpen, onClose, campaignId, adGroupId }) => {
  const navigate = useNavigate();
  const addAd = useCampaignStore((state) => state.addAd);
  const campaign = useCampaignStore((state) => state.getCampaign(campaignId));

  const [formData, setFormData] = useState({
    name: '',
    status: 'enabled' as const,
    adType: 'rsa',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Name is optional for ads, but if provided, it should be at least 3 characters
    if (formData.name.trim() && formData.name.length < 3) {
      newErrors.name = 'Ad name must be at least 3 characters if provided';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const now = new Date().toISOString();
    const adId = `ad-${Date.now()}`;

    // Use campaign's final URL and paths as defaults
    const finalUrl = campaign?.finalUrl || '';
    const path1 = campaign?.path1;
    const path2 = campaign?.path2;

    const newAd: ResponsiveSearchAd = {
      id: adId,
      adGroupId,
      name: formData.name || `Ad ${adId}`,
      status: formData.status,
      finalUrl,
      path1,
      path2,
      headlines: [],
      descriptions: [],
      createdAt: now,
      updatedAt: now,
    };

    addAd(campaignId, adGroupId, newAd);

    // Reset form
    setFormData({
      name: '',
      status: 'enabled',
      adType: 'rsa',
    });
    setErrors({});

    onClose();
    navigate(`/campaigns/${campaignId}/ad-groups/${adGroupId}/ads/${adId}`);
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const footer = (
    <>
      <Button variant="secondary" onClick={onClose}>
        Cancel
      </Button>
      <Button variant="primary" onClick={handleSubmit}>
        Create Ad
      </Button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Ad" footer={footer} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">Ad Content Builder</p>
              <p className="text-blue-600">
                This will create a blank ad structure. You'll add headlines, descriptions, and other
                content in the Ad Builder page.
              </p>
            </div>
          </div>
        </div>

        <Input
          label="Ad Name (Optional)"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          error={errors.name}
          placeholder="e.g., Running Shoes Ad A"
          helperText="Internal reference name for this ad"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ad Type</label>
          <select
            value={formData.adType}
            onChange={(e) => handleChange('adType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled
          >
            <option value="rsa">Responsive Search Ad (RSA)</option>
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Responsive Search Ads automatically test different combinations of your headlines and
            descriptions
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ad Status</label>
          <select
            value={formData.status}
            onChange={(e) => handleChange('status', e.target.value as 'enabled' | 'paused')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="enabled">Enabled</option>
            <option value="paused">Paused</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Default Settings</h4>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Final URL:</span>
              <span className="text-gray-900 font-mono text-xs truncate max-w-xs ml-2">
                {campaign?.finalUrl || 'Not set'}
              </span>
            </div>
            {campaign?.path1 && (
              <div className="flex justify-between">
                <span>Path 1:</span>
                <span className="text-gray-900">{campaign.path1}</span>
              </div>
            )}
            {campaign?.path2 && (
              <div className="flex justify-between">
                <span>Path 2:</span>
                <span className="text-gray-900">{campaign.path2}</span>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            These values are inherited from the campaign. You can customize them in the Ad Builder.
          </p>
        </div>
      </form>
    </Modal>
  );
};

export default NewAdModal;
