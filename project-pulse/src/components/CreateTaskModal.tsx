import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { User, Priority, Project } from '@/types';
import { useCreateTask, useUsers } from '@/hooks/useData';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { CalendarIcon, Plus, X, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const tagOptions = ['frontend', 'backend', 'design', 'bug', 'feature', 'urgent', 'research', 'docs', 'testing', 'refactoring', 'UX', 'API', 'database', 'security', 'performance'];

interface Props {
  open: boolean;
  onClose: () => void;
  project: Project;
}

export function CreateTaskModal({ open, onClose, project }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState<Date>();
  const [startDate, setStartDate] = useState<Date>();
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [newSubtask, setNewSubtask] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { currentUser } = useAuth();
  const { data: users = [] } = useUsers();
  const createTask = useCreateTask();

  const teamMembers = users.filter(u =>
    u.department === project.department || u.id === project.pmId
  );

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Название обязательно';
    if (!dueDate) errs.dueDate = 'Укажите срок';
    else if (dueDate < new Date(new Date().setHours(0, 0, 0, 0))) errs.dueDate = 'Срок не может быть в прошлом';
    if (assigneeIds.length === 0) errs.assignees = 'Выберите хотя бы одного исполнителя';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const resetForm = () => {
    setTitle(''); setDescription(''); setPriority('MEDIUM');
    setAssigneeIds([]); setDueDate(undefined); setStartDate(undefined);
    setTags([]); setSubtasks([]); setErrors({}); setNewTag(''); setNewSubtask('');
  };

  const handleSubmit = () => {
    if (!validate()) return;
    createTask.mutate({
      projectId: project.id,
      title: title.trim(),
      description,
      status: 'NEW',
      priority,
      creatorId: currentUser?.id ?? '',
      assigneeIds,
      watcherIds: [currentUser?.id ?? ''],
      startDate: startDate?.toISOString().split('T')[0],
      dueDate: dueDate!.toISOString().split('T')[0],
      completedAt: undefined,
      tags,
      subtasks: subtasks.filter(s => s.trim()).map((s, i) => ({
        id: `new-st-${i}`, title: s, status: 'NEW' as const,
      })),
      comments: [],
      attachments: [],
    });
    resetForm();
    onClose();
  };

  const toggleAssignee = (id: string) => {
    setAssigneeIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags(prev => [...prev, newTag.trim()]);
      setNewTag('');
    }
  };

  const addSubtask = () => {
    if (newSubtask.trim()) {
      setSubtasks(prev => [...prev, newSubtask.trim()]);
      setNewSubtask('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => { resetForm(); onClose(); }}>
      <DialogContent className="w-[calc(100vw-1rem)] sm:w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-2xl p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Создать задачу</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Title */}
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Название *</Label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Название задачи"
              className="mt-1.5 rounded-lg"
            />
            {errors.title && <p className="text-xs text-destructive mt-1">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Описание</Label>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Описание задачи..."
              rows={3}
              className="mt-1.5 rounded-lg resize-none"
            />
          </div>

          {/* Priority */}
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Приоритет</Label>
            <Select value={priority} onValueChange={v => setPriority(v as Priority)}>
              <SelectTrigger className="mt-1.5 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">
                  <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500" />Низкий</span>
                </SelectItem>
                <SelectItem value="MEDIUM">
                  <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-500" />Средний</span>
                </SelectItem>
                <SelectItem value="HIGH">
                  <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500" />Высокий</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Assignees */}
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Исполнители * <span className="normal-case font-normal text-muted-foreground/70">— отдел {project.department}</span>
            </Label>
            <div className="flex flex-wrap gap-2 mt-1.5 p-3 border border-border rounded-lg bg-muted/20">
              {teamMembers.map((user) => (
                <div
                  key={user.id}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm cursor-pointer transition-all",
                    assigneeIds.includes(user.id)
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-card border border-border hover:border-primary/40 hover:bg-primary/5"
                  )}
                  onClick={() => toggleAssignee(user.id)}
                >
                  <div className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold",
                    assigneeIds.includes(user.id) ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                  )}>
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <span className="text-xs font-medium">{user.name}</span>
                </div>
              ))}
            </div>
            {errors.assignees && <p className="text-xs text-destructive mt-1">{errors.assignees}</p>}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Дата начала</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start mt-1.5 rounded-lg h-9 text-sm", !startDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                    {startDate ? format(startDate, 'dd.MM.yyyy') : 'Выберите дату'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                  <Calendar mode="single" selected={startDate} onSelect={setStartDate} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Срок выполнения *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start mt-1.5 rounded-lg h-9 text-sm", !dueDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                    {dueDate ? format(dueDate, 'dd.MM.yyyy') : 'Выберите дату'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              {errors.dueDate && <p className="text-xs text-destructive mt-1">{errors.dueDate}</p>}
            </div>
          </div>

          {/* Tags */}
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Теги</Label>
            <div className="flex flex-wrap gap-1.5 mb-2 mt-1.5">
              {tags.map(tag => (
                <span key={tag} className="flex items-center gap-1 text-xs px-2.5 py-1 bg-muted rounded-full font-medium text-muted-foreground">
                  {tag}
                  <X className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={() => setTags(prev => prev.filter(t => t !== tag))} />
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Select onValueChange={v => { if (!tags.includes(v)) setTags(prev => [...prev, v]); }}>
                <SelectTrigger className="flex-1 rounded-lg text-sm"><SelectValue placeholder="Выберите тег" /></SelectTrigger>
                <SelectContent>
                  {tagOptions.filter(t => !tags.includes(t)).map(tag => (
                    <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-1.5 w-full sm:w-auto">
                <Input
                  value={newTag}
                  onChange={e => setNewTag(e.target.value)}
                  placeholder="Новый тег"
                  className="w-full sm:w-32 rounded-lg text-sm"
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button variant="outline" size="icon" onClick={addTag} className="rounded-lg h-9 w-9 flex-shrink-0">
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Subtasks */}
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Подзадачи</Label>
            <div className="space-y-1.5 mt-1.5">
              {subtasks.map((st, i) => (
                <div key={i} className="flex items-center gap-2 bg-muted/40 px-3 py-2 rounded-lg">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 flex-shrink-0" />
                  <span className="text-sm flex-1">{st}</span>
                  <Button variant="ghost" size="icon" className="h-5 w-5 rounded" onClick={() => setSubtasks(prev => prev.filter((_, j) => j !== i))}>
                    <Trash2 className="w-3 h-3 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <Input
                value={newSubtask}
                onChange={e => setNewSubtask(e.target.value)}
                placeholder="Новая подзадача"
                className="rounded-lg text-sm"
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSubtask())}
              />
              <Button variant="outline" size="icon" onClick={addSubtask} className="rounded-lg h-9 w-9 flex-shrink-0">
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-2 gap-2">
          <Button variant="outline" onClick={() => { resetForm(); onClose(); }} className="rounded-lg">
            Отменить
          </Button>
          <Button onClick={handleSubmit} className="rounded-lg">
            Сохранить задачу
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
