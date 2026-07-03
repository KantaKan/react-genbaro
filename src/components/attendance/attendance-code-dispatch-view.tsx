import { useState, useEffect, useRef, useCallback } from "react";
import { useAttendanceContext } from "../attendance-shell";
import {
  useGenerateAttendanceCode,
  useActiveAttendanceCode,
  useLockAttendance,
} from "@/application/hooks/useAttendance";
import type { AttendanceSession, AttendanceCode } from "@/domain/types";
import { Zap, Copy, Check, Clock, Radio, Lock, Unlock } from "lucide-react";

const SESSIONS: AttendanceSession[] = ["morning", "afternoon"];

export function AttendanceCodeDispatchView() {
  const { selectedCohort, selectedDate, holidayToday } = useAttendanceContext();
  const cohortNum = parseInt(selectedCohort);

  const [session, setSession] = useState<AttendanceSession>("morning");
  const [displayChars, setDisplayChars] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [lockedSessions, setLockedSessions] = useState<Set<AttendanceSession>>(new Set());
  const prevCodeRef = useRef<string | null>(null);

  const lockMutation = useLockAttendance(cohortNum, selectedDate);
  const generateMutation = useGenerateAttendanceCode();
  const activeCodeQuery = useActiveAttendanceCode(
    cohortNum,
    session,
    !holidayToday && !!cohortNum
  );

  const activeCode = activeCodeQuery.data as AttendanceCode | null;
  const code = activeCode?.code ?? "";
  const hasCode = code.length > 0;
  const isGenerating = generateMutation.isLoading;

  useEffect(() => {
    if (code && code !== prevCodeRef.current) {
      setDisplayChars([]);
      let i = 0;
      const timer = setInterval(() => {
        if (i < code.length) {
          setDisplayChars((prev) => [...prev, code[i]]);
          i++;
        } else {
          clearInterval(timer);
        }
      }, 50);
      prevCodeRef.current = code;
      return () => clearInterval(timer);
    } else if (!code) {
      setDisplayChars([]);
      prevCodeRef.current = null;
    }
  }, [code]);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  useEffect(() => {
    if (!activeCode?.expires_at) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [activeCode?.expires_at]);

  const handleGenerate = () => {
    generateMutation.mutate({ cohort: cohortNum, session });
  };

  const handleLockToggle = useCallback(
    (s: AttendanceSession) => {
      const next = new Set(lockedSessions);
      const newLocked = !next.has(s);
      if (newLocked) next.add(s);
      else next.delete(s);
      setLockedSessions(next);
      lockMutation.mutate({ date: selectedDate, session: s, locked: newLocked });
    },
    [lockedSessions, lockMutation, selectedDate]
  );

  const handleCopy = async () => {
    if (code) {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    }
  };

  const expiresAt = activeCode?.expires_at
    ? new Date(activeCode.expires_at)
    : null;
  const timeRemaining = expiresAt
    ? Math.max(0, Math.floor((expiresAt.getTime() - now) / 1000))
    : 0;
  const mins = Math.floor(timeRemaining / 60);
  const secs = timeRemaining % 60;
  const isExpired = hasCode && timeRemaining <= 0;
  const isLocked = lockedSessions.has(session);
  const isHoliday = !!holidayToday;

  return (
    <div className="code-dispatch">
      <div className="code-dispatch-header">
        <Radio className="h-4 w-4" />
        <span>Code Dispatch Room</span>
        <span className="code-dispatch-badge">
          {session === "morning" ? "AM" : "PM"} Session
        </span>
      </div>

      <div className="code-dispatch-readout">
        {isGenerating ? (
          <div className="code-dispatch-generating">
            <span className="code-dot-pulse" />
            <span className="code-dot-pulse" />
            <span className="code-dot-pulse" />
            <span className="code-label" style={{ marginLeft: "0.5rem" }}>
              Dispatching...
            </span>
          </div>
        ) : isExpired ? (
          <div className="code-dispatch-empty">
            <Clock className="h-8 w-8" />
            <span className="code-label">Code Expired</span>
          </div>
        ) : hasCode ? (
          <div className="code-dispatch-code">
            {displayChars.map((ch, i) => (
              <span
                key={i}
                className="code-char"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                {ch}
              </span>
            ))}
            {displayChars.length < code.length && (
              <span className="code-cursor">▊</span>
            )}
          </div>
        ) : (
          <div className="code-dispatch-empty">
            <Zap className="h-8 w-8" />
            <span className="code-label">Pull the lever to dispatch a code</span>
          </div>
        )}
      </div>

      <div className="code-dispatch-status">
        {hasCode && !isExpired && (
          <>
            <span className="code-dispatch-status-dot" />
            <span className="code-dispatch-status-text">
              Active &middot; {mins}:{secs.toString().padStart(2, "0")}
            </span>
          </>
        )}
        {isExpired && (
          <>
            <span className="code-dispatch-status-dot code-dispatch-status-dot--expired" />
            <span className="code-dispatch-status-text">
              Expired &middot; Generate new code
            </span>
          </>
        )}
        {!hasCode && !isGenerating && (
          <span className="code-dispatch-status-text">
            {isHoliday ? "Holiday — dispatching disabled" : "No active code"}
          </span>
        )}
        {hasCode && (
          <button onClick={handleCopy} className="code-dispatch-copy-btn">
            {copied ? (
              <>
                <Check className="h-3 w-3" /> Copied
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" /> Copy Code
              </>
            )}
          </button>
        )}
      </div>

      <div className="code-dispatch-controls">
        {SESSIONS.map((s) => (
          <button
            key={s}
            onClick={() => setSession(s)}
            className={`code-dispatch-session-tab ${
              session === s ? "code-dispatch-session-tab--active" : ""
            }`}
          >
            {s === "morning" ? "AM" : "PM"}
          </button>
        ))}
        <button
          onClick={() => handleLockToggle(session)}
          className={`code-dispatch-lock-btn ${
            isLocked ? "code-dispatch-lock-btn--locked" : ""
          }`}
          title={isLocked ? "Unlock session" : "Lock session"}
          disabled={lockMutation.isLoading}
        >
          {isLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
        </button>
      </div>

      <div className="code-dispatch-lever-row">
        <button
          onClick={handleGenerate}
          disabled={isGenerating || isHoliday || isLocked}
          className="code-dispatch-lever"
        >
          {isGenerating ? (
            <>
              <span className="code-lever-spinner" />
              Generating...
            </>
          ) : isLocked ? (
            <>
              <Lock className="h-4 w-4" />
              Session Locked
            </>
          ) : isHoliday ? (
            <>
              <Clock className="h-4 w-4" />
              Holiday
            </>
          ) : (
            <>
              <Zap className="h-4 w-4" />
              Dispatch Code
            </>
          )}
        </button>
      </div>
    </div>
  );
}
