import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarFallback, getUserAvatarUrl } from "@/lib/avatar";

interface UserAvatarProps {
  userId?: string | null;
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  className?: string;
  fallbackClassName?: string;
}

export function UserAvatar({
  userId,
  name,
  firstName,
  lastName,
  email,
  className,
  fallbackClassName,
}: UserAvatarProps) {
  const displayName = name || firstName || email || "User";
  const avatarUrl = getUserAvatarUrl(userId, email, name, firstName);
  const fallback = getAvatarFallback(name, firstName, lastName, email);

  return (
    <Avatar className={className}>
      <AvatarImage src={avatarUrl} alt={displayName} />
      <AvatarFallback className={fallbackClassName}>{fallback}</AvatarFallback>
    </Avatar>
  );
}
