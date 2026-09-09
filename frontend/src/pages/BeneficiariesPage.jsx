import React, { useEffect, useState, useCallback } from 'react'
import { beneficiariesAPI, projectsAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import StatusBadge from '../components/StatusBadge'
import Modal from '../components/Modal'
import { PageLoader } from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import toast from 'react-hot-toast'
import { Plus, Search, Users, ChevronLeft, ChevronRight } from 'lucide-react'

export default function BeneficiariesPage() {
  const { isAdmin } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [search, setSearch] = useState('')
  const [projectFilter, setProjectFilter] = useState('')
  const [projects, setProjects] = useState([])
  const [modal, setModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name:'', project_id:'', age:'', gender:'female', phone:'', address:'', service_status:'active', enrollment_date:'' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, per_page: 20, search }
      if (projectFilter) params.project_id = projectFilter
      const res = await beneficiariesAPI.getAll(params)
      setItems(res.data.beneficiaries)
      setTotal(res.data.total)
      setPages(res.data.pages)
    } catch { toast.error('Failed to load beneficiaries') }
    finally { setLoading(false) }
  }, [page, search, projectFilter])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    projectsAPI.getAll({ per_page: 100 }).then(r => setProjects(r.data.projects || [])).catch(() => {})
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.name || !form.project_id) { toast.error('Name and project are required'); return }
    setSaving(true)
    try {
      await beneficiariesAPI.add({ ...form, age: form.age ? parseInt(form.age) : null })
      toast.success('Beneficiary added')
      setModal(false)
      load()
    } catch (err) { toast.error(err.response?.data?.error || 'Save failed') }
    finally { setSaving(false) }
  }

  const fc = (f) => (e) => setForm({ ...form, [f]: e.target.value })

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Beneficiaries</h1>
          <p className="text-sm text-gray-500">{total} total records</p>
        </div>
        {isAdmin() && (
          <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />Add Beneficiary
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search by name..." className="input-field pl-9" />
        </div>
        <select value={projectFilter} onChange={e => { setProjectFilter(e.target.value); setPage(1) }} className="input-field w-auto">
          <option value="">All Projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {loading ? <PageLoader /> : items.length === 0 ? (
        <EmptyState icon={Users} title="No beneficiaries found" />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="table-header">ID</th>
                <th className="table-header">Name</th>
                <th className="table-header">Project</th>
                <th className="table-header">Age/Gender</th>
                <th className="table-header">Phone</th>
                <th className="table-header">Status</th>
                <th className="table-header">Enrolled</th>
              </tr>
            </thead>
            <tbody>
              {items.map(b => (
                <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="table-cell font-mono text-xs">{b.beneficiary_id}</td>
                  <td className="table-cell font-medium">{b.name}</td>
                  <td className="table-cell">{b.project_name}</td>
                  <td className="table-cell">{b.age ? `${b.age}y` : '—'} / {b.gender || '—'}</td>
                  <td className="table-cell">{b.phone || '—'}</td>
                  <td className="table-cell"><StatusBadge status={b.service_status} /></td>
                  <td className="table-cell">{b.enrollment_date || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn-secondary p-2 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
          <span className="text-sm text-gray-600">Page {page} of {pages}</span>
          <button disabled={page >= pages} onClick={() => setPage(p => p + 1)} className="btn-secondary p-2 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Add Beneficiary">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input value={form.name} onChange={fc('name')} className="input-field" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Project *</label>
              <select value={form.project_id} onChange={fc('project_id')} className="input-field">
                <option value="">Select Project</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
              <input type="number" value={form.age} onChange={fc('age')} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select value={form.gender} onChange={fc('gender')} className="input-field">
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input value={form.phone} onChange={fc('phone')} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Enrollment Date</label>
              <input type="date" value={form.enrollment_date} onChange={fc('enrollment_date')} className="input-field" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <textarea value={form.address} onChange={fc('address')} rows={2} className="input-field" />
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Add'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
