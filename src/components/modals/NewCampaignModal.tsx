import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '@/components/common/Modal';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import { useCampaignStore } from '@/stores/useCampaignStore';
import type { Campaign } from '@/types';

export interface NewCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NewCampaignModal: React.FC<NewCampaignModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const addCampaign = useCampaignStore((state) => state.addCampaign);

  const [formData, setFormData] = useState({
    name: '',
    budget: '100',
    dailyBudget: true,
    location: 'United States',
    status: 'active' as const,
    startDate: '',
    endDate: '',
    finalUrl: '',
    path1: '',
    path2: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Campaign name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Campaign name must be at least 3 characters';
    }

    const budgetNum = parseFloat(formData.budget);
    if (!formData.budget || isNaN(budgetNum)) {
      newErrors.budget = 'Budget is required';
    } else if (budgetNum < 1) {
      newErrors.budget = 'Budget must be at least $1';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location targeting is required';
    }

    if (!formData.finalUrl.trim()) {
      newErrors.finalUrl = 'Final URL is required';
    } else if (!isValidUrl(formData.finalUrl)) {
      newErrors.finalUrl = 'Please enter a valid URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const now = new Date().toISOString();
    const campaignId = `campaign-${Date.now()}`;

    const newCampaign: Campaign = {
      id: campaignId,
      name: formData.name,
      status: formData.status,
      budget: parseFloat(formData.budget),
      location: formData.location,
      startDate: formData.startDate || now,
      endDate: formData.endDate || undefined,
      finalUrl: formData.finalUrl.startsWith('http')
        ? formData.finalUrl
        : `https://${formData.finalUrl}`,
      path1: formData.path1 || undefined,
      path2: formData.path2 || undefined,
      globalDescriptions: [],
      adGroups: [],
      createdAt: now,
      updatedAt: now,
    };

    addCampaign(newCampaign);

    // Reset form
    setFormData({
      name: '',
      budget: '100',
      dailyBudget: true,
      location: 'United States',
      status: 'active',
      startDate: '',
      endDate: '',
      finalUrl: '',
      path1: '',
      path2: '',
    });
    setErrors({});

    onClose();
    navigate(`/campaigns/${campaignId}`);
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
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
        Create Campaign
      </Button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Campaign" footer={footer} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Campaign Name"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          error={errors.name}
          placeholder="e.g., Summer Sale 2024"
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Budget ($)"
            type="number"
            value={formData.budget}
            onChange={(e) => handleChange('budget', e.target.value)}
            error={errors.budget}
            min="1"
            step="0.01"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Campaign Status
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

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="dailyBudget"
            checked={formData.dailyBudget}
            onChange={(e) => handleChange('dailyBudget', e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="dailyBudget" className="text-sm text-gray-700">
            Daily Budget
          </label>
        </div>

        <Input
          label="Location Targeting"
          value={formData.location}
          onChange={(e) => handleChange('location', e.target.value)}
          error={errors.location}
          placeholder="e.g., United States, California, San Francisco"
          required
        />

        <Input
          label="Final URL"
          value={formData.finalUrl}
          onChange={(e) => handleChange('finalUrl', e.target.value)}
          error={errors.finalUrl}
          placeholder="e.g., www.example.com/landing-page"
          helperText="The URL where users will land after clicking your ad"
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Path 1 (Optional)"
            value={formData.path1}
            onChange={(e) => handleChange('path1', e.target.value)}
            placeholder="e.g., products"
            maxLength={15}
            helperText="Max 15 characters"
          />

          <Input
            label="Path 2 (Optional)"
            value={formData.path2}
            onChange={(e) => handleChange('path2', e.target.value)}
            placeholder="e.g., sale"
            maxLength={15}
            helperText="Max 15 characters"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date (Optional)
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => handleChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date (Optional)
            </label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => handleChange('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default NewCampaignModal;
