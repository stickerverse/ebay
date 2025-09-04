import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, MessageSquare, Settings, BarChart3 } from 'lucide-react';

const QuickActions = ({ onSync }) => {
  const navigate = useNavigate();

  const actions = [
    {
      label: 'Sync Messages',
      icon: RefreshCw,
      color: 'bg-blue-600 hover:bg-blue-700',
      onClick: onSync
    },
    {
      label: 'View All Messages',
      icon: MessageSquare,
      color: 'bg-green-600 hover:bg-green-700',
      onClick: () => navigate('/messages')
    },
    {
      label: 'Settings',
      icon: Settings,
      color: 'bg-purple-600 hover:bg-purple-700',
      onClick: () => navigate('/settings')
    },
    {
      label: 'Analytics',
      icon: BarChart3,
      color: 'bg-orange-600 hover:bg-orange-700',
      onClick: () => navigate('/analytics')
    }
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>
      
      <div className="grid grid-cols-2 gap-4">
        {actions.map((action) => {
          const Icon = action.icon;
          
          return (
            <button
              key={action.label}
              onClick={action.onClick}
              className={`p-4 ${action.color} text-white rounded-lg transition-colors flex items-center justify-center space-x-2`}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{action.label}</span>
            </button>
          );
        })}
      </div>
      
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Tips</h4>
        <ul className="text-sm text-gray-600 space-y-2">
          <li>• Sync messages regularly to stay updated</li>
          <li>• Configure auto-response templates in Settings</li>
          <li>• Monitor analytics to improve response times</li>
          <li>• Review escalated messages promptly</li>
        </ul>
      </div>
    </div>
  );
};

export default QuickActions;
