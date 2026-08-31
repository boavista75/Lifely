import { cn } from "@/lib/cn";
import { useIsDesktop } from "@/hooks/useMediaQuery";
import { useEffect, useLayoutEffect, useRef } from "react";

const ITEM_H = 40;
const VISIBLE = 5;
const WHEEL_H = ITEM_H * VISIBLE;
const PAD = (WHEEL_H - ITEM_H) / 2;

const HOURS = Array.from({ length: 24 }, (_, i) =>
  String(i).padStart(2, "0"),
);
const MINUTES = Array.from({ length: 12 }, (_, i) =>
  String(i * 5).padStart(2, "0"),
);

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

export function TimePicker({ label, value, onChange }: Props) {
  const [hour = "09", minute = "00"] = value.split(":");
  const hourValue = hour.padStart(2, "0");
  const minuteValue = snapMinute(minute);

  function setHour(next: string) {
    onChange(`${next}:${minuteValue}`);
  }

  function setMinute(next: string) {
    onChange(`${hourValue}:${next}`);
  }

  return (
    <div>
      <span className="mb-1.5 block text-[13px] font-medium text-ink-secondary">
        {label}
      </span>
      <div className="overflow-hidden rounded-2xl bg-surface-2/90">
        <p className="pt-3 text-center text-[15px] font-semibold tabular text-ink">
          {hourValue}:{minuteValue}
        </p>
        <div className="relative flex px-2 pb-2">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-2 top-1/2 z-10 h-10 -translate-y-1/2 rounded-lg bg-ink/[0.06]"
          />
          <Wheel
            label="Sat"
            values={HOURS}
            value={hourValue}
            onChange={setHour}
          />
          <span className="relative z-20 flex h-[200px] items-center text-[20px] font-medium text-ink-tertiary">
            :
          </span>
          <Wheel
            label="Minut"
            values={MINUTES}
            value={minuteValue}
            onChange={setMinute}
          />
        </div>
      </div>
    </div>
  );
}

function Wheel({
  label,
  values,
  value,
  onChange,
}: {
  label: string;
  values: readonly string[];
  value: string;
  onChange: (value: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const skip = useRef(false);
  const isDesktop = useIsDesktop();

  valueRef.current = value;
  onChangeRef.current = onChange;

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const index = Math.max(0, values.indexOf(value));
    skip.current = true;
    node.scrollTop = index * ITEM_H;
    requestAnimationFrame(() => {
      skip.current = false;
    });
  }, [value, values]);

  useEffect(() => {
    if (!isDesktop) return;
    const node = ref.current;
    if (!node) return;

    function onWheel(event: WheelEvent) {
      if (event.ctrlKey) return;
      event.preventDefault();
      event.stopPropagation();
      const dir = Math.sign(event.deltaY);
      if (dir === 0) return;
      const current = valueRef.current;
      const index = values.indexOf(current);
      const nextIndex = Math.min(Math.max(index + dir, 0), values.length - 1);
      const next = values[nextIndex];
      if (next && next !== current) onChangeRef.current(next);
    }

    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, [isDesktop, values]);

  function onScroll() {
    if (isDesktop) return;
    const node = ref.current;
    if (!node || skip.current) return;
    const index = Math.round(node.scrollTop / ITEM_H);
    const next = values[Math.min(Math.max(index, 0), values.length - 1)];
    if (next && next !== value) onChange(next);
  }

  return (
    <div
      ref={ref}
      role="listbox"
      aria-label={label}
      aria-activedescendant={`${label}-${value}`}
      onScroll={onScroll}
      className={cn(
        "relative z-20 h-[200px] min-w-0 flex-1 overscroll-contain no-scrollbar",
        isDesktop
          ? "overflow-hidden"
          : "snap-y snap-mandatory overflow-y-auto",
      )}
    >
      <div className="shrink-0" style={{ height: PAD }} />
      {values.map((entry) => {
        const selected = entry === value;
        return (
          <button
            key={entry}
            id={`${label}-${entry}`}
            type="button"
            role="option"
            aria-selected={selected}
            onClick={() => onChange(entry)}
            className={cn(
              "flex h-10 w-full snap-center items-center justify-center text-[20px] tabular transition-colors",
              selected ? "font-semibold text-ink" : "text-ink-tertiary",
            )}
          >
            {entry}
          </button>
        );
      })}
      <div className="shrink-0" style={{ height: PAD }} />
    </div>
  );
}

function snapMinute(minute: string): string {
  const n = Number(minute);
  if (Number.isNaN(n)) return "00";
  const snapped = Math.round(n / 5) * 5;
  const wrapped = snapped === 60 ? 55 : snapped;
  return String(wrapped).padStart(2, "0");
}
