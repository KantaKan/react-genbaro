import { toast } from "react-toastify";
import { useMutation, useQueryClient } from "react-query";
import { createStamp } from "@/lib/api";
import { fireConfetti, fireMilestoneConfetti } from "@/lib/confetti";
import { prepareStampFile } from "@/lib/stamp-upload";
import type { Stamp } from "@/lib/stamp";

const MILESTONE_INTERVAL = 10;

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function useStampUpload() {
  const queryClient = useQueryClient();

  const mutation = useMutation(
    ({ file }: { file: File; isMilestone: boolean }) => createStamp(file),
    {
      onSuccess: (_data, variables) => {
        queryClient.invalidateQueries("stampBoard");
        queryClient.invalidateQueries("stampCohort");
        if (!prefersReducedMotion()) {
          if (variables.isMilestone) {
            fireMilestoneConfetti();
          } else {
            fireConfetti();
          }
        }
        toast.success("Your stamp was added to the board!");
      },
      onError: (error: unknown) => {
        const status = (error as { response?: { status?: number } })?.response?.status;
        if (status === 409) {
          toast.error("You've already stamped today. Come back tomorrow!");
        } else {
          toast.error("Couldn't add your stamp. Give it another try.");
        }
      },
    }
  );

  const upload = async (
    cohortNumber: number,
    file: File,
    options: { prepared?: boolean } = {}
  ): Promise<boolean> => {
    try {
      const ready = options.prepared ? file : await prepareStampFile(file);
      const current = queryClient.getQueryData<Stamp[]>(["stampBoard", cohortNumber]) ?? [];
      const isMilestone = (current.length + 1) % MILESTONE_INTERVAL === 0;
      await mutation.mutateAsync({ file: ready, isMilestone });
      return true;
    } catch {
      return false;
    }
  };

  return { upload, isUploading: mutation.isLoading };
}
