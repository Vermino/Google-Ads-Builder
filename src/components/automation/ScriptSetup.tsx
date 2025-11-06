import { useState, useEffect } from 'react';
import {
  Code,
  Copy,
  Check,
  AlertCircle,
  Zap,
  Clock,
  Database,
  Activity,
  ExternalLink
} from 'lucide-react';

interface ScriptStatus {
  isActive: boolean;
  lastSync: string | null;
  lastError: string | null;
  dataSummary: {
    totalCampaigns: number;
    totalAdGroups: number;
    totalKeywords: number;
    totalAds: number;
    totalSearchTerms: number;
  } | null;
}

export default function ScriptSetup() {
  const [accountId, setAccountId] = useState('');
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [spreadsheetUrl, setSpreadsheetUrl] = useState('');
  const [backendUrl, setBackendUrl] = useState('http://localhost:3001');
  const [generatedScript, setGeneratedScript] = useState('');
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [creatingSheet, setCreatingSheet] = useState(false);
  const [status, setStatus] = useState<ScriptStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);

  useEffect(() => {
    // Load default account ID from localStorage or generate one
    const savedAccountId = localStorage.getItem('googleAdsAccountId');
    if (savedAccountId) {
      setAccountId(savedAccountId);
      loadStatus(savedAccountId);
    } else {
      // Generate a simple account ID
      const newAccountId = 'account-' + Date.now();
      setAccountId(newAccountId);
      localStorage.setItem('googleAdsAccountId', newAccountId);
    }

    // Listen for OAuth callback from popup
    const handleMessage = (event: MessageEvent) => {
      // Verify origin for security (adjust for production)
      if (event.origin !== window.location.origin && event.origin !== 'http://localhost:3001') {
        return;
      }

      if (event.data.type === 'SHEETS_AUTH_SUCCESS') {
        handleOAuthCallback(event.data.tokenId);
      }
    };

    window.addEventListener('message', handleMessage);

    // Cleanup listener on unmount
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const loadStatus = async (accId: string) => {
    setLoadingStatus(true);
    try {
      const response = await fetch(`http://localhost:3001/api/script/status/${accId}`);
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Error loading status:', error);
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleGenerate = async () => {
    if (!accountId) {
      alert('Account ID is required');
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch('http://localhost:3001/api/script/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId,
          spreadsheetId: spreadsheetId || undefined,
          backendUrl
        })
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedScript(data.script);
        localStorage.setItem('googleAdsAccountId', accountId);
      } else {
        const error = await response.json();
        alert('Error generating script: ' + error.error);
      }
    } catch (error: any) {
      alert('Error generating script: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestConnection = async () => {
    await loadStatus(accountId);
  };

  const handleConnectGoogleSheets = async () => {
    try {
      // Get OAuth URL from backend
      const response = await fetch('http://localhost:3001/api/sheets-oauth/auth-url');
      if (response.ok) {
        const data = await response.json();
        // Open OAuth popup
        const width = 600;
        const height = 700;
        const left = (window.screen.width - width) / 2;
        const top = (window.screen.height - height) / 2;
        window.open(
          data.authUrl,
          'Google Sheets Authorization',
          `width=${width},height=${height},left=${left},top=${top}`
        );
      } else {
        alert('Error getting authorization URL. Make sure Google OAuth is configured in your .env file.');
      }
    } catch (error: any) {
      alert('Error connecting to Google Sheets: ' + error.message);
    }
  };

  const handleOAuthCallback = async (tokenId: string) => {
    setCreatingSheet(true);
    try {
      const response = await fetch('http://localhost:3001/api/sheets-oauth/create-spreadsheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenId,
          accountId
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSpreadsheetId(data.spreadsheetId);
        setSpreadsheetUrl(data.spreadsheetUrl);
        alert('✅ Google Sheet created successfully! The Sheet ID has been filled in automatically.');
      } else {
        const error = await response.json();
        alert('Error creating spreadsheet: ' + error.error);
      }
    } catch (error: any) {
      alert('Error creating spreadsheet: ' + error.message);
    } finally {
      setCreatingSheet(false);
    }
  };

  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="space-y-6">
      {/* Status Monitor */}
      {status && (
        <div className={`p-6 rounded-lg border-2 ${
          status.isActive
            ? 'bg-green-50 border-green-200'
            : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${
                status.isActive ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                <Activity className={`w-6 h-6 ${
                  status.isActive ? 'text-green-600' : 'text-gray-600'
                }`} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Script Status: {status.isActive ? '🟢 Active' : '⚪ Inactive'}
                </h3>
                <p className="text-sm text-gray-600">
                  Last sync: {formatTimestamp(status.lastSync)}
                </p>
              </div>
            </div>
            <button
              onClick={handleTestConnection}
              disabled={loadingStatus}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              {loadingStatus ? 'Checking...' : 'Refresh Status'}
            </button>
          </div>

          {status.dataSummary && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
              <div className="bg-white p-3 rounded-lg border border-gray-200">
                <div className="text-xs text-gray-600 mb-1">Campaigns</div>
                <div className="text-2xl font-bold text-gray-900">
                  {status.dataSummary.totalCampaigns}
                </div>
              </div>
              <div className="bg-white p-3 rounded-lg border border-gray-200">
                <div className="text-xs text-gray-600 mb-1">Ad Groups</div>
                <div className="text-2xl font-bold text-gray-900">
                  {status.dataSummary.totalAdGroups}
                </div>
              </div>
              <div className="bg-white p-3 rounded-lg border border-gray-200">
                <div className="text-xs text-gray-600 mb-1">Keywords</div>
                <div className="text-2xl font-bold text-gray-900">
                  {status.dataSummary.totalKeywords}
                </div>
              </div>
              <div className="bg-white p-3 rounded-lg border border-gray-200">
                <div className="text-xs text-gray-600 mb-1">Ads</div>
                <div className="text-2xl font-bold text-gray-900">
                  {status.dataSummary.totalAds}
                </div>
              </div>
              <div className="bg-white p-3 rounded-lg border border-gray-200">
                <div className="text-xs text-gray-600 mb-1">Search Terms</div>
                <div className="text-2xl font-bold text-gray-900">
                  {status.dataSummary.totalSearchTerms}
                </div>
              </div>
            </div>
          )}

          {status.lastError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <div className="font-medium text-red-900">Last Error</div>
                  <div className="text-sm text-red-700 mt-1">{status.lastError}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Introduction */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <Zap className="w-6 h-6 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">
              Master Data Collection Script
            </h3>
            <p className="text-sm text-blue-700 mb-3">
              Generate ONE script that collects ALL data from your Google Ads account automatically.
              This script runs hourly and syncs campaign data, performance metrics, search terms, and more.
            </p>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>✓ Collects campaigns, ad groups, keywords, ads, and search terms</li>
              <li>✓ Syncs performance data (impressions, clicks, conversions)</li>
              <li>✓ Sends data to your backend for analysis</li>
              <li>✓ Does NOT make changes automatically - you control the rules</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Configuration Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Configuration
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., account-123456"
            />
            <p className="text-xs text-gray-500 mt-1">
              Unique identifier for your account (auto-generated)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Google Sheet ID <span className="text-gray-400">(Optional)</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={spreadsheetId}
                onChange={(e) => setSpreadsheetId(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                disabled={creatingSheet}
              />
              <button
                onClick={handleConnectGoogleSheets}
                disabled={creatingSheet}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
              >
                {creatingSheet ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-4 h-4" />
                    Connect Google Sheets
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Optional: Click "Connect Google Sheets" to auto-create and configure a spreadsheet
            </p>
            {spreadsheetUrl && (
              <a
                href={spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-2 text-sm text-blue-600 hover:text-blue-700"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View your Google Sheet
              </a>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Backend URL
            </label>
            <input
              type="text"
              value={backendUrl}
              onChange={(e) => setBackendUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., https://your-app.com"
            />
            <p className="text-xs text-gray-500 mt-1">
              URL where the script will send data
            </p>
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating || !accountId}
            className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Generating...
              </>
            ) : (
              <>
                <Code className="w-5 h-5" />
                Generate Script
              </>
            )}
          </button>
        </div>
      </div>

      {/* Generated Script */}
      {generatedScript && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Generated Script
            </h3>
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy to Clipboard
                </>
              )}
            </button>
          </div>

          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto max-h-96 overflow-y-auto">
            <pre className="text-xs font-mono whitespace-pre">
              {generatedScript}
            </pre>
          </div>

          {/* Installation Instructions */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-medium text-yellow-900 mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Installation Instructions
            </h4>
            <ol className="text-sm text-yellow-800 space-y-2 list-decimal list-inside">
              <li>Go to Google Ads → <strong>Tools & Settings</strong> → <strong>Bulk Actions</strong> → <strong>Scripts</strong></li>
              <li>Click the <strong>+ (plus)</strong> button to create a new script</li>
              <li>Delete the sample code that appears</li>
              <li>Paste your generated script (use the Copy button above)</li>
              <li>Click <strong>Authorize</strong> to approve permissions</li>
              <li>Click <strong>Preview</strong> to test the script</li>
              <li>Set the schedule to <strong>Hourly</strong> for best results</li>
              <li>Click <strong>Save</strong> and you're done!</li>
            </ol>
            <a
              href="https://ads.google.com/aw/bulk/scripts"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-4 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              <ExternalLink className="w-4 h-4" />
              Open Google Ads Scripts
            </a>
          </div>

          {/* What Happens Next */}
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2 flex items-center gap-2">
              <Database className="w-5 h-5" />
              What Happens Next
            </h4>
            <ul className="text-sm text-green-800 space-y-1">
              <li>✓ Script runs hourly and collects ALL your Google Ads data</li>
              <li>✓ Data syncs to this system automatically</li>
              <li>✓ You can create custom automation rules in the "Automation Rules" tab</li>
              <li>✓ View performance metrics in the "Analytics & Insights" dashboard</li>
              <li>✓ Get smart recommendations in the "Recommendations" tab</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
