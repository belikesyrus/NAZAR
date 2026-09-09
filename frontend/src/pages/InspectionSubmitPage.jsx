import React, { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { inspectionsAPI, evidenceAPI } from '../services/api'
import { PageLoader } from '../components/LoadingSpinner'
import toast from 'react-hot-toast'
import { ArrowLeft, MapPin, Upload, CheckCircle, XCircle, MinusCircle, Camera, Paperclip } from 'lucide-react'

export default function InspectionSubmitPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [inspection, setInspection] = useState(null)
  const [checklist, setChecklist] = useState([])
  const [loading, setLoading] = useState(true)
  const [observations, setObservations] = useState('')
  const [recommendations, setRecommendations] = useState('')
  const [location, setLocation] = useState({ lat: null, lon: null, error: '' })
  const [gettingLoc, setGettingLoc] = useState(false)
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef()

  useEffect(() => {
    inspectionsAPI.getOne(id).then(res => {
      setInspection(res.data.inspection)
      setChecklist(res.data.inspection.checklist?.map(c => ({ ...c, response: c.response || 'not_checked', remarks: c.remarks || '' })) || [])
    }).catch(() => toast.error('Failed to load inspection'))
    .finally(() => setLoading(false))
  }, [id])

  const getLocation = () => {
    setGettingLoc(true)
    if (!navigator.geolocation) { setLocation(l => ({ ...l, error: 'Geolocation not supported' })); setGettingLoc(false); return }
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude, error: '' }); setGettingLoc(false); toast.success('Location captured') },
      (err) => { setLocation(l => ({ ...l, error: err.message })); setGettingLoc(false) },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const updateChecklist = (idx, field, value) => {
    setChecklist(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item))
  }

  const handleFileAdd = (e) => {
    const newFiles = Array.from(e.target.files)
    setFiles(prev => [...prev, ...newFiles])
  }

  const removeFile = (idx) => setFiles(prev => prev.filter((_, i) => i !== idx))

  const uploadFiles = async () => {
    const uploaded = []
    for (const file of files) {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('inspection_id', id)
      fd.append('description', 'Field evidence')
      if (location.lat) { fd.append('latitude', location.lat); fd.append('longitude', location.lon) }
      try {
        const res = await evidenceAPI.upload(fd)
        uploaded.push(res.data.evidence)
      } catch { toast.error(`Failed to upload ${file.name}`) }
    }
    return uploaded
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!location.lat) {
      if (!window.confirm('Location not captured. Submit anyway?')) return
    }
    setSubmitting(true)
    try {
      if (files.length > 0) {
        setUploading(true)
        await uploadFiles()
        setUploading(false)
      }
      await inspectionsAPI.submit(id, {
        observations,
        recommendations,
        checklist,
        latitude: location.lat,
        longitude: location.lon,
      })
      toast.success('Inspection submitted successfully!')
      navigate(`/inspections/${id}`)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Submission failed')
    } finally { setSubmitting(false); setUploading(false) }
  }

  const RESPONSE_OPTIONS = [
    { value: 'yes', label: 'Yes', icon: CheckCircle, color: 'text-green-600 border-green-400 bg-green-50' },
    { value: 'no', label: 'No', icon: XCircle, color: 'text-red-600 border-red-400 bg-red-50' },
    { value: 'not_applicable', label: 'N/A', icon: MinusCircle, color: 'text-gray-500 border-gray-400 bg-gray-50' },
  ]

  const yesCount = checklist.filter(c => c.response === 'yes').length
  const applicable = checklist.filter(c => c.response !== 'not_applicable' && c.response !== 'not_checked').length
  const score = applicable > 0 ? Math.round((yesCount / applicable) * 100) : 0

  if (loading) return <PageLoader />

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Submit Inspection Report</h1>
          <p className="text-sm text-gray-500">{inspection?.project_name} · {inspection?.inspection_number}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Location capture */}
        <div className="card">
          <h3 className="section-title">GPS Location</h3>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <button type="button" onClick={getLocation} disabled={gettingLoc}
              className="btn-secondary flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {gettingLoc ? 'Getting location...' : 'Capture My Location'}
            </button>
            {location.lat ? (
              <div className="text-sm text-green-600 font-medium">
                ✓ {location.lat.toFixed(5)}, {location.lon.toFixed(5)}
              </div>
            ) : location.error ? (
              <div className="text-sm text-red-500">{location.error}</div>
            ) : (
              <div className="text-sm text-gray-400">Location not captured</div>
            )}
          </div>
        </div>

        {/* Checklist */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title mb-0">Inspection Checklist</h3>
            <div className="text-sm font-bold text-blue-700">Score: {score}%</div>
          </div>
          <div className="space-y-4">
            {checklist.map((item, idx) => (
              <div key={item.id || idx} className="border border-gray-200 rounded-xl p-4">
                <p className="text-sm font-medium text-gray-900 mb-3">{idx + 1}. {item.item_label}</p>
                <div className="flex gap-2 mb-3 flex-wrap">
                  {RESPONSE_OPTIONS.map(opt => {
                    const Icon = opt.icon
                    const selected = item.response === opt.value
                    return (
                      <button key={opt.value} type="button"
                        onClick={() => updateChecklist(idx, 'response', opt.value)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 text-sm font-medium transition-all ${
                          selected ? opt.color + ' font-semibold' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}>
                        <Icon className="w-3.5 h-3.5" />{opt.label}
                      </button>
                    )
                  })}
                </div>
                <input
                  placeholder="Add remarks (optional)..."
                  value={item.remarks}
                  onChange={e => updateChecklist(idx, 'remarks', e.target.value)}
                  className="input-field text-xs"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Observations */}
        <div className="card space-y-4">
          <h3 className="section-title">Field Observations</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observations *</label>
            <textarea value={observations} onChange={e => setObservations(e.target.value)} required rows={4}
              placeholder="Describe what you observed during the inspection..." className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recommendations</label>
            <textarea value={recommendations} onChange={e => setRecommendations(e.target.value)} rows={3}
              placeholder="List your recommendations..." className="input-field" />
          </div>
        </div>

        {/* Evidence upload */}
        <div className="card">
          <h3 className="section-title">Upload Evidence</h3>
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors"
            onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Click to upload photos, documents</p>
            <p className="text-xs text-gray-400 mt-1">PNG, JPG, PDF, DOC up to 16MB each</p>
            <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.doc,.docx" className="hidden" onChange={handleFileAdd} />
          </div>
          {files.length > 0 && (
            <div className="mt-3 space-y-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2">
                  <Paperclip className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700 flex-1 truncate">{f.name}</span>
                  <span className="text-xs text-gray-400">{(f.size / 1024).toFixed(0)}KB</span>
                  <button type="button" onClick={() => removeFile(i)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={submitting} className="btn-primary flex-1 py-3">
            {uploading ? 'Uploading evidence...' : submitting ? 'Submitting...' : 'Submit Inspection Report'}
          </button>
        </div>
      </form>
    </div>
  )
}
