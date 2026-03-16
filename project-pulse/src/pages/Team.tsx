import { useUsers } from '@/hooks/useData';
import { useAuth } from '@/contexts/AuthContext';
import { Users } from 'lucide-react';
import { Role, Department } from '@/types';

const roleLabels: Record<Role, string> = {
  admin: 'Администратор', manager: 'Руководитель', pm: 'ПМ', team: 'Команда',
};

const roleConfig: Record<Role, { color: string; bg: string }> = {
  admin:   { color: 'text-red-700',    bg: 'bg-red-50 border border-red-200' },
  manager: { color: 'text-blue-700',   bg: 'bg-blue-50 border border-blue-200' },
  pm:      { color: 'text-violet-700', bg: 'bg-violet-50 border border-violet-200' },
  team:    { color: 'text-emerald-700',bg: 'bg-emerald-50 border border-emerald-200' },
};

const deptColors: Record<string, string> = {
  Development: 'bg-blue-50 text-blue-700 border border-blue-200',
  Design:      'bg-violet-50 text-violet-700 border border-violet-200',
  Marketing:   'bg-amber-50 text-amber-700 border border-amber-200',
  Analytics:   'bg-teal-50 text-teal-700 border border-teal-200',
  QA:          'bg-emerald-50 text-emerald-700 border border-emerald-200',
};

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-violet-500', 'bg-emerald-500',
  'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500',
];

const departments: Department[] = ['Development', 'Design', 'Marketing', 'Analytics', 'QA'];

export default function Team() {
  const { data: users = [] } = useUsers();
  const { currentUser } = useAuth();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Users className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Команда</h1>
          <p className="text-sm text-muted-foreground">{users.length} участников</p>
        </div>
      </div>

      {/* Department groups */}
      <div className="space-y-6">
        {departments.map(dept => {
          const deptUsers = users.filter(u => u.department === dept);
          if (deptUsers.length === 0) return null;
          return (
            <div key={dept}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${deptColors[dept] ?? 'bg-muted text-muted-foreground'}`}>
                  {dept}
                </span>
                <span className="text-xs text-muted-foreground">{deptUsers.length} чел.</span>
              </div>
              <div className="bg-card border border-border/70 rounded-xl shadow-sm overflow-hidden">
                <div className="divide-y divide-border/40">
                  {deptUsers.map((user, idx) => {
                    const cfg = roleConfig[user.role];
                    const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                    const isMe = user.id === currentUser.id;
                    return (
                      <div key={user.id} className="flex items-center gap-4 px-5 py-3.5">
                        {/* Avatar */}
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 ${avatarColor}`}>
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        {/* Name + "me" badge */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">{user.name}</span>
                            {isMe && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                                Вы
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">{user.email}</span>
                        </div>
                        {/* Role */}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.color}`}>
                          {roleLabels[user.role]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
