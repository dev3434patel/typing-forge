import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe, Type, Calendar } from 'lucide-react';

interface StatsFilterProps {
  language: string;
  setLanguage: (value: string) => void;
  contentType: string;
  setContentType: (value: string) => void;
  timePeriod: string;
  setTimePeriod: (value: string) => void;
}

export function StatsFilter({
  language,
  setLanguage,
  contentType,
  setContentType,
  timePeriod,
  setTimePeriod,
}: StatsFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      <span className="text-sm text-muted-foreground">Show statistics for:</span>
      
      <Select value={language} onValueChange={setLanguage}>
        <SelectTrigger className="w-[180px] h-9">
          <Globe className="w-4 h-4 mr-2 text-muted-foreground" />
          <SelectValue placeholder="Select language" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="en-US">English/United States</SelectItem>
          <SelectItem value="en-UK">English/United Kingdom</SelectItem>
          <SelectItem value="es">Spanish</SelectItem>
          <SelectItem value="fr">French</SelectItem>
          <SelectItem value="de">German</SelectItem>
        </SelectContent>
      </Select>

      <span className="text-muted-foreground">▶</span>

      <Select value={contentType} onValueChange={setContentType}>
        <SelectTrigger className="w-[120px] h-9">
          <Type className="w-4 h-4 mr-2 text-muted-foreground" />
          <SelectValue placeholder="Content type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="letters">Letters</SelectItem>
          <SelectItem value="words">Words</SelectItem>
          <SelectItem value="quotes">Quotes</SelectItem>
          <SelectItem value="code">Code</SelectItem>
        </SelectContent>
      </Select>

      <span className="text-muted-foreground">▶</span>

      <Select value={timePeriod} onValueChange={setTimePeriod}>
        <SelectTrigger className="w-[140px] h-9">
          <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
          <SelectValue placeholder="Time period" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Time</SelectItem>
          <SelectItem value="today">Today</SelectItem>
          <SelectItem value="week">Last 7 Days</SelectItem>
          <SelectItem value="month">Last 30 Days</SelectItem>
          <SelectItem value="year">Last Year</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
