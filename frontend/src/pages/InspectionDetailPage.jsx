import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { inspectionsAPI, usersAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import StatusBadge from '../components/StatusBadge'
import Modal from '../components/Modal'
import { PageLoader } from '../components/LoadingSpinner'
import toast from 'react-hot-toast'
import { ArrowLeft, MapPin, User, Calendar, ClipboardList, FileText, CheckCircle, XCircle, Zap, Eye } from 'lucide-react'
import { format } from 'date-fns'

export default function InspectionDetailPage() {
  const { id } = useParams()
  const { user, isAdmin, isOfficer } = useAuth()
  const navigate = useNavigate()
  const [inspection, setInspection] = useState(null)
  const [loading, setLoading] = useState(true)
  const [officers, setOfficers] = useState([])
  const [assignModal, setAssignModal] = useState(false)
  const [reviewModal, setReviewModal] = useState(false)
  const [assignOfficer, setAssignOfficer] = useState('')
  const [reviewAction, setReviewAction] = useState('approve')
  const [reviewComment, setReviewComment] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    try {
      const res = await inspectionsAPI.getOne(id)
      setInspection(res.data.inspection)
    } catch { toast.error('Failed to load inspection') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [id])
  useEffect(() => { usersAPI.getOfficers().then(r => setOfficers(r.data.officers || [])).catch(() => {}) }, [])

  const handleAssign = async () => {
    if (!assignOfficer) { toast.error('Select an officer'); return }
    setSaving(true)
    try {
      await inspectionsAPI.assign(id, { officer_id: parseInt(assignOfficer) })
      toast.success('Officer assigned')
      setAssignModal(false)
      load()
    } catch { toast.error('Assignment failed') }
    finally { setSaving(false) }
  }

  const handleReview = async () => {
    setSaving(true)
    try {
      if (reviewAction === 'approve') await inspectionsAPI.approve(id, { comments: reviewComment })
      else await inspectionsAPI.reject(id, { comments: reviewComment })
      toast.success(`Inspection ${reviewAction}d`)
      setReviewModal(false)
      load()
    } catch { toast.error('Review failed') }
    finally { setSaving(false) }
  }

  if (loading) return <PageLoader />
  if (!inspection) return <div className="p-6 text-center text-gray-500">Inspection not found</div>

  const canSubmit = isOfficer() && inspection.assigned_officer_id === user?.id && ['assigned','accepted','in_progress'].includes(inspection.status)
  const canReview = isAdmin() && inspection.status === 'submitted'
  const canAssign = isAdmin() && !inspection.assigned_officer_id

  const yesCount = inspection.checklist?.filter(c => c.response === 'yes').length || 0
  const totalApplicable = inspection.checklist?.filter(c => c.response !== 'not_applicable' && c.response !== 'not_checked').length || 0

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-4xl mx-auto">
      {/* Back + header */}
      <div className="flex items-start gap-3">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 flex-shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-gray-900">{inspection.inspection_number}</h1>
            <StatusBadge status={inspection.status} />
            <StatusBadge status={inspection.inspection_type} />
          </div>
          <p className="text-gray-600 font-medium">{inspection.project_name}</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {canSubmit && (
            <Link to={`/inspections/${id}/submit`} className="btn-primary flex items-center gap-2 text-sm">
              <ClipboardList className="w-4 h-4" />Submit Report
            </Link>
          )}
          {canAssign && (
            <button onClick={() => setAssignModal(true)} className="btn-secondary flex items-center gap-2 text-sm">
              <Zap className="w-4 h-4" />Assign Officer
            </button>
          )}
          {canReview && (
            <button onClick={() => setReviewModal(true)} className="btn-primary flex items-center gap-2 text-sm">
              <Eye className="w-4 h-4" />Review Report
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Details */}
        <div className="card space-y-3">
          <h3 className="section-title">Inspection Details</h3>
          <DetailRow icon={User} label="Assigned Officer" value={inspection.assigned_officer_name || 'Not assigned'} />
          <DetailRow icon={User} label="Created By" value={inspection.created_by_name} />
          <DetailRow icon={Calendar} label="Scheduled" value={inspection.scheduled_date ? format(new Date(inspection.scheduled_date), 'dd MMM yyyy HH:mm') : '—'} />
          <DetailRow icon={Calendar} label="Started" value={inspection.started_at ? format(new Date(inspection.started_at), 'dd MMM yyyy HH:mm') : '—'} />
          <DetailRow icon={Calendar} label="Submitted" value={inspection.submitted_at ? format(new Date(inspection.submitted_at), 'dd MMM yyyy HH:mm') : '—'} />
          {inspection.compliance_score != null && (
            <div className="flex items-center gap-3 pt-2">
              <span className="text-sm text-gray-600">Compliance Score</span>
              <div className="flex-1 bg-gray-100 rounded-full h-3">
                <div className="bg-blue-600 h-3 rounded-full" style={{ width: `${inspection.compliance_score}%` }} />
              </div>
              <span className="font-bold text-gray-900">{inspection.compliance_score}%</span>
            </div>
          )}
        </div>

        {/* Location */}
        <div className="card space-y-3">
          <h3 className="section-title">Location Info</h3>
          <DetailRow icon={MapPin} label="Project Location" value={`${inspection.project_district || '—'}, ${inspection.project_state || '—'}`} />
          {inspection.project_latitude && (
            <DetailRow icon={MapPin} label="Project Coords" value={`${inspection.project_latitude?.toFixed(4)}, ${inspection.project_longitude?.toFixed(4)}`} />
          )}
          {inspection.inspector_latitude && (
            <DetailRow icon={MapPin} label="Inspector Coords" value={`${inspection.inspector_latitude?.toFixed(4)}, ${inspection.inspector_longitude?.toFixed(4)}`} />
          )}
          {inspection.distance_from_project != null && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">Distance from project:</span>
              <span className={`font-medium text-sm ${inspection.distance_from_project <= 5 ? 'text-green-600' : 'text-red-600'}`}>
                {inspection.distance_from_project.toFixed(2)} km {inspection.location_verified ? '✓ Verified' : '⚠ Far'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Observations */}
      {(inspection.observations || inspection.recommendations) && (
        <div className="card space-y-4">
          <h3 className="section-title">Observations & Recommendations</h3>
          {inspection.observations && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Observations</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{inspection.observations}</p>
            </div>
          )}
          {inspection.recommendations && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Recommendations</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{inspection.recommendations}</p>
            </div>
          )}
          {inspection.reviewer_comments && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Reviewer Comments</p>
              <p className="text-sm text-gray-700">{inspection.reviewer_comments}</p>
            </div>
          )}
        </div>
      )}

      {/* Checklist */}
      {inspection.checklist?.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title mb-0">Inspection Checklist</h3>
            {totalApplicable > 0 && <span className="text-sm font-medium text-gray-600">{yesCount}/{totalApplicable} passed</span>}
          </div>
          <div className="space-y-2">
            {inspection.checklist.map(item => (
              <div key={item.id} className={`flex items-start gap-3 p-3 rounded-lg border ${
                item.response === 'yes' ? 'bg-green-50 border-green-200' :
                item.response === 'no' ? 'bg-red-50 border-red-200' :
                item.response === 'not_applicable' ? 'bg-gray-50 border-gray-200' : 'border-gray-100'
              }`}>
                <div className="flex-shrink-0 mt-0.5">
                  {item.response === 'yes' ? <CheckCircle className="w-4 h-4 text-green-600" /> :
                   item.response === 'no' ? <XCircle className="w-4 h-4 text-red-600" /> :
                   <div className="w-4 h-4 rounded-full border-2 border-gray-300" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{item.item_label}</p>
                  {item.remarks && <p className="text-xs text-gray-500 mt-0.5">{item.remarks}</p>}
                </div>
                <span className={`text-xs font-medium capitalize ${
                  item.response === 'yes' ? 'text-green-700' :
                  item.response === 'no' ? 'text-red-700' :
                  item.response === 'not_applicable' ? 'text-gray-500' : 'text-gray-400'
                }`}>{item.response?.replace(/_/g,' ') || '—'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Evidence */}
      {inspection.evidence?.length > 0 && (
        <div className="card">
          <h3 className="section-title">Evidence ({inspection.evidence.length})</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {inspection.evidence.map(ev => (
              <a key={ev.id} href={ev.file_url} target="_blank" rel="noreferrer"
                className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 text-center">
                <FileText className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="text-xs font-medium text-gray-700 truncate">{ev.original_name}</p>
                <p className="text-xs text-gray-400 capitalize">{ev.file_type}</p>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      <Modal open={assignModal} onClose={() => setAssignModal(false)} title="Assign Inspection Officer">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Officer</label>
            <select value={assignOfficer} onChange={e => setAssignOfficer(e.target.value)} className="input-field">
              <option value="">Choose officer...</option>
              {officers.map(o => <option key={o.id} value={o.id}>{o.name} — {o.district}, {o.state}</option>)}
            </select>
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setAssignModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleAssign} disabled={saving} className="btn-primary">{saving ? 'Assigning...' : 'Assign'}</button>
          </div>
        </div>
      </Modal>

      {/* Review Modal */}
      <Modal open={reviewModal} onClose={() => setReviewModal(false)} title="Review Inspection Report">
        <div className="space-y-4">
          <div className="flex gap-3">
            <button onClick={() => setReviewAction('approve')}
              className={`flex-1 py-3 rounded-lg border-2 flex items-center justify-center gap-2 font-medium text-sm transition-colors ${reviewAction === 'approve' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600'}`}>
              <CheckCircle className="w-4 h-4" />Approve
            </button>
            <button onClick={() => setReviewAction('reject')}
              className={`flex-1 py-3 rounded-lg border-2 flex items-center justify-center gap-2 font-medium text-sm transition-colors ${reviewAction === 'reject' ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 text-gray-600'}`}>
              <XCircle className="w-4 h-4" />Reject
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Comments</label>
            <textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)} rows={4}
              className="input-field" placeholder="Add review comments..." />
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setReviewModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleReview} disabled={saving}
              className={`${reviewAction === 'approve' ? 'btn-primary' : 'btn-danger'}`}>
              {saving ? 'Processing...' : reviewAction === 'approve' ? 'Approve' : 'Reject'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium text-gray-900">{value || '—'}</p>
      </div>
    </div>
  )
}
