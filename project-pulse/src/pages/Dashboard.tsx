import { Link } from 'react-router-dom';
import { useProjects, useAllTasks, useNotifications, useUsers } from '@/hooks/useData';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';
import { FolderKanban, Bell, Users, CheckCircle2, Clock, AlertTriangle, TrendingUp } from 'lucide-react';

const deptColors: Record<string, string> = {
  Development: 'bg-blue-500',
  Design:      'bg-violet-500',
  Marketing:   'bg-amber-500',
  Analytics:   'bg-teal-500',
  QA:          'bg-emerald-500',
};

export default function Dashboard() {
  const { data: projects = [] } = useProjects();
  const { data: allTasks = [] } = useAllTasks();
  const { data: notifications = [] } = useNotifications();
  const { data: users = [] } = useUsers();
  const { currentUser } = useAuth();
  const permissions = usePermissions();

  const visibleProjects = projects.filter(p => permissions.canViewProject(p));
  const myTasks = allTasks.filter(t =>
    t.assigneeIds.includes(currentUser?.id ?? '') || t.creatorId === (currentUser?.id ?? '')
  );
  const unread = notifications.filter(n => !n.read).length;
  const doneTasks = myTasks.filter(t => t.status === 'DONE').length;
  const inProgressTasks = myTasks.filter(t => t.status === 'IN_PROGRESS').length;
  const overdueTasks = myTasks.filter(t => t.status !== 'DONE' && new Date(t.dueDate) < new Date()).length;

  const stats = [
    {
      label: 'Мои проекты',
      value: visibleProjects.length,
      icon: FolderKanban,
      color: 'bg-blue-500/10 text-blue-500',
      to: '/projects',
    },
    {
      label: 'В работе',
      value: inProgressTasks,
      icon: Clock,
      color: 'bg-amber-500/10 text-amber-500',
      to: '/projects',
    },
    {
      label: 'Завершено',
      value: doneTasks,
      icon: CheckCircle2,
      color: 'bg-emerald-500/10 text-emerald-500',
      to: '/projects',
    },
    {
      label: 'Просрочено',
      value: overdueTasks,
      icon: AlertTriangle,
      color: 'bg-red-500/10 text-red-500',
      to: '/projects',
    },
    {
      label: 'Уведомлений',
      value: unread,
      icon: Bell,
      color: 'bg-violet-500/10 text-violet-500',
      to: '/notifications',
    },
    {
      label: 'Участников',
      value: users.length,
      icon: Users,
      color: 'bg-cyan-500/10 text-cyan-500',
      to: '/team',
    },
  ];

  const recentNotifications = notifications.filter(n => !n.read).slice(0, 4);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <TrendingUp className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Добро пожаловать, {currentUser?.name?.split(' ')[0] ?? 'Пользователь'}!
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Обзор вашего рабочего пространства
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map(stat => (
          <Link
            key={stat.label}
            to={stat.to}
            className="bg-card border border-border/70 rounded-xl p-5 flex items-center gap-4 shadow-sm hover:border-primary/40 hover:shadow-md transition-all group"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Recent projects */}
        <div className="bg-card border border-border/70 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Мои проекты</h2>
            <Link to="/projects" className="text-xs text-primary hover:underline">Все проекты</Link>
          </div>
          <div className="divide-y divide-border/40">
            {visibleProjects.length === 0 && (
              <p className="text-sm text-muted-foreground px-5 py-4">Нет доступных проектов</p>
            )}
            {visibleProjects.slice(0, 5).map(project => (
              <Link
                key={project.id}
                to={`/project/${project.id}`}
                className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors"
              >
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${deptColors[project.department] ?? 'bg-primary'}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{project.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{project.department}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent notifications */}
        <div className="bg-card border border-border/70 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Новые уведомления</h2>
            <Link to="/notifications" className="text-xs text-primary hover:underline">Все</Link>
          </div>
          <div className="divide-y divide-border/40">
            {recentNotifications.length === 0 && (
              <p className="text-sm text-muted-foreground px-5 py-4">Нет новых уведомлений</p>
            )}
            {recentNotifications.map(n => (
              <div key={n.id} className="px-5 py-3">
                <p className="text-sm text-foreground line-clamp-2">{n.message}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(n.createdAt).toLocaleDateString('ru', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
