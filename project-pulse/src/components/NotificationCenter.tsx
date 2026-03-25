import { Bell, UserPlus, RefreshCw, MessageSquare, AlertTriangle, Check, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications, useMarkAllNotificationsRead, useMarkNotificationRead, useAllTasks } from '@/hooks/useData';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { AppNotification } from '@/types';
import { useNavigate } from 'react-router-dom';

const notifConfig: Record<string, { icon: React.ComponentType<{className?: string}>; color: string; bg: string }> = {
  TASK_ASSIGNED:  { icon: UserPlus,     color: 'text-blue-600',    bg: 'bg-blue-50' },
  STATUS_CHANGED: { icon: RefreshCw,    color: 'text-violet-600',  bg: 'bg-violet-50' },
  NEW_COMMENT:    { icon: MessageSquare,color: 'text-emerald-600', bg: 'bg-emerald-50' },
  MENTION:        { icon: MessageSquare,color: 'text-teal-600',    bg: 'bg-teal-50' },
  TASK_OVERDUE:   { icon: AlertTriangle,color: 'text-red-600',     bg: 'bg-red-50' },
  WORKLOAD_ALERT: { icon: TrendingUp,   color: 'text-orange-600',  bg: 'bg-orange-50' },
  // совместимость со старыми названиями
  assigned:       { icon: UserPlus,     color: 'text-blue-600',    bg: 'bg-blue-50' },
  status_changed: { icon: RefreshCw,    color: 'text-violet-600',  bg: 'bg-violet-50' },
  comment:        { icon: MessageSquare,color: 'text-emerald-600', bg: 'bg-emerald-50' },
  overdue:        { icon: AlertTriangle,color: 'text-red-600',     bg: 'bg-red-50' },
};

export function NotificationCenter() {
  const navigate = useNavigate();
  const { data: notifications = [] } = useNotifications();
  const { data: allTasks = [] } = useAllTasks();
  const markAllRead = useMarkAllNotificationsRead();
  const markRead = useMarkNotificationRead();
  const unreadCount = notifications.filter(n => !n.read).length;

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

  const handleNotificationClick = (n: AppNotification) => {
    if (!n.read) {
      markRead.mutate(n.id);
    }

    const target = getNotificationTarget(n);
    if (target) {
      navigate(target);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-lg h-9 w-9">
          <Bell className="w-4.5 h-4.5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center font-bold px-1">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[calc(100vw-1rem)] max-w-[360px] p-0 shadow-lg rounded-xl" align="end">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">Уведомления</h3>
            {unreadCount > 0 && (
              <span className="bg-primary/10 text-primary text-[11px] font-bold px-1.5 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 gap-1.5 text-muted-foreground hover:text-foreground"
              onClick={() => markAllRead.mutate()}
            >
              <Check className="w-3 h-3" />
              Прочитать все
            </Button>
          )}
        </div>

        <ScrollArea className="h-[360px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <Bell className="w-8 h-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">Нет уведомлений</p>
            </div>
          ) : (
            <div className="py-1">
              {notifications.slice(0, 25).map(n => {
                const cfg = notifConfig[n.type] ?? { icon: Bell, color: 'text-muted-foreground', bg: 'bg-muted' };
                const Icon = cfg.icon;
                return (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-muted/40 transition-colors border-b border-border/30 last:border-0 ${
                      !n.read ? 'bg-primary/3' : ''
                    }`}
                    onClick={() => handleNotificationClick(n)}
                  >
                    {/* Icon */}
                    <div className={`w-8 h-8 rounded-full ${cfg.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug ${!n.read ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                        {n.message}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: ru })}
                      </p>
                    </div>
                    {/* Unread dot */}
                    {!n.read && (
                      <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
