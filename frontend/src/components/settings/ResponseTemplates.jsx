import React, { useState, useEffect } from 'react';
import { MessageSquare, Package, RotateCcw, CreditCard, Wrench, Shield, User } from 'lucide-react';

const ResponseTemplates = ({ settings, onUpdate, isLoading }) => {
  const [templates, setTemplates] = useState({
    shipping: 'Your item will ship within 1-2 business days via the method selected at checkout. You\'ll receive tracking information once processed.',
    returns: 'We accept returns within 30 days. Items must be in original condition. Please message us with your order number to start the return process.',
    payment: 'Payment issues are usually resolved within 24 hours. Please check your PayPal account or contact your payment provider.',
    technical: 'For technical issues, please provide your item number and detailed description. We\'ll help resolve this quickly.',
    warranty: 'This item comes with our standard warranty. Please provide your order details and we\'ll review your warranty claim.',
    greeting: 'Thank you for your message! We appreciate your business and will respond promptly during business hours.',
    general: 'Thank you for contacting us. We\'ve received your message and will respond within 24 hours during business days.'
  });

  useEffect(() => {
    if (settings?.autoResponse?.templates) {
      setTemplates(settings.autoResponse.templates);
    }
  }, [settings]);

  const handleTemplateChange = (category, value) => {
    setTemplates(prev => ({
      ...prev,
      [category]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate({
      settings: {
        autoResponse: {
          ...settings?.autoResponse,
          templates
        }
      }
    });
  };

  const resetTemplate = (category) => {
    const defaults = {
      shipping: 'Your item will ship within 1-2 business days via the method selected at checkout. You\'ll receive tracking information once processed.',
      returns: 'We accept returns within 30 days. Items must be in original condition. Please message us with your order number to start the return process.',
      payment: 'Payment issues are usually resolved within 24 hours. Please check your PayPal account or contact your payment provider.',
      technical: 'For technical issues, please provide your item number and detailed description. We\'ll help resolve this quickly.',
      warranty: 'This item comes with our standard warranty. Please provide your order details and we\'ll review your warranty claim.',
      greeting: 'Thank you for your message! We appreciate your business and will respond promptly during business hours.',
      general: 'Thank you for contacting us. We\'ve received your message and will respond within 24 hours during business days.'
    };
    
    handleTemplateChange(category, defaults[category]);
  };

  const templateCategories = [
    { key: 'shipping', label: 'Shipping', icon: Package, description: 'Responses for shipping inquiries' },
    { key: 'returns', label: 'Returns', icon: RotateCcw, description: 'Responses for return requests' },
    { key: 'payment', label: 'Payment', icon: CreditCard, description: 'Responses for payment issues' },
    { key: 'technical', label: 'Technical', icon: Wrench, description: 'Responses for technical problems' },
    { key: 'warranty', label: 'Warranty', icon: Shield, description: 'Responses for warranty claims' },
    { key: 'greeting', label: 'Greeting', icon: User, description: 'Responses for general greetings' },
    { key: 'general', label: 'General', icon: MessageSquare, description: 'Default response for other messages' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Response Templates</h3>
        <p className="text-sm text-gray-600 mt-1">
          Customize automatic response templates for different message categories. Use {'{name}'} for buyer name, {'{date}'} for current date.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {templateCategories.map(category => {
          const Icon = category.icon;
          
          return (
            <div key={category.key} className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{category.label}</h4>
                    <p className="text-sm text-gray-600">{category.description}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => resetTemplate(category.key)}
                  className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Reset
                </button>
              </div>
              
              <textarea
                rows="4"
                value={templates[category.key]}
                onChange={(e) => handleTemplateChange(category.key, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={`Enter ${category.label.toLowerCase()} response template...`}
              />
              
              <div className="mt-2">
                <p className="text-xs text-gray-500">
                  Character count: {templates[category.key].length} (recommended: 50-500 characters)
                </p>
              </div>
            </div>
          );
        })}

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-900 mb-2">Template Variables</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <code className="bg-yellow-100 px-2 py-1 rounded text-yellow-800">{'{name}'}</code>
              <p className="text-yellow-700 mt-1">Buyer's username</p>
            </div>
            <div>
              <code className="bg-yellow-100 px-2 py-1 rounded text-yellow-800">{'{date}'}</code>
              <p className="text-yellow-700 mt-1">Current date</p>
            </div>
            <div>
              <code className="bg-yellow-100 px-2 py-1 rounded text-yellow-800">{'{time}'}</code>
              <p className="text-yellow-700 mt-1">Current time</p>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : 'Save Templates'}
        </button>
      </form>
    </div>
  );
};

export default ResponseTemplates;
