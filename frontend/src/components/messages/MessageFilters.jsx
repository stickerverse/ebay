import React from 'react';
import { Search, Filter } from 'lucide-react';

const MessageFilters = ({ filters, onChange, totalMessages }) => {
  const statusOptions = [
    { value: 'all', label: 'All Messages' },
    { value: 'pending', label: 'Pending' },
    { value: 'responded', label: 'Responded' },
    { value: 'escalated', label: 'Escalated' },
    { value: 'high_priority', label: 'High Priority' }
  ];

  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    { value: 'shipping', label: 'Shipping' },
    { value: 'returns', label: 'Returns' },
    { value: 'payment', label: 'Payment' },
    { value: 'technical', label: 'Technical' },
    { value: 'warranty', label: 'Warranty' },
    { value: 'general', label: 'General' }
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <span className="font-medium text-gray-900">Filters</span>
        </div>
        <span className="text-sm text-gray-500">
          {totalMessages} total messages
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search messages..."
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value })}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <select
          value={filters.status}
          onChange={(e) => onChange({ status: e.target.value })}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {statusOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          value={filters.category}
          onChange={(e) => onChange({ category: e.target.value })}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {categoryOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <button
          onClick={() => onChange({ status: 'all', category: 'all', search: '' })}
          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Clear Filters
        </button>
      </div>
    </div>
  );
};

export default MessageFilters;
