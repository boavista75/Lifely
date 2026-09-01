import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function base(props: IconProps) {
  return {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    ...props,
  };
}

export function IconCalendar(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 10h17" />
      <path d="M8 3.5v4M16 3.5v4" />
    </svg>
  );
}

export function IconTodo(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M9.5 6.5h11" />
      <path d="M9.5 12h11" />
      <path d="M9.5 17.5h11" />
      <path d="M3.8 6.5l1.4 1.4 2.4-2.8" />
      <rect x="3.2" y="10.2" width="4.2" height="4.2" rx="1" />
      <path d="M3.8 17.6l1.4 1.4 2.4-2.8" />
    </svg>
  );
}

export function IconNotes(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M7 3.5h7.5L20.5 10v10.5A2 2 0 0 1 18.5 22.5h-11A2 2 0 0 1 5.5 20.5v-15A2 2 0 0 1 7 3.5Z" />
      <path d="M14.5 3.5V9h5.5" />
      <path d="M9 13.5h6.5M9 17.5h4.5" />
    </svg>
  );
}

export function IconKnowledge(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 19.5V6.8c0-.7.4-1.3 1-1.6L12 3l7 2.2c.6.3 1 .9 1 1.6v12.7" />
      <path d="M12 3v16.5" />
      <path d="M4 19.5c1.6-.8 3.4-1.2 8-1.2s6.4.4 8 1.2" />
    </svg>
  );
}

export function IconFinances(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v9" />
      <path d="M10 9.2h2.8a1.7 1.7 0 0 1 0 3.4H11a1.7 1.7 0 0 0 0 3.4h3" />
    </svg>
  );
}

export function IconLock(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="5.5" y="11" width="13" height="10" rx="2" />
      <path d="M8 11V8.2a4 4 0 0 1 8 0V11" />
    </svg>
  );
}

export function IconCard(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="6.5" width="18" height="12" rx="2.2" />
      <path d="M3 10.5h18" />
      <path d="M7 15h4" />
    </svg>
  );
}

export function IconCash(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3.5" y="6.5" width="17" height="11" rx="2" />
      <circle cx="12" cy="12" r="2.2" />
      <path d="M6.5 9.2v5.6M17.5 9.2v5.6" />
    </svg>
  );
}

export function IconBell(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6.2 16.5h11.6l-1.1-1.8c-.4-.7-.7-1.5-.7-2.3V10a4.2 4.2 0 1 0-8.4 0v2.4c0 .8-.3 1.6-.7 2.3l-1.1 1.8Z" />
      <path d="M10 16.5v.7a2 2 0 0 0 4 0v-.7" />
    </svg>
  );
}

export function IconChevron(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M15 5.5 8.5 12 15 18.5" />
    </svg>
  );
}

export function IconPlus(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 5.5v13M5.5 12h13" />
    </svg>
  );
}

export function IconCheck(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M5.5 12.5 10 17l8.5-9.5" />
    </svg>
  );
}

export function IconClose(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function IconFolder(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3.5 7.5A2 2 0 0 1 5.5 5.5h3.2l1.6 2H18.5A2 2 0 0 1 20.5 9.5v8A2 2 0 0 1 18.5 19.5h-13A2 2 0 0 1 3.5 17.5v-10Z" />
    </svg>
  );
}

export function IconFolderOpen(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3.5 10.5V7.8A2 2 0 0 1 5.4 5.8h3.1l1.5 1.8h4.2" />
      <path d="M3.6 10.5h14.2a2 2 0 0 1 1.95 2.45l-1.1 5.1A2 2 0 0 1 16.7 19.5H5.6A2.2 2.2 0 0 1 3.5 17.5v-7Z" />
    </svg>
  );
}

export function IconPage(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M7 3.5h7.5L20.5 10v10.5A2 2 0 0 1 18.5 22.5h-11A2 2 0 0 1 5.5 20.5v-15A2 2 0 0 1 7 3.5Z" />
      <path d="M14.5 3.5V9h5.5" />
    </svg>
  );
}

export function IconFile(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M7 3.5h7.5L20.5 10v10.5A2 2 0 0 1 18.5 22.5h-11A2 2 0 0 1 5.5 20.5v-15A2 2 0 0 1 7 3.5Z" />
      <path d="M14.5 3.5V9h5.5" />
      <path d="M9 13.5h6M9 17h4" />
    </svg>
  );
}

export function IconMove(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3.5 10.5h9" />
      <path d="m9 7 3.5 3.5L9 14" />
      <path d="M14 5.5h4.5A2 2 0 0 1 20.5 7.5v12a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2V16" />
    </svg>
  );
}

export function IconUpload(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 16.5V6.5" />
      <path d="M8 10 12 6l4 4" />
      <path d="M5 19.5h14" />
    </svg>
  );
}

export function IconDownload(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 6.5v10" />
      <path d="m8 12.5 4 4 4-4" />
      <path d="M5 19.5h14" />
    </svg>
  );
}

export function IconSearch(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="11" cy="11" r="6.25" />
      <path d="M15.8 15.8 20 20" />
    </svg>
  );
}

export function IconImage(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m3.8 16 4.4-4.4a1.5 1.5 0 0 1 2.1 0L16 17.5" />
      <circle cx="16.2" cy="9.2" r="1.3" />
    </svg>
  );
}

export function IconVideo(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3.5" y="6" width="12.5" height="12" rx="2" />
      <path d="M16 10.2 20.5 7.5v9L16 13.8" />
    </svg>
  );
}

export function IconCrop(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6 3.5v12.5h12.5" />
      <path d="M18 20.5V8H5.5" />
    </svg>
  );
}

export function IconAlignLeft(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 6.5h16M4 12h10M4 17.5h16" />
    </svg>
  );
}

export function IconAlignCenter(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 6.5h16M7 12h10M4 17.5h16" />
    </svg>
  );
}

export function IconAlignRight(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 6.5h16M10 12h10M4 17.5h16" />
    </svg>
  );
}

export function IconSun(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v1.6M12 19.4V21M4.2 4.2l1.1 1.1M18.7 18.7l1.1 1.1M3 12h1.6M19.4 12H21M4.2 19.8l1.1-1.1M18.7 5.3l1.1-1.1" />
    </svg>
  );
}

export function IconMoon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M16.5 13.2A6.4 6.4 0 0 1 10.8 4.8 7 7 0 1 0 19.2 14a6.3 6.3 0 0 1-2.7-.8Z" />
    </svg>
  );
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden>
      <rect width="32" height="32" rx="10" fill="var(--accent)" />
      <path
        d="M11.2 8.5h3.4c4.1 0 6.7 2.2 6.7 5.7 0 3.6-2.7 5.8-6.8 5.8H11.2V8.5Zm3.3 8.6c2.3 0 3.6-1.2 3.6-2.9s-1.3-2.8-3.6-2.8h-.7v5.7h.7Z"
        fill="var(--accent-fg)"
      />
      <circle cx="22.2" cy="22.2" r="2.1" fill="#cdcdcd" />
    </svg>
  );
}
