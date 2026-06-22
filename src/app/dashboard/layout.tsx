'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Profile } from '@/types';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Users,
    UserCog,
    LogOut,
    Menu,
    ChevronRight,
    ChevronDown,
    Home,
    Pencil,
    KeyRound,
    CalendarDays,
    PanelLeftClose,
    PanelLeftOpen,
} from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const navigation = [
    { name: '专家列表', href: '/dashboard/experts', icon: Users },
    { name: '用户管理', href: '/dashboard/users', icon: UserCog, superadminOnly: true },
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [editNameOpen, setEditNameOpen] = useState(false);
    const [newDisplayName, setNewDisplayName] = useState('');
    const [savingName, setSavingName] = useState(false);

    // 修改密码状态
    const [editPasswordOpen, setEditPasswordOpen] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [savingPassword, setSavingPassword] = useState(false);
    const [sessionsExpanded, setSessionsExpanded] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    useEffect(() => {
        async function loadProfile() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (data) {
                setProfile(data as Profile);
            }
            setLoading(false);
        }
        loadProfile();
    }, [supabase, router]);

    const handleSignOut = async () => {
        try {
            await supabase.auth.signOut();
            toast.success('已登出');
            router.push('/login');
        } catch {
            toast.error('登出失败');
        }
    };

    const handleSaveName = async () => {
        if (!newDisplayName.trim()) {
            toast.error('用户名不能为空');
            return;
        }
        setSavingName(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ display_name: newDisplayName.trim(), updated_at: new Date().toISOString() })
                .eq('id', profile!.id);
            if (error) throw error;
            setProfile({ ...profile!, display_name: newDisplayName.trim() });
            toast.success('用户名已更新');
            setEditNameOpen(false);
        } catch {
            toast.error('更新失败');
        } finally {
            setSavingName(false);
        }
    };

    const handleSavePassword = async () => {
        if (!currentPassword || !newPassword || !confirmNewPassword) {
            toast.error('请填写所有密码字段');
            return;
        }
        if (newPassword.length < 6) {
            toast.error('新密码至少6位');
            return;
        }
        if (newPassword !== confirmNewPassword) {
            toast.error('两次输入的新密码不一致');
            return;
        }

        setSavingPassword(true);
        try {
            // 先验证旧密码
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: profile!.email!,
                password: currentPassword,
            });
            if (signInError) {
                toast.error('当前密码不正确');
                return;
            }

            // 更新新密码
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword,
            });
            if (updateError) throw updateError;

            toast.success('密码已更新');
            setEditPasswordOpen(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
        } catch {
            toast.error('修改密码失败');
        } finally {
            setSavingPassword(false);
        }
    };

    const filteredNav = navigation.filter(
        (item) => !item.superadminOnly || profile?.role === 'superadmin'
    );

    const getInitials = (email: string | null | undefined) => {
        if (!email) return '?';
        return email.charAt(0).toUpperCase();
    };

    const ICA_SESSIONS = ['第七届大会', '第六届大会', '第五届大会', '第四届大会', '第三届大会', '第二届大会', '第一届大会'];

    // 检查当前是否有选中的届次
    const layoutSearchParams = useSearchParams();
    const currentSession = pathname === '/dashboard/experts'
        ? layoutSearchParams.get('session')
        : null;

    const SidebarContent = () => (
        <div className="flex h-full flex-col">
            {/* Logo */}
            <div className={cn('flex h-16 items-center gap-3', sidebarCollapsed ? 'justify-center px-2' : 'px-6')}>
                <div className="flex h-9 w-9 items-center justify-center rounded-full overflow-hidden ring-1 ring-blue-400/40 flex-shrink-0">
                    <Image
                        src="/logo.png"
                        alt="ICA"
                        width={36}
                        height={36}
                        className="object-cover"
                    />
                </div>
                {!sidebarCollapsed && (
                    <div className="flex-1">
                        <h2 className="text-sm font-semibold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">外宾管理</h2>
                        <p className="text-xs text-slate-400">Expert Manager</p>
                    </div>
                )}
                {!sidebarCollapsed && (
                    <button
                        type="button"
                        onClick={() => setSidebarCollapsed(true)}
                        className="text-slate-400 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
                        title="收起菜单"
                    >
                        <PanelLeftClose className="h-4 w-4" />
                    </button>
                )}
                {sidebarCollapsed && (
                    <button
                        type="button"
                        onClick={() => setSidebarCollapsed(false)}
                        className="text-slate-400 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
                        title="展开菜单"
                    >
                        <PanelLeftOpen className="h-4 w-4" />
                    </button>
                )}
            </div>

            <Separator className="bg-white/10" />

            {/* Navigation */}
            <nav className={cn('flex-1 space-y-1 py-4', sidebarCollapsed ? 'px-2' : 'px-3')}>
                {filteredNav.map((item) => {
                    const isActive = pathname === item.href && !currentSession;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            onClick={() => setSidebarOpen(false)}
                            title={sidebarCollapsed ? item.name : undefined}
                            className={cn(
                                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                                sidebarCollapsed && 'justify-center px-2',
                                isActive
                                    ? 'bg-blue-600/20 text-blue-400 shadow-sm'
                                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                            )}
                        >
                            <item.icon className={cn('h-5 w-5 flex-shrink-0', isActive ? 'text-blue-400' : 'text-slate-400')} />
                            {!sidebarCollapsed && item.name}
                            {!sidebarCollapsed && isActive && <ChevronRight className="ml-auto h-4 w-4" />}
                        </Link>
                    );
                })}

                {/* 往届大会 */}
                <div>
                    <button
                        type="button"
                        onClick={() => sidebarCollapsed ? setSidebarCollapsed(false) : setSessionsExpanded(!sessionsExpanded)}
                        title={sidebarCollapsed ? '往届大会' : undefined}
                        className={cn(
                            'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                            sidebarCollapsed && 'justify-center px-2',
                            currentSession
                                ? 'bg-blue-600/20 text-blue-400 shadow-sm'
                                : 'text-slate-300 hover:bg-white/5 hover:text-white'
                        )}
                    >
                        <CalendarDays className={cn('h-5 w-5 flex-shrink-0', currentSession ? 'text-blue-400' : 'text-slate-400')} />
                        {!sidebarCollapsed && (
                            <>
                                往届大会
                                <ChevronDown className={cn('ml-auto h-4 w-4 transition-transform', sessionsExpanded ? 'rotate-0' : '-rotate-90')} />
                            </>
                        )}
                    </button>
                    {!sidebarCollapsed && sessionsExpanded && (
                        <div className="ml-5 mt-1 space-y-0.5 border-l border-white/10 pl-4">
                            {ICA_SESSIONS.map((session) => {
                                const sessionKey = session.replace('大会', '');
                                const isActiveSession = currentSession === sessionKey;
                                return (
                                    <Link
                                        key={session}
                                        href={`/dashboard/experts?session=${encodeURIComponent(sessionKey)}`}
                                        onClick={() => setSidebarOpen(false)}
                                        className={cn(
                                            'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all',
                                            isActiveSession
                                                ? 'bg-blue-600/20 text-blue-400'
                                                : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                        )}
                                    >
                                        {session}
                                        {isActiveSession && <ChevronRight className="ml-auto h-4 w-4" />}
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            </nav>

            {/* User Info */}
            <div className={cn('p-4', sidebarCollapsed && 'px-2')}>
                <div className={cn('flex items-center gap-3 rounded-lg bg-white/5 p-3', sidebarCollapsed && 'justify-center p-2')}>
                    <Avatar className="h-9 w-9 border border-white/20 flex-shrink-0">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs">
                            {getInitials(profile?.email)}
                        </AvatarFallback>
                    </Avatar>
                    {!sidebarCollapsed && (
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                                {profile?.display_name || profile?.email?.split('@')[0]}
                            </p>
                            <p className="text-xs text-slate-400 truncate">{profile?.email}</p>
                        </div>
                    )}
                    {!sidebarCollapsed && profile?.role === 'superadmin' && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            超级管理员
                        </span>
                    )}
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
                    <p className="text-slate-400 text-sm">加载中...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Mobile sidebar */}
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetContent side="left" className="w-64 p-0 bg-slate-900 border-slate-800">
                    <SidebarContent />
                </SheetContent>
            </Sheet>

            {/* Desktop sidebar */}
            <div className={cn(
                'hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col transition-all duration-300',
                sidebarCollapsed ? 'lg:w-16' : 'lg:w-64'
            )}>
                <div className="flex flex-1 flex-col bg-slate-900 border-r border-slate-800">
                    <SidebarContent />
                </div>
            </div>

            {/* Main content */}
            <div className={cn('transition-all duration-300', sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64')}>
                {/* Top navigation */}
                <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-slate-200 bg-white/80 backdrop-blur-md px-4 lg:px-8">
                    {/* Mobile menu button */}
                    <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                        <SheetTrigger className="inline-flex items-center justify-center size-9 rounded-md hover:bg-slate-100 lg:hidden">
                            <Menu className="h-5 w-5" />
                        </SheetTrigger>
                    </Sheet>

                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Home className="h-4 w-4" />
                        <span>/</span>
                        <span className="text-slate-900 font-medium">
                            {currentSession
                                ? `${currentSession}大会`
                                : (filteredNav.find((item) => item.href === pathname)?.name || 'Dashboard')
                            }
                        </span>
                    </div>

                    {/* User dropdown */}
                    <div className="ml-auto flex items-center gap-4">
                        <DropdownMenu>
                            <DropdownMenuTrigger className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-slate-100 transition-colors">
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs">
                                        {getInitials(profile?.email)}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="hidden md:inline-block text-sm font-medium">
                                    {profile?.display_name || profile?.email?.split('@')[0]}
                                </span>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuGroup>
                                    <DropdownMenuLabel>
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-medium">{profile?.display_name || profile?.email?.split('@')[0]}</p>
                                            <p className="text-xs text-slate-500">{profile?.email}</p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={() => {
                                            setNewDisplayName(profile?.display_name || '');
                                            setEditNameOpen(true);
                                        }}
                                        className="cursor-pointer"
                                    >
                                        <Pencil className="mr-2 h-4 w-4" />
                                        修改用户名
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => {
                                            setCurrentPassword('');
                                            setNewPassword('');
                                            setConfirmNewPassword('');
                                            setEditPasswordOpen(true);
                                        }}
                                        className="cursor-pointer"
                                    >
                                        <KeyRound className="mr-2 h-4 w-4" />
                                        修改密码
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={handleSignOut} className="text-red-600 cursor-pointer">
                                        <LogOut className="mr-2 h-4 w-4" />
                                        登出
                                    </DropdownMenuItem>
                                </DropdownMenuGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {/* Page content */}
                <main className="p-4 lg:p-8">
                    {children}
                </main>
            </div>

            {/* 修改用户名 Dialog */}
            <Dialog open={editNameOpen} onOpenChange={setEditNameOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>修改用户名</DialogTitle>
                        <DialogDescription>设置显示在右上角的用户名</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                        <Input
                            value={newDisplayName}
                            onChange={(e) => setNewDisplayName(e.target.value)}
                            placeholder="输入新用户名"
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                        />
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setEditNameOpen(false)}>取消</Button>
                            <Button onClick={handleSaveName} disabled={savingName}>
                                {savingName ? '保存中...' : '保存'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* 修改密码 Dialog */}
            <Dialog open={editPasswordOpen} onOpenChange={setEditPasswordOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>修改密码</DialogTitle>
                        <DialogDescription>输入当前密码和新密码</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                        <Input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="当前密码"
                        />
                        <Input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="新密码（至少6位）"
                        />
                        <Input
                            type="password"
                            value={confirmNewPassword}
                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                            placeholder="确认新密码"
                            onKeyDown={(e) => e.key === 'Enter' && handleSavePassword()}
                        />
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setEditPasswordOpen(false)}>取消</Button>
                            <Button onClick={handleSavePassword} disabled={savingPassword}>
                                {savingPassword ? '保存中...' : '保存'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
