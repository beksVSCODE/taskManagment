import { useState } from 'react';
import {
    useAdminUsers,
    useCreateUser,
    useUpdateUser,
    useDeleteUser,
    useDepartments,
} from '@/hooks/useData';
import { Role, User } from '@/types';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Users, Plus, Trash2, Edit2, Loader2, AlertCircle } from 'lucide-react';
import { CreateUserPayload, UpdateUserPayload } from '@/services/userService';

const ROLES: Role[] = ['ADMIN', 'MANAGER', 'PM', 'TEAM'];

const roleLabels: Record<Role, string> = {
    ADMIN:   'Администратор',
    MANAGER: 'Руководитель',
    PM:      'ПМ',
    TEAM:    'Команда',
};

const roleConfig: Record<Role, { color: string; bg: string }> = {
    ADMIN:   { color: 'text-red-700',     bg: 'bg-red-50 border border-red-200' },
    MANAGER: { color: 'text-blue-700',    bg: 'bg-blue-50 border border-blue-200' },
    PM:      { color: 'text-violet-700',  bg: 'bg-violet-50 border border-violet-200' },
    TEAM:    { color: 'text-emerald-700', bg: 'bg-emerald-50 border border-emerald-200' },
};

const AVATAR_COLORS = [
    'bg-blue-500', 'bg-violet-500', 'bg-emerald-500',
    'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500',
];

const DEPT_ROLES: Role[] = ['PM', 'TEAM'];

interface CreateForm {
    fullName: string; email: string; password: string; role: Role; departmentId: string;
}
const emptyCreate = (): CreateForm => ({ fullName: '', email: '', password: '', role: 'TEAM', departmentId: '__none__' });

interface EditForm {
    id: string; fullName: string; role: Role; departmentId: string; active: boolean;
}

