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
  Eye,
  Loader2,
  AlertCircle,
  Users,
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
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [pageSize, setPageSize] = useState(20);

  // Dialog 状态
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingExpert, setEditingExpert] = useState<Expert | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingExpert, setDeletingExpert] = useState<Expert | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);

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
        .order('serial_number', { ascending: true });

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
      '序号', '专业委员会', '专委会英文', '证书编号', '会内职务', '职务英文',
      '姓名', '英文姓名', '姓（英）', '名（英）', '英文称谓', '中文称谓',
      '性别', '出生年月', '单位', '单位英文', '职务', '职称', '职称英文',
      '国籍', 'Country', '电话', '邮箱', 'QQ', '微信',
      '入会时间', '缴费日期', '到期时间', '缴费情况', '备注'
    ];

    const rows = experts.map((e) => [
      e.serial_number, e.committee, e.committee_en, e.certificate_no,
      e.committee_position, e.committee_position_en, e.name_cn, e.name_en,
      e.last_name_en, e.first_name_en, e.salutation_en, e.salutation_cn,
      e.gender_cn, e.birth_date, e.organization, e.organization_en,
      e.position, e.professional_title, e.professional_title_en,
      e.nationality_cn, e.nationality_en, e.phone, e.email, e.qq, e.wechat,
      e.join_date, e.payment_date, e.expiry_date, e.payment_status, e.notes
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

  // 表格列定义
  const columns: ColumnDef<Expert>[] = useMemo(
    () => [
      {
        accessorKey: 'serial_number',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 p-0"
          >
            序号
            {column.getIsSorted() === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : column.getIsSorted() === 'desc' ? <ArrowDown className="ml-1 h-3 w-3" /> : <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />}
          </Button>
        ),
        cell: ({ row }) => <span className="font-mono text-xs">{row.getValue('serial_number')}</span>,
        size: 60,
      },
      {
        accessorKey: 'name_en',
        header: ({ column }) => (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="h-8 p-0">
            英文姓名
            {column.getIsSorted() === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : column.getIsSorted() === 'desc' ? <ArrowDown className="ml-1 h-3 w-3" /> : <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />}
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-medium text-slate-900">{row.getValue('name_en') || '-'}</span>
        ),
      },
      {
        accessorKey: 'name_cn',
        header: '姓名',
        cell: ({ row }) => row.getValue('name_cn') || '-',
      },
      {
        accessorKey: 'committee_position',
        header: '会内职务',
        cell: ({ row }) => (
          <Badge variant="outline" className="font-normal">
            {row.getValue('committee_position') || '-'}
          </Badge>
        ),
      },
      {
        accessorKey: 'organization',
        header: '单位',
        cell: ({ row }) => (
          <span className="max-w-[200px] truncate block" title={row.getValue('organization') as string}>
            {row.getValue('organization') || '-'}
          </span>
        ),
      },
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
      {
        accessorKey: 'nationality_en',
        header: 'Country',
        enableHiding: true,
      },
      {
        accessorKey: 'email',
        header: '邮箱',
        cell: ({ row }) => {
          const email = row.getValue('email') as string;
          return email ? (
            <a href={`mailto:${email}`} className="text-blue-600 hover:underline text-sm">
              {email}
            </a>
          ) : '-';
        },
      },
      {
        accessorKey: 'phone',
        header: '电话',
        cell: ({ row }) => row.getValue('phone') || '-',
      },
      {
        accessorKey: 'payment_status',
        header: '缴费情况',
        cell: ({ row }) => {
          const status = row.getValue('payment_status') as string;
          if (!status) return '-';
          const isPaid = status === '已缴费' || status === '2000' || /^\d+$/.test(status);
          return (
            <Badge variant={isPaid ? 'default' : 'destructive'} className="font-normal">
              {status}
            </Badge>
          );
        },
      },
      {
        id: 'actions',
        header: '操作',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedExpert(row.original);
                setDetailDialogOpen(true);
              }}
            >
              <Eye className="h-4 w-4 text-slate-500" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                setEditingExpert(row.original);
                setFormDialogOpen(true);
              }}
            >
              <Pencil className="h-4 w-4 text-blue-500" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                setDeletingExpert(row.original);
                setDeleteDialogOpen(true);
              }}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        ),
        size: 120,
      },
    ],
    []
  );

  // 初始化表格
  const table = useReactTable({
    data: experts,
    columns,
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
        nationality_en: false,
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
              <DropdownMenuTrigger>
                <Button variant="outline" size="sm" className="ml-auto">
                  <Settings2 className="mr-2 h-4 w-4" />
                  显示列
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {table.getAllColumns().filter((col) => col.getCanHide()).map((col) => (
                  <DropdownMenuCheckboxItem
                    key={col.id}
                    checked={col.getIsVisible()}
                    onCheckedChange={(value) => col.toggleVisibility(!!value)}
                  >
                    {col.columnDef.header as string || col.id}
                  </DropdownMenuCheckboxItem>
                ))}
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
      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
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
              <DetailItem label="序号" value={selectedExpert.serial_number} />
              <DetailItem label="英文姓名" value={selectedExpert.name_en} />
              <DetailItem label="姓名" value={selectedExpert.name_cn} />
              <DetailItem label="英文称谓" value={selectedExpert.salutation_en} />
              <DetailItem label="中文称谓" value={selectedExpert.salutation_cn} />
              <DetailItem label="性别" value={selectedExpert.gender_cn} />
              <DetailItem label="出生年月" value={selectedExpert.birth_date} />
              <DetailItem label="国籍" value={`${selectedExpert.nationality_cn || ''} ${selectedExpert.nationality_en || ''}`} />
              <DetailItem label="会内职务" value={selectedExpert.committee_position} />
              <DetailItem label="职务英文" value={selectedExpert.committee_position_en} />
              <DetailItem label="专业委员会" value={selectedExpert.committee} />
              <DetailItem label="证书编号" value={selectedExpert.certificate_no} />
              <DetailItem label="单位" value={selectedExpert.organization} />
              <DetailItem label="单位英文" value={selectedExpert.organization_en} />
              <DetailItem label="职务" value={selectedExpert.position} />
              <DetailItem label="职称" value={selectedExpert.professional_title} />
              <DetailItem label="电话" value={selectedExpert.phone} />
              <DetailItem label="邮箱" value={selectedExpert.email} />
              <DetailItem label="QQ" value={selectedExpert.qq} />
              <DetailItem label="微信" value={selectedExpert.wechat} />
              <DetailItem label="入会时间" value={selectedExpert.join_date} />
              <DetailItem label="缴费日期" value={selectedExpert.payment_date} />
              <DetailItem label="到期时间" value={selectedExpert.expiry_date} />
              <DetailItem label="缴费情况" value={selectedExpert.payment_status} />
              <DetailItem label="备注" value={selectedExpert.notes} full />
            </div>
          )}
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
