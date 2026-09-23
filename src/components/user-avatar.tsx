import { Blobatar } from "@blobatar/react";
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
}

export function UserAvatar({
  userId,
  name,
  firstName,
  lastName,
  email,
  className,
}: UserAvatarProps) {
  const displayName = name || firstName || email || "User";
  const avatarSeed = getUserAvatarSeed(userId, email, name, firstName, lastName);

  return (
    <Avatar className={cn("bg-muted", className)}>
      <Blobatar name={avatarSeed} alt={displayName} className="h-full w-full object-cover" />
    </Avatar>
  );
}
