import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Task, User, Project, Priority } from '@/types';
import { useUpdateTask, useUsers } from '@/hooks/useData';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onClose: () => void;
  task: Task;
  project?: Project;
}

export function EditTaskModal({ open, onClose, task, project }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<Date>();
  const [dueDate, setDueDate] = useState<Date>();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: users = [] } = useUsers();
  const updateTask = useUpdateTask();
  const { toast } = useToast();

  const teamMembers = project
    ? users.filter(u => project.teamMemberIds?.includes(u.id) ?? false)
    : users.filter(u => u.role === 'TEAM');

  // Инициализация формы из задачи при открытии
  useEffect(() => {
    if (open && task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setPriority(task.priority);
      setAssigneeIds(task.assigneeIds);
      setStartDate(task.startDate ? new Date(task.startDate) : undefined);
      setDueDate(task.dueDate ? new Date(task.dueDate) : undefined);
      setErrors({});
    }
  }, [open, task]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Название обязательно';
    if (!dueDate) errs.dueDate = 'Укажите срок';
    else if (dueDate < new Date(new Date().setHours(0, 0, 0, 0))) {
      errs.dueDate = 'Срок не может быть в прошлом';
    }
    if (assigneeIds.length === 0) errs.assignees = 'Выберите хотя бы одного исполнителя';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const updates: Partial<Task> = {
      title: title.trim(),
      description,
      priority,
      assigneeIds,
      startDate: startDate?.toISOString().split('T')[0],
      dueDate: dueDate?.toISOString().split('T')[0],
    };

    updateTask.mutate(
      { id: task.id, updates },
      {
        onSuccess: () => {
          toast({
            title: 'Задача обновлена',
            description: 'Изменения успешно сохранены',
            variant: 'default',
          });
          onClose();
        },
        onError: (err) => {
          toast({
            title: 'Не удалось обновить задачу',
            description: err instanceof Error ? err.message : 'Попробуйте ещё раз',
            variant: 'destructive',
          });
        },
      }
    );
  };

  const toggleAssignee = (id: string) => {
    setAssigneeIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  return (
    <Dialog open={open} onOpenChange={() => { onClose(); }}>
      <DialogContent className="w-[calc(100vw-1rem)] sm:w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-2xl p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Редактировать задачу</DialogTitle>
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
              Исполнители * <span className="normal-case font-normal text-muted-foreground/70">— отдел {project?.department}</span>
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

          {/* Start Date */}
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
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Due Date */}
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

        <DialogFooter className="pt-2 gap-2">
          <Button variant="outline" onClick={onClose} className="rounded-lg">
            Отменить
          </Button>
          <Button onClick={handleSubmit} className="rounded-lg" disabled={updateTask.isPending}>
            {updateTask.isPending ? 'Сохранение...' : 'Сохранить изменения'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
