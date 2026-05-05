import { useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck, ArrowLeft } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

const typeColors: Record<string, string> = {
  material_approved: 'bg-green-50 border-green-200',
  material_rejected: 'bg-red-50 border-red-200',
  new_material: 'bg-blue-50 border-blue-200',
  tutor_approved: 'bg-purple-50 border-purple-200',
  general: 'bg-gray-50 border-gray-200',
  wanted_match: 'bg-yellow-50 border-yellow-200',
  new_message: 'bg-indigo-50 border-indigo-200',
};

const typeIcons: Record<string, string> = {
  material_approved: '✅',
  material_rejected: '❌',
  new_material: '📚',
  tutor_approved: '🎓',
  general: '🔔',
  wanted_match: '🎯',
  new_message: '💬',
};

export default function Notifications() {
  const { notifications, markAsRead, markAllRead } = useNotifications();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 font-medium">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          </div>
          {notifications.some(n => !n.is_read) && (
            <button onClick={markAllRead}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium">
              <CheckCheck className="w-4 h-4" /> Mark all read
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Bell className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map(n => (
              <div key={n.id}
                onClick={() => { markAsRead(n.id); if (n.link) navigate(n.link); }}
                className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-opacity ${typeColors[n.type] || typeColors.general} ${n.is_read ? 'opacity-60' : 'opacity-100'}`}>
                <span className="text-2xl">{typeIcons[n.type] || '🔔'}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{n.title}</p>
                  <p className="text-gray-600 text-sm mt-0.5">{n.body}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                </div>
                {!n.is_read && (
                  <button onClick={e => { e.stopPropagation(); markAsRead(n.id); }}
                    className="shrink-0 p-1 text-blue-500 hover:text-blue-700">
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}