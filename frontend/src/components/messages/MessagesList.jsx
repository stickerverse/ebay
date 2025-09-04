import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, Clock, AlertTriangle, CheckCircle, User, Package, Send } from 'lucide-react';

const MessagesList = ({ 
  messages, 
  isLoading, 
  onRespond, 
  onPageChange, 
  currentPage, 
  totalPages,
  respondingMessageId 
}) => {
  const [expandedMessage, setExpandedMessage] = useState(null);
  const [responseText, setResponseText] = useState('');

  const getCategoryIcon = (category) => {
    const icons = {
      shipping: Package,
      returns: AlertTriangle,
      technical: AlertTriangle,
      payment: Clock,
      general: MessageCircle
    };
    return icons[category] || MessageCircle;
  };

  const getCategoryColor = (category) => {
    const colors = {
      shipping: 'bg-blue-100 text-blue-800',
      returns: 'bg-red-100 text-red-800',
      technical: 'bg-orange-100 text-orange-800',
      payment: 'bg-green-100 text-green-800',
      general: 'bg-gray-100 text-gray-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'bg-red-500',
      medium: 'bg-yellow-500',
      normal: 'bg-green-500'
    };
    return colors[priority] || 'bg-green-500';
  };

  const getSentimentColor = (sentiment) => {
    const colors = {
      positive: 'text-green-600',
      neutral: 'text-gray-600',
      negative: 'text-red-600'
    };
    return colors[sentiment] || 'text-gray-600';
  };

  const handleResponseSubmit = (messageId) => {
    if (responseText.trim()) {
      onRespond(messageId, responseText);
      setResponseText('');
      setExpandedMessage(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
            <div className="flex justify-between items-start mb-4">
              <div className="space-y-2">
                <div className="h-4 bg-gray-300 rounded w-32"></div>
                <div className="h-3 bg-gray-300 rounded w-24"></div>
              </div>
              <div className="h-6 bg-gray-300 rounded w-16"></div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-300 rounded w-full"></div>
              <div className="h-3 bg-gray-300 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {messages.map((message) => {
          const CategoryIcon = getCategoryIcon(message.category);
          const isExpanded = expandedMessage === message._id;
          
          return (
            <div key={message._id} className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-full ${getCategoryColor(message.category)}`}>
                      <CategoryIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="font-medium text-gray-900">{message.buyer}</span>
                        <div className={`w-2 h-2 rounded-full ${getPriorityColor(message.priority)}`}></div>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm ${getSentimentColor(message.sentiment)}`}>
                      {message.sentiment}
                    </span>
                    {message.status === 'auto_responded' && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    {message.escalated && (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </div>

                <h3 className="font-medium text-gray-900 mb-2">{message.subject}</h3>
                
                <p className="text-gray-700 mb-4 line-clamp-3">{message.message}</p>

                {message.response && (
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <div className="flex items-center mb-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      <span className="text-sm text-gray-600">
                        {message.autoProcessed ? 'Auto-responded' : 'Manually responded'} 
                        {message.responseTime && ` • ${formatDistanceToNow(new Date(message.responseTime), { addSuffix: true })}`}
                      </span>
                    </div>
                    <p className="text-gray-700">{message.response}</p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(message.category)}`}>
                      {message.category}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      message.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      message.status === 'auto_responded' ? 'bg-green-100 text-green-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {message.status.replace('_', ' ')}
                    </span>
                  </div>

                  {message.status === 'pending' && (
                    <button
                      onClick={() => setExpandedMessage(isExpanded ? null : message._id)}
                      className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      {isExpanded ? 'Cancel' : 'Respond'}
                    </button>
                  )}
                </div>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <textarea
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      placeholder="Type your response..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="4"
                    />
                    <div className="flex justify-end space-x-3 mt-3">
                      <button
                        onClick={() => setExpandedMessage(null)}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleResponseSubmit(message._id)}
                        disabled={!responseText.trim() || respondingMessageId === message._id}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        {respondingMessageId === message._id ? 'Sending...' : 'Send Response'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center">
          <nav className="flex space-x-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
            >
              Previous
            </button>
            
            {[...Array(totalPages)].map((_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`px-3 py-2 rounded-lg ${
                    page === currentPage
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {page}
                </button>
              );
            })}
            
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
            >
              Next
            </button>
          </nav>
        </div>
      )}

      {messages.length === 0 && (
        <div className="text-center py-12">
          <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No messages found</p>
        </div>
      )}
    </div>
  );
};

export default MessagesList;
