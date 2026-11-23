import { useRef, useState, type ReactNode } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogTitle } from "@/components/ui/alert-dialog";

/** Ask before acting; the action runs once even on a double click. */
export function useConfirm() {
  const [state, setState] = useState<{ title: string; body?: ReactNode; run: () => Promise<void> } | null>(null);
  const busy = useRef(false);
  const ask = (title: string, run: () => Promise<void>, body?: ReactNode) => setState({ title, run, body });
  const node = (
    <AlertDialog open={!!state} onOpenChange={(o) => !o && setState(null)}>
      <AlertDialogContent className="learner rounded-[20px] border-0 bg-l-card text-l-ink">
        <AlertDialogTitle>{state?.title}</AlertDialogTitle>
        <AlertDialogDescription asChild>
          <div className="text-body text-l-ink2">{state?.body}</div>
        </AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="rounded-full bg-l-ink text-l-card hover:bg-l-ink/90"
            onClick={async () => {
              if (busy.current || !state) return;
              busy.current = true;
              try {
                await state.run();
              } finally {
                busy.current = false;
                setState(null);
              }
            }}
          >
            Confirm
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
  return { ask, node };
}
