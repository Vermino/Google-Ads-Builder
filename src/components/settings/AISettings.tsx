import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Loader2, AlertCircle, RefreshCw, Server, Key, Trash2 } from 'lucide-react';
import { apiClient, getAPIConfigDebug, isAPIConfigured } from '@/services/apiClient';
import ClaudeTokenSetup from './ClaudeTokenSetup';

const AISettings: React.FC = () => {
  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [providers, setProviders] = useState<string[]>([]);
  const [checking, setChecking] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTokenSetup, setShowTokenSetup] = useState(false);

  // Get API configuration for display
  const apiConfig = getAPIConfigDebug();

  /**
   * Test connection to backend API
   */
  const checkConnection = async () => {
    setChecking(true);
    setError(null);

    try {
      // Check health endpoint
      await apiClient.checkHealth();

      // Get available providers
      const result = await apiClient.getProviders();

      // Backend returns { success: true, data: { providers: [...] } }
      setProviders((result as any).data?.providers || result.providers || []);
      setIsConnected(true);
    } catch (err: any) {
      setIsConnected(false);
      setProviders([]);
      setError(err.message || 'Failed to connect to API server');
    } finally {
      setChecking(false);
    }
  };

  /**
   * Disconnect Claude token
   */
  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Claude? You will need to reconnect to use AI features.')) {
      return;
    }

    setDisconnecting(true);
    setError(null);

    try {
      await apiClient.disconnectClaude();
      console.log('✅ Claude disconnected successfully');

      // Refresh providers list
      await checkConnection();
    } catch (err: any) {
      setError(err.message || 'Failed to disconnect Claude');
      console.error('❌ Disconnect failed:', err);
    } finally {
      setDisconnecting(false);
    }
  };

  // Check connection on component mount
  useEffect(() => {
    if (isAPIConfigured()) {
      checkConnection();
    }
  }, []);

  return (
    <div className="max-w-3xl space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">AI Settings</h2>
        <p className="text-gray-600 mt-1">
          AI features are powered by a secure backend API server
        </p>
      </div>

      {/* Security Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="ml-3">
            <h4 className="text-sm font-semibold text-blue-800">Secure Backend Integration</h4>
            <p className="text-sm text-blue-700 mt-1">
              API keys are securely stored on the backend server. The frontend communicates
              with the backend via authenticated requests. No API keys are stored in the browser.
            </p>
          </div>
        </div>
      </div>

      {/* API Server Configuration */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Server className="w-6 h-6 text-purple-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">Backend API Server</h3>
            <p className="text-sm text-gray-600">Connection to AI generation service</p>
          </div>
        </div>

        {/* API Endpoint */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Endpoint
            </label>
            <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm text-gray-700">
              {apiConfig.baseUrl}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Configured via VITE_API_URL environment variable
            </p>
          </div>

          {/* Authentication Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Authentication
            </label>
            <div className="flex items-center space-x-2">
              {apiConfig.hasToken ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-green-700 font-medium">Token configured</span>
                  <span className="text-xs text-gray-500 font-mono ml-2">
                    ({apiConfig.tokenPrefix})
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-red-600" />
                  <span className="text-sm text-red-700 font-medium">No token configured</span>
                </>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Configured via VITE_API_TOKEN environment variable
            </p>
          </div>

          {/* Connection Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Connection Status
            </label>
            <div
              className={`p-4 rounded-lg border-2 ${
                isConnected
                  ? 'bg-green-50 border-green-200'
                  : error
                  ? 'bg-red-50 border-red-200'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {checking ? (
                    <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />
                  ) : isConnected ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span
                    className={`font-medium ${
                      isConnected ? 'text-green-700' : error ? 'text-red-700' : 'text-gray-700'
                    }`}
                  >
                    {checking
                      ? 'Testing connection...'
                      : isConnected
                      ? 'Connected'
                      : 'Disconnected'}
                  </span>
                </div>
                <button
                  onClick={checkConnection}
                  disabled={checking || !apiConfig.hasToken}
                  className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center space-x-1"
                >
                  <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
                  <span>Test</span>
                </button>
              </div>

              {error && (
                <div className="mt-2 text-sm text-red-600">
                  <p className="font-medium">Error:</p>
                  <p className="mt-1">{error}</p>
                </div>
              )}

              {!apiConfig.hasToken && !checking && (
                <div className="mt-2 text-sm text-gray-600">
                  <p>Please configure VITE_API_TOKEN in your .env.local file</p>
                </div>
              )}

              {!isConnected && apiConfig.hasToken && (
                <div className="mt-3">
                  <p className="text-sm text-gray-600">
                    Unable to connect to backend. Please ensure the server is running and Gemini API key is configured in server/.env
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Available Providers */}
          {isConnected && providers.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Available AI Providers
              </label>
              <div className="flex flex-wrap gap-2">
                {providers.map((provider) => (
                  <div
                    key={provider}
                    className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg"
                  >
                    <div className="flex items-center space-x-2">
                      {provider === 'openai' && (
                        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M22.282 9.821a5.985 5.985 0 00-.516-4.91 6.046 6.046 0 00-6.51-2.9A6.065 6.065 0 004.981 4.18a5.985 5.985 0 00-3.998 2.9 6.046 6.046 0 00.743 7.097 5.98 5.98 0 00.51 4.911 6.051 6.051 0 006.515 2.9A5.985 5.985 0 0013.26 24a6.056 6.056 0 005.772-4.206 5.99 5.99 0 003.997-2.9 6.056 6.056 0 00-.747-7.073zM13.26 22.43a4.476 4.476 0 01-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 00.392-.681v-6.737l2.02 1.168a.071.071 0 01.038.052v5.583a4.504 4.504 0 01-4.494 4.494zM3.6 18.304a4.47 4.47 0 01-.535-3.014l.142.085 4.783 2.759a.771.771 0 00.78 0l5.843-3.369v2.332a.08.08 0 01-.033.062L9.74 19.95a4.5 4.5 0 01-6.14-1.646zM2.34 7.896a4.485 4.485 0 012.366-1.973V11.6a.766.766 0 00.388.676l5.815 3.355-2.02 1.168a.076.076 0 01-.071 0l-4.83-2.786A4.504 4.504 0 012.34 7.896zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 01.071 0l4.83 2.791a4.494 4.494 0 01-.676 8.105v-5.678a.79.79 0 00-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 00-.785 0L9.409 9.23V6.897a.066.066 0 01.028-.061l4.83-2.787a4.5 4.5 0 016.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 01-.038-.057V6.075a4.5 4.5 0 017.375-3.453l-.142.08L8.704 5.46a.795.795 0 00-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
                        </svg>
                      )}
                      {provider === 'claude' && (
                        <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z" />
                        </svg>
                      )}
                      {provider === 'gemini' && (
                        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                        </svg>
                      )}
                      <span className="text-sm font-medium text-gray-900 capitalize">
                        {provider === 'openai' ? 'OpenAI GPT-4' : provider === 'claude' ? 'Claude Sonnet' : provider === 'gemini' ? 'Google Gemini' : provider}
                      </span>
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  These AI providers are configured on the backend server
                </p>
              </div>
            </div>
          )}

          {/* No Providers - Setup Required */}
          {isConnected && providers.length === 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                AI Providers
              </label>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-yellow-800">No AI Providers Configured</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Configure your AI provider API keys on the backend server to enable AI-powered ad copy generation.
                    </p>
                    <p className="text-xs text-yellow-600 mt-2">
                      Add GEMINI_API_KEY to server/.env to enable AI features (free tier available!)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Configuration Instructions */}
      {!apiConfig.hasToken && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="ml-3">
              <h4 className="text-sm font-semibold text-yellow-800">Configuration Required</h4>
              <p className="text-sm text-yellow-700 mt-1">
                To use AI features, create a <code className="px-1 py-0.5 bg-yellow-100 rounded">.env.local</code> file
                in the project root with the following:
              </p>
              <pre className="mt-2 p-3 bg-yellow-100 rounded text-xs font-mono text-yellow-900 overflow-x-auto">
{`VITE_API_URL=http://localhost:3001
VITE_API_TOKEN=your-api-token-here`}
              </pre>
              <p className="text-sm text-yellow-700 mt-2">
                Contact your administrator for the API token.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">Need Help?</h4>
        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
          <li>Ensure the backend API server is running on the configured endpoint</li>
          <li>Verify your API token is correct in the .env.local file</li>
          <li>Check that AI providers (OpenAI, Claude) are configured on the backend</li>
          <li>Review backend server logs for any errors</li>
        </ul>
      </div>

      {/* Claude Token Setup Dialog */}
      <ClaudeTokenSetup
        isOpen={showTokenSetup}
        onClose={() => setShowTokenSetup(false)}
        onTokenSaved={(token) => {
          console.log('Token saved:', token.substring(0, 20) + '...');
          setShowTokenSetup(false);
          checkConnection();
        }}
      />
    </div>
  );
};

export default AISettings;
