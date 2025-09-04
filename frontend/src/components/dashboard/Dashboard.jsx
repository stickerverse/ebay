import React, { useEffect, useState } from 'react';
import { useQuery } from 'react-query';
import StatsCard from './StatsCard';
import RecentActivity from './RecentActivity';
import QuickActions from './QuickActions';
import { messageAPI } from '../../services/api';
import { MessageSquare, Bot, Clock, TrendingUp, RefreshCw } from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalMessages: 0,
    autoResponded: 0,
    pendingReview: 0,
    responseRate: 0
  });

  const { data: messagesData, isLoading, refetch } = useQuery(
    'messages',
    () => messageAPI.getMessages({ limit: 10 }),
    {
      refetchInterval: 30000,
      onSuccess: (data) => {
        if (data && data.messages) {
          updateStats(data.messages);
        }
      },
      onError: (error) => {
        console.error('Failed to fetch messages:', error);
      }
    }
  );

  const updateStats = (messages) => {
    if (!messages || !Array.isArray(messages)) {
      return;
    }
    
    const total = messages.length;
    const autoResponded = messages.filter(m => m.status === 'auto_responded').length;
    const pending = messages.filter(m => m.status === 'pending').length;
    const responseRate = total > 0 ? ((total - pending) / total * 100) : 0;

    setStats({
      totalMessages: total,
      autoResponded,
      pendingReview: pending,
      responseRate: responseRate.toFixed(1)
    });
  };

  const handleSync = async () => {
    try {
      await messageAPI.sync();
      refetch();
    } catch (error) {
      console.error('Sync failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <button
          onClick={handleSync}
          disabled={isLoading}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Sync Messages
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Messages"
          value={stats.totalMessages}
          icon={MessageSquare}
          color="blue"
          change="+12%"
        />
        <StatsCard
          title="Auto Responded"
          value={stats.autoResponded}
          icon={Bot}
          color="green"
          change="+8%"
        />
        <StatsCard
          title="Pending Review"
          value={stats.pendingReview}
          icon={Clock}
          color="yellow"
          change="-15%"
        />
        <StatsCard
          title="Response Rate"
          value={`${stats.responseRate}%`}
          icon={TrendingUp}
          color="purple"
          change="+2%"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity messages={messagesData?.messages || []} />
        <QuickActions onSync={handleSync} />
      </div>
    </div>
  );
};

export default Dashboard;
