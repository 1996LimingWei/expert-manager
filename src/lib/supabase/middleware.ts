import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // 如果 Supabase 未配置，直接放行（开发构建时）
    if (!supabaseUrl || !supabaseKey || supabaseUrl === 'your_supabase_url_here') {
        return supabaseResponse;
    }

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
        cookies: {
            getAll() {
                return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value }) =>
                    request.cookies.set(name, value)
                );
                supabaseResponse = NextResponse.next({
                    request,
                });
                cookiesToSet.forEach(({ name, value, options }) =>
                    supabaseResponse.cookies.set(name, value, options)
                );
            },
        },
    });

    const {
        data: { user },
    } = await supabase.auth.getUser();

    // 未登录用户访问 dashboard 重定向到 login
    if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    // 已登录用户访问 login 重定向到 dashboard
    if (user && request.nextUrl.pathname === '/login') {
        const url = request.nextUrl.clone();
        url.pathname = '/dashboard/experts';
        return NextResponse.redirect(url);
    }

    // 访问根路径重定向
    if (request.nextUrl.pathname === '/') {
        const url = request.nextUrl.clone();
        url.pathname = user ? '/dashboard/experts' : '/login';
        return NextResponse.redirect(url);
    }

    return supabaseResponse;
}
