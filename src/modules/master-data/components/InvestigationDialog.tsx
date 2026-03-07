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
import { Switch } from '../../../components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import type { Investigation, InvestigationFormData } from '../types';

const schema = z.object({
  name: z.string().min(1, 'Test name is required'),
  code: z.string(),
  category: z.string().min(1, 'Category is required'),
  sample_type: z.string(),
  normal_range_male: z.string(),
  normal_range_female: z.string(),
  unit: z.string(),
  price: z.number().min(0, 'Price must be non-negative'),
  turnaround_time: z.string(),
  is_active: z.boolean(),
});

interface InvestigationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investigation: Investigation | null;
  onSave: (data: InvestigationFormData) => void;
  categories: string[];
}

const SAMPLE_TYPES = [
  'Blood',
  'Serum',
  'Plasma',
  'Urine',
  'Stool',
  'Sputum',
  'CSF',
  'Swab',
  'Tissue',
  'Fluid',
  'None (Imaging)',
];

export default function InvestigationDialog({
  open,
  onOpenChange,
  investigation,
  onSave,
  categories,
}: InvestigationDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<InvestigationFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      code: '',
      category: '',
      sample_type: '',
      normal_range_male: '',
      normal_range_female: '',
      unit: '',
      price: 0,
      turnaround_time: '',
      is_active: true,
    },
  });

  const category = watch('category');
  const sampleType = watch('sample_type');
  const isActive = watch('is_active');

  useEffect(() => {
    if (investigation) {
      reset({
        name: investigation.name,
        code: investigation.code || '',
        category: investigation.category,
        sample_type: investigation.sample_type || '',
        normal_range_male: investigation.normal_range_male || '',
        normal_range_female: investigation.normal_range_female || '',
        unit: investigation.unit || '',
        price: investigation.price,
        turnaround_time: investigation.turnaround_time || '',
        is_active: investigation.is_active,
      });
    } else {
      reset({
        name: '',
        code: '',
        category: '',
        sample_type: '',
        normal_range_male: '',
        normal_range_female: '',
        unit: '',
        price: 0,
        turnaround_time: '',
        is_active: true,
      });
    }
  }, [investigation, reset]);

  const onSubmit = (data: InvestigationFormData) => {
    onSave(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {investigation ? 'Edit Investigation' : 'Add Investigation'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="name">
                Test Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="e.g., Complete Blood Count"
                className="mt-1.5"
              />
              {errors.name && (
                <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="code">Test Code</Label>
              <Input
                id="code"
                {...register('code')}
                placeholder="e.g., CBC001"
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

            <div>
              <Label>Sample Type</Label>
              <Select
                value={sampleType}
                onValueChange={(v) => setValue('sample_type', v)}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select sample" />
                </SelectTrigger>
                <SelectContent>
                  {SAMPLE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="unit">Unit</Label>
              <Input
                id="unit"
                {...register('unit')}
                placeholder="e.g., mg/dL"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="normal_range_male">Normal Range (Male)</Label>
              <Input
                id="normal_range_male"
                {...register('normal_range_male')}
                placeholder="e.g., 4.5-5.5"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="normal_range_female">Normal Range (Female)</Label>
              <Input
                id="normal_range_female"
                {...register('normal_range_female')}
                placeholder="e.g., 4.0-5.0"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="price">
                Price (INR) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="price"
                type="number"
                {...register('price', { valueAsNumber: true })}
                placeholder="0"
                className="mt-1.5"
              />
              {errors.price && (
                <p className="text-xs text-red-500 mt-1">{errors.price.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="turnaround_time">Turnaround Time</Label>
              <Input
                id="turnaround_time"
                {...register('turnaround_time')}
                placeholder="e.g., 4 hours"
                className="mt-1.5"
              />
            </div>

            <div className="col-span-2 flex items-center justify-between rounded-lg border p-3 bg-slate-50">
              <div>
                <Label htmlFor="is_active" className="font-medium">
                  Active Status
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Inactive tests won't appear in lab order searches
                </p>
              </div>
              <Switch
                id="is_active"
                checked={isActive}
                onCheckedChange={(checked) => setValue('is_active', checked)}
              />
            </div>
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
              {investigation ? 'Update' : 'Add'} Investigation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
