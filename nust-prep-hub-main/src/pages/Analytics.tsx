import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  BookOpen,
  Trophy,
  AlertTriangle,
} from 'lucide-react';

interface SubjectPerformance {
  subject: string;
  attempted: number;
  correct: number;
  accuracy: number;
}

interface TestHistory {
  date: string;
  score: number;
  testName: string;
}

interface TopicStats {
  topic: string;
  subject: string;
  attempted: number;
  correct: number;
  accuracy: number;
}

export default function Analytics() {
  const [subjectPerformance, setSubjectPerformance] = useState<SubjectPerformance[]>([]);
  const [testHistory, setTestHistory] = useState<TestHistory[]>([]);
  const [topicStats, setTopicStats] = useState<TopicStats[]>([]);
  const [overallStats, setOverallStats] = useState({
    totalQuestions: 0,
    correctAnswers: 0,
    totalTests: 0,
    averageScore: 0,
    studyStreak: 1,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // Fetch user progress with topic and subject info
        const { data: progressData } = await supabase
          .from('user_progress')
          .select(`
            questions_attempted,
            questions_correct,
            topics (
              name,
              subjects (
                name
              )
            )
          `);

        if (progressData) {
          // Calculate topic-level stats
          const topicStatsMap: TopicStats[] = progressData.map((p: any) => ({
            topic: p.topics?.name || 'Unknown',
            subject: p.topics?.subjects?.name || 'Unknown',
            attempted: p.questions_attempted || 0,
            correct: p.questions_correct || 0,
            accuracy: p.questions_attempted > 0
              ? Math.round((p.questions_correct / p.questions_attempted) * 100)
              : 0,
          }));

          setTopicStats(topicStatsMap);

          // Aggregate by subject
          const subjectMap = new Map<string, { attempted: number; correct: number }>();
          progressData.forEach((p: any) => {
            const subjectName = p.topics?.subjects?.name || 'Unknown';
            const existing = subjectMap.get(subjectName) || { attempted: 0, correct: 0 };
            subjectMap.set(subjectName, {
              attempted: existing.attempted + (p.questions_attempted || 0),
              correct: existing.correct + (p.questions_correct || 0),
            });
          });

          const subjectPerf = Array.from(subjectMap.entries()).map(([subject, stats]) => ({
            subject,
            attempted: stats.attempted,
            correct: stats.correct,
            accuracy: stats.attempted > 0 ? Math.round((stats.correct / stats.attempted) * 100) : 0,
          }));

          setSubjectPerformance(subjectPerf);

          // Calculate overall stats
          const totalQuestions = progressData.reduce((acc, p) => acc + (p.questions_attempted || 0), 0);
          const correctAnswers = progressData.reduce((acc, p) => acc + (p.questions_correct || 0), 0);

          setOverallStats((prev) => ({
            ...prev,
            totalQuestions,
            correctAnswers,
          }));
        }

        // Fetch test history
        const { data: testData } = await supabase
          .from('test_attempts')
          .select('completed_at, percentage, tests(title)')
          .not('completed_at', 'is', null)
          .order('completed_at', { ascending: true })
          .limit(10);

        if (testData) {
          const history = testData.map((t: any) => ({
            date: new Date(t.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            score: Math.round(t.percentage || 0),
            testName: t.tests?.title || 'Test',
          }));

          setTestHistory(history);

          setOverallStats((prev) => ({
            ...prev,
            totalTests: testData.length,
            averageScore: testData.length > 0
              ? Math.round(testData.reduce((acc, t) => acc + (t.percentage || 0), 0) / testData.length)
              : 0,
          }));
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const overallAccuracy = overallStats.totalQuestions > 0
    ? Math.round((overallStats.correctAnswers / overallStats.totalQuestions) * 100)
    : 0;

  const weakTopics = topicStats
    .filter((t) => t.attempted >= 5 && t.accuracy < 60)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 5);

  const strongTopics = topicStats
    .filter((t) => t.attempted >= 5 && t.accuracy >= 70)
    .sort((a, b) => b.accuracy - a.accuracy)
    .slice(0, 5);

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--success))', 'hsl(var(--warning))'];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-display font-bold">Performance Analytics</h1>
        <p className="text-muted-foreground mt-2">
          Track your progress and identify areas for improvement
        </p>
      </div>

      {/* Overview stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overall Accuracy
            </CardTitle>
            <Target className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{overallAccuracy}%</div>
            <Progress value={overallAccuracy} className="h-2 mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {overallStats.correctAnswers} / {overallStats.totalQuestions} correct
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Test Score
            </CardTitle>
            <Trophy className="h-5 w-5 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{overallStats.averageScore}%</div>
            <p className="text-xs text-muted-foreground mt-2">
              Based on {overallStats.totalTests} test{overallStats.totalTests !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Questions Practiced
            </CardTitle>
            <BookOpen className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{overallStats.totalQuestions}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Across all subjects
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Study Streak
            </CardTitle>
            <Clock className="h-5 w-5 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{overallStats.studyStreak} day</div>
            <p className="text-xs text-muted-foreground mt-2">Keep it going! 🔥</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="subjects" className="space-y-6">
        <TabsList className="grid w-full max-w-lg grid-cols-3 h-12">
          <TabsTrigger value="subjects">By Subject</TabsTrigger>
          <TabsTrigger value="trends">Score Trends</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Subject-wise performance */}
        <TabsContent value="subjects" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Subject Performance</CardTitle>
              <CardDescription>Your accuracy across different subjects</CardDescription>
            </CardHeader>
            <CardContent>
              {subjectPerformance.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={subjectPerformance} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                      <YAxis type="category" dataKey="subject" width={100} />
                      <ChartTooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="rounded-lg border bg-background p-3 shadow-lg">
                                <p className="font-medium">{data.subject}</p>
                                <p className="text-sm text-muted-foreground">
                                  Accuracy: {data.accuracy}%
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {data.correct} / {data.attempted} correct
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar
                        dataKey="accuracy"
                        fill="hsl(var(--primary))"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center text-muted-foreground">
                  Start practicing to see your subject performance
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Score trends */}
        <TabsContent value="trends" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Test Score Trends</CardTitle>
              <CardDescription>Your test scores over time</CardDescription>
            </CardHeader>
            <CardContent>
              {testHistory.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={testHistory}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                      <ChartTooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="rounded-lg border bg-background p-3 shadow-lg">
                                <p className="font-medium">{data.testName}</p>
                                <p className="text-sm text-muted-foreground">
                                  Score: {data.score}%
                                </p>
                                <p className="text-sm text-muted-foreground">{data.date}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="hsl(var(--primary))"
                        strokeWidth={3}
                        dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center text-muted-foreground">
                  Complete some tests to see your score trends
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights */}
        <TabsContent value="insights" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Weak areas */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  Areas to Improve
                </CardTitle>
                <CardDescription>Topics where you need more practice</CardDescription>
              </CardHeader>
              <CardContent>
                {weakTopics.length > 0 ? (
                  <div className="space-y-4">
                    {weakTopics.map((topic, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex-1 min-w-0 mr-4">
                          <p className="font-medium truncate">{topic.topic}</p>
                          <p className="text-sm text-muted-foreground">{topic.subject}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="destructive">{topic.accuracy}%</Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {topic.correct}/{topic.attempted}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Practice more questions to identify weak areas
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Strong areas */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-success" />
                  Strong Areas
                </CardTitle>
                <CardDescription>Topics where you excel</CardDescription>
              </CardHeader>
              <CardContent>
                {strongTopics.length > 0 ? (
                  <div className="space-y-4">
                    {strongTopics.map((topic, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex-1 min-w-0 mr-4">
                          <p className="font-medium truncate">{topic.topic}</p>
                          <p className="text-sm text-muted-foreground">{topic.subject}</p>
                        </div>
                        <div className="text-right">
                          <Badge className="bg-success">{topic.accuracy}%</Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {topic.correct}/{topic.attempted}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Keep practicing to identify your strengths
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
