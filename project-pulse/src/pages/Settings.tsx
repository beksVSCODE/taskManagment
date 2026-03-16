import { useAuth } from '@/contexts/AuthContext';
import { Settings, User, Bell, Palette, Shield, Info } from 'lucide-react';

const roleLabels: Record<string, string> = {
  ADMIN: 'Администратор', MANAGER: 'Руководитель', PM: 'ПМ', TEAM: 'Команда',
};

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-violet-500', 'bg-emerald-500',
  'bg-amber-500', 'bg-rose-500', 'bg-cyan-500',
];

export default function SettingsPage() {
  const { currentUser } = useAuth();
  const avatarColor = AVATAR_COLORS[(currentUser?.id?.charCodeAt(1) ?? 0) % AVATAR_COLORS.length];

  const sections = [
    {
      icon: User,
      label: 'Профиль',
      items: [
        { title: 'Имя', value: currentUser?.name ?? '' },
        { title: 'Email', value: currentUser?.email ?? '' },
        { title: 'Роль', value: roleLabels[currentUser?.role ?? ''] ?? currentUser?.role ?? '' },
        { title: 'Отдел', value: currentUser?.department ?? '' },
      ],
    },
    {
      icon: Bell,
      label: 'Уведомления',
      items: [
        { title: 'Назначение задач', value: 'Включено' },
        { title: 'Смена статуса', value: 'Включено' },
        { title: 'Комментарии', value: 'Включено' },
        { title: 'Просроченные задачи', value: 'Включено' },
      ],
    },
    {
      icon: Palette,
      label: 'Интерфейс',
      items: [
        { title: 'Тема', value: 'Системная' },
        { title: 'Язык', value: 'Русский' },
        { title: 'Плотность', value: 'Стандартная' },
      ],
    },
  ];

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Settings className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Настройки</h1>
          <p className="text-sm text-muted-foreground">Управление аккаунтом и предпочтениями</p>
        </div>
      </div>

      {/* Profile card */}
      <div className="bg-card border border-border/70 rounded-xl shadow-sm p-5 flex items-center gap-4">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center text-base font-bold text-white flex-shrink-0 ${avatarColor}`}>
          {currentUser?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) ?? '?'}
        </div>
        <div>
          <p className="text-base font-semibold text-foreground">{currentUser?.name}</p>
          <p className="text-sm text-muted-foreground">{currentUser.email}</p>
          <div className="flex items-center gap-2 mt-1">
            <Shield className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{roleLabels[currentUser?.role ?? ''] ?? currentUser?.role}</span>
          </div>
        </div>
      </div>

      {/* Settings sections */}
      {sections.map(section => (
        <div key={section.label} className="bg-card border border-border/70 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border/50 flex items-center gap-2">
            <section.icon className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">{section.label}</span>
          </div>
          <div className="divide-y divide-border/40">
            {section.items.map(item => (
              <div key={item.title} className="flex items-center justify-between px-5 py-3.5">
                <span className="text-sm text-foreground">{item.title}</span>
                <span className="text-sm text-muted-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Info */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground/60 px-1">
        <Info className="w-3.5 h-3.5" />
        <span>TaskFlow Dashboard v2.0 · Изменение настроек будет доступно в следующих версиях</span>
      </div>
    </div>
  );
}
