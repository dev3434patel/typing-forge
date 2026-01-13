import { motion } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface DayActivity {
  date: string; // YYYY-MM-DD
  lessonsCompleted: number;
  dailyGoalPercent: number; // 0-100
}

interface PracticeCalendarProps {
  activities: DayActivity[];
  dailyGoal?: number; // Number of lessons for 100% goal
}

export function PracticeCalendar({ activities, dailyGoal = 10 }: PracticeCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  // Adjust for Monday start (0 = Monday, 6 = Sunday)
  const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  
  const activityMap = useMemo(() => {
    const map = new Map<string, DayActivity>();
    activities.forEach(a => map.set(a.date, a));
    return map;
  }, [activities]);

  const getActivityForDay = (day: number): DayActivity | undefined => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return activityMap.get(dateStr);
  };

  const getColorForPercent = (percent: number): string => {
    if (percent >= 100) return 'bg-success';
    if (percent >= 75) return 'bg-success/75';
    if (percent >= 50) return 'bg-success/50';
    if (percent >= 25) return 'bg-success/25';
    if (percent > 0) return 'bg-success/10';
    return 'bg-muted';
  };

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const today = new Date();
  const isToday = (day: number) => 
    year === today.getFullYear() && 
    month === today.getMonth() && 
    day === today.getDate();

  return (
    <motion.div
      className="stat-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
        <Calendar className="w-5 h-5 text-primary" />
        Practice Calendar
      </h3>
      
      <p className="text-sm text-muted-foreground mb-4">
        This calendar shows the dates of active learning.
      </p>

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" onClick={prevMonth}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="font-semibold">
          {year}/{month + 1}
        </span>
        <Button variant="ghost" size="icon" onClick={nextMonth}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
          <div
            key={i}
            className="text-center text-xs font-medium text-muted-foreground py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar days */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells for days before the first of the month */}
        {Array.from({ length: startDay }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}
        
        {/* Days of the month */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const activity = getActivityForDay(day);
          const percent = activity?.dailyGoalPercent || 0;
          
          return (
            <div
              key={day}
              className={cn(
                'aspect-square rounded flex items-center justify-center text-xs font-mono relative group cursor-default',
                getColorForPercent(percent),
                isToday(day) && 'ring-2 ring-primary'
              )}
            >
              <span className={cn(
                percent > 50 ? 'text-success-foreground' : 'text-foreground',
                percent === 0 && 'text-muted-foreground'
              )}>
                {day}
              </span>
              
              {/* Tooltip */}
              {activity && (
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-xs p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 whitespace-nowrap">
                  <div className="font-bold">{monthName} {day}, {year}</div>
                  <div>Lessons: {activity.lessonsCompleted}</div>
                  <div>Goal: {activity.dailyGoalPercent}%</div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-2 mt-4 text-xs">
        <span className="text-muted-foreground">Daily goal:</span>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-success rounded" />
          <span>100%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-success/75 rounded" />
          <span>75%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-success/50 rounded" />
          <span>50%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-success/25 rounded" />
          <span>25%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-muted rounded" />
          <span>0%</span>
        </div>
      </div>
    </motion.div>
  );
}
