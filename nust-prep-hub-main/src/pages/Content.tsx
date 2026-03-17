import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  ChevronRight,
  BookOpen,
  Cpu,
  Building2,
  Briefcase,
  Users,
  Cog,
  Atom,
  Calculator,
  Brain,
  Languages,
  FileText,
} from 'lucide-react';

interface Field {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
}

interface Subject {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  field_id: string;
}

interface Topic {
  id: string;
  name: string;
  description: string | null;
  study_notes: string | null;
  subject_id: string;
}

const fieldIcons: Record<string, React.ElementType> = {
  Engineering: Cog,
  Computing: Cpu,
  Architecture: Building2,
  Business: Briefcase,
  'Social Sciences': Users,
};

const subjectIcons: Record<string, React.ElementType> = {
  Physics: Atom,
  Mathematics: Calculator,
  Chemistry: Atom,
  English: Languages,
  IQ: Brain,
  Biology: Atom,
};

const fieldColors: Record<string, string> = {
  Engineering: 'field-engineering',
  Computing: 'field-computing',
  Architecture: 'field-architecture',
  Business: 'field-business',
  'Social Sciences': 'field-social',
};

export default function Content() {
  const { fieldId, subjectId, topicId } = useParams();
  const [fields, setFields] = useState<Field[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [currentField, setCurrentField] = useState<Field | null>(null);
  const [currentSubject, setCurrentSubject] = useState<Subject | null>(null);
  const [currentTopic, setCurrentTopic] = useState<Topic | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      if (topicId && subjectId && fieldId) {
        // Viewing a specific topic (study notes)
        const [topicRes, subjectRes, fieldRes] = await Promise.all([
          supabase.from('topics').select('*').eq('id', topicId).single(),
          supabase.from('subjects').select('*').eq('id', subjectId).single(),
          supabase.from('fields').select('*').eq('id', fieldId).single(),
        ]);

        if (topicRes.data) setCurrentTopic(topicRes.data);
        if (subjectRes.data) setCurrentSubject(subjectRes.data);
        if (fieldRes.data) setCurrentField(fieldRes.data);
      } else if (subjectId && fieldId) {
        // Viewing topics in a subject
        const [topicsRes, subjectRes, fieldRes] = await Promise.all([
          supabase.from('topics').select('*').eq('subject_id', subjectId).order('display_order'),
          supabase.from('subjects').select('*').eq('id', subjectId).single(),
          supabase.from('fields').select('*').eq('id', fieldId).single(),
        ]);

        if (topicsRes.data) setTopics(topicsRes.data);
        if (subjectRes.data) setCurrentSubject(subjectRes.data);
        if (fieldRes.data) setCurrentField(fieldRes.data);
      } else if (fieldId) {
        // Viewing subjects in a field
        const [subjectsRes, fieldRes] = await Promise.all([
          supabase.from('subjects').select('*').eq('field_id', fieldId).order('display_order'),
          supabase.from('fields').select('*').eq('id', fieldId).single(),
        ]);

        if (subjectsRes.data) setSubjects(subjectsRes.data);
        if (fieldRes.data) setCurrentField(fieldRes.data);
      } else {
        // Viewing all fields
        const { data } = await supabase.from('fields').select('*').order('display_order');
        if (data) setFields(data);
      }

      setIsLoading(false);
    };

    fetchData();
  }, [fieldId, subjectId, topicId]);

  const renderBreadcrumbs = () => (
    <Breadcrumb className="mb-6">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/content">All Fields</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {currentField && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {subjectId ? (
                <BreadcrumbLink asChild>
                  <Link to={`/content/${fieldId}`}>{currentField.name}</Link>
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
                  <Link to={`/content/${fieldId}/${subjectId}`}>{currentSubject.name}</Link>
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // Render study notes for a specific topic
  if (currentTopic) {
    return (
      <div className="space-y-6 animate-fade-in">
        {renderBreadcrumbs()}

        <div>
          <h1 className="text-3xl font-display font-bold">{currentTopic.name}</h1>
          {currentTopic.description && (
            <p className="text-muted-foreground mt-2">{currentTopic.description}</p>
          )}
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Study Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentTopic.study_notes ? (
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <div dangerouslySetInnerHTML={{ __html: currentTopic.study_notes }} />
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Study notes for this topic are coming soon!
              </p>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button asChild>
            <Link to={`/practice/${fieldId}/${subjectId}/${currentTopic.id}`}>
              Practice MCQs
              <ChevronRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // Render topics for a subject
  if (currentSubject && fieldId) {
    return (
      <div className="space-y-6 animate-fade-in">
        {renderBreadcrumbs()}

        <div>
          <h1 className="text-3xl font-display font-bold">{currentSubject.name}</h1>
          <p className="text-muted-foreground mt-2">
            {topics.length} topic{topics.length !== 1 ? 's' : ''} available
          </p>
        </div>

        {topics.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {topics.map((topic, index) => (
              <Link
                key={topic.id}
                to={`/content/${fieldId}/${subjectId}/${topic.id}`}
                className="group"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <Card className="h-full border-0 shadow-md hover:shadow-lg transition-all duration-300 group-hover:-translate-y-1">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {topic.name}
                      </CardTitle>
                      <Badge variant="secondary" className="shrink-0">
                        {topic.study_notes ? 'Notes' : 'Coming'}
                      </Badge>
                    </div>
                    {topic.description && (
                      <CardDescription className="line-clamp-2">
                        {topic.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Read study notes</span>
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

  // Render subjects for a field
  if (currentField) {
    const FieldIcon = fieldIcons[currentField.name] || BookOpen;

    return (
      <div className="space-y-6 animate-fade-in">
        {renderBreadcrumbs()}

        <div className="flex items-center gap-4">
          <div className={`h-14 w-14 rounded-xl bg-${fieldColors[currentField.name] || 'primary'}/10 flex items-center justify-center`}>
            <FieldIcon className={`h-7 w-7 text-${fieldColors[currentField.name] || 'primary'}`} />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold">{currentField.name}</h1>
            <p className="text-muted-foreground mt-1">
              {subjects.length} subject{subjects.length !== 1 ? 's' : ''} available
            </p>
          </div>
        </div>

        {subjects.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {subjects.map((subject, index) => {
              const SubjectIcon = subjectIcons[subject.name] || BookOpen;
              return (
                <Link
                  key={subject.id}
                  to={`/content/${fieldId}/${subject.id}`}
                  className="group"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <Card className="h-full border-0 shadow-md hover:shadow-lg transition-all duration-300 group-hover:-translate-y-1">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <SubjectIcon className="h-5 w-5 text-primary" />
                        </div>
                        <CardTitle className="text-lg group-hover:text-primary transition-colors">
                          {subject.name}
                        </CardTitle>
                      </div>
                      {subject.description && (
                        <CardDescription className="line-clamp-2 mt-2">
                          {subject.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>View topics</span>
                        <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
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

  // Render all fields
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-display font-bold">Study Content</h1>
        <p className="text-muted-foreground mt-2">
          Choose your field to start exploring study materials
        </p>
      </div>

      {fields.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {fields.map((field, index) => {
            const FieldIcon = fieldIcons[field.name] || BookOpen;
            const colorClass = fieldColors[field.name] || 'primary';

            return (
              <Link
                key={field.id}
                to={`/content/${field.id}`}
                className="group animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <Card className={`h-full border-0 shadow-md hover:shadow-xl transition-all duration-300 group-hover:-translate-y-2 overflow-hidden`}>
                  <div className={`h-2 bg-gradient-to-r from-${colorClass} to-${colorClass}/70`} />
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-4">
                      <div className={`h-12 w-12 rounded-xl bg-${colorClass}/10 flex items-center justify-center`}>
                        <FieldIcon className={`h-6 w-6 text-${colorClass}`} />
                      </div>
                      <CardTitle className="text-xl group-hover:text-primary transition-colors">
                        {field.name}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {field.description && (
                      <p className="text-muted-foreground mb-4 line-clamp-2">
                        {field.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-primary font-medium">Explore subjects</span>
                      <ChevronRight className="h-4 w-4 text-primary group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card className="border-0 shadow-lg">
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-medium mb-2">No fields available yet</h3>
            <p className="text-muted-foreground">Study content will be added soon. Check back later!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
