import { IconUser } from "@/components/icons";
import type { PublicUser } from "@/lib/api";
import { avatarSrc } from "@/lib/profile";
import { useState } from "react";

export function UserAvatar({
  user,
  className,
  iconClassName,
}: {
  user: PublicUser;
  className?: string;
  iconClassName?: string;
}) {
  const src = avatarSrc(user);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = Boolean(src) && failedSrc !== src;

  if (!showImage || !src) {
    return <IconUser className={iconClassName ?? className} />;
  }

  return (
    <img
      src={src}
      alt=""
      decoding="async"
      className={className}
      onError={() => setFailedSrc(src)}
    />
  );
}
