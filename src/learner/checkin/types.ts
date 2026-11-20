/** Every check-in style implements this (Plan 3 adds more styles). */
export interface CheckInControlProps {
  tone: "on_time" | "late";
  disabled: boolean;
  busy: boolean;
  onComplete: () => void;
}
