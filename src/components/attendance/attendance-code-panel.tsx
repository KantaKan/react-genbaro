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

export function AttendanceCodePanel() {
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

  return (
    <div className="code-panel">
      <div className="code-panel-header">
        <Radio className="h-3.5 w-3.5" />
        <span>Code Dispatch</span>
      </div>

      <div className="code-panel-body">
        <div className="code-session-tabs">
          {SESSIONS.map((s) => (
            <button
              key={s}
              onClick={() => setSession(s)}
              className={`code-session-tab ${
                session === s ? "code-session-tab--active" : ""
              }`}
            >
              {s === "morning" ? "AM" : "PM"}
            </button>
          ))}
          <button
            onClick={() => handleLockToggle(session)}
            className={`code-lock-btn ${isLocked ? "code-lock-btn--locked" : ""}`}
            title={isLocked ? "Unlock session" : "Lock session"}
            disabled={lockMutation.isLoading}
          >
            {isLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
          </button>
        </div>

        <div className="code-display-area">
          {isGenerating ? (
            <div className="code-generating">
              <span className="code-dot-pulse" />
              <span className="code-dot-pulse" />
              <span className="code-dot-pulse" />
              <span className="code-label">Dispatching...</span>
            </div>
          ) : isExpired ? (
            <div className="code-empty">
              <Clock className="h-6 w-6" />
              <span className="code-label">Code expired</span>
            </div>
          ) : hasCode ? (
            <div className="code-display">
              <span className="code-text">
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
              </span>
              <button
                onClick={handleCopy}
                className="code-copy-btn"
                title="Copy code"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          ) : (
            <div className="code-empty">
              <Zap className="h-6 w-6" />
              <span className="code-label">Pull lever to generate</span>
            </div>
          )}
        </div>

        {hasCode && !isExpired && (
          <div className="code-status-row">
            <span className="code-status-dot" />
            <span className="code-status-text">
              Active &middot; {mins}:{secs.toString().padStart(2, "0")}
            </span>
          </div>
        )}

        {isExpired && (
          <div className="code-status-row code-status-row--expired">
            <span className="code-status-dot code-status-dot--expired" />
            <span className="code-status-text">Expired &middot; Generate new</span>
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={isGenerating || !!holidayToday || isLocked}
          className="code-lever"
        >
          {isGenerating ? (
            <>
              <span className="code-lever-spinner" />
              Generating...
            </>
          ) : isLocked ? (
            <>
              <Lock className="h-4 w-4" />
              Attendance Locked
            </>
          ) : (
            <>
              <Zap className="h-4 w-4" />
              Pull Lever
            </>
          )}
        </button>
      </div>
    </div>
  );
}
