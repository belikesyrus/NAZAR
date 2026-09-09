import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet'
import L from 'leaflet'
import { projectsAPI, inspectionsAPI } from '../services/api'
import { PageLoader } from '../components/LoadingSpinner'
import StatusBadge from '../components/StatusBadge'
import { Link } from 'react-router-dom'
import { MapPin, Layers } from 'lucide-react'

// Fix Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const makeIcon = (color) => L.divIcon({
  html: `<div style="background:${color};width:14px;height:14px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
  iconSize: [14, 14], className: ''
})

const GREEN = makeIcon('#16a34a')
const RED = makeIcon('#dc2626')
const YELLOW = makeIcon('#eab308')
const BLUE = makeIcon('#2563eb')

export default function GeoMapPage() {
  const [projects, setProjects] = useState([])
  const [inspections, setInspections] = useState([])
  const [loading, setLoading] = useState(true)
  const [layer, setLayer] = useState('all')

  useEffect(() => {
    Promise.all([
      projectsAPI.getAll({ per_page: 200 }),
      inspectionsAPI.getAll({ per_page: 50 })
    ]).then(([pRes, iRes]) => {
      setProjects(pRes.data.projects.filter(p => p.latitude && p.longitude))
      setInspections(iRes.data.inspections.filter(i => i.inspector_latitude))
    }).catch(() => {})
    .finally(() => setLoading(false))
  }, [])

  const projectIcon = (p) => {
    if (p.compliance_score >= 75) return GREEN
    if (p.compliance_score >= 50) return YELLOW
    return RED
  }

  if (loading) return <PageLoader />

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 lg:px-6 lg:py-4 border-b bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Geo-Map Dashboard</h1>
          <p className="text-sm text-gray-500">{projects.length} projects plotted</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all','projects','inspections','high-risk'].map(l => (
            <button key={l} onClick={() => setLayer(l)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${layer === l ? 'bg-blue-700 text-white border-blue-700' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>
              {l.replace('-',' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white px-4 py-2 border-b flex gap-4 flex-wrap text-xs flex-shrink-0">
        <LegendItem color="#16a34a" label="High Compliance (≥75%)" />
        <LegendItem color="#eab308" label="Medium (50-74%)" />
        <LegendItem color="#dc2626" label="Low / High Risk (<50%)" />
        <LegendItem color="#2563eb" label="Active Inspection" />
      </div>

      {/* Map */}
      <div className="flex-1 min-h-[400px]">
        <MapContainer center={[22.5, 80.5]} zoom={5} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />

          {/* Project markers */}
          {(layer === 'all' || layer === 'projects' || layer === 'high-risk') && projects
            .filter(p => layer !== 'high-risk' || (p.compliance_score || 0) < 50)
            .map(p => (
              <Marker key={p.id} position={[p.latitude, p.longitude]} icon={projectIcon(p)}>
                <Popup maxWidth={260}>
                  <div className="space-y-2 py-1">
                    <div className="font-semibold text-gray-900">{p.name}</div>
                    <div className="text-xs text-gray-600">{p.organization_name}</div>
                    <div className="flex gap-2 flex-wrap">
                      <StatusBadge status={p.status} />
                      <span className="badge badge-blue capitalize">{p.project_type}</span>
                    </div>
                    <div className="text-xs text-gray-600">
                      📍 {p.district}, {p.state}<br />
                      👥 {p.beneficiary_count} beneficiaries<br />
                      📊 Compliance: {p.compliance_score?.toFixed(0) || 0}%
                    </div>
                    <div className="bg-gray-100 rounded h-1.5"><div className="bg-blue-600 h-1.5 rounded" style={{ width: `${p.compliance_score || 0}%` }} /></div>
                    <Link to={`/inspections?project_id=${p.id}`} className="text-blue-600 text-xs hover:underline block">View Inspections →</Link>
                  </div>
                </Popup>
              </Marker>
            ))
          }

          {/* Inspection markers */}
          {(layer === 'all' || layer === 'inspections') && inspections.map(ins => (
            <Marker key={`ins-${ins.id}`} position={[ins.inspector_latitude, ins.inspector_longitude]} icon={BLUE}>
              <Popup>
                <div className="space-y-1 py-1">
                  <div className="font-semibold text-xs">{ins.inspection_number}</div>
                  <div className="text-xs">{ins.project_name}</div>
                  <StatusBadge status={ins.status} />
                  <div className="text-xs text-gray-500">Officer: {ins.assigned_officer_name || '—'}</div>
                  <Link to={`/inspections/${ins.id}`} className="text-blue-600 text-xs hover:underline block">View →</Link>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  )
}

function LegendItem({ color, label }) {
  return (
    <div className="flex items-center gap-1.5">
      <div style={{ background: color, width: 10, height: 10, borderRadius: '50%', border: '2px solid white', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
      <span className="text-gray-600">{label}</span>
    </div>
  )
}
