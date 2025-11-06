import { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface HistoryItem {
  id: string;
  ruleId?: string;
  runType: string;
  status: string;
  entitiesAffected: number;
  changesMade: any[];
  errors: any[];
  executionTimeMs: number;
  startedAt: string;
  completedAt?: string;
}

export default function AutomationHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/automation/history?limit=50');
      const data = await response.json();
      setHistory(data.history || []);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'partial':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      completed: 'bg-green-50 border-green-200 text-green-800',
      failed: 'bg-red-50 border-red-200 text-red-800',
      partial: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      started: 'bg-blue-50 border-blue-200 text-blue-800',
    };
    return colors[status as keyof typeof colors] || colors.started;
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
        <h2 className="text-xl font-semibold text-gray-900">Automation History</h2>
        <p className="text-sm text-gray-600 mt-1">
          View execution logs and results from automation rules
        </p>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No execution history yet</h3>
          <p className="text-gray-600">
            Execute an automation rule to see history here
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-gray-200 rounded-lg p-6"
            >
              <div className="flex items-start gap-4">
                {getStatusIcon(item.status)}

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className={`
                        px-3 py-1 rounded-full text-xs font-medium border
                        ${getStatusColor(item.status)}
                      `}
                    >
                      {item.status.toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-600">
                      {item.runType} execution
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-gray-500">Started</p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(item.startedAt).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Duration</p>
                      <p className="text-sm font-medium text-gray-900">
                        {(item.executionTimeMs / 1000).toFixed(2)}s
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Entities Affected</p>
                      <p className="text-sm font-medium text-gray-900">
                        {item.entitiesAffected}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Changes Made</p>
                      <p className="text-sm font-medium text-gray-900">
                        {item.changesMade.length}
                      </p>
                    </div>
                  </div>

                  {item.changesMade.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm font-medium text-gray-900 mb-2">Changes:</p>
                      <ul className="text-sm text-gray-700 space-y-1">
                        {item.changesMade.slice(0, 5).map((change, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-green-600 mt-0.5">✓</span>
                            <span>{change.type?.replace(/_/g, ' ')}</span>
                          </li>
                        ))}
                        {item.changesMade.length > 5 && (
                          <li className="text-gray-500">
                            ... and {item.changesMade.length - 5} more
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  {item.errors.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm font-medium text-red-900 mb-2">Errors:</p>
                      <ul className="text-sm text-red-700 space-y-1">
                        {item.errors.map((error, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-red-600 mt-0.5">×</span>
                            <span>{error.message}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
