import React, { useEffect, useState } from 'react'
import { notificationsAPI } from '../services/api'
import { PageLoader } from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import toast from 'react-hot-toast'
import { Bell, CheckCheck } from 'lucide-react'

const TYPE_STYLES = { info:'bg-blue-50 text-blue-700 border-blue-200', warning:'bg-yellow-50 text-yellow-700 border-yellow-200', alert:'bg-red-50 text-red-700 border-red-200', success:'bg-green-50 text-green-700 border-green-200' }

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState([])
  const [loading, setLoading] = useState(true)
  const [unread, setUnread] = useState(0)

  const load = async () => {
    setLoading(true)
    try {
      const res = await notificationsAPI.getAll()
      setNotifs(res.data.notifications)
      setUnread(res.data.unread_count)
    } catch { toast.error('Failed to load notifications') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const markRead = async (id) => {
    try { await notificationsAPI.markRead(id); load() } catch {}
  }

  const markAllRead = async () => {
    try { await notificationsAPI.markAllRead(); toast.success('All marked as read'); load() } catch {}
  }

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-5 h-5" />Notifications
            {unread > 0 && <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">{unread} new</span>}
          </h1>
        </div>
        {unread > 0 && (
          <button onClick={markAllRead} className="btn-secondary flex items-center gap-2 text-sm">
            <CheckCheck className="w-4 h-4" />Mark all read
          </button>
        )}
      </div>

      {loading ? <PageLoader /> : notifs.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" />
      ) : (
        <div className="space-y-2">
          {notifs.map(n => (
            <div key={n.id} onClick={() => !n.is_read && markRead(n.id)}
              className={`flex gap-4 p-4 rounded-xl border cursor-pointer transition-all hover:shadow-sm ${TYPE_STYLES[n.notification_type] || TYPE_STYLES.info} ${!n.is_read ? 'opacity-100' : 'opacity-70'}`}>
              <div className="flex-shrink-0 mt-0.5">
                <Bell className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-semibold text-sm">{n.title}</p>
                  {!n.is_read && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />}
                </div>
                <p className="text-sm opacity-80">{n.message}</p>
                <p className="text-xs opacity-60 mt-1">{n.created_at ? new Date(n.created_at).toLocaleString() : ''}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
