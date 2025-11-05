import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { useCampaignStore } from '@/stores/useCampaignStore';
import CampaignList from '@/components/campaigns/CampaignList';
import ExportButton from '@/components/common/ExportButton';
import ExportModal from '@/components/common/ExportModal';
import NewCampaignModal from '@/components/modals/NewCampaignModal';
import DeleteConfirmModal from '@/components/modals/DeleteConfirmModal';
import Toast from '@/components/common/Toast';
import { exportToGoogleAds } from '@/utils/csvExport';
import type { ExportOptions } from '@/utils/csvExport';

const Dashboard = () => {
  const campaigns = useCampaignStore((state) => state.campaigns);
  const loadCampaigns = useCampaignStore((state) => state.loadCampaigns);
  const deleteCampaign = useCampaignStore((state) => state.deleteCampaign);
  const loading = useCampaignStore((state) => state.loading);
  const navigate = useNavigate();
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isNewCampaignModalOpen, setIsNewCampaignModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<{ id: string; name: string } | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Load campaigns from backend on mount
  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  const handleCampaignClick = (campaignId: string) => {
    navigate(`/campaigns/${campaignId}`);
  };

  const handleNewCampaign = () => {
    setIsNewCampaignModalOpen(true);
  };

  const handleExportClick = () => {
    setIsExportModalOpen(true);
  };

  const handleExportModalClose = () => {
    setIsExportModalOpen(false);
  };

  const handleExport = async (options: ExportOptions) => {
    try {
      await exportToGoogleAds(options);
      setToast({
        message: 'Campaign data exported successfully!',
        type: 'success',
      });
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : 'Failed to export campaigns',
        type: 'error',
      });
      throw error; // Re-throw to let modal handle the error state
    }
  };

  const handleRequestDeleteCampaign = (campaignId: string) => {
    const campaign = campaigns.find((c) => c.id === campaignId);
    if (campaign) {
      setCampaignToDelete({ id: campaign.id, name: campaign.name });
      setIsDeleteModalOpen(true);
    }
  };

  const handleConfirmDeleteCampaign = async () => {
    if (!campaignToDelete) {
      return;
    }

    try {
      await deleteCampaign(campaignToDelete.id);
      setToast({
        message: `Campaign "${campaignToDelete.name}" deleted`,
        type: 'success',
      });
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : 'Failed to delete campaign',
        type: 'error',
      });
    }
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setCampaignToDelete(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Google Ads Campaign Builder</h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/settings')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Settings"
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
              <ExportButton onClick={handleExportClick} disabled={campaigns.length === 0} />
              <button
                onClick={handleNewCampaign}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 hover:bg-blue-700 transition-colors"
                aria-label="Create new campaign"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>New Campaign</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Your Campaigns</h2>
          <p className="text-gray-600">Manage your Google Ads campaigns with AI-powered copy generation</p>
        </div>

        {loading && campaigns.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading campaigns...</p>
            </div>
          </div>
        ) : (
          <CampaignList
            campaigns={campaigns}
            onCampaignClick={handleCampaignClick}
            onDelete={handleRequestDeleteCampaign}
          />
        )}
      </main>

      {/* New Campaign Modal */}
      <NewCampaignModal
        isOpen={isNewCampaignModalOpen}
        onClose={() => setIsNewCampaignModalOpen(false)}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={handleExportModalClose}
        campaigns={campaigns}
        onExport={handleExport}
      />

      {/* Delete Campaign Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen && Boolean(campaignToDelete)}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDeleteCampaign}
        itemName={campaignToDelete?.name ?? ''}
        entityType="campaign"
      />

      {/* Toast Notification */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default Dashboard;
