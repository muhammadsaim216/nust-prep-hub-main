import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  Bookmark,
  BookmarkX,
  ChevronRight,
  FileQuestion,
} from 'lucide-react';

interface BookmarkedQuestion {
  id: string;
  question_id: string;
  created_at: string;
  questions: {
    id: string;
    question_text: string;
    difficulty: string;
    topics: {
      id: string;
      name: string;
      subject_id: string;
      subjects: {
        id: string;
        name: string;
        field_id: string;
      } | null;
    } | null;
  } | null;
}

export default function Bookmarks() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bookmarks, setBookmarks] = useState<BookmarkedQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBookmarks = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('bookmarked_questions')
        .select(`
          id,
          question_id,
          created_at,
          questions (
            id,
            question_text,
            difficulty,
            topics (
              id,
              name,
              subject_id,
              subjects (
                id,
                name,
                field_id
              )
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (data) {
        setBookmarks(data as BookmarkedQuestion[]);
      }

      setIsLoading(false);
    };

    fetchBookmarks();
  }, [user]);

  const removeBookmark = async (bookmarkId: string) => {
    const { error } = await supabase
      .from('bookmarked_questions')
      .delete()
      .eq('id', bookmarkId);

    if (!error) {
      setBookmarks((prev) => prev.filter((b) => b.id !== bookmarkId));
      toast({ description: 'Bookmark removed' });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-display font-bold">Bookmarked Questions</h1>
        <p className="text-muted-foreground mt-2">
          {bookmarks.length} question{bookmarks.length !== 1 ? 's' : ''} saved for later review
        </p>
      </div>

      {bookmarks.length > 0 ? (
        <div className="space-y-4">
          {bookmarks.map((bookmark) => {
            const question = bookmark.questions;
            const topic = question?.topics;
            const subject = topic?.subjects;

            return (
              <Card key={bookmark.id} className="border-0 shadow-md">
                <CardContent className="py-4">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Bookmark className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium line-clamp-2">
                        {question?.question_text || 'Question not available'}
                      </p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {subject && (
                          <Badge variant="outline" className="text-xs">
                            {subject.name}
                          </Badge>
                        )}
                        {topic && (
                          <Badge variant="secondary" className="text-xs">
                            {topic.name}
                          </Badge>
                        )}
                        {question?.difficulty && (
                          <Badge
                            variant={
                              question.difficulty === 'easy'
                                ? 'secondary'
                                : question.difficulty === 'hard'
                                ? 'destructive'
                                : 'default'
                            }
                            className="text-xs"
                          >
                            {question.difficulty}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Saved on {new Date(bookmark.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {topic && subject && (
                        <Button asChild variant="outline" size="sm">
                          <Link to={`/practice/${subject.field_id}/${subject.id}/${topic.id}`}>
                            Practice
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Link>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeBookmark(bookmark.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <BookmarkX className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-0 shadow-lg">
          <CardContent className="py-12 text-center">
            <FileQuestion className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-medium mb-2">No bookmarked questions</h3>
            <p className="text-muted-foreground mb-6">
              While practicing, bookmark difficult questions to review later.
            </p>
            <Button asChild>
              <Link to="/practice">
                Start Practicing
                <ChevronRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
