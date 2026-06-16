/**
 * Excel 数据导入脚本
 *
 * 使用方法:
 *   1. 确保 .env.local 中已配置 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   2. 运行: npx tsx scripts/import-excel.ts
 *
 * 可选参数:
 *   --file <path>  指定 Excel 文件路径（默认为同级目录下的 xlsx 文件）
 *   --clear        导入前先清空 experts 表
 */

import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';

// 从 .env.local 读取环境变量
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env: Record<string, string> = {};
envContent.split('\n').forEach((line) => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    env[key.trim()] = valueParts.join('=').trim();
  }
});

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY || SUPABASE_URL === 'your_supabase_url_here') {
  console.error('错误: 请在 .env.local 中配置 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Excel 列名到数据库字段名的映射
const columnMapping: Record<string, keyof typeof sampleData> = {
  '起止日期': 'term_dates',
  '起止日期英文': 'term_dates_en',
  '证书日期': 'certificate_date',
  '时间': 'term_time',
  '届数': 'session_number',
  '届数英文': 'session_number_en',
  '证书编号': 'certificate_no',
  '会内职务': 'committee_position',
  'Title_in_Committee': 'committee_position_en',
  '姓名': 'name_cn',
  '英文姓名': 'name_en',
  '姓（英）': 'last_name_en',
  '名（英）': 'first_name_en',
  '英文称谓': 'salutation_en',
  '中文称谓': 'salutation_cn',
  '性别': 'gender_cn',
  'Sex': 'gender_en',
  '出生年月': 'birth_date',
  '单位': 'organization',
  '单位英文': 'organization_en',
  '职务': 'position',
  '职称': 'professional_title',
  '职称英文/PROFESSIONAL TITLE': 'professional_title_en',
  '国籍': 'nationality_cn',
  'Country': 'nationality_en',
  '照片': 'photo_url',
  '电话': 'phone',
  '邮箱': 'email',
  '微信': 'wechat',
  '入会时间': 'join_date',
  '缴费日期': 'payment_date',
  '到期时间': 'expiry_date',
  '缴费情况': 'payment_status',
  '参加ICA情况': 'ica_participation',
  '获奖情况': 'awards',
  '演讲情况': 'speeches',
  '合作项目': 'cooperation_projects',
  '备注': 'notes',
};

const sampleData = {
  term_dates: null as string | null,
  term_dates_en: null as string | null,
  certificate_date: null as string | null,
  term_time: null as string | null,
  session_number: null as string | null,
  session_number_en: null as string | null,
  certificate_no: null as string | null,
  committee_position: null as string | null,
  committee_position_en: null as string | null,
  name_cn: null as string | null,
  name_en: null as string | null,
  last_name_en: null as string | null,
  first_name_en: null as string | null,
  salutation_en: null as string | null,
  salutation_cn: null as string | null,
  gender_cn: null as string | null,
  gender_en: null as string | null,
  birth_date: null as string | null,
  organization: null as string | null,
  organization_en: null as string | null,
  position: null as string | null,
  professional_title: null as string | null,
  professional_title_en: null as string | null,
  nationality_cn: null as string | null,
  nationality_en: null as string | null,
  photo_url: null as string | null,
  phone: null as string | null,
  email: null as string | null,
  wechat: null as string | null,
  join_date: null as string | null,
  payment_date: null as string | null,
  expiry_date: null as string | null,
  payment_status: null as string | null,
  ica_participation: null as string | null,
  awards: null as string | null,
  speeches: null as string | null,
  cooperation_projects: null as string | null,
  notes: null as string | null,
};

// 格式化日期值
function formatDate(value: unknown): string | null {
  if (value instanceof Date) {
    return value.toISOString().split('T')[0];
  }
  if (typeof value === 'number') {
    // Excel 日期序列号
    const date = XLSX.SSF.parse_date_code(value);
    if (date) {
      return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
    }
  }
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }
  return null;
}

// 格式化通用值
function formatValue(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const str = String(value).trim();
  return str || null;
}

// 处理数值字段
function formatNumber(value: unknown): number | null {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const num = Number(value);
    return isNaN(num) ? null : num;
  }
  return null;
}

async function main() {
  const args = process.argv.slice(2);
  let filePath = '';
  let clearBefore = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--file' && args[i + 1]) {
      filePath = args[i + 1];
      i++;
    } else if (args[i] === '--clear') {
      clearBefore = true;
    }
  }

  // 查找 Excel 文件
  if (!filePath) {
    const parentDir = path.join(__dirname, '..');
    const files = fs.readdirSync(parentDir).filter((f) => f.endsWith('.xlsx') || f.endsWith('.xls'));
    if (files.length === 0) {
      console.error('错误: 未找到 Excel 文件，请使用 --file 指定文件路径');
      process.exit(1);
    }
    filePath = path.join(parentDir, files[0]);
    console.log(`自动检测到文件: ${files[0]}`);
  }

  if (!fs.existsSync(filePath)) {
    console.error(`错误: 文件不存在 - ${filePath}`);
    process.exit(1);
  }

  console.log(`\n开始导入数据...`);
  console.log(`文件: ${filePath}\n`);

  // 读取 Excel
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);

  console.log(`工作表: ${sheetName}`);
  console.log(`读取到 ${rawData.length} 行数据\n`);

  // 如果需要清空
  if (clearBefore) {
    console.log('正在清空 experts 表...');
    const { error: deleteError } = await supabase.from('experts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (deleteError) {
      console.error('清空表失败:', deleteError.message);
      process.exit(1);
    }
    console.log('已清空 experts 表\n');
  }

  // 转换数据
  const experts = rawData
    .filter((row) => {
      // 过滤空行（至少有一个有意义的字段）
      return row['英文姓名'] || row['姓名'] || row['证书编号'] || row['序号'];
    })
    .map((row, index) => {
      const record: Record<string, unknown> = {};

      for (const [excelCol, dbCol] of Object.entries(columnMapping)) {
        const value = row[excelCol];

        if (dbCol.includes('date') || dbCol.includes('expiry') || dbCol === 'join_date' || dbCol === 'certificate_date') {
          record[dbCol] = formatDate(value);
        } else if (dbCol === 'phone') {
          // 电话号码保持为字符串
          record[dbCol] = formatValue(value);
        } else {
          record[dbCol] = formatValue(value);
        }
      }

      return record;
    });

  console.log(`有效数据: ${experts.length} 条\n`);

  // 批量插入（每次最多 50 条）
  const batchSize = 50;
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < experts.length; i += batchSize) {
    const batch = experts.slice(i, i + batchSize);
    const { error } = await supabase.from('experts').insert(batch);

    if (error) {
      console.error(`批次 ${Math.floor(i / batchSize) + 1} 导入失败:`, error.message);
      failCount += batch.length;
    } else {
      successCount += batch.length;
      console.log(`批次 ${Math.floor(i / batchSize) + 1}: 成功导入 ${batch.length} 条 (${successCount}/${experts.length})`);
    }
  }

  console.log(`\n========================================`);
  console.log(`导入完成!`);
  console.log(`  成功: ${successCount} 条`);
  console.log(`  失败: ${failCount} 条`);
  console.log(`========================================\n`);
}

main().catch((err) => {
  console.error('脚本执行出错:', err);
  process.exit(1);
});
