-- ============================================
-- 外宾管理系统 - 数据库初始化迁移
-- Created: 2026-06-16
-- ============================================

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. allowed_emails 表 - 邮箱白名单
-- role: 'superadmin'（超级管理员）可管理白名单+专家
--        'admin'（管理员）仅可查看/编辑专家
-- ============================================
CREATE TABLE public.allowed_emails (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    email text NOT NULL UNIQUE,
    role text NOT NULL DEFAULT 'admin' CHECK (role IN ('superadmin', 'admin')),
    created_by uuid REFERENCES auth.users(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    note text
);

-- ============================================
-- 2. profiles 表 - 已注册管理员信息
-- 注册时由 trigger 自动创建，存储角色
-- ============================================
CREATE TABLE public.profiles (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text,
    display_name text,
    role text NOT NULL DEFAULT 'admin' CHECK (role IN ('superadmin', 'admin')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================
-- 3. experts 表 - 专家信息主表
-- ============================================
CREATE TABLE public.experts (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    certificate_no text,
    passport_no text,
    committee_position text,
    committee_position_en text,
    name_cn text,
    name_en text,
    last_name_en text,
    first_name_en text,
    salutation_en text,
    salutation_cn text,
    gender_cn text,
    gender_en text,
    birth_date text,
    organization text,
    organization_en text,
    position text,
    professional_title text,
    professional_title_en text,
    nationality_cn text,
    nationality_en text,
    phone text,
    email text,
    wechat text,
    join_date date,
    payment_date date,
    expiry_date date,
    payment_status text,
    ica_participation text,
    awards text,
    speeches text,
    cooperation_projects text,
    notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid REFERENCES auth.users(id)
);

-- ============================================
-- 4. 辅助函数与触发器
-- ============================================

-- 自动更新 updated_at 的触发器函数
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- profiles 表 updated_at 触发器
CREATE TRIGGER on_profiles_updated
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- experts 表 updated_at 触发器
CREATE TRIGGER on_experts_updated
    BEFORE UPDATE ON public.experts
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 5. 处理新用户注册 - 白名单校验 + 自动创建 profile
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    allowed RECORD;
BEGIN
    -- 检查白名单
    SELECT email, role INTO allowed
    FROM public.allowed_emails
    WHERE email = NEW.email;

    -- 邮箱不在白名单则拒绝
    IF allowed IS NULL THEN
        RAISE EXCEPTION 'Email not in allowed list: %', NEW.email;
    END IF;

    -- 自动创建 profile
    INSERT INTO public.profiles (id, email, display_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
        allowed.role
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 绑定到 auth.users 的 INSERT 触发器
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 6. 初始超级管理员
-- ============================================
INSERT INTO public.allowed_emails (email, role, note)
VALUES ('120@39fengliao.com', 'admin', '普通管理员'),
       ('demo@demo.com', 'superadmin', '开发测试账号');

-- ============================================
-- 7. 索引优化
-- ============================================
CREATE INDEX idx_experts_name_en ON public.experts (name_en);
CREATE INDEX idx_experts_name_cn ON public.experts (name_cn);
CREATE INDEX idx_experts_nationality_en ON public.experts (nationality_en);
CREATE INDEX idx_experts_email ON public.experts (email);
CREATE INDEX idx_allowed_emails_email ON public.allowed_emails (email);
CREATE INDEX idx_profiles_role ON public.profiles (role);
