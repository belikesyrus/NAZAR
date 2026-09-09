import React, { useEffect, useState } from 'react'
import { analyticsAPI } from '../services/api'
import StatusBadge from '../components/StatusBadge'
import { PageLoader } from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import toast from 'react-hot-toast'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { AlertTriangle, Zap, RefreshCw } from 'lucide-react'

const SEVERITY_COLOR = { low: 'border-blue-200 bg-blue-50', medium: 'border-yellow-200 bg-yellow-50', high: 'border-red-200 bg-red-50', critical: 'border-red-400 bg-red-100' }
const CODE_ICONS = { ATTENDANCE_ANOMALY: '📊', CCTV_OFFLINE: '📷', LOW_COMPLIANCE: '📉', UNUSUAL_REPORTING: '⚠', INSPECTION_OVERDUE: '🗓' }

export default function AnomalyPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [severityFilter, setSeverityFilter] = useState('')
  const [codeFilter, setCodeFilter] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const res = await analyticsAPI.getAnomalies()
      setData(res.data)
    } catch { toast.error('Failed to load anomaly data') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const filtered = (data?.anomalies || []).filter(a =>
    (!severityFilter || a.severity === severityFilter) &&
    (!codeFilter || a.alert_code === codeFilter)
  )

  const bySeverityChart = data ? Object.entries(data.by_severity || {}).map(([k, v]) => ({ name: k, count: v })) : []
  const byCodeChart = data ? Object.entries(data.by_code || {}).map(([k, v]) => ({ name: k.replace(/_/g,' '), count: v })) : []

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Anomaly Detection</h1>
          <p className="text-sm text-gray-500">AI-powered rule-based anomaly alerts</p>
        </div>
        <button onClick={load} className="btn-secondary flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />Refresh
        </button>
      </div>

      {/* Summary cards */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Object.entries(data.by_severity || {}).map(([sev, count]) => (
            <div key={sev} className={`rounded-xl border p-4 ${SEVERITY_COLOR[sev] || 'bg-gray-50 border-gray-200'}`}>
              <div className="text-xs font-medium opacity-70 uppercase mb-1">{sev}</div>
              <div className="text-2xl font-bold">{count}</div>
            </div>
          ))}
        </div>
      )}

      {loading ? <PageLoader /> : (
        <>
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card">
              <h3 className="section-title">By Severity</h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={bySeverityChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#ef4444" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="card">
              <h3 className="section-title">By Type</h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={byCodeChart} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={100} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#2563eb" radius={[0,4,4,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)} className="input-field w-auto">
              <option value="">All Severities</option>
              {['low','medium','high','critical'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={codeFilter} onChange={e => setCodeFilter(e.target.value)} className="input-field w-auto">
              <option value="">All Types</option>
              {['ATTENDANCE_ANOMALY','CCTV_OFFLINE','LOW_COMPLIANCE','UNUSUAL_REPORTING','INSPECTION_OVERDUE'].map(c => <option key={c} value={c}>{c.replace(/_/g,' ')}</option>)}
            </select>
          </div>

          {/* Anomaly list */}
          {filtered.length === 0 ? (
            <EmptyState icon={Zap} title="No anomalies found" desc="The system will detect anomalies automatically based on rules." />
          ) : (
            <div className="space-y-3">
              {filtered.map(a => (
                <div key={a.id} className={`border-l-4 ${a.severity === 'critical' ? 'border-l-red-600' : a.severity === 'high' ? 'border-l-red-400' : a.severity === 'medium' ? 'border-l-yellow-400' : 'border-l-blue-400'} ${SEVERITY_COLOR[a.severity]} border rounded-xl p-4`}>
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                    <div className="text-2xl flex-shrink-0">{CODE_ICONS[a.alert_code] || '⚡'}</div>
                    <div className="flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-gray-900">{a.title}</p>
                        <StatusBadge status={a.severity} />
                        <span className="badge badge-gray text-xs">{a.alert_code}</span>
                      </div>
                      <p className="text-sm text-gray-700">{a.description}</p>
                      {a.project_name && <p className="text-xs text-gray-500">Project: {a.project_name}</p>}
                      {a.recommended_action && (
                        <div className="bg-white/70 rounded-lg p-2.5 mt-1">
                          <p className="text-xs font-semibold text-gray-600">Recommended Action:</p>
                          <p className="text-xs text-gray-700">{a.recommended_action}</p>
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 flex-shrink-0">{a.created_at ? new Date(a.created_at).toLocaleDateString() : ''}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
