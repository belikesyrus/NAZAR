import React, { useState, useEffect, useRef } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { notificationsAPI } from '../services/api'
import {
  LayoutDashboard, Monitor, Camera, Video, Map, FolderKanban,
  Building2, Users, ClipboardList, FileCheck, ShieldAlert, Bell,
  MessageSquare, BarChart3, TrendingUp, AlertTriangle, Settings,
  LogOut, Menu, X, ChevronDown, ChevronRight, Shield, User,
  Search, RefreshCw
} from 'lucide-react'

const NAV = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    to: '/dashboard',
  },
  {
    label: 'Monitoring',
    icon: Monitor,
    children: [
      { label: 'Live Monitoring', icon: Monitor, to: '/monitoring/live' },
      { label: 'CCTV Surveillance', icon: Camera, to: '/monitoring/cctv' },
      { label: 'Video Conferencing', icon: Video, to: '/monitoring/vc' },
      { label: 'Geo Map', icon: Map, to: '/monitoring/map' },
    ],
  },
  {
    label: 'Projects',
    icon: FolderKanban,
    children: [
      { label: 'All Projects', icon: FolderKanban, to: '/projects' },
      { label: 'Institutes', icon: Building2, to: '/projects/institutes' },
      { label: 'NGOs', icon: Building2, to: '/projects/ngos' },
      { label: 'Beneficiaries', icon: Users, to: '/projects/beneficiaries' },
    ],
  },
  {
    label: 'Inspections',
    icon: ClipboardList,
    children: [
      { label: 'All Inspections', icon: ClipboardList, to: '/inspections' },
      { label: 'Assigned To Me', icon: ClipboardList, to: '/inspections/mine' },
      { label: 'Surprise Inspections', icon: ShieldAlert, to: '/inspections/surprise' },
      { label: 'Inspection Reports', icon: FileCheck, to: '/reports' },
    ],
  },
  {
    label: 'Analytics',
    icon: BarChart3,
    children: [
      { label: 'Attendance Analytics', icon: BarChart3, to: '/analytics/attendance' },
      { label: 'Anomaly Detection', icon: AlertTriangle, to: '/analytics/anomalies' },
      { label: 'Compliance Analytics', icon: TrendingUp, to: '/analytics/compliance' },
      { label: 'Performance', icon: TrendingUp, to: '/analytics/performance' },
    ],
  },
  { label: 'Alerts & Notifications', icon: Bell, to: '/alerts' },
  { label: 'Feedback & Complaints', icon: MessageSquare, to: '/feedback' },
  { label: 'Users & Roles', icon: Users, to: '/users', adminOnly: true },
  { label: 'Settings', icon: Settings, to: '/settings' },
]

