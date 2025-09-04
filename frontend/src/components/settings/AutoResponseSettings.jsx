import React, { useState, useEffect } from 'react';
import { Bot, Clock, AlertTriangle } from 'lucide-react';

const AutoResponseSettings = ({ settings, onUpdate, isLoading }) => {
  const [config, setConfig] = useState({
    enabled: true,
    responseDelay: 300,
    maxDailyResponses: 100,
    weekdaysOnly: true,
    escalationKeywords: ['complaint', 'angry', 'disappointed', 'lawsuit', 'attorney', 'dispute', 'scam', 'fraud']
  });

  useEffect(() => {
    if (settings?.autoResponse) {
      setConfig(settings.autoResponse);
    }
  }, [settings]);

  const handleChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleKeywordsChange = (e) => {
    const keywords = e.target.value.split(',').map(k => k.trim()).filter(k => k);
    setConfig(prev => ({
      ...prev,
      escalationKeywords: keywords
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate({ settings: { autoResponse: config } });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Auto Response Configuration</h3>
        <p className="text-sm text-gray-600 mt-1">
          Configure when and how the system automatically responds to messages
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            <Bot className="h-5 w-5 text-blue-600 mr-3" />
            <div>
              <h4 className="font-medium text-gray-900">Enable Auto Response</h4>
              <p className="text-sm text-gray-600">Automatically respond to incoming messages</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => handleChange('enabled', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-graycat >> frontend/src/components/settings/AutoResponseSettings.jsx << 'EOF'
-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {config.enabled && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Response Delay (seconds)
              </label>
              <div className="mt-1 flex items-center space-x-3">
                <Clock className="h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  min="0"
                  max="3600"
                  value={config.responseDelay}
                  onChange={(e) => handleChange('responseDelay', parseInt(e.target.value))}
                  className="block w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="text-sm text-gray-500">
                  Wait {config.responseDelay} seconds before responding
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Maximum Daily Responses
              </label>
              <input
                type="number"
                min="1"
                max="1000"
                value={config.maxDailyResponses}
                onChange={(e) => handleChange('maxDailyResponses', parseInt(e.target.value))}
                className="mt-1 block w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Limit automatic responses per day to avoid spam flags
              </p>
            </div>

            <div className="flex items-center">
              <input
                id="weekdaysOnly"
                type="checkbox"
                checked={config.weekdaysOnly}
                onChange={(e) => handleChange('weekdaysOnly', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="weekdaysOnly" className="ml-2 block text-sm text-gray-900">
                Only respond during weekdays
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Escalation Keywords
              </label>
              <div className="mt-1 flex items-start space-x-3">
                <AlertTriangle className="h-4 w-4 text-orange-400 mt-2" />
                <div className="flex-1">
                  <textarea
                    rows="3"
                    value={config.escalationKeywords.join(', ')}
                    onChange={handleKeywordsChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="complaint, angry, disappointed..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Messages containing these keywords will be escalated for manual review
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : 'Save Auto Response Settings'}
        </button>
      </form>
    </div>
  );
};

export default AutoResponseSettings;
