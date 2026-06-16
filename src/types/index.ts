// 专家信息类型定义
export interface Expert {
    id: string;
    serial_number: number | null;
    committee: string | null;
    committee_en: string | null;
    term_dates: string | null;
    term_dates_en: string | null;
    certificate_date: string | null;
    term_time: string | null;
    session_number: string | null;
    session_number_en: string | null;
    certificate_no: string | null;
    committee_position: string | null;
    committee_position_en: string | null;
    name_cn: string | null;
    name_en: string | null;
    last_name_en: string | null;
    first_name_en: string | null;
    salutation_en: string | null;
    salutation_cn: string | null;
    gender_cn: string | null;
    gender_en: string | null;
    birth_date: string | null;
    organization: string | null;
    organization_en: string | null;
    position: string | null;
    professional_title: string | null;
    professional_title_en: string | null;
    nationality_cn: string | null;
    nationality_en: string | null;
    photo_url: string | null;
    phone: string | null;
    email: string | null;
    qq: string | null;
    wechat: string | null;
    join_date: string | null;
    payment_date: string | null;
    expiry_date: string | null;
    payment_status: string | null;
    payment_date_2: string | null;
    expiry_date_2: string | null;
    payment_status_2: string | null;
    payment_date_3: string | null;
    expiry_date_3: string | null;
    payment_status_3: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
    created_by: string | null;
}

// 专家表单类型（不含 id 和时间戳）
export type ExpertFormData = Omit<Expert, 'id' | 'created_at' | 'updated_at' | 'created_by'>;

// 管理员用户资料
export interface Profile {
    id: string;
    email: string | null;
    display_name: string | null;
    role: 'superadmin' | 'admin';
    created_at: string;
    updated_at: string;
}

// 邮箱白名单
export interface AllowedEmail {
    id: string;
    email: string;
    role: 'superadmin' | 'admin';
    created_by: string | null;
    created_at: string;
    note: string | null;
}

// 表单数据类型
export type AllowedEmailFormData = {
    email: string;
    role: 'superadmin' | 'admin';
    note?: string;
};
