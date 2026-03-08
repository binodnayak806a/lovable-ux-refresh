interface Props {
  fullScreen?: boolean;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

const SIZES = {
  sm: 'w-5 h-5 border-2',
  md: 'w-8 h-8 border-2',
  lg: 'w-12 h-12 border-[3px]',
};

export default function LoadingSpinner({ fullScreen, size = 'md', label = 'Loading...' }: Props) {
  const spinner = (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="flex flex-col items-center gap-3"
    >
      <div
        aria-hidden="true"
        className={`${SIZES[size]} rounded-full border-border border-t-primary animate-spin`}
      />
      <span className="sr-only">{label}</span>
      {label && <p className="text-sm text-muted-foreground">{label}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
        {spinner}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[120px]">
      {spinner}
    </div>
  );
}
