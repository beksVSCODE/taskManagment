import { useState, useMemo } from 'react';
import { useUsers, useAddProjectMember, useRemoveProjectMember } from '@/hooks/useData';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X, Plus, Users } from 'lucide-react';

interface ProjectMembersModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string | number;
  projectName: string;
  memberIds: string[];
  memberNames: string[];
}

export function ProjectMembersModal({
  open,
  onClose,
  projectId,
  projectName,
  memberIds,
  memberNames,
}: ProjectMembersModalProps) {
  const { data: users = [] } = useUsers();
  const { currentUser } = useAuth();
  const addMember = useAddProjectMember();
  const removeMember = useRemoveProjectMember();
  const { toast } = useToast();
  const [selectedUserId, setSelectedUserId] = useState('');

  // Только ADMIN, MANAGER и PM могут управлять членами проекта
  const canManageMembers = currentUser && ['ADMIN', 'MANAGER', 'PM'].includes(currentUser.role);

  // Получаем членов проекта с их ID (из memberIds и memberNames)
  const projectMembers = useMemo(() => {
    return memberIds.map((id, idx) => ({
      id,
      name: memberNames[idx] || 'Unknown',
    }));
  }, [memberIds, memberNames]);

  // Доступные пользователи (не в проекте, только TEAM)
  const availableUsers = useMemo(() => {
    const memberIdSet = new Set(memberIds);
    return users.filter(
      u => u.role === 'TEAM' && !memberIdSet.has(u.id)
    );
  }, [users, memberIds]);

  const handleAddMember = () => {
    if (!selectedUserId) {
      toast({ title: 'Выберите участника', variant: 'destructive' });
      return;
    }

    addMember.mutate(
      { projectId: String(projectId), userId: selectedUserId },
      {
        onSuccess: () => {
          setSelectedUserId('');
          toast({ title: 'Участник добавлен в проект' });
        },
        onError: (err) => {
          const msg = err instanceof Error ? err.message : 'Ошибка добавления';
          toast({
            title: 'Не удалось добавить участника',
            description: msg,
            variant: 'destructive',
          });
        },
      }
    );
  };

  const handleRemoveMember = (userId: string) => {
    removeMember.mutate(
      { projectId: String(projectId), userId },
      {
        onSuccess: () => {
          toast({ title: 'Участник удален из проекта' });
        },
        onError: (err) => {
          const msg = err instanceof Error ? err.message : 'Ошибка удаления';
          toast({
            title: 'Не удалось удалить участника',
            description: msg,
            variant: 'destructive',
          });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Управление командой: {projectName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Текущие члены */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">
              Текущие участники ({projectMembers.length})
            </h3>
            {projectMembers.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground text-sm">
                Нет участников в проекте
              </div>
            ) : (
              <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
                {projectMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-sm font-medium">{member.name}</span>
                    {canManageMembers && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-destructive/60 hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleRemoveMember(member.id)}
                        disabled={removeMember.isPending}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Добавление нового члена */}
          {canManageMembers && (
            <div className="space-y-2 border-t pt-4">
              <h3 className="font-semibold text-sm">Добавить участника</h3>
              {availableUsers.length === 0 ? (
                <div className="text-center py-3 text-muted-foreground text-sm">
                  Все доступные участники уже в проекте
                </div>
              ) : (
                <div className="flex gap-2">
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Выберите участника" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleAddMember}
                    disabled={!selectedUserId || addMember.isPending}
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Добавить
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Закрыть
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
