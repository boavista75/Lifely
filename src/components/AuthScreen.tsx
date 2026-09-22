import { PasswordInput } from "@/components/PasswordInput";
import { text } from "@/i18n";
import { useSessionStore } from "@/store/useSessionStore";
import { useState, type FormEvent } from "react";

export function AuthScreen() {
  const phase = useSessionStore((state) => state.phase);
  const message = useSessionStore((state) => state.message);
  const signIn = useSessionStore((state) => state.signIn);
  const signUp = useSessionStore((state) => state.signUp);
  const restore = useSessionStore((state) => state.restore);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [identifier, setIdentifier] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const result =
      mode === "login"
        ? await signIn(identifier, password)
        : await signUp({ username, email, password });
    setPending(false);
    if (result) setError(result);
  }

  return (
    <div className="grid min-h-full place-items-center bg-canvas px-4 py-10 text-ink">
      <div className="w-full max-w-[420px]">
        <h1 className="page-title mb-6 text-center">Lifely</h1>
        <div className="rounded-3xl bg-surface p-5 shadow-[var(--shadow-float)]">
          <div className="mb-4 grid grid-cols-2 gap-1 rounded-2xl bg-surface-2 p-1">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError(null);
              }}
              className={
                mode === "login"
                  ? "min-h-11 rounded-xl bg-accent text-[15px] font-semibold text-accent-fg"
                  : "min-h-11 rounded-xl text-[15px] font-semibold text-ink-secondary"
              }
            >
              {text("auth.signIn")}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setError(null);
              }}
              className={
                mode === "register"
                  ? "min-h-11 rounded-xl bg-accent text-[15px] font-semibold text-accent-fg"
                  : "min-h-11 rounded-xl text-[15px] font-semibold text-ink-secondary"
              }
            >
              {text("auth.register")}
            </button>
          </div>
          <form className="flex flex-col gap-3" onSubmit={(event) => void onSubmit(event)}>
            {mode === "login" ? (
              <Field
                label={text("auth.identifier")}
                value={identifier}
                autoComplete="username"
                onChange={setIdentifier}
              />
            ) : (
              <>
                <Field
                  label={text("auth.username")}
                  value={username}
                  autoComplete="username"
                  onChange={setUsername}
                />
                <Field
                  label={text("auth.email")}
                  type="email"
                  value={email}
                  autoComplete="email"
                  onChange={setEmail}
                />
              </>
            )}
            <label className="flex flex-col gap-1 text-[13px] font-semibold text-ink-secondary">
              {text("auth.password")}
              <PasswordInput
                value={password}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                onChange={setPassword}
              />
            </label>
            {mode === "register" ? (
              <p className="text-[13px] text-ink-tertiary">{text("auth.passwordHint")}</p>
            ) : null}
            {error ? <p className="text-[14px] text-danger">{error}</p> : null}
            {phase === "offline" ? <p className="text-[14px] text-danger">{message}</p> : null}
            <button
              type="submit"
              disabled={pending}
              className="mt-1 min-h-11 rounded-2xl bg-accent text-[15px] font-semibold text-accent-fg disabled:opacity-60"
            >
              {pending ? text("auth.wait") : mode === "login" ? text("auth.submitSignIn") : text("auth.submitRegister")}
            </button>
            {phase === "offline" ? (
              <button
                type="button"
                onClick={() => void restore()}
                className="min-h-11 rounded-2xl text-[15px] font-semibold text-ink-secondary"
              >
                {text("auth.retry")}
              </button>
            ) : null}
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  autoComplete: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-[13px] font-semibold text-ink-secondary">
      {label}
      <input
        type={type}
        value={value}
        autoComplete={autoComplete}
        required
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 rounded-2xl bg-surface-2 px-3 text-[16px] font-medium text-ink outline-none"
      />
    </label>
  );
}
