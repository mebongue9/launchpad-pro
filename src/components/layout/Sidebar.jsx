// /src/components/layout/Sidebar.jsx
// Navigation sidebar with links to main sections
// Highlights current active route
// RELEVANT FILES: src/components/layout/DashboardLayout.jsx, src/App.jsx

import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  User,
  Users,
  Package,
  Rocket,
  Magnet,
  Palette,
  History,
  Settings,
  LogOut,
  Shield,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useAdmin } from '../../hooks/useAdmin'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/profiles', icon: User, label: 'Profiles' },
  { to: '/audiences', icon: Users, label: 'Audiences' },
  { to: '/products', icon: Package, label: 'Products' },
  { to: '/funnels', icon: Rocket, label: 'Funnel Builder' },
  { to: '/lead-magnets', icon: Magnet, label: 'Lead Magnets' },
  { to: '/visual-builder', icon: Palette, label: 'Visual Builder' },
  { to: '/history', icon: History, label: 'History' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export function Sidebar({ onClose }) {
  const { signOut } = useAuth()
  const { isAdmin } = useAdmin()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (err) {
      console.error('Sign out error:', err)
    }
  }

  // Build nav items including admin link if user is admin
  const allNavItems = isAdmin
    ? [...navItems, { to: '/admin', icon: Shield, label: 'Admin' }]
    : navItems

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">
          Launchpad Pro
        </h1>
        <p className="text-xs text-gray-500 mt-1">AI Funnel Builder</p>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {allNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </div>
  )
}