export default function UsersManagement() {
    const { data: users = [], isLoading: usersLoading, isError: usersError, error: usersErrorObj } = useAdminUsers();
    const { data: departments = [] } = useDepartments();
    const createUser = useCreateUser();
    const updateUser = useUpdateUser();
    const deleteUser = useDeleteUser();

    const [showCreate, setShowCreate]     = useState(false);
    const [createForm, setCreateForm]     = useState<CreateForm>(emptyCreate());
    const [createErrors, setCreateErrors] = useState<Record<string, string>>({});
    const [editUser, setEditUser]         = useState<EditForm | null>(null);

    const [filterRole, setFilterRole]   = useState('__all__');
    const [filterDept, setFilterDept]   = useState('__all__');
    const [filterQuery, setFilterQuery] = useState('');

    const filtered = users.filter(u => {
        if (filterRole !== '__all__' && u.role !== filterRole) return false;
        if (filterDept !== '__all__' && String(u.departmentId) !== filterDept) return false;
        if (filterQuery && !u.name.toLowerCase().includes(filterQuery.toLowerCase())
            && !(u.email ?? '').toLowerCase().includes(filterQuery.toLowerCase())) return false;
        return true;
    });

    const validateCreate = () => {
        const e: Record<string, string> = {};
        if (!createForm.fullName.trim()) e.fullName = 'Обязательно';
        if (!createForm.email.trim())    e.email    = 'Обязательно';
        if (!createForm.password.trim()) e.password = 'Обязательно';
        setCreateErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleCreate = () => {
        if (!validateCreate()) return;
        const payload: CreateUserPayload = {
            fullName: createForm.fullName.trim(),
            email: createForm.email.trim(),
            password: createForm.password,
            role: createForm.role,
            departmentId: (createForm.departmentId && createForm.departmentId !== '__none__') ? Number(createForm.departmentId) : undefined,
        };
        createUser.mutate(payload, {
            onSuccess: () => { setShowCreate(false); setCreateForm(emptyCreate()); setCreateErrors({}); },
            onError: (err) => setCreateErrors(prev => ({ ...prev, submit: err instanceof Error ? err.message : 'Ошибка' })),
        });
    };

    const openEdit = (u: User) => setEditUser({
        id: u.id, fullName: u.name, role: u.role,
        departmentId: u.departmentId ? String(u.departmentId) : '__none__',
        active: u.active ?? true,
    });

    const handleUpdate = () => {
        if (!editUser) return;
        const payload: UpdateUserPayload = { fullName: editUser.fullName || undefined, role: editUser.role, active: editUser.active };
        if (DEPT_ROLES.includes(editUser.role)) {
            payload.departmentId = (editUser.departmentId && editUser.departmentId !== '__none__') ? Number(editUser.departmentId) : null;
        }
        updateUser.mutate({ id: editUser.id, payload }, { onSuccess: () => setEditUser(null) });
    };

    const handleRoleChange = (user: User, role: Role) => updateUser.mutate({ id: user.id, payload: { role } });

    if (usersLoading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (usersError) {
        const msg = usersErrorObj instanceof Error ? usersErrorObj.message : 'Неизвестная ошибка';
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-destructive">
                <AlertCircle className="w-8 h-8" />
                <p className="font-medium">Не удалось загрузить пользователей</p>
                <p className="text-sm text-muted-foreground">{msg}</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">Управление пользователями</h1>
                        <p className="text-sm text-muted-foreground">{users.length} пользователей</p>
                    </div>
                </div>
                <Button size="sm" className="gap-1.5 w-full sm:w-auto" onClick={() => setShowCreate(true)}>
                    <Plus className="w-4 h-4" />Создать
                </Button>
            </div>

            <div className="flex gap-3 flex-wrap">
                <Input placeholder="Поиск по имени / email…" value={filterQuery}
                    onChange={e => setFilterQuery(e.target.value)} className="h-9 w-full sm:w-56 text-sm" />
                <Select value={filterRole} onValueChange={setFilterRole}>
                    <SelectTrigger className="h-9 w-full xs:w-44 text-sm"><SelectValue placeholder="Все роли" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__all__">Все роли</SelectItem>
                        {ROLES.map(r => <SelectItem key={r} value={r}>{roleLabels[r]}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={filterDept} onValueChange={setFilterDept}>
                    <SelectTrigger className="h-9 w-full xs:w-48 text-sm"><SelectValue placeholder="Все отделы" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__all__">Все отделы</SelectItem>
                        {departments.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            <div className="bg-card rounded-xl border border-border/70 overflow-hidden shadow-sm hidden lg:block">
                <div className="grid grid-cols-[2fr_2fr_1.5fr_1.8fr_auto] gap-4 px-5 py-3 border-b border-border/60 bg-muted/30">
                    {['Пользователь', 'Email', 'Отдел', 'Роль', ''].map((h, i) => (
                        <span key={i} className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</span>
                    ))}
                </div>
                <div className="divide-y divide-border/50">
                    {filtered.map((user, idx) => {
                        const cfg = roleConfig[user.role] ?? roleConfig.TEAM;
                        const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                        return (
                            <div key={user.id} className="grid grid-cols-[2fr_2fr_1.5fr_1.8fr_auto] gap-4 px-5 py-3.5 items-center hover:bg-muted/20 transition-colors">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 ${avatarColor}`}>
                                        {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-medium text-sm truncate">{user.name}</p>
                                        {user.active === false && <span className="text-[10px] text-muted-foreground">неактивен</span>}
                                    </div>
                                </div>
                                <span className="text-sm text-muted-foreground truncate">{user.email}</span>
                                <span className="text-xs text-muted-foreground">{user.department || '—'}</span>
                                <Select value={user.role} onValueChange={v => handleRoleChange(user, v as Role)}>
                                    <SelectTrigger className={`h-8 text-xs font-semibold border rounded-lg ${cfg.bg} ${cfg.color}`}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ROLES.map(r => <SelectItem key={r} value={r}>{roleLabels[r]}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(user)}>
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive"
                                        onClick={() => deleteUser.mutate(user.id)}>
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                    {filtered.length === 0 && (
                        <div className="px-5 py-8 text-center text-sm text-muted-foreground">Пользователи не найдены</div>
                    )}
                </div>
            </div>

            <div className="lg:hidden space-y-2.5">
                {filtered.map((user, idx) => {
                    const cfg = roleConfig[user.role] ?? roleConfig.TEAM;
                    const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                    return (
                        <div key={user.id} className="rounded-xl border border-border/70 bg-card p-3 shadow-sm space-y-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 ${avatarColor}`}>
                                    {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-medium text-sm truncate">{user.name}</p>
                                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{user.department || '—'}</p>
                                </div>
                            </div>

                            <Select value={user.role} onValueChange={v => handleRoleChange(user, v as Role)}>
                                <SelectTrigger className={`h-9 text-xs font-semibold border rounded-lg ${cfg.bg} ${cfg.color}`}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {ROLES.map(r => <SelectItem key={r} value={r}>{roleLabels[r]}</SelectItem>)}
                                </SelectContent>
                            </Select>

                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="flex-1 h-9" onClick={() => openEdit(user)}>
                                    <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                                    Изменить
                                </Button>
                                <Button variant="outline" size="sm" className="flex-1 h-9 text-destructive hover:text-destructive" onClick={() => deleteUser.mutate(user.id)}>
                                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                                    Удалить
                                </Button>
                            </div>
                        </div>
                    );
                })}
                {filtered.length === 0 && (
                    <div className="px-5 py-8 text-center text-sm text-muted-foreground rounded-xl border border-border/70 bg-card">
                        Пользователи не найдены
                    </div>
                )}
            </div>

            {/* Диалог создания */}
            <Dialog open={showCreate} onOpenChange={v => { if (!v) { setShowCreate(false); setCreateForm(emptyCreate()); setCreateErrors({}); } }}>
                <DialogContent className="sm:max-w-[440px]">
                    <DialogHeader><DialogTitle>Новый пользователь</DialogTitle></DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="space-y-1.5">
                            <Label>Полное имя <span className="text-destructive">*</span></Label>
                            <Input placeholder="Иван Иванов" value={createForm.fullName} autoFocus
                                onChange={e => setCreateForm(p => ({ ...p, fullName: e.target.value }))} />
                            {createErrors.fullName && <p className="text-xs text-destructive">{createErrors.fullName}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label>Email <span className="text-destructive">*</span></Label>
                            <Input type="email" placeholder="user@example.com" value={createForm.email}
                                onChange={e => setCreateForm(p => ({ ...p, email: e.target.value }))} />
                            {createErrors.email && <p className="text-xs text-destructive">{createErrors.email}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label>Пароль <span className="text-destructive">*</span></Label>
                            <Input type="password" placeholder="Минимум 6 символов" value={createForm.password}
                                onChange={e => setCreateForm(p => ({ ...p, password: e.target.value }))} />
                            {createErrors.password && <p className="text-xs text-destructive">{createErrors.password}</p>}
                        </div>
                        <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label>Роль</Label>
                                <Select value={createForm.role} onValueChange={v => setCreateForm(p => ({
                                    ...p, role: v as Role,
                                    departmentId: ['MANAGER', 'ADMIN'].includes(v) ? '__none__' : p.departmentId,
                                }))}>  
                                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {ROLES.map(r => <SelectItem key={r} value={r}>{roleLabels[r]}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            {DEPT_ROLES.includes(createForm.role) && (
                                <div className="space-y-1.5">
                                    <Label>Отдел</Label>
                                    <Select value={createForm.departmentId}
                                        onValueChange={v => setCreateForm(p => ({ ...p, departmentId: v }))}>
                                        <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Не выбран" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="__none__">— без отдела —</SelectItem>
                                            {departments.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                        {createForm.role === 'MANAGER' && (
                            <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                                💡 Отдел для руководителя назначается на странице <b>Отделы</b>
                            </p>
                        )}
                    </div>
                    <DialogFooter>
                        {createErrors.submit && <p className="text-xs text-destructive w-full text-center">{createErrors.submit}</p>}
                        <Button variant="outline" onClick={() => { setShowCreate(false); setCreateForm(emptyCreate()); setCreateErrors({}); }}>Отмена</Button>
                        <Button onClick={handleCreate} disabled={createUser.isPending}>
                            {createUser.isPending ? 'Создание...' : 'Создать'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Диалог редактирования */}
            <Dialog open={!!editUser} onOpenChange={v => { if (!v) setEditUser(null); }}>
                <DialogContent className="sm:max-w-[420px]">
                    <DialogHeader><DialogTitle>Редактировать пользователя</DialogTitle></DialogHeader>
                    {editUser && (
                        <div className="space-y-3 py-2">
                            <div className="space-y-1.5">
                                <Label>Полное имя</Label>
                                <Input value={editUser.fullName}
                                    onChange={e => setEditUser(p => p ? { ...p, fullName: e.target.value } : null)} />
                            </div>
                            <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label>Роль</Label>
                                    <Select value={editUser.role} onValueChange={v => setEditUser(p => p ? {
                                        ...p, role: v as Role,
                                        departmentId: ['MANAGER', 'ADMIN'].includes(v) ? '__none__' : p.departmentId,
                                    } : null)}>  
                                        <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {ROLES.map(r => <SelectItem key={r} value={r}>{roleLabels[r]}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                {DEPT_ROLES.includes(editUser.role) && (
                                    <div className="space-y-1.5">
                                        <Label>Отдел</Label>
                                        <Select value={editUser.departmentId}
                                            onValueChange={v => setEditUser(p => p ? { ...p, departmentId: v } : null)}>
                                            <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Не выбран" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="__none__">— без отдела —</SelectItem>
                                                {departments.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="edit-active" checked={editUser.active}
                                    onChange={e => setEditUser(p => p ? { ...p, active: e.target.checked } : null)}
                                    className="w-4 h-4" />
                                <Label htmlFor="edit-active" className="cursor-pointer">Активен</Label>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditUser(null)}>Отмена</Button>
                        <Button onClick={handleUpdate} disabled={updateUser.isPending}>
                            {updateUser.isPending ? 'Сохранение...' : 'Сохранить'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}


