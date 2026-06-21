'use client';

import { useState, useRef } from 'react';
import { Expert, ExpertFormData } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Loader2, Save, X, ChevronDown, Search } from 'lucide-react';

interface ExpertFormProps {
  expert: Expert | null;
  onSave: (data: Partial<Expert>) => void;
  onCancel: () => void;
}

// 性别选项
const GENDER_OPTIONS = ['男', '女', '其他'];

// 国家中英文对照表
const COUNTRY_MAP: Record<string, string> = {
  '中国': 'China', '阿富汗': 'Afghanistan', '阿尔巴尼亚': 'Albania',
  '阿尔及利亚': 'Algeria', '安道尔': 'Andorra', '安哥拉': 'Angola',
  '阿根廷': 'Argentina', '亚美尼亚': 'Armenia', '澳大利亚': 'Australia',
  '奥地利': 'Austria', '阿塞拜疆': 'Azerbaijan', '巴哈马': 'Bahamas',
  '巴林': 'Bahrain', '孟加拉国': 'Bangladesh', '巴巴多斯': 'Barbados',
  '白俄罗斯': 'Belarus', '比利时': 'Belgium', '伯利兹': 'Belize',
  '贝宁': 'Benin', '不丹': 'Bhutan', '玻利维亚': 'Bolivia',
  '波黑': 'Bosnia and Herzegovina', '博茨瓦纳': 'Botswana', '巴西': 'Brazil',
  '文莱': 'Brunei', '保加利亚': 'Bulgaria', '布基纳法索': 'Burkina Faso',
  '布隆迪': 'Burundi', '柬埔寨': 'Cambodia', '喀麦隆': 'Cameroon',
  '加拿大': 'Canada', '佛得角': 'Cape Verde', '中非': 'Central African Republic',
  '乍得': 'Chad', '智利': 'Chile', '哥伦比亚': 'Colombia',
  '科摩罗': 'Comoros', '刚果（布）': 'Congo (Brazzaville)', '刚果（金）': 'Congo (Kinshasa)',
  '哥斯达黎加': 'Costa Rica', '克罗地亚': 'Croatia', '古巴': 'Cuba',
  '塞浦路斯': 'Cyprus', '捷克': 'Czech Republic', '丹麦': 'Denmark',
  '吉布提': 'Djibouti', '多米尼加': 'Dominica', '多米尼加共和国': 'Dominican Republic',
  '厄瓜多尔': 'Ecuador', '埃及': 'Egypt', '萨尔瓦多': 'El Salvador',
  '赤道几内亚': 'Equatorial Guinea', '厄立特里亚': 'Eritrea', '爱沙尼亚': 'Estonia',
  '埃塞俄比亚': 'Ethiopia', '斐济': 'Fiji', '芬兰': 'Finland',
  '法国': 'France', '加蓬': 'Gabon', '冈比亚': 'Gambia',
  '格鲁吉亚': 'Georgia', '德国': 'Germany', '加纳': 'Ghana',
  '希腊': 'Greece', '格林纳达': 'Grenada', '危地马拉': 'Guatemala',
  '几内亚': 'Guinea', '几内亚比绍': 'Guinea-Bissau', '圭亚那': 'Guyana',
  '海地': 'Haiti', '洪都拉斯': 'Honduras', '匈牙利': 'Hungary',
  '冰岛': 'Iceland', '印度': 'India', '印度尼西亚': 'Indonesia',
  '伊朗': 'Iran', '伊拉克': 'Iraq', '爱尔兰': 'Ireland',
  '以色列': 'Israel', '意大利': 'Italy', '牙买加': 'Jamaica',
  '日本': 'Japan', '约旦': 'Jordan', '哈萨克斯坦': 'Kazakhstan',
  '肯尼亚': 'Kenya', '基里巴斯': 'Kiribati', '朝鲜': 'North Korea',
  '韩国': 'South Korea', '科威特': 'Kuwait', '吉尔吉斯斯坦': 'Kyrgyzstan',
  '老挝': 'Laos', '拉脱维亚': 'Latvia', '黎巴嫩': 'Lebanon',
  '莱索托': 'Lesotho', '利比里亚': 'Liberia', '利比亚': 'Libya',
  '列支敦士登': 'Liechtenstein', '立陶宛': 'Lithuania', '卢森堡': 'Luxembourg',
  '马达加斯加': 'Madagascar', '马拉维': 'Malawi', '马来西亚': 'Malaysia',
  '马尔代夫': 'Maldives', '马里': 'Mali', '马耳他': 'Malta',
  '毛里塔尼亚': 'Mauritania', '毛里求斯': 'Mauritius', '墨西哥': 'Mexico',
  '摩尔多瓦': 'Moldova', '摩纳哥': 'Monaco', '蒙古': 'Mongolia',
  '黑山': 'Montenegro', '摩洛哥': 'Morocco', '莫桑比克': 'Mozambique',
  '缅甸': 'Myanmar', '纳米比亚': 'Namibia', '瑙鲁': 'Nauru',
  '尼泊尔': 'Nepal', '荷兰': 'Netherlands', '新西兰': 'New Zealand',
  '尼加拉瓜': 'Nicaragua', '尼日尔': 'Niger', '尼日利亚': 'Nigeria',
  '北马其顿': 'North Macedonia', '挪威': 'Norway', '阿曼': 'Oman',
  '巴基斯坦': 'Pakistan', '帕劳': 'Palau', '巴勒斯坦': 'Palestine',
  '巴拿马': 'Panama', '巴布亚新几内亚': 'Papua New Guinea', '巴拉圭': 'Paraguay',
  '秘鲁': 'Peru', '菲律宾': 'Philippines', '波兰': 'Poland',
  '葡萄牙': 'Portugal', '卡塔尔': 'Qatar', '罗马尼亚': 'Romania',
  '俄罗斯': 'Russia', '卢旺达': 'Rwanda', '圣基茨和尼维斯': 'Saint Kitts and Nevis',
  '圣卢西亚': 'Saint Lucia', '圣文森特和格林纳丁斯': 'Saint Vincent and the Grenadines',
  '萨摩亚': 'Samoa', '圣马力诺': 'San Marino', '圣多美和普林西比': 'Sao Tome and Principe',
  '沙特阿拉伯': 'Saudi Arabia', '塞内加尔': 'Senegal', '塞尔维亚': 'Serbia',
  '塞舌尔': 'Seychelles', '塞拉利昂': 'Sierra Leone', '新加坡': 'Singapore',
  '斯洛伐克': 'Slovakia', '斯洛文尼亚': 'Slovenia', '所罗门群岛': 'Solomon Islands',
  '索马里': 'Somalia', '南非': 'South Africa', '南苏丹': 'South Sudan',
  '西班牙': 'Spain', '斯里兰卡': 'Sri Lanka', '苏丹': 'Sudan',
  '苏里南': 'Suriname', '斯威士兰': 'Eswatini', '瑞典': 'Sweden',
  '瑞士': 'Switzerland', '叙利亚': 'Syria', '塔吉克斯坦': 'Tajikistan',
  '坦桑尼亚': 'Tanzania', '泰国': 'Thailand', '东帝汶': 'Timor-Leste',
  '多哥': 'Togo', '汤加': 'Tonga', '特立尼达和多巴哥': 'Trinidad and Tobago',
  '突尼斯': 'Tunisia', '土耳其': 'Turkey', '土库曼斯坦': 'Turkmenistan',
  '图瓦卢': 'Tuvalu', '乌干达': 'Uganda', '乌克兰': 'Ukraine',
  '阿联酋': 'United Arab Emirates', '英国': 'United Kingdom', '美国': 'United States',
  '乌拉圭': 'Uruguay', '乌兹别克斯坦': 'Uzbekistan', '瓦努阿图': 'Vanuatu',
  '梵蒂冈': 'Vatican City', '委内瑞拉': 'Venezuela', '越南': 'Vietnam',
  '也门': 'Yemen', '赞比亚': 'Zambia', '津巴布韦': 'Zimbabwe',
};

