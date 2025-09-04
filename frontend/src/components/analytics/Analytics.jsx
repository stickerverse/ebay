import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { analyticsAPI } from '../../services/api';
import { TrendingUp, MessageSquare, Clock, Bot } from 'lucide-react';

const Analytics = () => {
  const [timeRange, setTimeRange] = useState('7d');

  const { data: stats } = useQuery(['analytics-stats', timeRange], () => 
    analyticsAPI.getStats(timeRange)
  );

  const { data: chartData } = useQuery(['analytics-chart', timeRange], () => 
    analyticsAPI.getChartData(timeRange)
  );

  const pieColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  const mockStats = {
    totalMessages: 148,
    autoResponded: 92,
    averageResponseTime: '4.2 minutes',
    responseRate: '89%'
  };

  const mockChartData = [
    { name: 'Mon', messages: 12, responses: 10 },
    { name: 'Tue', messages: 19, responses: 15 },
    { name: 'Wed', messages: 15, responses: 13 },
    { name: 'Thu', messages: 22, responses: 18 },
    { name: 'Fri', messages: 18, responses: 16 },
    { name: 'Sat', messages: 8, responses: 6 },
    { name: 'Sun', messages: 5, responses: 4 }
  ];

  const mockCategoryData = [
    { name: 'Shipping', value: 35, color: '#3B82F6' },
    { name: 'Returns', value: 25, color: '#10B981' },
    { name: 'Technical', value: 20, color: '#F59E0B' },
    { name: 'Payment', value: 12, color: '#EF4444' },
    { name: 'General', value: 8, color: '#8B5CF6' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-2 bg-blue-50 rounded-lg">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <span className="text-sm font-medium text-green-600">+12%</span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-gray-900">{mockStats.totalMessages}</h3>
            <p className="text-gray-600 text-sm mt-1">Total Messages</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-2 bg-green-50 rounded-lg">
                <Bot className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <span className="text-sm font-medium text-green-600">+8%</span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-gray-900">{mockStats.autoResponded}</h3>
            <p className="text-gray-600 text-sm mt-1">Auto Responses</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-50 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <span className="text-sm font-medium text-green-600">-15%</span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-gray-900">{mockStats.averageResponseTime}</h3>
            <p className="text-gray-600 text-sm mt-1">Avg Response Time</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-2 bg-purple-50 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <span className="text-sm font-medium text-green-600">+3%</span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-gray-900">{mockStats.responseRate}</h3>
            <p className="text-gray-600 text-sm mt-1">Response Rate</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Message Volume</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={mockChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="messages" stroke="#3B82F6" strokeWidth={2} name="Messages" />
              <Line type="monotone" dataKey="responses" stroke="#10B981" strokeWidth={2} name="Responses" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Message Categories</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={mockCategoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {mockCategoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Daily Response Performance</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={mockChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="messages" fill="#3B82F6" name="Messages Received" />
            <Bar dataKey="responses" fill="#10B981" name="Responses Sent" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Response Time Distribution</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">&lt; 5 minutes</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '65%' }}></div>
                </div>
                <span className="text-sm font-medium text-gray-900">65%</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">5-15 minutes</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '25%' }}></div>
                </div>
                <span className="text-sm font-medium text-gray-900">25%</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">15-60 minutes</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div className="bg-orange-600 h-2 rounded-full" style={{ width: '8%' }}></div>
                </div>
                <span className="text-sm font-medium text-gray-900">8%</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">&gt; 1 hour</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div className="bg-red-600 h-2 rounded-full" style={{ width: '2%' }}></div>
                </div>
                <span className="text-sm font-medium text-gray-900">2%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Top Insights</h3>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Peak Activity</p>
                <p className="text-sm text-gray-600">Most messages received on Thursday afternoons</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Auto-Response Success</p>
                <p className="text-sm text-gray-600">89% of shipping inquiries resolved automatically</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Escalation Rate</p>
                <p className="text-sm text-gray-600">Only 3% of messages require manual intervention</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Customer Satisfaction</p>
                <p className="text-sm text-gray-600">95% positive sentiment in follow-up messages</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
