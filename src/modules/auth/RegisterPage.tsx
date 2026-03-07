import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, ChevronRight, Eye, EyeOff, HeartPulse, Lock, Mail, Phone, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { authService } from '../../services/auth.service';
import { setSession } from '../../store/slices/authSlice';
import { useAppDispatch } from '../../store';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../components/ui/select';
import type { UserRole } from '../../types/database';

const ROLE_OPTIONS: { value: UserRole; label: string; description: string }[] = [
  { value: 'admin', label: 'Administrator', description: 'Full hospital management access' },
  { value: 'doctor', label: 'Doctor', description: 'Clinical consultations and prescriptions' },
  { value: 'nurse', label: 'Nurse', description: 'Patient care and ward management' },
  { value: 'billing', label: 'Billing Staff', description: 'Invoice, payments, and insurance' },
  { value: 'pharmacist', label: 'Pharmacist', description: 'Dispensing and pharmacy stock' },
  { value: 'lab_technician', label: 'Lab Technician', description: 'Laboratory tests and reports' },
  { value: 'receptionist', label: 'Receptionist', description: 'Patient registration and appointments' },
];

const registerSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number').optional().or(z.literal('')),
  role: z.enum(['admin', 'doctor', 'nurse', 'billing', 'pharmacist', 'lab_technician', 'receptionist'] as [UserRole, ...UserRole[]]),
  hospital_id: z.string().optional(),
  designation: z.string().optional(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  confirm_password: z.string(),
}).refine((d) => d.password === d.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hospitals, setHospitals] = useState<{ id: string; name: string; city: string | null }[]>([]);
  const [step, setStep] = useState<1 | 2>(1);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'receptionist' },
  });

  useEffect(() => {
    authService.getHospitals().then(setHospitals).catch(() => {});
  }, []);

  const goToStep2 = async () => {
    const valid = await trigger(['full_name', 'email', 'phone', 'role']);
    if (valid) setStep(2);
  };

  const onSubmit = async (data: RegisterFormData) => {
    setError(null);
    try {
      const result = await authService.signUp({
        email: data.email,
        password: data.password,
        full_name: data.full_name,
        role: data.role,
        hospital_id: data.hospital_id || undefined,
        phone: data.phone || undefined,
        designation: data.designation || undefined,
      });
      if (result.user) {
        let profile = null;
        try {
          profile = await authService.getUserProfile(result.user.id);
        } catch {
          // profile creation may be async
        }
        dispatch(setSession({ session: result.session, user: profile }));
        navigate('/dashboard', { replace: true });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setError(msg);
      setStep(1);
    }
  };

  const selectedRole = watch('role');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 flex">
      <div className="hidden lg:flex lg:w-5/12 bg-blue-600 relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-white" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-white" />
        </div>
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
            <HeartPulse className="w-7 h-7 text-blue-600" />
          </div>
          <div>
            <h1 className="text-white font-bold text-2xl leading-none">wellnotes</h1>
            <p className="text-blue-200 text-sm font-medium">Hospital Management System</p>
          </div>
        </div>
        <div className="relative z-10 space-y-6">
          <h2 className="text-white font-bold text-3xl leading-tight">
            Join India's Leading<br />Hospital Network
          </h2>
          <ul className="space-y-4">
            {[
              'Complete 47-module HMS coverage',
              'Role-based access for all staff types',
              'NABH compliance built-in',
              'Real-time data & analytics',
              'Secure & HIPAA-aligned infrastructure',
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-blue-100">
                <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                  <ChevronRight className="w-3 h-3 text-white" />
                </div>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative z-10">
          <p className="text-blue-200 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-white font-medium underline">Sign in here</Link>
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-10 overflow-y-auto">
        <div className="w-full max-w-lg">
          <div className="lg:hidden flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <HeartPulse className="w-6 h-6 text-white" />
            </div>
            <h1 className="font-bold text-gray-900 text-xl">wellnotes HMS</h1>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Create your account</h2>
            <p className="text-gray-500 mt-1 text-sm">
              {step === 1 ? 'Step 1 of 2 — Personal & role details' : 'Step 2 of 2 — Hospital & security'}
            </p>
          </div>

          <div className="flex gap-2 mb-6">
            {[1, 2].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full flex-1 transition-all duration-300 ${
                  s <= step ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <div className="mb-5 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg flex items-start gap-2">
                <span className="mt-0.5 shrink-0">!</span>
                <span>{error}</span>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-gray-700 font-medium text-sm">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Dr. Priya Sharma"
                      {...register('full_name')}
                      className="pl-9 h-11 border-gray-300"
                      autoComplete="name"
                    />
                  </div>
                  {errors.full_name && <p className="text-red-500 text-xs">{errors.full_name.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-gray-700 font-medium text-sm">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="email"
                      placeholder="doctor@hospital.com"
                      {...register('email')}
                      className="pl-9 h-11 border-gray-300"
                      autoComplete="email"
                    />
                  </div>
                  {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-gray-700 font-medium text-sm">Mobile Number (optional)</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <span className="absolute left-9 top-1/2 -translate-y-1/2 text-gray-400 text-sm">+91</span>
                    <Input
                      type="tel"
                      placeholder="9876543210"
                      {...register('phone')}
                      className="pl-16 h-11 border-gray-300"
                      maxLength={10}
                    />
                  </div>
                  {errors.phone && <p className="text-red-500 text-xs">{errors.phone.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-gray-700 font-medium text-sm">Your Role</Label>
                  <Select
                    value={selectedRole}
                    onValueChange={(v) => setValue('role', v as UserRole)}
                  >
                    <SelectTrigger className="h-11 border-gray-300">
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div>
                            <p className="font-medium text-sm">{opt.label}</p>
                            <p className="text-xs text-gray-500">{opt.description}</p>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.role && <p className="text-red-500 text-xs">{errors.role.message}</p>}
                </div>

                <Button
                  type="button"
                  onClick={goToStep2}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold mt-2"
                >
                  Continue
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-gray-700 font-medium text-sm">Hospital (optional)</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                    <Select onValueChange={(v) => setValue('hospital_id', v)}>
                      <SelectTrigger className="h-11 border-gray-300 pl-9">
                        <SelectValue placeholder="Select your hospital" />
                      </SelectTrigger>
                      <SelectContent>
                        {hospitals.map((h) => (
                          <SelectItem key={h.id} value={h.id}>
                            {h.name}{h.city ? ` — ${h.city}` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-gray-700 font-medium text-sm">Designation (optional)</Label>
                  <Input
                    placeholder="e.g. Senior Consultant, Head Nurse"
                    {...register('designation')}
                    className="h-11 border-gray-300"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-gray-700 font-medium text-sm">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min 8 chars, 1 uppercase, 1 number"
                      {...register('password')}
                      className="pl-9 pr-10 h-11 border-gray-300"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-xs">{errors.password.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-gray-700 font-medium text-sm">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Repeat your password"
                      {...register('confirm_password')}
                      className="pl-9 pr-10 h-11 border-gray-300"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      tabIndex={-1}
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirm_password && (
                    <p className="text-red-500 text-xs">{errors.confirm_password.message}</p>
                  )}
                </div>

                <div className="flex gap-3 mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1 h-11 border-gray-300"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Creating...
                      </span>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 font-medium hover:underline">
              Sign in
            </Link>
          </p>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-center text-xs text-gray-400">
              wellnotes HMS &copy; {new Date().getFullYear()} &mdash; Designed for Indian Healthcare
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
