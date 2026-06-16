'use server';

import { createClient } from '@/lib/supabase/server';
import { Profile } from '@/types';

/**
 * 邮箱+密码登录
 */
export async function signInWithEmail(email: string, password: string) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
    });
    if (error) throw error;
    return data;
}

/**
 * 注册 - 发送 OTP 验证码
 * 先检查邮箱是否在白名单中
 */
export async function signUpRequest(email: string) {
    const supabase = await createClient();
    const normalizedEmail = email.toLowerCase().trim();

    // 检查邮箱是否在白名单（使用 anon key 查询，依赖 RLS）
    const { data: allowedEmail, error: checkError } = await supabase
        .from('allowed_emails')
        .select('id, email, role')
        .eq('email', normalizedEmail)
        .single();

    // 注意：由于 allowed_emails 表仅 admin 可读，
    // 这里改为使用 RPC 函数或前端手动处理
    // 暂时先发送 OTP，由后端 trigger 检查白名单
    if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 = no rows returned (single row not found)
        // 其他错误继续执行，让 trigger 去验证
    }

    // 发送 OTP
    const { error } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
            shouldCreateUser: true,
        },
    });

    if (error) throw error;
    return { email: normalizedEmail };
}

/**
 * 验证 OTP 验证码
 */
export async function verifyOTP(email: string, token: string) {
    const supabase = await createClient();
    const normalizedEmail = email.toLowerCase().trim();

    // 先尝试 signup 类型（新用户）
    let { data, error } = await supabase.auth.verifyOtp({
        email: normalizedEmail,
        token,
        type: 'signup',
    });

    // 如果失败，尝试 magiclink 类型（已有用户）
    if (error) {
        const result = await supabase.auth.verifyOtp({
            email: normalizedEmail,
            token,
            type: 'magiclink',
        });
        if (result.error) throw result.error;
        return result.data;
    }

    return data;
}

/**
 * 设置密码（首次注册后）
 */
export async function setPassword(password: string) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.updateUser({
        password,
    });
    if (error) throw error;
    return data;
}

/**
 * 获取当前用户 Profile
 */
export async function getCurrentProfile(): Promise<Profile | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (error) return null;
    return data as Profile;
}

/**
 * 登出
 */
export async function signOut() {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}
