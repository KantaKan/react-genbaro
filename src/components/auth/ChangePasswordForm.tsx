import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authService } from "@/application/services/authService";

export function ChangePasswordForm({ onDone, currentLabel = "รหัสผ่านปัจจุบัน" }: { onDone: () => void; currentLabel?: string }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [again, setAgain] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const mismatch = again !== "" && next !== again;
  const short = next !== "" && [...next].length < 8;
  const ready = current !== "" && next !== "" && next === again && !short && !saving;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready) return;
    setSaving(true);
    setError(null);
    try {
      await authService.changePassword(current, next);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't change the password.");
    } finally {
      setSaving(false);
    }
  };

  const field = (id: string, label: string, value: string, set: (v: string) => void, autoComplete: string) => (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <Input id={id} type="password" autoComplete={autoComplete} value={value} onChange={(e) => set(e.target.value)} />
    </div>
  );

  return (
    <form onSubmit={submit} className="grid gap-3.5">
      {field("pw-current", currentLabel, current, setCurrent, "current-password")}
      {field("pw-next", "รหัสผ่านใหม่", next, setNext, "new-password")}
      {short && <p className="-mt-2 text-sm text-muted-foreground">อย่างน้อย 8 ตัวอักษร</p>}
      {field("pw-again", "ยืนยันรหัสผ่านใหม่", again, setAgain, "new-password")}
      {mismatch && <p className="-mt-2 text-sm text-red-600 dark:text-red-400">รหัสผ่านใหม่สองช่องไม่ตรงกัน</p>}
      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      <Button type="submit" disabled={!ready}>
        {saving ? "กำลังบันทึก…" : "บันทึกรหัสผ่าน"}
      </Button>
    </form>
  );
}
