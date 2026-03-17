import { useEffect, useState, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useToast } from '@/hooks/use-toast';
import {
  ChevronRight,
  CheckCircle2,
  XCircle,
  BookOpen,
  RotateCcw,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Lightbulb,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

interface Field {
  id: string;
  name: string;
}

interface Subject {
  id: string;
  name: string;
  field_id: string;
}

interface Topic {
  id: string;
  name: string;
  subject_id: string;
}

export default function Practice() {
  const { fieldId, subjectId, topicId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [fields, setFields] = useState<Field[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [currentField, setCurrentField] = useState<Field | null>(null);
  const [currentSubject, setCurrentSubject] = useState<Subject | null>(null);
  const [currentTopic, setCurrentTopic] = useState<Topic | null>(null);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const [sessionStats, setSessionStats] = useState({ correct: 0, wrong: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const currentQuestion = questions[currentQuestionIndex];

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      if (topicId) {
        // Practice mode - fetch questions
        const [questionsRes, topicRes, subjectRes, fieldRes] = await Promise.all([
          supabase
            .from('questions')
            .select('*')
            .eq('topic_id', topicId)
            .eq('is_active', true)
            .order('created_at'),
          supabase.from('topics').select('*').eq('id', topicId).single(),
          subjectId ? supabase.from('subjects').select('*').eq('id', subjectId).single() : null,
          fieldId ? supabase.from('fields').select('*').eq('id', fieldId).single() : null,
        ]);

        if (questionsRes.data) {
          // Shuffle questions
          const shuffled = [...questionsRes.data].sort(() => Math.random() - 0.5);
          setQuestions(shuffled);
        }
        if (topicRes?.data) setCurrentTopic(topicRes.data);
        if (subjectRes?.data) setCurrentSubject(subjectRes.data);
        if (fieldRes?.data) setCurrentField(fieldRes.data);
      } else if (subjectId) {
        // Show topics for this subject
        const [topicsRes, subjectRes, fieldRes] = await Promise.all([
          supabase.from('topics').select('*').eq('subject_id', subjectId).order('display_order'),
          supabase.from('subjects').select('*').eq('id', subjectId).single(),
          fieldId ? supabase.from('fields').select('*').eq('id', fieldId).single() : null,
        ]);

        if (topicsRes.data) setTopics(topicsRes.data);
        if (subjectRes?.data) setCurrentSubject(subjectRes.data);
        if (fieldRes?.data) setCurrentField(fieldRes.data);
      } else if (fieldId) {
        // Show subjects for this field
        const [subjectsRes, fieldRes] = await Promise.all([
          supabase.from('subjects').select('*').eq('field_id', fieldId).order('display_order'),
          supabase.from('fields').select('*').eq('id', fieldId).single(),
        ]);

        if (subjectsRes.data) setSubjects(subjectsRes.data);
        if (fieldRes?.data) setCurrentField(fieldRes.data);
      } else {
        // Show all fields
        const { data } = await supabase.from('fields').select('*').order('display_order');
        if (data) setFields(data);
      }

      setIsLoading(false);
    };

    fetchData();
  }, [fieldId, subjectId, topicId]);

  useEffect(() => {
    // Check if current question is bookmarked
    const checkBookmark = async () => {
      if (!currentQuestion || !user) return;

      const { data } = await supabase
        .from('bookmarked_questions')
        .select('id')
        .eq('user_id', user.id)
        .eq('question_id', currentQuestion.id)
        .maybeSingle();

      setIsBookmarked(!!data);
    };

    checkBookmark();
  }, [currentQuestion, user]);

  const handleAnswerSelect = async (option: string) => {
    if (isAnswered) return;

    setSelectedAnswer(option);
    setIsAnswered(true);

    const isCorrect = option === currentQuestion.correct_option;

    setSessionStats((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      wrong: prev.wrong + (isCorrect ? 0 : 1),
    }));

    // Update user progress
    if (user && topicId) {
      const { data: existingProgress } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('topic_id', topicId)
        .maybeSingle();

      if (existingProgress) {
        await supabase
          .from('user_progress')
          .update({
            questions_attempted: existingProgress.questions_attempted + 1,
            questions_correct: existingProgress.questions_correct + (isCorrect ? 1 : 0),
            last_practiced_at: new Date().toISOString(),
          })
          .eq('id', existingProgress.id);
      } else {
        await supabase.from('user_progress').insert({
          user_id: user.id,
          topic_id: topicId,
          questions_attempted: 1,
          questions_correct: isCorrect ? 1 : 0,
          last_practiced_at: new Date().toISOString(),
        });
      }
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setShowExplanation(false);
    }
  };

  const handleRestartPractice = () => {
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    setQuestions(shuffled);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setShowExplanation(false);
    setSessionStats({ correct: 0, wrong: 0 });
  };

  const toggleBookmark = async () => {
    if (!currentQuestion || !user) return;

    if (isBookmarked) {
      await supabase
        .from('bookmarked_questions')
        .delete()
        .eq('user_id', user.id)
        .eq('question_id', currentQuestion.id);

      setIsBookmarked(false);
      toast({ description: 'Removed from bookmarks' });
    } else {
      await supabase.from('bookmarked_questions').insert({
        user_id: user.id,
        question_id: currentQuestion.id,
      });

      setIsBookmarked(true);
      toast({ description: 'Added to bookmarks' });
    }
  };

  const getOptionClass = (option: string) => {
    if (!isAnswered) {
      return selectedAnswer === option
        ? 'border-primary bg-primary/5'
        : 'border-border hover:border-primary/50 hover:bg-muted/50';
    }

    if (option === currentQuestion.correct_option) {
      return 'border-success bg-success/10';
    }

    if (selectedAnswer === option && option !== currentQuestion.correct_option) {
      return 'border-destructive bg-destructive/10';
    }

    return 'border-border opacity-50';
  };

  const renderBreadcrumbs = () => (
    <Breadcrumb className="mb-6">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/practice">Practice</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {currentField && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {subjectId ? (
                <BreadcrumbLink asChild>
                  <Link to={`/practice/${fieldId}`}>{currentField.name}</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{currentField.name}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </>
        )}
        {currentSubject && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {topicId ? (
                <BreadcrumbLink asChild>
                  <Link to={`/practice/${fieldId}/${subjectId}`}>{currentSubject.name}</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{currentSubject.name}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </>
        )}
        {currentTopic && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{currentTopic.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  // Practice mode - show questions
  if (currentTopic && questions.length > 0) {
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
    const sessionAccuracy = sessionStats.correct + sessionStats.wrong > 0
      ? Math.round((sessionStats.correct / (sessionStats.correct + sessionStats.wrong)) * 100)
      : 0;

    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        {renderBreadcrumbs()}

        {/* Progress bar and stats */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span className="font-medium">{sessionStats.correct}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <XCircle className="h-4 w-4 text-destructive" />
              <span className="font-medium">{sessionStats.wrong}</span>
            </div>
            <Badge variant="outline">{sessionAccuracy}% accuracy</Badge>
          </div>
        </div>

        {/* Question card */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <Badge
                    variant={
                      currentQuestion.difficulty === 'easy'
                        ? 'secondary'
                        : currentQuestion.difficulty === 'hard'
                        ? 'destructive'
                        : 'default'
                    }
                  >
                    {currentQuestion.difficulty}
                  </Badge>
                </div>
                <CardTitle className="text-xl leading-relaxed">
                  {currentQuestion.question_text}
                </CardTitle>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleBookmark}
                className="shrink-0"
              >
                {isBookmarked ? (
                  <BookmarkCheck className="h-5 w-5 text-primary" />
                ) : (
                  <Bookmark className="h-5 w-5" />
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Options */}
            <div className="grid gap-3">
              {['A', 'B', 'C', 'D'].map((option) => {
                const optionText =
                  currentQuestion[`option_${option.toLowerCase()}` as keyof Question] as string;
                const isCorrectOption = currentQuestion.correct_option === option;
                const isSelectedOption = selectedAnswer === option;

                return (
                  <button
                    key={option}
                    onClick={() => handleAnswerSelect(option)}
                    disabled={isAnswered}
                    className={cn(
                      'w-full text-left p-4 rounded-xl border-2 transition-all duration-200',
                      getOptionClass(option),
                      !isAnswered && 'cursor-pointer'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold',
                          isAnswered && isCorrectOption
                            ? 'bg-success text-success-foreground'
                            : isAnswered && isSelectedOption && !isCorrectOption
                            ? 'bg-destructive text-destructive-foreground'
                            : 'bg-muted'
                        )}
                      >
                        {option}
                      </span>
                      <span className="pt-1">{optionText}</span>
                      {isAnswered && isCorrectOption && (
                        <CheckCircle2 className="h-5 w-5 text-success ml-auto shrink-0" />
                      )}
                      {isAnswered && isSelectedOption && !isCorrectOption && (
                        <XCircle className="h-5 w-5 text-destructive ml-auto shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Explanation */}
            {isAnswered && currentQuestion.explanation && (
              <div className="mt-6">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-primary"
                  onClick={() => setShowExplanation(!showExplanation)}
                >
                  <Lightbulb className="h-4 w-4 mr-2" />
                  {showExplanation ? 'Hide explanation' : 'Show explanation'}
                </Button>
                {showExplanation && (
                  <div className="mt-3 p-4 rounded-xl bg-muted/50 border text-sm animate-fade-in">
                    {currentQuestion.explanation}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={handleRestartPractice}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Restart
          </Button>

          {isAnswered && (
            <Button onClick={handleNextQuestion} disabled={currentQuestionIndex >= questions.length - 1}>
              {currentQuestionIndex >= questions.length - 1 ? (
                'Complete'
              ) : (
                <>
                  Next Question
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          )}
        </div>

        {/* Session complete */}
        {currentQuestionIndex >= questions.length - 1 && isAnswered && (
          <Card className="border-0 shadow-lg bg-gradient-card">
            <CardContent className="py-8 text-center">
              <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
              <h3 className="text-xl font-bold mb-2">Practice Complete!</h3>
              <p className="text-muted-foreground mb-6">
                You answered {sessionStats.correct} out of {questions.length} questions correctly ({sessionAccuracy}%)
              </p>
              <div className="flex items-center justify-center gap-4">
                <Button variant="outline" onClick={handleRestartPractice}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Practice Again
                </Button>
                <Button asChild>
                  <Link to={`/practice/${fieldId}/${subjectId}`}>
                    Try Another Topic
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // No questions for topic
  if (currentTopic && questions.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        {renderBreadcrumbs()}

        <Card className="border-0 shadow-lg">
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-medium mb-2">No questions yet</h3>
            <p className="text-muted-foreground mb-6">
              Questions for {currentTopic.name} will be added soon.
            </p>
            <Button asChild variant="outline">
              <Link to={`/practice/${fieldId}/${subjectId}`}>
                <ChevronRight className="h-4 w-4 mr-2 rotate-180" />
                Back to topics
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show topics for a subject
  if (currentSubject && fieldId) {
    return (
      <div className="space-y-6 animate-fade-in">
        {renderBreadcrumbs()}

        <div>
          <h1 className="text-3xl font-display font-bold">{currentSubject.name}</h1>
          <p className="text-muted-foreground mt-2">Select a topic to start practicing</p>
        </div>

        {topics.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {topics.map((topic) => (
              <Link
                key={topic.id}
                to={`/practice/${fieldId}/${subjectId}/${topic.id}`}
                className="group"
              >
                <Card className="h-full border-0 shadow-md hover:shadow-lg transition-all duration-300 group-hover:-translate-y-1">
                  <CardHeader>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      {topic.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Practice MCQs</span>
                      <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="border-0 shadow-lg">
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-medium mb-2">No topics yet</h3>
              <p className="text-muted-foreground">Topics for this subject will be added soon.</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Show subjects for a field
  if (currentField) {
    return (
      <div className="space-y-6 animate-fade-in">
        {renderBreadcrumbs()}

        <div>
          <h1 className="text-3xl font-display font-bold">{currentField.name}</h1>
          <p className="text-muted-foreground mt-2">Choose a subject to practice</p>
        </div>

        {subjects.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {subjects.map((subject) => (
              <Link
                key={subject.id}
                to={`/practice/${fieldId}/${subject.id}`}
                className="group"
              >
                <Card className="h-full border-0 shadow-md hover:shadow-lg transition-all duration-300 group-hover:-translate-y-1">
                  <CardHeader>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      {subject.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>View topics</span>
                      <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="border-0 shadow-lg">
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-medium mb-2">No subjects yet</h3>
              <p className="text-muted-foreground">Subjects for this field will be added soon.</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Show all fields
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-display font-bold">Practice MCQs</h1>
        <p className="text-muted-foreground mt-2">Choose your field to start practicing</p>
      </div>

      {fields.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {fields.map((field) => (
            <Link key={field.id} to={`/practice/${field.id}`} className="group">
              <Card className="h-full border-0 shadow-md hover:shadow-lg transition-all duration-300 group-hover:-translate-y-1">
                <CardHeader>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">
                    {field.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Start practicing</span>
                    <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="border-0 shadow-lg">
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-medium mb-2">No fields available yet</h3>
            <p className="text-muted-foreground">Content will be added soon. Check back later!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
