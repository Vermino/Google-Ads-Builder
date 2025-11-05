import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCampaignStore } from '@/stores/useCampaignStore';
import AdGroupSettings from '@/components/adgroups/AdGroupSettings';
import MatchTypeBidding from '@/components/adgroups/MatchTypeBidding';
import KeywordManager from '@/components/adgroups/KeywordManager';
import AdList from '@/components/ads/AdList';
import NewAdModal from '@/components/modals/NewAdModal';
import KeywordResearchModal from '@/components/modals/KeywordResearchModal';
import BulkActionToolbar from '@/components/common/BulkActionToolbar';
import { BulkDeleteConfirmModal, BulkChangeStatusModal } from '@/components/modals';
import { useToast } from '@/hooks/useToast';
import type { Keyword, ResponsiveSearchAd } from '@/types';
import type { MatchTypeSettings } from '@/services/keywordResearchService';

const AdGroupBuilder = () => {
  const { campaignId, adGroupId } = useParams<{ campaignId: string; adGroupId: string }>();
  const navigate = useNavigate();
  const [isNewAdModalOpen, setIsNewAdModalOpen] = useState(false);
  const [isKeywordResearchModalOpen, setIsKeywordResearchModalOpen] = useState(false);

  // Bulk selection state
  const [selectedAdIds, setSelectedAdIds] = useState<string[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  const adGroup = useCampaignStore((state) => state.getAdGroup(campaignId!, adGroupId!));
  const updateAdGroup = useCampaignStore((state) => state.updateAdGroup);
  const addKeyword = useCampaignStore((state) => state.addKeyword);
  const addKeywords = useCampaignStore((state) => state.addKeywords);
  const updateKeyword = useCampaignStore((state) => state.updateKeyword);
  const deleteKeyword = useCampaignStore((state) => state.deleteKeyword);

  // Bulk operations
  const deleteAds = useCampaignStore((state) => state.deleteAds);
  const duplicateAds = useCampaignStore((state) => state.duplicateAds);
  const updateAdsStatus = useCampaignStore((state) => state.updateAdsStatus);

  const toast = useToast();

  if (!adGroup) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Ad Group not found</h2>
          <p className="text-gray-600">The ad group you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate(`/campaigns/${campaignId}`)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Campaign
          </button>
        </div>
      </div>
    );
  }

  // Selection handlers
  const handleSelectOne = useCallback((id: string, checked: boolean) => {
    if (checked) {
      setSelectedAdIds((prev) => [...prev, id]);
    } else {
      setSelectedAdIds((prev) => prev.filter((adId) => adId !== id));
    }
  }, []);

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked && adGroup) {
      setSelectedAdIds(adGroup.ads.map((ad) => ad.id));
    } else {
      setSelectedAdIds([]);
    }
  }, [adGroup]);

  const handleClearSelection = useCallback(() => {
    setSelectedAdIds([]);
  }, []);

  // Bulk action handlers
  const handleBulkDelete = useCallback(() => {
    setIsDeleteModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (campaignId && adGroupId) {
      deleteAds(campaignId, adGroupId, selectedAdIds);
      toast.success(`${selectedAdIds.length} ad${selectedAdIds.length !== 1 ? 's' : ''} deleted`);
      setSelectedAdIds([]);
    }
  }, [campaignId, adGroupId, selectedAdIds, deleteAds, toast]);

  const handleBulkDuplicate = useCallback(() => {
    if (campaignId && adGroupId) {
      duplicateAds(campaignId, adGroupId, selectedAdIds);
      toast.success(`${selectedAdIds.length} ad${selectedAdIds.length !== 1 ? 's' : ''} duplicated`);
      setSelectedAdIds([]);
    }
  }, [campaignId, adGroupId, selectedAdIds, duplicateAds, toast]);

  const handleBulkChangeStatus = useCallback(() => {
    setIsStatusModalOpen(true);
  }, []);

  const handleConfirmChangeStatus = useCallback((status: string) => {
    if (campaignId && adGroupId) {
      updateAdsStatus(campaignId, adGroupId, selectedAdIds, status as ResponsiveSearchAd['status']);
      toast.success(`${selectedAdIds.length} ad${selectedAdIds.length !== 1 ? 's' : ''} updated`);
      setSelectedAdIds([]);
    }
  }, [campaignId, adGroupId, selectedAdIds, updateAdsStatus, toast]);

  // Keyword shortcuts and handlers
  const handleOpenKeywordResearch = useCallback(() => {
    setIsKeywordResearchModalOpen(true);
  }, []);

  const handleAddKeywordsFromResearch = useCallback(
    async (
      keywords: Array<{
        text: string;
        matchTypes: MatchTypeSettings;
      }>
    ) => {
      if (!campaignId || !adGroupId) return;

      const keywordsToAdd: Keyword[] = keywords.map((kw) => ({
        id: `kw-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text: kw.text,
      }));

      try {
        await addKeywords(campaignId, adGroupId, keywordsToAdd);
        toast.success(`Added ${keywords.length} keyword${keywords.length !== 1 ? 's' : ''} to ad group`);
      } catch (error: any) {
        console.error('Failed to add researched keywords:', error);
        toast.error(error.message || 'Failed to add researched keywords. Please try again.');
      }
    },
    [campaignId, adGroupId, addKeywords, toast]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K to open keyword research
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        handleOpenKeywordResearch();
      }
      // Ctrl+A or Cmd+A to select all
      if ((e.ctrlKey || e.metaKey) && e.key === 'a' && adGroup && adGroup.ads.length > 0) {
        e.preventDefault();
        handleSelectAll(true);
      }
      // Escape to clear selection
      if (e.key === 'Escape' && selectedAdIds.length > 0) {
        handleClearSelection();
      }
      // Delete key to delete selected
      if (e.key === 'Delete' && selectedAdIds.length > 0) {
        e.preventDefault();
        handleBulkDelete();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [adGroup, selectedAdIds, handleSelectAll, handleClearSelection, handleBulkDelete, handleOpenKeywordResearch]);

  const handleAddKeyword = useCallback(async () => {
    if (!campaignId || !adGroupId) return;

    const newKeyword: Keyword = {
      id: `kw-${Date.now()}`,
      text: '',
    };

    try {
      await addKeyword(campaignId, adGroupId, newKeyword);
    } catch (error: any) {
      console.error('Failed to add keyword:', error);
      toast.error(error.message || 'Failed to add keyword. Please try again.');
    }
  }, [campaignId, adGroupId, addKeyword, toast]);

  const handleUpdateKeyword = useCallback(
    async (keywordId: string, updates: Partial<Keyword>) => {
      if (!campaignId || !adGroupId) return;

      try {
        await updateKeyword(campaignId, adGroupId, keywordId, updates);
      } catch (error: any) {
        console.error(`Failed to update keyword ${keywordId}:`, error);
        toast.error(error.message || 'Failed to update keyword. Changes were reverted.');
      }
    },
    [campaignId, adGroupId, updateKeyword, toast]
  );

  const handleDeleteKeyword = useCallback(
    async (keywordId: string) => {
      if (!campaignId || !adGroupId) return;

      try {
        await deleteKeyword(campaignId, adGroupId, keywordId);
      } catch (error: any) {
        console.error(`Failed to delete keyword ${keywordId}:`, error);
        toast.error(error.message || 'Failed to delete keyword. Please try again.');
      }
    },
    [campaignId, adGroupId, deleteKeyword, toast]
  );

  const handleAdClick = (adId: string) => {
    navigate(`/campaigns/${campaignId}/ad-groups/${adGroupId}/ads/${adId}`);
  };

  const handleAddAd = () => {
    setIsNewAdModalOpen(true);
  };

  // Get selected ad names for modals
  const selectedAdNames = adGroup?.ads
    .filter((ad) => selectedAdIds.includes(ad.id))
    .map((ad) => ad.name) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(`/campaigns/${campaignId}`)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Back to campaign"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <div className="text-sm text-gray-500">Ad Group</div>
                <h1 className="text-xl font-bold text-gray-900">{adGroup.name}</h1>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                aria-label="Save ad group"
              >
                Save
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                aria-label="Export ad group to CSV"
              >
                Export CSV
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdGroupSettings
          adGroup={adGroup}
          onUpdate={(updates) => updateAdGroup(campaignId!, adGroupId!, updates)}
        />

        <MatchTypeBidding
          maxCpc={adGroup.maxCpc}
          matchTypeBidding={adGroup.matchTypeBidding}
          onUpdate={(matchTypeBidding) => updateAdGroup(campaignId!, adGroupId!, { matchTypeBidding })}
        />

        <KeywordManager
          keywords={adGroup.keywords}
          onAddKeyword={handleAddKeyword}
          onUpdateKeyword={handleUpdateKeyword}
          onDeleteKeyword={handleDeleteKeyword}
          onResearchKeywords={handleOpenKeywordResearch}
        />

        <AdList
          ads={adGroup.ads}
          onAdClick={handleAdClick}
          onAddClick={handleAddAd}
          selectedIds={selectedAdIds}
          onSelectOne={handleSelectOne}
          onSelectAll={handleSelectAll}
          isSelectionMode={selectedAdIds.length > 0}
        />
      </main>

      {/* Bulk Action Toolbar */}
      {selectedAdIds.length > 0 && (
        <BulkActionToolbar
          selectedCount={selectedAdIds.length}
          onDelete={handleBulkDelete}
          onDuplicate={handleBulkDuplicate}
          onChangeStatus={handleBulkChangeStatus as any}
          onCancel={handleClearSelection}
          entityType="ad"
          statusType="ad"
        />
      )}

      {/* New Ad Modal */}
      <NewAdModal
        isOpen={isNewAdModalOpen}
        onClose={() => setIsNewAdModalOpen(false)}
        campaignId={campaignId!}
        adGroupId={adGroupId!}
      />

      {/* Bulk Delete Confirm Modal */}
      <BulkDeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        itemCount={selectedAdIds.length}
        itemNames={selectedAdNames}
        entityType="ad"
      />

      {/* Bulk Change Status Modal */}
      <BulkChangeStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        onConfirm={handleConfirmChangeStatus}
        itemCount={selectedAdIds.length}
        itemNames={selectedAdNames}
        entityType="ad"
        statusType="ad"
      />

      {/* Keyword Research Modal */}
      <KeywordResearchModal
        isOpen={isKeywordResearchModalOpen}
        onClose={() => setIsKeywordResearchModalOpen(false)}
        onAddKeywords={handleAddKeywordsFromResearch}
        initialKeywords={adGroup.keywords.map((k) => k.text)}
        businessContext=""
      />
    </div>
  );
};

export default AdGroupBuilder;
