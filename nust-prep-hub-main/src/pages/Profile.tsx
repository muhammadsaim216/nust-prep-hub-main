import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AggregateCalculator } from '@/components/dashboard/AggregateCalculator';
import {
  User,
  Mail,
  Target,
  ShieldCheck,
  BookOpen,
  Plus,
  Atom,
  Languages,
  GraduationCap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function Profile() {
  const { user, profile, isAdmin } = useAuth();
  const [fieldName, setFieldName] = useState<string | null>(null);

  useEffect(() => {
    const fetchField = async () => {
      if (profile?.selected_field_id) {
        const { data } = await supabase
          .from('fields')
          .select('name')
          .eq('id', profile.selected_field_id)
          .single();
        if (data) setFieldName(data.name);
      }
    };
    fetchField();
  }, [profile?.selected_field_id]);

  // Placeholder prep progress data for students
  const prepProgress = [
    { subject: 'Mathematics', icon: GraduationCap, progress: 65, color: 'text-primary' },
    { subject: 'Physics', icon: Atom, progress: 48, color: 'text-secondary' },
    { subject: 'English', icon: Languages, progress: 72, color: 'text-accent' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Profile Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-hero p-6 lg:p-8 text-primary-foreground">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="h-20 w-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-display font-bold">
            {profile?.full_name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-display font-bold">
              {profile?.full_name || 'Student'}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-primary-foreground/80">
              <span className="flex items-center gap-1 text-sm">
                <Mail className="h-4 w-4" />
                {profile?.email || user?.email}
              </span>
              {fieldName && (
                <span className="flex items-center gap-1 text-sm">
                  <Target className="h-4 w-4" />
                  {fieldName}
                </span>
              )}
            </div>
            <Badge className="mt-3 bg-white/20 hover:bg-white/30 border-0">
              {isAdmin ? (
                <><ShieldCheck className="h-3 w-3 mr-1" /> Admin</>
              ) : (
                <><User className="h-3 w-3 mr-1" /> Student</>
              )}
            </Badge>
          </div>
        </div>
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
      </div>

      {/* Role-based Content */}
      {isAdmin ? (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Admin Panel
            </CardTitle>
            <CardDescription>Manage platform resources</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="bg-gradient-primary hover:opacity-90 text-primary-foreground">
              <Plus className="mr-2 h-4 w-4" />
              Add New Resources
            </Button>
            <Button variant="outline">
              <BookOpen className="mr-2 h-4 w-4" />
              Manage Questions
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Prep Progress
            </CardTitle>
            <CardDescription>Your subject-wise preparation overview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {prepProgress.map((item) => (
              <div key={item.subject} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <item.icon className={`h-4 w-4 ${item.color}`} />
                    {item.subject}
                  </span>
                  <span className="text-sm text-muted-foreground">{item.progress}%</span>
                </div>
                <Progress value={item.progress} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Aggregate Calculator */}
      <AggregateCalculator />
    </div>
  );
}
