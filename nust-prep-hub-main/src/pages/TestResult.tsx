import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Trophy,
  Clock,
  CheckCircle2,
  XCircle,
  MinusCircle,
  RotateCcw,
  ChevronRight,
  Target,
  TrendingUp,
  Lightbulb,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TestResult {
  id: string;
  test_id: string;
  started_at: string;
  completed_at: string;
  time_taken_seconds: number;
  total_questions: number;
  correct_answers: number;
  wrong_answers: number;
  skipped_answers: number;
  score: number;
  max_score: number;
  percentage: number;
  is_passed: boolean;
  answers: Record<string, { selected: string; marked: boolean }>;
}

interface Test {
  id: string;
  title: string;
  negative_marking: boolean;
  negative_marks_value: number;
  passing_percentage: number;
}

interface Question {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  explanation: string | null;
  difficulty: string;
}

export default function TestResult() {
  const { testId, attemptId } = useParams();
  const [result, setResult] = useState<TestResult | null>(null);
  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      if (!testId || !attemptId) return;

      const [resultRes, testRes, questionsRes] = await Promise.all([
        supabase.from('test_attempts').select('*').eq('id', attemptId).single(),
        supabase.from('tests').select('*').eq('id', testId).single(),
        supabase
          .from('test_questions')
          .select('question_id, questions(*)')
          .eq('test_id', testId)
          .order('question_order'),
      ]);

      if (resultRes.data) {
        const data = resultRes.data;
        const parsedAnswers = (data.answers && typeof data.answers === 'object' && !Array.isArray(data.answers))
          ? data.answers as Record<string, { selected: string; marked: boolean }>
          : {};
        setResult({
          ...data,
          answers: parsedAnswers,
        } as TestResult);
      }
      if (testRes.data) setTest(testRes.data);
      if (questionsRes.data) {
        const qs = questionsRes.data
          .map((tq: any) => tq.questions)
          .filter(Boolean) as Question[];
        setQuestions(qs);
      }

      setIsLoading(false);
    };

    fetchData();
  }, [testId, attemptId]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const toggleQuestion = (id: string) => {
    setExpandedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (!result || !test) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Result not found.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/tests">Back to Tests</Link>
        </Button>
      </div>
    );
  }

  const answers = result.answers || {};

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Result summary card */}
      <Card className={cn(
        'border-0 shadow-xl overflow-hidden',
        result.is_passed ? 'bg-gradient-to-br from-success/10 to-success/5' : 'bg-gradient-to-br from-destructive/10 to-destructive/5'
      )}>
        <CardContent className="py-8">
          <div className="text-center mb-6">
            <div className={cn(
              'inline-flex h-20 w-20 items-center justify-center rounded-full mb-4',
              result.is_passed ? 'bg-success/20' : 'bg-destructive/20'
            )}>
              {result.is_passed ? (
                <Trophy className="h-10 w-10 text-success" />
              ) : (
                <Target className="h-10 w-10 text-destructive" />
              )}
            </div>
            <h1 className="text-3xl font-display font-bold mb-2">
              {result.is_passed ? 'Congratulations! 🎉' : 'Keep Practicing! 💪'}
            </h1>
            <p className="text-muted-foreground">
              {result.is_passed
                ? 'You passed the test successfully!'
                : `You need ${test.passing_percentage}% to pass. Try again!`}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            <div className="text-center p-4 rounded-xl bg-background/60">
              <p className="text-4xl font-bold text-primary">{Math.round(result.percentage)}%</p>
              <p className="text-sm text-muted-foreground">Score</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-background/60">
              <p className="text-4xl font-bold text-success">{result.correct_answers}</p>
              <p className="text-sm text-muted-foreground">Correct</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-background/60">
              <p className="text-4xl font-bold text-destructive">{result.wrong_answers}</p>
              <p className="text-sm text-muted-foreground">Wrong</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-background/60">
              <p className="text-4xl font-bold text-muted-foreground">{result.skipped_answers}</p>
              <p className="text-sm text-muted-foreground">Skipped</p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>Time taken: {formatTime(result.time_taken_seconds)}</span>
            </div>
            {test.negative_marking && (
              <div className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                <span>Final score: {result.score.toFixed(2)}/{result.max_score}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {result.total_questions > 0
                    ? Math.round((result.correct_answers / result.total_questions) * 100)
                    : 0}%
                </p>
                <p className="text-sm text-muted-foreground">Accuracy</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {result.total_questions > 0
                    ? Math.round(result.time_taken_seconds / result.total_questions)
                    : 0}s
                </p>
                <p className="text-sm text-muted-foreground">Avg. per question</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <Target className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{result.total_questions - result.skipped_answers}</p>
                <p className="text-sm text-muted-foreground">Questions attempted</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-center gap-4">
        <Button asChild variant="outline">
          <Link to="/tests">
            <ChevronRight className="h-4 w-4 mr-2 rotate-180" />
            Back to Tests
          </Link>
        </Button>
        <Button asChild>
          <Link to="/tests">
            <RotateCcw className="h-4 w-4 mr-2" />
            Try Again
          </Link>
        </Button>
      </div>

      {/* Detailed review */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Answer Review</CardTitle>
          <CardDescription>Review your answers and learn from mistakes</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
              {questions.map((question, index) => {
                const answer = answers[question.id];
                const selectedOption = answer?.selected;
                const isCorrect = selectedOption === question.correct_option;
                const isSkipped = !selectedOption;
                const isExpanded = expandedQuestions.has(question.id);

                return (
                  <div
                    key={question.id}
                    className={cn(
                      'rounded-xl border-2 transition-all',
                      isSkipped
                        ? 'border-muted'
                        : isCorrect
                        ? 'border-success/30'
                        : 'border-destructive/30'
                    )}
                  >
                    <button
                      onClick={() => toggleQuestion(question.id)}
                      className="w-full p-4 text-left"
                    >
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          'h-8 w-8 shrink-0 rounded-lg flex items-center justify-center text-sm font-bold',
                          isSkipped
                            ? 'bg-muted'
                            : isCorrect
                            ? 'bg-success text-success-foreground'
                            : 'bg-destructive text-destructive-foreground'
                        )}>
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium line-clamp-2">{question.question_text}</p>
                          <div className="flex items-center gap-3 mt-2 text-sm">
                            {isSkipped ? (
                              <Badge variant="secondary">
                                <MinusCircle className="h-3 w-3 mr-1" />
                                Skipped
                              </Badge>
                            ) : isCorrect ? (
                              <Badge variant="default" className="bg-success">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Correct
                              </Badge>
                            ) : (
                              <Badge variant="destructive">
                                <XCircle className="h-3 w-3 mr-1" />
                                Wrong
                              </Badge>
                            )}
                            <Badge variant="outline">{question.difficulty}</Badge>
                          </div>
                        </div>
                        <ChevronRight
                          className={cn(
                            'h-5 w-5 text-muted-foreground transition-transform',
                            isExpanded && 'rotate-90'
                          )}
                        />
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 animate-fade-in">
                        <Separator className="mb-4" />
                        <div className="space-y-2">
                          {['A', 'B', 'C', 'D'].map((option) => {
                            const optionText =
                              question[`option_${option.toLowerCase()}` as keyof Question] as string;
                            const isCorrectOption = question.correct_option === option;
                            const isSelectedOption = selectedOption === option;

                            return (
                              <div
                                key={option}
                                className={cn(
                                  'p-3 rounded-lg text-sm',
                                  isCorrectOption
                                    ? 'bg-success/10 border border-success/30'
                                    : isSelectedOption && !isCorrectOption
                                    ? 'bg-destructive/10 border border-destructive/30'
                                    : 'bg-muted/50'
                                )}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="font-bold">{option}.</span>
                                  <span>{optionText}</span>
                                  {isCorrectOption && (
                                    <CheckCircle2 className="h-4 w-4 text-success ml-auto" />
                                  )}
                                  {isSelectedOption && !isCorrectOption && (
                                    <XCircle className="h-4 w-4 text-destructive ml-auto" />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {question.explanation && (
                          <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
                            <div className="flex items-center gap-2 mb-2 text-primary font-medium">
                              <Lightbulb className="h-4 w-4" />
                              Explanation
                            </div>
                            <p className="text-sm text-muted-foreground">{question.explanation}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
