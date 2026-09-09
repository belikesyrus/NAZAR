import React, { useEffect, useState, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { inspectionsAPI, projectsAPI, usersAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import StatusBadge from '../components/StatusBadge'
import Modal from '../components/Modal'
import { PageLoader } from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import toast from 'react-hot-toast'
import { Plus, Search, ClipboardList, Eye, Zap, ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { format } from 'date-fns'

export default function InspectionsPage({ mine = false, type = '' }) {
  const { user, isAdmin, isOfficer } = useAuth()
  const [searchParams] = useSearchParams()
  const projectIdParam = searchParams.get('project_id')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modal, setModal] = useState(false)
  const [autoModal, setAutoModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [projects, setProjects] = useState([])
  const [officers, setOfficers] = useState([])
  const [autoResult, setAutoResult] = useState(null)
  const [form, setForm] = useState({ project_id:'', assigned_officer_id:'', inspection_type:'scheduled', priority:'medium', scheduled_date:'', assignment_reason:'' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, per_page: 15 }
      if (mine) params.assigned_to_me = true
      if (type) params.type = type
      if (statusFilter) params.status = statusFilter
      if (projectIdParam) params.project_id = projectIdParam
      const res = await inspectionsAPI.getAll(params)
      setItems(res.data.inspections)
      setTotal(res.data.total)
      setPages(res.data.pages)
    } catch { toast.error('Failed to load inspections') }
    finally { setLoading(false) }
  }, [page, mine, type, statusFilter, projectIdParam])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    projectsAPI.getAll({ per_page: 100 }).then(r => setProjects(r.data.projects || [])).catch(() => {})
    usersAPI.getOfficers().then(r => setOfficers(r.data.officers || [])).catch(() => {})
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.project_id) { toast.error('Project is required'); return }
    setSaving(true)
    try {
      await inspectionsAPI.create(form)
      toast.success('Inspection created')
      setModal(false)
      load()
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to create') }
    finally { setSaving(false) }
  }

  const handleAutoAssign = async () => {
    if (!form.project_id) { toast.error('Select a project first'); return }
    setSaving(true)
    try {
      const res = await inspectionsAPI.autoAssign({ project_id: parseInt(form.project_id) })
      setAutoResult(res.data)
      setForm(f => ({ ...f, assigned_officer_id: res.data.officer_id, assignment_reason: res.data.reason }))
      toast.success(`Auto-assigned to ${res.data.officer_name}`)
    } catch (err) { toast.error(err.response?.data?.error || 'Auto-assign failed') }
    finally { setSaving(false) }
  }

  const fc = (f) => (e) => setForm({ ...form, [f]: e.target.value })

  const title = mine ? 'Assigned To Me' : type === 'surprise' ? 'Surprise Inspections' : 'All Inspections'

  const statusColors = {
    assigned: 'border-l-blue-500',
    accepted: 'border-l-purple-500',
    in_progress: 'border-l-yellow-500',
    submitted: 'border-l-orange-500',
    approved: 'border-l-green-500',
    rejected: 'border-l-red-500',
  }

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-500">{total} total inspections</p>
        </div>
        {(isAdmin() || isOfficer()) && (
          <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />New Inspection
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }} className="input-field w-auto">
          <option value="">All Statuses</option>
          {['assigned','accepted','in_progress','submitted','under_review','approved','rejected'].map(s =>
            <option key={s} value={s}>{s.replace(/_/g,' ')}</option>
          )}
        </select>
      </div>

      {loading ? <PageLoader /> : items.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No inspections found"
          action={isAdmin() && <button onClick={() => setModal(true)} className="btn-primary">Create Inspection</button>} />
      ) : (
        <div className="space-y-3">
          {items.map(ins => (
            <Link key={ins.id} to={`/inspections/${ins.id}`}
              className={`card hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center gap-4 border-l-4 ${statusColors[ins.status] || 'border-l-gray-300'} py-4`}>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs text-gray-500">{ins.inspection_number}</span>
                  <StatusBadge status={ins.status} />
                  <StatusBadge status={ins.inspection_type} />
                  {ins.priority === 'high' && <span className="badge badge-red">High Priority</span>}
                  {ins.priority === 'critical' && <span className="badge bg-red-600 text-white">Critical</span>}
                </div>
                <p className="font-semibold text-gray-900 truncate">{ins.project_name}</p>
                <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                  <span>Officer: {ins.assigned_officer_name || 'Unassigned'}</span>
                  {ins.project_district && <span>📍 {ins.project_district}, {ins.project_state}</span>}
                  {ins.scheduled_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{format(new Date(ins.scheduled_date), 'dd MMM yyyy')}</span>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {ins.compliance_score != null && (
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">{ins.compliance_score}%</div>
                    <div className="text-xs text-gray-500">Compliance</div>
                  </div>
                )}
                <Eye className="w-4 h-4 text-gray-400" />
              </div>
            </Link>
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

      {/* Create Modal */}
      <Modal open={modal} onClose={() => { setModal(false); setAutoResult(null) }} title="Create Inspection" size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Project *</label>
              <select value={form.project_id} onChange={fc('project_id')} className="input-field">
                <option value="">Select Project</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select value={form.inspection_type} onChange={fc('inspection_type')} className="input-field">
                <option value="scheduled">Scheduled</option>
                <option value="surprise">Surprise</option>
                <option value="random">Random</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select value={form.priority} onChange={fc('priority')} className="input-field">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date</label>
              <input type="datetime-local" value={form.scheduled_date} onChange={fc('scheduled_date')} className="input-field" />
            </div>

            <div className="col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">Assign Officer</label>
                <button type="button" onClick={handleAutoAssign} disabled={!form.project_id || saving}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium disabled:opacity-40">
                  <Zap className="w-3 h-3" />Auto-Assign
                </button>
              </div>
              <select value={form.assigned_officer_id} onChange={fc('assigned_officer_id')} className="input-field">
                <option value="">Select Officer</option>
                {officers.map(o => <option key={o.id} value={o.id}>{o.name} — {o.district}</option>)}
              </select>
            </div>

            {autoResult && (
              <div className="col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-blue-700 mb-1">Auto-Assignment Result</p>
                <p className="text-xs text-blue-600">Officer: <strong>{autoResult.officer_name}</strong></p>
                <p className="text-xs text-blue-600">Score: {autoResult.score}</p>
                <p className="text-xs text-blue-600">Reason: {autoResult.reason}</p>
              </div>
            )}

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Assignment Reason</label>
              <textarea value={form.assignment_reason} onChange={fc('assignment_reason')} rows={2} className="input-field" placeholder="Reason for this inspection..." />
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Creating...' : 'Create Inspection'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
