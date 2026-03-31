import { useState } from 'react';
import { Task, User, TaskStatus, Project } from '@/types';
import { Calendar, Clock, MessageSquare, Paperclip, CheckSquare, ChevronDown } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useUpdateTask } from '@/hooks/useData';
import { usePermissions } from '@/hooks/usePermissions';
import { ALLOWED_TRANSITIONS, isTransitionAllowed } from '@/lib/taskStatusTransitions';
import { cn } from '@/lib/utils';

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-violet-500', 'bg-emerald-500',
  'bg-amber-500', 'bg-rose-500', 'bg-cyan-500',
];

const STATUS_CONFIG: Record<TaskStatus, { label: string; dot: string; bg: string; text: string; border: string }> = {
  NEW:         { label: 'Новая',       dot: 'bg-blue-500',    bg: 'bg-blue-500/10',    text: 'text-blue-600',    border: 'border-blue-500/30' },
  IN_PROGRESS: { label: 'В работе',    dot: 'bg-amber-500',   bg: 'bg-amber-500/10',   text: 'text-amber-600',   border: 'border-amber-500/30' },
  REVIEW:      { label: 'На проверке', dot: 'bg-violet-500',  bg: 'bg-violet-500/10',  text: 'text-violet-600',  border: 'border-violet-500/30' },
  DONE:        { label: 'Завершено',   dot: 'bg-emerald-500', bg: 'bg-emerald-500/10', text: 'text-emerald-600', border: 'border-emerald-500/30' },
};

const PRIORITY_CONFIG: Record<string, { label: string; accent: string; textAccent: string; dot: string }> = {
  LOW:    { label: 'Низкий',  accent: 'bg-emerald-500', textAccent: 'text-emerald-600', dot: 'bg-emerald-400' },
  MEDIUM: { label: 'Средний', accent: 'bg-amber-500',   textAccent: 'text-amber-600',   dot: 'bg-amber-400' },
  HIGH:   { label: 'Высокий', accent: 'bg-red-500',     textAccent: 'text-red-600',     dot: 'bg-red-400' },
};

interface Props {
  task: Task;
  users: User[];
  project: Project;
  onClick: () => void;
}

