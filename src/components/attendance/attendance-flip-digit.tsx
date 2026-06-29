import { useEffect, useState } from "react";

interface AttendanceFlipDigitProps {
  value: number;
  label?: string;
  className?: string;
}

export function AttendanceFlipDigit({ value, label, className = "" }: AttendanceFlipDigitProps) {
  const [flip, setFlip] = useState(false);
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    if (displayValue !== value) {
      setFlip(true);
      const timer = setTimeout(() => {
        setDisplayValue(value);
        setFlip(false);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [value, displayValue]);

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div
        className={`
          font-register-mono text-3xl font-bold leading-none tracking-tight
          text-[hsl(var(--foreground))]
          min-w-[3ch] text-center
          transition-all duration-200
          ${flip ? "scale-y-0 opacity-50" : "scale-y-100 opacity-100"}
        `}
      >
        {String(displayValue).padStart(2, "0")}
      </div>
      {label && (
        <span className="text-[10px] uppercase tracking-[0.15em] text-[hsl(var(--muted-foreground))] mt-1 font-register-body">
          {label}
        </span>
      )}
    </div>
  );
}
