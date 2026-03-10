import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Switch } from '../../../components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../../components/ui/select';
import { Plus, X } from 'lucide-react';
import type { ServiceItem, ServiceItemFormData, WardPrice } from '../types';
import { SERVICE_GROUPS, SERVICE_TYPES, WARD_CATEGORIES } from '../types';

const schema = z.object({
  name: z.string().min(1, 'Service name is required'),
  code: z.string(),
  category: z.string().min(1, 'Category is required'),
  service_group: z.string().min(1, 'Service group is required'),
  service_type: z.enum(['OPD', 'IPD', 'BOTH']),
  rate: z.number().min(0, 'Rate must be non-negative'),
  tax_percentage: z.number().min(0).max(100, 'Tax must be between 0-100'),
  description: z.string(),
  is_active: z.boolean(),
});

interface ServiceItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceItem: ServiceItem | null;
  onSave: (data: ServiceItemFormData) => void;
  categories: string[];
}

export default function ServiceItemDialog({
  open, onOpenChange, serviceItem, onSave, categories,
}: ServiceItemDialogProps) {
  const wardCategories = WARD_CATEGORIES.map(c => ({ id: c, name: c }));
  const {
    register, handleSubmit, reset, setValue, watch,
    formState: { errors, isSubmitting },
  } = useForm<Omit<ServiceItemFormData, 'ward_prices'>>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '', code: '', category: '', service_group: '', service_type: 'OPD',
      rate: 0, tax_percentage: 0, description: '', is_active: true,
    },
  });

  const [wardPrices, setWardPrices] = useState<WardPrice[]>([]);
  const category = watch('category');
  const serviceGroup = watch('service_group');
  const serviceType = watch('service_type');
  const isActive = watch('is_active');

  useEffect(() => {
    if (serviceItem) {
      reset({
        name: serviceItem.name,
        code: serviceItem.code || '',
        category: serviceItem.category,
        service_group: serviceItem.service_group || '',
        service_type: serviceItem.service_type || 'OPD',
        rate: serviceItem.rate,
        tax_percentage: serviceItem.tax_percentage,
        description: serviceItem.description || '',
        is_active: serviceItem.is_active,
      });
      setWardPrices(serviceItem.ward_prices || []);
    } else {
      reset({
        name: '', code: '', category: '', service_group: '', service_type: 'OPD',
        rate: 0, tax_percentage: 0, description: '', is_active: true,
      });
      setWardPrices([]);
    }
  }, [serviceItem, reset]);

  const addWardPrice = () => {
    const usedIds = wardPrices.map(wp => wp.ward_id);
    const next = wardCategories.find(w => !usedIds.includes(w.id));
    if (next) {
      setWardPrices([...wardPrices, { ward_id: next.id, ward_name: next.name, price: 0 }]);
    }
  };

  const removeWardPrice = (idx: number) => {
    setWardPrices(wardPrices.filter((_, i) => i !== idx));
  };

  const updateWardPrice = (idx: number, field: 'ward_id' | 'price', value: string | number) => {
    setWardPrices(prev => prev.map((wp, i) => {
      if (i !== idx) return wp;
      if (field === 'ward_id') {
        const ward = wards.find(w => w.id === value);
        return { ...wp, ward_id: value as string, ward_name: ward?.name || '' };
      }
      return { ...wp, price: Number(value) };
    }));
  };

  const onSubmit = (data: Omit<ServiceItemFormData, 'ward_prices'>) => {
    onSave({
      ...data,
      ward_prices: (serviceType === 'IPD' || serviceType === 'BOTH') ? wardPrices : [],
    });
  };

  const showWardPricing = serviceType === 'IPD' || serviceType === 'BOTH';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{serviceItem ? 'Edit Service Item' : 'Add Service Item'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Service Name <span className="text-red-500">*</span></Label>
            <Input id="name" {...register('name')} placeholder="e.g., General Consultation" className="mt-1.5" />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="code">Service Code</Label>
              <Input id="code" {...register('code')} placeholder="e.g., CONS001" className="mt-1.5" />
            </div>
            <div>
              <Label>Category <span className="text-red-500">*</span></Label>
              <Select value={category} onValueChange={(v) => setValue('category', v)}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Service Group <span className="text-red-500">*</span></Label>
              <Select value={serviceGroup} onValueChange={(v) => setValue('service_group', v)}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select group" /></SelectTrigger>
                <SelectContent>
                  {SERVICE_GROUPS.map((g) => (<SelectItem key={g} value={g}>{g}</SelectItem>))}
                </SelectContent>
              </Select>
              {errors.service_group && <p className="text-xs text-red-500 mt-1">{errors.service_group.message}</p>}
            </div>
            <div>
              <Label>Service Type <span className="text-red-500">*</span></Label>
              <Select value={serviceType} onValueChange={(v) => setValue('service_type', v as 'OPD' | 'IPD' | 'BOTH')}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {SERVICE_TYPES.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="rate">Base Rate (INR) <span className="text-red-500">*</span></Label>
              <Input id="rate" type="number" {...register('rate', { valueAsNumber: true })} placeholder="0" className="mt-1.5" />
              {errors.rate && <p className="text-xs text-red-500 mt-1">{errors.rate.message}</p>}
            </div>
            <div>
              <Label htmlFor="tax_percentage">Tax (%)</Label>
              <Input id="tax_percentage" type="number" step="0.01" {...register('tax_percentage', { valueAsNumber: true })} placeholder="0" className="mt-1.5" />
            </div>
          </div>

          {/* Ward-wise pricing for IPD/BOTH */}
          {showWardPricing && (
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-blue-800">Ward-wise Pricing</p>
                  <p className="text-xs text-blue-600">Set different prices for each ward type</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addWardPrice} disabled={wardPrices.length >= wards.length} className="h-7 text-xs gap-1 border-blue-200">
                  <Plus className="w-3 h-3" /> Add Ward
                </Button>
              </div>
              {wardPrices.length === 0 && (
                <p className="text-xs text-blue-500 italic">No ward-specific prices set. Base rate will be used.</p>
              )}
              {wardPrices.map((wp, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Select value={wp.ward_id} onValueChange={(v) => updateWardPrice(idx, 'ward_id', v)}>
                    <SelectTrigger className="flex-1 h-9 text-sm bg-white"><SelectValue placeholder="Select ward" /></SelectTrigger>
                    <SelectContent>
                      {wards.filter(w => !wardPrices.some((p, i) => i !== idx && p.ward_id === w.id)).map(w => (
                        <SelectItem key={w.id} value={w.id}>{w.name} ({w.ward_type})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-500">₹</span>
                    <Input type="number" value={wp.price} onChange={(e) => updateWardPrice(idx, 'price', e.target.value)} className="w-24 h-9 text-sm" />
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeWardPrice(idx)} className="h-8 w-8 p-0 text-red-400 hover:text-red-600">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...register('description')} placeholder="Service description…" className="mt-1.5" rows={2} />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3 bg-slate-50">
            <div>
              <Label htmlFor="is_active" className="font-medium">Active Status</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Inactive services won't appear in billing</p>
            </div>
            <Switch id="is_active" checked={isActive} onCheckedChange={(checked) => setValue('is_active', checked)} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>{serviceItem ? 'Update' : 'Add'} Service</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
