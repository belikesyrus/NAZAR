import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { analyticsAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import StatCard from '../components/StatCard'
import StatusBadge from '../components/StatusBadge'
import { PageLoader } from '../components/LoadingSpinner'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import {
  FolderKanban, ClipboardList, CheckCircle, AlertTriangle,
  Camera, Users, TrendingUp, ShieldAlert, Bell, Eye, ArrowRight
} from 'lucide-react'

const PIE_COLORS = ['#2563eb', '#16a34a', '#eab308', '#dc2626']

export default function Dashboard() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [trends, setTrends] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [dashRes, trendRes] = await Promise.all([
          analyticsAPI.getDashboard(),
          analyticsAPI.getInspectionTrends(30),
        ])
        setData(dashRes.data)
        setTrends(trendRes.data)
      } catch {
        setError('Failed to load dashboard data. Is the backend running?')
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  if (loading) return <PageLoader />
  if (error) return (
    <div className="p-6">
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6 text-center">
        <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
        <p className="font-medium">{error}</p>
        <p className="text-sm mt-1">Start the backend: <code className="bg-red-100 px-2 py-0.5 rounded">python run.py</code></p>
      </div>
    </div>
  )

  const stats = data?.stats || {}
  const statusChartData = trends?.by_status?.map(s => ({ name: s.status.replace(/_/g, ' '), value: s.count })) || []
  const typeChartData = trends?.by_type?.map(t => ({ name: t.type, value: t.count })) || []
  const trendData = trends?.daily_trend?.slice(-14) || []

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Welcome back, <span className="font-medium text-gray-700">{user?.name}</span> · Real-time overview
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/inspections" className="btn-secondary text-sm flex items-center gap-2">
            <ClipboardList className="w-4 h-4" />Inspections
          </Link>
          <Link to="/alerts" className="btn-primary text-sm flex items-center gap-2">
            <Bell className="w-4 h-4" />Alerts
            {stats.open_alerts > 0 && <span className="bg-red-500 text-white text-xs rounded-full px-1.5">{stats.open_alerts}</span>}
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        <StatCard title="Total Projects" value={stats.total_projects} icon={FolderKanban} color="blue" sub={`${stats.active_projects} active`} />
        <StatCard title="Total Inspections" value={stats.total_inspections} icon={ClipboardList} color="purple" />
        <StatCard title="Pending" value={stats.pending_inspections} icon={ShieldAlert} color="yellow" />
        <StatCard title="Completed" value={stats.completed_inspections} icon={CheckCircle} color="green" />
        <StatCard title="High Risk" value={stats.high_risk_projects} icon={AlertTriangle} color="red" />
        <StatCard title="Open Alerts" value={stats.open_alerts} icon={Bell} color="orange" />
        <StatCard title="Cameras Online" value={`${stats.cameras_online}/${stats.cameras_total}`} icon={Camera} color={stats.cameras_offline > 0 ? 'yellow' : 'green'} />
        <StatCard title="Avg Compliance" value={`${stats.avg_compliance}%`} icon={TrendingUp} color="blue" />
        <StatCard title="Att. Anomalies" value={stats.attendance_anomalies} icon={Users} color="red" sub="last 30 days" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Inspection trend */}
        <div className="lg:col-span-2 card">
          <h3 className="section-title">Inspection Activity (Last 14 Days)</h3>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d?.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip labelFormatter={d => `Date: ${d}`} />
                <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} name="Inspections" />
              </LineChart>
            </ResponsiveContainer>
          ) : <div className="h-52 flex items-center justify-center text-gray-400 text-sm">No trend data available</div>}
        </div>

        {/* Inspection by status */}
        <div className="card">
          <h3 className="section-title">By Status</h3>
          {statusChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusChartData} dataKey="value" cx="50%" cy="50%" outerRadius={75} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                  {statusChartData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="h-52 flex items-center justify-center text-gray-400 text-sm">No data</div>}
        </div>
      </div>

      {/* Recent data row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Recent Inspections */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title mb-0">Recent Inspections</h3>
            <Link to="/inspections" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {data?.recent_inspections?.length > 0 ? data.recent_inspections.map(ins => (
              <Link key={ins.id} to={`/inspections/${ins.id}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 border border-gray-100 transition-colors">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <ClipboardList className="w-4 h-4 text-blue-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{ins.project_name}</p>
                  <p className="text-xs text-gray-500">{ins.inspection_number} · {ins.assigned_officer_name || 'Unassigned'}</p>
                </div>
                <StatusBadge status={ins.status} />
              </Link>
            )) : <p className="text-sm text-gray-500 text-center py-6">No inspections yet</p>}
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title mb-0">Recent Alerts</h3>
            <Link to="/alerts" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {data?.recent_alerts?.length > 0 ? data.recent_alerts.map(alert => (
              <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                <div className={`p-1.5 rounded-lg flex-shrink-0 ${
                  alert.severity === 'critical' ? 'bg-red-100' :
                  alert.severity === 'high' ? 'bg-orange-100' :
                  alert.severity === 'medium' ? 'bg-yellow-100' : 'bg-blue-100'
                }`}>
                  <AlertTriangle className={`w-4 h-4 ${
                    alert.severity === 'critical' ? 'text-red-600' :
                    alert.severity === 'high' ? 'text-orange-600' :
                    alert.severity === 'medium' ? 'text-yellow-600' : 'text-blue-600'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{alert.title}</p>
                  <p className="text-xs text-gray-500 truncate">{alert.project_name || 'System'}</p>
                </div>
                <StatusBadge status={alert.severity} />
              </div>
            )) : <p className="text-sm text-gray-500 text-center py-6">No alerts</p>}
          </div>
        </div>
      </div>

      {/* Compliance bar */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-title mb-0">Inspection Type Breakdown</h3>
          <Link to="/analytics/compliance" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
            Full Analytics <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {typeChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={typeChartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
              <Tooltip />
              <Bar dataKey="value" fill="#2563eb" radius={[0, 4, 4, 0]} name="Count" />
            </BarChart>
          </ResponsiveContainer>
        ) : <div className="h-28 flex items-center justify-center text-gray-400 text-sm">No data</div>}
      </div>
    </div>
  )
}