const COUNTRY_CN_LIST = Object.keys(COUNTRY_MAP);
const MANUAL_INPUT = '__manual__';

// 拼音首字母映射
const PINYIN_MAP: Record<string, string> = {
  '中国': 'Z', '阿富汗': 'A', '阿尔巴尼亚': 'A', '阿尔及利亚': 'A',
  '安道尔': 'A', '安哥拉': 'A', '阿根廷': 'A', '亚美尼亚': 'Y',
  '澳大利亚': 'A', '奥地利': 'A', '阿塞拜疆': 'A', '巴哈马': 'B',
  '巴林': 'B', '孟加拉国': 'M', '巴巴多斯': 'B', '白俄罗斯': 'B',
  '比利时': 'B', '伯利兹': 'B', '贝宁': 'B', '不丹': 'B',
  '玻利维亚': 'B', '波黑': 'B', '博茨瓦纳': 'B', '巴西': 'B',
  '文莱': 'W', '保加利亚': 'B', '布基纳法索': 'B', '布隆迪': 'B',
  '柬埔寨': 'J', '喀麦隆': 'K', '加拿大': 'J', '佛得角': 'F',
  '中非': 'Z', '乍得': 'Z', '智利': 'Z', '哥伦比亚': 'G',
  '科摩罗': 'K', '刚果（布）': 'G', '刚果（金）': 'G', '哥斯达黎加': 'G',
  '克罗地亚': 'K', '古巴': 'G', '塞浦路斯': 'S', '捷克': 'J',
  '丹麦': 'D', '吉布提': 'J', '多米尼加': 'D', '多米尼加共和国': 'D',
  '厄瓜多尔': 'E', '埃及': 'A', '萨尔瓦多': 'S', '赤道几内亚': 'C',
  '厄立特里亚': 'E', '爱沙尼亚': 'A', '埃塞俄比亚': 'A', '斐济': 'F',
  '芬兰': 'F', '法国': 'F', '加蓬': 'J', '冈比亚': 'G',
  '格鲁吉亚': 'G', '德国': 'D', '加纳': 'J', '希腊': 'X',
  '格林纳达': 'G', '危地马拉': 'W', '几内亚': 'J', '几内亚比绍': 'J',
  '圭亚那': 'G', '海地': 'H', '洪都拉斯': 'H', '匈牙利': 'X',
  '冰岛': 'B', '印度': 'Y', '印度尼西亚': 'Y', '伊朗': 'Y',
  '伊拉克': 'Y', '爱尔兰': 'A', '以色列': 'Y', '意大利': 'Y',
  '牙买加': 'Y', '日本': 'R', '约旦': 'Y', '哈萨克斯坦': 'H',
  '肯尼亚': 'K', '基里巴斯': 'J', '朝鲜': 'C', '韩国': 'H',
  '科威特': 'K', '吉尔吉斯斯坦': 'J', '老挝': 'L', '拉脱维亚': 'L',
  '黎巴嫩': 'L', '莱索托': 'L', '利比里亚': 'L', '利比亚': 'L',
  '列支敦士登': 'L', '立陶宛': 'L', '卢森堡': 'L', '马达加斯加': 'M',
  '马拉维': 'M', '马来西亚': 'M', '马尔代夫': 'M', '马里': 'M',
  '马耳他': 'M', '毛里塔尼亚': 'M', '毛里求斯': 'M', '墨西哥': 'M',
  '摩尔多瓦': 'M', '摩纳哥': 'M', '蒙古': 'M', '黑山': 'H',
  '摩洛哥': 'M', '莫桑比克': 'M', '缅甸': 'M', '纳米比亚': 'N',
  '瑙鲁': 'N', '尼泊尔': 'N', '荷兰': 'H', '新西兰': 'X',
  '尼加拉瓜': 'N', '尼日尔': 'N', '尼日利亚': 'N', '北马其顿': 'B',
  '挪威': 'N', '阿曼': 'A', '巴基斯坦': 'B', '帕劳': 'P',
  '巴勒斯坦': 'B', '巴拿马': 'B', '巴布亚新几内亚': 'B', '巴拉圭': 'B',
  '秘鲁': 'B', '菲律宾': 'F', '波兰': 'B', '葡萄牙': 'P',
  '卡塔尔': 'K', '罗马尼亚': 'L', '俄罗斯': 'E', '卢旺达': 'L',
  '圣基茨和尼维斯': 'S', '圣卢西亚': 'S', '圣文森特和格林纳丁斯': 'S',
  '萨摩亚': 'S', '圣马力诺': 'S', '圣多美和普林西比': 'S',
  '沙特阿拉伯': 'S', '塞内加尔': 'S', '塞尔维亚': 'S',
  '塞舌尔': 'S', '塞拉利昂': 'S', '新加坡': 'X',
  '斯洛伐克': 'S', '斯洛文尼亚': 'S', '所罗门群岛': 'S',
  '索马里': 'S', '南非': 'N', '南苏丹': 'N', '西班牙': 'X',
  '斯里兰卡': 'S', '苏丹': 'S', '苏里南': 'S', '斯威士兰': 'S',
  '瑞典': 'R', '瑞士': 'R', '叙利亚': 'X', '塔吉克斯坦': 'T',
  '坦桑尼亚': 'T', '泰国': 'T', '东帝汶': 'D', '多哥': 'D',
  '汤加': 'T', '特立尼达和多巴哥': 'T', '突尼斯': 'T',
  '土耳其': 'T', '土库曼斯坦': 'T', '图瓦卢': 'T', '乌干达': 'W',
  '乌克兰': 'W', '阿联酋': 'A', '英国': 'Y', '美国': 'M',
  '乌拉圭': 'W', '乌兹别克斯坦': 'W', '瓦努阿图': 'W',
  '梵蒂冈': 'F', '委内瑞拉': 'W', '越南': 'Y', '也门': 'Y',
  '赞比亚': 'Z', '津巴布韦': 'J',
};

