import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { StatsFilter } from '@/components/stats/StatsFilter';
import { StatsSummary } from '@/components/stats/StatsSummary';
import { AccuracyStreaks } from '@/components/stats/AccuracyStreaks';
import { SpeedHistogram } from '@/components/stats/SpeedHistogram';
import { LearningProgressChart, TypingSpeedChart } from '@/components/stats/LearningProgressChart';
import { KeySpeedChart, KeySpeedHistogram } from '@/components/stats/KeySpeedChart';
import { KeyFrequencyHistogram, KeyFrequencyHeatmap } from '@/components/stats/KeyFrequencyCharts';
import { PracticeCalendar } from '@/components/stats/PracticeCalendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState, useMemo, useEffect } from 'react';
import { Zap, BarChart3, Keyboard, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { getTestHistory } from '@/lib/typing-engine';
import { getCharacterData } from '@/lib/keybr-engine';
import { useNavigate } from 'react-router-dom';
import {
  type TestSession,
  calculateAggregateStats,
  filterByTimePeriod,
  calculateAccuracyStreaks,
  generateSpeedDistribution,
  calculatePercentile,
  prepareLessonData,
  generateCalendarActivities,
} from '@/lib/stats-utils';

const Stats = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  // Filter states
  const [language, setLanguage] = useState('en-US');
  const [contentType, setContentType] = useState('letters');
  const [timePeriod, setTimePeriod] = useState('all');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Data states
  const [testSessions, setTestSessions] = useState<TestSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch data from database or localStorage
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      if (user) {
        // Fetch from Supabase
        const { data, error } = await supabase
          .from('test_sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });
        
        if (!error && data) {
          setTestSessions(data as unknown as TestSession[]);
        }
      } else {
        // Use localStorage data
        const localHistory = getTestHistory();
        setTestSessions(localHistory.map((t, i) => ({
          id: t.id,
          created_at: t.date,
          net_wpm: t.wpm,
          accuracy_percent: t.accuracy,
          consistency_percent: t.consistency,
          duration_seconds: t.duration,
          test_mode: t.mode,
          total_characters: t.totalChars,
          correct_characters: t.correctChars,
          error_count: t.errors,
          per_char_metrics: null,
        })));
      }
      
      setIsLoading(false);
    };
    
    if (!authLoading) {
      fetchData();
    }
  }, [user, authLoading]);

  // Filter tests by time period using utility
  const filteredTests = useMemo(() => {
    let filtered = filterByTimePeriod(testSessions, timePeriod as 'all' | 'week' | 'month' | 'year');
    
    // Filter by content type (mode)
    if (contentType !== 'letters') {
      filtered = filtered.filter(t => t.test_mode.toLowerCase().includes(contentType));
    }
    
    return filtered;
  }, [testSessions, timePeriod, contentType]);

  // Calculate all-time stats using canonical utility
  const allTimeStats = useMemo(() => {
    return calculateAggregateStats(filteredTests);
  }, [filteredTests]);

  // Calculate today's stats using canonical utility
  const todayStats = useMemo(() => {
    const todayTests = filterByTimePeriod(testSessions, 'today');
    return calculateAggregateStats(todayTests);
  }, [testSessions]);

  // Calculate accuracy streaks using canonical utility
  const accuracyStreaks = useMemo(() => {
    return calculateAccuracyStreaks(filteredTests);
  }, [filteredTests]);

  // Generate speed distribution using canonical utility
  const speedDistribution = useMemo(() => {
    return generateSpeedDistribution(filteredTests);
  }, [filteredTests]);

  // Calculate percentile using canonical utility
  const percentileBeat = useMemo(() => {
    return calculatePercentile(filteredTests, allTimeStats.avgSpeed);
  }, [filteredTests, allTimeStats.avgSpeed]);

  // Prepare lesson data using canonical utility
  const lessonData = useMemo(() => {
    return prepareLessonData(filteredTests);
  }, [filteredTests]);

  // Get character stats from localStorage (keybr engine)
  const characterStats = useMemo(() => {
    const charData = getCharacterData();
    return Object.entries(charData).map(([key, data]) => ({
      key,
      lastSpeed: data.wpm || 0,
      topSpeed: data.wpm || 0,
      avgSpeed: data.wpm || 0,
      learningRate: data.confidence >= 0.8 ? 'stable' as const : 
                    data.confidence >= 0.5 ? 'improving' as const : 'uncertain' as const,
      history: [{ lesson: 1, wpm: data.wpm || 0 }],
    }));
  }, [filteredTests]);

  // Key frequency data
  const keyFrequencies = useMemo(() => {
    const charData = getCharacterData();
    return Object.entries(charData).map(([key, data]) => ({
      key,
      hits: data.occurrences || 0,
      misses: Math.round((data.occurrences || 0) * (1 - (data.accuracy || 0) / 100)),
      missRatio: 1 - (data.accuracy || 100) / 100,
    }));
  }, []);

  // Practice calendar data using canonical utility
  const calendarActivities = useMemo(() => {
    return generateCalendarActivities(testSessions);
  }, [testSessions]);

  // Key progress data for learning progress chart
  const keyProgressData = useMemo(() => {
    const unlockedKeys = characterStats
      .filter(k => k.avgSpeed > 0)
      .slice(0, 10)
      .map(k => k.key);
    
    return lessonData.slice(0, 20).map((lesson, i) => {
      const entry: { lesson: number; [key: string]: number } = { lesson: i + 1 };
      unlockedKeys.forEach(key => {
        const charStat = characterStats.find(c => c.key === key);
        entry[key] = charStat ? charStat.avgSpeed : 0;
      });
      return entry;
    });
  }, [lessonData, characterStats]);

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-12 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading statistics...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (testSessions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-12">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl font-bold mb-4">Your Statistics</h1>
            <p className="text-muted-foreground mb-8">
              Complete your first typing test to see your stats here!
            </p>
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              <Zap className="w-4 h-4" />
              Start Typing
            </button>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold mb-6">Your Statistics</h1>
          
          {/* Filters */}
          <StatsFilter
            language={language}
            setLanguage={setLanguage}
            contentType={contentType}
            setContentType={setContentType}
            timePeriod={timePeriod}
            setTimePeriod={setTimePeriod}
          />
          
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="speed" className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span className="hidden sm:inline">Speed</span>
              </TabsTrigger>
              <TabsTrigger value="keys" className="flex items-center gap-2">
                <Keyboard className="w-4 h-4" />
                <span className="hidden sm:inline">Keys</span>
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">Calendar</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              {/* Summary Stats */}
              <div className="grid md:grid-cols-2 gap-6">
                <StatsSummary
                  title="All Time Statistics"
                  {...allTimeStats}
                />
                <StatsSummary
                  title="Statistics for Today"
                  {...todayStats}
                />
              </div>
              
              {/* Accuracy Streaks */}
              <AccuracyStreaks streaks={accuracyStreaks} />
              
              {/* Speed Histogram */}
              <SpeedHistogram
                userAvgSpeed={allTimeStats.avgSpeed}
                userTopSpeed={allTimeStats.topSpeed}
                distribution={speedDistribution}
                percentileBeat={percentileBeat}
              />
            </TabsContent>
            
            <TabsContent value="speed" className="space-y-6">
              {/* Learning Progress */}
              <LearningProgressChart
                lessonData={lessonData}
                keyProgressData={keyProgressData}
                unlockedKeys={characterStats.filter(k => k.avgSpeed > 0).map(k => k.key)}
              />
              
              {/* Typing Speed Chart */}
              <TypingSpeedChart lessonData={lessonData} />
              
              {/* Key Speed Charts */}
              <div className="grid lg:grid-cols-2 gap-6">
                <KeySpeedChart
                  keyData={characterStats}
                  targetWpm={35}
                  selectedKey={selectedKey}
                  onSelectKey={setSelectedKey}
                />
                <KeySpeedHistogram keyData={characterStats} />
              </div>
            </TabsContent>
            
            <TabsContent value="keys" className="space-y-6">
              {/* Key Frequency Charts */}
              <div className="grid lg:grid-cols-2 gap-6">
                <KeyFrequencyHistogram frequencies={keyFrequencies} />
                <KeyFrequencyHeatmap frequencies={keyFrequencies} />
              </div>
            </TabsContent>
            
            <TabsContent value="calendar" className="space-y-6">
              {/* Practice Calendar */}
              <PracticeCalendar activities={calendarActivities} />
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Stats;
