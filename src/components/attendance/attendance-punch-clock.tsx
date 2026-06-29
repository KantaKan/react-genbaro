import { useState, useRef, useEffect } from "react";
import { Clock, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";

type PunchState = "idle" | "submitting" | "success" | "error";

interface AttendancePunchClockProps {
  isSubmitting: boolean;
  onSubmit: (code: string) => Promise<void>;
  lastStatus?: string;
  sessionLabel?: string;
}

export function AttendancePunchClock({
  isSubmitting,
  onSubmit,
  lastStatus,
  sessionLabel = "Enter your attendance code",
}: AttendancePunchClockProps) {
  const [code, setCode] = useState("");
  const [punchState, setPunchState] = useState<PunchState>("idle");
  const inputRef = useRef<HTMLInputElement>(null);
  const prevSubmitting = useRef(false);

  useEffect(() => {
    if (prevSubmitting.current && !isSubmitting) {
      if (punchState === "submitting") {
        setPunchState(lastStatus ? "success" : "error");
        const timer = setTimeout(() => {
          setPunchState("idle");
          setCode("");
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
    prevSubmitting.current = isSubmitting;
  }, [isSubmitting, lastStatus, punchState]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setPunchState("submitting");
    try {
      await onSubmit(code.trim().toUpperCase());
    } catch {
      setPunchState("error");
      setTimeout(() => setPunchState("idle"), 2000);
    }
  };

  return (
    <div className="border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
      {/* Brass plate header */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-[hsl(var(--primary))]/10 border-b border-[hsl(var(--border))]">
        <Clock className="h-4 w-4 text-[hsl(var(--primary))]" />
        <span className="font-register-heading text-sm uppercase tracking-[0.15em] text-[hsl(var(--foreground))]">
          Punch Clock
        </span>
      </div>

      <div className="p-4">
        {punchState === "success" ? (
          <div className="flex flex-col items-center justify-center py-6 animate-stamp">
            <CheckCircle className="h-10 w-10 text-[hsl(var(--register-stamp-present))] mb-2" />
            <span className="font-register-heading text-base text-[hsl(var(--register-stamp-present))]">
              Stamped!
            </span>
            <span className="font-register-mono text-xs text-[hsl(var(--muted-foreground))] mt-1">
              {lastStatus ? `${lastStatus}` : ""}
            </span>
          </div>
        ) : punchState === "error" ? (
          <div className="flex flex-col items-center justify-center py-6 animate-stamp">
            <AlertCircle className="h-10 w-10 text-[hsl(var(--register-stamp-absent))] mb-2" />
            <span className="font-register-heading text-base text-[hsl(var(--register-stamp-absent))]">
              Invalid Code
            </span>
            <span className="font-register-mono text-xs text-[hsl(var(--muted-foreground))] mt-1">
              Check the code and try again
            </span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="font-register-body text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-[0.1em] block">
              {sessionLabel}
            </label>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="MORNING-XXXX"
                disabled={punchState === "submitting"}
                className="flex-1 h-10 px-3 font-register-mono text-sm uppercase tracking-wider bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))]/50 focus:outline-none focus:border-[hsl(var(--primary))] disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isSubmitting || !code.trim()}
                className="h-10 px-5 font-register-body text-xs uppercase tracking-[0.12em] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary-foreground))] disabled:opacity-30 transition-colors"
              >
                {punchState === "submitting" ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  "Stamp"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
