import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Clock,
  Flag,
  ChevronLeft,
  ChevronRight,
  Send,
  AlertTriangle,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Test {
  id: string;
  title: string;
  duration_minutes: number;
  total_questions: number;
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
  difficulty: string;
}

interface TestAttempt {
  id: string;
  started_at: string;
  answers: Record<string, { selected: string; marked: boolean }>;
}

export default function TestAttempt() {
  const { testId, attemptId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [test, setTest] = useState<Test | null>(null);
  const [attempt, setAttempt] = useState<TestAttempt | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { selected: string; marked: boolean }>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentQuestion = questions[currentIndex];

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate stats
  const answeredCount = Object.values(answers).filter((a) => a.selected).length;
  const markedCount = Object.values(answers).filter((a) => a.marked).length;
  const unansweredCount = questions.length - answeredCount;

  const submitTest = useCallback(async () => {
    if (!test || !attempt || !user || isSubmitting) return;

    setIsSubmitting(true);

    let correctAnswers = 0;
    let wrongAnswers = 0;
    let skippedAnswers = 0;

    questions.forEach((q) => {
      const answer = answers[q.id];
      if (!answer?.selected) {
        skippedAnswers++;
      } else if (answer.selected === q.correct_option) {
        correctAnswers++;
      } else {
        wrongAnswers++;
      }
    });

    // Calculate score with negative marking
    let score = correctAnswers;
    if (test.negative_marking) {
      score -= wrongAnswers * test.negative_marks_value;
    }
    score = Math.max(0, score);

    const maxScore = questions.length;
    const percentage = (score / maxScore) * 100;
    const isPassed = percentage >= test.passing_percentage;

    const timeTaken = test.duration_minutes * 60 - timeLeft;

    const { error } = await supabase
      .from('test_attempts')
      .update({
        completed_at: new Date().toISOString(),
        time_taken_seconds: timeTaken,
        correct_answers: correctAnswers,
        wrong_answers: wrongAnswers,
        skipped_answers: skippedAnswers,
        score,
        percentage,
        is_passed: isPassed,
        answers,
      })
      .eq('id', attempt.id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error submitting test',
        description: 'Please try again.',
      });
      setIsSubmitting(false);
    } else {
      navigate(`/tests/${testId}/result/${attemptId}`);
    }
  }, [test, attempt, user, questions, answers, timeLeft, isSubmitting, navigate, testId, attemptId, toast]);

  useEffect(() => {
    const fetchData = async () => {
      if (!testId || !attemptId) return;

      const [testRes, attemptRes, questionsRes] = await Promise.all([
        supabase.from('tests').select('*').eq('id', testId).single(),
        supabase.from('test_attempts').select('*').eq('id', attemptId).single(),
        supabase
          .from('test_questions')
          .select('question_id, questions(*)')
          .eq('test_id', testId)
          .order('question_order'),
      ]);

      if (testRes.data) setTest(testRes.data);
      if (attemptRes.data) {
        const attemptData = attemptRes.data;
        const parsedAnswers = (attemptData.answers && typeof attemptData.answers === 'object' && !Array.isArray(attemptData.answers))
          ? attemptData.answers as Record<string, { selected: string; marked: boolean }>
          : {};
        
        setAttempt({
          id: attemptData.id,
          started_at: attemptData.started_at,
          answers: parsedAnswers,
        });
        setAnswers(parsedAnswers);

        // Calculate remaining time
        const startTime = new Date(attemptRes.data.started_at).getTime();
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const duration = testRes.data?.duration_minutes * 60 || 0;
        const remaining = Math.max(0, duration - elapsed);
        setTimeLeft(remaining);
      }
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

  // Timer
  useEffect(() => {
    if (timeLeft <= 0 || !test) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Auto-submit when time runs out
          submitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timeLeft, test, submitTest]);

  // Save answers periodically
  useEffect(() => {
    if (!attemptId || Object.keys(answers).length === 0) return;

    const saveTimeout = setTimeout(() => {
      supabase
        .from('test_attempts')
        .update({ answers })
        .eq('id', attemptId);
    }, 2000);

    return () => clearTimeout(saveTimeout);
  }, [answers, attemptId]);

  const handleAnswerSelect = (option: string) => {
    if (!currentQuestion) return;

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        ...prev[currentQuestion.id],
        selected: option,
        marked: prev[currentQuestion.id]?.marked || false,
      },
    }));
  };

  const toggleMarkForReview = () => {
    if (!currentQuestion) return;

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        ...prev[currentQuestion.id],
        selected: prev[currentQuestion.id]?.selected || '',
        marked: !prev[currentQuestion.id]?.marked,
      },
    }));
  };

  const goToQuestion = (index: number) => {
    setCurrentIndex(index);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (!test || !attempt || questions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Test not found or no questions available.</p>
        <Button asChild variant="outline" className="mt-4">
          <a href="/tests">Back to Tests</a>
        </Button>
      </div>
    );
  }

  const isTimeWarning = timeLeft < 300; // Less than 5 minutes
  const isTimeCritical = timeLeft < 60; // Less than 1 minute

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Header with timer */}
      <Card className="border-0 shadow-lg sticky top-0 z-10 bg-background/95 backdrop-blur">
        <CardContent className="py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-display font-bold text-lg">{test.title}</h1>
              <p className="text-sm text-muted-foreground">
                Question {currentIndex + 1} of {questions.length}
              </p>
            </div>

            <div className="flex items-center gap-6">
              {/* Timer */}
              <div
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg font-bold',
                  isTimeCritical
                    ? 'bg-destructive text-destructive-foreground animate-pulse'
                    : isTimeWarning
                    ? 'bg-warning text-warning-foreground'
                    : 'bg-muted'
                )}
              >
                <Clock className="h-5 w-5" />
                {formatTime(timeLeft)}
              </div>

              {/* Submit button */}
              <Button
                onClick={() => setShowSubmitDialog(true)}
                className="bg-gradient-primary"
              >
                <Send className="h-4 w-4 mr-2" />
                Submit Test
              </Button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">
                {answeredCount} answered, {markedCount} marked for review
              </span>
              <span className="font-medium">
                {Math.round((answeredCount / questions.length) * 100)}%
              </span>
            </div>
            <Progress value={(answeredCount / questions.length) * 100} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-[1fr,280px] gap-6">
        {/* Question area */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <Badge variant={
                currentQuestion.difficulty === 'easy'
                  ? 'secondary'
                  : currentQuestion.difficulty === 'hard'
                  ? 'destructive'
                  : 'default'
              }>
                {currentQuestion.difficulty}
              </Badge>
              <Button
                variant={answers[currentQuestion.id]?.marked ? 'default' : 'outline'}
                size="sm"
                onClick={toggleMarkForReview}
              >
                <Flag className="h-4 w-4 mr-2" />
                {answers[currentQuestion.id]?.marked ? 'Marked' : 'Mark for review'}
              </Button>
            </div>
            <CardTitle className="text-xl leading-relaxed mt-4">
              {currentQuestion.question_text}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Options */}
            <div className="grid gap-3">
              {['A', 'B', 'C', 'D'].map((option) => {
                const optionText =
                  currentQuestion[`option_${option.toLowerCase()}` as keyof Question] as string;
                const isSelected = answers[currentQuestion.id]?.selected === option;

                return (
                  <button
                    key={option}
                    onClick={() => handleAnswerSelect(option)}
                    className={cn(
                      'w-full text-left p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer',
                      isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold transition-colors',
                          isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        )}
                      >
                        {option}
                      </span>
                      <span>{optionText}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4">
              <Button
                variant="outline"
                onClick={() => goToQuestion(currentIndex - 1)}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              <Button
                onClick={() => goToQuestion(currentIndex + 1)}
                disabled={currentIndex === questions.length - 1}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Question palette */}
        <Card className="border-0 shadow-lg h-fit sticky top-32">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Question Palette</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] pr-4">
              <div className="grid grid-cols-5 gap-2">
                {questions.map((q, index) => {
                  const answer = answers[q.id];
                  const isAnswered = !!answer?.selected;
                  const isMarked = !!answer?.marked;
                  const isCurrent = index === currentIndex;

                  return (
                    <button
                      key={q.id}
                      onClick={() => goToQuestion(index)}
                      className={cn(
                        'h-10 w-10 rounded-lg text-sm font-medium transition-all',
                        isCurrent && 'ring-2 ring-primary ring-offset-2',
                        isAnswered && isMarked
                          ? 'bg-warning text-warning-foreground'
                          : isAnswered
                          ? 'bg-success text-success-foreground'
                          : isMarked
                          ? 'bg-warning/20 text-warning border border-warning'
                          : 'bg-muted hover:bg-muted/80'
                      )}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Legend */}
            <div className="mt-4 pt-4 border-t space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded bg-success" />
                <span>Answered ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded bg-warning" />
                <span>Marked for review ({markedCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded bg-muted" />
                <span>Not answered ({unansweredCount})</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Submit confirmation dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Test?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>Are you sure you want to submit this test? This action cannot be undone.</p>
                <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-success">{answeredCount}</p>
                    <p className="text-xs text-muted-foreground">Answered</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-warning">{markedCount}</p>
                    <p className="text-xs text-muted-foreground">Marked</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-destructive">{unansweredCount}</p>
                    <p className="text-xs text-muted-foreground">Unanswered</p>
                  </div>
                </div>
                {unansweredCount > 0 && (
                  <div className="flex items-center gap-2 text-warning">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm">You have {unansweredCount} unanswered questions.</span>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Test</AlertDialogCancel>
            <AlertDialogAction onClick={submitTest} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Test'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
