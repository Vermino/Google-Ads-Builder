import { useState, useEffect } from 'react';
import { Plus, Play, Trash2, Edit2, Power, Clock, AlertCircle } from 'lucide-react';
import Button from '../common/Button';
import Modal from '../common/Modal';
import CreateRuleModal from './CreateRuleModal';

interface AutomationRule {
  id: string;
  name: string;
  description?: string;
  triggerType: string;
  actionType: string;
  enabled: boolean;
  lastRunAt?: string;
  nextRunAt?: string;
  runCount: number;
}

export default function AutomationRules() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [executingId, setExecutingId] = useState<string | null>(null);

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/automation/rules');
      const data = await response.json();
      setRules(data.rules || []);
    } catch (error) {
      console.error('Failed to load rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const executeRule = async (ruleId: string) => {
    setExecutingId(ruleId);
    try {
      const response = await fetch(
        `http://localhost:3001/api/automation/rules/${ruleId}/execute`,
        { method: 'POST' }
      );
      const data = await response.json();

      if (data.success) {
        alert(`Rule executed successfully!\n\nStatus: ${data.execution.status}\nEntities affected: ${data.execution.entitiesAffected}`);
        loadRules(); // Refresh to update last run time
      } else {
        alert('Execution failed. Check history for details.');
      }
    } catch (error) {
      alert('Failed to execute rule');
    } finally {
      setExecutingId(null);
    }
  };

  const toggleRule = async (ruleId: string, enabled: boolean) => {
    try {
      await fetch(`http://localhost:3001/api/automation/rules/${ruleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !enabled }),
      });
      loadRules();
    } catch (error) {
      alert('Failed to toggle rule');
    }
  };

  const deleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this automation rule?')) return;

    try {
      await fetch(`http://localhost:3001/api/automation/rules/${ruleId}`, {
        method: 'DELETE',
      });
      loadRules();
    } catch (error) {
      alert('Failed to delete rule');
    }
  };

  const getTriggerLabel = (triggerType: string) => {
    const labels: Record<string, string> = {
      scheduled: 'Scheduled',
      manual: 'Manual Only',
      performance_threshold: 'Performance Trigger',
      budget_threshold: 'Budget Trigger',
      import_completion: 'After Import',
    };
    return labels[triggerType] || triggerType;
  };

  const getActionLabel = (actionType: string) => {
    const labels: Record<string, string> = {
      apply_recommendations: 'Apply Recommendations',
      pause_low_performers: 'Pause Low Performers',
      add_negatives: 'Add Negative Keywords',
      add_keywords: 'Add Keywords',
      increase_budget: 'Increase Budget',
      decrease_budget: 'Decrease Budget',
      adjust_bids: 'Adjust Bids',
      refresh_ads: 'Refresh Ad Copy',
      sync_sheets_data: 'Sync Google Sheets',
      generate_recommendations: 'Generate Recommendations',
      generate_report: 'Generate Report',
    };
    return labels[actionType] || actionType;
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Automation Rules</h2>
          <p className="text-sm text-gray-600 mt-1">
            Create and manage automated tasks that run on a schedule or trigger
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Rule
        </Button>
      </div>

      {rules.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No automation rules yet</h3>
          <p className="text-gray-600 mb-4">
            Create your first automation rule to start optimizing automatically
          </p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Rule
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{rule.name}</h3>
                    <span
                      className={`
                        px-2 py-1 text-xs font-medium rounded-full
                        ${rule.enabled
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                        }
                      `}
                    >
                      {rule.enabled ? '✓ Enabled' : '○ Disabled'}
                    </span>
                  </div>

                  {rule.description && (
                    <p className="text-gray-600 mb-3">{rule.description}</p>
                  )}

                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Clock className="w-4 h-4" />
                      <span className="font-medium">Trigger:</span>
                      <span>{getTriggerLabel(rule.triggerType)}</span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-700">
                      <Play className="w-4 h-4" />
                      <span className="font-medium">Action:</span>
                      <span>{getActionLabel(rule.actionType)}</span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-700">
                      <span className="font-medium">Runs:</span>
                      <span>{rule.runCount}</span>
                    </div>
                  </div>

                  {rule.lastRunAt && (
                    <div className="mt-2 text-sm text-gray-500">
                      Last run: {new Date(rule.lastRunAt).toLocaleString()}
                    </div>
                  )}

                  {rule.nextRunAt && rule.enabled && (
                    <div className="mt-1 text-sm text-blue-600">
                      Next run: {new Date(rule.nextRunAt).toLocaleString()}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => executeRule(rule.id)}
                    disabled={executingId === rule.id}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Execute now"
                  >
                    <Play className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => toggleRule(rule.id, rule.enabled)}
                    className={`
                      p-2 rounded-lg transition-colors
                      ${rule.enabled
                        ? 'text-green-600 hover:bg-green-50'
                        : 'text-gray-400 hover:bg-gray-50'
                      }
                    `}
                    title={rule.enabled ? 'Disable' : 'Enable'}
                  >
                    <Power className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => alert('Edit feature coming soon!')}
                    className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => deleteRule(rule.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateRuleModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadRules();
          }}
        />
      )}
    </div>
  );
}
