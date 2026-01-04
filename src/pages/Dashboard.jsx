// /src/pages/Dashboard.jsx
// Main dashboard showing overview and quick actions
// Entry point after login with full stats
// RELEVANT FILES: src/components/layout/DashboardLayout.jsx, src/hooks/useAuth.js

import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useProfiles } from '../hooks/useProfiles'
import { useAudiences } from '../hooks/useAudiences'
import { useFunnels } from '../hooks/useFunnels'
import { useLeadMagnets } from '../hooks/useLeadMagnets'
import { useCreations } from '../hooks/useCreations'
import { Card } from '../components/ui/Card'
import {
  User,
  Users,
  Rocket,
  Magnet,
  ArrowRight,
  Sparkles,
  Palette,
  TrendingUp,
  Clock
} from 'lucide-react'

export default function Dashboard() {
  const { user } = useAuth()
  const { profiles } = useProfiles()
  const { audiences } = useAudiences()
  const { funnels } = useFunnels()
  const { leadMagnets } = useLeadMagnets()
  const { creations } = useCreations()

  const quickActions = [
    {
      title: 'Create Profile',
      description: 'Set up your business identity',
      icon: User,
      to: '/profiles',
      color: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'Define Audience',
      description: 'Know who you serve',
      icon: Users,
      to: '/audiences',
      color: 'bg-purple-100 text-purple-600',
    },
    {
      title: 'Build Funnel',
      description: 'Generate your product funnel',
      icon: Rocket,
      to: '/funnels',
      color: 'bg-orange-100 text-orange-600',
    },
    {
      title: 'Create Lead Magnet',
      description: 'Attract your ideal clients',
      icon: Magnet,
      to: '/lead-magnets',
      color: 'bg-green-100 text-green-600',
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back!
        </h1>
        <p className="text-gray-500 mt-1">
          {user?.email}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
          <div className="flex items-center gap-3">
            <User className="w-8 h-8 opacity-80" />
            <div>
              <p className="text-2xl font-bold">{profiles.length}</p>
              <p className="text-sm opacity-80">Profiles</p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 opacity-80" />
            <div>
              <p className="text-2xl font-bold">{audiences.length}</p>
              <p className="text-sm opacity-80">Audiences</p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
          <div className="flex items-center gap-3">
            <Rocket className="w-8 h-8 opacity-80" />
            <div>
              <p className="text-2xl font-bold">{funnels.length}</p>
              <p className="text-sm opacity-80">Funnels</p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
          <div className="flex items-center gap-3">
            <Magnet className="w-8 h-8 opacity-80" />
            <div>
              <p className="text-2xl font-bold">{leadMagnets.length}</p>
              <p className="text-sm opacity-80">Lead Magnets</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Visual Creations Stat */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-gradient-to-br from-pink-500 to-rose-500 text-white border-0">
          <div className="flex items-center gap-3">
            <Palette className="w-8 h-8 opacity-80" />
            <div>
              <p className="text-2xl font-bold">{creations.length}</p>
              <p className="text-sm opacity-80">Visual Designs</p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-500 to-teal-500 text-white border-0">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 opacity-80" />
            <div>
              <p className="text-2xl font-bold">{funnels.length + leadMagnets.length + creations.length}</p>
              <p className="text-sm opacity-80">Total Creations</p>
            </div>
          </div>
        </Card>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {quickActions.map((action) => (
            <Link key={action.to} to={action.to}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${action.color}`}>
                    <action.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{action.title}</h3>
                    <p className="text-sm text-gray-500">{action.description}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {profiles.length === 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Get Started</h3>
              <p className="text-sm text-gray-600 mt-1">
                Create your first profile to start generating personalized funnels and lead magnets with AI.
              </p>
              <Link
                to="/profiles"
                className="inline-flex items-center gap-2 mt-3 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Create Profile <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
