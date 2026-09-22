import type { PublicUser } from "@/lib/api";

export function isProfilePath(pathname = window.location.pathname): boolean {
  return pathname === "/profile" || pathname === "/profile/";
}

export function avatarSrc(user: Pick<PublicUser, "avatarUpdatedAt">): string | null {
  if (!user.avatarUpdatedAt) return null;
  return `/api/auth/avatar?v=${encodeURIComponent(user.avatarUpdatedAt)}`;
}
