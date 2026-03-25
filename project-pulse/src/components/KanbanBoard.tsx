import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { TaskCard } from './TaskCard';
import { Task, User, TaskStatus, Project } from '@/types';
import { useUpdateTask } from '@/hooks/useData';
import { usePermissions } from '@/hooks/usePermissions';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

const COLUMNS: { id: TaskStatus; label: string; color: string; bg: string; dot: string }[] = [
  { id: 'NEW',       label: 'Новые',       color: 'text-blue-600',   bg: 'bg-blue-50/80',    dot: 'bg-blue-500' },
  { id: 'IN_PROGRESS',label: 'В работе',    color: 'text-amber-600',  bg: 'bg-amber-50/80',   dot: 'bg-amber-500' },
  { id: 'ON_REVIEW', label: 'На проверке', color: 'text-violet-600', bg: 'bg-violet-50/80',  dot: 'bg-violet-500' },
  { id: 'DONE',      label: 'Завершено',   color: 'text-emerald-600',bg: 'bg-emerald-50/80', dot: 'bg-emerald-500' },
];

interface Props {
  tasks: Task[];
  users: User[];
  project: Project;
  onTaskClick: (task: Task) => void;
  onCreateClick: () => void;
  onVoiceCreateClick: () => void;
}

export function KanbanBoard({ tasks, users, project, onTaskClick, onCreateClick, onVoiceCreateClick }: Props) {
  const updateTask = useUpdateTask();
  const { canDragTask, canCreateTask } = usePermissions();

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const taskId = result.draggableId;
    const task = tasks.find(t => t.id === taskId);
    if (!task || !canDragTask(task)) return;
    const newStatus = result.destination.droppableId as TaskStatus;
    if (result.source.droppableId !== newStatus) {
      updateTask.mutate({ id: taskId, updates: { status: newStatus } });
    }
  };

  return (
    <div className="space-y-4">
      {canCreateTask(project) && (
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onVoiceCreateClick} className="gap-2 shadow-sm">
            Голосовая задача
          </Button>
          <Button onClick={onCreateClick} className="gap-2 shadow-sm">
            <Plus className="w-4 h-4" />
            Создать задачу
          </Button>
        </div>
      )}

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 h-[calc(100vh-17rem)] overflow-x-auto pb-2">
          {COLUMNS.map(col => {
            const columnTasks = tasks.filter(t => t.status === col.id);
            return (
              <Droppable droppableId={col.id} key={col.id} isDropDisabled={false}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 min-w-[270px] max-w-[320px] rounded-xl flex flex-col transition-colors ${
                      snapshot.isDraggingOver
                        ? 'bg-primary/5 ring-2 ring-primary/20'
                        : 'bg-muted/40'
                    }`}
                  >
                    {/* Column header */}
                    <div className="flex items-center justify-between px-3 py-3 rounded-t-xl">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${col.dot} flex-shrink-0`} />
                        <h3 className={`font-semibold text-sm ${col.color}`}>{col.label}</h3>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${col.bg} ${col.color}`}>
                        {columnTasks.length}
                      </span>
                    </div>

                    <div className="flex-1 space-y-2 overflow-y-auto px-2 pb-2">
                      {columnTasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index} isDragDisabled={!canDragTask(task)}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`transition-transform ${snapshot.isDragging ? 'opacity-90 rotate-1 scale-105' : ''}`}
                            >
                              <TaskCard task={task} users={users} onClick={() => onTaskClick(task)} />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {columnTasks.length === 0 && !snapshot.isDraggingOver && (
                        <div className="flex items-center justify-center h-16 rounded-lg border-2 border-dashed border-border/50">
                          <span className="text-xs text-muted-foreground/50">Перетащите задачу сюда</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Droppable>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}
