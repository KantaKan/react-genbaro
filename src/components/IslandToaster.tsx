import { Check, Info, TriangleAlert, X, type LucideIcon } from "lucide-react";
import { Toaster } from "sonner";

function Dot({ color, Icon }: { color: string; Icon: LucideIcon }) {
  return (
    <span className="island-icon" style={{ background: color }}>
      <Icon className="h-4 w-4" strokeWidth={3} />
    </span>
  );
}

/** App-wide toasts: a black capsule at the top that opens out of a small pill, stacking when several arrive. */
export function IslandToaster() {
  return (
    <Toaster
      className="island-toaster"
      position="top-center"
      expand
      visibleToasts={3}
      duration={3000}
      gap={8}
      offset={12}
      icons={{
        success: <Dot color="#16a34a" Icon={Check} />,
        error: <Dot color="#ef4444" Icon={X} />,
        info: <Dot color="#6366f1" Icon={Info} />,
        warning: <Dot color="#f59e0b" Icon={TriangleAlert} />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: "island",
          content: "island-content",
          title: "island-title",
          description: "island-desc",
          icon: "island-icon-slot",
          actionButton: "island-action",
          cancelButton: "island-action",
        },
      }}
    />
  );
}
