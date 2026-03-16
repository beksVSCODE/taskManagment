import { User, Project, Task, AppNotification, TaskStatus, Priority } from '@/types';

export const users: User[] = [
    { id: 'u1', name: 'Алексей Админов', email: 'admin@company.com', role: 'admin', department: 'Development' },
    { id: 'u2', name: 'Иван Петров', email: 'ivan@company.com', role: 'manager', department: 'Development' },
    { id: 'u3', name: 'Мария Сидорова', email: 'maria@company.com', role: 'pm', department: 'Design' },
    { id: 'u4', name: 'Александр Джонсон', email: 'alex@company.com', role: 'pm', department: 'Development' },
    { id: 'u5', name: 'Ольга Кузнецова', email: 'olga@company.com', role: 'pm', department: 'Marketing' },
    { id: 'u6', name: 'Дмитрий Волков', email: 'dmitry@company.com', role: 'team', department: 'Design' },
    { id: 'u7', name: 'Анна Морозова', email: 'anna@company.com', role: 'team', department: 'Development' },
    { id: 'u8', name: 'Сергей Новиков', email: 'sergey@company.com', role: 'team', department: 'Development' },
    { id: 'u9', name: 'Елена Козлова', email: 'elena@company.com', role: 'team', department: 'Design' },
    { id: 'u10', name: 'Михаил Лебедев', email: 'mikhail@company.com', role: 'team', department: 'Marketing' },
    { id: 'u11', name: 'Наталья Соколова', email: 'natalia@company.com', role: 'team', department: 'QA' },
    { id: 'u12', name: 'Павел Федоров', email: 'pavel@company.com', role: 'team', department: 'Analytics' },
    { id: 'u13', name: 'Юлия Попова', email: 'yulia@company.com', role: 'team', department: 'Development' },
    { id: 'u14', name: 'Андрей Смирнов', email: 'andrey@company.com', role: 'team', department: 'QA' },
    { id: 'u15', name: 'Кристина Орлова', email: 'kristina@company.com', role: 'pm', department: 'Analytics' },
];

export const projects: Project[] = [
    { id: 'p1', name: 'Редизайн сайта', department: 'Development', description: 'Полный редизайн корпоративного сайта', pmId: 'u4', teamMemberIds: ['u7', 'u8', 'u13', 'u11'] },
    { id: 'p2', name: 'Мобильное приложение', department: 'Development', description: 'Разработка мобильного приложения для клиентов', pmId: 'u4', teamMemberIds: ['u7', 'u8', 'u13', 'u14'] },
    { id: 'p3', name: 'Маркетинговая кампания', department: 'Marketing', description: 'Запуск новой маркетинговой кампании Q1', pmId: 'u5', teamMemberIds: ['u10'] },
    { id: 'p4', name: 'Аналитическая платформа', department: 'Analytics', description: 'Создание платформы бизнес-аналитики', pmId: 'u15', teamMemberIds: ['u12'] },
    { id: 'p5', name: 'UI Kit', department: 'Design', description: 'Библиотека переиспользуемых компонентов', pmId: 'u6', teamMemberIds: ['u9'] },
];

const taskTitles = [
    'Разработать главную страницу', 'Исправить баг авторизации', 'Создать API для пользователей',
    'Написать unit-тесты', 'Оптимизировать загрузку изображений', 'Провести код-ревью',
    'Настроить CI/CD', 'Создать форму обратной связи', 'Реализовать поиск',
    'Добавить фильтрацию данных', 'Обновить документацию', 'Нагрузочное тестирование',
    'Создать страницу профиля', 'Реализовать уведомления', 'Добавить экспорт данных',
    'Оптимизировать базу данных', 'Настроить мониторинг', 'Создать дашборд метрик',
    'Реализовать OAuth авторизацию', 'Добавить логирование', 'Создать лендинг',
    'Интегрировать платёжную систему', 'Разработать чат', 'Создать систему ролей',
    'Добавить мультиязычность', 'Оптимизировать производительность', 'Провести UX-аудит',
    'Создать систему тегов', 'Реализовать drag & drop', 'Добавить тёмную тему',
];

