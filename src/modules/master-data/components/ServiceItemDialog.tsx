import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Switch } from '../../../components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import type { ServiceItem, ServiceItemFormData } from '../types';

const schema = z.object({
  name: z.string().min(1, 'Service name is required'),
  code: z.string(),
  category: z.string().min(1, 'Category is required'),
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
  open,
  onOpenChange,
  serviceItem,
  onSave,
  categories,
}: ServiceItemDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ServiceItemFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      code: '',
      category: '',
      rate: 0,
      tax_percentage: 0,
      description: '',
      is_active: true,
    },
  });

  const category = watch('category');
  const isActive = watch('is_active');

  useEffect(() => {
    if (serviceItem) {
      reset({
        name: serviceItem.name,
        code: serviceItem.code || '',
        category: serviceItem.category,
        rate: serviceItem.rate,
        tax_percentage: serviceItem.tax_percentage,
        description: serviceItem.description || '',
        is_active: serviceItem.is_active,
      });
    } else {
      reset({
        name: '',
        code: '',
        category: '',
        rate: 0,
        tax_percentage: 0,
        description: '',
        is_active: true,
      });
    }
  }, [serviceItem, reset]);

  const onSubmit = (data: ServiceItemFormData) => {
    onSave(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {serviceItem ? 'Edit Service Item' : 'Add Service Item'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">
              Service Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="e.g., General Consultation"
              className="mt-1.5"
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="code">Service Code</Label>
              <Input
                id="code"
                {...register('code')}
                placeholder="e.g., CONS001"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label>
                Category <span className="text-red-500">*</span>
              </Label>
              <Select
                value={category}
                onValueChange={(v) => setValue('category', v)}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-xs text-red-500 mt-1">{errors.category.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="rate">
                Rate (INR) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="rate"
                type="number"
                {...register('rate', { valueAsNumber: true })}
                placeholder="0"
                className="mt-1.5"
              />
              {errors.rate && (
                <p className="text-xs text-red-500 mt-1">{errors.rate.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="tax_percentage">Tax (%)</Label>
              <Input
                id="tax_percentage"
                type="number"
                step="0.01"
                {...register('tax_percentage', { valueAsNumber: true })}
                placeholder="0"
                className="mt-1.5"
              />
              {errors.tax_percentage && (
                <p className="text-xs text-red-500 mt-1">{errors.tax_percentage.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Service description or details..."
              className="mt-1.5"
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3 bg-slate-50">
            <div>
              <Label htmlFor="is_active" className="font-medium">
                Active Status
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Inactive services won't appear in billing searches
              </p>
            </div>
            <Switch
              id="is_active"
              checked={isActive}
              onCheckedChange={(checked) => setValue('is_active', checked)}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {serviceItem ? 'Update' : 'Add'} Service
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
