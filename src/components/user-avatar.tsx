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

export function UserAvatar({
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
  const avatarSeed = getUserAvatarSeed(userId, email, name, firstName, lastName);

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
    <Avatar className={cn("bg-muted", className)}>
      <Blobatar name={avatarSeed} alt={displayName} className="h-full w-full object-cover" />
    </Avatar>
  );
}
