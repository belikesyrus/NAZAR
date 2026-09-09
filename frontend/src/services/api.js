import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// Attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

// Handle 401 globally — redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getCompliance: () => api.get('/analytics/compliance'),
  getAnomalies: () => api.get('/analytics/anomalies'),
  getInspectionTrends: (days = 30) => api.get(`/analytics/inspection-trends?days=${days}`),
  getPerformance: () => api.get('/analytics/performance'),
  getAttendanceAnalytics: (params) => api.get('/attendance/analytics', { params }),
}

// ── Projects ──────────────────────────────────────────────────────────────────
export const projectsAPI = {
  getAll: (params) => api.get('/projects', { params }),
  getOne: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  getStats: () => api.get('/projects/stats'),
}

// ── Inspections ───────────────────────────────────────────────────────────────
export const inspectionsAPI = {
  getAll: (params) => api.get('/inspections', { params }),
  getOne: (id) => api.get(`/inspections/${id}`),
  create: (data) => api.post('/inspections', data),
  update: (id, data) => api.put(`/inspections/${id}`, data),
  assign: (id, data) => api.post(`/inspections/${id}/assign`, data),
  submit: (id, data) => api.post(`/inspections/${id}/submit`, data),
  approve: (id, data) => api.post(`/inspections/${id}/approve`, data),
  reject: (id, data) => api.post(`/inspections/${id}/reject`, data),
  autoAssign: (data) => api.post('/inspections/assign/auto', data),
  getChecklistTemplate: () => api.get('/inspections/checklist/template'),
}

// ── Evidence ──────────────────────────────────────────────────────────────────
export const evidenceAPI = {
  upload: (formData) => api.post('/evidence/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getByInspection: (inspectionId) => api.get(`/evidence/${inspectionId}`),
  delete: (id) => api.delete(`/evidence/${id}`),
  getFileUrl: (filename) => `${BASE_URL}/evidence/file/${filename}`,
}

// ── Attendance ────────────────────────────────────────────────────────────────
export const attendanceAPI = {
  getAll: (params) => api.get('/attendance', { params }),
  add: (data) => api.post('/attendance', data),
  getAnalytics: (params) => api.get('/attendance/analytics', { params }),
}

// ── Cameras ───────────────────────────────────────────────────────────────────
export const camerasAPI = {
  getAll: (params) => api.get('/cameras', { params }),
  getStats: () => api.get('/cameras/stats'),
  create: (data) => api.post('/cameras', data),
  update: (id, data) => api.put(`/cameras/${id}`, data),
  delete: (id) => api.delete(`/cameras/${id}`),
  getStatus: (id) => api.get(`/cameras/${id}/status`),
}

// ── Notifications & Alerts ────────────────────────────────────────────────────
export const notificationsAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  getAlerts: (params) => api.get('/notifications/alerts', { params }),
  markAlertRead: (id) => api.put(`/notifications/alerts/${id}/read`),
  resolveAlert: (id) => api.put(`/notifications/alerts/${id}/resolve`),
  getAlertStats: () => api.get('/notifications/alerts/stats'),
}

// ── Reports ───────────────────────────────────────────────────────────────────
export const reportsAPI = {
  getAll: (params) => api.get('/reports', { params }),
  getOne: (id) => api.get(`/reports/${id}`),
  approve: (id, data) => api.put(`/reports/${id}/approve`, data),
  reject: (id, data) => api.put(`/reports/${id}/reject`, data),
}

// ── Beneficiaries ─────────────────────────────────────────────────────────────
export const beneficiariesAPI = {
  getAll: (params) => api.get('/beneficiaries', { params }),
  getOne: (id) => api.get(`/beneficiaries/${id}`),
  add: (data) => api.post('/beneficiaries', data),
  getComplaints: (params) => api.get('/beneficiaries/complaints', { params }),
  submitComplaint: (data) => api.post('/beneficiaries/complaints', data),
  updateComplaint: (id, data) => api.put(`/beneficiaries/complaints/${id}`, data),
  getMeetings: (params) => api.get('/beneficiaries/meetings', { params }),
  createMeeting: (data) => api.post('/beneficiaries/meetings', data),
  startMeeting: (id) => api.post(`/beneficiaries/meetings/${id}/start`),
  endMeeting: (id) => api.post(`/beneficiaries/meetings/${id}/end`),
}

// ── Users ─────────────────────────────────────────────────────────────────────
export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getOne: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  getOfficers: () => api.get('/users/officers'),
  getStats: () => api.get('/users/stats'),
}

export default api
