import React from 'react';
import { Notification } from '../types';
import { Modal } from './ui/Modal';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { CheckCheck, Bell } from 'lucide-react';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkRead: (id: number) => void;
  onMarkAllRead: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkRead,
  onMarkAllRead,
}) => {
  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Notifications"
      footer={
        notifications.some((n) => !n.read) ? (
          <Button
            variant="ghost"
            size="sm"
            icon={<CheckCheck className="w-3.5 h-3.5" />}
            onClick={onMarkAllRead}
          >
            Mark all read
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-2">
        {unreadCount > 0 && (
          <div className="flex items-center justify-between pb-2 border-b border-line text-xs text-muted">
            <span>{unreadCount} unread</span>
          </div>
        )}

        <div className="divide-y divide-line -m-5">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted">
              No notifications yet.
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`p-4 flex items-start justify-between gap-3 text-xs transition-colors ${
                  n.read ? 'bg-surface opacity-75' : 'bg-paper/40'
                }`}
              >
                <div className="space-y-0.5 min-w-0 pr-2">
                  <div className="flex items-center space-x-2">
                    <p className={`font-medium text-ink ${!n.read ? 'font-semibold' : ''}`}>
                      {n.title}
                    </p>
                    <Badge variant="outline">{n.type}</Badge>
                  </div>
                  <p className="text-muted leading-relaxed text-[11px] mt-0.5">{n.message}</p>
                </div>

                {!n.read && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-shrink-0 text-accent text-[11px]"
                    onClick={() => onMarkRead(n.id)}
                  >
                    Mark read
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
};
