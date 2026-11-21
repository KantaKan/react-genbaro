import { useCallback } from "react";
import { Blobatar } from "@blobatar/react";
import { useGaze } from "@blobatar/react/gaze";
import "blobatar/motion.css";
import "blobatar/gaze.css";
import { Avatar } from "@/components/ui/avatar";
import { getUserAvatarSeed } from "@/lib/avatar";
import { cn } from "@/lib/utils";
import type { AvatarConfig } from "@/learner/avatar/types";
import { avatarDataUri } from "@/learner/avatar/dicebear";

interface UserAvatarProps {
  userId?: string | null;
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  className?: string;
  followPointer?: boolean;
  gazeTravel?: number;
  /** saved avatar; DiceBear styles render it, "blobatar" or none falls back to Blobatar */
  avatar?: AvatarConfig | null;
  /** reserved for the GenMate Cup champion frame */
  champion?: boolean;
}

function PointerGazeAvatar({ name, title, className, travel }: { name: string; title: string; className?: string; travel: number }) {
  const { ref } = useGaze({ travel, lookAt: "pointer" });
  const attachAvatar = useCallback((element: HTMLSpanElement | null) => {
    ref(element?.querySelector("svg") ?? null);
  }, [ref]);

  return (
    <Avatar ref={attachAvatar} className={cn("bg-muted", className)}>
      <Blobatar name={name} title={title} animate="always" className="h-full w-full" />
    </Avatar>
  );
}

/** GenMate Cup champions get a slowly turning gold ring and a small crown, everywhere. */
export function UserAvatar(props: UserAvatarProps) {
  if (!props.champion) return <AvatarInner {...props} />;
  return (
    <span data-champion className={cn("relative inline-flex shrink-0 rounded-full", props.className)}>
      <span aria-hidden className="absolute -inset-[3px] animate-[spin_6s_linear_infinite] rounded-full bg-[conic-gradient(#fde68a,#f59e0b,#b45309,#fde68a,#f59e0b,#fde68a)] motion-reduce:animate-none" />
      <span aria-hidden className="absolute -inset-px rounded-full bg-[var(--l-card,white)]" />
      <AvatarInner {...props} className="relative h-full w-full" />
      <svg aria-hidden viewBox="0 0 24 16" className="absolute -top-[22%] left-1/2 w-[38%] min-w-[12px] -translate-x-1/2 drop-shadow-sm">
        <path d="M2 14 L4 3 L9 8 L12 1 L15 8 L20 3 L22 14 Z" fill="#f59e0b" stroke="#b45309" strokeWidth="1.2" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function AvatarInner({
  userId,
  name,
  firstName,
  lastName,
  email,
  className,
  followPointer = false,
  gazeTravel = 3,
  avatar,
}: UserAvatarProps) {
  const displayName = name || firstName || email || "User";
  // a saved Blobatar keeps its own seed (Shuffle) and background
  const blob = avatar?.style === "blobatar" ? avatar : null;
  const avatarSeed = blob?.seed || getUserAvatarSeed(userId, email, name, firstName, lastName);
  const blobBg = blob?.bg ? { background: `#${blob.bg}` } : undefined;

  if (avatar && avatar.style !== "blobatar") {
    return (
      <Avatar className={cn("bg-muted", className)} style={{ background: avatar.bg ? `#${avatar.bg}` : undefined }}>
        <img data-avatar="dicebear" src={avatarDataUri(avatar)} alt={displayName} className="h-full w-full" />
      </Avatar>
    );
  }

  if (followPointer) {
    return <PointerGazeAvatar name={avatarSeed} title={displayName} className={className} travel={gazeTravel} />;
  }

  return (
    <Avatar className={cn("bg-muted", className)} style={blobBg}>
      <Blobatar name={avatarSeed} alt={displayName} className="h-full w-full object-cover" />
    </Avatar>
  );
}
