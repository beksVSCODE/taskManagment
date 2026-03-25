import { useAllTasks, useUsers, useProjects } from '@/hooks/useData';
import { usePermissions } from '@/hooks/usePermissions';
import { AnalyticsView } from '@/components/AnalyticsView';
import { BarChart3, FolderKanban } from 'lucide-react';
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Analytics() {
  const { data: allTasks = [] } = useAllTasks();
  const { data: users = [] } = useUsers();
  const { data: projects = [] } = useProjects();
  const permissions = usePermissions();
  const [projectId, setProjectId] = useState<string>('all');

  const visibleProjects = projects.filter(p => permissions.canViewProject(p));
  const filteredTasks = projectId === 'all'
    ? allTasks.filter(t => visibleProjects.some(p => p.id === t.projectId))
    : allTasks.filter(t => t.projectId === projectId);

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Аналитика</h1>
            <p className="text-sm text-muted-foreground">
              {filteredTasks.length} задач · {visibleProjects.length} проектов
            </p>
          </div>
        </div>

        {/* Project filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <FolderKanban className="w-4 h-4 text-muted-foreground" />
          <Select value={projectId} onValueChange={setProjectId}>
            <SelectTrigger className="w-full sm:w-52 h-9 text-sm">
              <SelectValue placeholder="Все проекты" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все проекты</SelectItem>
              {visibleProjects.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <AnalyticsView tasks={filteredTasks} users={users} />
    </div>
  );
}
