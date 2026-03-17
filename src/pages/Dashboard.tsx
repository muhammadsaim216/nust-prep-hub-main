import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  Target,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Zap,
  Trophy,
  Flame,
} from 'lucide-react';

interface DashboardStats {
  questionsAttempted: number;
  questionsCorrect: number;
  testsCompleted: number;
  averageScore: number;
}

interface RecentTest {
  id: string;
  test_title: string;
  percentage: number;
  completed_at: string;
}

export default function Dashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    questionsAttempted: 0,
    questionsCorrect: 0,
    testsCompleted: 0,
    averageScore: 0,
  });
  const [recentTests, setRecentTests] = useState<RecentTest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch user progress stats
        const { data: progressData } = await supabase
          .from('user_progress')
          .select('questions_attempted, questions_correct');

        if (progressData) {
          const totalAttempted = progressData.reduce((acc, p) => acc + (p.questions_attempted || 0), 0);
          const totalCorrect = progressData.reduce((acc, p) => acc + (p.questions_correct || 0), 0);
          setStats((prev) => ({
            ...prev,
            questionsAttempted: totalAttempted,
            questionsCorrect: totalCorrect,
          }));
        }

        // Fetch test attempts
        const { data: testData } = await supabase
          .from('test_attempts')
          .select('id, test_id, percentage, completed_at, tests(title)')
          .not('completed_at', 'is', null)
          .order('completed_at', { ascending: false })
          .limit(5);

        if (testData) {
          setStats((prev) => ({
            ...prev,
            testsCompleted: testData.length,
            averageScore: testData.length > 0
              ? testData.reduce((acc, t) => acc + (t.percentage || 0), 0) / testData.length
              : 0,
          }));

          setRecentTests(
            testData.map((t: any) => ({
              id: t.id,
              test_title: t.tests?.title || 'Test',
              percentage: t.percentage || 0,
              completed_at: t.completed_at,
            }))
          );
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const accuracy = stats.questionsAttempted > 0
    ? Math.round((stats.questionsCorrect / stats.questionsAttempted) * 100)
    : 0;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-hero p-6 lg:p-8 text-primary-foreground">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10">
          <h1 className="text-2xl lg:text-3xl font-display font-bold mb-2">
            {getGreeting()}, {profile?.full_name?.split(' ')[0] || 'Student'}! 👋
          </h1>
          <p className="text-primary-foreground/80 text-lg">
            Ready to conquer the NET today? Let's make progress together.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <Button asChild variant="secondary" size="lg" className="bg-white/20 hover:bg-white/30 text-white border-0">
              <Link to="/practice">
                <Zap className="mr-2 h-5 w-5" />
                Start Practice
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg" className="bg-white/20 hover:bg-white/30 text-white border-0">
              <Link to="/tests">
                <Target className="mr-2 h-5 w-5" />
                Take a Mock Test
              </Link>
            </Button>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden border-0 shadow-lg">
          <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Questions Practiced</CardTitle>
            <BookOpen className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.questionsAttempted}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.questionsCorrect} correct answers
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg">
          <div className="absolute top-0 right-0 w-20 h-20 bg-success/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Accuracy Rate</CardTitle>
            <Target className="h-5 w-5 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">{accuracy}%</div>
            <Progress value={accuracy} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg">
          <div className="absolute top-0 right-0 w-20 h-20 bg-secondary/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tests Completed</CardTitle>
            <Trophy className="h-5 w-5 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.testsCompleted}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Avg. score: {Math.round(stats.averageScore)}%
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg">
          <div className="absolute top-0 right-0 w-20 h-20 bg-accent/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Study Streak</CardTitle>
            <Flame className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">1 day</div>
            <p className="text-xs text-muted-foreground mt-1">
              Keep it going! 🔥
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions and Recent Tests */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Quick Actions
            </CardTitle>
            <CardDescription>Jump into your preparation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/content" className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors group">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Study Notes</p>
                  <p className="text-sm text-muted-foreground">Review topic-wise content</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </Link>

            <Link to="/practice" className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors group">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                  <Target className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <p className="font-medium">Practice MCQs</p>
                  <p className="text-sm text-muted-foreground">Topic-wise practice questions</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </Link>

            <Link to="/tests" className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors group">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="font-medium">Mock Tests</p>
                  <p className="text-sm text-muted-foreground">Timed full-length tests</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </Link>

            <Link to="/analytics" className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors group">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-field-business/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-field-business" />
                </div>
                <div>
                  <p className="font-medium">View Analytics</p>
                  <p className="text-sm text-muted-foreground">Track your progress</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </Link>
          </CardContent>
        </Card>

        {/* Recent Tests */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Recent Tests
            </CardTitle>
            <CardDescription>Your latest test attempts</CardDescription>
          </CardHeader>
          <CardContent>
            {recentTests.length > 0 ? (
              <div className="space-y-3">
                {recentTests.map((test) => (
                  <div
                    key={test.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      {test.percentage >= 50 ? (
                        <CheckCircle2 className="h-5 w-5 text-success" />
                      ) : (
                        <XCircle className="h-5 w-5 text-destructive" />
                      )}
                      <div>
                        <p className="font-medium">{test.test_title}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(test.completed_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={test.percentage >= 70 ? 'default' : test.percentage >= 50 ? 'secondary' : 'destructive'}
                      className="text-base px-3"
                    >
                      {Math.round(test.percentage)}%
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No tests completed yet</p>
                <Button asChild variant="link" className="mt-2">
                  <Link to="/tests">Take your first test</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
