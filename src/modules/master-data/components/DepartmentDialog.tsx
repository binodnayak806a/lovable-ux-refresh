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
import type { Department, DepartmentFormData } from '../types';

const schema = z.object({
  name: z.string().min(1, 'Department name is required'),
  code: z.string(),
  head_doctor_id: z.string(),
  description: z.string(),
  is_active: z.boolean(),
});

interface DepartmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department: Department | null;
  onSave: (data: DepartmentFormData) => void;
}

export default function DepartmentDialog({
  open,
  onOpenChange,
  department,
  onSave,
}: DepartmentDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<DepartmentFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      code: '',
      head_doctor_id: '',
      description: '',
      is_active: true,
    },
  });

  const isActive = watch('is_active');

  useEffect(() => {
    if (department) {
      reset({
        name: department.name,
        code: department.code || '',
        head_doctor_id: department.head_doctor_id || '',
        description: department.description || '',
        is_active: department.is_active,
      });
    } else {
      reset({
        name: '',
        code: '',
        head_doctor_id: '',
        description: '',
        is_active: true,
      });
    }
  }, [department, reset]);

  const onSubmit = (data: DepartmentFormData) => {
    onSave(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {department ? 'Edit Department' : 'Add Department'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">
              Department Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="e.g., Cardiology"
              className="mt-1.5"
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="code">Department Code</Label>
            <Input
              id="code"
              {...register('code')}
              placeholder="e.g., CARD"
              className="mt-1.5"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Short code for internal reference
            </p>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Department description..."
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
                Inactive departments won't appear in selections
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
              {department ? 'Update' : 'Add'} Department
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
