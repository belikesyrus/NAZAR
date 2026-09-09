import React, { useEffect, useState, useCallback } from 'react'
import { camerasAPI, projectsAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import StatusBadge from '../components/StatusBadge'
import Modal from '../components/Modal'
import { PageLoader } from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import StatCard from '../components/StatCard'
import toast from 'react-hot-toast'
import { Camera, Plus, Activity, WifiOff, Wifi, Edit2, Trash2, Play } from 'lucide-react'

export default function CCTVPage() {
  const { isAdmin } = useAuth()
  const [cameras, setCameras] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState([])
  const [modal, setModal] = useState(false)
  const [viewModal, setViewModal] = useState(false)
  const [selectedCam, setSelectedCam] = useState(null)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [filterProject, setFilterProject] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [form, setForm] = useState({ name:'', project_id:'', location_description:'', camera_type:'fixed', status:'online', ip_address:'', resolution:'1080p', manufacturer:'', model_number:'', installation_date:'' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (filterProject) params.project_id = filterProject
      if (filterStatus) params.status = filterStatus
      const [camRes, statRes] = await Promise.all([camerasAPI.getAll(params), camerasAPI.getStats()])
      setCameras(camRes.data.cameras)
      setStats(statRes.data)
    } catch { toast.error('Failed to load cameras') }
    finally { setLoading(false) }
  }, [filterProject, filterStatus])

  useEffect(() => { load() }, [load])
  useEffect(() => { projectsAPI.getAll({ per_page: 100 }).then(r => setProjects(r.data.projects || [])).catch(() => {}) }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.name || !form.project_id) { toast.error('Name and project required'); return }
    setSaving(true)
    try {
      if (editing) { await camerasAPI.update(editing.id, form); toast.success('Camera updated') }
      else { await camerasAPI.create(form); toast.success('Camera registered') }
      setModal(false)
      load()
    } catch { toast.error('Save failed') }
    finally { setSaving(false) }
  }

  const handleDelete = async (cam) => {
    if (!window.confirm(`Remove camera "${cam.name}"?`)) return
    try { await camerasAPI.delete(cam.id); toast.success('Camera removed'); load() }
    catch { toast.error('Delete failed') }
  }

  const openEdit = (cam) => {
    setEditing(cam)
    setForm({ name: cam.name, project_id: cam.project_id, location_description: cam.location_description || '', camera_type: cam.camera_type, status: cam.status, ip_address: cam.ip_address || '', resolution: cam.resolution || '1080p', manufacturer: cam.manufacturer || '', model_number: cam.model_number || '', installation_date: cam.installation_date || '' })
    setModal(true)
  }

  const fc = (f) => (e) => setForm({ ...form, [f]: e.target.value })

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">CCTV Surveillance</h1>
          <p className="text-sm text-gray-500">Manage and monitor all registered cameras</p>
        </div>
        {isAdmin() && (
          <button onClick={() => { setEditing(null); setForm({ name:'', project_id:'', location_description:'', camera_type:'fixed', status:'online', ip_address:'', resolution:'1080p', manufacturer:'', model_number:'', installation_date:'' }); setModal(true) }}
            className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" />Register Camera</button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard title="Total Cameras" value={stats.total} icon={Camera} color="blue" />
        <StatCard title="Online" value={stats.online} icon={Wifi} color="green" />
        <StatCard title="Offline" value={stats.offline} icon={WifiOff} color="red" />
        <StatCard title="Maintenance" value={stats.maintenance} icon={Activity} color="yellow" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={filterProject} onChange={e => setFilterProject(e.target.value)} className="input-field w-auto">
          <option value="">All Projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input-field w-auto">
          <option value="">All Status</option>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
          <option value="maintenance">Maintenance</option>
        </select>
      </div>

      {/* Camera grid */}
      {loading ? <PageLoader /> : cameras.length === 0 ? (
        <EmptyState icon={Camera} title="No cameras registered"
          action={isAdmin() && <button onClick={() => setModal(true)} className="btn-primary">Register Camera</button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {cameras.map(cam => (
            <div key={cam.id} className="card hover:shadow-md transition-shadow flex flex-col gap-3">
              {/* Mock feed area */}
              <div className="bg-gray-900 rounded-xl aspect-video flex items-center justify-center relative overflow-hidden">
                {cam.status === 'online' ? (
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-2 animate-pulse">
                      <Camera className="w-6 h-6 text-green-400" />
                    </div>
                    <p className="text-green-400 text-xs font-medium">LIVE</p>
                    <p className="text-gray-400 text-xs mt-1">Demo Feed Active</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <WifiOff className="w-8 h-8 text-red-400 mx-auto mb-2" />
                    <p className="text-red-400 text-xs font-medium">OFFLINE</p>
                  </div>
                )}
                <div className={`absolute top-2 right-2 w-2.5 h-2.5 rounded-full ${cam.status === 'online' ? 'bg-green-400 animate-pulse' : cam.status === 'offline' ? 'bg-red-500' : 'bg-yellow-400'}`} />
                {cam.status === 'online' && (
                  <button onClick={() => { setSelectedCam(cam); setViewModal(true) }}
                    className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/30 transition-colors group">
                    <Play className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                )}
              </div>

              <div>
                <p className="font-semibold text-gray-900 text-sm">{cam.name}</p>
                <p className="text-xs text-gray-500">{cam.project_name}</p>
              </div>

              <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                <span>{cam.camera_type}</span>
                {cam.resolution && <span>· {cam.resolution}</span>}
                {cam.location_description && <span>· {cam.location_description}</span>}
              </div>

              <div className="flex items-center justify-between">
                <StatusBadge status={cam.status} />
                <div className="flex gap-1">
                  {isAdmin() && (
                    <>
                      <button onClick={() => openEdit(cam)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(cam)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                    </>
                  )}
                </div>
              </div>

              <p className="text-xs text-gray-400">Last active: {cam.last_active ? new Date(cam.last_active).toLocaleString() : '—'}</p>
            </div>
          ))}
        </div>
      )}

      {/* View Modal */}
      <Modal open={viewModal} onClose={() => setViewModal(false)} title={selectedCam?.name || 'Camera Feed'} size="xl">
        <div className="space-y-4">
          <div className="bg-gray-900 rounded-xl aspect-video flex items-center justify-center">
            <div className="text-center">
              <Camera className="w-16 h-16 text-green-400 mx-auto mb-3 animate-pulse" />
              <p className="text-green-400 font-semibold">DEMO LIVE FEED</p>
              <p className="text-gray-400 text-sm mt-2">{selectedCam?.camera_id}</p>
              <p className="text-gray-500 text-xs mt-2">
                Real RTSP/HLS stream integration ready.<br />
                Configure stream_url in backend camera settings.
              </p>
            </div>
          </div>
          {selectedCam && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div><p className="text-xs text-gray-500">Camera ID</p><p className="font-medium">{selectedCam.camera_id}</p></div>
              <div><p className="text-xs text-gray-500">Type</p><p className="font-medium capitalize">{selectedCam.camera_type}</p></div>
              <div><p className="text-xs text-gray-500">Resolution</p><p className="font-medium">{selectedCam.resolution || '—'}</p></div>
              <div><p className="text-xs text-gray-500">Location</p><p className="font-medium">{selectedCam.location_description || '—'}</p></div>
            </div>
          )}
        </div>
      </Modal>

      {/* Create/Edit Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Camera' : 'Register Camera'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Camera Name *</label>
              <input value={form.name} onChange={fc('name')} className="input-field" placeholder="e.g. Main Entrance Camera" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Project *</label>
              <select value={form.project_id} onChange={fc('project_id')} className="input-field">
                <option value="">Select Project</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select value={form.camera_type} onChange={fc('camera_type')} className="input-field">
                <option value="fixed">Fixed</option>
                <option value="ptz">PTZ</option>
                <option value="dome">Dome</option>
                <option value="bullet">Bullet</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={form.status} onChange={fc('status')} className="input-field">
                <option value="online">Online</option>
                <option value="offline">Offline</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">IP Address</label><input value={form.ip_address} onChange={fc('ip_address')} className="input-field" placeholder="192.168.1.100" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Resolution</label><input value={form.resolution} onChange={fc('resolution')} className="input-field" placeholder="1080p" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label><input value={form.manufacturer} onChange={fc('manufacturer')} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Model</label><input value={form.model_number} onChange={fc('model_number')} className="input-field" /></div>
            <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Location Description</label><input value={form.location_description} onChange={fc('location_description')} className="input-field" placeholder="e.g. Main gate, Hall, Office entrance" /></div>
            <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Installation Date</label><input type="date" value={form.installation_date} onChange={fc('installation_date')} className="input-field" /></div>
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : editing ? 'Update' : 'Register'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
