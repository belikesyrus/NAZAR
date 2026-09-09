import React, { useEffect, useState } from 'react'
import { analyticsAPI } from '../services/api'
import { PageLoader } from '../components/LoadingSpinner'
import toast from 'react-hot-toast'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { TrendingUp, TrendingDown } from 'lucide-react'

const PIE_COLORS = ['#dc2626','#eab308','#2563eb','#16a34a']

export default function CompliancePage() {
  const [data, setData] = useState(null)
  const [perf, setPerf] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([analyticsAPI.getCompliance(), analyticsAPI.getPerformance()])
      .then(([cRes, pRes]) => { setData(cRes.data); setPerf(pRes.data) })
      .catch(() => toast.error('Failed to load compliance data'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageLoader />

  const distData = data ? Object.entries(data.score_distribution || {}).map(([k,v]) => ({ name: k+'%', value: v })) : []
  const stateData = data?.by_state || []
  const perfData = perf?.by_state || []

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Compliance Analytics</h1>
        <p className="text-sm text-gray-500">Project compliance scores and performance overview</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Distribution */}
        <div className="card">
          <h3 className="section-title">Score Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={distData} dataKey="value" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`} fontSize={11}>
                {distData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip /><Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* State avg */}
        <div className="card">
          <h3 className="section-title">Average by State</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stateData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" domain={[0,100]} tick={{ fontSize: 10 }} unit="%" />
              <YAxis type="category" dataKey="state" tick={{ fontSize: 10 }} width={90} />
              <Tooltip formatter={v => `${v}%`} />
              <Bar dataKey="avg_score" fill="#2563eb" radius={[0,4,4,0]} name="Avg Score" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Projects table */}
      <div className="card overflow-x-auto p-0">
        <div className="p-4 border-b"><h3 className="section-title mb-0">All Projects Compliance</h3></div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="table-header">Project</th>
              <th className="table-header">State</th>
              <th className="table-header">Score</th>
              <th className="table-header">Status</th>
            </tr>
          </thead>
          <tbody>
            {(data?.projects || []).sort((a,b) => (a.score||0) - (b.score||0)).map(p => (
              <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="table-cell font-medium">{p.name}</td>
                <td className="table-cell">{p.state}</td>
                <td className="table-cell">
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-100 rounded h-2">
                      <div className={`h-2 rounded ${p.score >= 75 ? 'bg-green-500' : p.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${p.score||0}%` }} />
                    </div>
                    <span className="font-medium">{p.score?.toFixed(0) || 0}%</span>
                  </div>
                </td>
                <td className="table-cell">
                  {p.score >= 75 ? <span className="badge badge-green flex items-center gap-1 w-fit"><TrendingUp className="w-3 h-3" />Good</span> :
                   p.score >= 50 ? <span className="badge badge-yellow">Moderate</span> :
                   <span className="badge badge-red flex items-center gap-1 w-fit"><TrendingDown className="w-3 h-3" />At Risk</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
