'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Profile, AllowedEmail } from '@/types';
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  UserCog,
  Mail,
  Plus,
  Trash2,
  Shield,
  ShieldCheck,
  Loader2,
  AlertCircle,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

export default function UsersPageClient() {
  const supabase = createClient();
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [allowedEmails, setAllowedEmails] = useState<AllowedEmail[]>([]);
  const [loading, setLoading] = useState(true);

  // 添加邮箱 Dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'superadmin' | 'admin'>('admin');
  const [newNote, setNewNote] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  // 删除确认
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingEmail, setDeletingEmail] = useState<AllowedEmail | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // 获取当前用户
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        setCurrentProfile(profile as Profile);

        // 仅 admin 可查看其他数据
        if (profile.role === 'superadmin') {
          const { data: allProfiles } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

          const { data: emails } = await supabase
            .from('allowed_emails')
            .select('*')
            .order('created_at', { ascending: false });

          setProfiles(allProfiles || []);
          setAllowedEmails(emails || []);
        }
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error('加载数据失败: ' + (err.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  // 添加邮箱到白名单
  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) {
      toast.error('请输入邮箱地址');
      return;
    }

    setAddLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('allowed_emails')
        .insert({
          email: newEmail.toLowerCase().trim(),
          role: newRole,
          note: newNote || null,
          created_by: user?.id,
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('该邮箱已存在于白名单中');
        } else {
          throw error;
        }
        return;
      }

      toast.success('邮箱添加成功');
      setAddDialogOpen(false);
      setNewEmail('');
      setNewNote('');
      setNewRole('admin');
      loadData();
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error('添加失败: ' + (err.message || '未知错误'));
    } finally {
      setAddLoading(false);
    }
  };

  // 删除白名单邮箱
  const handleDeleteEmail = async () => {
    if (!deletingEmail) return;
    try {
      const { error } = await supabase
        .from('allowed_emails')
        .delete()
        .eq('id', deletingEmail.id);

      if (error) throw error;

      toast.success('邮箱已从白名单移除');
      setDeleteDialogOpen(false);
      setDeletingEmail(null);
      loadData();
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error('删除失败: ' + (err.message || '未知错误'));
    }
  };

  // 更新白名单角色
  const handleUpdateRole = async (emailId: string, newRole: 'superadmin' | 'admin') => {
    try {
      const { error } = await supabase
        .from('allowed_emails')
        .update({ role: newRole })
        .eq('id', emailId);

      if (error) throw error;
      toast.success('角色已更新');
      loadData();
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error('更新失败: ' + (err.message || '未知错误'));
    }
  };

  // 非 admin 无法访问
  if (!loading && currentProfile?.role !== 'superadmin') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
        <h2 className="text-xl font-semibold text-slate-900">无权访问</h2>
        <p className="text-slate-500 mt-2">此页面仅限管理员访问</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-slate-500">加载数据中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <UserCog className="h-6 w-6 text-blue-600" />
          用户管理
        </h1>
        <p className="text-slate-500 mt-1">管理系统用户和邮箱白名单</p>
      </div>

      <Tabs defaultValue="whitelist" className="space-y-4">
        <TabsList>
          <TabsTrigger value="whitelist">邮箱白名单</TabsTrigger>
          <TabsTrigger value="users">已注册用户</TabsTrigger>
        </TabsList>

        {/* 邮箱白名单 */}
        <TabsContent value="whitelist">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    邮箱白名单
                  </CardTitle>
                  <CardDescription>
                    只有在白名单中的邮箱才能注册系统账号
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setAddDialogOpen(true)}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  添加邮箱
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>邮箱</TableHead>
                    <TableHead>角色</TableHead>
                    <TableHead>备注</TableHead>
                    <TableHead>添加时间</TableHead>
                    <TableHead className="w-[80px]">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allowedEmails.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                        暂无白名单邮箱，请点击"添加邮箱"开始配置
                      </TableCell>
                    </TableRow>
                  ) : (
                    allowedEmails.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.email}</TableCell>
                        <TableCell>
                          <Select
                            value={item.role}
                            onValueChange={(value) => {
                              if (value === 'superadmin' || value === 'admin') {
                                handleUpdateRole(item.id, value);
                              }
                            }}
                          >
                            <SelectTrigger className="w-[120px] h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="superadmin">
                                <span className="flex items-center gap-1">
                                  <ShieldCheck className="h-3 w-3" /> 超级管理员
                                </span>
                              </SelectItem>
                              <SelectItem value="admin">
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3" /> 管理员
                                </span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-slate-500 text-sm">{item.note || '-'}</TableCell>
                        <TableCell className="text-slate-500 text-sm">
                          {new Date(item.created_at).toLocaleDateString('zh-CN')}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setDeletingEmail(item);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 已注册用户 */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                已注册用户 ({profiles.length})
              </CardTitle>
              <CardDescription>
                通过邮箱白名单注册成功的管理员用户
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>用户</TableHead>
                    <TableHead>邮箱</TableHead>
                    <TableHead>角色</TableHead>
                    <TableHead>注册时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profiles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                        暂无注册用户
                      </TableCell>
                    </TableRow>
                  ) : (
                    profiles.map((profile) => (
                      <TableRow key={profile.id}>
                        <TableCell className="font-medium">
                          {profile.display_name || profile.email?.split('@')[0]}
                        </TableCell>
                        <TableCell>{profile.email}</TableCell>
                        <TableCell>
                          <Badge variant={profile.role === 'superadmin' ? 'default' : 'secondary'}>
                            {profile.role === 'superadmin' ? (
                              <ShieldCheck className="mr-1 h-3 w-3" />
                            ) : (
                              <Users className="mr-1 h-3 w-3" />
                            )}
                            {profile.role === 'superadmin' ? '超级管理员' : '管理员'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-500 text-sm">
                          {new Date(profile.created_at).toLocaleDateString('zh-CN')}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 添加邮箱 Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加邮箱到白名单</DialogTitle>
            <DialogDescription>
              添加后，该邮箱即可注册系统账号
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddEmail} className="space-y-4">
            <div className="space-y-2">
              <Label>邮箱地址</Label>
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="user@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>角色</Label>
              <Select value={newRole} onValueChange={(v) => { if (v === 'superadmin' || v === 'admin') setNewRole(v); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="superadmin">超级管理员 - 可管理用户+数据</SelectItem>
                  <SelectItem value="admin">管理员 - 仅管理数据</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>备注 (可选)</Label>
              <Input
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="如: 张三的账号"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>
                取消
              </Button>
              <Button type="submit" disabled={addLoading} className="bg-blue-600 hover:bg-blue-700">
                {addLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    添加中...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    添加
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 删除确认 Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              您确定要从白名单中移除 "{deletingEmail?.email}" 吗？
              该邮箱将无法再注册新账号（已注册的用户不受影响）。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDeleteEmail}>
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
