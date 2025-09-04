import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, Bot, User, AlertTriangle } from 'lucide-react';

const RecentActivity = ({ messages }) => {
  const getActivityIcon = (message) => {
    if (message.escalated) return AlertTriangle;
    if (message.autoProcessed) return Bot;
    return MessageCircle;
  };

  const getActivityColor = (message) => {
    if (message.escalated) return 'text-red-500';
    if (message.autoProcessed) return 'text-green-500';
    return 'text-blue-500';
  };

  const getActivityText = (message) => {
    if (message.escalated) return 'Message escalated';
    if (message.autoProcessed) return 'Auto-responded';
    if (message.status === 'manually_responded') return 'Manually responded';
    return 'New message received';
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h3>
      
      <div className="space-y-4">
        {messages.slice(0, 5).map((message) => {
          const ActivityIcon = getActivityIcon(message);
          const activityColor = getActivityColor(message);
          
          return (
            <div key={message._id} className="flex items-start space-x-3">
              <div className={`p-2 rounded-full bg-gray-50 ${activityColor}`}>
                <ActivityIcon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">
                  <span className="font-medium">{getActivityText(message)}</span>
                  {' from '}
                  <span className="font-medium">{message.buyer}</span>
                </p>
                <p className="text-sm text-gray-500 truncate">
                  {message.subject}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          );
        })}
        
        {messages.length === 0 && (
          <div className="text-center py-8">
            <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No recent activity</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentActivity;
