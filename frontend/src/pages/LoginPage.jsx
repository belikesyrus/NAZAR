import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, Shield, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const DEMO_CREDENTIALS = [
  { role: 'Department Official', email: 'admin@dosje.gov.in', password: 'Admin@123' },
  { role: 'Inspection Officer', email: 'officer@dosje.gov.in', password: 'Officer@123' },
  { role: 'Project Incharge', email: 'incharge@project.in', password: 'Incharge@123' },
  { role: 'NGO Staff', email: 'staff@ngo.org', password: 'Staff@123' },
  { role: 'District Authority', email: 'district@gov.in', password: 'District@123' },
  { role: 'Beneficiary', email: 'beneficiary@example.com', password: 'Beneficiary@123' },
]

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) { setError('Email and password are required'); return }
    setLoading(true)
    try {
      await login(form.email, form.password)
      toast.success('Login successful!')
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = (cred) => {
    setForm({ email: cred.email, password: cred.password })
    setError('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl flex rounded-2xl overflow-hidden shadow-2xl">

        {/* Left panel */}
        <div className="hidden lg:flex lg:w-1/2 bg-blue-900 text-white flex-col justify-between p-10">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-orange-500 p-2 rounded-lg">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <div className="font-bold text-lg leading-tight">Smart Monitoring System</div>
                <div className="text-blue-300 text-sm">Ministry of Social Justice & Empowerment</div>
              </div>
            </div>
            <h2 className="text-3xl font-bold mb-4">Real-Time Monitoring & Inspection</h2>
            <p className="text-blue-200 text-sm leading-relaxed">
              Centralized platform for monitoring projects, institutes, and NGOs under DoSJE schemes.
              AI-powered anomaly detection, geo-tagged inspections, and live surveillance.
            </p>
          </div>
          <div className="space-y-3">
            <div className="text-xs font-semibold text-blue-300 uppercase tracking-wider mb-2">Quick Demo Access</div>
            {DEMO_CREDENTIALS.map((c) => (
              <button
                key={c.email}
                onClick={() => fillDemo(c)}
                className="w-full text-left flex items-center justify-between bg-blue-800 hover:bg-blue-700 rounded-lg px-3 py-2 transition-colors"
              >
                <span className="text-sm font-medium">{c.role}</span>
                <span className="text-xs text-blue-300">{c.email}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className="w-full lg:w-1/2 bg-white flex flex-col justify-center p-8 lg:p-12">
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="bg-blue-700 p-2 rounded-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div className="font-bold text-gray-900">Smart Monitoring System</div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h1>
          <p className="text-gray-500 text-sm mb-8">Sign in to your DoSJE account</p>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-6 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email" name="email" value={form.email}
                onChange={handleChange} autoComplete="email"
                placeholder="your@email.gov.in"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password" value={form.password}
                  onChange={handleChange} autoComplete="current-password"
                  placeholder="Enter password"
                  className="input-field pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-700 font-medium hover:underline">Register</Link>
          </p>

          {/* Mobile demo credentials */}
          <div className="mt-8 lg:hidden">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Demo Credentials</div>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_CREDENTIALS.map((c) => (
                <button key={c.email} onClick={() => fillDemo(c)}
                  className="text-left bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 transition-colors">
                  <div className="text-xs font-medium text-gray-700">{c.role}</div>
                  <div className="text-xs text-gray-400 truncate">{c.email}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
