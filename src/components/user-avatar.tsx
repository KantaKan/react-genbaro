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
}

function PointerGazeAvatar({ name, title }: { name: string; title: string }) {
  const { ref } = useGaze({ travel: 3, lookAt: "pointer" });

  return <Blobatar ref={ref} name={name} title={title} animate="always" className="h-full w-full" />;
}

export function UserAvatar({
  userId,
  name,
  firstName,
  lastName,
  email,
  className,
  followPointer = false,
}: UserAvatarProps) {
  const displayName = name || firstName || email || "User";
  const avatarSeed = getUserAvatarSeed(userId, email, name, firstName, lastName);

  return (
    <Avatar className={cn("bg-muted", className)}>
      {followPointer ? (
        <PointerGazeAvatar name={avatarSeed} title={displayName} />
      ) : (
        <Blobatar name={avatarSeed} alt={displayName} className="h-full w-full object-cover" />
      )}
    </Avatar>
  );
}
