import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { authAPI } from '../services/api'
import toast from 'react-hot-toast'
import { User, Lock, Bell, Info, Save } from 'lucide-react'

const STATES = ['Andhra Pradesh','Bihar','Delhi','Gujarat','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Punjab','Rajasthan','Tamil Nadu','Telangana','Uttar Pradesh','West Bengal']

export default function SettingsPage() {
  const { user, updateUser } = useAuth()
  const [tab, setTab] = useState('profile')
  const [profile, setProfile] = useState({ name: user?.name || '', phone: user?.phone || '', state: user?.state || '', district: user?.district || '', designation: user?.designation || '' })
  const [passwords, setPasswords] = useState({ current_password: '', new_password: '', confirm: '' })
  const [saving, setSaving] = useState(false)

  const saveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await authAPI.updateProfile(profile)
      updateUser(res.data.user)
      toast.success('Profile updated')
    } catch (err) { toast.error(err.response?.data?.error || 'Update failed') }
    finally { setSaving(false) }
  }

  const savePassword = async (e) => {
    e.preventDefault()
    if (passwords.new_password !== passwords.confirm) { toast.error('Passwords do not match'); return }
    if (passwords.new_password.length < 6) { toast.error('Password must be at least 6 characters'); return }
    setSaving(true)
    try {
      await authAPI.updateProfile({ current_password: passwords.current_password, new_password: passwords.new_password })
      toast.success('Password changed')
      setPasswords({ current_password: '', new_password: '', confirm: '' })
    } catch (err) { toast.error(err.response?.data?.error || 'Password change failed') }
    finally { setSaving(false) }
  }

  const fp = (f) => (e) => setProfile({ ...profile, [f]: e.target.value })
  const pw = (f) => (e) => setPasswords({ ...passwords, [f]: e.target.value })

  const TABS = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'about', label: 'About', icon: Info },
  ]

  const ROLE_LABELS = { department_official:'Department Official', inspection_officer:'Inspection Officer', project_incharge:'Project Incharge', ngo_staff:'NGO Staff', district_authority:'District Authority', beneficiary:'Beneficiary' }

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto space-y-5">
      <h1 className="text-xl font-bold text-gray-900">Settings</h1>

      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.id ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <t.icon className="w-4 h-4" />{t.label}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="card">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-blue-700 rounded-full flex items-center justify-center">
              <span className="text-white text-2xl font-bold">{user?.name?.[0]?.toUpperCase()}</span>
            </div>
            <div>
              <p className="font-bold text-gray-900 text-lg">{user?.name}</p>
              <p className="text-gray-500 text-sm">{user?.email}</p>
              <span className="badge badge-blue mt-1">{ROLE_LABELS[user?.role] || user?.role}</span>
            </div>
          </div>
          <form onSubmit={saveProfile} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input value={profile.name} onChange={fp('name')} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input value={profile.phone} onChange={fp('phone')} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                <input value={profile.designation} onChange={fp('designation')} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <select value={profile.state} onChange={fp('state')} className="input-field">
                  <option value="">Select State</option>
                  {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                <input value={profile.district} onChange={fp('district')} className="input-field" />
              </div>
            </div>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              <Save className="w-4 h-4" />{saving ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </div>
      )}

      {tab === 'security' && (
        <div className="card">
          <h3 className="section-title">Change Password</h3>
          <form onSubmit={savePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <input type="password" value={passwords.current_password} onChange={pw('current_password')} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input type="password" value={passwords.new_password} onChange={pw('new_password')} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input type="password" value={passwords.confirm} onChange={pw('confirm')} className="input-field" />
            </div>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              <Lock className="w-4 h-4" />{saving ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      )}

      {tab === 'about' && (
        <div className="card space-y-4">
          <h3 className="section-title">About This System</h3>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex justify-between py-2 border-b"><span className="text-gray-500">System</span><span className="font-medium">Smart Monitoring System</span></div>
            <div className="flex justify-between py-2 border-b"><span className="text-gray-500">Department</span><span className="font-medium">DoSJE — Ministry of SJ&E</span></div>
            <div className="flex justify-between py-2 border-b"><span className="text-gray-500">Version</span><span className="font-medium">1.0.0</span></div>
            <div className="flex justify-between py-2 border-b"><span className="text-gray-500">Frontend</span><span className="font-medium">React 18 + Vite + Tailwind</span></div>
            <div className="flex justify-between py-2 border-b"><span className="text-gray-500">Backend</span><span className="font-medium">Python Flask + SQLAlchemy</span></div>
            <div className="flex justify-between py-2 border-b"><span className="text-gray-500">Maps</span><span className="font-medium">Leaflet + OpenStreetMap</span></div>
            <div className="flex justify-between py-2"><span className="text-gray-500">AI Mode</span><span className="font-medium">Rule-based (ML-ready)</span></div>
          </div>
        </div>
      )}
    </div>
  )
}
