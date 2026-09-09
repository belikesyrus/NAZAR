import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { projectsAPI, usersAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import StatusBadge from '../components/StatusBadge'
import Modal from '../components/Modal'
import { PageLoader } from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import toast from 'react-hot-toast'
import {
  Plus, Search, Filter, MapPin, Users, Building2,
  FolderKanban, Edit2, Trash2, Eye, ChevronLeft, ChevronRight
} from 'lucide-react'

const STATES = ['Andhra Pradesh','Bihar','Delhi','Gujarat','Karnataka','Kerala',
  'Madhya Pradesh','Maharashtra','Punjab','Rajasthan','Tamil Nadu','Telangana','Uttar Pradesh','West Bengal']

const SCHEMES = ['ICDS','Swadhar Greh','PMKVY','IGNOAPS','National Creche Scheme','OneStopCentre','PM-USHA','NMEW']

const EMPTY_FORM = {
  name:'', organization_name:'', project_type:'project', scheme:'', state:'',
  district:'', address:'', latitude:'', longitude:'', contact_name:'', contact_phone:'',
  contact_email:'', beneficiary_count:'', staff_count:'', status:'active',
  registration_date:'', incharge_id:''
}

export default function ProjectsPage({ type = 'all' }) {
  const { isAdmin } = useAuth()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [search, setSearch] = useState('')
  const [filterState, setFilterState] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [officers, setOfficers] = useState([])

  const typeLabel = type === 'institute' ? 'Institutes' : type === 'ngo' ? 'NGOs' : 'Projects'
  const typeIcon = type === 'institute' ? Building2 : type === 'ngo' ? Building2 : FolderKanban

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, per_page: 12, search }
      if (type !== 'all') params.type = type
      if (filterState) params.state = filterState
      if (filterStatus) params.status = filterStatus
      const res = await projectsAPI.getAll(params)
      setProjects(res.data.projects)
      setTotal(res.data.total)
      setPages(res.data.pages)
    } catch { toast.error('Failed to load projects') }
    finally { setLoading(false) }
  }, [page, search, type, filterState, filterStatus])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    usersAPI.getOfficers().then(r => setOfficers(r.data.officers || [])).catch(() => {})
  }, [])

  const openCreate = () => {
    setEditing(null)
    setForm({ ...EMPTY_FORM, project_type: type === 'all' ? 'project' : type })
    setModal(true)
  }

  const openEdit = (p) => {
    setEditing(p)
    setForm({
      name: p.name, organization_name: p.organization_name || '',
      project_type: p.project_type, scheme: p.scheme || '',
      state: p.state || '', district: p.district || '',
      address: p.address || '', latitude: p.latitude || '',
      longitude: p.longitude || '', contact_name: p.contact_name || '',
      contact_phone: p.contact_phone || '', contact_email: p.contact_email || '',
      beneficiary_count: p.beneficiary_count || '', staff_count: p.staff_count || '',
      status: p.status, registration_date: p.registration_date || '',
      incharge_id: p.incharge_id || ''
    })
    setModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.name) { toast.error('Project name is required'); return }
    setSaving(true)
    try {
      const payload = { ...form, latitude: form.latitude ? parseFloat(form.latitude) : null, longitude: form.longitude ? parseFloat(form.longitude) : null }
      if (editing) { await projectsAPI.update(editing.id, payload); toast.success('Project updated') }
      else { await projectsAPI.create(payload); toast.success('Project created') }
      setModal(false)
      load()
    } catch (err) { toast.error(err.response?.data?.error || 'Save failed') }
    finally { setSaving(false) }
  }

  const handleDelete = async (p) => {
    if (!window.confirm(`Deactivate "${p.name}"?`)) return
    try { await projectsAPI.delete(p.id); toast.success('Project deactivated'); load() }
    catch { toast.error('Failed to deactivate') }
  }

  const fc = (f) => (e) => setForm({ ...form, [f]: e.target.value })

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{typeLabel}</h1>
          <p className="text-sm text-gray-500">{total} total records</p>
        </div>
        {isAdmin() && (
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />Add {type === 'all' ? 'Project' : typeLabel.slice(0,-1)}
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search name, ID..." className="input-field pl-9" />
        </div>
        <select value={filterState} onChange={e => { setFilterState(e.target.value); setPage(1) }} className="input-field w-auto">
          <option value="">All States</option>
          {STATES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1) }} className="input-field w-auto">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Grid */}
      {loading ? <PageLoader /> : projects.length === 0 ? (
        <EmptyState icon={typeIcon} title={`No ${typeLabel} found`}
          desc="Try adjusting your filters or add a new record."
          action={isAdmin() && <button onClick={openCreate} className="btn-primary">Add {typeLabel.slice(0,-1)}</button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map(p => (
            <div key={p.id} className="card hover:shadow-md transition-shadow flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{p.name}</p>
                  <p className="text-xs text-gray-500 truncate">{p.organization_name}</p>
                </div>
                <StatusBadge status={p.status} />
              </div>

              <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{p.district}, {p.state}</span>
                <span className="flex items-center gap-1"><Users className="w-3 h-3" />{p.beneficiary_count} beneficiaries</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="badge badge-blue">{p.scheme || 'No scheme'}</span>
                <span className="badge badge-gray capitalize">{p.project_type}</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${Math.min(p.compliance_score || 0, 100)}%` }} />
                </div>
                <span className="text-xs font-medium text-gray-700">{p.compliance_score?.toFixed(0) || 0}%</span>
              </div>

              <div className="flex gap-2 pt-1">
                <Link to={`/inspections?project_id=${p.id}`}
                  className="flex-1 btn-secondary text-xs flex items-center justify-center gap-1 py-1.5">
                  <Eye className="w-3 h-3" />Inspections
                </Link>
                {isAdmin() && <>
                  <button onClick={() => openEdit(p)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(p)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn-secondary p-2 disabled:opacity-40">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-600">Page {page} of {pages}</span>
          <button disabled={page >= pages} onClick={() => setPage(p => p + 1)} className="btn-secondary p-2 disabled:opacity-40">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Project' : `Add ${typeLabel.slice(0,-1)}`} size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Project Name *</label>
              <input value={form.name} onChange={fc('name')} className="input-field" placeholder="Full project name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
              <input value={form.organization_name} onChange={fc('organization_name')} className="input-field" placeholder="Org name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select value={form.project_type} onChange={fc('project_type')} className="input-field">
                <option value="project">Project</option>
                <option value="institute">Institute</option>
                <option value="ngo">NGO</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Scheme</label>
              <select value={form.scheme} onChange={fc('scheme')} className="input-field">
                <option value="">Select Scheme</option>
                {SCHEMES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={form.status} onChange={fc('status')} className="input-field">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <select value={form.state} onChange={fc('state')} className="input-field">
                <option value="">Select State</option>
                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
              <input value={form.district} onChange={fc('district')} className="input-field" placeholder="District" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <textarea value={form.address} onChange={fc('address')} rows={2} className="input-field" placeholder="Full address" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
              <input type="number" step="any" value={form.latitude} onChange={fc('latitude')} className="input-field" placeholder="e.g. 28.6139" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
              <input type="number" step="any" value={form.longitude} onChange={fc('longitude')} className="input-field" placeholder="e.g. 77.2090" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Beneficiary Count</label>
              <input type="number" value={form.beneficiary_count} onChange={fc('beneficiary_count')} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Staff Count</label>
              <input type="number" value={form.staff_count} onChange={fc('staff_count')} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
              <input value={form.contact_name} onChange={fc('contact_name')} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
              <input value={form.contact_phone} onChange={fc('contact_phone')} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
              <input type="email" value={form.contact_email} onChange={fc('contact_email')} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Registration Date</label>
              <input type="date" value={form.registration_date} onChange={fc('registration_date')} className="input-field" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Project Incharge</label>
              <select value={form.incharge_id} onChange={fc('incharge_id')} className="input-field">
                <option value="">Select Incharge</option>
                {officers.map(o => <option key={o.id} value={o.id}>{o.name} — {o.designation}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
