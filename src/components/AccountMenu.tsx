import { UserAvatar } from "@/components/UserAvatar";
import { text } from "@/i18n";
import { useSessionStore } from "@/store/useSessionStore";

export function AccountMenu() {
  const user = useSessionStore((state) => state.user);
  if (!user) return null;

  return (
    <a
      href="/profile"
      aria-label={text("account.label", { name: user.username })}
      className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-full bg-surface-2 text-ink ring-1 ring-ink/10 transition-colors hover:bg-surface"
    >
      <UserAvatar
        user={user}
        className="size-full object-cover"
        iconClassName="size-[18px]"
      />
    </a>
  );
}
