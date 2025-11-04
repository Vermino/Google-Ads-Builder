import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '@/components/common/Modal';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import { useCampaignStore } from '@/stores/useCampaignStore';
import type { AdGroup, MatchTypeBidModifier } from '@/types';

export interface NewAdGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId: string;
}

const NewAdGroupModal: React.FC<NewAdGroupModalProps> = ({ isOpen, onClose, campaignId }) => {
  const navigate = useNavigate();
  const addAdGroup = useCampaignStore((state) => state.addAdGroup);

  const [formData, setFormData] = useState({
    name: '',
    maxCpc: '1.00',
    status: 'active' as const,
    matchTypes: {
      exact: true,
      phrase: true,
      broad: false,
    },
    matchTypeModifiers: {
      exact: '0',
      phrase: '0',
      broad: '0',
      broadModifier: '0',
    },
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Ad group name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Ad group name must be at least 3 characters';
    }

    const maxCpcNum = parseFloat(formData.maxCpc);
    if (!formData.maxCpc || isNaN(maxCpcNum)) {
      newErrors.maxCpc = 'Max CPC is required';
    } else if (maxCpcNum < 0.01) {
      newErrors.maxCpc = 'Max CPC must be at least $0.01';
    }

    const hasMatchType = Object.values(formData.matchTypes).some((enabled) => enabled);
    if (!hasMatchType) {
      newErrors.matchTypes = 'At least one match type must be selected';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const now = new Date().toISOString();
    const adGroupId = `adgroup-${Date.now()}`;

    const matchTypeBidding: MatchTypeBidModifier = {
      exact: {
        enabled: formData.matchTypes.exact,
        percentage: parseFloat(formData.matchTypeModifiers.exact),
      },
      phrase: {
        enabled: formData.matchTypes.phrase,
        percentage: parseFloat(formData.matchTypeModifiers.phrase),
      },
      broad: {
        enabled: formData.matchTypes.broad,
        percentage: parseFloat(formData.matchTypeModifiers.broad),
      },
      broadModifier: {
        enabled: false, // Legacy, typically disabled
        percentage: parseFloat(formData.matchTypeModifiers.broadModifier),
      },
    };

    const newAdGroup: AdGroup = {
      id: adGroupId,
      campaignId,
      name: formData.name,
      status: formData.status,
      maxCpc: parseFloat(formData.maxCpc),
      matchTypeBidding,
      keywords: [],
      ads: [],
      createdAt: now,
      updatedAt: now,
    };

    // Wait for backend to create and return the ad group with the real ID
    const createdAdGroup = await addAdGroup(campaignId, newAdGroup);

    // Reset form
    setFormData({
      name: '',
      maxCpc: '1.00',
      status: 'active',
      matchTypes: {
        exact: true,
        phrase: true,
        broad: false,
      },
      matchTypeModifiers: {
        exact: '0',
        phrase: '0',
        broad: '0',
        broadModifier: '0',
      },
    });
    setErrors({});

    onClose();
    // Use the backend-generated ID for navigation
    if (createdAdGroup) {
      navigate(`/campaigns/${campaignId}/ad-groups/${createdAdGroup.id}`);
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleMatchTypeChange = (matchType: keyof typeof formData.matchTypes, enabled: boolean) => {
    setFormData((prev) => ({
      ...prev,
      matchTypes: {
        ...prev.matchTypes,
        [matchType]: enabled,
      },
    }));
    if (errors.matchTypes) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.matchTypes;
        return newErrors;
      });
    }
  };

  const handleModifierChange = (
    matchType: keyof typeof formData.matchTypeModifiers,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      matchTypeModifiers: {
        ...prev.matchTypeModifiers,
        [matchType]: value,
      },
    }));
  };

  const footer = (
    <>
      <Button variant="secondary" onClick={onClose}>
        Cancel
      </Button>
      <Button variant="primary" onClick={handleSubmit}>
        Create Ad Group
      </Button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Ad Group" footer={footer} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Ad Group Name"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          error={errors.name}
          placeholder="e.g., Running Shoes - Exact Match"
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Max CPC ($)"
            type="number"
            value={formData.maxCpc}
            onChange={(e) => handleChange('maxCpc', e.target.value)}
            error={errors.maxCpc}
            min="0.01"
            step="0.01"
            helperText="Default bid for keywords in this ad group"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ad Group Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="active">Active</option>
              <option value="paused">Paused</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Match Types
          </label>
          {errors.matchTypes && (
            <p className="text-xs text-red-600 mb-2">{errors.matchTypes}</p>
          )}
          <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="exact"
                checked={formData.matchTypes.exact}
                onChange={(e) => handleMatchTypeChange('exact', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="exact" className="flex-1 text-sm text-gray-700">
                <span className="font-medium">Exact Match</span>
                <span className="text-gray-500 ml-2">- Precise searches only</span>
              </label>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="phrase"
                checked={formData.matchTypes.phrase}
                onChange={(e) => handleMatchTypeChange('phrase', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="phrase" className="flex-1 text-sm text-gray-700">
                <span className="font-medium">Phrase Match</span>
                <span className="text-gray-500 ml-2">- Keyword phrase in query</span>
              </label>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="broad"
                checked={formData.matchTypes.broad}
                onChange={(e) => handleMatchTypeChange('broad', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="broad" className="flex-1 text-sm text-gray-700">
                <span className="font-medium">Broad Match</span>
                <span className="text-gray-500 ml-2">- Related searches</span>
              </label>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Match Type Bid Modifiers (Optional)
          </label>
          <p className="text-xs text-gray-500 mb-3">
            Adjust bids by percentage for each match type. Positive values increase bids, negative
            values decrease them.
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Exact (%)</label>
              <input
                type="number"
                value={formData.matchTypeModifiers.exact}
                onChange={(e) => handleModifierChange('exact', e.target.value)}
                disabled={!formData.matchTypes.exact}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                step="5"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">Phrase (%)</label>
              <input
                type="number"
                value={formData.matchTypeModifiers.phrase}
                onChange={(e) => handleModifierChange('phrase', e.target.value)}
                disabled={!formData.matchTypes.phrase}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                step="5"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">Broad (%)</label>
              <input
                type="number"
                value={formData.matchTypeModifiers.broad}
                onChange={(e) => handleModifierChange('broad', e.target.value)}
                disabled={!formData.matchTypes.broad}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                step="5"
                placeholder="0"
              />
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default NewAdGroupModal;
