import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Users,
  FileQuestion,
  ClipboardList,
  BookOpen,
  Layers,
  Database,
  TrendingUp,
  Loader2,
  Trophy,
} from 'lucide-react';
import { Navigate } from 'react-router-dom';

const COLORS = [
  'hsl(245, 85%, 60%)',
  'hsl(172, 66%, 50%)',
  'hsl(25, 95%, 55%)',
  'hsl(280, 80%, 55%)',
  'hsl(320, 80%, 60%)',
  'hsl(142, 76%, 45%)',
];

export default function AdminStats() {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalFields: 0,
    totalSubjects: 0,
    totalTopics: 0,
    totalQuestions: 0,
    totalTests: 0,
    totalAttempts: 0,
  });
  const [fieldData, setFieldData] = useState<{ name: string; subjects: number }[]>([]);
  const [difficultyData, setDifficultyData] = useState<{ name: string; value: number }[]>([]);
  const [recentAttempts, setRecentAttempts] = useState<any[]>([]);

  useEffect(() => {
    if (isAdmin) fetchStats();
  }, [isAdmin]);

  const fetchStats = async () => {
    setLoading(true);
    const [users, fields, subjects, topics, questions, tests, attempts] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('fields').select('*'),
      supabase.from('subjects').select('*'),
      supabase.from('topics').select('id', { count: 'exact', head: true }),
      supabase.from('questions').select('id, difficulty'),
      supabase.from('tests').select('id', { count: 'exact', head: true }),
      supabase.from('test_attempts').select('id, percentage, completed_at, user_id, test_id, tests(title)').not('completed_at', 'is', null).order('completed_at', { ascending: false }).limit(10),
    ]);

    setStats({
      totalUsers: users.count || 0,
      totalFields: fields.data?.length || 0,
      totalSubjects: subjects.data?.length || 0,
      totalTopics: topics.count || 0,
      totalQuestions: questions.data?.length || 0,
      totalTests: tests.count || 0,
      totalAttempts: attempts.data?.length || 0,
    });

    // Field distribution
    if (fields.data && subjects.data) {
      setFieldData(fields.data.map(f => ({
        name: f.name,
        subjects: subjects.data!.filter(s => s.field_id === f.id).length,
      })));
    }

    // Difficulty distribution
    if (questions.data) {
      const easy = questions.data.filter(q => q.difficulty === 'easy').length;
      const medium = questions.data.filter(q => q.difficulty === 'medium').length;
      const hard = questions.data.filter(q => q.difficulty === 'hard').length;
      setDifficultyData([
        { name: 'Easy', value: easy },
        { name: 'Medium', value: medium },
        { name: 'Hard', value: hard },
      ]);
    }

    if (attempts.data) setRecentAttempts(attempts.data);
    setLoading(false);
  };

  if (authLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-primary' },
    { label: 'Fields', value: stats.totalFields, icon: Database, color: 'text-secondary' },
    { label: 'Subjects', value: stats.totalSubjects, icon: BookOpen, color: 'text-accent' },
    { label: 'Topics', value: stats.totalTopics, icon: Layers, color: 'text-primary' },
    { label: 'Questions', value: stats.totalQuestions, icon: FileQuestion, color: 'text-secondary' },
    { label: 'Tests', value: stats.totalTests, icon: ClipboardList, color: 'text-accent' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold">Platform Statistics</h1>
        <p className="text-muted-foreground">Overview of platform activity and content</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            {statCards.map(s => (
              <Card key={s.label} className="border-0 shadow-lg">
                <CardContent className="pt-6 text-center">
                  <s.icon className={`h-6 w-6 mx-auto mb-2 ${s.color}`} />
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" />Subjects per Field</CardTitle>
              </CardHeader>
              <CardContent>
                {fieldData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={fieldData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="subjects" fill="hsl(245, 85%, 60%)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center py-8 text-muted-foreground">No data yet</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileQuestion className="h-5 w-5 text-secondary" />Question Difficulty</CardTitle>
              </CardHeader>
              <CardContent>
                {difficultyData.some(d => d.value > 0) ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={difficultyData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                        {difficultyData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center py-8 text-muted-foreground">No questions yet</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Test Attempts */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-accent" />Recent Test Attempts</CardTitle>
              <CardDescription>Latest completed test attempts across all users</CardDescription>
            </CardHeader>
            <CardContent>
              {recentAttempts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Test</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentAttempts.map((a: any) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{a.tests?.title || 'Test'}</TableCell>
                        <TableCell>
                          <Badge variant={a.percentage >= 70 ? 'default' : a.percentage >= 50 ? 'secondary' : 'destructive'}>
                            {Math.round(a.percentage)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{new Date(a.completed_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center py-8 text-muted-foreground">No test attempts yet</p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
