import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  CheckSquare, LayoutDashboard, FolderKanban, BarChart3,
  Bell, Users, Building2, Settings, ChevronDown, ChevronRight,
  Shield, LogOut, UserRound,
} from 'lucide-react';
import { NotificationCenter } from './NotificationCenter';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useProjects, useNotifications } from '@/hooks/useData';
import { cn } from '@/lib/utils';

const roleLabels: Record<string, string> = {
  ADMIN: 'Администратор', MANAGER: 'Руководитель', LEADER: 'Руководитель', PM: 'ПМ', TEAM: 'Команда',
};

const roleColors: Record<string, string> = {
  ADMIN:   'bg-red-500/20 text-red-400',
  MANAGER: 'bg-blue-500/20 text-blue-400',
  LEADER:  'bg-blue-500/20 text-blue-400',
  PM:      'bg-violet-500/20 text-violet-400',
  TEAM:    'bg-emerald-500/20 text-emerald-400',
};

const deptDotColors: Record<string, string> = {
  Development: 'bg-blue-400',
  Design:      'bg-violet-400',
  Marketing:   'bg-amber-400',
  Analytics:   'bg-teal-400',
  QA:          'bg-emerald-400',
};

interface NavItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
  badge?: number;
}

function NavItem({ to, icon: Icon, label, badge }: NavItemProps) {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link
      to={to}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all',
        isActive
          ? 'bg-sidebar-primary text-white shadow-sm'
          : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
      )}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </Link>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold text-sidebar-foreground/40 uppercase tracking-widest px-3 py-2 mt-2 first:mt-0">
      {children}
    </p>
  );
}

export function Layout() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const { canManageUsers, canViewAnalytics, canViewManagement, canViewEmployeesWorkload } = usePermissions();
  const permissions = usePermissions();
  const { data: projects = [] } = useProjects();
  const { data: notifications = [] } = useNotifications();
  const [projectsOpen, setProjectsOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const myProjects = projects.filter(p => permissions.canViewProject(p));

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* ── Sidebar ───────────────────────────────────────────── */}
      <aside className="w-64 bg-sidebar flex flex-col flex-shrink-0 overflow-y-auto">

        {/* Logo */}
        <div className="px-5 py-5 flex items-center gap-3 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center flex-shrink-0 shadow-md">
            <CheckSquare className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-sm font-bold text-sidebar-foreground tracking-wide">TaskFlow</span>
            <p className="text-[10px] text-sidebar-foreground/50 leading-none mt-0.5">Dashboard v2.0</p>
          </div>
        </div>

        <div className="mx-4 h-px bg-sidebar-border" />

        {/* Navigation */}
        <nav className="flex-1 px-3 pb-4 space-y-0.5">

          {/* ── Главное ── */}
          <SectionLabel>Главное меню</SectionLabel>
          <NavItem to="/"              icon={LayoutDashboard} label="Главное" />
          <NavItem to="/projects"      icon={FolderKanban}    label="Проекты" />
          {canViewAnalytics && (
            <NavItem to="/analytics"   icon={BarChart3}       label="Аналитика" />
          )}
          <NavItem to="/notifications" icon={Bell}            label="Уведомления" badge={unreadCount} />

          {/* ── Управление ── */}
          <SectionLabel>Управление</SectionLabel>
          {/* <NavItem to="/team"        icon={Users}    label="Команда" /> */}
          {canViewEmployeesWorkload && (
            <NavItem to="/employees" icon={UserRound} label="Сотрудники" />
          )}
          {canViewManagement && (
        <NavItem to="/departments" icon={Building2} label="Отделы" />
          )}
          {canManageUsers && (
            <NavItem to="/users" icon={Shield} label="Пользователи" />
          )}

          {/* ── Настройки ── */}
          <SectionLabel>Система</SectionLabel>
          <NavItem to="/settings" icon={Settings} label="Настройки" />

          {/* ── Мои проекты ── */}
          {myProjects.length > 0 && (
            <>
              <div className="mt-2 mb-0.5">
                <button
                  onClick={() => setProjectsOpen(v => !v)}
                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-semibold text-sidebar-foreground/40 uppercase tracking-widest hover:text-sidebar-foreground/70 transition-colors"
                >
                  {projectsOpen
                    ? <ChevronDown className="w-3 h-3" />
                    : <ChevronRight className="w-3 h-3" />
                  }
                  Мои проекты
                  <span className="ml-auto text-[10px] font-bold opacity-60">{myProjects.length}</span>
                </button>
              </div>

              {projectsOpen && (
                <div className="space-y-0.5 pl-1">
                  {myProjects.map(project => (
                    <ProjectNavItem key={project.id} project={project} />
                  ))}
                </div>
              )}
            </>
          )}
        </nav>

        {/* User info + logout */}
        <div className="p-3 border-t border-sidebar-border flex-shrink-0">
          <p className="text-[10px] font-semibold text-sidebar-foreground/40 uppercase tracking-widest px-1 mb-2">
            Аккаунт
          </p>
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #DB2577, #9333ea)' }}
            >
              {currentUser?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-sidebar-foreground truncate">{currentUser?.name}</p>
              <p className="text-[10px] text-sidebar-foreground/50 truncate">{currentUser?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Выйти"
              className="p-1.5 rounded-md text-sidebar-foreground/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b border-border bg-card flex items-center justify-between px-6 flex-shrink-0 shadow-sm">
          <div className="flex items-center gap-2.5 text-sm">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #DB2577, #9333ea)' }}
            >
              {currentUser?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) ?? '?'}
            </div>
            <span className="font-semibold text-foreground">{currentUser?.name}</span>
            <span className="text-muted-foreground">·</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColors[currentUser?.role ?? '']}`}>
              {roleLabels[currentUser?.role ?? ''] ?? currentUser?.role}
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">{currentUser?.department}</span>
          </div>
          <NotificationCenter />
        </header>
        <main className="flex-1 overflow-auto bg-background p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

// ─── Project nav item ───────────────────────────────────────────────────────
function ProjectNavItem({ project }: { project: { id: string; name: string; department: string } }) {
  const location = useLocation();
  const isActive = location.pathname === `/project/${project.id}`;
  const dotColor = deptDotColors[project.department] ?? 'bg-primary';

  return (
    <Link
      to={`/project/${project.id}`}
      className={cn(
        'flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
        isActive
          ? 'bg-sidebar-primary/80 text-white'
          : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
      )}
    >
      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColor}`} />
      <span className="truncate">{project.name}</span>
    </Link>
  );
}
