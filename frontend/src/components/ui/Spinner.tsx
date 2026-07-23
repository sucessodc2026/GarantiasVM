interface SpinnerProps {
  size?: number;
  className?: string;
}

export function Spinner({ size = 20, className = '' }: SpinnerProps) {
  return (
    <span
      className={`inline-block rounded-full border-2 border-[var(--border-subtle)] border-t-[var(--accent)] animate-spin ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
