import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Users, Search, ShieldCheck, User, Loader2, Crown, UserMinus } from 'lucide-react';
import { Navigate } from 'react-router-dom';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  selected_field_id: string | null;
  target_year: number | null;
  created_at: string;
}

interface UserRole {
  user_id: string;
  role: string;
}

export default function AdminUsers() {
  const { isAdmin, isLoading: authLoading, user } = useAuth();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [fields, setFields] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; userId: string; action: 'promote' | 'demote'; userName: string }>({
    open: false, userId: '', action: 'promote', userName: '',
  });

  useEffect(() => {
    if (isAdmin) fetchData();
  }, [isAdmin]);

  const fetchData = async () => {
    setLoading(true);
    const [p, r, f] = await Promise.all([
      supabase.from('profiles').select('id, email, full_name, selected_field_id, target_year, created_at').order('created_at', { ascending: false }),
      supabase.from('user_roles').select('user_id, role'),
      supabase.from('fields').select('id, name'),
    ]);
    if (p.data) setProfiles(p.data);
    if (r.data) setRoles(r.data);
    if (f.data) setFields(f.data);
    setLoading(false);
  };

  if (authLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const getUserRole = (userId: string) => {
    const r = roles.find(r => r.user_id === userId);
    return r?.role || 'student';
  };

  const getFieldName = (id: string | null) => {
    if (!id) return '—';
    return fields.find(f => f.id === id)?.name || '—';
  };

  const handleRoleChange = async () => {
    const { userId, action } = confirmDialog;
    if (action === 'promote') {
      const { error } = await supabase.from('user_roles').update({ role: 'admin' }).eq('user_id', userId);
      if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
      else toast({ title: 'User promoted to admin' });
    } else {
      const { error } = await supabase.from('user_roles').update({ role: 'student' }).eq('user_id', userId);
      if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
      else toast({ title: 'User demoted to student' });
    }
    setConfirmDialog(p => ({ ...p, open: false }));
    fetchData();
  };

  const filtered = profiles.filter(p =>
    (p.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase())
  );

  const totalAdmins = roles.filter(r => r.role === 'admin').length;
  const totalStudents = profiles.length - totalAdmins;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold">User Management</h1>
        <p className="text-muted-foreground">View and manage platform users</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><Users className="h-5 w-5 text-primary" /></div>
              <div>
                <p className="text-2xl font-bold">{profiles.length}</p>
                <p className="text-sm text-muted-foreground">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-secondary/10 flex items-center justify-center"><User className="h-5 w-5 text-secondary" /></div>
              <div>
                <p className="text-2xl font-bold">{totalStudents}</p>
                <p className="text-sm text-muted-foreground">Students</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center"><ShieldCheck className="h-5 w-5 text-accent" /></div>
              <div>
                <p className="text-2xl font-bold">{totalAdmins}</p>
                <p className="text-sm text-muted-foreground">Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>All Users</CardTitle>
            <CardDescription>Manage roles and view user details</CardDescription>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search users..." className="pl-9 w-64" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Field</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(p => {
                  const role = getUserRole(p.id);
                  const isSelf = p.id === user?.id;
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.full_name || '—'}</TableCell>
                      <TableCell className="text-muted-foreground">{p.email}</TableCell>
                      <TableCell><Badge variant="outline">{getFieldName(p.selected_field_id)}</Badge></TableCell>
                      <TableCell>
                        <Badge variant={role === 'admin' ? 'default' : 'secondary'} className="gap-1">
                          {role === 'admin' ? <ShieldCheck className="h-3 w-3" /> : <User className="h-3 w-3" />}
                          {role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        {!isSelf && (
                          role === 'student' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setConfirmDialog({ open: true, userId: p.id, action: 'promote', userName: p.full_name || p.email })}
                            >
                              <Crown className="mr-1 h-3 w-3" />Promote
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive border-destructive/30"
                              onClick={() => setConfirmDialog({ open: true, userId: p.id, action: 'demote', userName: p.full_name || p.email })}
                            >
                              <UserMinus className="mr-1 h-3 w-3" />Demote
                            </Button>
                          )
                        )}
                        {isSelf && <Badge variant="outline">You</Badge>}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No users found.</TableCell></TableRow>}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Confirm Dialog */}
      <Dialog open={confirmDialog.open} onOpenChange={o => setConfirmDialog(p => ({ ...p, open: o }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmDialog.action === 'promote' ? 'Promote to Admin' : 'Demote to Student'}</DialogTitle>
            <DialogDescription>
              Are you sure you want to {confirmDialog.action} <strong>{confirmDialog.userName}</strong>?
              {confirmDialog.action === 'promote' && ' They will gain full admin access to manage content and users.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(p => ({ ...p, open: false }))}>Cancel</Button>
            <Button variant={confirmDialog.action === 'demote' ? 'destructive' : 'default'} onClick={handleRoleChange}>
              {confirmDialog.action === 'promote' ? 'Promote' : 'Demote'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
