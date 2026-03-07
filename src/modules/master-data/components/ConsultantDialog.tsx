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
import type { Consultant, ConsultantFormData } from '../types';

const schema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string(),
  specialty: z.string().min(1, 'Specialty is required'),
  department: z.string(),
  qualification: z.string(),
  registration_number: z.string(),
  phone: z.string(),
  email: z.string().email('Invalid email').or(z.literal('')),
  consultation_fee: z.number().min(0, 'Fee must be non-negative'),
  is_active: z.boolean(),
});

interface ConsultantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  consultant: Consultant | null;
  onSave: (data: ConsultantFormData) => void;
  specialties: string[];
}

export default function ConsultantDialog({
  open,
  onOpenChange,
  consultant,
  onSave,
  specialties,
}: ConsultantDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ConsultantFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      first_name: '',
      last_name: '',
      specialty: '',
      department: '',
      qualification: '',
      registration_number: '',
      phone: '',
      email: '',
      consultation_fee: 0,
      is_active: true,
    },
  });

  const specialty = watch('specialty');
  const isActive = watch('is_active');

  useEffect(() => {
    if (consultant) {
      reset({
        first_name: consultant.first_name,
        last_name: consultant.last_name,
        specialty: consultant.specialty,
        department: consultant.department || '',
        qualification: consultant.qualification || '',
        registration_number: consultant.registration_number || '',
        phone: consultant.phone || '',
        email: consultant.email || '',
        consultation_fee: consultant.consultation_fee,
        is_active: consultant.is_active,
      });
    } else {
      reset({
        first_name: '',
        last_name: '',
        specialty: '',
        department: '',
        qualification: '',
        registration_number: '',
        phone: '',
        email: '',
        consultation_fee: 0,
        is_active: true,
      });
    }
  }, [consultant, reset]);

  const onSubmit = (data: ConsultantFormData) => {
    onSave(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {consultant ? 'Edit Consultant' : 'Add Consultant'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">
                First Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="first_name"
                {...register('first_name')}
                placeholder="e.g., Rajesh"
                className="mt-1.5"
              />
              {errors.first_name && (
                <p className="text-xs text-red-500 mt-1">{errors.first_name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                {...register('last_name')}
                placeholder="e.g., Sharma"
                className="mt-1.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>
                Specialty <span className="text-red-500">*</span>
              </Label>
              <Select
                value={specialty}
                onValueChange={(v) => setValue('specialty', v)}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select specialty" />
                </SelectTrigger>
                <SelectContent>
                  {specialties.map((spec) => (
                    <SelectItem key={spec} value={spec}>
                      {spec}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.specialty && (
                <p className="text-xs text-red-500 mt-1">{errors.specialty.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                {...register('department')}
                placeholder="e.g., Cardiology"
                className="mt-1.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="qualification">Qualification</Label>
              <Input
                id="qualification"
                {...register('qualification')}
                placeholder="e.g., MBBS, MD"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="registration_number">Registration No.</Label>
              <Input
                id="registration_number"
                {...register('registration_number')}
                placeholder="e.g., MCI-12345"
                className="mt-1.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                {...register('phone')}
                placeholder="e.g., +91 98765 43210"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="e.g., doctor@hospital.com"
                className="mt-1.5"
              />
              {errors.email && (
                <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="consultation_fee">Consultation Fee (INR)</Label>
            <Input
              id="consultation_fee"
              type="number"
              {...register('consultation_fee', { valueAsNumber: true })}
              placeholder="0"
              className="mt-1.5"
            />
            {errors.consultation_fee && (
              <p className="text-xs text-red-500 mt-1">{errors.consultation_fee.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3 bg-slate-50">
            <div>
              <Label htmlFor="is_active" className="font-medium">
                Active Status
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Inactive consultants won't appear in appointment bookings
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
              {consultant ? 'Update' : 'Add'} Consultant
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
