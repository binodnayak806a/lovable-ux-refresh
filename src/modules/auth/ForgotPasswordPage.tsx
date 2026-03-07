import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, CheckCircle2, HeartPulse, Mail } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { authService } from '../../services/auth.service';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [sentTo, setSentTo] = useState('');
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setError(null);
    try {
      await authService.sendPasswordResetEmail(data.email);
      setSentTo(data.email);
      setSent(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to send reset email. Please try again.';
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
          {!sent ? (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">Forgot your password?</h2>
                <p className="text-gray-500 text-sm mt-1">
                  Enter your email and we'll send you a secure reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label className="text-gray-700 font-medium text-sm">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="email"
                      placeholder="your@hospital.com"
                      {...register('email')}
                      className="pl-9 h-11 border-gray-300"
                      autoComplete="email"
                    />
                  </div>
                  {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
                </div>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </span>
                  ) : (
                    'Send Reset Link'
                  )}
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Check your inbox</h3>
              <p className="text-gray-500 text-sm mt-2">
                We've sent a password reset link to
              </p>
              <p className="text-blue-600 font-medium text-sm mt-1">{sentTo}</p>
              <p className="text-gray-400 text-xs mt-3">
                If you don't see it, check your spam or junk folder.
              </p>
              <Button
                variant="outline"
                className="mt-6 border-gray-300"
                onClick={() => { setSent(false); setSentTo(''); }}
              >
                Try a different email
              </Button>
            </div>
          )}

          <div className="mt-6 pt-5 border-t border-gray-100">
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Sign In
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          wellnotes HMS &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
