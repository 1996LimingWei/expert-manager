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
import { Loader2, Mail, Lock, ArrowRight, KeyRound } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
    const router = useRouter();
    const supabase = createClient();

    // 登录状态
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [loginLoading, setLoginLoading] = useState(false);

    // 注册状态
    const [registerEmail, setRegisterEmail] = useState('');
    const [registerPassword, setRegisterPassword] = useState('');
    const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [registerLoading, setRegisterLoading] = useState(false);
    const [registerStep, setRegisterStep] = useState<'info' | 'otp' | 'success'>('info');

    // 忘记密码状态
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotLoading, setForgotLoading] = useState(false);
    const [forgotSent, setForgotSent] = useState(false);

    // 忘记密码 - 发送重置密码邮件
    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!forgotEmail) {
            toast.error('请填写邮箱地址');
            return;
        }

        setForgotLoading(true);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(
                forgotEmail.toLowerCase().trim(),
                {
                    redirectTo: `${window.location.origin}/reset-password`,
                }
            );
            if (error) throw error;
            setForgotSent(true);
            toast.success('重置密码邮件已发送');
        } catch (error: unknown) {
            const err = error as { message?: string };
            toast.error(err.message || '发送失败，请重试');
        } finally {
            setForgotLoading(false);
        }
    };

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

    // 发送 OTP 验证码（先校验白名单）
    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!registerEmail) {
            toast.error('请填写邮箱地址');
            return;
        }
        if (registerPassword.length < 6) {
            toast.error('密码至少6位');
            return;
        }
        if (registerPassword !== registerConfirmPassword) {
            toast.error('两次密码不一致');
            return;
        }

        const email = registerEmail.toLowerCase().trim();
        setRegisterLoading(true);
        try {
            // 先检查白名单
            const { data: allowedEmail, error: whitelistError } = await supabase
                .from('allowed_emails')
                .select('email')
                .eq('email', email)
                .single();

            if (whitelistError || !allowedEmail) {
                toast.error('您的邮箱没有权限注册，请联系管理员添加');
                return;
            }

            // 白名单通过，发送 6 位验证码（而非确认链接）
            const { error: otpError } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    shouldCreateUser: true,
                },
            });

            if (otpError) throw otpError;

            toast.success('验证码已发送到您的邮箱');
            setRegisterStep('otp');
        } catch (error: unknown) {
            const err = error as { message?: string };
            toast.error(err.message || '发送验证码失败');
        } finally {
            setRegisterLoading(false);
        }
    };

    // 验证 OTP 并设置密码
    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!otp || otp.length !== 8) {
            toast.error('请输入8位验证码');
            return;
        }

        const email = registerEmail.toLowerCase().trim();
        setRegisterLoading(true);
        try {
            // 验证 OTP（新用户通过 email 类型验证）
            const { error: verifyError } = await supabase.auth.verifyOtp({
                email,
                token: otp,
                type: 'email',
            });

            if (verifyError) throw verifyError;

            // 验证成功后设置密码
            const { error: updateError } = await supabase.auth.updateUser({
                password: registerPassword,
            });

            if (updateError) throw updateError;

            setRegisterStep('success');
            toast.success('注册成功！');
            setTimeout(() => router.push('/dashboard/experts'), 1500);
        } catch (error: unknown) {
            const err = error as { message?: string };
            toast.error(err.message || '验证码错误');
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
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full overflow-hidden shadow-lg shadow-blue-500/30 mb-4 ring-2 ring-blue-400/30">
                        <Image
                            src="/logo.png"
                            alt="ICA Logo"
                            width={80}
                            height={80}
                            className="object-cover"
                        />
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500 bg-clip-text text-transparent tracking-tight">外宾管理系统</h1>
                    <p className="text-slate-400 mt-2">Expert Management System</p>
                </div>

                <Card className="backdrop-blur-xl bg-white/5 border-white/10 shadow-2xl">
                    <Tabs defaultValue="login" className="w-full">
                        <CardHeader className="pb-4">
                            <TabsList className="grid w-full grid-cols-2 bg-white/5">
                                <TabsTrigger value="login" className="!text-white/60 data-active:!bg-white data-active:!text-slate-900">
                                    登录
                                </TabsTrigger>
                                <TabsTrigger value="register" className="!text-white/60 data-active:!bg-white data-active:!text-slate-900">
                                    注册
                                </TabsTrigger>
                            </TabsList>
                        </CardHeader>

                        {/* 忘记密码 */}
                        <TabsContent value="login">
                            {!showForgotPassword ? (
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
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor="login-password" className="text-slate-300">密码</Label>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowForgotPassword(true)}
                                                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                                                >
                                                    忘记密码？
                                                </button>
                                            </div>
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
                                    <CardFooter className="bg-transparent border-0">
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
                            ) : !forgotSent ? (
                                <form onSubmit={handleForgotPassword}>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center gap-2 text-blue-400 mb-2">
                                            <KeyRound className="h-5 w-5" />
                                            <span className="text-sm font-medium">重置密码</span>
                                        </div>
                                        <CardDescription className="text-slate-400">
                                            输入您的注册邮箱，我们将发送重置密码链接到您的邮箱。
                                        </CardDescription>
                                        <div className="space-y-2">
                                            <Label htmlFor="forgot-email" className="text-slate-300">邮箱地址</Label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                                <Input
                                                    id="forgot-email"
                                                    type="email"
                                                    placeholder="your@email.com"
                                                    value={forgotEmail}
                                                    onChange={(e) => setForgotEmail(e.target.value)}
                                                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20"
                                                />
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => { setShowForgotPassword(false); setForgotEmail(''); }}
                                            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                                        >
                                            ← 返回登录
                                        </button>
                                    </CardContent>
                                    <CardFooter className="bg-transparent border-0">
                                        <Button
                                            type="submit"
                                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/30"
                                            disabled={forgotLoading}
                                        >
                                            {forgotLoading ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    发送中...
                                                </>
                                            ) : (
                                                <>
                                                    发送重置链接
                                                    <ArrowRight className="ml-2 h-4 w-4" />
                                                </>
                                            )}
                                        </Button>
                                    </CardFooter>
                                </form>
                            ) : (
                                <div className="py-8 text-center px-6">
                                    <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                                        <Mail className="w-8 h-8 text-green-400" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-white mb-2">邮件已发送</h3>
                                    <p className="text-slate-400 text-sm mb-4">
                                        重置密码链接已发送至 <span className="text-blue-400">{forgotEmail}</span>，请查看邮箱。
                                    </p>
                                    <button
                                        onClick={() => {
                                            setShowForgotPassword(false);
                                            setForgotSent(false);
                                            setForgotEmail('');
                                        }}
                                        className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                                    >
                                        ← 返回登录
                                    </button>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="register">
                            {/* Step 1: 输入邮箱 + 密码 */}
                            {registerStep === 'info' && (
                                <form onSubmit={handleSendOTP}>
                                    <CardContent className="space-y-4">
                                        <CardDescription className="text-slate-400">
                                            请输入邮箱和密码，邮箱需被管理员预先添加到白名单中。
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
                                        <div className="space-y-2">
                                            <Label htmlFor="register-password" className="text-slate-300">密码</Label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                                <Input
                                                    id="register-password"
                                                    type="password"
                                                    placeholder="至少6位"
                                                    value={registerPassword}
                                                    onChange={(e) => setRegisterPassword(e.target.value)}
                                                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="register-confirm-password" className="text-slate-300">确认密码</Label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                                <Input
                                                    id="register-confirm-password"
                                                    type="password"
                                                    placeholder="再次输入密码"
                                                    value={registerConfirmPassword}
                                                    onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                                                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20"
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="bg-transparent border-0">
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
                                            验证码已发送至 <span className="text-blue-400">{registerEmail}</span>，请查看邮箱并输入8位验证码。
                                        </CardDescription>
                                        <div className="space-y-2">
                                            <Label htmlFor="otp" className="text-slate-300">验证码</Label>
                                            <Input
                                                id="otp"
                                                type="text"
                                                maxLength={8}
                                                placeholder="00000000"
                                                value={otp}
                                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                                className="bg-white/5 border-white/10 text-white text-center text-2xl tracking-widest placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setRegisterStep('info');
                                                setOtp('');
                                            }}
                                            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                                        >
                                            ← 返回修改
                                        </button>
                                    </CardContent>
                                    <CardFooter className="bg-transparent border-0">
                                        <Button
                                            type="submit"
                                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/30"
                                            disabled={registerLoading}
                                        >
                                            {registerLoading ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    注册中...
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

                            {/* Step 3: 注册成功 */}
                            {registerStep === 'success' && (
                                <div className="py-8 text-center">
                                    <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                                        <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-semibold text-white mb-2">注册成功！</h3>
                                    <p className="text-slate-400">正在跳转到系统首页...</p>
                                </div>
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
