// /src/pages/Settings.jsx
// Account settings and app preferences
// Shows user info, usage stats, and configuration options
// RELEVANT FILES: src/hooks/useAuth.js, src/App.jsx

import { useState } from 'react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useAuth } from '../hooks/useAuth'
import { useProfiles } from '../hooks/useProfiles'
import { useFunnels } from '../hooks/useFunnels'
import { useLeadMagnets } from '../hooks/useLeadMagnets'
import { useCreations } from '../hooks/useCreations'
import { useToast } from '../components/ui/Toast'
import {
  User,
  Mail,
  Calendar,
  BarChart3,
  Rocket,
  Magnet,
  Palette,
  LogOut,
  Shield,
  Database,
  Loader2,
  Globe
} from 'lucide-react'
import FavoriteLanguagesManager from '../components/settings/FavoriteLanguagesManager'

export default function Settings() {
  const { user, signOut } = useAuth()
  const { profiles, updateFavoriteLanguages } = useProfiles()
  const { funnels } = useFunnels()
  const { leadMagnets } = useLeadMagnets()
  const { creations } = useCreations()
  const { addToast } = useToast()
  const [signingOut, setSigningOut] = useState(false)
  const [savingLanguages, setSavingLanguages] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    try {
      await signOut()
      addToast('Signed out successfully', 'success')
    } catch (error) {
      addToast('Failed to sign out', 'error')
    } finally {
      setSigningOut(false)
    }
  }

  // Handle favorite languages update for the first profile
  async function handleUpdateFavoriteLanguages(newLanguages) {
    if (!profiles.length) {
      addToast('Please create a profile first', 'error')
      return
    }

    setSavingLanguages(true)
    try {
      await updateFavoriteLanguages(profiles[0].id, newLanguages)
      addToast('Favorite languages updated', 'success')
    } catch (error) {
      addToast(error.message || 'Failed to update languages', 'error')
    } finally {
      setSavingLanguages(false)
    }
  }

  // Get current favorite languages from first profile
  const currentFavoriteLanguages = profiles[0]?.favorite_languages || ['English', 'French', 'Spanish', 'Indonesian', 'German']

  const stats = [
    { label: 'Profiles', value: profiles.length, icon: User, color: 'text-blue-600 bg-blue-100' },
    { label: 'Funnels', value: funnels.length, icon: Rocket, color: 'text-orange-600 bg-orange-100' },
    { label: 'Lead Magnets', value: leadMagnets.length, icon: Magnet, color: 'text-green-600 bg-green-100' },
    { label: 'Visual Designs', value: creations.length, icon: Palette, color: 'text-pink-600 bg-pink-100' }
  ]

  const accountCreated = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'Unknown'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">
          Manage your account and preferences
        </p>
      </div>

      {/* Account Info */}
      <Card>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-gray-600" />
          Account Information
        </h2>

        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Mail className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="font-medium text-gray-900">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Calendar className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Account Created</p>
              <p className="font-medium text-gray-900">{accountCreated}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Shield className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Account Status</p>
              <p className="font-medium text-green-600">Active</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Usage Statistics */}
      <Card>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-gray-600" />
          Usage Statistics
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center p-4 bg-gray-50 rounded-lg">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-medium text-gray-900">Knowledge Base Connected</p>
              <p className="text-sm text-gray-500">
                AI uses your content library for personalized generation
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Language Preferences */}
      <Card>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5 text-gray-600" />
          Language Preferences
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Customize which languages appear at the top of the language selector when creating funnels.
        </p>
        <FavoriteLanguagesManager
          favorites={currentFavoriteLanguages}
          onUpdate={handleUpdateFavoriteLanguages}
          loading={savingLanguages}
        />
      </Card>

      {/* Actions */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">Account Actions</h2>

        <div className="space-y-3">
          <Button
            variant="secondary"
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full justify-center"
          >
            {signingOut ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Signing Out...
              </>
            ) : (
              <>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* App Info */}
      <Card className="bg-gray-50">
        <div className="text-center text-sm text-gray-500">
          <p className="font-medium text-gray-700">Launchpad Pro</p>
          <p>Version 1.0.0</p>
          <p className="mt-2">
            AI-powered funnel and lead magnet generator for coaches
          </p>
        </div>
      </Card>
    </div>
  )
}
