'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Expert } from '@/types';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
} from '@tanstack/react-table';
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
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Download,
  Upload,
  Settings2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
  AlertCircle,
  Users,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { ExpertForm } from '@/components/experts/expert-form';

export default function ExpertsPageClient() {
  const supabase = createClient();
  const [experts, setExperts] = useState<Expert[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    committee_position_en: false,
    last_name_en: false,
    first_name_en: false,
    salutation_en: false,
    salutation_cn: false,
    gender_en: false,
    birth_date: false,
    organization: false,
    organization_en: false,
    professional_title: false,
    professional_title_en: false,
    nationality_en: false,
    phone: false,
    email: false,
    wechat: false,
    join_date: false,
    payment_date: false,
    expiry_date: false,
    payment_status: false,
  });
  const [pageSize, setPageSize] = useState(20);

  // Dialog 状态
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingExpert, setEditingExpert] = useState<Expert | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingExpert, setDeletingExpert] = useState<Expert | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);

  // 上传专家信息状态
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<{
    success: { name_cn: string | null; name_en: string | null }[];
    failed: { name_cn: string | null; name_en: string | null; reason: string }[];
  } | null>(null);
  const [uploadResultTab, setUploadResultTab] = useState<'success' | 'failed'>('success');

  // 加载数据
  useEffect(() => {
    loadExperts();
  }, []);

  const loadExperts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('experts')
        .select('*')
        .order('name_en', { ascending: true });

      if (error) throw error;
      setExperts(data || []);
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error('加载专家数据失败: ' + (err.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  // 删除专家
  const handleDelete = async () => {
    if (!deletingExpert) return;
    try {
      const { error } = await supabase
        .from('experts')
        .delete()
        .eq('id', deletingExpert.id);

      if (error) throw error;

      toast.success('删除成功');
      setExperts((prev) => prev.filter((e) => e.id !== deletingExpert.id));
      setDeleteDialogOpen(false);
      setDeletingExpert(null);
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error('删除失败: ' + (err.message || '未知错误'));
    }
  };

  // 保存专家（新增/编辑）
  const handleSaveExpert = async (data: Partial<Expert>) => {
    try {
      if (editingExpert) {
        // 更新
        const { error } = await supabase
          .from('experts')
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq('id', editingExpert.id);

        if (error) throw error;
        toast.success('更新成功');
      } else {
        // 新增
        const { error } = await supabase
          .from('experts')
          .insert(data);

        if (error) throw error;
        toast.success('添加成功');
      }

      setFormDialogOpen(false);
      setEditingExpert(null);
      loadExperts();
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error('保存失败: ' + (err.message || '未知错误'));
    }
  };

  // 导出 CSV
  const handleExportCSV = () => {
    const headers = [
      '证书编号', '会内职务', '职务英文',
      '姓名', '英文姓名', '姓（英）', '名（英）', '英文称谓', '中文称谓',
      '性别', '出生年月', '单位', '单位英文', '职务', '职称', '职称英文',
      '国籍', 'Country', '电话', '邮箱', '微信',
      '入会时间', '缴费日期', '到期时间', '缴费情况',
      '参加ICA情况', '获奖情况', '演讲情况', '合作项目', '备注'
    ];

    const rows = experts.map((e) => [
      e.certificate_no,
      e.committee_position, e.committee_position_en, e.name_cn, e.name_en,
      e.last_name_en, e.first_name_en, e.salutation_en, e.salutation_cn,
      e.gender_cn, e.birth_date, e.organization, e.organization_en,
      e.position, e.professional_title, e.professional_title_en,
      e.nationality_cn, e.nationality_en, e.phone, e.email, e.wechat,
      e.join_date, e.payment_date, e.expiry_date, e.payment_status,
      e.ica_participation, e.awards, e.speeches, e.cooperation_projects, e.notes
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell ?? ''}"`).join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `专家名单_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('导出成功');
  };

  // 上传专家信息：解析文件（CSV / Excel）并写入数据库
  const handleUploadFile = async () => {
    if (!uploadFile) {
      toast.error('请先选择文件');
      return;
    }
    const ext = uploadFile.name.toLowerCase().split('.').pop();
    if (!['csv', 'xlsx', 'xls'].includes(ext || '')) {
      toast.error('只支持 .csv / .xlsx / .xls 文件');
      return;
    }

    setUploading(true);
    try {
      const XLSX = await import('xlsx');
      const buffer = await uploadFile.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

      if (json.length === 0) {
        toast.error('文件中没有数据');
        setUploading(false);
        return;
      }

      // 中英文表头 -> 字段名映射
      const headerMap: Record<string, keyof Expert> = {
        '证书编号': 'certificate_no', '会内职务': 'committee_position',
        '职务英文': 'committee_position_en', 'Title_in_Committee': 'committee_position_en',
        '姓名': 'name_cn', '英文姓名': 'name_en',
        '姓（英）': 'last_name_en', '名（英）': 'first_name_en',
        '英文称谓': 'salutation_en', '中文称谓': 'salutation_cn',
        '性别': 'gender_cn', 'Sex': 'gender_en',
        '出生年月': 'birth_date', '单位': 'organization', '单位英文': 'organization_en',
        '职务': 'position', '职称': 'professional_title', '职称英文': 'professional_title_en',
        '职称英文/PROFESSIONAL TITLE': 'professional_title_en',
        '国籍': 'nationality_cn', 'Country': 'nationality_en',
        '电话': 'phone', '邮箱': 'email', '微信': 'wechat',
        '入会时间': 'join_date', '缴费日期': 'payment_date',
        '到期时间': 'expiry_date', '缴费情况': 'payment_status',
        '参加ICA情况': 'ica_participation', '获奖情况': 'awards',
        '演讲情况': 'speeches', '合作项目': 'cooperation_projects',
        '备注': 'notes',
      };

      const records = json.map((row) => {
        const rec: Record<string, string | null> = {};
        for (const [cnHeader, enField] of Object.entries(headerMap)) {
          const val = row[cnHeader];
          if (val !== undefined && val !== '') {
            rec[enField] = String(val).trim() || null;
          }
        }
        return rec;
      });

      // 必填字段校验
      const missing = records.findIndex((r) => !r.name_cn && !r.name_en);
      if (missing >= 0) {
        toast.error(`第 ${missing + 2} 行缺少「姓名」或「英文姓名」`);
        setUploading(false);
        return;
      }

      // 标准化函数：去空格 + 小写
      const normalize = (s: string | null | undefined) => (s ? s.trim().toLowerCase() : '');

      // 从数据库加载现有专家（仅取姓名用于去重）
      const { data: existingExperts } = await supabase
        .from('experts').select('name_cn, name_en');
      const existingSet = new Set<string>();
      (existingExperts || []).forEach((e: { name_cn: string | null; name_en: string | null }) => {
        const cn = normalize(e.name_cn);
        const en = normalize(e.name_en);
        if (cn) existingSet.add(`cn:${cn}`);
        if (en) existingSet.add(`en:${en}`);
      });

      const successList: { name_cn: string | null; name_en: string | null }[] = [];
      const failedList: { name_cn: string | null; name_en: string | null; reason: string }[] = [];
      const batchToInsert: Record<string, string | null>[] = [];
      const newSet = new Set<string>(); // 跟踪本次上传新增的

      for (const rec of records.filter((r) => r.name_cn || r.name_en)) {
        const cn = normalize(rec.name_cn);
        const en = normalize(rec.name_en);
        const reasons: string[] = [];

        // 检查与数据库已有记录重复
        if (cn && existingSet.has(`cn:${cn}`)) reasons.push('姓名已存在');
        if (en && existingSet.has(`en:${en}`)) reasons.push('英文姓名已存在');
        // 检查与本次上传的其他记录重复
        if (cn && newSet.has(`cn:${cn}`) && !existingSet.has(`cn:${cn}`)) reasons.push('与本次上传数据中的姓名重复');
        if (en && newSet.has(`en:${en}`) && !existingSet.has(`en:${en}`)) reasons.push('与本次上传数据中的英文姓名重复');

        if (reasons.length > 0) {
          failedList.push({
            name_cn: rec.name_cn || null,
            name_en: rec.name_en || null,
            reason: reasons.join('；'),
          });
        } else {
          batchToInsert.push(rec);
          successList.push({ name_cn: rec.name_cn || null, name_en: rec.name_en || null });
          if (cn) newSet.add(`cn:${cn}`);
          if (en) newSet.add(`en:${en}`);
        }
      }

      // 批量插入成功记录
      if (batchToInsert.length > 0) {
        const BATCH = 50;
        for (let i = 0; i < batchToInsert.length; i += BATCH) {
          const chunk = batchToInsert.slice(i, i + BATCH);
          const { error } = await supabase.from('experts').insert(chunk);
          if (error) throw error;
        }
        loadExperts();
      }

      // 显示结果
      setUploadResult({ success: successList, failed: failedList });
      setUploadResultTab(successList.length > 0 ? 'success' : 'failed');
      toast.success(`导入完成：成功 ${successList.length} 条，失败 ${failedList.length} 条`);
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error('导入失败: ' + (err.message || '未知错误'));
    } finally {
      setUploading(false);
    }
  };

  // 表格列定义
  const columns: ColumnDef<Expert>[] = useMemo(
    () => [
      {
        id: 'actions',
        header: '操作',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setEditingExpert(row.original); setFormDialogOpen(true); }}>
              <Pencil className="h-4 w-4 text-blue-500" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setDeletingExpert(row.original); setDeleteDialogOpen(true); }}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        ),
        size: 120,
      },
      { accessorKey: 'certificate_no', header: '证书编号', cell: ({ row }) => row.getValue('certificate_no') || '-' },
      { accessorKey: 'committee_position', header: '会内职务', cell: ({ row }) => (<Badge variant="outline" className="font-normal">{row.getValue('committee_position') || '-'}</Badge>) },
      { accessorKey: 'committee_position_en', header: 'Title_in_Committee', cell: ({ row }) => row.getValue('committee_position_en') || '-' },
      { accessorKey: 'name_cn', header: '姓名', cell: ({ row }) => row.getValue('name_cn') || '-' },
      {
        accessorKey: 'name_en',
        header: ({ column }) => (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="h-8 p-0">
            英文姓名
            {column.getIsSorted() === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : column.getIsSorted() === 'desc' ? <ArrowDown className="ml-1 h-3 w-3" /> : <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />}
          </Button>
        ),
        cell: ({ row }) => (<span className="font-medium text-slate-900">{row.getValue('name_en') || '-'}</span>),
      },
      { accessorKey: 'last_name_en', header: '姓（英）', cell: ({ row }) => row.getValue('last_name_en') || '-' },
      { accessorKey: 'first_name_en', header: '名（英）', cell: ({ row }) => row.getValue('first_name_en') || '-' },
      { accessorKey: 'salutation_en', header: '英文称谓', cell: ({ row }) => row.getValue('salutation_en') || '-' },
      { accessorKey: 'salutation_cn', header: '中文称谓', cell: ({ row }) => row.getValue('salutation_cn') || '-' },
      { accessorKey: 'gender_cn', header: '性别', cell: ({ row }) => row.getValue('gender_cn') || '-' },
      { accessorKey: 'gender_en', header: 'Sex', cell: ({ row }) => row.getValue('gender_en') || '-' },
      { accessorKey: 'birth_date', header: '出生年月', cell: ({ row }) => row.getValue('birth_date') || '-' },
      { accessorKey: 'organization', header: '单位', cell: ({ row }) => (<span className="max-w-[200px] truncate block" title={row.getValue('organization') as string}>{row.getValue('organization') || '-'}</span>) },
      { accessorKey: 'organization_en', header: '单位英文', cell: ({ row }) => row.getValue('organization_en') || '-' },
      { accessorKey: 'position', header: '职务', cell: ({ row }) => row.getValue('position') || '-' },
      { accessorKey: 'professional_title', header: '职称', cell: ({ row }) => row.getValue('professional_title') || '-' },
      { accessorKey: 'professional_title_en', header: '职称英文', cell: ({ row }) => row.getValue('professional_title_en') || '-' },
      {
        accessorKey: 'nationality_cn',
        header: ({ column }) => (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="h-8 p-0">
            国籍
            {column.getIsSorted() === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : column.getIsSorted() === 'desc' ? <ArrowDown className="ml-1 h-3 w-3" /> : <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />}
          </Button>
        ),
        cell: ({ row }) => {
          const cn = row.getValue('nationality_cn') as string;
          const en = row.getValue('nationality_en') as string;
          return <span>{cn || en || '-'}</span>;
        },
      },
      { accessorKey: 'nationality_en', header: 'Country' },
      { accessorKey: 'phone', header: '电话', cell: ({ row }) => row.getValue('phone') || '-' },
      {
        accessorKey: 'email', header: '邮箱', cell: ({ row }) => {
          const email = row.getValue('email') as string;
          return email ? (<a href={`mailto:${email}`} className="text-blue-600 hover:underline text-sm">{email}</a>) : '-';
        }
      },
      { accessorKey: 'wechat', header: '微信', cell: ({ row }) => row.getValue('wechat') || '-' },
      { accessorKey: 'join_date', header: '入会时间', cell: ({ row }) => row.getValue('join_date') || '-' },
      { accessorKey: 'payment_date', header: '缴费日期', cell: ({ row }) => row.getValue('payment_date') || '-' },
      { accessorKey: 'expiry_date', header: '到期时间', cell: ({ row }) => row.getValue('expiry_date') || '-' },
      {
        accessorKey: 'payment_status', header: '缴费情况', cell: ({ row }) => {
          const status = row.getValue('payment_status') as string;
          if (!status) return '-';
          const isPaid = status === '已缴费' || /^\d+$/.test(status);
          return (<Badge variant={isPaid ? 'default' : 'destructive'} className="font-normal">{status}</Badge>);
        }
      },
      { accessorKey: 'ica_participation', header: '参加ICA情况', cell: ({ row }) => row.getValue('ica_participation') || '-' },
      { accessorKey: 'awards', header: '获奖情况', cell: ({ row }) => row.getValue('awards') || '-' },
      { accessorKey: 'speeches', header: '演讲情况', cell: ({ row }) => row.getValue('speeches') || '-' },
      { accessorKey: 'cooperation_projects', header: '合作项目', cell: ({ row }) => row.getValue('cooperation_projects') || '-' },
      { accessorKey: 'notes', header: '备注', cell: ({ row }) => row.getValue('notes') || '-' },
    ],
    []
  );

  // 初始化表格
  const table = useReactTable({
    data: experts,
    columns,
    defaultColumn: {
      enableHiding: true,
    },
    state: {
      sorting,
      columnFilters,
      globalFilter,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 20 },
      columnVisibility: {
        // 默认隐藏这些列
        committee_position_en: false,
        last_name_en: false,
        first_name_en: false,
        salutation_en: false,
        salutation_cn: false,
        gender_en: false,
        birth_date: false,
        organization: false,
        organization_en: false,
        professional_title: false,
        professional_title_en: false,
        nationality_en: false,
        phone: false,
        email: false,
        wechat: false,
        join_date: false,
        payment_date: false,
        expiry_date: false,
        payment_status: false,
      },
    },
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-slate-500">加载专家数据中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-600" />
            专家列表
          </h1>
          <p className="text-slate-500 mt-1">
            共 {experts.length} 位专家 · 当前显示 {table.getFilteredRowModel().rows.length} 条
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button onClick={() => setUploadDialogOpen(true)} variant="outline" size="sm">
            <Upload className="mr-2 h-4 w-4" />
            上传专家信息
          </Button>
          <Button onClick={handleExportCSV} variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            导出 CSV
          </Button>
          <Button
            onClick={() => {
              setEditingExpert(null);
              setFormDialogOpen(true);
            }}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            添加专家
          </Button>
        </div>
      </div>

      {/* 工具栏 */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            {/* 搜索框 */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="搜索姓名、邮箱、单位、国籍..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* 列显示控制 */}
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium hover:bg-slate-50 transition-colors ml-auto">
                <Settings2 className="h-4 w-4" />
                显示列
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 max-h-80 overflow-y-auto">
                {(() => {
                  const headerLabels: Record<string, string> = { name_en: '英文姓名', nationality_cn: '国籍' };
                  return table.getAllColumns().filter((col) => col.getCanHide()).map((col) => (
                    <DropdownMenuCheckboxItem
                      key={col.id}
                      checked={col.getIsVisible()}
                      onCheckedChange={(value) => col.toggleVisibility(!!value)}
                    >
                      {typeof col.columnDef.header === 'string' ? col.columnDef.header : (headerLabels[col.id] || col.id)}
                    </DropdownMenuCheckboxItem>
                  ));
                })()}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        {/* 表格 */}
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="bg-slate-50">
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} style={{ width: header.getSize() }}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className="hover:bg-blue-50/50 cursor-pointer transition-colors"
                      onClick={() => {
                        setSelectedExpert(row.original);
                        setDetailDialogOpen(true);
                      }}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="py-3">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <AlertCircle className="h-8 w-8 text-slate-300" />
                        <p className="text-slate-500">没有找到匹配的专家信息</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* 分页 */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">每页显示</span>
              <Select
                value={String(pageSize)}
                onValueChange={(value) => {
                  const size = Number(value);
                  setPageSize(size);
                  table.setPageSize(size);
                }}
              >
                <SelectTrigger className="w-[80px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 20, 50, 100].map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size} 条
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-slate-500">
                共 {table.getFilteredRowModel().rows.length} 条
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-slate-600 px-2">
                {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 新增/编辑 Dialog */}
      <Dialog
        open={formDialogOpen}
        onOpenChange={(open, details) => {
          if (!open && (details.reason === 'escape-key' || details.reason === 'outside-press')) return;
          setFormDialogOpen(open);
        }}
        disablePointerDismissal
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingExpert ? '编辑专家信息' : '添加专家'}</DialogTitle>
            <DialogDescription>
              {editingExpert ? '修改专家的基本信息和联系方式' : '录入新的专家信息'}
            </DialogDescription>
          </DialogHeader>
          <ExpertForm
            expert={editingExpert}
            onSave={handleSaveExpert}
            onCancel={() => {
              setFormDialogOpen(false);
              setEditingExpert(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* 详情 Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>专家详情</DialogTitle>
            <DialogDescription>
              {selectedExpert?.name_en || selectedExpert?.name_cn}
            </DialogDescription>
          </DialogHeader>
          {selectedExpert && (
            <div className="grid grid-cols-2 gap-4 py-4">
              <DetailItem label="英文姓名" value={selectedExpert.name_en} />
              <DetailItem label="姓名" value={selectedExpert.name_cn} />
              <DetailItem label="英文称谓" value={selectedExpert.salutation_en} />
              <DetailItem label="中文称谓" value={selectedExpert.salutation_cn} />
              <DetailItem label="性别" value={selectedExpert.gender_cn} />
              <DetailItem label="出生年月" value={selectedExpert.birth_date} />
              <DetailItem label="国籍" value={`${selectedExpert.nationality_cn || ''} ${selectedExpert.nationality_en || ''}`} />
              <DetailItem label="会内职务" value={selectedExpert.committee_position} />
              <DetailItem label="职务英文" value={selectedExpert.committee_position_en} />
              <DetailItem label="证书编号" value={selectedExpert.certificate_no} />
              <DetailItem label="单位" value={selectedExpert.organization} />
              <DetailItem label="单位英文" value={selectedExpert.organization_en} />
              <DetailItem label="职务" value={selectedExpert.position} />
              <DetailItem label="职称" value={selectedExpert.professional_title} />
              <DetailItem label="电话" value={selectedExpert.phone} />
              <DetailItem label="邮箱" value={selectedExpert.email} />
              <DetailItem label="微信" value={selectedExpert.wechat} />
              <DetailItem label="入会时间" value={selectedExpert.join_date} />
              <DetailItem label="缴费日期" value={selectedExpert.payment_date} />
              <DetailItem label="到期时间" value={selectedExpert.expiry_date} />
              <DetailItem label="缴费情况" value={selectedExpert.payment_status} />
              <DetailItem label="参加ICA情况" value={selectedExpert.ica_participation} full />
              <DetailItem label="获奖情况" value={selectedExpert.awards} full />
              <DetailItem label="演讲情况" value={selectedExpert.speeches} full />
              <DetailItem label="合作项目" value={selectedExpert.cooperation_projects} full />
              <DetailItem label="备注" value={selectedExpert.notes} full />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 上传专家信息 Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={(open) => {
        if (!uploading) {
          setUploadDialogOpen(open);
          if (!open) setUploadFile(null);
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>上传专家信息</DialogTitle>
            <DialogDescription>支持 .csv / .xlsx / .xls 文件</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 space-y-1.5">
              <p className="font-medium text-slate-700">使用说明：</p>
              <ul className="list-disc list-inside space-y-1">
                <li>第一行必须是表头，必须包含 <span className="font-medium text-slate-900">姓名</span> 和 <span className="font-medium text-slate-900">英文姓名</span> 两列</li>
                <li>其他列可选（缺少的列会留空），建议使用「导出 CSV」获取标准表头: 点击「导出 CSV」→ 删掉除表头外所有行 → 填入新数据后上传</li>
              </ul>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">选择文件</label>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                disabled={uploading}
                className="block w-full text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />
              {uploadFile && (
                <p className="text-xs text-slate-500">已选择：{uploadFile.name}</p>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setUploadDialogOpen(false); setUploadFile(null); }} disabled={uploading}>取消</Button>
              <Button onClick={handleUploadFile} disabled={uploading || !uploadFile} className="bg-blue-600 hover:bg-blue-700">
                {uploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />导入中...</> : '开始导入'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 上传结果 Dialog */}
      <Dialog open={!!uploadResult} onOpenChange={(open) => {
        if (!open) { setUploadResult(null); setUploadDialogOpen(false); setUploadFile(null); }
      }}>
        <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>导入结果</DialogTitle>
            <DialogDescription>
              共 {uploadResult ? uploadResult.success.length + uploadResult.failed.length : 0} 条数据：
              <span className="text-green-600 font-medium ml-1">成功 {uploadResult?.success.length || 0} 条</span>
              {uploadResult && uploadResult.failed.length > 0 && (
                <span className="text-red-600 font-medium ml-2">失败 {uploadResult.failed.length} 条</span>
              )}
            </DialogDescription>
          </DialogHeader>

          {/* Tab 切换 */}
          <div className="flex gap-1 border-b border-slate-200">
            <button
              onClick={() => setUploadResultTab('success')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${uploadResultTab === 'success'
                ? 'border-green-500 text-green-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
            >
              <CheckCircle2 className="inline h-4 w-4 mr-1" />
              成功 ({uploadResult?.success.length || 0})
            </button>
            <button
              onClick={() => setUploadResultTab('failed')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${uploadResultTab === 'failed'
                ? 'border-red-500 text-red-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
            >
              <XCircle className="inline h-4 w-4 mr-1" />
              失败 ({uploadResult?.failed.length || 0})
            </button>
          </div>

          {/* 列表 */}
          <div className="flex-1 overflow-y-auto mt-2">
            {uploadResultTab === 'success' && (
              <div className="space-y-1">
                {uploadResult?.success.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-8">无成功记录</p>
                ) : (
                  uploadResult?.success.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-md bg-green-50 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-slate-900 truncate block">{item.name_cn || '-'}</span>
                        <span className="text-slate-500 text-xs truncate block">{item.name_en || '-'}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
            {uploadResultTab === 'failed' && (
              <div className="space-y-1">
                {uploadResult?.failed.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-8">无失败记录</p>
                ) : (
                  uploadResult?.failed.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 px-3 py-2 rounded-md bg-red-50 text-sm">
                      <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-slate-900 truncate block">{item.name_cn || '-'}</span>
                        <span className="text-slate-500 text-xs truncate block">{item.name_en || '-'}</span>
                        <span className="text-red-600 text-xs block mt-1">{item.reason}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={() => { setUploadResult(null); setUploadDialogOpen(false); setUploadFile(null); }}>关闭</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 删除确认 Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              您确定要删除专家 "{deletingExpert?.name_en || deletingExpert?.name_cn}" 吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// 详情项组件
function DetailItem({ label, value, full = false }: { label: string; value: unknown; full?: boolean }) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-sm font-medium text-slate-900">{String(value ?? '-')}</p>
    </div>
  );
}
