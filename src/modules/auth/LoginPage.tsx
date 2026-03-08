import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Eye, EyeOff, HeartPulse, Lock, Mail, RefreshCw, Stethoscope, Shield, ClipboardList, Pill, FlaskConical, BedDouble, CreditCard, UserCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { authService } from '../../services/auth.service';
import { clearError, setSession } from '../../store/slices/authSlice';
import { useAppDispatch, useAppSelector } from '../../store';
import { ROLE_DEFAULT_ROUTES } from '../../hooks/usePermissions';
import type { UserRole } from '../../types/user.types';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Checkbox } from '../../components/ui/checkbox';
import { DEMO_HOSPITAL_ID } from '../../hooks/useHospitalId';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

const ERROR_MESSAGES: Record<string, { title: string; detail: string }> = {
  invalid_credentials: {
    title: 'Incorrect email or password',
    detail: 'Please check your credentials and try again.',
  },
  email_not_confirmed: {
    title: 'Email not verified',
    detail: 'Please check your inbox and verify your email before signing in.',
  },
  too_many_requests: {
    title: 'Too many attempts',
    detail: 'Your account has been temporarily locked. Please try again in a few minutes.',
  },
  network_error: {
    title: 'Connection error',
    detail: 'Unable to reach the server. Check your internet connection.',
  },
  unknown: {
    title: 'Sign in failed',
    detail: 'An unexpected error occurred. Please try again.',
  },
};

interface DemoRole {
  role: UserRole;
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  description: string;
}