export function MobileTaskCard({ task, users, project, onClick }: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const updateTask = useUpdateTask();
  const { canChangeStatus } = usePermissions();

  const now = new Date();
  const isOverdue = task.status !== 'DONE' && !!task.dueDate && new Date(task.dueDate) < now;
  const overdueDays = isOverdue ? differenceInDays(now, new Date(task.dueDate)) : 0;

  const assignees = task.assigneeIds
    .map(id => users.find(u => u.id === id))
    .filter(Boolean) as User[];

  const totalSubtasks = task.subtaskCount ?? task.subtasks?.length ?? 0;
  const completedSubs =
    task.completedSubtaskCount ?? task.subtasks?.filter(s => s.status === 'DONE').length ?? 0;
  const progress = totalSubtasks > 0 ? Math.round((completedSubs / totalSubtasks) * 100) : 0;

  const commentCount = task.comments?.length ?? 0;
  const attachmentCount = task.attachments?.length ?? 0;

  const statusCfg = STATUS_CONFIG[task.status] ?? STATUS_CONFIG.NEW;
  const priorityCfg = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.MEDIUM;

  const allowedTransitions = ALLOWED_TRANSITIONS[task.status] ?? [];
  const canChange = canChangeStatus(task, project) && allowedTransitions.length > 0;

  const handleStatusChange = (newStatus: TaskStatus) => {
    setSheetOpen(false);
    if (isTransitionAllowed(task.status, newStatus)) {
      updateTask.mutate({ id: task.id, updates: { status: newStatus } });
    }
  };

  const progressColor =
    progress >= 70 ? 'bg-emerald-500' :
    progress >= 40 ? 'bg-amber-400' :
    'bg-red-500';

  const displayTags = (task.tagNames?.length ? task.tagNames : task.tags) ?? [];

  const overdueWord =
    overdueDays === 1 ? 'день' :
    overdueDays >= 2 && overdueDays <= 4 ? 'дня' : 'дней';

  return (
    <>
      <div
        className="relative bg-card rounded-2xl border border-border/60 overflow-hidden active:scale-[0.985] transition-transform duration-100 cursor-pointer shadow-sm"
        onClick={onClick}
      >
        {/* Priority accent stripe — left edge */}
        <div className={cn('absolute left-0 top-0 bottom-0 w-[3px]', priorityCfg.accent)} />

        <div className="pl-4 pr-4 pt-3.5 pb-3 space-y-3">

          {/* Row 1: status button + date */}
          <div className="flex items-center justify-between gap-2">
            <button
              className={cn(
                'flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium border transition-opacity',
                statusCfg.bg,
                statusCfg.text,
                statusCfg.border,
                canChange ? 'active:opacity-60' : 'cursor-default pointer-events-none',
              )}
              onClick={e => {
                e.stopPropagation();
                if (canChange) setSheetOpen(true);
              }}
            >
              <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', statusCfg.dot)} />
              {statusCfg.label}
              {canChange && <ChevronDown className="w-3 h-3 opacity-50 ml-0.5" />}
            </button>

            <div className={cn(
              'flex items-center gap-1 text-[11px] font-medium',
              isOverdue ? 'text-red-500' : 'text-muted-foreground/70',
            )}>
              {isOverdue
                ? <Clock className="w-3 h-3 shrink-0" />
                : <Calendar className="w-3 h-3 shrink-0" />}
              <span>
                {isOverdue
                  ? `+${overdueDays} ${overdueWord}`
                  : task.startDate && task.dueDate
                  ? `${format(new Date(task.startDate), 'dd.MM')} – ${format(new Date(task.dueDate), 'dd.MM')}`
                  : task.dueDate
                  ? format(new Date(task.dueDate), 'dd MMM')
                  : '—'}
              </span>
            </div>
          </div>

          {/* Row 2: title */}
          <h4 className="text-[15px] font-semibold leading-tight line-clamp-2 tracking-tight">
            {task.title}
          </h4>

          {/* Row 3: description */}
          {task.description && (
            <p className="text-[12px] text-muted-foreground/80 leading-relaxed line-clamp-2 -mt-1">
              {task.description}
            </p>
          )}

          {/* Row 4: priority + tags */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={cn('text-[11px] font-semibold tracking-wide uppercase', priorityCfg.textAccent)}>
              {priorityCfg.label}
            </span>
            {displayTags.length > 0 && (
              <>
                <span className="text-border/80">·</span>
                {displayTags.slice(0, 3).map(tag => (
                  <span
                    key={tag}
                    className="text-[11px] px-2 py-0.5 bg-muted/70 text-muted-foreground rounded font-medium"
                  >
                    {tag}
                  </span>
                ))}
                {displayTags.length > 3 && (
                  <span className="text-[11px] text-muted-foreground/60">+{displayTags.length - 3}</span>
                )}
              </>
            )}
          </div>

          {/* Row 5: progress bar */}
          {totalSubtasks > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wide font-medium">Прогресс</span>
                <span className="text-[11px] font-semibold tabular-nums">{progress}%</span>
              </div>
              <div className="h-1 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-500', progressColor)}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-border/40" />

          {/* Row 6: avatars + counters */}
          <div className="flex items-center justify-between -mt-0.5">
            {/* Avatars */}
            <div className="flex items-center gap-2">
              {assignees.length > 0 && (
                <div className="flex -space-x-1.5">
                  {assignees.slice(0, 3).map((u, i) => (
                    <div
                      key={u.id}
                      className={`w-6 h-6 rounded-full border-2 border-card flex items-center justify-center text-[9px] font-bold text-white ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}
                      title={u.name}
                    >
                      {u.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                  ))}
                  {assignees.length > 3 && (
                    <div className="w-6 h-6 rounded-full border-2 border-card bg-muted flex items-center justify-center text-[9px] font-semibold text-muted-foreground">
                      +{assignees.length - 3}
                    </div>
                  )}
                </div>
              )}
              {assignees.length === 0 && (
                <span className="text-[11px] text-muted-foreground/40 italic">Нет исполнителя</span>
              )}
            </div>

            {/* Counters */}
            <div className="flex items-center gap-3">
              {totalSubtasks > 0 && (
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
                  <CheckSquare className="w-3.5 h-3.5" />
                  {completedSubs}/{totalSubtasks}
                </span>
              )}
              {commentCount > 0 && (
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
                  <MessageSquare className="w-3.5 h-3.5" />
                  {commentCount}
                </span>
              )}
              {attachmentCount > 0 && (
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
                  <Paperclip className="w-3.5 h-3.5" />
                  {attachmentCount}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status bottom sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-base">Сменить статус</SheetTitle>
          </SheetHeader>
          <div className="space-y-2 pb-6">
            {allowedTransitions.map(status => {
              const cfg = STATUS_CONFIG[status];
              return (
                <button
                  key={status}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium border transition-opacity active:opacity-70',
                    cfg.bg,
                    cfg.text,
                    cfg.border,
                  )}
                  onClick={() => handleStatusChange(status)}
                >
                  <span className={cn('w-2.5 h-2.5 rounded-full shrink-0', cfg.dot)} />
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
