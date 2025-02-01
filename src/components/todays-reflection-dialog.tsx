import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Reflection } from "../lib/types"; // Make sure to import your Reflection type

interface TodaysReflectionDialogProps {
  reflection: Reflection;
  isOpen: boolean;
  onClose: () => void;
}

export function TodaysReflectionDialog({ reflection, isOpen, onClose }: TodaysReflectionDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Today's Reflection</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div>
            <h3 className="font-semibold">Tech Sessions</h3>
            <p>
              <strong>Happy:</strong> {reflection.reflection.tech_sessions.happy}
            </p>
            <p>
              <strong>Improve:</strong> {reflection.reflection.tech_sessions.improve}
            </p>
          </div>
          <div>
            <h3 className="font-semibold">Non-Tech Sessions</h3>
            <p>
              <strong>Happy:</strong> {reflection.reflection.non_tech_sessions.happy}
            </p>
            <p>
              <strong>Improve:</strong> {reflection.reflection.non_tech_sessions.improve}
            </p>
          </div>
          <div>
            <h3 className="font-semibold">Barometer</h3>
            <p>{reflection.reflection.barometer}</p>
          </div>
        </div>
        <Button onClick={onClose}>Close</Button>
      </DialogContent>
    </Dialog>
  );
}
