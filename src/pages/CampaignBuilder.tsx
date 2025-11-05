import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCampaignStore } from '@/stores/useCampaignStore';
import CampaignSettings from '@/components/campaigns/CampaignSettings';
import GlobalDescriptions from '@/components/campaigns/GlobalDescriptions';
import AdGroupList from '@/components/adgroups/AdGroupList';
import NewAdGroupModal from '@/components/modals/NewAdGroupModal';
import BulkActionToolbar from '@/components/common/BulkActionToolbar';
import { BulkDeleteConfirmModal, BulkChangeStatusModal, DeleteConfirmModal } from '@/components/modals';
import { useToast } from '@/hooks/useToast';
import type { AdGroup } from '@/types';

const CampaignBuilder = () => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const [isNewAdGroupModalOpen, setIsNewAdGroupModalOpen] = useState(false);

  // Bulk selection state
  const [selectedAdGroupIds, setSelectedAdGroupIds] = useState<string[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  // Single delete state
  const [adGroupToDelete, setAdGroupToDelete] = useState<{ id: string; name: string } | null>(null);

  const campaign = useCampaignStore((state) => state.getCampaign(campaignId!));
  const loadCampaigns = useCampaignStore((state) => state.loadCampaigns);
  const loading = useCampaignStore((state) => state.loading);
  const updateCampaign = useCampaignStore((state) => state.updateCampaign);
  const updateGlobalDescription = useCampaignStore((state) => state.updateGlobalDescription);

  // Bulk operations
  const deleteAdGroup = useCampaignStore((state) => state.deleteAdGroup);
  const deleteAdGroups = useCampaignStore((state) => state.deleteAdGroups);
  const duplicateAdGroups = useCampaignStore((state) => state.duplicateAdGroups);
  const updateAdGroupsStatus = useCampaignStore((state) => state.updateAdGroupsStatus);

  const toast = useToast();

  // Load campaigns from backend on mount if not already loaded
  useEffect(() => {
    if (!campaign) {
      loadCampaigns();
    }
  }, [campaign, loadCampaigns]);

  if (loading && !campaign) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading campaign...</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Campaign not found</h2>
          <p className="text-gray-600">The campaign you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Selection handlers
  const handleSelectOne = useCallback((id: string, checked: boolean) => {
    if (checked) {
      setSelectedAdGroupIds((prev) => [...prev, id]);
    } else {
      setSelectedAdGroupIds((prev) => prev.filter((agId) => agId !== id));
    }
  }, []);

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked && campaign) {
      setSelectedAdGroupIds(campaign.adGroups.map((ag) => ag.id));
    } else {
      setSelectedAdGroupIds([]);
    }
  }, [campaign]);

  const handleClearSelection = useCallback(() => {
    setSelectedAdGroupIds([]);
  }, []);

  // Bulk action handlers
  const handleBulkDelete = useCallback(() => {
    setIsBulkDeleteModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!campaignId || selectedAdGroupIds.length === 0) {
      return;
    }

    try {
      await deleteAdGroups(campaignId, selectedAdGroupIds);
      toast.success(`${selectedAdGroupIds.length} ad group${selectedAdGroupIds.length !== 1 ? 's' : ''} deleted`);
      setSelectedAdGroupIds([]);
      setIsBulkDeleteModalOpen(false);
    } catch (error) {
      console.error('Failed to delete ad groups:', error);
      toast.error('Failed to delete selected ad groups. Please try again.');
      throw error;
    }
  }, [campaignId, selectedAdGroupIds, deleteAdGroups, toast]);

  const handleRequestDeleteAdGroup = useCallback(
    (adGroupId: string) => {
      const adGroup = campaign?.adGroups.find((ag) => ag.id === adGroupId);
      if (adGroup) {
        setAdGroupToDelete({ id: adGroup.id, name: adGroup.name });
      }
    },
    [campaign]
  );

  const handleConfirmDeleteAdGroup = useCallback(async () => {
    if (campaignId && adGroupToDelete) {
      try {
        await deleteAdGroup(campaignId, adGroupToDelete.id);
        setSelectedAdGroupIds((prev) => prev.filter((id) => id !== adGroupToDelete.id));
        toast.success(`Ad group "${adGroupToDelete.name}" deleted`);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete ad group';
        toast.error(message);
        return;
      }

      setAdGroupToDelete(null);
    }
  }, [campaignId, adGroupToDelete, deleteAdGroup, toast]);

  const handleCloseDeleteModal = useCallback(() => {
    setAdGroupToDelete(null);
  }, []);

  const handleBulkDuplicate = useCallback(async () => {
    if (!campaignId || selectedAdGroupIds.length === 0) {
      return;
    }

    try {
      await duplicateAdGroups(campaignId, selectedAdGroupIds);
      toast.success(`${selectedAdGroupIds.length} ad group${selectedAdGroupIds.length !== 1 ? 's' : ''} duplicated`);
      setSelectedAdGroupIds([]);
    } catch (error) {
      console.error('Failed to duplicate ad groups:', error);
      toast.error('Failed to duplicate selected ad groups. Please try again.');
      throw error;
    }
  }, [campaignId, selectedAdGroupIds, duplicateAdGroups, toast]);

  const handleBulkChangeStatus = useCallback(() => {
    setIsStatusModalOpen(true);
  }, []);

  const handleConfirmChangeStatus = useCallback(
    async (status: string) => {
      if (!campaignId || selectedAdGroupIds.length === 0) {
        return;
      }

      try {
        await updateAdGroupsStatus(campaignId, selectedAdGroupIds, status as AdGroup['status']);
        toast.success(`${selectedAdGroupIds.length} ad group${selectedAdGroupIds.length !== 1 ? 's' : ''} updated`);
        setSelectedAdGroupIds([]);
      } catch (error) {
        console.error('Failed to update ad group statuses:', error);
        toast.error('Failed to update ad group statuses. Please try again.');
        throw error;
      }
    },
    [campaignId, selectedAdGroupIds, updateAdGroupsStatus, toast]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+A or Cmd+A to select all
      if ((e.ctrlKey || e.metaKey) && e.key === 'a' && campaign && campaign.adGroups.length > 0) {
        e.preventDefault();
        handleSelectAll(true);
      }
      // Escape to clear selection
      if (e.key === 'Escape' && selectedAdGroupIds.length > 0) {
        handleClearSelection();
      }
      // Delete key to delete selected
      if (e.key === 'Delete' && selectedAdGroupIds.length > 0) {
        e.preventDefault();
        handleBulkDelete();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [campaign, selectedAdGroupIds, handleSelectAll, handleClearSelection, handleBulkDelete]);

  const handleAdGroupClick = (adGroupId: string) => {
    navigate(`/campaigns/${campaignId}/ad-groups/${adGroupId}`);
  };

  const handleAddAdGroup = () => {
    setIsNewAdGroupModalOpen(true);
  };

  // Get selected ad group names for modals
  const selectedAdGroupNames = campaign?.adGroups
    .filter((ag) => selectedAdGroupIds.includes(ag.id))
    .map((ag) => ag.name) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Back to dashboard"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <div className="text-sm text-gray-500">Campaign</div>
                <h1 className="text-xl font-bold text-gray-900">{campaign.name}</h1>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                aria-label="Save campaign"
              >
                Save
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                aria-label="Export campaign to CSV"
              >
                Export CSV
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CampaignSettings
          campaign={campaign}
          onUpdate={(updates) => updateCampaign(campaignId!, updates)}
        />

        <GlobalDescriptions
          campaign={campaign}
          onUpdateDescription={(descId, updates) => updateGlobalDescription(campaignId!, descId, updates)}
          onUpdateCampaign={(updates) => updateCampaign(campaignId!, updates)}
        />

        <AdGroupList
          adGroups={campaign.adGroups}
          onAdGroupClick={handleAdGroupClick}
          onAddClick={handleAddAdGroup}
          selectedIds={selectedAdGroupIds}
          onSelectOne={handleSelectOne}
          onSelectAll={handleSelectAll}
          isSelectionMode={selectedAdGroupIds.length > 0}
          onDelete={handleRequestDeleteAdGroup}
        />
      </main>

      {/* Bulk Action Toolbar */}
      {selectedAdGroupIds.length > 0 && (
        <BulkActionToolbar
          selectedCount={selectedAdGroupIds.length}
          onDelete={handleBulkDelete}
          onDuplicate={handleBulkDuplicate}
          onChangeStatus={handleBulkChangeStatus as any}
          onCancel={handleClearSelection}
          entityType="ad group"
          statusType="adGroup"
        />
      )}

      {/* New Ad Group Modal */}
      <NewAdGroupModal
        isOpen={isNewAdGroupModalOpen}
        onClose={() => setIsNewAdGroupModalOpen(false)}
        campaignId={campaignId!}
      />

      {/* Bulk Delete Confirm Modal */}
      <BulkDeleteConfirmModal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        itemCount={selectedAdGroupIds.length}
        itemNames={selectedAdGroupNames}
        entityType="ad group"
      />

      {/* Bulk Change Status Modal */}
      <BulkChangeStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        onConfirm={handleConfirmChangeStatus}
        itemCount={selectedAdGroupIds.length}
        itemNames={selectedAdGroupNames}
        entityType="ad group"
        statusType="adGroup"
      />

      {/* Single Delete Confirm Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(adGroupToDelete)}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDeleteAdGroup}
        itemName={adGroupToDelete?.name ?? ''}
        entityType="ad group"
      />
    </div>
  );
};

export default CampaignBuilder;
