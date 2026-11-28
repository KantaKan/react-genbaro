import { useState } from "react";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { adminApi } from "../../api";

export function ResetPasswordButton({ userId, name }: { userId: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [temp, setTemp] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reset = async () => {
    setBusy(true);
    try {
      setTemp(await adminApi.resetPassword(userId));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't reset the password");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setTemp(null);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <KeyRound className="h-4 w-4" /> Reset password
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{temp ? "Temporary password" : "Reset password"}</DialogTitle>
        </DialogHeader>
        {temp ? (
          <div className="grid gap-3">
            <code className="rounded-lg bg-muted px-3 py-2.5 text-center font-mono text-lg tracking-wider">{temp}</code>
            <p className="text-sm text-muted-foreground">Send it to the learner. They'll set their own when they sign in. It won't be shown again.</p>
            <DialogFooter>
              <Button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(temp).then(() => toast.success("Copied"), () => undefined);
                }}
              >
                Copy
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="grid gap-3">
            <p className="text-sm">{`Reset ${name}'s password? Their current password stops working.`}</p>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="button" disabled={busy} onClick={reset}>
                Reset
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
