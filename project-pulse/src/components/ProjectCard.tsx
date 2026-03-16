import { useNavigate } from 'react-router-dom';
import { Project, Task, User } from '@/types';
import { AlertTriangle, CheckCircle2, ListTodo, Clock, ArrowRight, Users } from 'lucide-react';

const DEPT_COLORS: Record<string, { gradient: string; badge: string }> = {
  Development: { gradient: 'from-blue-500 to-indigo-600', badge: 'bg-blue-50 text-blue-700 border border-blue-200' },
  Design: { gradient: 'from-violet-500 to-purple-600', badge: 'bg-violet-50 text-violet-700 border border-violet-200' },
  Marketing: { gradient: 'from-amber-400 to-orange-500', badge: 'bg-amber-50 text-amber-700 border border-amber-200' },
  Analytics: { gradient: 'from-teal-500 to-cyan-600', badge: 'bg-teal-50 text-teal-700 border border-teal-200' },
  QA: { gradient: 'from-emerald-500 to-green-600', badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
};

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-violet-500', 'bg-emerald-500',
  'bg-amber-500', 'bg-rose-500', 'bg-cyan-500',
];

interface Props {
  project: Project;
  tasks: Task[];
  users: User[];
}

export function ProjectCard({ project, tasks, users }: Props) {
  const navigate = useNavigate();
  const pm = users.find(u => u.id === project.pmId);
  const teamMembers = project.teamMemberIds.map(id => users.find(u => u.id === id)).filter(Boolean) as User[];
  const projectTasks = tasks.filter(t => t.projectId === project.id);
  const overdue = projectTasks.filter(t => t.status !== 'DONE' && new Date(t.dueDate) < new Date()).length;
  const total = projectTasks.length;
  const done = projectTasks.filter(t => t.status === 'DONE').length;
  const inProgress = projectTasks.filter(t => t.status === 'IN_PROGRESS').length;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;
  const colors = DEPT_COLORS[project.department] || DEPT_COLORS.Development;

  return (
    <div
      className="bg-card rounded-xl border border-border/70 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group overflow-hidden flex flex-col"
      onClick={() => navigate(`/project/${project.id}`)}
    >
      {/* Colored gradient top bar */}
      <div className={`h-1 w-full bg-gradient-to-r ${colors.gradient}`} />

      <div className="p-5 flex flex-col flex-1">
        {/* Header: name + badge */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="font-semibold text-base leading-snug group-hover:text-primary transition-colors line-clamp-1">
            {project.name}
          </h3>
          <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap flex-shrink-0 ${colors.badge}`}>
            {project.department}
          </span>
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground line-clamp-2 mb-4">{project.description}</p>

        {/* PM */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary flex-shrink-0">
            {pm?.name.split(' ').map(n => n[0]).join('')}
          </div>
          <span className="text-xs text-muted-foreground">
            ПМ: <span className="font-medium text-foreground">{pm?.name}</span>
          </span>
        </div>

        {/* Team avatars */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex -space-x-2">
            {teamMembers.slice(0, 5).map((user, i) => (
              <div
                key={user.id}
                className={`w-7 h-7 rounded-full border-2 border-card flex items-center justify-center text-[9px] font-bold text-white ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}
                title={user.name}
              >
                {user.name.split(' ').map(n => n[0]).join('')}
              </div>
            ))}
            {teamMembers.length > 5 && (
              <div className="w-7 h-7 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[9px] text-muted-foreground font-semibold">
                +{teamMembers.length - 5}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="w-3 h-3" />
            <span>{teamMembers.length}</span>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-muted-foreground font-medium">Прогресс</span>
            <span className="text-xs font-bold text-foreground">{progress}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${colors.gradient} transition-all duration-500`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Stats footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border/60 mt-auto">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-xs text-muted-foreground" title="Всего задач">
              <ListTodo className="w-3.5 h-3.5" />
              <span className="font-medium">{total}</span>
            </span>
            <span className="flex items-center gap-1 text-xs text-success font-medium" title="Завершено">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{done}</span>
            </span>
            {inProgress > 0 && (
              <span className="flex items-center gap-1 text-xs text-amber-500 font-medium" title="В работе">
                <Clock className="w-3.5 h-3.5" />
                <span>{inProgress}</span>
              </span>
            )}
            {overdue > 0 && (
              <span className="flex items-center gap-1 text-xs text-destructive font-medium animate-pulse-overdue" title="Просрочено">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{overdue}</span>
              </span>
            )}
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>
    </div>
  );
}
