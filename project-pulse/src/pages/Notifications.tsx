import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '@/hooks/useData';
import { useAllTasks } from '@/hooks/useData';
import { Bell, CheckCheck, Info, GitPullRequest, MessageSquare, Clock, AtSign, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppNotification, NotificationType } from '@/types';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

const typeConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  TASK_ASSIGNED:  { icon: GitPullRequest, color: 'text-blue-500 bg-blue-500/10',      label: 'Назначено' },
  STATUS_CHANGED: { icon: Info,           color: 'text-amber-500 bg-amber-500/10',    label: 'Статус' },
  NEW_COMMENT:    { icon: MessageSquare,  color: 'text-violet-500 bg-violet-500/10',  label: 'Комментарий' },
  TASK_OVERDUE:   { icon: Clock,          color: 'text-red-500 bg-red-500/10',        label: 'Просрочено' },
  MENTION:        { icon: AtSign,         color: 'text-emerald-500 bg-emerald-500/10',label: 'Упоминание' },
  WORKLOAD_ALERT: { icon: TrendingUp,     color: 'text-orange-500 bg-orange-500/10',  label: 'Загруженность' },
};

const defaultConfig = { icon: Bell, color: 'text-muted-foreground bg-muted', label: 'Уведомление' };

export default function Notifications() {
  const navigate = useNavigate();
  const { data: notifications = [] } = useNotifications();
  const { data: allTasks = [] } = useAllTasks();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const unread = notifications.filter(n => !n.read);
  const read   = notifications.filter(n => n.read);

  const getNotificationTarget = (n: AppNotification): string | null => {
    if (!n.taskId) {
      if (n.projectId) {
        return `/project/${n.projectId}`;
      }
      return null;
    }

    const task = allTasks.find(t => t.id === n.taskId);
    if (task?.projectId) {
      return `/project/${task.projectId}?taskId=${task.id}`;
    }

    if (n.projectId) {
      return `/project/${n.projectId}?taskId=${n.taskId}`;
    }

    return null;
  };

  const handleOpenNotification = (notification: AppNotification) => {
    if (!notification.read) {
      markRead.mutate(notification.id);
    }

    const target = getNotificationTarget(notification);
    if (target) {
      navigate(target);
    }
  };

  return (
    <div className="max-w-2xl w-full space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Уведомления</h1>
            <p className="text-sm text-muted-foreground">
              {unread.length > 0 ? `${unread.length} непрочитанных` : 'Все прочитаны'}
            </p>
          </div>
        </div>
        {unread.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-xs w-full sm:w-auto"
            onClick={() => markAllRead.mutate()}
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Прочитать все
          </Button>
        )}
      </div>

      {/* Unread */}
      {unread.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Непрочитанные</p>
          <div className="bg-card border border-border/70 rounded-xl shadow-sm divide-y divide-border/40 overflow-hidden">
            {unread.map(n => (
              <NotificationItem
                key={n.id}
                notification={n}
                onOpen={() => handleOpenNotification(n)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Read */}
      {read.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Прочитанные</p>
          <div className="bg-card border border-border/70 rounded-xl shadow-sm divide-y divide-border/40 overflow-hidden opacity-70">
            {read.map(n => (
              <NotificationItem key={n.id} notification={n} onOpen={() => handleOpenNotification(n)} />
            ))}
          </div>
        </div>
      )}

      {notifications.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Bell className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-base font-medium text-muted-foreground">Нет уведомлений</p>
        </div>
      )}
    </div>
  );
}

function NotificationItem({
  notification,
  onOpen,
}: {
  notification: AppNotification;
  onOpen?: () => void;
}) {
  const cfg = typeConfig[notification.type] ?? defaultConfig;
  const Icon = cfg.icon;

  return (
    <div
      className={cn(
        'flex items-start gap-3 px-5 py-3.5 transition-colors',
        !notification.read && 'bg-primary/[0.03] hover:bg-primary/[0.06] cursor-pointer',
        notification.read && 'hover:bg-muted/20 cursor-pointer',
      )}
      onClick={onOpen}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm', !notification.read ? 'font-medium text-foreground' : 'text-muted-foreground')}>
          {notification.message}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-muted-foreground/70">
            {new Date(notification.createdAt).toLocaleDateString('ru', {
              day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
            })}
          </span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${cfg.color} font-medium`}>
            {cfg.label}
          </span>
        </div>
      </div>
      {!notification.read && (
        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
      )}
    </div>
  );
}
