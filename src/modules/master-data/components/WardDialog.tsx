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
import type { Ward, WardFormData } from '../types';
import { WARD_CATEGORIES } from '../types';

const schema = z.object({
  name: z.string().min(1, 'Ward name is required'),
  ward_type: z.string().min(1, 'Ward type is required'),
  category: z.string().min(1, 'Ward category is required'),
  floor: z.string(),
  block: z.string(),
  total_beds: z.number().min(1, 'At least 1 bed required'),
  daily_rate: z.number().min(0, 'Daily rate must be non-negative'),
  description: z.string(),
  is_active: z.boolean(),
});

interface WardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ward: Ward | null;
  onSave: (data: WardFormData) => void;
  wardTypes: string[];
}

export default function WardDialog({
  open,
  onOpenChange,
  ward,
  onSave,
  wardTypes,
}: WardDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<WardFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      ward_type: '',
      floor: '',
      block: '',
      total_beds: 10,
      daily_rate: 0,
      description: '',
      is_active: true,
    },
  });

  const wardType = watch('ward_type');
  const isActive = watch('is_active');

  useEffect(() => {
    if (ward) {
      reset({
        name: ward.name,
        ward_type: ward.ward_type,
        floor: ward.floor || '',
        block: ward.block || '',
        total_beds: ward.total_beds,
        daily_rate: ward.daily_rate,
        description: ward.description || '',
        is_active: ward.is_active,
      });
    } else {
      reset({
        name: '',
        ward_type: '',
        floor: '',
        block: '',
        total_beds: 10,
        daily_rate: 0,
        description: '',
        is_active: true,
      });
    }
  }, [ward, reset]);

  const onSubmit = (data: WardFormData) => {
    onSave(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {ward ? 'Edit Ward' : 'Add Ward'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">
              Ward Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="e.g., General Ward A"
              className="mt-1.5"
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <Label>
              Ward Type <span className="text-red-500">*</span>
            </Label>
            <Select
              value={wardType}
              onValueChange={(v) => setValue('ward_type', v)}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Select ward type" />
              </SelectTrigger>
              <SelectContent>
                {wardTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.ward_type && (
              <p className="text-xs text-red-500 mt-1">{errors.ward_type.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="floor">Floor</Label>
              <Input
                id="floor"
                {...register('floor')}
                placeholder="e.g., 2nd Floor"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="block">Block</Label>
              <Input
                id="block"
                {...register('block')}
                placeholder="e.g., Block A"
                className="mt-1.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="total_beds">
                Total Beds <span className="text-red-500">*</span>
              </Label>
              <Input
                id="total_beds"
                type="number"
                {...register('total_beds', { valueAsNumber: true })}
                placeholder="10"
                className="mt-1.5"
              />
              {errors.total_beds && (
                <p className="text-xs text-red-500 mt-1">{errors.total_beds.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="daily_rate">Daily Rate (INR)</Label>
              <Input
                id="daily_rate"
                type="number"
                {...register('daily_rate', { valueAsNumber: true })}
                placeholder="0"
                className="mt-1.5"
              />
              {errors.daily_rate && (
                <p className="text-xs text-red-500 mt-1">{errors.daily_rate.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Ward description or notes..."
              className="mt-1.5"
              rows={2}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3 bg-slate-50">
            <div>
              <Label htmlFor="is_active" className="font-medium">
                Active Status
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Inactive wards won't accept new admissions
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
              {ward ? 'Update' : 'Add'} Ward
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
