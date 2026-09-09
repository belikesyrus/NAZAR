import React, { useEffect, useState } from 'react'
import { beneficiariesAPI, projectsAPI } from '../services/api'
import StatusBadge from '../components/StatusBadge'
import Modal from '../components/Modal'
import { PageLoader } from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import toast from 'react-hot-toast'
import { Video, Plus, Play, Square, Users, ExternalLink } from 'lucide-react'

export default function VideoConferencingPage() {
  const [meetings, setMeetings] = useState([])
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState([])
  const [modal, setModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ project_id:'', title:'', meeting_type:'random_vc' })

  const load = async () => {
    setLoading(true)
    try {
      const res = await beneficiariesAPI.getMeetings()
      setMeetings(res.data.meetings)
    } catch { toast.error('Failed to load meetings') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])
  useEffect(() => { projectsAPI.getAll({ per_page: 100 }).then(r => setProjects(r.data.projects || [])).catch(() => {}) }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.project_id) { toast.error('Select a project'); return }
    setSaving(true)
    try {
      await beneficiariesAPI.createMeeting(form)
      toast.success('Meeting created')
      setModal(false)
      load()
    } catch { toast.error('Failed to create meeting') }
    finally { setSaving(false) }
  }

  const startMeeting = async (id) => {
    try { await beneficiariesAPI.startMeeting(id); toast.success('Meeting started'); load() } catch {}
  }
  const endMeeting = async (id) => {
    try { await beneficiariesAPI.endMeeting(id); toast.success('Meeting ended'); load() } catch {}
  }

  const fc = (f) => (e) => setForm({ ...form, [f]: e.target.value })

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Video Conferencing</h1>
          <p className="text-sm text-gray-500">Random VC inspection sessions</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />New Meeting
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
        <p className="font-semibold mb-1">Demo Mode — Jitsi Integration Ready</p>
        <p>Meetings use Jitsi (meet.jit.si) in demo mode. Configure your own Jitsi server or JaaS in <code className="bg-blue-100 px-1 rounded">.env</code> to enable production VC.</p>
      </div>

      {loading ? <PageLoader /> : meetings.length === 0 ? (
        <EmptyState icon={Video} title="No meetings yet" action={<button onClick={() => setModal(true)} className="btn-primary">Start Meeting</button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {meetings.map(m => (
            <div key={m.id} className="card flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{m.title}</p>
                  <p className="text-xs text-gray-500">{m.project_name}</p>
                </div>
                <StatusBadge status={m.status} />
              </div>
              <div className="text-xs text-gray-500 space-y-0.5">
                <div>Created: {m.created_at ? new Date(m.created_at).toLocaleString() : '—'}</div>
                {m.duration_minutes && <div>Duration: {m.duration_minutes} min</div>}
                <div className="font-mono truncate">Room: {m.room_name}</div>
              </div>
              <div className="flex gap-2">
                {m.status === 'scheduled' && (
                  <button onClick={() => startMeeting(m.id)} className="flex-1 btn-primary text-xs flex items-center justify-center gap-1 py-2">
                    <Play className="w-3 h-3" />Start
                  </button>
                )}
                {m.status === 'in_progress' && (
                  <>
                    <a href={m.join_url} target="_blank" rel="noreferrer"
                      className="flex-1 btn-primary text-xs flex items-center justify-center gap-1 py-2">
                      <ExternalLink className="w-3 h-3" />Join
                    </a>
                    <button onClick={() => endMeeting(m.id)} className="btn-danger text-xs flex items-center gap-1 py-2 px-3">
                      <Square className="w-3 h-3" />End
                    </button>
                  </>
                )}
                {m.status === 'completed' && (
                  <span className="text-xs text-green-600 font-medium">✓ Completed</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Create Meeting">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project *</label>
            <select value={form.project_id} onChange={fc('project_id')} className="input-field">
              <option value="">Select Project</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Title</label>
            <input value={form.title} onChange={fc('title')} className="input-field" placeholder="e.g. Random VC Inspection" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select value={form.meeting_type} onChange={fc('meeting_type')} className="input-field">
              <option value="random_vc">Random VC Inspection</option>
              <option value="scheduled">Scheduled Meeting</option>
            </select>
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Creating...' : 'Create'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
