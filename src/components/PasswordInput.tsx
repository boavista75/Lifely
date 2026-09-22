import { IconEye, IconEyeOff } from "@/components/icons";
import { text } from "@/i18n";
import { useState } from "react";

export function PasswordInput({
  value,
  onChange,
  autoComplete,
}: {
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
}) {
  const [shown, setShown] = useState(false);

  return (
    <div className="relative">
      <input
        type={shown ? "text" : "password"}
        value={value}
        autoComplete={autoComplete}
        required
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 w-full rounded-2xl bg-surface-2 px-3 pr-12 text-[16px] font-medium text-ink outline-none"
      />
      <button
        type="button"
        aria-pressed={shown}
        aria-label={shown ? text("password.hide") : text("password.show")}
        onClick={() => setShown((value) => !value)}
        className="absolute top-1/2 right-1 grid size-9 -translate-y-1/2 place-items-center rounded-full text-ink-secondary hover:text-ink"
      >
        {shown ? <IconEyeOff className="size-[18px]" /> : <IconEye className="size-[18px]" />}
      </button>
    </div>
  );
}
