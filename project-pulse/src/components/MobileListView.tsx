import { useState, useCallback, useRef } from 'react';
import { Task, User, Project, TaskStatus } from '@/types';
import { MobileTaskCard } from './MobileTaskCard';
import { Plus, ClipboardList, Mic } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { cn } from '@/lib/utils';

type GroupId = 'OVERDUE' | TaskStatus;

const GROUPS: Array<{
  id: GroupId;
  label: string;
  dot: string;
  headerBg: string;
  headerText: string;
}> = [
  {
    id: 'OVERDUE',
    label: 'Просрочено',
    dot: 'bg-red-500',
    headerBg: 'bg-red-50',
    headerText: 'text-red-700',
  },
  {
    id: 'NEW',
    label: 'Новые',
    dot: 'bg-blue-500',
    headerBg: 'bg-blue-50',
    headerText: 'text-blue-700',
  },
  {
    id: 'IN_PROGRESS',
    label: 'В работе',
    dot: 'bg-amber-500',
    headerBg: 'bg-amber-50',
    headerText: 'text-amber-700',
  },
  {
    id: 'REVIEW',
    label: 'На проверке',
    dot: 'bg-violet-500',
    headerBg: 'bg-violet-50',
    headerText: 'text-violet-700',
  },
  {
    id: 'DONE',
    label: 'Завершено',
    dot: 'bg-emerald-500',
    headerBg: 'bg-emerald-50',
    headerText: 'text-emerald-700',
  },
];

type QuickFilter = 'all' | 'NEW' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';

const QUICK_FILTERS: Array<{ id: QuickFilter; label: string; dot: string }> = [
  { id: 'all',         label: 'Все',           dot: 'bg-gray-400' },
  { id: 'NEW',         label: 'Новые',         dot: 'bg-blue-500' },
  { id: 'IN_PROGRESS', label: 'В работе',      dot: 'bg-amber-500' },
  { id: 'REVIEW',      label: 'На проверке',   dot: 'bg-violet-500' },
  { id: 'DONE',        label: 'Завершено',     dot: 'bg-emerald-500' },
];

interface Props {
  tasks: Task[];
  users: User[];
  project: Project;
  loading?: boolean;
  onTaskClick: (task: Task) => void;
  onCreateClick: () => void;
  onVoiceCreateClick: () => void;
}

// ─── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-card rounded-xl border border-border/70 p-3.5 space-y-3 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-5 w-20 bg-muted rounded-full" />
        <div className="h-5 w-14 bg-muted rounded-full" />
      </div>
      <div className="space-y-1.5">
        <div className="h-3.5 w-full bg-muted rounded" />
        <div className="h-3.5 w-3/4 bg-muted rounded" />
      </div>
      <div className="space-y-1">
        <div className="h-2.5 w-full bg-muted rounded" />
        <div className="h-2.5 w-5/6 bg-muted rounded" />
      </div>
      <div className="flex items-center justify-between pt-1">
        <div className="h-3 w-24 bg-muted rounded" />
        <div className="flex gap-1">
          <div className="h-5 w-5 rounded-full bg-muted" />
          <div className="h-5 w-5 rounded-full bg-muted" />
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function MobileListView({
  tasks,
  users,
  project,
  loading = false,
  onTaskClick,
  onCreateClick,
  onVoiceCreateClick,
}: Props) {
  const { canCreateTask } = usePermissions();
  const [activeFilter, setActiveFilter] = useState<QuickFilter>('all');
  const [refreshing, setRefreshing] = useState(false);
  const touchStartY = useRef(0);

  // Apply quick filter
  const filteredTasks = tasks.filter(task => {
    if (activeFilter === 'all') return true;
    return task.status === activeFilter;
  });

  const isOverdue = (task: Task) =>
    task.status !== 'DONE' && !!task.dueDate && new Date(task.dueDate) < new Date();

  // Group tasks by status (overdue extracted first)
  const grouped: Record<GroupId, Task[]> = {
    OVERDUE:     filteredTasks.filter(t => isOverdue(t)),
    NEW:         filteredTasks.filter(t => t.status === 'NEW' && !isOverdue(t)),
    IN_PROGRESS: filteredTasks.filter(t => t.status === 'IN_PROGRESS' && !isOverdue(t)),
    REVIEW:      filteredTasks.filter(t => t.status === 'REVIEW' && !isOverdue(t)),
    DONE:        filteredTasks.filter(t => t.status === 'DONE'),
  };

  // ─── Pull-to-refresh ────────────────────────────────────────────────────────
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const diff = e.changedTouches[0].clientY - touchStartY.current;
      if (diff > 80 && window.scrollY === 0 && !refreshing && !loading) {
        setRefreshing(true);
        // Visual indicator — actual refetch is handled by React Query's cache invalidation
        setTimeout(() => setRefreshing(false), 800);
      }
    },
    [refreshing, loading],
  );

  const totalCount = filteredTasks.length;

  return (
    <div
      className="relative pb-24"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      {refreshing && (
        <div className="flex items-center justify-center py-2 mb-2">
          <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      )}

      {/* Quick filters — horizontal scroll */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-3 mb-2">
        {QUICK_FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setActiveFilter(f.id)}
            className={cn(
              'shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all duration-150',
              activeFilter === f.id
                ? 'bg-primary text-primary-foreground border-transparent shadow-sm'
                : 'bg-background text-muted-foreground border-border/60',
            )}
          >
            {f.id !== 'all' && (
              <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', f.dot)} />
            )}
            {f.label}
          </button>
        ))}
      </div>

      {/* Skeleton loading state */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && totalCount === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <ClipboardList className="w-8 h-8 text-muted-foreground/50" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Нет задач</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            {activeFilter !== 'all' ? 'Попробуйте изменить фильтр' : 'Создайте первую задачу'}
          </p>
        </div>
      )}

      {/* Status groups */}
      {!loading && totalCount > 0 && (
        <div className="space-y-6">
          {GROUPS.map(group => {
            const groupTasks = grouped[group.id];
            if (!groupTasks || groupTasks.length === 0) return null;

            return (
              <div key={group.id}>
                {/* Group header */}
                <div className="flex items-center gap-2 mb-3">
                  <span className={cn('w-2.5 h-2.5 rounded-full shrink-0', group.dot)} />
                  <span className={cn('text-sm font-semibold', group.headerText)}>
                    {group.label}
                  </span>
                  <span
                    className={cn(
                      'text-[11px] font-semibold px-2 py-0.5 rounded-full',
                      group.headerBg,
                      group.headerText,
                    )}
                  >
                    {groupTasks.length}
                  </span>
                </div>

                {/* Task cards */}
                <div className="space-y-2.5">
                  {groupTasks.map(task => (
                    <MobileTaskCard
                      key={task.id}
                      task={task}
                      users={users}
                      project={project}
                      onClick={() => onTaskClick(task)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FABs — voice task + create task */}
      {canCreateTask(project) && (
        <div className="fixed bottom-6 right-4 z-30 flex flex-col items-center gap-3">
          <button
            onClick={onVoiceCreateClick}
            className="w-12 h-12 rounded-full bg-muted text-foreground border border-border shadow-lg flex items-center justify-center active:scale-95 transition-transform duration-100"
            aria-label="Голосовая задача"
          >
            <Mic className="w-5 h-5" />
          </button>
          <button
            onClick={onCreateClick}
            className="w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-xl flex items-center justify-center active:scale-95 transition-transform duration-100"
            aria-label="Создать задачу"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
}
