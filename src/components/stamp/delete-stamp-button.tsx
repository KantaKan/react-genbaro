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
import { deleteStamp } from "@/lib/api";

interface DeleteStampButtonProps {
  cohortNumber: number;
  stampId: string;
}

export function DeleteStampButton({ cohortNumber, stampId }: DeleteStampButtonProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const mutation = useMutation(() => deleteStamp(cohortNumber, stampId), {
    onSuccess: () => {
      queryClient.invalidateQueries(["stampBoard", cohortNumber]);
      toast.success("Stamp removed from the board.");
      setOpen(false);
    },
    onError: () => {
      toast.error("Couldn't remove that stamp.");
    },
  });

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full bg-background/80 text-destructive shadow-sm hover:bg-background hover:text-destructive"
        aria-label="Delete stamp"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      <AlertDialog open={open} onOpenChange={(next) => !mutation.isLoading && setOpen(next)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this stamp?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the stamp from the board. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={mutation.isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => mutation.mutate()}
              disabled={mutation.isLoading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {mutation.isLoading ? "Removing..." : "Remove Stamp"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
