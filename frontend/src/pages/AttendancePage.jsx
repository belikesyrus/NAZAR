import React, { useEffect, useState, useCallback } from 'react'
import { attendanceAPI, projectsAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal'
import { PageLoader } from '../components/LoadingSpinner'
import toast from 'react-hot-toast'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Plus, AlertTriangle, Users, TrendingDown } from 'lucide-react'

export default function AttendancePage() {
  const { isAdmin, isIncharge } = useAuth()
  const [analytics, setAnalytics] = useState(null)
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)
  const [projectFilter, setProjectFilter] = useState('')
  const [projects, setProjects] = useState([])
  const [modal, setModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ project_id:'', attendance_date:'', attendance_type:'staff', total_count:'', present_count:'', notes:'' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { days }
      if (projectFilter) params.project_id = projectFilter
      const [anaRes, recRes] = await Promise.all([
        attendanceAPI.getAnalytics(params),
        attendanceAPI.getAll({ ...(projectFilter ? { project_id: projectFilter } : {}), per_page: 30 })
      ])
      setAnalytics(anaRes.data)
      setRecords(recRes.data.attendance)
    } catch { toast.error('Failed to load attendance data') }
    finally { setLoading(false) }
  }, [days, projectFilter])

  useEffect(() => { load() }, [load])
  useEffect(() => { projectsAPI.getAll({ per_page: 100 }).then(r => setProjects(r.data.projects || [])).catch(() => {}) }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!form.project_id || !form.attendance_date || !form.total_count || !form.present_count) { toast.error('Fill all required fields'); return }
    setSaving(true)
    try {
      await attendanceAPI.add(form)
      toast.success('Attendance recorded')
      setModal(false)
      load()
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to add') }
    finally { setSaving(false) }
  }

  const fc = (f) => (e) => setForm({ ...form, [f]: e.target.value })

  const staffTrend = analytics?.staff?.trend || []
  const beneTrend = analytics?.beneficiary?.trend || []

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Attendance Analytics</h1>
          <p className="text-sm text-gray-500">Monitor staff and beneficiary attendance trends</p>
        </div>
        {(isAdmin() || isIncharge()) && (
          <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />Record Attendance
          </button>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3">
        <select value={days} onChange={e => setDays(parseInt(e.target.value))} className="input-field w-auto">
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={60}>Last 60 days</option>
          <option value={90}>Last 90 days</option>
        </select>
        <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)} className="input-field w-auto">
          <option value="">All Projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {loading ? <PageLoader /> : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <SummaryCard label="Staff Avg" value={`${analytics?.staff?.average || 0}%`} color="blue" />
            <SummaryCard label="Staff Min" value={`${analytics?.staff?.min || 0}%`} color="yellow" />
            <SummaryCard label="Beneficiary Avg" value={`${analytics?.beneficiary?.average || 0}%`} color="green" />
            <SummaryCard label="Anomalies" value={analytics?.anomalies?.length || 0} color="red" />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card">
              <h3 className="section-title">Staff Attendance Trend</h3>
              {staffTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={staffTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d?.slice(5)} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
                    <Tooltip formatter={v => `${v}%`} />
                    <Line type="monotone" dataKey="percentage" stroke="#2563eb" strokeWidth={2} dot={(p) => p.payload.is_anomaly ? <circle cx={p.cx} cy={p.cy} r={5} fill="#dc2626" /> : null} name="Staff %" />
                  </LineChart>
                </ResponsiveContainer>
              ) : <div className="h-40 flex items-center justify-center text-gray-400 text-sm">No data available</div>}
            </div>

            <div className="card">
              <h3 className="section-title">Beneficiary Attendance Trend</h3>
              {beneTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={beneTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d?.slice(5)} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
                    <Tooltip formatter={v => `${v}%`} />
                    <Line type="monotone" dataKey="percentage" stroke="#16a34a" strokeWidth={2} name="Beneficiary %" />
                  </LineChart>
                </ResponsiveContainer>
              ) : <div className="h-40 flex items-center justify-center text-gray-400 text-sm">No data available</div>}
            </div>
          </div>

          {/* Anomalies */}
          {analytics?.anomalies?.length > 0 && (
            <div className="card">
              <h3 className="section-title flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />Attendance Anomalies
              </h3>
              <div className="space-y-2">
                {analytics.anomalies.map(a => (
                  <div key={a.id} className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-3">
                    <TrendingDown className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-800">{a.project_name}</p>
                      <p className="text-xs text-red-600">{a.attendance_date} · {a.attendance_type} · {a.attendance_percentage}% · {a.anomaly_reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent records table */}
          <div className="card overflow-x-auto p-0">
            <div className="p-4 border-b"><h3 className="section-title mb-0">Recent Records</h3></div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="table-header">Project</th>
                  <th className="table-header">Date</th>
                  <th className="table-header">Type</th>
                  <th className="table-header">Present/Total</th>
                  <th className="table-header">Percentage</th>
                  <th className="table-header">Anomaly</th>
                </tr>
              </thead>
              <tbody>
                {records.map(r => (
                  <tr key={r.id} className={`border-b border-gray-50 hover:bg-gray-50 ${r.is_anomaly ? 'bg-red-50' : ''}`}>
                    <td className="table-cell font-medium truncate max-w-[150px]">{r.project_name}</td>
                    <td className="table-cell">{r.attendance_date}</td>
                    <td className="table-cell capitalize">{r.attendance_type}</td>
                    <td className="table-cell">{r.present_count}/{r.total_count}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-100 rounded h-1.5"><div className={`h-1.5 rounded ${r.attendance_percentage >= 75 ? 'bg-green-500' : r.attendance_percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${r.attendance_percentage}%` }} /></div>
                        <span>{r.attendance_percentage}%</span>
                      </div>
                    </td>
                    <td className="table-cell">
                      {r.is_anomaly ? <span className="badge badge-red">⚠ Anomaly</span> : <span className="text-gray-400">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Add Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Record Attendance">
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Project *</label>
              <select value={form.project_id} onChange={fc('project_id')} className="input-field">
                <option value="">Select Project</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input type="date" value={form.attendance_date} onChange={fc('attendance_date')} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
              <select value={form.attendance_type} onChange={fc('attendance_type')} className="input-field">
                <option value="staff">Staff</option>
                <option value="beneficiary">Beneficiary</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Count *</label>
              <input type="number" min="1" value={form.total_count} onChange={fc('total_count')} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Present Count *</label>
              <input type="number" min="0" value={form.present_count} onChange={fc('present_count')} className="input-field" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea value={form.notes} onChange={fc('notes')} rows={2} className="input-field" />
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Record'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

function SummaryCard({ label, value, color }) {
  const colors = { blue: 'bg-blue-50 text-blue-700', green: 'bg-green-50 text-green-700', yellow: 'bg-yellow-50 text-yellow-700', red: 'bg-red-50 text-red-700' }
  return (
    <div className={`rounded-xl p-4 ${colors[color]}`}>
      <div className="text-xs font-medium opacity-70 mb-1">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  )
}
