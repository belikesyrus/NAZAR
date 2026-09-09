import React, { useEffect, useState, useCallback } from 'react'
import { beneficiariesAPI, projectsAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import StatusBadge from '../components/StatusBadge'
import Modal from '../components/Modal'
import { PageLoader } from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import toast from 'react-hot-toast'
import { Plus, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react'

export default function FeedbackPage() {
  const { user, isAdmin, isBeneficiary } = useAuth()
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modal, setModal] = useState(false)
  const [responseModal, setResponseModal] = useState(false)
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(false)
  const [projects, setProjects] = useState([])
  const [response, setResponse] = useState('')
  const [newStatus, setNewStatus] = useState('in_progress')
  const [form, setForm] = useState({ subject:'', description:'', complaint_type:'complaint', project_id:'', priority:'medium' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, per_page: 15 }
      if (typeFilter) params.type = typeFilter
      if (statusFilter) params.status = statusFilter
      const res = await beneficiariesAPI.getComplaints(params)
      setComplaints(res.data.complaints)
      setTotal(res.data.total)
      setPages(res.data.pages)
    } catch { toast.error('Failed to load complaints') }
    finally { setLoading(false) }
  }, [page, typeFilter, statusFilter])

  useEffect(() => { load() }, [load])
  useEffect(() => { projectsAPI.getAll({ per_page: 100 }).then(r => setProjects(r.data.projects || [])).catch(() => {}) }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.subject || !form.description) { toast.error('Subject and description required'); return }
    setSaving(true)
    try {
      await beneficiariesAPI.submitComplaint(form)
      toast.success('Complaint submitted successfully')
      setModal(false)
      load()
    } catch (err) { toast.error(err.response?.data?.error || 'Submit failed') }
    finally { setSaving(false) }
  }

  const handleResponse = async () => {
    setSaving(true)
    try {
      await beneficiariesAPI.updateComplaint(selected.id, { status: newStatus, department_response: response })
      toast.success('Response saved')
      setResponseModal(false)
      load()
    } catch { toast.error('Failed to update') }
    finally { setSaving(false) }
  }

  const fc = (f) => (e) => setForm({ ...form, [f]: e.target.value })

  const TYPE_BADGE = { complaint: 'badge-red', feedback: 'badge-green', suggestion: 'badge-blue' }

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Feedback & Complaints</h1>
          <p className="text-sm text-gray-500">{total} total records</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />Submit Feedback/Complaint
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1) }} className="input-field w-auto">
          <option value="">All Types</option>
          <option value="complaint">Complaints</option>
          <option value="feedback">Feedback</option>
          <option value="suggestion">Suggestions</option>
        </select>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }} className="input-field w-auto">
          <option value="">All Statuses</option>
          {['submitted','under_review','in_progress','resolved','closed'].map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
        </select>
      </div>

      {loading ? <PageLoader /> : complaints.length === 0 ? (
        <EmptyState icon={MessageSquare} title="No complaints found" />
      ) : (
        <div className="space-y-3">
          {complaints.map(c => (
            <div key={c.id} className="card hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-gray-900">{c.subject}</p>
                    <span className={`badge ${TYPE_BADGE[c.complaint_type] || 'badge-gray'} capitalize`}>{c.complaint_type}</span>
                    <StatusBadge status={c.status} />
                    <StatusBadge status={c.priority} />
                  </div>
                  <p className="text-sm text-gray-600">{c.description}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                    {c.project_name && <span>Project: {c.project_name}</span>}
                    <span>By: {c.submitted_by_name}</span>
                    <span>{c.created_at ? new Date(c.created_at).toLocaleDateString() : ''}</span>
                  </div>
                  {c.department_response && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-xs font-semibold text-blue-700 mb-0.5">Department Response:</p>
                      <p className="text-xs text-blue-600">{c.department_response}</p>
                    </div>
                  )}
                </div>
                {isAdmin() && c.status !== 'resolved' && c.status !== 'closed' && (
                  <button onClick={() => { setSelected(c); setResponse(c.department_response || ''); setNewStatus('in_progress'); setResponseModal(true) }}
                    className="btn-secondary text-xs flex-shrink-0">
                    Respond
                  </button>
                )}
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

      {/* Submit Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Submit Feedback / Complaint">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select value={form.complaint_type} onChange={fc('complaint_type')} className="input-field">
              <option value="complaint">Complaint</option>
              <option value="feedback">Feedback</option>
              <option value="suggestion">Suggestion</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
            <select value={form.project_id} onChange={fc('project_id')} className="input-field">
              <option value="">Select Project (optional)</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select value={form.priority} onChange={fc('priority')} className="input-field">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
            <input value={form.subject} onChange={fc('subject')} className="input-field" placeholder="Brief subject" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea value={form.description} onChange={fc('description')} rows={4} className="input-field" placeholder="Describe in detail..." />
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Submitting...' : 'Submit'}</button>
          </div>
        </form>
      </Modal>

      {/* Response Modal */}
      <Modal open={responseModal} onClose={() => setResponseModal(false)} title="Department Response">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Update Status</label>
            <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className="input-field">
              <option value="under_review">Under Review</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Response</label>
            <textarea value={response} onChange={e => setResponse(e.target.value)} rows={4} className="input-field" placeholder="Department response..." />
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setResponseModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleResponse} disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save Response'}</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
