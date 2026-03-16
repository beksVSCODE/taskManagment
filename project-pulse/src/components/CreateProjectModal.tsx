import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateProject, useUsers, useDepartments } from '@/hooks/useData';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CreateProjectModal({ open, onClose }: Props) {
  const [name, setName]               = useState('');
  const [description, setDescription] = useState('');
  const [pmId, setPmId]               = useState('');
  const [deptId, setDeptId]           = useState('');
  const [errors, setErrors]           = useState<Record<string, string>>({});

  const { currentUser }            = useAuth();
  const { data: users = [] }       = useUsers();
  const { data: departments = [] } = useDepartments();
  const createProject              = useCreateProject();

  const isAdmin   = currentUser?.role === 'ADMIN';
  const isManager = currentUser?.role === 'MANAGER';
  const isPm      = currentUser?.role === 'PM';

  // Для MANAGER: фильтруем PM по своему отделу;
  // для ADMIN: по выбранному отделу (или все PM если отдел не выбран)
  const pmCandidates = useMemo(() => {
    const allPMs = users.filter(u => u.role === 'PM');
    if (isManager && currentUser?.departmentId) {
      return allPMs.filter(u => u.departmentId === currentUser.departmentId);
    }
    if (isAdmin && deptId) {
      return allPMs.filter(u => u.departmentId === Number(deptId));
    }
    return allPMs;
  }, [users, isAdmin, isManager, currentUser?.departmentId, deptId]);

  const managerDeptName = useMemo(() => {
    if ((!isManager && !isPm) || !currentUser?.departmentId) return null;
    return departments.find(d => d.id === currentUser.departmentId)?.name ?? null;
  }, [isManager, isPm, currentUser?.departmentId, departments]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Название обязательно';
    // PM назначается сам — поле pmId не нужно
    if (!isPm && !pmId) errs.pmId = 'Назначьте PM';
    if (isAdmin && !deptId) errs.deptId = 'Выберите отдел';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const reset = () => {
    setName(''); setDescription(''); setPmId(''); setDeptId(''); setErrors({});
  };

  // Сбрасываем PM при смене отдела
  const handleDeptChange = (v: string) => {
    setDeptId(v);
    setPmId('');
  };

  const handleSubmit = () => {
    if (!validate()) return;
    createProject.mutate(
      {
        name: name.trim(),
        description,
        department: '',
        departmentId: deptId ? Number(deptId) : undefined,
        // PM назначает себя сам (backend игнорирует pmId для роли PM)
        pmId: isPm ? (currentUser?.id ?? '') : pmId,
        teamMemberIds: [],
      },
      {
        onSuccess: () => { reset(); onClose(); },
        onError: (err: unknown) => {
          const msg = err instanceof Error ? err.message : 'Ошибка создания проекта';
          setErrors(prev => ({ ...prev, submit: msg }));
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) { reset(); onClose(); } }}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Новый проект</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Название */}
          <div className="space-y-1.5">
            <Label htmlFor="proj-name">Название <span className="text-destructive">*</span></Label>
            <Input
              id="proj-name"
              placeholder="Название проекта"
              value={name}
              onChange={e => setName(e.target.value)}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          {/* Описание */}
          <div className="space-y-1.5">
            <Label htmlFor="proj-desc">Описание</Label>
            <Textarea
              id="proj-desc"
              placeholder="Краткое описание проекта"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          {/* Отдел */}
          {isAdmin ? (
            <div className="space-y-1.5">
              <Label>Отдел <span className="text-destructive">*</span></Label>
              <Select value={deptId} onValueChange={handleDeptChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите отдел" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map(d => (
                    <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.deptId && <p className="text-xs text-destructive">{errors.deptId}</p>}
            </div>
          ) : (isManager || isPm) && managerDeptName ? (
            <div className="space-y-1.5">
              <Label>Отдел</Label>
              <div className="px-3 py-2 rounded-md border bg-muted/40 text-sm text-muted-foreground">
                {managerDeptName}
              </div>
            </div>
          ) : null}

          {/* PM — только для ADMIN и MANAGER; PM назначает себя сам */}
          {!isPm && (
            <div className="space-y-1.5">
              <Label>Назначить PM <span className="text-destructive">*</span></Label>
              <Select value={pmId} onValueChange={setPmId}
                disabled={isAdmin && !deptId}>
                <SelectTrigger>
                  <SelectValue placeholder={
                    isAdmin && !deptId
                      ? 'Сначала выберите отдел'
                      : pmCandidates.length === 0
                      ? 'Нет PM в этом отделе'
                      : 'Выберите PM'
                  } />
                </SelectTrigger>
                <SelectContent>
                  {pmCandidates.map(u => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                      {u.department && (
                        <span className="ml-2 text-xs text-muted-foreground">({u.department})</span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.pmId && <p className="text-xs text-destructive">{errors.pmId}</p>}
            </div>
          )}

          {/* Для PM — показываем что они будут PM */}
          {isPm && (
            <div className="space-y-1.5">
              <Label>PM проекта</Label>
              <div className="px-3 py-2 rounded-md border bg-muted/40 text-sm text-muted-foreground">
                {currentUser?.name} <span className="text-xs">(вы)</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col items-stretch gap-2">
          {errors.submit && (
            <p className="text-xs text-destructive text-center">{errors.submit}</p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { reset(); onClose(); }}>Отмена</Button>
            <Button onClick={handleSubmit} disabled={createProject.isPending}>
              {createProject.isPending ? 'Создание...' : 'Создать проект'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
