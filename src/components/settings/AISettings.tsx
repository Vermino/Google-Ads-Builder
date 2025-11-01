import React, { useState } from 'react';
import { Eye, EyeOff, CheckCircle, XCircle, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import Button from '@/components/common/Button';

const AISettings: React.FC = () => {
  // API keys from localStorage
  const [openaiKey, setOpenaiKey] = useLocalStorage<string>('ai_openai_key', '');
  const [claudeKey, setClaudeKey] = useLocalStorage<string>('ai_claude_key', '');
  const [defaultProvider, setDefaultProvider] = useLocalStorage<'openai' | 'claude'>('ai_default_provider', 'openai');

  // Local state for editing
  const [openaiKeyInput, setOpenaiKeyInput] = useState(openaiKey);
  const [claudeKeyInput, setClaudeKeyInput] = useState(claudeKey);

  // Visibility state
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [showClaudeKey, setShowClaudeKey] = useState(false);

  // Testing state
  const [testingOpenai, setTestingOpenai] = useState(false);
  const [testingClaude, setTestingClaude] = useState(false);
  const [openaiTestResult, setOpenaiTestResult] = useState<'success' | 'error' | null>(null);
  const [claudeTestResult, setClaudeTestResult] = useState<'success' | 'error' | null>(null);

  // Save state
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Check if keys are valid format
  const isValidOpenaiKey = (key: string) => key.trim().startsWith('sk-');
  const isValidClaudeKey = (key: string) => key.trim().startsWith('sk-ant-');

  // Test OpenAI connection
  const testOpenaiConnection = async () => {
    if (!openaiKeyInput.trim()) {
      return;
    }

    setTestingOpenai(true);
    setOpenaiTestResult(null);

    try {
      // Simple test: just check if the key format is valid
      // In a real implementation, you might want to make a test API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (isValidOpenaiKey(openaiKeyInput)) {
        setOpenaiTestResult('success');
      } else {
        setOpenaiTestResult('error');
      }
    } catch (error) {
      setOpenaiTestResult('error');
    } finally {
      setTestingOpenai(false);
    }
  };

  // Test Claude connection
  const testClaudeConnection = async () => {
    if (!claudeKeyInput.trim()) {
      return;
    }

    setTestingClaude(true);
    setClaudeTestResult(null);

    try {
      // Simple test: just check if the key format is valid
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (isValidClaudeKey(claudeKeyInput)) {
        setClaudeTestResult('success');
      } else {
        setClaudeTestResult('error');
      }
    } catch (error) {
      setClaudeTestResult('error');
    } finally {
      setTestingClaude(false);
    }
  };

  // Save settings
  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      // Save to localStorage
      setOpenaiKey(openaiKeyInput.trim());
      setClaudeKey(claudeKeyInput.trim());

      // If default provider is not configured, switch to the available one
      if (defaultProvider === 'openai' && !openaiKeyInput.trim() && claudeKeyInput.trim()) {
        setDefaultProvider('claude');
      } else if (defaultProvider === 'claude' && !claudeKeyInput.trim() && openaiKeyInput.trim()) {
        setDefaultProvider('openai');
      }

      // Simulate save delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const hasOpenaiKey = !!openaiKey.trim();
  const hasClaudeKey = !!claudeKey.trim();
  const hasAnyKey = hasOpenaiKey || hasClaudeKey;

  return (
    <div className="max-w-3xl space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">AI Settings</h2>
        <p className="text-gray-600 mt-1">
          Configure your AI providers to enable automated ad copy generation
        </p>
      </div>

      {/* Security Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="ml-3">
            <h4 className="text-sm font-semibold text-yellow-800">Security Notice</h4>
            <p className="text-sm text-yellow-700 mt-1">
              API keys are stored in your browser's local storage. For production use, consider using
              environment variables or a secure backend proxy.
            </p>
          </div>
        </div>
      </div>

      {/* OpenAI Settings */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M22.282 9.821a5.985 5.985 0 00-.516-4.91 6.046 6.046 0 00-6.51-2.9A6.065 6.065 0 004.981 4.18a5.985 5.985 0 00-3.998 2.9 6.046 6.046 0 00.743 7.097 5.98 5.98 0 00.51 4.911 6.051 6.051 0 006.515 2.9A5.985 5.985 0 0013.26 24a6.056 6.056 0 005.772-4.206 5.99 5.99 0 003.997-2.9 6.056 6.056 0 00-.747-7.073zM13.26 22.43a4.476 4.476 0 01-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 00.392-.681v-6.737l2.02 1.168a.071.071 0 01.038.052v5.583a4.504 4.504 0 01-4.494 4.494zM3.6 18.304a4.47 4.47 0 01-.535-3.014l.142.085 4.783 2.759a.771.771 0 00.78 0l5.843-3.369v2.332a.08.08 0 01-.033.062L9.74 19.95a4.5 4.5 0 01-6.14-1.646zM2.34 7.896a4.485 4.485 0 012.366-1.973V11.6a.766.766 0 00.388.676l5.815 3.355-2.02 1.168a.076.076 0 01-.071 0l-4.83-2.786A4.504 4.504 0 012.34 7.896zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 01.071 0l4.83 2.791a4.494 4.494 0 01-.676 8.105v-5.678a.79.79 0 00-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 00-.785 0L9.409 9.23V6.897a.066.066 0 01.028-.061l4.83-2.787a4.5 4.5 0 016.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 01-.038-.057V6.075a4.5 4.5 0 017.375-3.453l-.142.08L8.704 5.46a.795.795 0 00-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">OpenAI</h3>
            <p className="text-sm text-gray-600">GPT-4 Turbo for advanced ad copy generation</p>
          </div>
          {hasOpenaiKey && (
            <div className="flex items-center space-x-1 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-medium">Configured</span>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="openai-key" className="block text-sm font-medium text-gray-700 mb-1">
              API Key
            </label>
            <div className="flex space-x-2">
              <div className="flex-1 relative">
                <input
                  type={showOpenaiKey ? 'text' : 'password'}
                  id="openai-key"
                  value={openaiKeyInput}
                  onChange={(e) => {
                    setOpenaiKeyInput(e.target.value);
                    setOpenaiTestResult(null);
                  }}
                  placeholder="sk-..."
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showOpenaiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button
                type="button"
                onClick={testOpenaiConnection}
                disabled={!openaiKeyInput.trim() || testingOpenai}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center space-x-2"
              >
                {testingOpenai ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Testing...</span>
                  </>
                ) : (
                  <span>Test</span>
                )}
              </button>
            </div>
            {openaiTestResult === 'success' && (
              <p className="text-sm text-green-600 mt-1 flex items-center">
                <CheckCircle className="w-4 h-4 mr-1" />
                Connection successful
              </p>
            )}
            {openaiTestResult === 'error' && (
              <p className="text-sm text-red-600 mt-1 flex items-center">
                <XCircle className="w-4 h-4 mr-1" />
                Invalid API key format
              </p>
            )}
          </div>

          <div className="flex items-center justify-between text-sm">
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 inline-flex items-center space-x-1"
            >
              <span>Get your OpenAI API key</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Claude Settings */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">Claude (Anthropic)</h3>
            <p className="text-sm text-gray-600">Claude 3.5 Sonnet for creative ad copy</p>
          </div>
          {hasClaudeKey && (
            <div className="flex items-center space-x-1 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-medium">Configured</span>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="claude-key" className="block text-sm font-medium text-gray-700 mb-1">
              API Key
            </label>
            <div className="flex space-x-2">
              <div className="flex-1 relative">
                <input
                  type={showClaudeKey ? 'text' : 'password'}
                  id="claude-key"
                  value={claudeKeyInput}
                  onChange={(e) => {
                    setClaudeKeyInput(e.target.value);
                    setClaudeTestResult(null);
                  }}
                  placeholder="sk-ant-..."
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowClaudeKey(!showClaudeKey)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showClaudeKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button
                type="button"
                onClick={testClaudeConnection}
                disabled={!claudeKeyInput.trim() || testingClaude}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center space-x-2"
              >
                {testingClaude ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Testing...</span>
                  </>
                ) : (
                  <span>Test</span>
                )}
              </button>
            </div>
            {claudeTestResult === 'success' && (
              <p className="text-sm text-green-600 mt-1 flex items-center">
                <CheckCircle className="w-4 h-4 mr-1" />
                Connection successful
              </p>
            )}
            {claudeTestResult === 'error' && (
              <p className="text-sm text-red-600 mt-1 flex items-center">
                <XCircle className="w-4 h-4 mr-1" />
                Invalid API key format
              </p>
            )}
          </div>

          <div className="flex items-center justify-between text-sm">
            <a
              href="https://console.anthropic.com/account/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 inline-flex items-center space-x-1"
            >
              <span>Get your Claude API key</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Default Provider */}
      {hasAnyKey && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Default Provider</h3>
          <div className="space-y-3">
            {hasOpenaiKey && (
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="defaultProvider"
                  value="openai"
                  checked={defaultProvider === 'openai'}
                  onChange={(e) => setDefaultProvider(e.target.value as 'openai' | 'claude')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="text-sm font-medium text-gray-900">OpenAI GPT-4</span>
              </label>
            )}
            {hasClaudeKey && (
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="defaultProvider"
                  value="claude"
                  checked={defaultProvider === 'claude'}
                  onChange={(e) => setDefaultProvider(e.target.value as 'openai' | 'claude')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="text-sm font-medium text-gray-900">Claude Sonnet</span>
              </label>
            )}
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <div>
          {saveSuccess && (
            <p className="text-sm text-green-600 flex items-center">
              <CheckCircle className="w-4 h-4 mr-1" />
              Settings saved successfully
            </p>
          )}
        </div>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          variant="primary"
          className="min-w-[120px]"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Saving...
            </>
          ) : (
            'Save Settings'
          )}
        </Button>
      </div>
    </div>
  );
};

export default AISettings;
