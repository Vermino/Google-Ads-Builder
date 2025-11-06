import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Zap, LayoutGrid, BarChart3 } from 'lucide-react';
import { useCampaignStore } from '@/stores/useCampaignStore';
import CampaignList from '@/components/campaigns/CampaignList';
import CampaignAnalytics from '@/components/dashboard/CampaignAnalytics';
import ExportButton from '@/components/common/ExportButton';
import ExportModal from '@/components/common/ExportModal';
import NewCampaignModal from '@/components/modals/NewCampaignModal';
import DeleteConfirmModal from '@/components/modals/DeleteConfirmModal';
import Toast from '@/components/common/Toast';
import { exportToGoogleAds } from '@/utils/csvExport';
import type { ExportOptions } from '@/utils/csvExport';

type DashboardTab = 'campaigns' | 'analytics';

const Dashboard = () => {
  const campaigns = useCampaignStore((state) => state.campaigns);
  const loadCampaigns = useCampaignStore((state) => state.loadCampaigns);
  const deleteCampaign = useCampaignStore((state) => state.deleteCampaign);
  const loading = useCampaignStore((state) => state.loading);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<DashboardTab>('campaigns');
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
                onClick={() => navigate('/automation')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Automation"
                title="Automation"
              >
                <Zap className="w-5 h-5" />
              </button>
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
        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('campaigns')}
              className={`pb-4 px-2 font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'campaigns'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <LayoutGrid className="w-5 h-5" />
              <span>Campaigns</span>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`pb-4 px-2 font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'analytics'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              <span>Analytics & Insights</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'campaigns' && (
          <>
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
          </>
        )}

        {activeTab === 'analytics' && (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Analytics & Insights</h2>
              <p className="text-gray-600">Performance metrics, recommendations, and insights for each campaign</p>
            </div>

            {loading && campaigns.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">Loading campaigns...</p>
                </div>
              </div>
            ) : campaigns.length === 0 ? (
              <div className="text-center py-12">
                <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns yet</h3>
                <p className="text-gray-600 mb-4">Create your first campaign to see analytics and insights</p>
                <button
                  onClick={handleNewCampaign}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Create Campaign
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {campaigns.map((campaign) => (
                  <div key={campaign.id} className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{campaign.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Status: <span className={`font-medium ${
                            campaign.status === 'active' ? 'text-green-600' :
                            campaign.status === 'draft' ? 'text-gray-600' :
                            'text-yellow-600'
                          }`}>{campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}</span>
                        </p>
                      </div>
                      <button
                        onClick={() => handleCampaignClick(campaign.id)}
                        className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                      >
                        View Campaign →
                      </button>
                    </div>
                    <CampaignAnalytics campaign={campaign} />
                  </div>
                ))}
              </div>
            )}
          </>
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