function NavItem({ item, collapsed, onClose }) {
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const { isAdmin } = useAuth()

  if (item.adminOnly && !isAdmin()) return null

  const isChildActive = item.children?.some(c => location.pathname.startsWith(c.to))

  useEffect(() => {
    if (isChildActive) setOpen(true)
  }, [isChildActive])

  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            isChildActive ? 'bg-blue-700 text-white' : 'text-blue-100 hover:bg-blue-700/50'
          }`}
        >
          <item.icon className="w-4 h-4 flex-shrink-0" />
          {!collapsed && (
            <>
              <span className="flex-1 text-left">{item.label}</span>
              {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </>
          )}
        </button>
        {open && !collapsed && (
          <div className="ml-4 mt-1 space-y-0.5 border-l border-blue-700 pl-3">
            {item.children.map(child => (
              <NavLink
                key={child.to}
                to={child.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive ? 'bg-blue-600 text-white' : 'text-blue-200 hover:bg-blue-700/50 hover:text-white'
                  }`
                }
              >
                <child.icon className="w-3.5 h-3.5" />
                {child.label}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <NavLink
      to={item.to}
      onClick={onClose}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          isActive ? 'bg-blue-600 text-white' : 'text-blue-100 hover:bg-blue-700/50'
        }`
      }
    >
      <item.icon className="w-4 h-4 flex-shrink-0" />
      {!collapsed && <span>{item.label}</span>}
    </NavLink>
  )
}

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [unread, setUnread] = useState(0)
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef(null)

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await notificationsAPI.getAll({ unread: true })
        setUnread(res.data.unread_count || 0)
      } catch {}
    }
    fetchUnread()
    const timer = setInterval(fetchUnread, 60000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const ROLE_LABELS = {
    department_official: 'Dept. Official',
    inspection_officer: 'Insp. Officer',
    project_incharge: 'Project Incharge',
    ngo_staff: 'NGO Staff',
    district_authority: 'Dist. Authority',
    beneficiary: 'Beneficiary',
  }

  const Sidebar = ({ mobile = false }) => (
    <aside className={`${mobile ? 'w-72' : collapsed ? 'w-16' : 'w-64'} bg-blue-900 flex flex-col h-full transition-all duration-200`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-blue-800">
        <div className="bg-orange-500 p-1.5 rounded-lg flex-shrink-0">
          <Shield className="w-5 h-5 text-white" />
        </div>
        {(!collapsed || mobile) && (
          <div className="min-w-0">
            <div className="font-bold text-white text-sm leading-tight">Smart Monitor</div>
            <div className="text-blue-300 text-xs truncate">DoSJE System</div>
          </div>
        )}
        {!mobile && (
          <button onClick={() => setCollapsed(!collapsed)} className="ml-auto text-blue-400 hover:text-white hidden lg:block">
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4 rotate-90" />}
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {NAV.map((item, i) => (
          <NavItem key={i} item={item} collapsed={collapsed && !mobile} onClose={() => setSidebarOpen(false)} />
        ))}
      </nav>

      {/* User bottom */}
      {(!collapsed || mobile) && (
        <div className="border-t border-blue-800 p-3">
          <div className="flex items-center gap-2 bg-blue-800 rounded-lg px-3 py-2">
            <div className="bg-orange-500 rounded-full w-7 h-7 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">{user?.name?.[0]?.toUpperCase()}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-white text-xs font-medium truncate">{user?.name}</div>
              <div className="text-blue-300 text-xs truncate">{ROLE_LABELS[user?.role] || user?.role}</div>
            </div>
          </div>
        </div>
      )}
    </aside>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-50">
            <Sidebar mobile />
          </div>
          <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 z-50 text-white">
            <X className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top nav */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-500 hover:text-gray-700">
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1 max-w-md hidden sm:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input placeholder="Search projects, inspections..." className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white" />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => window.location.reload()} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg" title="Refresh">
              <RefreshCw className="w-4 h-4" />
            </button>

            <button onClick={() => navigate('/alerts')} className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
              <Bell className="w-5 h-5" />
              {unread > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>

            <div className="relative" ref={profileRef}>
              <button onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <div className="bg-blue-700 rounded-full w-8 h-8 flex items-center justify-center">
                  <span className="text-white text-sm font-bold">{user?.name?.[0]?.toUpperCase()}</span>
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-sm font-medium text-gray-900 leading-tight">{user?.name?.split(' ')[0]}</div>
                  <div className="text-xs text-gray-500 capitalize">{ROLE_LABELS[user?.role]}</div>
                </div>
                <ChevronDown className="w-3 h-3 text-gray-400 hidden md:block" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50">
                  <button onClick={() => { navigate('/settings'); setProfileOpen(false) }}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                    <User className="w-4 h-4" />My Profile
                  </button>
                  <button onClick={() => { navigate('/settings'); setProfileOpen(false) }}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                    <Settings className="w-4 h-4" />Settings
                  </button>
                  <div className="border-t border-gray-100 my-1" />
                  <button onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                    <LogOut className="w-4 h-4" />Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
