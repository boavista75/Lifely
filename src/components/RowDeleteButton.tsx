import { IconClose } from "@/components/icons";

export function RowDeleteButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className="icon-btn shrink-0 text-ink-tertiary hover:text-danger"
    >
      <IconClose className="size-[18px]" />
    </button>
  );
}