const ALPHABET = 'ABCDEFGHJKLMNPQRSTWXYZ'.split('');

// 按拼音首字母分组排序
const SORTED_COUNTRIES = [...COUNTRY_CN_LIST].sort((a, b) => {
  const pa = PINYIN_MAP[a] || '#';
  const pb = PINYIN_MAP[b] || '#';
  if (pa !== pb) return pa.localeCompare(pb);
  return a.localeCompare(b, 'zh-CN');
});

const emptyForm: ExpertFormData = {
  certificate_no: null,
  passport_no: null,
  committee_position: null,
  committee_position_en: null,
  name_cn: null,
  name_en: null,
  last_name_en: null,
  first_name_en: null,
  salutation_en: null,
  salutation_cn: null,
  gender_cn: null,
  birth_date: null,
  organization: null,
  organization_en: null,
  position: null,
  professional_title: null,
  professional_title_en: null,
  nationality_cn: null,
  nationality_en: null,
  phone: null,
  email: null,
  wechat: null,
  join_date: null,
  payment_date: null,
  expiry_date: null,
  payment_status: null,
  ica_participation: null,
  awards: null,
  speeches: null,
  cooperation_projects: null,
  notes: null,
};

// 国家选择器组件（带搜索 + 字母索引）
function CountryPicker({ value, onSelect, onManualInput }: {
  value: string | null;
  onSelect: (cn: string) => void;
  onManualInput: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  // 根据搜索词过滤国家
  const filtered = search.trim()
    ? SORTED_COUNTRIES.filter(cn =>
        cn.includes(search) ||
        COUNTRY_MAP[cn]?.toLowerCase().includes(search.toLowerCase()) ||
        (PINYIN_MAP[cn] || '').startsWith(search.toUpperCase())
      )
    : SORTED_COUNTRIES;

  // 计算当前显示的字母分组
  const groups: { letter: string; countries: string[] }[] = [];
  let currentLetter = '';
  for (const cn of filtered) {
    const letter = PINYIN_MAP[cn] || '#';
    if (letter !== currentLetter) {
      currentLetter = letter;
      groups.push({ letter, countries: [] });
    }
    groups[groups.length - 1].countries.push(cn);
  }

  // 存在的字母列表
  const activeLetters = new Set(groups.map(g => g.letter));

  const scrollToLetter = (letter: string) => {
    const el = listRef.current?.querySelector(`[data-letter="${letter}"]`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        type="button"
        className="flex h-9 w-full items-center justify-between rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
      >
        <span className={value ? '' : 'text-slate-400'}>
          {value || '选择国家'}
        </span>
        <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        {/* 搜索框 */}
        <div className="flex items-center border-b px-3 py-2">
          <Search className="mr-2 h-4 w-4 text-slate-400" />
          <input
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
            placeholder="搜索国家或拼音..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>
        {/* 字母索引 */}
        <div className="flex flex-wrap gap-0.5 border-b px-2 py-1.5">
          {ALPHABET.map(letter => (
            <button
              key={letter}
              type="button"
              disabled={!activeLetters.has(letter)}
              onClick={() => scrollToLetter(letter)}
              className={`h-6 w-6 rounded text-xs font-medium transition-colors ${
                activeLetters.has(letter)
                  ? 'text-blue-600 hover:bg-blue-50 cursor-pointer'
                  : 'text-slate-300 cursor-default'
              }`}
            >
              {letter}
            </button>
          ))}
        </div>
        {/* 手动输入选项 */}
        <div className="border-b px-1 py-1">
          <button
            type="button"
            className="w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-slate-100"
            onClick={() => { onManualInput(); setOpen(false); }}
          >
            ✏️ 手动输入
          </button>
        </div>
        {/* 国家列表 */}
        <div ref={listRef} className="max-h-[240px] overflow-y-auto px-1 py-1">
          {groups.length === 0 && (
            <p className="px-2 py-4 text-center text-sm text-slate-400">无匹配结果</p>
          )}
          {groups.map(group => (
            <div key={group.letter} data-letter={group.letter}>
              <div className="sticky top-0 bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-500">
                {group.letter}
              </div>
              {group.countries.map(cn => (
                <button
                  key={cn}
                  type="button"
                  className={`w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-blue-50 ${
                    cn === value ? 'bg-blue-50 text-blue-700 font-medium' : ''
                  }`}
                  onClick={() => { onSelect(cn); setSearch(''); setOpen(false); }}
                >
                  {cn}
                  <span className="ml-2 text-xs text-slate-400">{COUNTRY_MAP[cn]}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function ExpertForm({ expert, onSave, onCancel }: ExpertFormProps) {
  const [formData, setFormData] = useState<ExpertFormData>(
    expert ? { ...expert } : { ...emptyForm }
  );
  const [saving, setSaving] = useState(false);

  // 判断当前国籍是否在列表中
  const isKnownCountry = (cn: string | null) => cn ? cn in COUNTRY_MAP : false;
  const [nationalityManual, setNationalityManual] = useState(
    expert ? !isKnownCountry(expert.nationality_cn) : false
  );

  const updateField = (field: keyof ExpertFormData, value: string | number | null) => {
    setFormData((prev) => ({ ...prev, [field]: value === '' ? null : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(formData);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">基本信息</TabsTrigger>
          <TabsTrigger value="committee">委员会信息</TabsTrigger>
          <TabsTrigger value="contact">联系方式</TabsTrigger>
          <TabsTrigger value="payment">缴费信息</TabsTrigger>
        </TabsList>

        {/* 基本信息 */}
        <TabsContent value="basic" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="性别">
              <Select
                value={formData.gender_cn ?? ''}
                onValueChange={(v) => updateField('gender_cn', v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择性别" />
                </SelectTrigger>
                <SelectContent>
                  {GENDER_OPTIONS.map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="出生年月">
              <Input
                type="date"
                value={formData.birth_date ?? ''}
                onChange={(e) => updateField('birth_date', e.target.value)}
              />
            </FormField>
            <FormField label="国籍">
              {nationalityManual ? (
                <div className="flex gap-2">
                  <Input
                    value={formData.nationality_cn ?? ''}
                    onChange={(e) => updateField('nationality_cn', e.target.value)}
                    placeholder="手动输入国籍"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setNationalityManual(false);
                      updateField('nationality_cn', '');
                      updateField('nationality_en', '');
                    }}
                  >
                    选择
                  </Button>
                </div>
              ) : (
                <CountryPicker
                  value={formData.nationality_cn}
                  onSelect={(cn: string) => {
                    updateField('nationality_cn', cn);
                    updateField('nationality_en', COUNTRY_MAP[cn] || '');
                  }}
                  onManualInput={() => {
                    setNationalityManual(true);
                    updateField('nationality_cn', '');
                    updateField('nationality_en', '');
                  }}
                />
              )}
            </FormField>
            <FormField label="Country">
              {nationalityManual ? (
                <Input
                  value={formData.nationality_en ?? ''}
                  onChange={(e) => updateField('nationality_en', e.target.value)}
                  placeholder="手动输入 Country"
                />
              ) : (
                <Input
                  value={formData.nationality_en ?? ''}
                  readOnly
                  placeholder="选择国籍后自动填充"
                  className="bg-slate-50"
                />
              )}
            </FormField>
          </div>

          <Separator />

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-slate-700">姓名信息</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="姓名 (中文)">
                <Input
                  value={formData.name_cn ?? ''}
                  onChange={(e) => updateField('name_cn', e.target.value)}
                />
              </FormField>
              <FormField label="英文姓名">
                <Input
                  value={formData.name_en ?? ''}
                  onChange={(e) => updateField('name_en', e.target.value)}
                  placeholder="如: Dr. János Körmendy-Rácz"
                />
              </FormField>
              <FormField label="姓 (英文)">
                <Input
                  value={formData.last_name_en ?? ''}
                  onChange={(e) => updateField('last_name_en', e.target.value)}
                />
              </FormField>
              <FormField label="名 (英文)">
                <Input
                  value={formData.first_name_en ?? ''}
                  onChange={(e) => updateField('first_name_en', e.target.value)}
                />
              </FormField>
              <FormField label="英文称谓">
                <Input
                  value={formData.salutation_en ?? ''}
                  onChange={(e) => updateField('salutation_en', e.target.value)}
                  placeholder="如: Mr./Mrs./Dr."
                />
              </FormField>
              <FormField label="中文称谓">
                <Input
                  value={formData.salutation_cn ?? ''}
                  onChange={(e) => updateField('salutation_cn', e.target.value)}
                  placeholder="如: 先生/女士"
                />
              </FormField>
            </div>
          </div>
        </TabsContent>

        {/* 委员会信息 */}
        <TabsContent value="committee" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="会内职务">
              <Input
                value={formData.committee_position ?? ''}
                onChange={(e) => updateField('committee_position', e.target.value)}
                placeholder="如: 副会长"
              />
            </FormField>
            <FormField label="Title in Committee">
              <Input
                value={formData.committee_position_en ?? ''}
                onChange={(e) => updateField('committee_position_en', e.target.value)}
                placeholder="如: Vice Chairperson"
              />
            </FormField>
            <FormField label="证书编号">
              <Input
                value={formData.certificate_no ?? ''}
                onChange={(e) => updateField('certificate_no', e.target.value)}
              />
            </FormField>
            <FormField label="护照号">
              <Input
                value={formData.passport_no ?? ''}
                onChange={(e) => updateField('passport_no', e.target.value)}
              />
            </FormField>
          </div>

          <Separator />

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-slate-700">职务信息</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="单位">
                <Input
                  value={formData.organization ?? ''}
                  onChange={(e) => updateField('organization', e.target.value)}
                />
              </FormField>
              <FormField label="单位英文">
                <Input
                  value={formData.organization_en ?? ''}
                  onChange={(e) => updateField('organization_en', e.target.value)}
                />
              </FormField>
              <FormField label="职务">
                <Input
                  value={formData.position ?? ''}
                  onChange={(e) => updateField('position', e.target.value)}
                  placeholder="如: president"
                />
              </FormField>
              <FormField label="职称">
                <Input
                  value={formData.professional_title ?? ''}
                  onChange={(e) => updateField('professional_title', e.target.value)}
                />
              </FormField>
              <FormField label="职称英文">
                <Input
                  value={formData.professional_title_en ?? ''}
                  onChange={(e) => updateField('professional_title_en', e.target.value)}
                />
              </FormField>
            </div>
          </div>
        </TabsContent>

        {/* 联系方式 */}
        <TabsContent value="contact" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="电话">
              <Input
                value={formData.phone ?? ''}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="+86..."
              />
            </FormField>
            <FormField label="邮箱">
              <Input
                type="email"
                value={formData.email ?? ''}
                onChange={(e) => updateField('email', e.target.value)}
              />
            </FormField>
            <FormField label="微信">
              <Input
                value={formData.wechat ?? ''}
                onChange={(e) => updateField('wechat', e.target.value)}
              />
            </FormField>
            <FormField label="入会时间">
              <Input
                type="date"
                value={formData.join_date ?? ''}
                onChange={(e) => updateField('join_date', e.target.value)}
              />
            </FormField>
          </div>
        </TabsContent>

        {/* 缴费信息 */}
        <TabsContent value="payment" className="space-y-4 mt-4">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField label="缴费日期">
                <Input
                  type="date"
                  value={formData.payment_date ?? ''}
                  onChange={(e) => updateField('payment_date', e.target.value)}
                />
              </FormField>
              <FormField label="到期时间">
                <Input
                  type="date"
                  value={formData.expiry_date ?? ''}
                  onChange={(e) => updateField('expiry_date', e.target.value)}
                />
              </FormField>
              <FormField label="缴费情况">
                <Input
                  value={formData.payment_status ?? ''}
                  onChange={(e) => updateField('payment_status', e.target.value)}
                  placeholder="如: 已缴费 / 2000"
                />
              </FormField>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-slate-700">ICA 相关信息</h3>
            <div className="grid grid-cols-1 gap-4">
              <FormField label="参加ICA情况">
                <Input
                  value={formData.ica_participation ?? ''}
                  onChange={(e) => updateField('ica_participation', e.target.value)}
                />
              </FormField>
              <FormField label="获奖情况">
                <Input
                  value={formData.awards ?? ''}
                  onChange={(e) => updateField('awards', e.target.value)}
                />
              </FormField>
              <FormField label="演讲情况">
                <Input
                  value={formData.speeches ?? ''}
                  onChange={(e) => updateField('speeches', e.target.value)}
                />
              </FormField>
              <FormField label="合作项目">
                <Input
                  value={formData.cooperation_projects ?? ''}
                  onChange={(e) => updateField('cooperation_projects', e.target.value)}
                />
              </FormField>
            </div>
          </div>

          <Separator />

          <FormField label="备注">
            <Textarea
              value={formData.notes ?? ''}
              onChange={(e) => updateField('notes', e.target.value)}
              rows={3}
              placeholder="备注信息..."
            />
          </FormField>
        </TabsContent>
      </Tabs>

      {/* 表单按钮 */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="mr-2 h-4 w-4" />
          取消
        </Button>
        <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              保存中...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              保存
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

// 表单字段组件
function FormField({ label, children, type }: { label: string; children: React.ReactNode; type?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-slate-600">{label}</Label>
      {children}
    </div>
  );
}
