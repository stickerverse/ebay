import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../../contexts/AuthContext';
import EbayCredentials from './EbayCredentials';
import AutoResponseSettings from './AutoResponseSettings';
import BusinessHours from './BusinessHours';
import ResponseTemplates from './ResponseTemplates';
import { settingsAPI } from '../../services/api';
import { Settings as SettingsIcon, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('credentials');
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery('settings', settingsAPI.get);

  const updateSettingsMutation = useMutation(settingsAPI.update, {
    onSuccess: () => {
      toast.success('Settings updated successfully');
      queryClient.invalidateQueries('settings');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update settings');
    }
  });

  const tabs = [
    { id: 'credentials', label: 'eBay Credentials', icon: SettingsIcon },
    { id: 'autoresponse', label: 'Auto Response', icon: Save },
    { id: 'hours', label: 'Business Hours', icon: SettingsIcon },
    { id: 'templates', label: 'Templates', icon: SettingsIcon }
  ];

  const handleUpdateSettings = (newSettings) => {
    updateSettingsMutation.mutate(newSettings);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Configure your eBay Store Manager preferences</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'credentials' && (
            <EbayCredentials
              user={user}
              onUpdate={handleUpdateSettings}
              isLoading={updateSettingsMutation.isLoading}
            />
          )}
          
          {activeTab === 'autoresponse' && (
            <AutoResponseSettings
              settings={settings?.data?.settings}
              onUpdate={handleUpdateSettings}
              isLoading={updateSettingsMutation.isLoading}
            />
          )}
          
          {activeTab === 'hours' && (
            <BusinessHours
              settings={settings?.data?.settings}
              onUpdate={handleUpdateSettings}
              isLoading={updateSettingsMutation.isLoading}
            />
          )}
          
          {activeTab === 'templates' && (
            <ResponseTemplates
              settings={settings?.data?.settings}
              onUpdate={handleUpdateSettings}
              isLoading={updateSettingsMutation.isLoading}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
