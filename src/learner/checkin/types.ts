/** Every check-in style implements this (Plan 3 adds more styles). */
export interface CheckInControlProps {
  tone: "on_time" | "late";
  disabled: boolean;
  busy: boolean;
  onComplete: () => void;
  /** minutes until the next cutoff (late or absent) */
  minutesLeft: number;
  /** label of the next cutoff, e.g. "9:15" */
  deadline: string;
}
