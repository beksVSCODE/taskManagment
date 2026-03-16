import { useState } from 'react';
import { useProjects, useTasks, useUsers } from '@/hooks/useData';
import { ProjectCard } from '@/components/ProjectCard';
import { CreateProjectModal } from '@/components/CreateProjectModal';
import { usePermissions } from '@/hooks/usePermissions';
import { Project, User } from '@/types';
import { FolderKanban, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

function ProjectCardWithTasks({ project, users }: { project: Project; users: User[] }) {
  const { data: tasks = [] } = useTasks(project.id);
  return <ProjectCard project={project} tasks={tasks} users={users} />;
}

const Index = () => {
  const { data: projects = [] } = useProjects();
  const { data: users = [] } = useUsers();
  const permissions = usePermissions();
  const [createOpen, setCreateOpen] = useState(false);
  const visibleProjects = projects.filter(p => permissions.canViewProject(p));

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-7">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <FolderKanban className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Мои проекты</h1>
            <p className="text-sm text-muted-foreground">
              {visibleProjects.length} {visibleProjects.length === 1 ? 'проект' : visibleProjects.length < 5 ? 'проекта' : 'проектов'}
            </p>
          </div>
        </div>
        {permissions.canCreateProject && (
          <Button onClick={() => setCreateOpen(true)} className="gap-2 shadow-sm">
            <Plus className="w-4 h-4" />
            Создать проект
          </Button>
        )}
      </div>

      {/* Projects grid */}
      <div className="grid grid-cols-3 gap-5">
        {visibleProjects.map(project => (
          <ProjectCardWithTasks key={project.id} project={project} users={users} />
        ))}
      </div>

      {visibleProjects.length === 0 && (
        <div className="flex flex-col items-center justify-center mt-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <FolderKanban className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-base font-medium text-muted-foreground">Нет доступных проектов</p>
          <p className="text-sm text-muted-foreground/60 mt-1">Обратитесь к администратору</p>
        </div>
      )}

      <CreateProjectModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
};

export default Index;
