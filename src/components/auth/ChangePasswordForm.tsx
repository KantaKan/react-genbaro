import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authService } from "@/application/services/authService";

const THAI: Record<string, string> = {
  "current password is wrong": "รหัสผ่านปัจจุบันไม่ถูกต้อง",
  "new password must be at least 8 characters": "รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร",
  "new password must be at most 72 bytes": "รหัสผ่านใหม่ยาวเกินไป",
  "new password must be different from the current one": "รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสเดิม",
};

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
      const msg = err instanceof Error ? err.message : "";
      setError(THAI[msg] ?? (msg || "เปลี่ยนรหัสผ่านไม่สำเร็จ ลองอีกครั้ง"));
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
