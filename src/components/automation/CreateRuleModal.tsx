import { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import { AlertCircle, Sparkles } from 'lucide-react';

interface CreateRuleModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateRuleModal({ onClose, onSuccess }: CreateRuleModalProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerType, setTriggerType] = useState('scheduled');
  const [schedule, setSchedule] = useState('daily');
  const [actionType, setActionType] = useState('generate_recommendations');
  const [loading, setLoading] = useState(false);

  // Action-specific configs
  const [autoApplyOnly, setAutoApplyOnly] = useState(true);
  const [priorities, setPriorities] = useState<string[]>(['critical', 'high']);
  const [negativeKeywords, setNegativeKeywords] = useState('free, cheap, download');
  const [dateRangeDays, setDateRangeDays] = useState('7');

  const handleSubmit = async () => {
    setLoading(true);

    try {
      let triggerConfig: any = {};
      if (triggerType === 'scheduled') {
        triggerConfig = { schedule };
      }

      let actionConfig: any = {};
      switch (actionType) {
        case 'apply_recommendations':
          actionConfig = {
            autoApplyOnly,
            priorities,
          };
          break;
        case 'add_negatives':
          actionConfig = {
            negativeKeywords: negativeKeywords.split(',').map(k => k.trim()),
            matchType: 'phrase',
            campaignIds: [],
          };
          break;
        case 'sync_sheets_data':
          actionConfig = {
            dateRangeDays: parseInt(dateRangeDays),
          };
          break;
        case 'pause_low_performers':
          actionConfig = {
            entityType: 'ad_group',
            ctrThreshold: 0.01,
            minImpressions: 1000,
            dateRangeDays: 7,
          };
          break;
      }

      const response = await fetch('http://localhost:3001/api/automation/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          triggerType,
          triggerConfig,
          actionType,
          actionConfig,
          enabled: true,
        }),
      });

      if (response.ok) {
        onSuccess();
      } else {
        alert('Failed to create rule');
      }
    } catch (error) {
      alert('Failed to create rule');
    } finally {
      setLoading(false);
    }
  };

  const renderActionConfig = () => {
    switch (actionType) {
      case 'apply_recommendations':
        return (
          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={autoApplyOnly}
                  onChange={(e) => setAutoApplyOnly(e.target.checked)}
                  className="rounded border-gray-300"
                />
                Only auto-apply safe recommendations
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-6">
                Safe recommendations are low-risk actions like adding negative keywords
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority Levels
              </label>
              <div className="space-y-2">
                {['critical', 'high', 'medium', 'low'].map((priority) => (
                  <label key={priority} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={priorities.includes(priority)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setPriorities([...priorities, priority]);
                        } else {
                          setPriorities(priorities.filter(p => p !== priority));
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700 capitalize">{priority}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 'add_negatives':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Negative Keywords (comma-separated)
            </label>
            <textarea
              value={negativeKeywords}
              onChange={(e) => setNegativeKeywords(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="free, cheap, download, torrent, crack"
            />
            <p className="text-xs text-gray-500 mt-1">
              These keywords will be added as phrase match negatives to all active campaigns
            </p>
          </div>
        );

      case 'sync_sheets_data':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range (days)
            </label>
            <Input
              type="number"
              value={dateRangeDays}
              onChange={(e) => setDateRangeDays(e.target.value)}
              min="1"
              max="90"
            />
            <p className="text-xs text-gray-500 mt-1">
              Number of days of historical data to sync from Google Sheets
            </p>
          </div>
        );

      default:
        return (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              This action type will use default configuration settings.
            </p>
          </div>
        );
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Create Automation Rule"
      size="large"
    >
      <div className="space-y-6">
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center font-medium
                  ${step >= s
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                  }
                `}
              >
                {s}
              </div>
              {s < 3 && (
                <div
                  className={`
                    w-12 h-1 mx-2
                    ${step > s ? 'bg-blue-600' : 'bg-gray-200'}
                  `}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rule Name *
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Daily Recommendations"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe what this rule does..."
              />
            </div>
          </div>
        )}

        {/* Step 2: Trigger */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                When should this rule run?
              </label>
              <div className="space-y-2">
                {[
                  { value: 'scheduled', label: 'On a schedule', desc: 'Run hourly, daily, or weekly' },
                  { value: 'manual', label: 'Manual only', desc: 'Only when you click "Execute"' },
                  { value: 'import_completion', label: 'After import', desc: 'Run after CSV/ZIP import completes' },
                ].map((trigger) => (
                  <label
                    key={trigger.value}
                    className={`
                      flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors
                      ${triggerType === trigger.value
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <input
                      type="radio"
                      name="trigger"
                      value={trigger.value}
                      checked={triggerType === trigger.value}
                      onChange={(e) => setTriggerType(e.target.value)}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{trigger.label}</div>
                      <div className="text-sm text-gray-600">{trigger.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {triggerType === 'scheduled' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Schedule
                </label>
                <select
                  value={schedule}
                  onChange={(e) => setSchedule(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="hourly">Every hour</option>
                  <option value="daily">Once per day</option>
                  <option value="weekly">Once per week</option>
                </select>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Action */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                What action should be performed?
              </label>
              <select
                value={actionType}
                onChange={(e) => setActionType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
              >
                <optgroup label="Recommendations">
                  <option value="generate_recommendations">Generate Recommendations</option>
                  <option value="apply_recommendations">Apply Recommendations</option>
                </optgroup>
                <optgroup label="Keywords">
                  <option value="add_negatives">Add Negative Keywords</option>
                  <option value="add_keywords">Add Keywords</option>
                </optgroup>
                <optgroup label="Performance">
                  <option value="pause_low_performers">Pause Low Performers</option>
                </optgroup>
                <optgroup label="Budget">
                  <option value="increase_budget">Increase Budget</option>
                  <option value="decrease_budget">Decrease Budget</option>
                </optgroup>
                <optgroup label="Data">
                  <option value="sync_sheets_data">Sync Google Sheets Data</option>
                </optgroup>
              </select>
            </div>

            {renderActionConfig()}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div>
            {step > 1 && (
              <Button
                variant="secondary"
                onClick={() => setStep(step - 1)}
              >
                Back
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={onClose}
            >
              Cancel
            </Button>

            {step < 3 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={step === 1 && !name}
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading || !name}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <>Creating...</>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Create Rule
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
