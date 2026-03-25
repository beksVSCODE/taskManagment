import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Building2, Plus, Edit2, Trash2, User as UserIcon, Users } from 'lucide-react';
import {
    useDepartments,
    useCreateDepartment,
    useUpdateDepartment,
    useDeleteDepartment,
    useUsers,
    useProjects,
    useAllTasks,
} from '@/hooks/useData';
import { usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { departmentService } from '@/services/departmentService';
import { userService } from '@/services/userService';
import { useToast } from '@/hooks/use-toast';

const PALETTE = [
    'bg-blue-500',
    'bg-violet-500',
    'bg-amber-500',
    'bg-teal-500',
    'bg-emerald-500',
    'bg-rose-500',
    'bg-orange-500',
    'bg-pink-500',
];

export default function Departments() {
    const { data: departments = [], isLoading } = useDepartments();
    const { data: users = [] }    = useUsers();
    const { data: projects = [] } = useProjects();
    const { data: allTasks = [] } = useAllTasks();
    const { canManageDepartments } = usePermissions();

    const createDept = useCreateDepartment();
    const updateDept = useUpdateDepartment();
    const deleteDept = useDeleteDepartment();
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName]       = useState('');
    const [isSaving, setIsSaving]     = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
    const [editDept, setEditDept]     = useState<{
        id: number;
        name: string;
        managerId?: number;
        memberIds: string[];
        originalMemberIds: string[];
    } | null>(null);

    const managerCandidates = users.filter(u => u.role === 'MANAGER');
    const pmCandidates      = users.filter(u => u.role === 'PM');
    const teamCandidates    = users.filter(u => u.role === 'TEAM');

    const openEdit = (dept: { id: number; name: string; manager?: { id: number } | undefined }) => {
        const memberIds = users
            .filter(u => u.departmentId === dept.id && (u.role === 'PM' || u.role === 'TEAM'))
            .map(u => u.id);
        setEditDept({ id: dept.id, name: dept.name, managerId: dept.manager?.id, memberIds, originalMemberIds: memberIds });
    };

    const toggleMember = (id: string) => {
        setEditDept(prev => {
            if (!prev) return null;
            const ids = prev.memberIds.includes(id)
                ? prev.memberIds.filter(x => x !== id)
                : [...prev.memberIds, id];
            return { ...prev, memberIds: ids };
        });
    };

    const handleCreate = () => {
        if (!newName.trim()) return;
        createDept.mutate(newName.trim(), {
            onSuccess: () => { setShowCreate(false); setNewName(''); },
        });
    };

    const handleUpdate = async () => {
        if (!editDept) return;
        setIsSaving(true);
        try {
            // 1. Обновить отдел (название + менеджер)
            await departmentService.update(editDept.id, {
                name: editDept.name,
                managerId: editDept.managerId,
            });
            queryClient.invalidateQueries({ queryKey: ['departments'] });

            // 2. Вычислить изменения участников
            const toAdd    = editDept.memberIds.filter(id => !editDept.originalMemberIds.includes(id));
            const toRemove = editDept.originalMemberIds.filter(id => !editDept.memberIds.includes(id));

            await Promise.all([
                ...toAdd.map(id    => userService.update(id, { departmentId: editDept.id })),
                ...toRemove.map(id => userService.update(id, { clearDepartment: true })),
            ]);

            if (toAdd.length > 0 || toRemove.length > 0) {
                queryClient.invalidateQueries({ queryKey: ['users'] });
            }

            setEditDept(null);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-48 text-muted-foreground">
                Загрузка...
            </div>
        );
    }

    return (
        <div className="space-y-5 sm:space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-foreground">Отделы</h1>
                        <p className="text-sm text-muted-foreground">{departments.length} отделов</p>
                    </div>
                </div>
                {canManageDepartments && (
                    <Button size="sm" className="gap-1.5 w-full sm:w-auto" onClick={() => setShowCreate(true)}>
                        <Plus className="w-4 h-4" />Создать отдел
                    </Button>
                )}
            </div>

            {/* Grid */}
            {departments.length === 0 ? (
                <div className="text-center text-muted-foreground py-16">
                    {canManageDepartments
                        ? 'Отделов пока нет. Нажмите «Создать отдел».'
                        : 'Отделов пока нет.'}
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
                    {departments.map((dept, i) => {
                        const dotColor     = PALETTE[i % PALETTE.length];
                        const deptUsers    = users.filter(u => u.departmentId === dept.id);
                        const deptProjects = projects.filter(p => p.departmentId === dept.id);
                        const deptTasks    = allTasks.filter(t =>
                            deptProjects.some(p => p.id === t.projectId),
                        );
                        const doneTasks = deptTasks.filter(t => t.status === 'DONE').length;
                        const progress  = deptTasks.length > 0
                            ? Math.round((doneTasks / deptTasks.length) * 100)
                            : 0;

                        return (
                            <div
                                key={dept.id}
                                className="bg-card border border-border/70 rounded-xl shadow-sm p-5 space-y-4"
                            >
                                {/* Заголовок */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${dotColor}`} />
                                        <h2 className="text-base font-semibold text-foreground">{dept.name}</h2>
                                    </div>
                                    {canManageDepartments && (
                                        <div className="flex gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7"
                                                onClick={() => openEdit(dept)}
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 hover:text-destructive"
                                                onClick={() => setDeleteTarget({ id: dept.id, name: dept.name })}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                {/* Менеджер */}
                                {dept.manager && (
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <UserIcon className="w-3.5 h-3.5" />
                                        <span>
                                            Менеджер:{' '}
                                            <span className="font-medium text-foreground">
                                                {dept.manager.fullName}
                                            </span>
                                        </span>
                                    </div>
                                )}

                                {/* Статистика */}
                                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                                    <div className="text-center">
                                        <p className="text-xl font-bold text-foreground">{deptUsers.length}</p>
                                        <p className="text-xs text-muted-foreground">Участников</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xl font-bold text-foreground">{deptProjects.length}</p>
                                        <p className="text-xs text-muted-foreground">Проектов</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xl font-bold text-foreground">{deptTasks.length}</p>
                                        <p className="text-xs text-muted-foreground">Задач</p>
                                    </div>
                                </div>

                                {/* Прогресс */}
                                {deptTasks.length > 0 && (
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>Выполнено</span>
                                            <span>{progress}%</span>
                                        </div>
                                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${dotColor}`}
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Пользователи */}
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    {deptUsers.slice(0, 8).map(u => (
                                        <span
                                            key={u.id}
                                            className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5"
                                        >
                                            {u.name.split(' ')[0]}
                                        </span>
                                    ))}
                                    {deptUsers.length > 8 && (
                                        <span className="text-xs text-muted-foreground">
                                            +{deptUsers.length - 8}
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ===== Диалог подтверждения удаления ===== */}
            <AlertDialog
                open={!!deleteTarget}
                onOpenChange={v => { if (!v) setDeleteTarget(null); }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Удалить отдел?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Отдел <strong>{deleteTarget?.name}</strong> будет удалён.
                            Все пользователи и проекты этого отдела потеряют привязку к нему.
                            Это действие нельзя отменить.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => {
                                if (!deleteTarget) return;
                                deleteDept.mutate(deleteTarget.id, {
                                    onSuccess: () => {
                                        toast({ title: 'Отдел удалён' });
                                        setDeleteTarget(null);
                                    },
                                    onError: (err: unknown) => {
                                        const msg = err instanceof Error ? err.message : 'Ошибка при удалении';
                                        toast({ title: 'Ошибка', description: msg, variant: 'destructive' });
                                        setDeleteTarget(null);
                                    },
                                });
                            }}
                        >
                            {deleteDept.isPending ? 'Удаление...' : 'Удалить'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* ===== Диалог создания ===== */}
            <Dialog
                open={showCreate}
                onOpenChange={v => {
                    if (!v) { setShowCreate(false); setNewName(''); }
                }}
            >
                <DialogContent className="sm:max-w-[380px]">
                    <DialogHeader>
                        <DialogTitle>Новый отдел</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="space-y-1.5">
                            <Label>Название</Label>
                            <Input
                                placeholder="Например: Backend"
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                                autoFocus
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => { setShowCreate(false); setNewName(''); }}
                        >
                            Отмена
                        </Button>
                        <Button
                            onClick={handleCreate}
                            disabled={!newName.trim() || createDept.isPending}
                        >
                            {createDept.isPending ? 'Создание...' : 'Создать'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ===== Диалог редактирования ===== */}
            <Dialog open={!!editDept} onOpenChange={v => { if (!v) setEditDept(null); }}>
                <DialogContent className="sm:max-w-[420px]">
                    <DialogHeader>
                        <DialogTitle>Редактировать отдел</DialogTitle>
                    </DialogHeader>
                    {editDept && (
                        <div className="space-y-4 py-2">
                            <div className="space-y-1.5">
                                <Label>Название</Label>
                                <Input
                                    value={editDept.name}
                                    onChange={e =>
                                        setEditDept(prev =>
                                            prev ? { ...prev, name: e.target.value } : null,
                                        )
                                    }
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Менеджер</Label>
                                <Select
                                    value={
                                        editDept.managerId
                                            ? String(editDept.managerId)
                                            : 'none'
                                    }
                                    onValueChange={v =>
                                        setEditDept(prev =>
                                            prev
                                                ? { ...prev, managerId: (v && v !== 'none') ? Number(v) : undefined }
                                                : null,
                                        )
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Выберите менеджера" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">— Без менеджера —</SelectItem>
                                        {managerCandidates.map(u => (
                                            <SelectItem key={u.id} value={String(u.id)}>
                                                {u.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* ПМ */}
                            {pmCandidates.length > 0 && (
                                <div className="space-y-1.5">
                                    <Label className="flex items-center gap-1.5">
                                        <Users className="w-3.5 h-3.5" />Проект-менеджеры (PM)
                                    </Label>
                                    <div className="max-h-36 overflow-y-auto border border-border rounded-lg p-2 space-y-1">
                                        {pmCandidates.map(u => (
                                            <label key={u.id} className="flex items-center gap-2 px-1 py-1 rounded hover:bg-muted cursor-pointer text-sm">
                                                <Checkbox
                                                    checked={editDept.memberIds.includes(u.id)}
                                                    onCheckedChange={() => toggleMember(u.id)}
                                                />
                                                <span className="flex-1">{u.name}</span>
                                                {u.departmentId && u.departmentId !== editDept.id && (
                                                    <span className="text-xs text-amber-600">другой отдел</span>
                                                )}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Сотрудники TEAM */}
                            {teamCandidates.length > 0 && (
                                <div className="space-y-1.5">
                                    <Label className="flex items-center gap-1.5">
                                        <Users className="w-3.5 h-3.5" />Сотрудники (TEAM)
                                    </Label>
                                    <div className="max-h-44 overflow-y-auto border border-border rounded-lg p-2 space-y-1">
                                        {teamCandidates.map(u => (
                                            <label key={u.id} className="flex items-center gap-2 px-1 py-1 rounded hover:bg-muted cursor-pointer text-sm">
                                                <Checkbox
                                                    checked={editDept.memberIds.includes(u.id)}
                                                    onCheckedChange={() => toggleMember(u.id)}
                                                />
                                                <span className="flex-1">{u.name}</span>
                                                {u.departmentId && u.departmentId !== editDept.id && (
                                                    <span className="text-xs text-amber-600">другой отдел</span>
                                                )}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditDept(null)}>Отмена</Button>
                        <Button onClick={handleUpdate} disabled={isSaving}>
                            {isSaving ? 'Сохранение...' : 'Сохранить'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
