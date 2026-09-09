import React, { useEffect, useState } from 'react'
import { analyticsAPI, camerasAPI, inspectionsAPI } from '../services/api'
import StatusBadge from '../components/StatusBadge'
import { PageLoader } from '../components/LoadingSpinner'
import { Activity, Camera, ClipboardList, AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react'

export default function LiveMonitoringPage() {
  const [data, setData] = useState(null)
  const [cameras, setCameras] = useState([])
  const [liveInspections, setLiveInspections] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(new Date())

  const load = async () => {
    try {
      const [dashRes, camRes, insRes] = await Promise.all([
        analyticsAPI.getDashboard(),
        camerasAPI.getAll({}),
        inspectionsAPI.getAll({ status: 'in_progress' })
      ])
      setData(dashRes.data.stats)
      setCameras(camRes.data.cameras)
      setLiveInspections(insRes.data.inspections)
      setLastUpdated(new Date())
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t) }, [])

  if (loading) return <PageLoader />

  const onlineCams = cameras.filter(c => c.status === 'online')
  const offlineCams = cameras.filter(c => c.status === 'offline')

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Live Monitoring</h1>
          <p className="text-sm text-gray-500">Real-time system status · Last updated: {lastUpdated.toLocaleTimeString()}</p>
        </div>
        <button onClick={load} className="btn-secondary flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />Refresh
        </button>
      </div>

      {/* Status grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card text-center">
          <div className="text-3xl font-bold text-green-600">{data?.cameras_online || 0}</div>
          <div className="text-sm text-gray-600 mt-1 flex items-center justify-center gap-1"><Wifi className="w-3 h-3 text-green-500" />Cameras Online</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-red-600">{offlineCams.length}</div>
          <div className="text-sm text-gray-600 mt-1 flex items-center justify-center gap-1"><WifiOff className="w-3 h-3 text-red-500" />Cameras Offline</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-yellow-600">{liveInspections.length}</div>
          <div className="text-sm text-gray-600 mt-1 flex items-center justify-center gap-1"><ClipboardList className="w-3 h-3 text-yellow-500" />Active Inspections</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-red-600">{data?.open_alerts || 0}</div>
          <div className="text-sm text-gray-600 mt-1 flex items-center justify-center gap-1"><AlertTriangle className="w-3 h-3 text-red-500" />Open Alerts</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Camera status */}
        <div className="card">
          <h3 className="section-title">Camera Status ({cameras.length} total)</h3>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {cameras.map(cam => (
              <div key={cam.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${cam.status === 'online' ? 'bg-green-400 animate-pulse' : cam.status === 'offline' ? 'bg-red-500' : 'bg-yellow-400'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{cam.name}</p>
                  <p className="text-xs text-gray-500 truncate">{cam.project_name}</p>
                </div>
                <StatusBadge status={cam.status} />
              </div>
            ))}
            {cameras.length === 0 && <p className="text-sm text-gray-400 text-center py-6">No cameras registered</p>}
          </div>
        </div>

        {/* Active inspections */}
        <div className="card">
          <h3 className="section-title">Active Inspections</h3>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {liveInspections.length > 0 ? liveInspections.map(ins => (
              <div key={ins.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{ins.project_name}</p>
                  <p className="text-xs text-gray-500 truncate">{ins.assigned_officer_name} · {ins.inspection_number}</p>
                </div>
                <StatusBadge status={ins.status} />
              </div>
            )) : (
              <div className="text-center py-10">
                <Activity className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No active inspections</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
