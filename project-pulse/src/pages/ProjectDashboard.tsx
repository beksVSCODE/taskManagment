import { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useProject, useTasks, useUsers, useUpdateProject, useDeleteProject } from '@/hooks/useData';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/hooks/use-toast';
import { KanbanBoard } from '@/components/KanbanBoard';
import { TaskDetailPanel } from '@/components/TaskDetailPanel';
import { CreateTaskModal } from '@/components/CreateTaskModal';
import { VoiceTaskModal } from '@/components/VoiceTaskModal';
import { TaskFilters, FilterState, defaultFilters } from '@/components/TaskFilters';
import { AnalyticsView } from '@/components/AnalyticsView';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Task, Priority } from '@/types';
import { ArrowLeft, Kanban, BarChart3, Calendar, Pencil, Check, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ProjectDashboard() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { data: project } = useProject(id!);
  const { data: tasks = [], isLoading: tasksLoading } = useTasks(id!);
  const { data: users = [] } = useUsers();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const permissions = usePermissions();
  const { toast } = useToast();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [editingDeadline, setEditingDeadline] = useState(false);
  const [deadlineValue, setDeadlineValue] = useState('');
  const taskIdFromQuery = searchParams.get('taskId');

  const handleDeleteProject = () => {
    if (!confirm(
      `Удалить проект «${project?.name}»?\n\nБудут удалены все задачи, комментарии, вложения и история. Это действие нельзя отменить.`
    )) return;
    deleteProject.mutate(id!, {
      onSuccess: () => {
        toast({ title: 'Проект удалён', description: 'Все данные удалены.' });
        navigate('/projects');
      },
      onError: (err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Ошибка удаления';
        toast({ title: 'Не удалось удалить проект', description: msg, variant: 'destructive' });
      },
    });
  };

  useEffect(() => {
    if (!taskIdFromQuery) return;
    const taskFromQuery = tasks.find(t => t.id === taskIdFromQuery);
    if (!taskFromQuery) return;
    setSelectedTask(prev => (prev?.id === taskFromQuery.id ? prev : taskFromQuery));
  }, [taskIdFromQuery, tasks]);

  const openTask = (task: Task) => {
    setSelectedTask(task);
    const next = new URLSearchParams(searchParams);
    next.set('taskId', task.id);
    setSearchParams(next, { replace: true });
  };

  const closeTask = () => {
    setSelectedTask(null);
    const next = new URLSearchParams(searchParams);
    next.delete('taskId');
    setSearchParams(next, { replace: true });
  };

  const filteredTasks = useMemo(() => {
    let result = [...tasks];
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(t => t.title.toLowerCase().includes(q) || t.tags.some(tag => tag.toLowerCase().includes(q)));
    }
    if (filters.priority !== 'all') result = result.filter(t => t.priority === filters.priority);
    if (filters.assigneeId !== 'all') result = result.filter(t => t.assigneeIds.includes(filters.assigneeId));
    if (filters.dateFrom) result = result.filter(t => new Date(t.dueDate) >= filters.dateFrom!);
    if (filters.dateTo) result = result.filter(t => new Date(t.dueDate) <= filters.dateTo!);

    const priorityOrder: Record<Priority, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    result.sort((a, b) => {
      const dir = filters.sortOrder === 'asc' ? 1 : -1;
      switch (filters.sortBy) {
        case 'priority': return (priorityOrder[a.priority] - priorityOrder[b.priority]) * dir;
        case 'dueDate': return (new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()) * dir;
        default: return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir;
      }
    });
    return result;
  }, [tasks, filters]);

  if (!project) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Загрузка...</p>
      </div>
    </div>
  );

  const currentSelectedTask = selectedTask ? tasks.find(t => t.id === selectedTask.id) || selectedTask : null;

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex items-start gap-2 sm:gap-3">
        <Link to="/projects">
          <Button variant="ghost" size="icon" className="rounded-lg h-9 w-9">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold truncate">{project.name}</h1>
          <p className="text-sm text-muted-foreground truncate">{project.description}</p>
          {/* Deadline */}
          <div className="flex items-center gap-2 mt-1">
            {!editingDeadline ? (
              <>
                {project.deadline ? (
                  <span className={`flex items-center gap-1 text-xs ${
                    new Date(project.deadline) < new Date() ? 'text-destructive font-medium' : 'text-muted-foreground'
                  }`}>
                    <Calendar className="w-3 h-3" />
                    Дедлайн: {new Date(project.deadline).toLocaleDateString('ru', { day: '2-digit', month: 'short', year: 'numeric' })}
                    {new Date(project.deadline) < new Date() && <span className="text-[10px]">(просрочен)</span>}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground/60">
                    <Calendar className="w-3 h-3" />
                    Дедлайн не задан
                  </span>
                )}
                <button
                  className="text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                  onClick={() => { setDeadlineValue(project.deadline ?? ''); setEditingDeadline(true); }}
                  title="Изменить дедлайн"
                >
                  <Pencil className="w-3 h-3" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-1.5">
                <Input
                  type="date"
                  value={deadlineValue}
                  onChange={e => setDeadlineValue(e.target.value)}
                  className="h-7 text-xs w-40"
                  autoFocus
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  disabled={updateProject.isPending}
                  onClick={() => {
                    updateProject.mutate(
                      { id: project.id, updates: { deadline: deadlineValue || undefined } },
                      { onSuccess: () => setEditingDeadline(false) }
                    );
                  }}
                >
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => setEditingDeadline(false)}
                >
                  <X className="w-3.5 h-3.5 text-destructive" />
                </Button>
              </div>
            )}
          </div>
        </div>
        {/* Кнопка удаления проекта */}
        {permissions.canDeleteProject && (
          <Button
            variant="ghost"
            size="icon"
            className="rounded-lg h-9 w-9 text-destructive/60 hover:text-destructive hover:bg-destructive/10 shrink-0"
            title="Удалить проект"
            disabled={deleteProject.isPending}
            onClick={handleDeleteProject}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      <Tabs defaultValue="kanban">
        <TabsList className="bg-muted/60 p-1 rounded-lg w-full sm:w-auto grid grid-cols-2 sm:inline-flex h-auto">
          <TabsTrigger value="kanban" className="gap-2 rounded-md text-sm data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <Kanban className="w-3.5 h-3.5" />
            Kanban
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2 rounded-md text-sm data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <BarChart3 className="w-3.5 h-3.5" />
            Аналитика
          </TabsTrigger>
        </TabsList>

        <TabsContent value="kanban" className="space-y-4 mt-4">
          <TaskFilters filters={filters} onChange={setFilters} users={users} />
          <KanbanBoard
            tasks={filteredTasks}
            users={users}
            project={project}
            loading={tasksLoading}
            onTaskClick={openTask}
            onCreateClick={() => setCreateOpen(true)}
            onVoiceCreateClick={() => setVoiceOpen(true)}
          />
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <AnalyticsView tasks={tasks} users={users} />
        </TabsContent>
      </Tabs>

      <TaskDetailPanel task={currentSelectedTask} project={project} open={!!selectedTask} onClose={closeTask} />
      <CreateTaskModal open={createOpen} onClose={() => setCreateOpen(false)} project={project} />
      <VoiceTaskModal open={voiceOpen} onClose={() => setVoiceOpen(false)} project={project} />
    </div>
  );
}
