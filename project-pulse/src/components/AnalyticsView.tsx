import { useState } from 'react';
import { Task, User } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';
import { CheckCircle2, Clock, AlertTriangle, ListTodo } from 'lucide-react';

interface Props {
  tasks: Task[];
  users: User[];
}

const STATUS_COLORS = ['#3B82F6', '#F59E0B', '#8B5CF6', '#22C55E'];
const PRIORITY_COLORS = ['#22C55E', '#F59E0B', '#EF4444'];

export function AnalyticsView({ tasks, users }: Props) {
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week');

  const doneCount      = tasks.filter(t => t.status === 'DONE').length;
  const inProgressCount= tasks.filter(t => t.status === 'IN_PROGRESS').length;
  const overdueCount   = tasks.filter(t => t.status !== 'DONE' && new Date(t.dueDate) < new Date()).length;

  const statusData = [
    { name: 'Новые',      value: tasks.filter(t => t.status === 'NEW').length },
    { name: 'В работе',   value: inProgressCount },
    { name: 'На проверке',value: tasks.filter(t => t.status === 'ON_REVIEW').length },
    { name: 'Завершено',  value: doneCount },
  ];

  const priorityData = [
    { name: 'Низкий',  value: tasks.filter(t => t.priority === 'LOW').length },
    { name: 'Средний', value: tasks.filter(t => t.priority === 'MEDIUM').length },
    { name: 'Высокий', value: tasks.filter(t => t.priority === 'HIGH').length },
  ];

  const assigneeIds = [...new Set(tasks.flatMap(t => t.assigneeIds))];
  const performanceData = assigneeIds.map(id => {
    const user = users.find(u => u.id === id);
    const userTasks = tasks.filter(t => t.assigneeIds.includes(id));
    const done = userTasks.filter(t => t.status === 'DONE').length;
    const overdue = userTasks.filter(t => t.status !== 'DONE' && new Date(t.dueDate) < new Date()).length;
    return { name: user?.name?.split(' ')[0] || id, done, overdue, total: userTasks.length };
  }).filter(d => d.total > 0).slice(0, 8);

  const completedOverTime = tasks
    .filter(t => t.status === 'DONE' && t.completedAt)
    .reduce((acc, t) => {
      const date = new Date(t.completedAt!);
      let key: string;
      if (period === 'day') key = date.toLocaleDateString('ru');
      else if (period === 'week') key = `Нед ${Math.ceil(date.getDate() / 7)}`;
      else key = date.toLocaleDateString('ru', { month: 'short' });
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const timelineData = Object.entries(completedOverTime).map(([name, completed]) => ({ name, completed }));

  const statCards = [
    { label: 'Всего задач',  value: tasks.length,   icon: ListTodo,     color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-100' },
    { label: 'Завершено',    value: doneCount,       icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    { label: 'В работе',     value: inProgressCount, icon: Clock,        color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-100' },
    { label: 'Просрочено',   value: overdueCount,    icon: AlertTriangle,color: 'text-red-600',     bg: 'bg-red-50',     border: 'border-red-100' },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 xs:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg, border }) => (
          <div key={label} className={`bg-card rounded-xl border ${border} p-4 sm:p-5 flex items-center gap-3 sm:gap-4 shadow-sm`}>
            <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        {/* Status pie */}
        <Card className="border-border/70 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Задачи по статусам</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} innerRadius={40} dataKey="value" paddingAngle={3}>
                  {statusData.map((_, i) => <Cell key={i} fill={STATUS_COLORS[i]} />)}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Priority bar */}
        <Card className="border-border/70 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Задачи по приоритету</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={priorityData} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 88%)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {priorityData.map((_, i) => <Cell key={i} fill={PRIORITY_COLORS[i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Performance bar */}
        <Card className="border-border/70 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Производительность сотрудников</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={performanceData} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 88%)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Legend iconType="circle" iconSize={8} />
                <Bar dataKey="done"   name="Завершено"  fill="#22C55E" radius={[4, 4, 0, 0]} />
                <Bar dataKey="overdue"name="Просрочено" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Timeline line chart */}
        <Card className="border-border/70 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2">
              <CardTitle className="text-sm font-semibold">Динамика выполнения</CardTitle>
              <Select value={period} onValueChange={v => setPeriod(v as typeof period)}>
                <SelectTrigger className="w-full xs:w-[120px] h-8 xs:h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">По дням</SelectItem>
                  <SelectItem value="week">По неделям</SelectItem>
                  <SelectItem value="month">По месяцам</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 88%)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="completed"
                  name="Завершено"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#3B82F6' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
