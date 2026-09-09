import React, { useEffect, useState, useCallback } from 'react'
import { usersAPI } from '../services/api'
import StatusBadge from '../components/StatusBadge'
import Modal from '../components/Modal'
import { PageLoader } from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import toast from 'react-hot-toast'
import { Users, Search, Edit2, Shield, ChevronLeft, ChevronRight } from 'lucide-react'

const ROLES = [
  { value: 'department_official', label: 'Department Official' },
  { value: 'inspection_officer', label: 'Inspection Officer' },
  { value: 'project_incharge', label: 'Project Incharge' },
  { value: 'ngo_staff', label: 'NGO Staff' },
  { value: 'district_authority', label: 'District Authority' },
  { value: 'beneficiary', label: 'Beneficiary' },
]

const ROLE_COLORS = {
  department_official: 'badge-blue',
  inspection_officer: 'badge-purple',
  project_incharge: 'badge-green',
  ngo_staff: 'badge-orange',
  district_authority: 'badge-yellow',
  beneficiary: 'badge-gray',
}

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [modal, setModal] = useState(false)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({ role:'', designation:'', is_active: true })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, per_page: 20, search }
      if (roleFilter) params.role = roleFilter
      const res = await usersAPI.getAll(params)
      setUsers(res.data.users)
      setTotal(res.data.total)
      setPages(res.data.pages)
    } catch { toast.error('Failed to load users') }
    finally { setLoading(false) }
  }, [page, search, roleFilter])

  useEffect(() => { load() }, [load])

  const handleEdit = async () => {
    setSaving(true)
    try {
      await usersAPI.update(selected.id, form)
      toast.success('User updated')
      setModal(false)
      load()
    } catch { toast.error('Update failed') }
    finally { setSaving(false) }
  }

  const openEdit = (u) => {
    setSelected(u)
    setForm({ role: u.role, designation: u.designation || '', is_active: u.is_active })
    setModal(true)
  }

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Shield className="w-5 h-5" />Users & Roles</h1>
          <p className="text-sm text-gray-500">{total} users registered</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Search name, email..." className="input-field pl-9" />
        </div>
        <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1) }} className="input-field w-auto">
          <option value="">All Roles</option>
          {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>

      {loading ? <PageLoader /> : users.length === 0 ? <EmptyState icon={Users} title="No users found" /> : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="table-header">User</th>
                <th className="table-header">Role</th>
                <th className="table-header">Location</th>
                <th className="table-header">Designation</th>
                <th className="table-header">Status</th>
                <th className="table-header">Last Login</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-700 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">{u.name?.[0]?.toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{u.name}</p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className={`badge ${ROLE_COLORS[u.role] || 'badge-gray'}`}>
                      {ROLES.find(r => r.value === u.role)?.label || u.role}
                    </span>
                  </td>
                  <td className="table-cell">{u.district ? `${u.district}, ${u.state}` : u.state || '—'}</td>
                  <td className="table-cell">{u.designation || '—'}</td>
                  <td className="table-cell"><StatusBadge status={u.is_active ? 'active' : 'inactive'} /></td>
                  <td className="table-cell">{u.last_login ? new Date(u.last_login).toLocaleDateString() : '—'}</td>
                  <td className="table-cell">
                    <button onClick={() => openEdit(u)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
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

      <Modal open={modal} onClose={() => setModal(false)} title={`Edit User: ${selected?.name}`}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="input-field">
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
            <input value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })} className="input-field" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="rounded" />
            <label htmlFor="is_active" className="text-sm text-gray-700">Active account</label>
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleEdit} disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
