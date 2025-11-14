import { useState, useEffect } from 'react';
import { Sheet, CheckCircle, Copy, AlertCircle } from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';
import { getAPIBaseURL } from '../../services/apiClient';

export default function GoogleSheetsSetup() {
  const API_BASE_URL = getAPIBaseURL();
  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [serviceAccountEmail, setServiceAccountEmail] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [script, setScript] = useState('');

  useEffect(() => {
    checkConfiguration();
  }, []);

  const checkConfiguration = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sheets/config');
      const data = await response.json();
      if (data.configured) {
        setConfigured(true);
        setSpreadsheetId(data.config.spreadsheetId);
        setServiceAccountEmail(data.config.serviceAccountEmail);
      }
    } catch (error) {
      console.error('Failed to check configuration:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfiguration = async () => {
    if (!spreadsheetId || !serviceAccountEmail || !privateKey) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/sheets/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spreadsheetId,
          serviceAccountEmail,
          privateKey,
        }),
      });

      if (response.ok) {
        alert('Configuration saved successfully!');
        setConfigured(true);
        fetchScript();
      } else {
        alert('Failed to save configuration');
      }
    } catch (error) {
      alert('Failed to save configuration');
    }
  };

  const fetchScript = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sheets/script');
      const data = await response.json();
      setScript(data.script);
    } catch (error) {
      console.error('Failed to fetch script:', error);
    }
  };

  const copyScript = () => {
    navigator.clipboard.writeText(script);
    alert('Script copied to clipboard!');
  };

  const syncNow = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sheets/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dateRangeDays: 7 }),
      });

      const data = await response.json();
      if (data.success) {
        alert(`Sync completed!\n\nPerformance records: ${data.result.performanceRecords}\nSearch terms: ${data.result.searchTerms}\nAsset records: ${data.result.assetRecords}`);
      } else {
        alert('Sync failed. Check your configuration.');
      }
    } catch (error) {
      alert('Failed to sync data');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Google Sheets Integration</h2>
        <p className="text-sm text-gray-600 mt-1">
          Connect to Google Sheets to automatically sync performance data
        </p>
      </div>

      {configured ? (
        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-green-900 mb-2">
                  ✓ Google Sheets Configured
                </h3>
                <p className="text-sm text-green-800 mb-3">
                  Spreadsheet ID: {spreadsheetId}
                </p>
                <p className="text-sm text-green-800">
                  Service Account: {serviceAccountEmail}
                </p>
              </div>
            </div>
          </div>

          <div>
            <Button onClick={syncNow} className="mb-4">
              Sync Data Now
            </Button>
          </div>

          {/* Google Ads Script */}
          {!script && (
            <Button variant="secondary" onClick={fetchScript}>
              Get Google Ads Script
            </Button>
          )}

          {script && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  Google Ads Script
                </h3>
                <Button variant="secondary" onClick={copyScript} size="sm">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Script
                </Button>
              </div>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm max-h-96 overflow-y-auto">
                {script}
              </pre>
              <p className="text-sm text-gray-600 mt-3">
                Copy this script and install it in Google Ads (Tools → Scripts)
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-sm font-semibold text-blue-900 mb-3">
              📝 Setup Steps
            </h3>
            <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
              <li>Create a Google Cloud service account</li>
              <li>Enable Google Sheets API</li>
              <li>Download the JSON key file</li>
              <li>Create a Google Sheet and share it with the service account</li>
              <li>Enter the details below</li>
            </ol>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Spreadsheet ID *
              </label>
              <Input
                value={spreadsheetId}
                onChange={(e) => setSpreadsheetId(e.target.value)}
                placeholder="1a2b3c4d5e6f7g8h9i0j..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Found in the spreadsheet URL: https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Account Email *
              </label>
              <Input
                value={serviceAccountEmail}
                onChange={(e) => setServiceAccountEmail(e.target.value)}
                placeholder="your-service-account@project.iam.gserviceaccount.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Private Key *
              </label>
              <textarea
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
              />
              <p className="text-xs text-gray-500 mt-1">
                Copy from the downloaded JSON key file (private_key field)
              </p>
            </div>

            <Button onClick={saveConfiguration}>
              Save Configuration
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
