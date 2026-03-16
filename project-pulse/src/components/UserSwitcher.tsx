import { useAuth } from '@/contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDown } from 'lucide-react';

const roleLabels: Record<string, string> = {
  admin: 'Админ', manager: 'Руков.', pm: 'ПМ', team: 'Команда',
};

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-violet-500', 'bg-emerald-500',
  'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500',
];

export function UserSwitcher() {
  const { currentUser, setCurrentUser, allUsers } = useAuth();
  const currentIdx = allUsers.findIndex(u => u.id === currentUser.id);
  const avatarColor = AVATAR_COLORS[currentIdx % AVATAR_COLORS.length];

  return (
    <Select value={currentUser.id} onValueChange={(id) => {
      const user = allUsers.find(u => u.id === id);
      if (user) setCurrentUser(user);
    }}>
      <SelectTrigger className="w-full bg-sidebar-accent border-sidebar-border text-sidebar-foreground text-xs rounded-lg h-auto py-2 px-3 hover:bg-sidebar-accent/70 transition-colors [&>svg]:hidden">
        <div className="flex items-center gap-2.5 w-full">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 ${avatarColor}`}>
            {currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-xs font-medium text-sidebar-foreground truncate leading-none">{currentUser.name}</p>
            <p className="text-[10px] text-sidebar-foreground/60 mt-0.5 leading-none">{roleLabels[currentUser.role]}</p>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-sidebar-foreground/50 flex-shrink-0" />
        </div>
      </SelectTrigger>
      <SelectContent>
        {allUsers.map((user, idx) => (
          <SelectItem key={user.id} value={user.id}>
            <div className="flex items-center gap-2">
              <div className={`w-5 h-5 rounded-full ${AVATAR_COLORS[idx % AVATAR_COLORS.length]} flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0`}>
                {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <span className="truncate">{user.name}</span>
              <span className="text-muted-foreground text-[10px]">({roleLabels[user.role]})</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
