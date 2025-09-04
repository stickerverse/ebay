import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

const EbayCredentials = ({ user, onUpdate, isLoading }) => {
  const [credentials, setCredentials] = useState({
    clientId: user?.ebayCredentials?.clientId || '',
    clientSecret: user?.ebayCredentials?.clientSecret || '',
    accessToken: user?.ebayCredentials?.accessToken || '',
    refreshToken: user?.ebayCredentials?.refreshToken || '',
    environment: user?.ebayCredentials?.environment || 'sandbox'
  });
  const [showSecrets, setShowSecrets] = useState(false);
  const { configureEbay } = useAuth();

  const handleChange = (e) => {
    setCredentials(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const result = await configureEbay(credentials);
    if (result.success) {
      toast.success('eBay credentials configured successfully');
    } else {
      toast.error(result.error);
    }
  };

  const hasCredentials = user?.ebayCredentials?.accessToken;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">eBay API Credentials</h3>
        <p className="text-sm text-gray-600 mt-1">
          Configure your eBay API credentials to connect your store. You can get these from the{' '}
          <a 
            href="https://developer.ebay.com/my/keys" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-500 inline-flex items-center"
          >
            eBay Developer Program <ExternalLink className="h-3 w-3 ml-1" />
          </a>
        </p>
      </div>

      {hasCredentials && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
            <span className="text-sm font-medium text-green-800">
              eBay credentials are configured and active
            </span>
          </div>
          <p className="text-sm text-green-700 mt-1">
            Environment: {user.ebayCredentials.environment}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="environment" className="block text-sm font-medium text-gray-700">
            Environment
          </label>
          <select
            id="environment"
            name="environment"
            value={credentials.environment}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="sandbox">Sandbox (Testing)</option>
            <option value="production">Production (Live)</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Use sandbox for testing, production for live operations
          </p>
        </div>

        <div>
          <label htmlFor="clientId" className="block text-sm font-medium text-gray-700">
            Client ID
          </label>
          <input
            id="clientId"
            name="clientId"
            type="text"
            value={credentials.clientId}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Your eBay Client ID"
            required
          />
        </div>

        <div>
          <label htmlFor="clientSecret" className="block text-sm font-medium text-gray-700">
            Client Secret
          </label>
          <div className="mt-1 relative">
            <input
              id="clientSecret"
              name="clientSecret"
              type={showSecrets ? 'text' : 'password'}
              value={credentials.clientSecret}
              onChange={handleChange}
              className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Your eBay Client Secret"
              required
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowSecrets(!showSecrets)}
            >
              {showSecrets ? (
                <EyeOff className="h-4 w-4 text-gray-400" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400" />
              )}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="accessToken" className="block text-sm font-medium text-gray-700">
            Access Token
          </label>
          <input
            id="accessToken"
            name="accessToken"
            type={showSecrets ? 'text' : 'password'}
            value={credentials.accessToken}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Your eBay Access Token"
            required
          />
        </div>

        <div>
          <label htmlFor="refreshToken" className="block text-sm font-medium text-gray-700">
            Refresh Token
          </label>
          <input
            id="refreshToken"
            name="refreshToken"
            type={showSecrets ? 'text' : 'password'}
            value={credentials.refreshToken}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Your eBay Refresh Token"
          />
          <p className="text-xs text-gray-500 mt-1">
            Optional: Used to automatically refresh expired access tokens
          </p>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : 'Save Credentials'}
        </button>
      </form>
    </div>
  );
};

export default EbayCredentials;
