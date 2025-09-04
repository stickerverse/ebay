import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

const BusinessHours = ({ settings, onUpdate, isLoading }) => {
  const [businessHours, setBusinessHours] = useState({
    start: '09:00',
    end: '17:00'
  });

  useEffect(() => {
    if (settings?.autoResponse?.businessHours) {
      setBusinessHours(settings.autoResponse.businessHours);
    }
  }, [settings]);

  const handleChange = (field, value) => {
    setBusinessHours(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate({
      settings: {
        autoResponse: {
          ...settings?.autoResponse,
          businessHours
        }
      }
    });
  };

  const timeOptions = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const displayTime = new Date(`2000-01-01T${timeString}`).toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      timeOptions.push({ value: timeString, label: displayTime });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Business Hours</h3>
        <p className="text-sm text-gray-600 mt-1">
          Set your business hours for automatic responses. Messages outside these hours will be queued.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <Clock className="h-5 w-5 text-blue-600 mr-3" />
            <div>
              <h4 className="font-medium text-blue-900">Current Business Hours</h4>
              <p className="text-sm text-blue-800">
                {new Date(`2000-01-01T${businessHours.start}`).toLocaleTimeString([], {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                })} - {new Date(`2000-01-01T${businessHours.end}`).toLocaleTimeString([], {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                })}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
              Start Time
            </label>
            <select
              id="startTime"
              value={businessHours.start}
              onChange={(e) => handleChange('start', e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {timeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">
              End Time
            </label>
            <select
              id="endTime"
              value={businessHours.end}
              onChange={(e) => handleChange('end', e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {timeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3">Quick Presets</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { label: '9 AM - 5 PM', start: '09:00', end: '17:00' },
              { label: '8 AM - 6 PM', start: '08:00', end: '18:00' },
              { label: '10 AM - 4 PM', start: '10:00', end: '16:00' },
              { label: '24/7', start: '00:00', end: '23:59' }
            ].map(preset => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setBusinessHours({ start: preset.start, end: preset.end })}
                className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : 'Save Business Hours'}
        </button>
      </form>
    </div>
  );
};

export default BusinessHours;
