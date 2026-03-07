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
import type { Diagnosis, DiagnosisFormData } from '../types';

const schema = z.object({
  name: z.string().min(1, 'Diagnosis name is required'),
  icd_code: z.string(),
  category: z.string(),
  description: z.string(),
  is_active: z.boolean(),
});

interface DiagnosisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  diagnosis: Diagnosis | null;
  onSave: (data: DiagnosisFormData) => void;
  categories: string[];
}

export default function DiagnosisDialog({
  open,
  onOpenChange,
  diagnosis,
  onSave,
  categories,
}: DiagnosisDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<DiagnosisFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      icd_code: '',
      category: '',
      description: '',
      is_active: true,
    },
  });

  const category = watch('category');
  const isActive = watch('is_active');

  useEffect(() => {
    if (diagnosis) {
      reset({
        name: diagnosis.name,
        icd_code: diagnosis.icd_code || '',
        category: diagnosis.category || '',
        description: diagnosis.description || '',
        is_active: diagnosis.is_active,
      });
    } else {
      reset({
        name: '',
        icd_code: '',
        category: '',
        description: '',
        is_active: true,
      });
    }
  }, [diagnosis, reset]);

  const onSubmit = (data: DiagnosisFormData) => {
    onSave(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {diagnosis ? 'Edit Diagnosis' : 'Add Diagnosis'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">
              Diagnosis Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="e.g., Type 2 Diabetes Mellitus"
              className="mt-1.5"
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="icd_code">ICD Code</Label>
            <Input
              id="icd_code"
              {...register('icd_code')}
              placeholder="e.g., E11.9"
              className="mt-1.5 font-mono"
            />
            <p className="text-xs text-muted-foreground mt-1">
              International Classification of Diseases code (ICD-10)
            </p>
          </div>

          <div>
            <Label>Category</Label>
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
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Clinical description or notes..."
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
                Inactive diagnoses won't appear in consultation searches
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
              {diagnosis ? 'Update' : 'Add'} Diagnosis
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
