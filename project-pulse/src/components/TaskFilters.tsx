import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { User, Priority } from '@/types';
import { Search, X, CalendarIcon, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export interface FilterState {
  search: string;
  priority: Priority | 'all';
  assigneeId: string;
  dateFrom?: Date;
  dateTo?: Date;
  sortBy: 'created' | 'priority' | 'dueDate';
  sortOrder: 'asc' | 'desc';
}

export const defaultFilters: FilterState = {
  search: '', priority: 'all', assigneeId: 'all', sortBy: 'created', sortOrder: 'desc',
};

interface Props {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  users: User[];
}

export function TaskFilters({ filters, onChange, users }: Props) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const update = (partial: Partial<FilterState>) => onChange({ ...filters, ...partial });
  const hasActiveFilters = filters.search || filters.priority !== 'all' || filters.assigneeId !== 'all' || filters.dateFrom || filters.dateTo;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2.5 flex-wrap">
        {/* Search */}
        <div className="relative w-full sm:flex-1 sm:min-w-[220px] sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Поиск по названию и тегам..."
            value={filters.search}
            onChange={e => update({ search: e.target.value })}
            className="pl-9 h-9 text-sm rounded-lg"
          />
        </div>

        {/* Priority */}
        <Select value={filters.priority} onValueChange={v => update({ priority: v as Priority | 'all' })}>
          <SelectTrigger className="w-full xs:w-[170px] h-9 text-sm rounded-lg">
            <SelectValue placeholder="Приоритет" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все приоритеты</SelectItem>
            <SelectItem value="LOW">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" />Низкий</span>
            </SelectItem>
            <SelectItem value="MEDIUM">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" />Средний</span>
            </SelectItem>
            <SelectItem value="HIGH">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" />Высокий</span>
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Assignee */}
        <Select value={filters.assigneeId} onValueChange={v => update({ assigneeId: v })}>
          <SelectTrigger className="w-full xs:w-[210px] h-9 text-sm rounded-lg">
            <SelectValue placeholder="Исполнитель" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все исполнители</SelectItem>
            {users.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select value={filters.sortBy} onValueChange={v => update({ sortBy: v as FilterState['sortBy'] })}>
          <SelectTrigger className="w-full xs:w-[190px] h-9 text-sm rounded-lg">
            <SelectValue placeholder="Сортировка" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created">По дате создания</SelectItem>
            <SelectItem value="priority">По приоритету</SelectItem>
            <SelectItem value="dueDate">По сроку</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort direction */}
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-lg"
          title={filters.sortOrder === 'desc' ? 'По убыванию' : 'По возрастанию'}
          onClick={() => update({ sortOrder: filters.sortOrder === 'desc' ? 'asc' : 'desc' })}
        >
          <ArrowUpDown className="w-3.5 h-3.5" />
        </Button>

        {/* Advanced */}
        <Button
          variant={showAdvanced ? 'secondary' : 'outline'}
          size="icon"
          className="h-9 w-9 rounded-lg"
          onClick={() => setShowAdvanced(!showAdvanced)}
          title="Расширенные фильтры"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
        </Button>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange(defaultFilters)}
            className="h-9 gap-1.5 text-muted-foreground hover:text-foreground text-xs rounded-lg"
          >
            <X className="w-3 h-3" /> Сбросить
          </Button>
        )}
      </div>

      {showAdvanced && (
        <div className="flex items-center gap-3 flex-wrap bg-muted/30 rounded-lg px-3 py-2.5">
          <span className="text-xs text-muted-foreground font-medium">Срок от:</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn('h-8 text-xs rounded-lg', !filters.dateFrom && 'text-muted-foreground')}>
                <CalendarIcon className="mr-1.5 h-3 w-3" />
                {filters.dateFrom ? format(filters.dateFrom, 'dd.MM.yy') : 'Выбрать'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={filters.dateFrom} onSelect={d => update({ dateFrom: d })} className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
          <span className="text-xs text-muted-foreground font-medium">до:</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn('h-8 text-xs rounded-lg', !filters.dateTo && 'text-muted-foreground')}>
                <CalendarIcon className="mr-1.5 h-3 w-3" />
                {filters.dateTo ? format(filters.dateTo, 'dd.MM.yy') : 'Выбрать'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={filters.dateTo} onSelect={d => update({ dateTo: d })} className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
}
