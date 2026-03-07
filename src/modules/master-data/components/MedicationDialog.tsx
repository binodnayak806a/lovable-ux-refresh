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
import type { Medication, MedicationFormData } from '../types';

const schema = z.object({
  generic_name: z.string().min(1, 'Generic name is required'),
  brand_name: z.string(),
  category: z.string().min(1, 'Category is required'),
  dosage_form: z.string().min(1, 'Dosage form is required'),
  strength: z.string(),
  unit: z.string(),
  manufacturer: z.string(),
  is_active: z.boolean(),
});

interface MedicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medication: Medication | null;
  onSave: (data: MedicationFormData) => void;
  categories: string[];
  dosageForms: string[];
}

export default function MedicationDialog({
  open,
  onOpenChange,
  medication,
  onSave,
  categories,
  dosageForms,
}: MedicationDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<MedicationFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      generic_name: '',
      brand_name: '',
      category: '',
      dosage_form: '',
      strength: '',
      unit: 'mg',
      manufacturer: '',
      is_active: true,
    },
  });

  const category = watch('category');
  const dosageForm = watch('dosage_form');
  const isActive = watch('is_active');

  useEffect(() => {
    if (medication) {
      reset({
        generic_name: medication.generic_name,
        brand_name: medication.brand_name || '',
        category: medication.category,
        dosage_form: medication.dosage_form,
        strength: medication.strength || '',
        unit: medication.unit || 'mg',
        manufacturer: medication.manufacturer || '',
        is_active: medication.is_active,
      });
    } else {
      reset({
        generic_name: '',
        brand_name: '',
        category: '',
        dosage_form: '',
        strength: '',
        unit: 'mg',
        manufacturer: '',
        is_active: true,
      });
    }
  }, [medication, reset]);

  const onSubmit = (data: MedicationFormData) => {
    onSave(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {medication ? 'Edit Medication' : 'Add Medication'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="generic_name">
                Generic Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="generic_name"
                {...register('generic_name')}
                placeholder="e.g., Paracetamol"
                className="mt-1.5"
              />
              {errors.generic_name && (
                <p className="text-xs text-red-500 mt-1">{errors.generic_name.message}</p>
              )}
            </div>

            <div className="col-span-2">
              <Label htmlFor="brand_name">Brand Name</Label>
              <Input
                id="brand_name"
                {...register('brand_name')}
                placeholder="e.g., Crocin"
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
              <Label>
                Dosage Form <span className="text-red-500">*</span>
              </Label>
              <Select
                value={dosageForm}
                onValueChange={(v) => setValue('dosage_form', v)}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select form" />
                </SelectTrigger>
                <SelectContent>
                  {dosageForms.map((form) => (
                    <SelectItem key={form} value={form}>
                      {form}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.dosage_form && (
                <p className="text-xs text-red-500 mt-1">{errors.dosage_form.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="strength">Strength</Label>
              <Input
                id="strength"
                {...register('strength')}
                placeholder="e.g., 500"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="unit">Unit</Label>
              <Select
                value={watch('unit')}
                onValueChange={(v) => setValue('unit', v)}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mg">mg</SelectItem>
                  <SelectItem value="g">g</SelectItem>
                  <SelectItem value="ml">ml</SelectItem>
                  <SelectItem value="mcg">mcg</SelectItem>
                  <SelectItem value="IU">IU</SelectItem>
                  <SelectItem value="%">%</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <Label htmlFor="manufacturer">Manufacturer</Label>
              <Input
                id="manufacturer"
                {...register('manufacturer')}
                placeholder="e.g., Sun Pharma"
                className="mt-1.5"
              />
            </div>

            <div className="col-span-2 flex items-center justify-between rounded-lg border p-3 bg-slate-50">
              <div>
                <Label htmlFor="is_active" className="font-medium">
                  Active Status
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Inactive medications won't appear in prescription searches
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
              {medication ? 'Update' : 'Add'} Medication
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
