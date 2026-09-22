import { ImageCropDialog } from "@/components/ImageCropDialog";
import { PasswordInput } from "@/components/PasswordInput";
import { UserAvatar } from "@/components/UserAvatar";
import { text, useLocaleStore, type Locale } from "@/i18n";
import { cn } from "@/lib/cn";
import { useSessionStore } from "@/store/useSessionStore";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";

export function ProfileScreen() {
  const user = useSessionStore((state) => state.user);
  const signOut = useSessionStore((state) => state.signOut);
  const updatePassword = useSessionStore((state) => state.updatePassword);
  const updateUsername = useSessionStore((state) => state.updateUsername);
  const updateAvatar = useSessionStore((state) => state.updateAvatar);
  const removeAvatar = useSessionStore((state) => state.removeAvatar);
  const updateLocale = useSessionStore((state) => state.updateLocale);
  const locale = useLocaleStore((state) => state.locale);
  const fileRef = useRef<HTMLInputElement>(null);
  const [username, setUsername] = useState(user?.username ?? "");
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [avatarMessage, setAvatarMessage] = useState<string | null>(null);
  const [usernameMessage, setUsernameMessage] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [avatarPending, setAvatarPending] = useState(false);
  const [usernamePending, setUsernamePending] = useState(false);
  const [passwordPending, setPasswordPending] = useState(false);
  const [localeMessage, setLocaleMessage] = useState<string | null>(null);
  const [cropUrl, setCropUrl] = useState<string | null>(null);
  const [cropBlob, setCropBlob] = useState<Blob | null>(null);

  useEffect(() => {
    const previous = document.title;
    document.title = text("profile.document");
    return () => {
      document.title = previous;
    };
  }, [locale]);

  useEffect(() => {
    return () => {
      if (cropUrl) URL.revokeObjectURL(cropUrl);
    };
  }, [cropUrl]);

  if (!user) return null;

  function closeCrop() {
    setCropUrl(null);
    setCropBlob(null);
  }

  function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      setAvatarMessage(text("profile.photoType"));
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setAvatarMessage(text("profile.photoLarge"));
      return;
    }
    setAvatarMessage(null);
    setCropBlob(file);
    setCropUrl(URL.createObjectURL(file));
  }

  async function onCropped(blob: Blob) {
    closeCrop();
    setAvatarPending(true);
    setAvatarMessage(null);
    try {
      const fitted = await fitAvatar(blob);
      const error = await updateAvatar(fitted);
      setAvatarMessage(error ?? text("profile.photoSaved"));
    } catch (error) {
      setAvatarMessage(error instanceof Error ? error.message : text("profile.photoFailed"));
    } finally {
      setAvatarPending(false);
    }
  }

  async function onRemove() {
    setAvatarPending(true);
    setAvatarMessage(null);
    const error = await removeAvatar();
    setAvatarPending(false);
    setAvatarMessage(error ?? text("profile.photoRemoved"));
  }

  async function onUsername(event: FormEvent) {
    event.preventDefault();
    setUsernamePending(true);
    setUsernameMessage(null);
    const error = await updateUsername(username);
    setUsernamePending(false);
    if (error) {
      setUsernameMessage(error);
      return;
    }
    setUsername(username.trim().toLowerCase());
    setUsernameMessage(text("profile.usernameSaved"));
  }

  async function onPassword(event: FormEvent) {
    event.preventDefault();
    setPasswordPending(true);
    setPasswordMessage(null);
    const error = await updatePassword(current, next);
    setPasswordPending(false);
    if (error) {
      setPasswordMessage(error);
      return;
    }
    setCurrent("");
    setNext("");
    setPasswordMessage(text("profile.passwordChanged"));
  }

  return (
    <div className="h-full min-h-0 overflow-y-auto overscroll-contain bg-canvas px-4 py-6 text-ink md:px-6 md:py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 pb-[max(2rem,env(safe-area-inset-bottom))]">
        <a href="/" className="page-title text-center">
          Lifely
        </a>
        <div className="grid items-start gap-4 md:grid-cols-2">
          <section className="rounded-3xl bg-surface p-5 shadow-[var(--shadow-float)]">
          <h1 className="text-[13px] font-semibold text-ink-secondary">{text("profile.title")}</h1>
          <div className="mt-4 flex flex-col items-center gap-3">
            <button
              type="button"
              disabled={avatarPending}
              aria-label={text("profile.changePhoto")}
              onClick={() => fileRef.current?.click()}
              className="grid size-28 place-items-center overflow-hidden rounded-full bg-surface-2 text-ink ring-1 ring-ink/10 disabled:opacity-60"
            >
              <UserAvatar
                user={user}
                className="size-full object-cover"
                iconClassName="size-12"
              />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={onFile}
            />
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                disabled={avatarPending}
                onClick={() => fileRef.current?.click()}
                className="min-h-11 rounded-2xl bg-accent px-4 text-[15px] font-semibold text-accent-fg disabled:opacity-60"
              >
                {text("profile.changePhotoButton")}
              </button>
              {user.avatarUpdatedAt ? (
                <button
                  type="button"
                  disabled={avatarPending}
                  onClick={() => void onRemove()}
                  className="min-h-11 rounded-2xl px-4 text-[15px] font-semibold text-danger disabled:opacity-60"
                >
                  {text("profile.removePhoto")}
                </button>
              ) : null}
            </div>
            {avatarMessage ? <p className="text-center text-[13px] text-ink">{avatarMessage}</p> : null}
          </div>
          <p className="mt-4 break-all text-center text-[15px] text-ink-secondary">{user.email}</p>
          <form className="mt-5 flex flex-col gap-3" onSubmit={(event) => void onUsername(event)}>
            <Field
              label={text("auth.username")}
              value={username}
              autoComplete="username"
              onChange={setUsername}
            />
            <p className="text-[13px] text-ink-tertiary">{text("profile.usernameHint")}</p>
            {usernameMessage ? <p className="text-[13px] text-ink">{usernameMessage}</p> : null}
            <button
              type="submit"
              disabled={usernamePending}
              className="min-h-11 rounded-2xl bg-surface-2 text-[15px] font-semibold text-ink disabled:opacity-60"
            >
              {text("profile.saveUsername")}
            </button>
          </form>
          </section>
          <div className="flex flex-col gap-4">
        <section className="rounded-3xl bg-surface p-5 shadow-[var(--shadow-float)]">
          <h2 className="text-[13px] font-semibold text-ink-secondary">{text("profile.language")}</h2>
          <div
            role="radiogroup"
            aria-label={text("profile.language")}
            className="mt-4 grid grid-cols-2 gap-1 rounded-2xl bg-surface-2 p-1"
          >
            {(["sr", "en"] as const).map((value) => (
              <LanguageOption
                key={value}
                value={value}
                selected={locale === value}
                onSelect={(next) => {
                  if (next === locale) return;
                  setLocaleMessage(null);
                  void updateLocale(next).then((error) => {
                    if (error) setLocaleMessage(error);
                  });
                }}
              />
            ))}
          </div>
          {localeMessage ? <p className="mt-3 text-[13px] text-ink">{localeMessage}</p> : null}
        </section>
        <section className="rounded-3xl bg-surface p-5 shadow-[var(--shadow-float)]">
          <h2 className="text-[13px] font-semibold text-ink-secondary">{text("profile.password")}</h2>
          <form className="mt-4 flex flex-col gap-3" onSubmit={(event) => void onPassword(event)}>
            <label className="flex flex-col gap-1 text-[13px] font-semibold text-ink-secondary">
              {text("profile.currentPassword")}
              <PasswordInput
                value={current}
                autoComplete="current-password"
                onChange={setCurrent}
              />
            </label>
            <label className="flex flex-col gap-1 text-[13px] font-semibold text-ink-secondary">
              {text("profile.newPassword")}
              <PasswordInput
                value={next}
                autoComplete="new-password"
                onChange={setNext}
              />
            </label>
            <p className="text-[13px] text-ink-tertiary">{text("auth.passwordHint")}</p>
            {passwordMessage ? <p className="text-[13px] text-ink">{passwordMessage}</p> : null}
            <button
              type="submit"
              disabled={passwordPending}
              className="min-h-11 rounded-2xl bg-accent text-[15px] font-semibold text-accent-fg disabled:opacity-60"
            >
              {text("profile.changePassword")}
            </button>
          </form>
        </section>
        <button
          type="button"
          onClick={() => void signOut()}
          className="min-h-11 rounded-2xl bg-surface text-[15px] font-semibold text-danger shadow-[var(--shadow-float)]"
        >
          {text("profile.signOut")}
        </button>
          </div>
        </div>
      </div>
      {cropUrl && cropBlob ? (
        <ImageCropDialog
          src={cropUrl}
          blob={cropBlob}
          open
          onClose={closeCrop}
          onApply={(blob) => void onCropped(blob)}
        />
      ) : null}
    </div>
  );
}

function LanguageOption({
  value,
  selected,
  onSelect,
}: {
  value: Locale;
  selected: boolean;
  onSelect: (value: Locale) => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={() => onSelect(value)}
      className={cn(
        "min-h-11 rounded-xl text-[15px] font-semibold",
        selected ? "bg-surface text-ink shadow-[var(--shadow-float)]" : "text-ink-secondary",
      )}
    >
      {text(value === "sr" ? "profile.languageSr" : "profile.languageEn")}
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-[13px] font-semibold text-ink-secondary">
      {label}
      <input
        type="text"
        value={value}
        autoComplete={autoComplete}
        required
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 rounded-2xl bg-surface-2 px-3 text-[16px] font-medium text-ink outline-none"
      />
    </label>
  );
}

function loadImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(text("media.notLoaded")));
    };
    image.src = url;
  });
}

async function fitAvatar(source: Blob): Promise<Blob> {
  const image = await loadImage(source);
  const max = 512;
  const scale = Math.min(1, max / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error(text("profile.photoFailed"));
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", 0.9);
  });
  if (!blob) throw new Error(text("media.notSaved"));
  return blob;
}