const DEMO_ROLES: DemoRole[] = [
  { role: 'superadmin', label: 'Super Admin', icon: Shield, color: 'text-amber-600', bgColor: 'bg-amber-50 border-amber-200 hover:bg-amber-100', description: 'Full system access' },
  { role: 'doctor', label: 'Doctor', icon: Stethoscope, color: 'text-emerald-600', bgColor: 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100', description: 'Patients, OPD, IPD, Lab' },
  { role: 'receptionist', label: 'Receptionist', icon: ClipboardList, color: 'text-blue-600', bgColor: 'bg-blue-50 border-blue-200 hover:bg-blue-100', description: 'Appointments, Billing' },
  { role: 'nurse', label: 'Nurse', icon: BedDouble, color: 'text-pink-600', bgColor: 'bg-pink-50 border-pink-200 hover:bg-pink-100', description: 'IPD, Patients, Emergency' },
  { role: 'billing', label: 'Billing', icon: CreditCard, color: 'text-orange-600', bgColor: 'bg-orange-50 border-orange-200 hover:bg-orange-100', description: 'Bills, Payments, Reports' },
  { role: 'pharmacist', label: 'Pharmacist', icon: Pill, color: 'text-teal-600', bgColor: 'bg-teal-50 border-teal-200 hover:bg-teal-100', description: 'Pharmacy, Stock, Sales' },
  { role: 'lab_technician', label: 'Lab Tech', icon: FlaskConical, color: 'text-cyan-600', bgColor: 'bg-cyan-50 border-cyan-200 hover:bg-cyan-100', description: 'Lab orders & results' },
];

function makeDemoUser(role: UserRole): { session: { access_token: string; user: { id: string; email: string } }; user: import('../../types').User } {
  const id = `demo-${role}-${Date.now()}`;
  const names: Record<UserRole, string> = {
    superadmin: 'Dr. Rajesh Kumar',
    admin: 'Priya Sharma',
    doctor: 'Dr. Anita Patel',
    receptionist: 'Sunita Devi',
    nurse: 'Kavita Singh',
    billing: 'Amit Verma',
    pharmacist: 'Ravi Gupta',
    lab_technician: 'Manish Yadav',
  };
  return {
    session: {
      access_token: `demo-token-${role}`,
      user: { id, email: `${role}@demo.healthcarehms.in` },
    },
    user: {
      id,
      email: `${role}@demo.healthcarehms.in`,
      full_name: names[role] ?? role,
      role,
      hospital_id: DEMO_HOSPITAL_ID,
      department: null,
      designation: null,
      phone: null,
      avatar_url: null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  };
}

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user, error: authError } = useAppSelector((state) => state.auth);
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [showEmailForm, setShowEmailForm] = useState(false);

  useEffect(() => {
    return () => { dispatch(clearError()); };
  }, [dispatch]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { rememberMe: false },
  });

  if (isAuthenticated) {
    const userRole = (user?.role as UserRole) ?? 'receptionist';
    const defaultRoute = ROLE_DEFAULT_ROUTES[userRole] ?? '/dashboard';
    return <Navigate to={defaultRoute} replace />;
  }

  const handleDemoLogin = (role: UserRole) => {
    const { session, user: demoUser } = makeDemoUser(role);
    localStorage.setItem('demo_session', JSON.stringify({ role }));
    dispatch(setSession({ session, user: demoUser }));
    const defaultRoute = ROLE_DEFAULT_ROUTES[role] ?? '/dashboard';
    navigate(defaultRoute, { replace: true });
  };

  const onSubmit = async (data: LoginFormData) => {
    setLocalError(null);
    dispatch(clearError());
    try {
      const result = await authService.signIn(data.email, data.password);
      let profile = null;
      if (result.user) {
        try {
          profile = await authService.getUserProfile(result.user.id);
        } catch {
          // profile may not exist yet
        }
      }
      dispatch(setSession({ session: result.session, user: profile }));
      const userRole = (profile?.role as UserRole) ?? 'receptionist';
      const defaultRoute = ROLE_DEFAULT_ROUTES[userRole] ?? '/dashboard';
      navigate(defaultRoute, { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid email or password';
      setLocalError(message);
    }
  };

  const errorKey = authError ?? 'unknown';
  const displayError = localError
    ? { title: 'Sign in failed', detail: localError }
    : authError
    ? (ERROR_MESSAGES[errorKey] ?? ERROR_MESSAGES.unknown)
    : null;

  return (
    <div className="min-h-screen bg-[#f4f5f9] flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-[55%] bg-gradient-to-br from-primary-600 via-primary-500 to-sky-400 relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-white blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative z-10 flex items-center gap-3.5">
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg">
            <HeartPulse className="w-8 h-8 text-primary-600" />
          </div>
          <div>
            <h1 className="text-white font-bold text-2xl leading-none">HealthCare HMS</h1>
            <p className="text-white/80 text-sm font-medium mt-1">Hospital Management System</p>
          </div>
        </div>
        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-white font-bold text-4xl leading-tight">
              Smarter Hospital<br />Management for India
            </h2>
            <p className="text-primary-100 mt-4 text-lg leading-relaxed">
              A comprehensive HMS designed for Indian hospitals with 50–200 beds.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { value: '47', label: 'Modules' },
              { value: '200+', label: 'Hospitals' },
              { value: '4000+', label: 'Active Users' },
              { value: '99.9%', label: 'Uptime SLA' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20">
                <p className="text-white font-bold text-3xl">{stat.value}</p>
                <p className="text-white/70 text-sm mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10">
          <p className="text-primary-100 text-sm">
            Trusted by hospitals across India. NABH compliance ready.
          </p>
        </div>
      </div>

      {/* Right login panel */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 bg-white">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
              <HeartPulse className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 text-xl leading-none">HealthCare HMS</h1>
              <p className="text-primary-600 text-xs font-medium">Hospital Management System</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Welcome back</h2>
            <p className="text-gray-500 mt-2">Choose a role to explore, or sign in with your account</p>
          </div>

          {!showEmailForm ? (
            <>
              {/* Demo role picker */}
              <div className="space-y-3 mb-6">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Quick Demo — Select Role</p>
                <div className="grid grid-cols-2 gap-2.5">
                  {DEMO_ROLES.map((dr) => {
                    const Icon = dr.icon;
                    return (
                      <button
                        key={dr.role}
                        type="button"
                        onClick={() => handleDemoLogin(dr.role)}
                        className={`group relative flex items-start gap-2.5 rounded-xl border p-3 text-left transition-all ${dr.bgColor}`}
                      >
                        <div className={`mt-0.5 ${dr.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 leading-tight">{dr.label}</p>
                          <p className="text-[11px] text-gray-500 leading-snug mt-0.5">{dr.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-gray-400 font-medium">or</span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full h-11 rounded-xl"
                onClick={() => setShowEmailForm(true)}
              >
                <Mail className="w-4 h-4 mr-2" />
                Sign in with Email
              </Button>

              <p className="text-center text-sm text-gray-500 mt-6">
                New to HealthCare?{' '}
                <Link to="/register" className="text-primary-600 font-medium hover:underline">
                  Create an account
                </Link>
              </p>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setShowEmailForm(false)}
                className="text-sm text-primary-600 hover:underline mb-4 font-medium"
              >
                ← Back to role selection
              </button>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
                {displayError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-red-700 font-medium text-sm">{displayError.title}</p>
                      <p className="text-red-600 text-xs mt-0.5">{displayError.detail}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-gray-700 font-medium text-sm">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="doctor@hospital.com"
                      {...register('email')}
                      className="pl-10 h-12 rounded-xl border-gray-200 focus:border-primary-400 focus:ring-primary-400 text-base"
                      autoComplete="email"
                    />
                  </div>
                  {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-gray-700 font-medium text-sm">Password</Label>
                    <Link to="/forgot-password" className="text-xs text-primary-600 hover:underline font-medium">Forgot password?</Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      {...register('password')}
                      className="pl-10 pr-12 h-12 rounded-xl border-gray-200 focus:border-primary-400 focus:ring-primary-400 text-base"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-xs">{errors.password.message}</p>}
                </div>

                <div className="flex items-center gap-2.5">
                  <Checkbox id="rememberMe" {...register('rememberMe')} className="border-gray-300 data-[state=checked]:bg-primary-600 data-[state=checked]:border-primary-600" />
                  <Label htmlFor="rememberMe" className="text-sm text-gray-600 font-normal cursor-pointer select-none">
                    Keep me signed in for 30 days
                  </Label>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-semibold rounded-xl transition-all duration-150 shadow-sm active:scale-[0.98] text-base"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Signing in...
                    </span>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>

              <p className="text-center text-sm text-gray-500 mt-6">
                New to HealthCare?{' '}
                <Link to="/register" className="text-primary-600 font-medium hover:underline">
                  Create an account
                </Link>
              </p>
            </>
          )}

          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-center text-xs text-gray-400">
              HealthCare HMS &copy; {new Date().getFullYear()} &mdash; Designed for Indian Healthcare
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
