import React from 'react'

const STATUS_STYLES = {
  // Inspection statuses
  assigned: 'badge-blue',
  accepted: 'badge-purple',
  in_progress: 'badge-yellow',
  submitted: 'badge-orange',
  under_review: 'badge-orange',
  approved: 'badge-green',
  rejected: 'badge-red',
  pending: 'badge-gray',
  // Project statuses
  active: 'badge-green',
  inactive: 'badge-gray',
  suspended: 'badge-red',
  completed: 'badge-blue',
  // Alert severities
  low: 'badge-blue',
  medium: 'badge-yellow',
  high: 'badge-red',
  critical: 'bg-red-600 text-white px-2.5 py-0.5 rounded-full text-xs font-semibold',
  // Camera
  online: 'badge-green',
  offline: 'badge-red',
  maintenance: 'badge-yellow',
  // Complaint
  resolved: 'badge-green',
  closed: 'badge-gray',
  // Meetings
  scheduled: 'badge-blue',
  'in_progress': 'badge-yellow',
  cancelled: 'badge-red',
}

export default function StatusBadge({ status }) {
  if (!status) return null
  const cls = STATUS_STYLES[status] || 'badge-gray'
  const label = status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  return <span className={`badge ${cls}`}>{label}</span>
}
