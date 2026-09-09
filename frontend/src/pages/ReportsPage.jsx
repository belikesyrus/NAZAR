import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { reportsAPI } from '../services/api'
import StatusBadge from '../components/StatusBadge'
import { PageLoader } from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import { FileCheck, Eye, ChevronLeft, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'

export default function ReportsPage() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, per_page: 15 }
      if (statusFilter) params.status = statusFilter
      const res = await reportsAPI.getAll(params)
      setReports(res.data.reports)
      setTotal(res.data.total)
      setPages(res.data.pages)
    } catch {}
    finally { setLoading(false) }
  }, [page, statusFilter])

  useEffect(() => { load() }, [load])

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Inspection Reports</h1>
          <p className="text-sm text-gray-500">{total} submitted reports</p>
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }} className="input-field w-auto">
          <option value="">All Statuses</option>
          <option value="submitted">Submitted</option>
          <option value="under_review">Under Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {loading ? <PageLoader /> : reports.length === 0 ? (
        <EmptyState icon={FileCheck} title="No reports found" />
      ) : (
        <div className="space-y-3">
          {reports.map(r => (
            <Link key={r.id} to={`/reports/${r.id}`}
              className="card hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-gray-500">{r.inspection_number}</span>
                  <StatusBadge status={r.status} />
                </div>
                <p className="font-semibold text-gray-900">{r.project_name}</p>
                <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                  <span>Officer: {r.assigned_officer_name || '—'}</span>
                  {r.submitted_at && <span>Submitted: {format(new Date(r.submitted_at), 'dd MMM yyyy')}</span>}
                  {r.project_district && <span>📍 {r.project_district}, {r.project_state}</span>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {r.compliance_score != null && (
                  <div className="text-center">
                    <div className={`text-xl font-bold ${r.compliance_score >= 75 ? 'text-green-600' : r.compliance_score >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>{r.compliance_score}%</div>
                    <div className="text-xs text-gray-500">Compliance</div>
                  </div>
                )}
                <Eye className="w-4 h-4 text-gray-400" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn-secondary p-2 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
          <span className="text-sm text-gray-600">Page {page} of {pages}</span>
          <button disabled={page >= pages} onClick={() => setPage(p => p + 1)} className="btn-secondary p-2 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
        </div>
      )}
    </div>
  )
}
