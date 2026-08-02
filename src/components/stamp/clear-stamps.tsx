import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { useMutation, useQueryClient } from "react-query";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { clearCohortStamps } from "@/lib/api";

interface ClearStampsProps {
  cohortNumber: number;
}

export function ClearStamps({ cohortNumber }: ClearStampsProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const mutation = useMutation(() => clearCohortStamps(cohortNumber), {
    onSuccess: () => {
      queryClient.invalidateQueries(["stampBoard", cohortNumber]);
      toast.success("The stamp board has been cleared.");
      setOpen(false);
    },
    onError: () => {
      toast.error("Couldn't clear the stamp board.");
    },
  });

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="text-red-500 hover:text-red-700"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="mr-1.5 h-4 w-4" />
        Clear Board
      </Button>
      <AlertDialog open={open} onOpenChange={(next) => !mutation.isLoading && setOpen(next)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear the stamp board?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes every stamp from the board. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={mutation.isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => mutation.mutate()}
              disabled={mutation.isLoading}
              className="bg-red-500 hover:bg-red-600"
            >
              {mutation.isLoading ? "Clearing..." : "Clear Board"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
