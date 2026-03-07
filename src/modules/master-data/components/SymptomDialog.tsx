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
import type { Symptom, SymptomFormData } from '../types';

const schema = z.object({
  name: z.string().min(1, 'Symptom name is required'),
  category: z.string(),
  description: z.string(),
  is_active: z.boolean(),
});

interface SymptomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  symptom: Symptom | null;
  onSave: (data: SymptomFormData) => void;
  categories: string[];
}

export default function SymptomDialog({
  open,
  onOpenChange,
  symptom,
  onSave,
  categories,
}: SymptomDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SymptomFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      category: '',
      description: '',
      is_active: true,
    },
  });

  const category = watch('category');
  const isActive = watch('is_active');

  useEffect(() => {
    if (symptom) {
      reset({
        name: symptom.name,
        category: symptom.category || '',
        description: symptom.description || '',
        is_active: symptom.is_active,
      });
    } else {
      reset({
        name: '',
        category: '',
        description: '',
        is_active: true,
      });
    }
  }, [symptom, reset]);

  const onSubmit = (data: SymptomFormData) => {
    onSave(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {symptom ? 'Edit Symptom' : 'Add Symptom'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">
              Symptom Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="e.g., Fever"
              className="mt-1.5"
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
            )}
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
              placeholder="Additional details about the symptom..."
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
                Inactive symptoms won't appear in consultation searches
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
              {symptom ? 'Update' : 'Add'} Symptom
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
