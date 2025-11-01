import { useNavigate } from 'react-router-dom';
import { useCampaignStore } from '@/stores/useCampaignStore';
import CampaignList from '@/components/campaigns/CampaignList';

const Dashboard = () => {
  const campaigns = useCampaignStore((state) => state.campaigns);
  const navigate = useNavigate();

  const handleCampaignClick = (campaignId: string) => {
    navigate(`/campaigns/${campaignId}`);
  };

  const handleNewCampaign = () => {
    // TODO: Implement campaign creation in Phase 2
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
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Your Campaigns</h2>
          <p className="text-gray-600">Manage your Google Ads campaigns with AI-powered copy generation</p>
        </div>

        <CampaignList campaigns={campaigns} onCampaignClick={handleCampaignClick} />
      </main>
    </div>
  );
};

export default Dashboard;
