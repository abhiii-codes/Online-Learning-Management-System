import React from 'react';
import { Notification } from '../types';
import { X, CheckCheck, Info, Award, UserCheck, AlertTriangle } from 'lucide-react';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkRead: (id: number) => void;
  onMarkAllRead: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen, onClose, notifications, onMarkRead, onMarkAllRead
}) => {
  if (!isOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'GRADE': return <Award className="w-4 h-4 text-emerald-500" />;
      case 'ENROLLMENT': return <UserCheck className="w-4 h-4 text-blue-500" />;
      case 'WARNING': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      default: return <Info className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200">
        <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <h3 className="font-bold text-base text-white">Notifications</h3>
            <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/30 text-blue-300 font-medium">
              {notifications.filter(n => !n.read).length} Unread
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {notifications.some(n => !n.read) && (
              <button
                onClick={onMarkAllRead}
                className="text-xs text-blue-300 hover:text-white flex items-center space-x-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
            <button onClick={onClose} className="text-slate-400 hover:text-white ml-2">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 p-2">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              No notifications yet.
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`p-3 rounded-lg flex items-start space-x-3 transition ${
                  n.read ? 'bg-white opacity-70' : 'bg-blue-50/50'
                }`}
              >
                <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-sm flex-shrink-0 mt-0.5">
                  {getIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <p className={`text-xs ${n.read ? 'font-medium text-slate-700' : 'font-bold text-slate-900'}`}>
                      {n.title}
                    </p>
                    {!n.read && (
                      <button
                        onClick={() => onMarkRead(n.id)}
                        className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold uppercase tracking-wider ml-2"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{n.message}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
