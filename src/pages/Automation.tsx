import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap,
  Upload,
  Lightbulb,
  Settings as SettingsIcon,
  Clock,
  Sheet,
  ArrowLeft
} from 'lucide-react';
import AutomationRules from '../components/automation/AutomationRules';
import ImportManager from '../components/automation/ImportManager';
import RecommendationsDashboard from '../components/automation/RecommendationsDashboard';
import GoogleSheetsSetup from '../components/automation/GoogleSheetsSetup';
import AutomationHistory from '../components/automation/AutomationHistory';

type Tab = 'rules' | 'recommendations' | 'import' | 'sheets' | 'history';

export default function Automation() {
  const [activeTab, setActiveTab] = useState<Tab>('rules');
  const navigate = useNavigate();

  const tabs = [
    { id: 'rules' as Tab, label: 'Automation Rules', icon: Zap },
    { id: 'recommendations' as Tab, label: 'Recommendations', icon: Lightbulb },
    { id: 'import' as Tab, label: 'Import', icon: Upload },
    { id: 'sheets' as Tab, label: 'Google Sheets', icon: Sheet },
    { id: 'history' as Tab, label: 'History', icon: Clock },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Navigation */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Dashboard</span>
        </button>

        <div className="mt-4 mb-8">
          <div className="flex items-center gap-3 mb-2">
            <SettingsIcon className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Automation & Optimization
            </h1>
          </div>
          <p className="text-gray-600">
            Automate your Google Ads management with smart rules, recommendations, and data imports
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap
                    ${activeTab === tab.id
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'rules' && <AutomationRules />}
            {activeTab === 'recommendations' && <RecommendationsDashboard />}
            {activeTab === 'import' && <ImportManager />}
            {activeTab === 'sheets' && <GoogleSheetsSetup />}
            {activeTab === 'history' && <AutomationHistory />}
          </div>
        </div>
      </div>
    </div>
  );
}
