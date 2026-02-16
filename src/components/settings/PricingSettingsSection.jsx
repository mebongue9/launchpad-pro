// src/components/settings/PricingSettingsSection.jsx
// Admin configuration for default pricing and bundle discount
// Allows configuring default product prices and bundle discount percentage
// RELEVANT FILES: netlify/functions/get-app-settings.js, netlify/functions/update-app-settings.js

import { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { DollarSign, Loader2, Save, Percent } from 'lucide-react';

export default function PricingSettingsSection() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pricing, setPricing] = useState({
    default_price_front_end: '9.99',
    default_price_bump: '6.99',
    default_price_upsell_1: '12.99',
    default_price_upsell_2: '19.99',
    bundle_discount_percent: '55'
  });

  useEffect(() => {
    loadPricing();
  }, []);

  async function loadPricing() {
    try {
      const response = await fetch('/.netlify/functions/get-app-settings');
      if (!response.ok) throw new Error('Failed to load settings');

      const data = await response.json();

      const newPricing = {};
      Object.keys(pricing).forEach(key => {
        if (data.settings[key]) {
          newPricing[key] = data.settings[key].value;
        }
      });

      setPricing(prev => ({ ...prev, ...newPricing }));
    } catch (error) {
      console.error('Error loading pricing settings:', error);
      addToast('Failed to load pricing settings', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleSavePricing() {
    // Validate discount percentage
    const discount = parseInt(pricing.bundle_discount_percent);
    if (isNaN(discount) || discount < 1 || discount > 90) {
      addToast('Bundle discount must be between 1% and 90%', 'error');
      return;
    }

    // Validate prices are positive numbers
    const priceKeys = ['default_price_front_end', 'default_price_bump', 'default_price_upsell_1', 'default_price_upsell_2'];
    for (const key of priceKeys) {
      const val = parseFloat(pricing[key]);
      if (isNaN(val) || val < 0) {
        addToast('All prices must be valid positive numbers', 'error');
        return;
      }
    }

    setSaving(true);
    try {
      const response = await fetch('/.netlify/functions/update-app-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: pricing })
      });

      if (!response.ok) throw new Error('Failed to save pricing');

      addToast('Pricing defaults saved', 'success');
    } catch (error) {
      console.error('Error saving pricing settings:', error);
      addToast('Failed to save pricing settings', 'error');
    } finally {
      setSaving(false);
    }
  }

  function handleInputChange(key, value) {
    setPricing(prev => ({ ...prev, [key]: value }));
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
        <DollarSign className="w-5 h-5 text-gray-600" />
        Pricing Defaults
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Default prices used when generating funnels. Changes apply to new funnels only.
      </p>

      <div className="space-y-6">
        {/* Price Fields */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Default Product Prices
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Front-End
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={pricing.default_price_front_end}
                  onChange={(e) => handleInputChange('default_price_front_end', e.target.value)}
                  className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Bump
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={pricing.default_price_bump}
                  onChange={(e) => handleInputChange('default_price_bump', e.target.value)}
                  className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Upsell 1
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={pricing.default_price_upsell_1}
                  onChange={(e) => handleInputChange('default_price_upsell_1', e.target.value)}
                  className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Upsell 2
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={pricing.default_price_upsell_2}
                  onChange={(e) => handleInputChange('default_price_upsell_2', e.target.value)}
                  className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bundle Discount */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Percent className="w-4 h-4" />
            Bundle Discount
          </h3>
          <p className="text-xs text-gray-500 mb-3">
            Percentage discount applied to bundles (e.g., 55% means customer pays 45% of combined individual prices)
          </p>
          <div className="max-w-xs flex items-center gap-2">
            <input
              type="number"
              min="1"
              max="90"
              value={pricing.bundle_discount_percent}
              onChange={(e) => handleInputChange('bundle_discount_percent', e.target.value)}
              className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-500">%</span>
          </div>
        </div>

        {/* Info Box */}
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>Note:</strong> These prices are used as defaults when AI generates new funnels.
            Existing funnels are not affected. The bundle discount applies to both standalone and batched bundle generation.
          </p>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <Button
            onClick={handleSavePricing}
            disabled={saving}
            className="min-w-[200px]"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving Pricing...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Pricing Defaults
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
