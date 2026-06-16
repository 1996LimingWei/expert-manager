'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2, Mail, Lock, Users, ArrowRight } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const supabase = createClient();

    // 登录状态
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [loginLoading, setLoginLoading] = useState(false);

    // 注册状态
    const [registerEmail, setRegisterEmail] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [registerLoading, setRegisterLoading] = useState(false);
    const [registerStep, setRegisterStep] = useState<'email' | 'otp' | 'password'>('email');

    // 邮箱+密码登录
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!loginEmail || !loginPassword) {
            toast.error('请填写邮箱和密码');
            return;
        }

        setLoginLoading(true);
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: loginEmail.toLowerCase().trim(),
                password: loginPassword,
            });

            if (error) throw error;

            toast.success('登录成功！');
            router.push('/dashboard/experts');
        } catch (error: unknown) {
            const err = error as { message?: string };
            if (err.message === 'Invalid login credentials') {
                toast.error('邮箱或密码错误');
            } else {
                toast.error(err.message || '登录失败，请重试');
            }
        } finally {
            setLoginLoading(false);
        }
    };

    // 发送 OTP 验证码
    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!registerEmail) {
            toast.error('请填写邮箱地址');
            return;
        }

        setRegisterLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOtp({
                email: registerEmail.toLowerCase().trim(),
                options: {
                    shouldCreateUser: true,
                },
            });

            if (error) throw error;

            toast.success('验证码已发送到您的邮箱');
            setOtpSent(true);
            setRegisterStep('otp');
        } catch (error: unknown) {
            const err = error as { message?: string };
            toast.error(err.message || '发送验证码失败');
        } finally {
            setRegisterLoading(false);
        }
    };

    // 验证 OTP
    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!otp || otp.length !== 6) {
            toast.error('请输入6位验证码');
            return;
        }

        setRegisterLoading(true);
        try {
            // 先尝试 signup
            let { error } = await supabase.auth.verifyOtp({
                email: registerEmail.toLowerCase().trim(),
                token: otp,
                type: 'signup',
            });

            if (error) {
                // 尝试 magiclink
                const result = await supabase.auth.verifyOtp({
                    email: registerEmail.toLowerCase().trim(),
                    token: otp,
                    type: 'magiclink',
                });
                if (result.error) throw result.error;

                // 已有用户，直接跳转
                toast.success('验证成功！');
                router.push('/dashboard/experts');
                return;
            }

            // 新用户，需要设置密码
            setRegisterStep('password');
            toast.success('验证成功，请设置密码');
        } catch (error: unknown) {
            const err = error as { message?: string };
            toast.error(err.message || '验证码错误');
        } finally {
            setRegisterLoading(false);
        }
    };

    // 设置密码
    const handleSetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword.length < 6) {
            toast.error('密码至少6位');
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error('两次密码不一致');
            return;
        }

        setRegisterLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword,
            });

            if (error) throw error;

            toast.success('注册成功！');
            router.push('/dashboard/experts');
        } catch (error: unknown) {
            const err = error as { message?: string };
            toast.error(err.message || '设置密码失败');
        } finally {
            setRegisterLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
            {/* 背景装饰 */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl" />
            </div>

            {/* 网格背景 */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

            <div className="relative z-10 w-full max-w-md px-4">
                {/* Logo 和标题 */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30 mb-4">
                        <Users className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">外宾管理系统</h1>
                    <p className="text-slate-400 mt-2">Expert Management System</p>
                </div>

                <Card className="backdrop-blur-xl bg-white/5 border-white/10 shadow-2xl">
                    <Tabs defaultValue="login" className="w-full">
                        <CardHeader className="pb-4">
                            <TabsList className="grid w-full grid-cols-2 bg-white/5">
                                <TabsTrigger value="login" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                                    登录
                                </TabsTrigger>
                                <TabsTrigger value="register" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                                    注册
                                </TabsTrigger>
                            </TabsList>
                        </CardHeader>

                        <TabsContent value="login">
                            <form onSubmit={handleLogin}>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="login-email" className="text-slate-300">邮箱地址</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                            <Input
                                                id="login-email"
                                                type="email"
                                                placeholder="your@email.com"
                                                value={loginEmail}
                                                onChange={(e) => setLoginEmail(e.target.value)}
                                                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="login-password" className="text-slate-300">密码</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                            <Input
                                                id="login-password"
                                                type="password"
                                                placeholder="••••••••"
                                                value={loginPassword}
                                                onChange={(e) => setLoginPassword(e.target.value)}
                                                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button
                                        type="submit"
                                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/30"
                                        disabled={loginLoading}
                                    >
                                        {loginLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                登录中...
                                            </>
                                        ) : (
                                            <>
                                                登录
                                                <ArrowRight className="ml-2 h-4 w-4" />
                                            </>
                                        )}
                                    </Button>
                                </CardFooter>
                            </form>
                        </TabsContent>

                        <TabsContent value="register">
                            {/* Step 1: 输入邮箱 */}
                            {registerStep === 'email' && (
                                <form onSubmit={handleSendOTP}>
                                    <CardContent className="space-y-4">
                                        <CardDescription className="text-slate-400">
                                            请输入您的邮箱地址，我们将发送验证码到您的邮箱。注意：您的邮箱需要被管理员预先添加到白名单中。
                                        </CardDescription>
                                        <div className="space-y-2">
                                            <Label htmlFor="register-email" className="text-slate-300">邮箱地址</Label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                                <Input
                                                    id="register-email"
                                                    type="email"
                                                    placeholder="your@email.com"
                                                    value={registerEmail}
                                                    onChange={(e) => setRegisterEmail(e.target.value)}
                                                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20"
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter>
                                        <Button
                                            type="submit"
                                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/30"
                                            disabled={registerLoading}
                                        >
                                            {registerLoading ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    发送中...
                                                </>
                                            ) : (
                                                <>
                                                    发送验证码
                                                    <ArrowRight className="ml-2 h-4 w-4" />
                                                </>
                                            )}
                                        </Button>
                                    </CardFooter>
                                </form>
                            )}

                            {/* Step 2: 输入验证码 */}
                            {registerStep === 'otp' && (
                                <form onSubmit={handleVerifyOTP}>
                                    <CardContent className="space-y-4">
                                        <CardDescription className="text-slate-400">
                                            验证码已发送至 <span className="text-blue-400">{registerEmail}</span>，请查看邮箱并输入6位验证码。
                                        </CardDescription>
                                        <div className="space-y-2">
                                            <Label htmlFor="otp" className="text-slate-300">验证码</Label>
                                            <Input
                                                id="otp"
                                                type="text"
                                                maxLength={6}
                                                placeholder="000000"
                                                value={otp}
                                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                                className="bg-white/5 border-white/10 text-white text-center text-2xl tracking-widest placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setRegisterStep('email');
                                                setOtp('');
                                                setOtpSent(false);
                                            }}
                                            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                                        >
                                            ← 返回重新发送
                                        </button>
                                    </CardContent>
                                    <CardFooter>
                                        <Button
                                            type="submit"
                                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/30"
                                            disabled={registerLoading}
                                        >
                                            {registerLoading ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    验证中...
                                                </>
                                            ) : (
                                                <>
                                                    验证
                                                    <ArrowRight className="ml-2 h-4 w-4" />
                                                </>
                                            )}
                                        </Button>
                                    </CardFooter>
                                </form>
                            )}

                            {/* Step 3: 设置密码 */}
                            {registerStep === 'password' && (
                                <form onSubmit={handleSetPassword}>
                                    <CardContent className="space-y-4">
                                        <CardDescription className="text-slate-400">
                                            验证成功！请设置您的登录密码（至少6位）。
                                        </CardDescription>
                                        <div className="space-y-2">
                                            <Label htmlFor="new-password" className="text-slate-300">新密码</Label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                                <Input
                                                    id="new-password"
                                                    type="password"
                                                    placeholder="至少6位"
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="confirm-password" className="text-slate-300">确认密码</Label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                                <Input
                                                    id="confirm-password"
                                                    type="password"
                                                    placeholder="再次输入密码"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20"
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter>
                                        <Button
                                            type="submit"
                                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/30"
                                            disabled={registerLoading}
                                        >
                                            {registerLoading ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    设置中...
                                                </>
                                            ) : (
                                                <>
                                                    完成注册
                                                    <ArrowRight className="ml-2 h-4 w-4" />
                                                </>
                                            )}
                                        </Button>
                                    </CardFooter>
                                </form>
                            )}
                        </TabsContent>
                    </Tabs>
                </Card>

                {/* 底部说明 */}
                <p className="text-center text-slate-500 text-xs mt-6">
                    仅限授权管理员访问 · 如有疑问请联系系统管理员
                </p>
            </div>
        </div>
    );
}
