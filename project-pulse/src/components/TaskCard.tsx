import { Task, User } from '@/types';
import { Calendar, AlertCircle, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

interface Props {
  task: Task;
  users: User[];
  onClick: () => void;
}

const priorityConfig = {
  low:    { label: 'Низкий',   dot: 'bg-emerald-500', border: 'border-l-emerald-400', text: 'text-emerald-600', badge: 'bg-emerald-50 text-emerald-700' },
  medium: { label: 'Средний',  dot: 'bg-amber-500',   border: 'border-l-amber-400',   text: 'text-amber-600',  badge: 'bg-amber-50 text-amber-700' },
  high:   { label: 'Высокий',  dot: 'bg-red-500',     border: 'border-l-red-400',     text: 'text-red-600',    badge: 'bg-red-50 text-red-700' },
};

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-violet-500', 'bg-emerald-500',
  'bg-amber-500', 'bg-rose-500', 'bg-cyan-500',
];

export function TaskCard({ task, users, onClick }: Props) {
  const isOverdue = task.status !== 'DONE' && new Date(task.dueDate) < new Date();
  const assignees = task.assigneeIds.map(id => users.find(u => u.id === id)).filter(Boolean) as User[];
  const priorityKey = (task.priority || '').toLowerCase() as keyof typeof priorityConfig;
  const cfg = priorityConfig[priorityKey] ?? priorityConfig.medium;
  const completedSubtasks = task.subtasks.filter(s => s.status === 'DONE').length;

  return (
    <div
      className={`bg-card rounded-lg border border-border/70 border-l-[3px] ${cfg.border} p-3.5 cursor-pointer hover:shadow-md hover:-translate-y-px transition-all duration-150 group`}
      onClick={onClick}
    >
      {/* Priority + overdue row */}
      <div className="flex items-center justify-between mb-2.5">
        <span className={`flex items-center gap-1.5 text-[11px] font-semibold ${cfg.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} flex-shrink-0`} />
          {cfg.label}
        </span>
        {isOverdue && (
          <div className="flex items-center gap-1 text-destructive animate-pulse-overdue">
            <AlertCircle className="w-3 h-3" />
            <span className="text-[10px] font-semibold">Просрочено</span>
          </div>
        )}
      </div>

      {/* Task title */}
      <h4 className="text-sm font-medium leading-snug mb-2.5 line-clamp-2 group-hover:text-primary transition-colors">
        {task.title}
      </h4>

      {/* Tags */}
      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2.5">
          {task.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-muted rounded-full text-muted-foreground font-medium">
              {tag}
            </span>
          ))}
          {task.tags.length > 3 && (
            <span className="text-[10px] px-1.5 py-0.5 bg-muted rounded-full text-muted-foreground">
              +{task.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer: avatars + subtasks + date */}
      <div className="flex items-center justify-between pt-2.5 border-t border-border/50">
        <div className="flex items-center gap-2">
          {/* Assignee avatars */}
          <div className="flex -space-x-1.5">
            {assignees.slice(0, 3).map((u, i) => (
              <div
                key={u.id}
                className={`w-5 h-5 rounded-full border border-card flex items-center justify-center text-[8px] font-bold text-white ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}
                title={u.name}
              >
                {u.name.split(' ').map(n => n[0]).join('')}
              </div>
            ))}
          </div>
          {/* Subtasks counter */}
          {task.subtasks.length > 0 && (
            <span className="text-[10px] text-muted-foreground font-medium">
              ✓ {completedSubtasks}/{task.subtasks.length}
            </span>
          )}
          {/* Comments count */}
          {task.comments.length > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
              <MessageSquare className="w-3 h-3" />
              {task.comments.length}
            </span>
          )}
        </div>
        <div className={`flex items-center gap-1 ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}>
          <Calendar className="w-3 h-3" />
          <span className="text-[10px] font-medium">
            {task.dueDate ? format(new Date(task.dueDate), 'dd.MM.yy') : '—'}
          </span>
        </div>
      </div>
    </div>
  );
}
