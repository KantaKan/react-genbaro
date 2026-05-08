import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PageLoadingProps {
  label?: string;
  className?: string;
}

export function PageLoading({ label = "Loading...", className }: PageLoadingProps) {
  return (
    <div className={cn("min-h-[60vh] flex items-center justify-center", className)}>
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <p>{label}</p>
      </div>
    </div>
  );
}

interface PageErrorProps {
  title?: string;
  message?: string;
  className?: string;
}

export function PageError({
  title = "Something went wrong.",
  message = "Please try again later.",
  className,
}: PageErrorProps) {
  return (
    <div className={cn("min-h-[60vh] flex items-center justify-center", className)}>
      <Card className="p-8 text-center">
        <p className="text-destructive">{title}</p>
        <p className="text-muted-foreground text-sm mt-2">{message}</p>
      </Card>
    </div>
  );
}
