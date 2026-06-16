'use client';

import { useState } from 'react';
import { Expert, ExpertFormData } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Loader2, Save, X } from 'lucide-react';

interface ExpertFormProps {
  expert: Expert | null;
  onSave: (data: Partial<Expert>) => void;
  onCancel: () => void;
}

const emptyForm: ExpertFormData = {
  serial_number: null,
  committee: null,
  committee_en: null,
  term_dates: null,
  term_dates_en: null,
  certificate_date: null,
  term_time: null,
  session_number: null,
  session_number_en: null,
  certificate_no: null,
  committee_position: null,
  committee_position_en: null,
  name_cn: null,
  name_en: null,
  last_name_en: null,
  first_name_en: null,
  salutation_en: null,
  salutation_cn: null,
  gender_cn: null,
  gender_en: null,
  birth_date: null,
  organization: null,
  organization_en: null,
  position: null,
  professional_title: null,
  professional_title_en: null,
  nationality_cn: null,
  nationality_en: null,
  photo_url: null,
  phone: null,
  email: null,
  qq: null,
  wechat: null,
  join_date: null,
  payment_date: null,
  expiry_date: null,
  payment_status: null,
  payment_date_2: null,
  expiry_date_2: null,
  payment_status_2: null,
  payment_date_3: null,
  expiry_date_3: null,
  payment_status_3: null,
  notes: null,
};

export function ExpertForm({ expert, onSave, onCancel }: ExpertFormProps) {
  const [formData, setFormData] = useState<ExpertFormData>(
    expert ? { ...expert } : { ...emptyForm }
  );
  const [saving, setSaving] = useState(false);

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
            <FormField label="序号" type="number">
              <Input
                type="number"
                value={formData.serial_number ?? ''}
                onChange={(e) => updateField('serial_number', e.target.value ? Number(e.target.value) : null)}
              />
            </FormField>
            <FormField label="性别">
              <Input
                value={formData.gender_cn ?? ''}
                onChange={(e) => updateField('gender_cn', e.target.value)}
                placeholder="男/女"
              />
            </FormField>
            <FormField label="性别 (英文)">
              <Input
                value={formData.gender_en ?? ''}
                onChange={(e) => updateField('gender_en', e.target.value)}
                placeholder="male/female"
              />
            </FormField>
            <FormField label="出生年月">
              <Input
                value={formData.birth_date ?? ''}
                onChange={(e) => updateField('birth_date', e.target.value)}
                placeholder="如: 1980-01"
              />
            </FormField>
            <FormField label="国籍">
              <Input
                value={formData.nationality_cn ?? ''}
                onChange={(e) => updateField('nationality_cn', e.target.value)}
                placeholder="如: 匈牙利"
              />
            </FormField>
            <FormField label="Country">
              <Input
                value={formData.nationality_en ?? ''}
                onChange={(e) => updateField('nationality_en', e.target.value)}
                placeholder="如: Hungary"
              />
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
            <FormField label="专业委员会">
              <Input
                value={formData.committee ?? ''}
                onChange={(e) => updateField('committee', e.target.value)}
              />
            </FormField>
            <FormField label="专委会英文">
              <Input
                value={formData.committee_en ?? ''}
                onChange={(e) => updateField('committee_en', e.target.value)}
              />
            </FormField>
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
            <FormField label="证书日期">
              <Input
                type="date"
                value={formData.certificate_date ?? ''}
                onChange={(e) => updateField('certificate_date', e.target.value)}
              />
            </FormField>
            <FormField label="届数">
              <Input
                value={formData.session_number ?? ''}
                onChange={(e) => updateField('session_number', e.target.value)}
              />
            </FormField>
            <FormField label="届数英文">
              <Input
                value={formData.session_number_en ?? ''}
                onChange={(e) => updateField('session_number_en', e.target.value)}
              />
            </FormField>
            <FormField label="起止日期">
              <Input
                value={formData.term_dates ?? ''}
                onChange={(e) => updateField('term_dates', e.target.value)}
              />
            </FormField>
            <FormField label="起止日期英文">
              <Input
                value={formData.term_dates_en ?? ''}
                onChange={(e) => updateField('term_dates_en', e.target.value)}
              />
            </FormField>
            <FormField label="时间">
              <Input
                value={formData.term_time ?? ''}
                onChange={(e) => updateField('term_time', e.target.value)}
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
            <FormField label="QQ">
              <Input
                value={formData.qq ?? ''}
                onChange={(e) => updateField('qq', e.target.value)}
              />
            </FormField>
            <FormField label="微信">
              <Input
                value={formData.wechat ?? ''}
                onChange={(e) => updateField('wechat', e.target.value)}
              />
            </FormField>
            <FormField label="照片链接">
              <Input
                value={formData.photo_url ?? ''}
                onChange={(e) => updateField('photo_url', e.target.value)}
                placeholder="https://..."
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
            <h3 className="text-sm font-medium text-slate-700">第一届</h3>
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
            <h3 className="text-sm font-medium text-slate-700">第二届</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField label="缴费日期">
                <Input
                  type="date"
                  value={formData.payment_date_2 ?? ''}
                  onChange={(e) => updateField('payment_date_2', e.target.value)}
                />
              </FormField>
              <FormField label="到期时间">
                <Input
                  type="date"
                  value={formData.expiry_date_2 ?? ''}
                  onChange={(e) => updateField('expiry_date_2', e.target.value)}
                />
              </FormField>
              <FormField label="缴费情况">
                <Input
                  value={formData.payment_status_2 ?? ''}
                  onChange={(e) => updateField('payment_status_2', e.target.value)}
                />
              </FormField>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-slate-700">第三届</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField label="缴费日期">
                <Input
                  type="date"
                  value={formData.payment_date_3 ?? ''}
                  onChange={(e) => updateField('payment_date_3', e.target.value)}
                />
              </FormField>
              <FormField label="到期时间">
                <Input
                  type="date"
                  value={formData.expiry_date_3 ?? ''}
                  onChange={(e) => updateField('expiry_date_3', e.target.value)}
                />
              </FormField>
              <FormField label="缴费情况">
                <Input
                  value={formData.payment_status_3 ?? ''}
                  onChange={(e) => updateField('payment_status_3', e.target.value)}
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
