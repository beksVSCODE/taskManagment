import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Task, User, TaskStatus, Project } from '@/types';
import { useUpdateTask, useDeleteTask, useAddComment, useUsers, useAddSubtask, useUpdateSubtask, useDeleteSubtask } from '@/hooks/useData';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';
import { format, formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Trash2, MessageSquare, Clock, History, CheckSquare, AlertCircle, Send, Plus, X } from 'lucide-react';

interface Props {
  task: Task | null;
  project?: Project;
  open: boolean;
  onClose: () => void;
}

const statusLabels: Record<TaskStatus, string> = { NEW: 'Новые', IN_PROGRESS: 'В работе', ON_REVIEW: 'На проверке', DONE: 'Завершено' };
const priorityLabels: Record<string, string> = { LOW: 'Низкий', MEDIUM: 'Средний', HIGH: 'Высокий' };
const priorityStyles: Record<string, string> = { LOW: 'text-priority-low', MEDIUM: 'text-priority-medium', HIGH: 'text-priority-high' };

export function TaskDetailPanel({ task, project, open, onClose }: Props) {
  const [commentText, setCommentText] = useState('');
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [showAddSubtask, setShowAddSubtask] = useState(false);
  const [newSubtask, setNewSubtask] = useState<{ title: string; assigneeId: string; dueDate: string }>({
    title: '', assigneeId: '', dueDate: '',
  });

  const { currentUser } = useAuth();
  const { data: users = [] } = useUsers();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const addComment = useAddComment();
  const addSubtask = useAddSubtask();
  const updateSubtask = useUpdateSubtask();
  const deleteSubtask = useDeleteSubtask();
  const permissions = usePermissions();

  if (!task) return null;

  const canEdit = permissions.canEditTask(task, project);
  const canChangeStatus = permissions.canChangeStatus(task, project);
  const canDelete = permissions.canDeleteTask(task, project);
  const canChangePriority = permissions.canChangePriority(project);
  const canCreateSubtask = permissions.canCreateSubtask(project);
  const canChangeSubtaskStatus = permissions.canChangeSubtaskStatus(project);
  const canDeleteSubtask = permissions.canDeleteSubtask();
  const isOverdue = task.status !== 'DONE' && new Date(task.dueDate) < new Date();
  const assignees = task.assigneeIds.map(id => users.find(u => u.id === id)).filter(Boolean) as User[];

  const handleStatusChange = (status: TaskStatus) => {
    updateTask.mutate({ id: task.id, updates: { status } });
  };

  const handlePriorityChange = (priority: string) => {
    updateTask.mutate({ id: task.id, updates: { priority: priority as Task['priority'] } });
  };

  const handleDelete = () => {
    if (confirm('Удалить задачу?')) {
      deleteTask.mutate(task.id);
      onClose();
    }
  };

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    addComment.mutate({ taskId: task.id, authorId: currentUser.id, text: commentText });
    setCommentText('');
    setShowMentions(false);
  };

  const handleSubtaskToggle = (subtaskId: string) => {
    if (!canChangeSubtaskStatus) return;
    const st = task.subtasks.find(s => s.id === subtaskId);
    if (!st) return;
    updateSubtask.mutate({
      taskId: task.id,
      subtaskId,
      updates: { status: st.status === 'DONE' ? 'NEW' : 'DONE' },
    });
  };

  const handleAddSubtask = () => {
    if (!newSubtask.title.trim()) return;
    addSubtask.mutate({
      taskId: task.id,
      subtaskData: {
        title: newSubtask.title.trim(),
        assigneeId: newSubtask.assigneeId || undefined,
        status: 'NEW',
        dueDate: newSubtask.dueDate ? new Date(newSubtask.dueDate).toISOString() : undefined,
      },
    });
    setNewSubtask({ title: '', assigneeId: '', dueDate: '' });
    setShowAddSubtask(false);
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    deleteSubtask.mutate({ taskId: task.id, subtaskId });
  };

  const handleCommentInput = (value: string) => {
    setCommentText(value);
    const lastAt = value.lastIndexOf('@');
    if (lastAt !== -1) {
      const afterAt = value.slice(lastAt + 1);
      if (!afterAt.includes(' ')) {
        setShowMentions(true);
        setMentionFilter(afterAt);
        return;
      }
    }
    setShowMentions(false);
  };

  const insertMention = (user: User) => {
    const lastAt = commentText.lastIndexOf('@');
    setCommentText(commentText.slice(0, lastAt) + `@${user.name} `);
    setShowMentions(false);
  };

  const filteredMentionUsers = users.filter(u =>
    u.name.toLowerCase().includes(mentionFilter.toLowerCase())
  );

  return (
    <Sheet open={open} onOpenChange={() => onClose()}>
      <SheetContent className="w-[600px] sm:max-w-[600px] p-0 flex flex-col">
        <SheetHeader className="p-6 pb-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <SheetTitle className="text-xl">{task.title}</SheetTitle>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {canChangeStatus ? (
                  <Select value={task.status} onValueChange={(v) => handleStatusChange(v as TaskStatus)}>
                    <SelectTrigger className="w-[140px] h-7 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant="secondary">{statusLabels[task.status]}</Badge>
                )}
                {canChangePriority ? (
                  <Select value={task.priority} onValueChange={handlePriorityChange}>
                    <SelectTrigger className={`w-[120px] h-7 text-xs border-dashed ${priorityStyles[task.priority]}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(priorityLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant="outline" className={priorityStyles[task.priority]}>{priorityLabels[task.priority]}</Badge>
                )}
                {isOverdue && (
                  <Badge variant="destructive" className="animate-pulse-overdue gap-1">
                    <AlertCircle className="w-3 h-3" /> Просрочено
                  </Badge>
                )}
              </div>
            </div>
            {canDelete && (
              <Button variant="ghost" size="icon" onClick={handleDelete} className="text-destructive hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6">
          <div className="space-y-5 py-4">
            <div>
              <h4 className="text-sm font-medium mb-1">Описание</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{task.description || 'Нет описания'}</p>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Исполнители:</span>
                <div className="mt-1 space-y-1">
                  {assignees.map(u => (
                    <div key={u.id} className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[8px] font-medium text-primary">
                        {u.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span>{u.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Создатель:</span>
                <p className="mt-1">{users.find(u => u.id === task.creatorId)?.name}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Создана:</span>
                <p className="mt-1">{format(new Date(task.createdAt), 'dd.MM.yyyy')}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Срок:</span>
                <p className={`mt-1 ${isOverdue ? 'text-destructive font-medium' : ''}`}>
                  {format(new Date(task.dueDate), 'dd.MM.yyyy')}
                </p>
              </div>
              {task.completedAt && (
                <div>
                  <span className="text-muted-foreground">Завершена:</span>
                  <p className="mt-1">{format(new Date(task.completedAt), 'dd.MM.yyyy')}</p>
                </div>
              )}
            </div>

            {task.tags.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Теги</h4>
                <div className="flex flex-wrap gap-1">
                  {task.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <CheckSquare className="w-4 h-4" />
                  Подзадаफ़и ({task.subtasks.filter(s => s.status === 'DONE').length}/{task.subtasks.length})
                </h4>
                {canCreateSubtask && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() => setShowAddSubtask(v => !v)}
                  >
                    <Plus className="w-3 h-3" />
                    Добавить
                  </Button>
                )}
              </div>

              {task.subtasks.length > 0 && (
                <div className="mb-3 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${(task.subtasks.filter(s => s.status === 'DONE').length / task.subtasks.length) * 100}%` }}
                  />
                </div>
              )}

              {task.subtasks.length === 0 && !showAddSubtask && (
                <p className="text-sm text-muted-foreground">Нет подзадач</p>
              )}

              <div className="space-y-1">
                {task.subtasks.map(st => {
                  const stAssignee = users.find(u => u.id === st.assigneeId);
                  const isStOverdue = st.status !== 'DONE' && st.dueDate && new Date(st.dueDate) < new Date();
                  return (
                    <div key={st.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 group">
                      <Checkbox
                        checked={st.status === 'DONE'}
                        onCheckedChange={() => handleSubtaskToggle(st.id)}
                        disabled={!canChangeSubtaskStatus}
                      />
                      <span className={`text-sm flex-1 min-w-0 truncate ${st.status === 'DONE' ? 'line-through text-muted-foreground' : ''}`}>
                        {st.title}
                      </span>
                      {stAssignee && (
                        <div
                          className="w-5 h-5 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center text-[8px] font-medium text-primary"
                          title={stAssignee.name}
                        >
                          {stAssignee.name.split(' ').map(n => n[0]).join('')}
                        </div>
                      )}
                      {st.dueDate && (
                        <span className={`text-xs flex-shrink-0 ${isStOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                          {format(new Date(st.dueDate), 'dd.MM')}
                        </span>
                      )}
                      {canDeleteSubtask && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 flex-shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteSubtask(st.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>

              {showAddSubtask && canCreateSubtask && (
                <div className="mt-2 p-3 border rounded-md space-y-2 bg-muted/30">
                  <Input
                    placeholder="Название подзадачи"
                    value={newSubtask.title}
                    onChange={e => setNewSubtask(s => ({ ...s, title: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && handleAddSubtask()}
                    autoFocus
                    className="h-8 text-sm"
                  />
                  <div className="flex gap-2">
                    <Select
                      value={newSubtask.assigneeId}
                      onValueChange={v => setNewSubtask(s => ({ ...s, assigneeId: v }))}
                    >
                      <SelectTrigger className="flex-1 h-8 text-xs">
                        <SelectValue placeholder="Исполнитель" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map(u => (
                          <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="date"
                      className="flex-1 h-8 text-xs"
                      value={newSubtask.dueDate}
                      onChange={e => setNewSubtask(s => ({ ...s, dueDate: e.target.value }))}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="h-7 text-xs" onClick={handleAddSubtask} disabled={!newSubtask.title.trim()}>
                      Добавить
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      onClick={() => { setShowAddSubtask(false); setNewSubtask({ title: '', assigneeId: '', dueDate: '' }); }}
                    >
                      <X className="w-3 h-3 mr-1" />
                      Отмена
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Комментарии ({task.comments.length})
              </h4>

              <div className="relative mb-4">
                <Textarea
                  placeholder="Написать комментарий... (@ для упоминания)"
                  value={commentText}
                  onChange={e => handleCommentInput(e.target.value)}
                  className="pr-12 min-h-[60px]"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute bottom-2 right-2 h-7 w-7"
                  onClick={handleAddComment}
                  disabled={!commentText.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>

                {showMentions && filteredMentionUsers.length > 0 && (
                  <div className="absolute bottom-full left-0 w-full bg-popover border rounded-md shadow-lg mb-1 max-h-32 overflow-y-auto z-50">
                    {filteredMentionUsers.slice(0, 5).map(u => (
                      <div
                        key={u.id}
                        className="px-3 py-2 text-sm hover:bg-accent cursor-pointer"
                        onClick={() => insertMention(u)}
                      >
                        {u.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {[...task.comments].reverse().map(comment => {
                  const author = users.find(u => u.id === comment.authorId);
                  return (
                    <div key={comment.id} className="flex gap-3">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center text-[9px] font-medium text-primary">
                        {author?.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{author?.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: ru })}
                          </span>
                        </div>
                        <p className="text-sm mt-0.5">{comment.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <Separator />

            <div className="pb-4">
              <button
                className="text-sm font-medium flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowAuditLog(!showAuditLog)}
              >
                <History className="w-4 h-4" />
                История изменений ({task.auditLog.length})
              </button>
              {showAuditLog && (
                <div className="mt-2 space-y-2">
                  {[...task.auditLog].reverse().map(event => {
                    const user = users.find(u => u.id === event.userId);
                    return (
                      <div key={event.id} className="text-xs text-muted-foreground flex items-start gap-2">
                        <Clock className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span>
                          <strong>{user?.name}</strong> {event.action}
                          {event.field && ` поле "${event.field}"`}
                          {' · '}
                          {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true, locale: ru })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
