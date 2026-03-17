import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Clock,
  FileQuestion,
  Trophy,
  AlertTriangle,
  ChevronRight,
  Play,
  History,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface Test {
  id: string;
  title: string;
  description: string | null;
  test_type: string;
  duration_minutes: number;
  total_questions: number;
  negative_marking: boolean;
  negative_marks_value: number;
  passing_percentage: number;
  fields?: { name: string } | null;
  subjects?: { name: string } | null;
}

interface TestAttempt {
  id: string;
  test_id: string;
  started_at: string;
  completed_at: string | null;
  percentage: number;
  is_passed: boolean | null;
  correct_answers: number;
  wrong_answers: number;
  skipped_answers: number;
  tests: { title: string } | null;
}

export default function Tests() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tests, setTests] = useState<Test[]>([]);
  const [attempts, setAttempts] = useState<TestAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('available');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      const [testsRes, attemptsRes] = await Promise.all([
        supabase
          .from('tests')
          .select('*, fields(name), subjects(name)')
          .eq('is_active', true)
          .order('created_at', { ascending: false }),
        supabase
          .from('test_attempts')
          .select('*, tests(title)')
          .order('started_at', { ascending: false })
          .limit(20),
      ]);

      if (testsRes.data) setTests(testsRes.data);
      if (attemptsRes.data) setAttempts(attemptsRes.data as TestAttempt[]);

      setIsLoading(false);
    };

    fetchData();
  }, []);

  const startTest = async (test: Test) => {
    if (!user) return;

    // Check for incomplete attempts
    const { data: existingAttempt } = await supabase
      .from('test_attempts')
      .select('id')
      .eq('user_id', user.id)
      .eq('test_id', test.id)
      .is('completed_at', null)
      .maybeSingle();

    if (existingAttempt) {
      // Resume existing attempt
      navigate(`/tests/${test.id}/attempt/${existingAttempt.id}`);
    } else {
      // Create new attempt
      const { data: newAttempt, error } = await supabase
        .from('test_attempts')
        .insert({
          user_id: user.id,
          test_id: test.id,
          total_questions: test.total_questions,
          max_score: test.total_questions,
        })
        .select('id')
        .single();

      if (newAttempt) {
        navigate(`/tests/${test.id}/attempt/${newAttempt.id}`);
      }
    }
  };

  const getTestTypeLabel = (type: string) => {
    switch (type) {
      case 'section':
        return 'Section Test';
      case 'full_length':
        return 'Full Length';
      case 'custom':
        return 'Custom Test';
      default:
        return type;
    }
  };

  const getTestTypeBadge = (type: string) => {
    switch (type) {
      case 'section':
        return 'secondary';
      case 'full_length':
        return 'default';
      case 'custom':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-display font-bold">Mock Tests</h1>
        <p className="text-muted-foreground mt-2">
          Take timed tests to simulate the real NET experience
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2 h-12">
          <TabsTrigger value="available" className="text-base">
            <FileQuestion className="h-4 w-4 mr-2" />
            Available Tests
          </TabsTrigger>
          <TabsTrigger value="history" className="text-base">
            <History className="h-4 w-4 mr-2" />
            Test History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="mt-6">
          {tests.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {tests.map((test) => (
                <Card key={test.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Badge variant={getTestTypeBadge(test.test_type) as any}>
                          {getTestTypeLabel(test.test_type)}
                        </Badge>
                        <CardTitle className="text-lg mt-2">{test.title}</CardTitle>
                      </div>
                    </div>
                    {test.description && (
                      <CardDescription className="line-clamp-2">{test.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{test.duration_minutes} mins</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <FileQuestion className="h-4 w-4" />
                        <span>{test.total_questions} questions</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Trophy className="h-4 w-4" />
                        <span>{test.passing_percentage}% to pass</span>
                      </div>
                      {test.negative_marking && (
                        <div className="flex items-center gap-2 text-warning">
                          <AlertTriangle className="h-4 w-4" />
                          <span>-{test.negative_marks_value}</span>
                        </div>
                      )}
                    </div>

                    {(test.fields || test.subjects) && (
                      <div className="flex flex-wrap gap-2">
                        {test.fields && (
                          <Badge variant="outline" className="text-xs">
                            {test.fields.name}
                          </Badge>
                        )}
                        {test.subjects && (
                          <Badge variant="outline" className="text-xs">
                            {test.subjects.name}
                          </Badge>
                        )}
                      </div>
                    )}

                    <Button className="w-full" onClick={() => startTest(test)}>
                      <Play className="h-4 w-4 mr-2" />
                      Start Test
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-0 shadow-lg">
              <CardContent className="py-12 text-center">
                <FileQuestion className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-medium mb-2">No tests available yet</h3>
                <p className="text-muted-foreground">
                  Tests will be added soon. Meanwhile, you can practice MCQs!
                </p>
                <Button asChild variant="outline" className="mt-6">
                  <Link to="/practice">
                    Practice MCQs
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          {attempts.length > 0 ? (
            <div className="space-y-4">
              {attempts.map((attempt) => (
                <Card key={attempt.id} className="border-0 shadow-md">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-4">
                        {attempt.is_passed !== null ? (
                          attempt.is_passed ? (
                            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                              <CheckCircle2 className="h-5 w-5 text-success" />
                            </div>
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                              <XCircle className="h-5 w-5 text-destructive" />
                            </div>
                          )
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                            <Clock className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <h4 className="font-medium">{attempt.tests?.title || 'Test'}</h4>
                          <p className="text-sm text-muted-foreground">
                            {new Date(attempt.started_at).toLocaleDateString()} at{' '}
                            {new Date(attempt.started_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-2xl font-bold">
                            {Math.round(attempt.percentage)}%
                          </p>
                          <p className="text-xs text-muted-foreground">Score</p>
                        </div>

                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1 text-success">
                            <CheckCircle2 className="h-4 w-4" />
                            {attempt.correct_answers}
                          </div>
                          <div className="flex items-center gap-1 text-destructive">
                            <XCircle className="h-4 w-4" />
                            {attempt.wrong_answers}
                          </div>
                        </div>

                        {attempt.completed_at ? (
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/tests/${attempt.test_id}/result/${attempt.id}`}>
                              View Result
                            </Link>
                          </Button>
                        ) : (
                          <Button size="sm" asChild>
                            <Link to={`/tests/${attempt.test_id}/attempt/${attempt.id}`}>
                              Continue
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-0 shadow-lg">
              <CardContent className="py-12 text-center">
                <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-medium mb-2">No test history yet</h3>
                <p className="text-muted-foreground">
                  Once you take a test, your results will appear here.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
