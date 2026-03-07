import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Eye, EyeOff, HeartPulse, Lock } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { authService } from '../../services/auth.service';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';

const schema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  confirm_password: z.string(),
}).refine((d) => d.password === d.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
});

type FormData = z.infer<typeof schema>;

const passwordRules = [
  { label: 'At least 8 characters', test: (v: string) => v.length >= 8 },
  { label: 'One uppercase letter', test: (v: string) => /[A-Z]/.test(v) },
  { label: 'One number', test: (v: string) => /[0-9]/.test(v) },
];

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const passwordValue = watch('password', '');

  const onSubmit = async (data: FormData) => {
    setError(null);
    try {
      await authService.updatePassword(data.password);
      setSuccess(true);
      setTimeout(() => navigate('/login', { replace: true }), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update password. The reset link may have expired.';
      setError(msg);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <HeartPulse className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900 text-xl leading-none">wellnotes HMS</h1>
            <p className="text-blue-600 text-xs font-medium">Hospital Management System</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {!success ? (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">Set new password</h2>
                <p className="text-gray-500 text-sm mt-1">
                  Choose a strong password to secure your account.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-gray-700 font-medium text-sm">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type={showNew ? 'text' : 'password'}
                      placeholder="••••••••"
                      {...register('password')}
                      className="pl-9 pr-10 h-11 border-gray-300"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      tabIndex={-1}
                    >
                      {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-xs">{errors.password.message}</p>
                  )}
                </div>

                {passwordValue.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                    {passwordRules.map((rule) => {
                      const passes = rule.test(passwordValue);
                      return (
                        <div key={rule.label} className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center ${passes ? 'bg-green-500' : 'bg-gray-200'}`}>
                            {passes && <span className="text-white text-xs font-bold">✓</span>}
                          </div>
                          <span className={`text-xs ${passes ? 'text-green-700' : 'text-gray-500'}`}>
                            {rule.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-gray-700 font-medium text-sm">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="••••••••"
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

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold mt-2"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Updating...
                    </span>
                  ) : (
                    'Update Password'
                  )}
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Password updated!</h3>
              <p className="text-gray-500 text-sm mt-2">
                Your password has been changed successfully.
                <br />Redirecting to login...
              </p>
              <div className="mt-4">
                <Link to="/login" className="text-blue-600 font-medium text-sm hover:underline">
                  Go to login now
                </Link>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          wellnotes HMS &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
