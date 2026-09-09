import React, { useEffect, useState, useCallback } from 'react'
import { notificationsAPI } from '../services/api'
import StatusBadge from '../components/StatusBadge'
import { PageLoader } from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import toast from 'react-hot-toast'
import { Bell, CheckCircle, ChevronLeft, ChevronRight, AlertTriangle, Filter } from 'lucide-react'

const SEV_BORDER = { critical:'border-l-red-600', high:'border-l-red-400', medium:'border-l-yellow-400', low:'border-l-blue-400' }
const SEV_BG = { critical:'bg-red-50', high:'bg-orange-50', medium:'bg-yellow-50', low:'bg-blue-50' }

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [unread, setUnread] = useState(0)
  const [sevFilter, setSevFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, per_page: 15 }
      if (sevFilter) params.severity = sevFilter
      if (statusFilter) params.status = statusFilter
      const res = await notificationsAPI.getAlerts(params)
      setAlerts(res.data.alerts)
      setTotal(res.data.total)
      setPages(res.data.pages)
      setUnread(res.data.unread_count)
    } catch { toast.error('Failed to load alerts') }
    finally { setLoading(false) }
  }, [page, sevFilter, statusFilter])

  useEffect(() => { load() }, [load])

  const markRead = async (id) => {
    try { await notificationsAPI.markAlertRead(id); load() }
    catch { toast.error('Failed to update') }
  }

  const resolve = async (id) => {
    try { await notificationsAPI.resolveAlert(id); toast.success('Alert resolved'); load() }
    catch { toast.error('Failed to resolve') }
  }

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-5 h-5" />Alerts & Notifications
            {unread > 0 && <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">{unread}</span>}
          </h1>
          <p className="text-sm text-gray-500">{total} total alerts</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={sevFilter} onChange={e => { setSevFilter(e.target.value); setPage(1) }} className="input-field w-auto">
          <option value="">All Severities</option>
          {['critical','high','medium','low'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }} className="input-field w-auto">
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="resolved">Resolved</option>
          <option value="acknowledged">Acknowledged</option>
        </select>
      </div>

      {loading ? <PageLoader /> : alerts.length === 0 ? (
        <EmptyState icon={Bell} title="No alerts" desc="The system will generate alerts automatically." />
      ) : (
        <div className="space-y-3">
          {alerts.map(a => (
            <div key={a.id} className={`border-l-4 ${SEV_BORDER[a.severity] || 'border-l-gray-300'} ${SEV_BG[a.severity] || 'bg-gray-50'} border rounded-xl p-4 ${!a.is_read ? 'ring-1 ring-blue-200' : ''}`}>
              <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${a.severity === 'critical' ? 'text-red-600' : a.severity === 'high' ? 'text-orange-500' : a.severity === 'medium' ? 'text-yellow-500' : 'text-blue-500'}`} />
                <div className="flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-gray-900">{a.title}</p>
                    <StatusBadge status={a.severity} />
                    <StatusBadge status={a.status} />
                    {!a.is_read && <span className="w-2 h-2 bg-blue-500 rounded-full" title="Unread" />}
                  </div>
                  <p className="text-sm text-gray-700">{a.description}</p>
                  {a.project_name && <p className="text-xs text-gray-500">📍 {a.project_name}</p>}
                  {a.recommended_action && (
                    <div className="bg-white/80 rounded-lg px-3 py-2 text-xs">
                      <span className="font-semibold">Action: </span>{a.recommended_action}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 items-end flex-shrink-0">
                  <span className="text-xs text-gray-400">{a.created_at ? new Date(a.created_at).toLocaleDateString() : ''}</span>
                  <div className="flex gap-2">
                    {!a.is_read && (
                      <button onClick={() => markRead(a.id)} className="text-xs btn-secondary py-1 px-2">
                        Mark Read
                      </button>
                    )}
                    {a.status === 'open' && (
                      <button onClick={() => resolve(a.id)} className="text-xs bg-green-100 hover:bg-green-200 text-green-700 py-1 px-2 rounded-lg border border-green-200 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />Resolve
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn-secondary p-2 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
          <span className="text-sm text-gray-600">Page {page} of {pages}</span>
          <button disabled={page >= pages} onClick={() => setPage(p => p + 1)} className="btn-secondary p-2 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
        </div>
      )}
    </div>
  )
}
