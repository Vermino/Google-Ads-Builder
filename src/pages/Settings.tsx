import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import AISettings from '@/components/settings/AISettings';

const Settings: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Settings</h1>
              <p className="text-sm text-gray-600">Configure your application settings</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl">
          {/* Settings Tabs */}
          <div className="bg-white border border-gray-200 rounded-lg mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button className="px-6 py-3 border-b-2 border-blue-600 text-blue-600 font-medium text-sm">
                  AI Configuration
                </button>
                <button className="px-6 py-3 border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-medium text-sm">
                  General
                </button>
                <button className="px-6 py-3 border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-medium text-sm">
                  Export
                </button>
              </nav>
            </div>

            {/* AI Settings Content */}
            <div className="p-6">
              <AISettings />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;
