// src/components/settings/GenerationSettingsSection.jsx
// Admin configuration for generation retry settings
// Allows configuring retry delays and max attempts
// RELEVANT FILES: netlify/functions/lib/retry-engine.js, netlify/functions/get-app-settings.js

import { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { Settings, Loader2, Save, RefreshCw } from 'lucide-react';

export default function GenerationSettingsSection() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    retry_attempt_2_delay: 5,
    retry_attempt_3_delay: 30,
    retry_attempt_4_delay: 120,
    retry_attempt_5_delay: 300,
    retry_attempt_6_delay: 300,
    retry_attempt_7_delay: 300,
    max_retry_attempts: 7
  });

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const response = await fetch('/.netlify/functions/get-app-settings');
      if (!response.ok) throw new Error('Failed to load settings');

      const data = await response.json();

      // Convert settings map to our state format
      const newSettings = {};
      Object.keys(settings).forEach(key => {
        if (data.settings[key]) {
          newSettings[key] = parseInt(data.settings[key].value);
        }
      });

      setSettings(prev => ({ ...prev, ...newSettings }));
    } catch (error) {
      console.error('Error loading settings:', error);
      addToast('Failed to load generation settings', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveSettings() {
    setSaving(true);
    try {
      const response = await fetch('/.netlify/functions/update-app-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings })
      });

      if (!response.ok) throw new Error('Failed to save settings');

      addToast('Generation settings saved successfully', 'success');
    } catch (error) {
      console.error('Error saving settings:', error);
      addToast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  }

  function handleInputChange(key, value) {
    const numValue = parseInt(value) || 0;
    setSettings(prev => ({ ...prev, [key]: numValue }));
  }

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
        <Settings className="w-5 h-5 text-gray-600" />
        Generation Settings
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Configure automatic retry behavior when AI generation encounters errors.
        These settings apply to all users.
      </p>

      <div className="space-y-6">
        {/* Retry Delays Section */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Retry Delays (seconds)
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            How long to wait before each retry attempt
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Attempt 2 delay
              </label>
              <input
                type="number"
                min="0"
                value={settings.retry_attempt_2_delay}
                onChange={(e) => handleInputChange('retry_attempt_2_delay', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1">seconds</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Attempt 3 delay
              </label>
              <input
                type="number"
                min="0"
                value={settings.retry_attempt_3_delay}
                onChange={(e) => handleInputChange('retry_attempt_3_delay', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1">seconds</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Attempt 4 delay
              </label>
              <input
                type="number"
                min="0"
                value={settings.retry_attempt_4_delay}
                onChange={(e) => handleInputChange('retry_attempt_4_delay', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1">seconds</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Attempt 5 delay
              </label>
              <input
                type="number"
                min="0"
                value={settings.retry_attempt_5_delay}
                onChange={(e) => handleInputChange('retry_attempt_5_delay', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1">seconds</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Attempt 6 delay
              </label>
              <input
                type="number"
                min="0"
                value={settings.retry_attempt_6_delay}
                onChange={(e) => handleInputChange('retry_attempt_6_delay', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1">seconds</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Attempt 7 delay
              </label>
              <input
                type="number"
                min="0"
                value={settings.retry_attempt_7_delay}
                onChange={(e) => handleInputChange('retry_attempt_7_delay', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1">seconds</p>
            </div>
          </div>
        </div>

        {/* Max Attempts */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Maximum Retry Attempts
          </h3>
          <p className="text-xs text-gray-500 mb-3">
            How many times to retry before marking a task as failed
          </p>
          <div className="max-w-xs">
            <input
              type="number"
              min="1"
              max="10"
              value={settings.max_retry_attempts}
              onChange={(e) => handleInputChange('max_retry_attempts', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">attempts (recommended: 7)</p>
          </div>
        </div>

        {/* Info Box */}
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>Note:</strong> These settings apply globally to all generation tasks.
            Longer delays reduce API rate limiting but increase total generation time.
            Default settings are optimized for reliability.
          </p>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <Button
            onClick={handleSaveSettings}
            disabled={saving}
            className="min-w-[200px]"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving Settings...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Generation Settings
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