const tagOptions = ['frontend', 'backend', 'design', 'bug', 'feature', 'urgent', 'research', 'docs', 'testing', 'refactoring', 'UX', 'API', 'database', 'security', 'performance'];

function generateTasks(): Task[] {
    const tasks: Task[] = [];
    const statuses: TaskStatus[] = ['new', 'in_progress', 'review', 'done'];
    const priorities: Priority[] = ['low', 'medium', 'high'];

    projects.forEach((project, pi) => {
        const teamIds = [project.pmId, ...project.teamMemberIds];
        const count = 20 + pi * 5;

        for (let i = 0; i < count; i++) {
            const titleIdx = (pi * 10 + i) % taskTitles.length;
            const status = statuses[i % 4];
            const priority = priorities[i % 3];
            const createdDate = new Date(2026, 0, 1 + Math.floor(i * 1.5));
            const dueDate = new Date(2026, 2, 10 + i * 2);
            const isOverdue = i % 7 === 0 && status !== 'done';
            if (isOverdue) {
                dueDate.setFullYear(2026);
                dueDate.setMonth(1);
                dueDate.setDate(15);
            }

            const assignees = [teamIds[i % teamIds.length]];
            if (i % 3 === 0 && teamIds.length > 1) assignees.push(teamIds[(i + 1) % teamIds.length]);

            const taskTags = [tagOptions[i % tagOptions.length]];
            if (i % 2 === 0) taskTags.push(tagOptions[(i + 3) % tagOptions.length]);

            const task: Task = {
                id: `t-${project.id}-${i}`,
                projectId: project.id,
                title: `${taskTitles[titleIdx]}${i >= taskTitles.length ? ` v${Math.floor(i / taskTitles.length) + 1}` : ''}`,
                description: `Описание задачи: ${taskTitles[titleIdx]}. Необходимо выполнить в рамках проекта "${project.name}".`,
                status,
                priority,
                creatorId: project.pmId,
                assigneeIds: assignees,
                watcherIds: [project.pmId],
                startDate: createdDate.toISOString(),
                dueDate: dueDate.toISOString(),
                createdAt: createdDate.toISOString(),
                completedAt: status === 'done' ? new Date(dueDate.getTime() - 86400000).toISOString() : undefined,
                tags: taskTags,
                subtasks: i % 4 === 0 ? [
                    { id: `st-${project.id}-${i}-1`, title: 'Подготовка', assigneeId: assignees[0], status: status === 'done' ? 'done' : 'new', dueDate: dueDate.toISOString() },
                    { id: `st-${project.id}-${i}-2`, title: 'Реализация', assigneeId: assignees[0], status: 'new' },
                ] : [],
                comments: i % 3 === 0 ? [
                    { id: `c-${project.id}-${i}-1`, taskId: `t-${project.id}-${i}`, authorId: project.pmId, text: 'Необходимо обратить внимание на сроки выполнения.', createdAt: new Date(createdDate.getTime() + 86400000).toISOString(), attachments: [] },
                    { id: `c-${project.id}-${i}-2`, taskId: `t-${project.id}-${i}`, authorId: assignees[0], text: 'Понял, приступаю к работе. @' + (users.find(u => u.id === project.pmId)?.name || ''), createdAt: new Date(createdDate.getTime() + 172800000).toISOString(), attachments: [] },
                ] : [],
                attachments: [],
                auditLog: [
                    { id: `al-${project.id}-${i}-1`, taskId: `t-${project.id}-${i}`, userId: project.pmId, action: 'created', timestamp: createdDate.toISOString() },
                ],
            };
            tasks.push(task);
        }
    });
    return tasks;
}

export const tasks: Task[] = generateTasks();
export const notifications: AppNotification[] = [];

let idCounter = 1000;
export const generateId = () => `gen-${++idCounter}`;
