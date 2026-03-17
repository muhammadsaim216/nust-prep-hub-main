import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import {
  Plus,
  Pencil,
  Trash2,
  Database,
  BookOpen,
  Layers,
  FileQuestion,
  Search,
  Loader2,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Navigate } from 'react-router-dom';

// Types
interface Field { id: string; name: string; description: string | null; color: string | null; icon: string | null; display_order: number; is_active: boolean; }
interface Subject { id: string; name: string; description: string | null; icon: string | null; field_id: string; display_order: number; is_active: boolean; }
interface Topic { id: string; name: string; description: string | null; study_notes: string | null; subject_id: string; display_order: number; is_active: boolean; }
interface Question {
  id: string; question_text: string; option_a: string; option_b: string; option_c: string; option_d: string;
  correct_option: string; explanation: string | null; difficulty: string; topic_id: string; is_active: boolean;
}

export default function AdminContent() {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const [fields, setFields] = useState<Field[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Dialog states
  const [fieldDialog, setFieldDialog] = useState(false);
  const [subjectDialog, setSubjectDialog] = useState(false);
  const [topicDialog, setTopicDialog] = useState(false);
  const [questionDialog, setQuestionDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Form states
  const [fieldForm, setFieldForm] = useState({ name: '', description: '', color: '', icon: '', display_order: 0 });
  const [subjectForm, setSubjectForm] = useState({ name: '', description: '', icon: '', field_id: '', display_order: 0 });
  const [topicForm, setTopicForm] = useState({ name: '', description: '', study_notes: '', subject_id: '', display_order: 0 });
  const [questionForm, setQuestionForm] = useState({
    question_text: '', option_a: '', option_b: '', option_c: '', option_d: '',
    correct_option: 'A', explanation: '', difficulty: 'medium', topic_id: '',
  });

  useEffect(() => {
    if (isAdmin) fetchAll();
  }, [isAdmin]);

  const fetchAll = async () => {
    setLoading(true);
    const [f, s, t, q] = await Promise.all([
      supabase.from('fields').select('*').order('display_order'),
      supabase.from('subjects').select('*').order('display_order'),
      supabase.from('topics').select('*').order('display_order'),
      supabase.from('questions').select('*').order('created_at', { ascending: false }).limit(100),
    ]);
    if (f.data) setFields(f.data);
    if (s.data) setSubjects(s.data);
    if (t.data) setTopics(t.data);
    if (q.data) setQuestions(q.data);
    setLoading(false);
  };

  if (authLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  // --- FIELD CRUD ---
  const openFieldDialog = (field?: Field) => {
    if (field) {
      setEditingItem(field);
      setFieldForm({ name: field.name, description: field.description || '', color: field.color || '', icon: field.icon || '', display_order: field.display_order });
    } else {
      setEditingItem(null);
      setFieldForm({ name: '', description: '', color: '', icon: '', display_order: fields.length });
    }
    setFieldDialog(true);
  };

  const saveField = async () => {
    if (!fieldForm.name.trim()) { toast({ title: 'Name is required', variant: 'destructive' }); return; }
    setSaving(true);
    const payload = { name: fieldForm.name.trim(), description: fieldForm.description || null, color: fieldForm.color || null, icon: fieldForm.icon || null, display_order: fieldForm.display_order };
    if (editingItem) {
      const { error } = await supabase.from('fields').update(payload).eq('id', editingItem.id);
      if (error) toast({ title: 'Error updating field', description: error.message, variant: 'destructive' });
      else toast({ title: 'Field updated' });
    } else {
      const { error } = await supabase.from('fields').insert(payload);
      if (error) toast({ title: 'Error creating field', description: error.message, variant: 'destructive' });
      else toast({ title: 'Field created' });
    }
    setSaving(false);
    setFieldDialog(false);
    fetchAll();
  };

  const deleteField = async (id: string) => {
    if (!confirm('Delete this field? This will affect all related subjects, topics, and questions.')) return;
    const { error } = await supabase.from('fields').delete().eq('id', id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Field deleted' }); fetchAll(); }
  };

  const toggleFieldActive = async (field: Field) => {
    await supabase.from('fields').update({ is_active: !field.is_active }).eq('id', field.id);
    fetchAll();
  };

  // --- SUBJECT CRUD ---
  const openSubjectDialog = (subject?: Subject) => {
    if (subject) {
      setEditingItem(subject);
      setSubjectForm({ name: subject.name, description: subject.description || '', icon: subject.icon || '', field_id: subject.field_id, display_order: subject.display_order });
    } else {
      setEditingItem(null);
      setSubjectForm({ name: '', description: '', icon: '', field_id: fields[0]?.id || '', display_order: 0 });
    }
    setSubjectDialog(true);
  };

  const saveSubject = async () => {
    if (!subjectForm.name.trim() || !subjectForm.field_id) { toast({ title: 'Name and Field are required', variant: 'destructive' }); return; }
    setSaving(true);
    const payload = { name: subjectForm.name.trim(), description: subjectForm.description || null, icon: subjectForm.icon || null, field_id: subjectForm.field_id, display_order: subjectForm.display_order };
    if (editingItem) {
      const { error } = await supabase.from('subjects').update(payload).eq('id', editingItem.id);
      if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
      else toast({ title: 'Subject updated' });
    } else {
      const { error } = await supabase.from('subjects').insert(payload);
      if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
      else toast({ title: 'Subject created' });
    }
    setSaving(false);
    setSubjectDialog(false);
    fetchAll();
  };

  const deleteSubject = async (id: string) => {
    if (!confirm('Delete this subject?')) return;
    const { error } = await supabase.from('subjects').delete().eq('id', id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Subject deleted' }); fetchAll(); }
  };

  // --- TOPIC CRUD ---
  const openTopicDialog = (topic?: Topic) => {
    if (topic) {
      setEditingItem(topic);
      setTopicForm({ name: topic.name, description: topic.description || '', study_notes: topic.study_notes || '', subject_id: topic.subject_id, display_order: topic.display_order });
    } else {
      setEditingItem(null);
      setTopicForm({ name: '', description: '', study_notes: '', subject_id: subjects[0]?.id || '', display_order: 0 });
    }
    setTopicDialog(true);
  };

  const saveTopic = async () => {
    if (!topicForm.name.trim() || !topicForm.subject_id) { toast({ title: 'Name and Subject are required', variant: 'destructive' }); return; }
    setSaving(true);
    const payload = { name: topicForm.name.trim(), description: topicForm.description || null, study_notes: topicForm.study_notes || null, subject_id: topicForm.subject_id, display_order: topicForm.display_order };
    if (editingItem) {
      const { error } = await supabase.from('topics').update(payload).eq('id', editingItem.id);
      if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
      else toast({ title: 'Topic updated' });
    } else {
      const { error } = await supabase.from('topics').insert(payload);
      if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
      else toast({ title: 'Topic created' });
    }
    setSaving(false);
    setTopicDialog(false);
    fetchAll();
  };

  const deleteTopic = async (id: string) => {
    if (!confirm('Delete this topic?')) return;
    const { error } = await supabase.from('topics').delete().eq('id', id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Topic deleted' }); fetchAll(); }
  };

  // --- QUESTION CRUD ---
  const openQuestionDialog = (q?: Question) => {
    if (q) {
      setEditingItem(q);
      setQuestionForm({
        question_text: q.question_text, option_a: q.option_a, option_b: q.option_b,
        option_c: q.option_c, option_d: q.option_d, correct_option: q.correct_option,
        explanation: q.explanation || '', difficulty: q.difficulty, topic_id: q.topic_id,
      });
    } else {
      setEditingItem(null);
      setQuestionForm({
        question_text: '', option_a: '', option_b: '', option_c: '', option_d: '',
        correct_option: 'A', explanation: '', difficulty: 'medium', topic_id: topics[0]?.id || '',
      });
    }
    setQuestionDialog(true);
  };

  const saveQuestion = async () => {
    if (!questionForm.question_text.trim() || !questionForm.topic_id) { toast({ title: 'Question and Topic are required', variant: 'destructive' }); return; }
    if (!questionForm.option_a || !questionForm.option_b || !questionForm.option_c || !questionForm.option_d) { toast({ title: 'All options are required', variant: 'destructive' }); return; }
    setSaving(true);
    const payload = { ...questionForm, explanation: questionForm.explanation || null };
    if (editingItem) {
      const { error } = await supabase.from('questions').update(payload).eq('id', editingItem.id);
      if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
      else toast({ title: 'Question updated' });
    } else {
      const { error } = await supabase.from('questions').insert(payload);
      if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
      else toast({ title: 'Question created' });
    }
    setSaving(false);
    setQuestionDialog(false);
    fetchAll();
  };

  const deleteQuestion = async (id: string) => {
    if (!confirm('Delete this question?')) return;
    const { error } = await supabase.from('questions').delete().eq('id', id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Question deleted' }); fetchAll(); }
  };

  const toggleQuestionActive = async (q: Question) => {
    await supabase.from('questions').update({ is_active: !q.is_active }).eq('id', q.id);
    fetchAll();
  };

  // Helpers
  const getFieldName = (id: string) => fields.find(f => f.id === id)?.name || '—';
  const getSubjectName = (id: string) => subjects.find(s => s.id === id)?.name || '—';
  const getTopicName = (id: string) => topics.find(t => t.id === id)?.name || '—';

  const filteredQuestions = questions.filter(q =>
    q.question_text.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold">Content Management</h1>
        <p className="text-muted-foreground">Manage fields, subjects, topics, and questions</p>
      </div>

      <Tabs defaultValue="fields" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="fields" className="gap-2"><Database className="h-4 w-4" />Fields</TabsTrigger>
          <TabsTrigger value="subjects" className="gap-2"><BookOpen className="h-4 w-4" />Subjects</TabsTrigger>
          <TabsTrigger value="topics" className="gap-2"><Layers className="h-4 w-4" />Topics</TabsTrigger>
          <TabsTrigger value="questions" className="gap-2"><FileQuestion className="h-4 w-4" />Questions</TabsTrigger>
        </TabsList>

        {/* FIELDS TAB */}
        <TabsContent value="fields">
          <Card className="border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Fields ({fields.length})</CardTitle>
                <CardDescription>NET examination fields like Engineering, Computing, etc.</CardDescription>
              </div>
              <Button onClick={() => openFieldDialog()} className="bg-gradient-primary text-primary-foreground"><Plus className="mr-2 h-4 w-4" />Add Field</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map(f => (
                    <TableRow key={f.id}>
                      <TableCell className="font-medium">{f.name}</TableCell>
                      <TableCell className="text-muted-foreground max-w-[200px] truncate">{f.description || '—'}</TableCell>
                      <TableCell>{f.display_order}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch checked={f.is_active} onCheckedChange={() => toggleFieldActive(f)} />
                          <Badge variant={f.is_active ? 'default' : 'secondary'}>{f.is_active ? 'Active' : 'Inactive'}</Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => openFieldDialog(f)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteField(f.id)}><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {fields.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No fields yet. Add your first field.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SUBJECTS TAB */}
        <TabsContent value="subjects">
          <Card className="border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Subjects ({subjects.length})</CardTitle>
                <CardDescription>Subjects within each field</CardDescription>
              </div>
              <Button onClick={() => openSubjectDialog()} className="bg-gradient-primary text-primary-foreground"><Plus className="mr-2 h-4 w-4" />Add Subject</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Field</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subjects.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell><Badge variant="outline">{getFieldName(s.field_id)}</Badge></TableCell>
                      <TableCell>{s.display_order}</TableCell>
                      <TableCell><Badge variant={s.is_active ? 'default' : 'secondary'}>{s.is_active ? 'Active' : 'Inactive'}</Badge></TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => openSubjectDialog(s)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteSubject(s.id)}><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {subjects.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No subjects yet.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TOPICS TAB */}
        <TabsContent value="topics">
          <Card className="border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Topics ({topics.length})</CardTitle>
                <CardDescription>Topics with study notes under each subject</CardDescription>
              </div>
              <Button onClick={() => openTopicDialog()} className="bg-gradient-primary text-primary-foreground"><Plus className="mr-2 h-4 w-4" />Add Topic</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Has Notes</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topics.map(t => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell><Badge variant="outline">{getSubjectName(t.subject_id)}</Badge></TableCell>
                      <TableCell>{t.study_notes ? <CheckCircle className="h-4 w-4 text-success" /> : <XCircle className="h-4 w-4 text-muted-foreground" />}</TableCell>
                      <TableCell><Badge variant={t.is_active ? 'default' : 'secondary'}>{t.is_active ? 'Active' : 'Inactive'}</Badge></TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => openTopicDialog(t)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteTopic(t.id)}><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {topics.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No topics yet.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* QUESTIONS TAB */}
        <TabsContent value="questions">
          <Card className="border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Questions ({questions.length})</CardTitle>
                <CardDescription>MCQ question bank</CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search questions..." className="pl-9 w-64" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <Button onClick={() => openQuestionDialog()} className="bg-gradient-primary text-primary-foreground"><Plus className="mr-2 h-4 w-4" />Add Question</Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">Question</TableHead>
                    <TableHead>Topic</TableHead>
                    <TableHead>Difficulty</TableHead>
                    <TableHead>Answer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuestions.map(q => (
                    <TableRow key={q.id}>
                      <TableCell className="font-medium max-w-[300px] truncate">{q.question_text}</TableCell>
                      <TableCell><Badge variant="outline">{getTopicName(q.topic_id)}</Badge></TableCell>
                      <TableCell>
                        <Badge variant={q.difficulty === 'hard' ? 'destructive' : q.difficulty === 'medium' ? 'secondary' : 'default'}>
                          {q.difficulty}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono font-bold text-primary">{q.correct_option}</TableCell>
                      <TableCell>
                        <Switch checked={q.is_active} onCheckedChange={() => toggleQuestionActive(q)} />
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => openQuestionDialog(q)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteQuestion(q.id)}><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredQuestions.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No questions found.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* FIELD DIALOG */}
      <Dialog open={fieldDialog} onOpenChange={setFieldDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Field' : 'Add Field'}</DialogTitle>
            <DialogDescription>Fields represent major NET examination categories.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Name *</Label><Input value={fieldForm.name} onChange={e => setFieldForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Engineering" /></div>
            <div><Label>Description</Label><Textarea value={fieldForm.description} onChange={e => setFieldForm(p => ({ ...p, description: e.target.value }))} placeholder="Brief description" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Color</Label><Input value={fieldForm.color} onChange={e => setFieldForm(p => ({ ...p, color: e.target.value }))} placeholder="e.g. blue" /></div>
              <div><Label>Icon</Label><Input value={fieldForm.icon} onChange={e => setFieldForm(p => ({ ...p, icon: e.target.value }))} placeholder="e.g. Atom" /></div>
            </div>
            <div><Label>Display Order</Label><Input type="number" value={fieldForm.display_order} onChange={e => setFieldForm(p => ({ ...p, display_order: parseInt(e.target.value) || 0 }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFieldDialog(false)}>Cancel</Button>
            <Button onClick={saveField} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editingItem ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SUBJECT DIALOG */}
      <Dialog open={subjectDialog} onOpenChange={setSubjectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Subject' : 'Add Subject'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Name *</Label><Input value={subjectForm.name} onChange={e => setSubjectForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Physics" /></div>
            <div>
              <Label>Field *</Label>
              <Select value={subjectForm.field_id} onValueChange={v => setSubjectForm(p => ({ ...p, field_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select field" /></SelectTrigger>
                <SelectContent>{fields.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Description</Label><Textarea value={subjectForm.description} onChange={e => setSubjectForm(p => ({ ...p, description: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Icon</Label><Input value={subjectForm.icon} onChange={e => setSubjectForm(p => ({ ...p, icon: e.target.value }))} /></div>
              <div><Label>Order</Label><Input type="number" value={subjectForm.display_order} onChange={e => setSubjectForm(p => ({ ...p, display_order: parseInt(e.target.value) || 0 }))} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubjectDialog(false)}>Cancel</Button>
            <Button onClick={saveSubject} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editingItem ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* TOPIC DIALOG */}
      <Dialog open={topicDialog} onOpenChange={setTopicDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Topic' : 'Add Topic'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Name *</Label><Input value={topicForm.name} onChange={e => setTopicForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Kinematics" /></div>
            <div>
              <Label>Subject *</Label>
              <Select value={topicForm.subject_id} onValueChange={v => setTopicForm(p => ({ ...p, subject_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                <SelectContent>{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name} ({getFieldName(s.field_id)})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Description</Label><Textarea value={topicForm.description} onChange={e => setTopicForm(p => ({ ...p, description: e.target.value }))} /></div>
            <div><Label>Study Notes</Label><Textarea className="min-h-[150px]" value={topicForm.study_notes} onChange={e => setTopicForm(p => ({ ...p, study_notes: e.target.value }))} placeholder="Study notes content (supports text)" /></div>
            <div><Label>Order</Label><Input type="number" value={topicForm.display_order} onChange={e => setTopicForm(p => ({ ...p, display_order: parseInt(e.target.value) || 0 }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTopicDialog(false)}>Cancel</Button>
            <Button onClick={saveTopic} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editingItem ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QUESTION DIALOG */}
      <Dialog open={questionDialog} onOpenChange={setQuestionDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Question' : 'Add Question'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Topic *</Label>
              <Select value={questionForm.topic_id} onValueChange={v => setQuestionForm(p => ({ ...p, topic_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select topic" /></SelectTrigger>
                <SelectContent>{topics.map(t => <SelectItem key={t.id} value={t.id}>{t.name} ({getSubjectName(t.subject_id)})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Question Text *</Label><Textarea value={questionForm.question_text} onChange={e => setQuestionForm(p => ({ ...p, question_text: e.target.value }))} placeholder="Enter the question" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Option A *</Label><Input value={questionForm.option_a} onChange={e => setQuestionForm(p => ({ ...p, option_a: e.target.value }))} /></div>
              <div><Label>Option B *</Label><Input value={questionForm.option_b} onChange={e => setQuestionForm(p => ({ ...p, option_b: e.target.value }))} /></div>
              <div><Label>Option C *</Label><Input value={questionForm.option_c} onChange={e => setQuestionForm(p => ({ ...p, option_c: e.target.value }))} /></div>
              <div><Label>Option D *</Label><Input value={questionForm.option_d} onChange={e => setQuestionForm(p => ({ ...p, option_d: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Correct Answer *</Label>
                <Select value={questionForm.correct_option} onValueChange={v => setQuestionForm(p => ({ ...p, correct_option: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">A</SelectItem>
                    <SelectItem value="B">B</SelectItem>
                    <SelectItem value="C">C</SelectItem>
                    <SelectItem value="D">D</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Difficulty</Label>
                <Select value={questionForm.difficulty} onValueChange={v => setQuestionForm(p => ({ ...p, difficulty: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Explanation</Label><Textarea value={questionForm.explanation} onChange={e => setQuestionForm(p => ({ ...p, explanation: e.target.value }))} placeholder="Why this answer is correct..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuestionDialog(false)}>Cancel</Button>
            <Button onClick={saveQuestion} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editingItem ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
