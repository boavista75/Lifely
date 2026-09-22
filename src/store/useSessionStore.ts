import { getLocale, isLocale, setLocale, text, type Locale } from "@/i18n";
import {
  changeLocale,
  changePassword,
  changeUsername,
  deleteAvatar,
  login,
  logout,
  register,
  fetchMe,
  uploadAvatar,
  type PublicUser,
} from "@/lib/api";
import { endCloud } from "@/lib/cloud";
import { setRemoteMedia } from "@/lib/media";
import { isProfilePath } from "@/lib/profile";
import { EMPTY_FINANCE_DATA } from "@/lib/finances";
import { hydrateApp, resetHydration } from "@/store/useBootStore";
import { useFinancesStore } from "@/store/useFinancesStore";
import { useItemsStore } from "@/store/useItemsStore";
import { useKbStore } from "@/store/useKbStore";
import { useNotesStore } from "@/store/useNotesStore";
import { create } from "zustand";

type Phase = "checking" | "anon" | "offline" | "booting" | "ready" | "error";

type SessionState = {
  phase: Phase;
  user: PublicUser | null;
  message: string;
  restore: () => Promise<void>;
  signIn: (identifier: string, password: string) => Promise<string | null>;
  signUp: (input: { username: string; email: string; password: string }) => Promise<string | null>;
  signOut: () => Promise<void>;
  updatePassword: (current: string, next: string) => Promise<string | null>;
  updateUsername: (username: string) => Promise<string | null>;
  updateAvatar: (blob: Blob) => Promise<string | null>;
  removeAvatar: () => Promise<string | null>;
  updateLocale: (locale: Locale) => Promise<string | null>;
};

const profileChannel =
  typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel("lifely-profile");

function applyAccountLocale(user: PublicUser): void {
  if (isLocale(user.locale)) setLocale(user.locale);
}

function publishUser(user: PublicUser): void {
  applyAccountLocale(user);
  useSessionStore.setState({ user });
  profileChannel?.postMessage({ user });
}

profileChannel?.addEventListener("message", (event: MessageEvent<{ user?: PublicUser }>) => {
  const next = event.data?.user;
  if (!next || typeof next.id !== "string" || typeof next.username !== "string") return;
  const current = useSessionStore.getState().user;
  if (!current || current.id !== next.id) return;
  const user = {
    id: next.id,
    username: next.username,
    email: typeof next.email === "string" ? next.email : current.email,
    avatarUpdatedAt: next.avatarUpdatedAt ?? null,
    locale: isLocale(next.locale) ? next.locale : current.locale,
  };
  applyAccountLocale(user);
  useSessionStore.setState({ user });
});

async function enter(user: PublicUser): Promise<void> {
  applyAccountLocale(user);
  if (isProfilePath()) {
    useSessionStore.setState({ phase: "ready", user, message: "" });
    return;
  }
  useSessionStore.setState({ phase: "booting", user, message: text("boot.loading") });
  try {
    await hydrateApp(user, (message) => {
      useSessionStore.setState({ message });
    });
    useSessionStore.setState({ phase: "ready", message: "" });
  } catch (error) {
    useSessionStore.setState({
      phase: "error",
      message: error instanceof Error ? error.message : text("boot.failed"),
    });
  }
}

function clearMemory(): void {
  endCloud();
  setRemoteMedia(null);
  resetHydration();
  useItemsStore.setState({ items: [] });
  useNotesStore.setState({ notes: [] });
  useKbStore.setState({ nodes: [] });
  useFinancesStore.setState({ ...EMPTY_FINANCE_DATA });
}

export const useSessionStore = create<SessionState>((set) => ({
  phase: "checking",
  user: null,
  message: "",

  restore: async () => {
    set({ phase: "checking", message: "" });
    try {
      const { user } = await fetchMe();
      if (!user) {
        set({ phase: "anon", user: null });
        return;
      }
      await enter(user);
    } catch {
      set({ phase: "offline", user: null, message: text("error.serverDown") });
    }
  },

  signIn: async (identifier, password) => {
    try {
      const { user } = await login(identifier.trim(), password);
      await enter(user);
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : text("error.signInFailed");
    }
  },

  signUp: async (input) => {
    try {
      const { user } = await register({
        username: input.username.trim().toLowerCase(),
        email: input.email.trim().toLowerCase(),
        password: input.password,
      });
      await enter(user);
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : text("error.signUpFailed");
    }
  },

  signOut: async () => {
    clearMemory();
    try {
      await logout();
    } catch {
      // Sesija na serveru može već biti istekla.
    }
    set({ phase: "anon", user: null, message: "" });
  },

  updatePassword: async (current, next) => {
    try {
      await changePassword(current, next);
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : text("error.passwordFailed");
    }
  },

  updateUsername: async (username) => {
    try {
      const { user } = await changeUsername(username.trim().toLowerCase());
      publishUser(user);
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : text("error.usernameFailed");
    }
  },

  updateAvatar: async (blob) => {
    try {
      publishUser(await uploadAvatar(blob));
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : text("error.avatarFailed");
    }
  },

  removeAvatar: async () => {
    try {
      publishUser(await deleteAvatar());
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : text("error.avatarRemoveFailed");
    }
  },

  updateLocale: async (locale) => {
    const previous = getLocale();
    setLocale(locale);
    try {
      const { user } = await changeLocale(locale);
      publishUser(user);
      return null;
    } catch (error) {
      setLocale(previous);
      return error instanceof Error ? error.message : text("error.localeFailed");
    }
  },
}));
