import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { reportsAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import StatusBadge from '../components/StatusBadge'
import Modal from '../components/Modal'
import { PageLoader } from '../components/LoadingSpinner'
import toast from 'react-hot-toast'
import { ArrowLeft, CheckCircle, XCircle, FileText, MapPin } from 'lucide-react'
import { format } from 'date-fns'

export default function ReportDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [reviewModal, setReviewModal] = useState(false)
  const [action, setAction] = useState('approve')
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    reportsAPI.getOne(id).then(r => setReport(r.data.report)).catch(() => toast.error('Failed to load')).finally(() => setLoading(false))
  }, [id])

  const handleReview = async () => {
    setSaving(true)
    try {
      if (action === 'approve') await reportsAPI.approve(id, { comments: comment })
      else await reportsAPI.reject(id, { comments: comment })
      toast.success(`Report ${action}d`)
      setReviewModal(false)
      reportsAPI.getOne(id).then(r => setReport(r.data.report))
    } catch { toast.error('Action failed') }
    finally { setSaving(false) }
  }

  if (loading) return <PageLoader />
  if (!report) return <div className="p-6 text-center text-gray-500">Report not found</div>

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-5">
      <div className="flex items-start gap-3">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"><ArrowLeft className="w-4 h-4" /></button>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-gray-900">Inspection Report</h1>
            <StatusBadge status={report.status} />
          </div>
          <p className="text-gray-600">{report.project_name} · {report.inspection_number}</p>
        </div>
        {isAdmin() && report.status === 'submitted' && (
          <button onClick={() => setReviewModal(true)} className="btn-primary flex items-center gap-2 text-sm flex-shrink-0">
            Review Report
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-xs text-gray-500">Inspector</p>
          <p className="font-semibold text-gray-900">{report.assigned_officer_name || '—'}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500">Submitted</p>
          <p className="font-semibold text-gray-900">{report.submitted_at ? format(new Date(report.submitted_at), 'dd MMM yyyy HH:mm') : '—'}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500">Compliance Score</p>
          <p className={`text-2xl font-bold ${report.compliance_score >= 75 ? 'text-green-600' : report.compliance_score >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>{report.compliance_score != null ? `${report.compliance_score}%` : '—'}</p>
        </div>
      </div>

      {report.inspector_latitude && (
        <div className="card flex items-center gap-3">
          <MapPin className="w-5 h-5 text-blue-500" />
          <div>
            <p className="text-xs text-gray-500">Inspector Location</p>
            <p className="text-sm font-medium">{report.inspector_latitude.toFixed(4)}, {report.inspector_longitude.toFixed(4)} · {report.distance_from_project ? `${report.distance_from_project.toFixed(2)} km from project` : ''}</p>
          </div>
          {report.location_verified && <span className="badge badge-green ml-auto">Location Verified</span>}
        </div>
      )}

      {report.observations && (
        <div className="card">
          <h3 className="section-title">Observations</h3>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{report.observations}</p>
        </div>
      )}

      {report.checklist?.length > 0 && (
        <div className="card">
          <h3 className="section-title">Checklist</h3>
          <div className="space-y-2">
            {report.checklist.map(item => (
              <div key={item.id} className="flex items-center gap-3 py-1.5 border-b border-gray-50 last:border-0">
                {item.response === 'yes' ? <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" /> :
                 item.response === 'no' ? <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" /> :
                 <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0" />}
                <span className="text-sm flex-1">{item.item_label}</span>
                <span className={`text-xs font-medium ${item.response === 'yes' ? 'text-green-600' : item.response === 'no' ? 'text-red-600' : 'text-gray-400'}`}>{item.response?.replace(/_/g,' ')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {report.evidence?.length > 0 && (
        <div className="card">
          <h3 className="section-title">Evidence Files</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {report.evidence.map(ev => (
              <a key={ev.id} href={ev.file_url} target="_blank" rel="noreferrer" className="border rounded-lg p-3 hover:bg-gray-50 text-center">
                <FileText className="w-8 h-8 text-blue-400 mx-auto mb-1" />
                <p className="text-xs truncate">{ev.original_name}</p>
              </a>
            ))}
          </div>
        </div>
      )}

      {report.reviewer_comments && (
        <div className="card bg-blue-50 border-blue-200">
          <h3 className="section-title text-blue-800">Reviewer Comments</h3>
          <p className="text-sm text-blue-700">{report.reviewer_comments}</p>
        </div>
      )}

      <Modal open={reviewModal} onClose={() => setReviewModal(false)} title="Review Report">
        <div className="space-y-4">
          <div className="flex gap-3">
            <button onClick={() => setAction('approve')} className={`flex-1 py-3 rounded-lg border-2 flex items-center justify-center gap-2 text-sm font-medium ${action === 'approve' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600'}`}>
              <CheckCircle className="w-4 h-4" />Approve
            </button>
            <button onClick={() => setAction('reject')} className={`flex-1 py-3 rounded-lg border-2 flex items-center justify-center gap-2 text-sm font-medium ${action === 'reject' ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 text-gray-600'}`}>
              <XCircle className="w-4 h-4" />Reject
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Comments</label>
            <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3} className="input-field" />
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setReviewModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleReview} disabled={saving} className={action === 'approve' ? 'btn-primary' : 'btn-danger'}>
              {saving ? 'Processing...' : action === 'approve' ? 'Approve' : 'Reject'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
