import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Label } from '../../../components/ui/label';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { cn } from '../../../lib/utils';

interface InputFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  success?: boolean;
  children?: never;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (val: string) => void;
  maxLength?: number;
  disabled?: boolean;
  prefix?: string;
  suffix?: string;
  autoFocus?: boolean;
}

interface TextareaFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  placeholder?: string;
  value: string;
  onChange: (val: string) => void;
  maxLength?: number;
  rows?: number;
}

interface WrapperProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  success?: boolean;
  children: ReactNode;
}

export function FormField({ label, required, error, hint, success, children }: WrapperProps) {
  return (
    <div className="space-y-1.5">
      <Label className={cn(
        'text-sm font-medium',
        error ? 'text-red-600' : 'text-gray-700'
      )}>
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      {children}
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
      {success && !error && (
        <p className="text-xs text-emerald-600 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          Looks good!
        </p>
      )}
      {hint && !error && !success && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

export function InputField({
  label,
  required,
  error,
  hint,
  success,
  type = 'text',
  placeholder,
  value,
  onChange,
  maxLength,
  disabled,
  prefix,
  suffix,
  autoFocus,
}: InputFieldProps) {
  const showCharCount = maxLength && type !== 'number' && type !== 'date';

  return (
    <FormField label={label} required={required} error={error} hint={hint} success={success}>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
            {prefix}
          </span>
        )}
        <Input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxLength}
          disabled={disabled}
          autoFocus={autoFocus}
          className={cn(
            'h-10 text-sm border-gray-200 bg-gray-50/50 focus:bg-white transition-colors',
            error && 'border-red-300 focus-visible:ring-red-400',
            success && 'border-emerald-300 focus-visible:ring-emerald-400',
            prefix && 'pl-10',
            suffix && 'pr-10',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
            {suffix}
          </span>
        )}
      </div>
      {showCharCount && (
        <div className="text-right">
          <span className={cn(
            'text-xs',
            value.length === maxLength ? 'text-amber-500' : 'text-gray-400'
          )}>
            {value.length}/{maxLength}
          </span>
        </div>
      )}
    </FormField>
  );
}

export function TextareaField({
  label,
  required,
  error,
  hint,
  placeholder,
  value,
  onChange,
  maxLength,
  rows = 3,
}: TextareaFieldProps) {
  return (
    <FormField label={label} required={required} error={error} hint={hint}>
      <Textarea
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        rows={rows}
        className={cn(
          'text-sm border-gray-200 bg-gray-50/50 focus:bg-white transition-colors resize-none',
          error && 'border-red-300 focus-visible:ring-red-400'
        )}
      />
      {maxLength && (
        <div className="text-right">
          <span className={cn(
            'text-xs',
            value.length === maxLength ? 'text-amber-500' : 'text-gray-400'
          )}>
            {value.length}/{maxLength}
          </span>
        </div>
      )}
    </FormField>
  );
}
