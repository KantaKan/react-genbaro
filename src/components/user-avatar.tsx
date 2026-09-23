import { useCallback } from "react";
import { Blobatar } from "@blobatar/react";
import { useGaze } from "@blobatar/react/gaze";
import "blobatar/motion.css";
import "blobatar/gaze.css";
import { Avatar } from "@/components/ui/avatar";
import { getUserAvatarSeed } from "@/lib/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  userId?: string | null;
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  className?: string;
  followPointer?: boolean;
  gazeTravel?: number;
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
}: UserAvatarProps) {
  const displayName = name || firstName || email || "User";
  const avatarSeed = getUserAvatarSeed(userId, email, name, firstName, lastName);

  if (followPointer) {
    return <PointerGazeAvatar name={avatarSeed} title={displayName} className={className} travel={gazeTravel} />;
  }

  return (
    <Avatar className={cn("bg-muted", className)}>
      <Blobatar name={avatarSeed} alt={displayName} className="h-full w-full object-cover" />
    </Avatar>
  );
}
