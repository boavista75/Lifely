import { ToolButton } from "@/components/RichEditorToolbar";
import {
  clampKbTextScale,
  KB_TEXT_SCALE_MAX,
  KB_TEXT_SCALE_MIN,
  KB_TEXT_SCALE_STEP,
} from "@/lib/kb";

export function KbTextScaleControl({
  scale,
  onChange,
}: {
  scale: number;
  onChange: (scale: number) => void;
}) {
  const current = clampKbTextScale(scale);
  const smaller = clampKbTextScale(current - KB_TEXT_SCALE_STEP);
  const larger = clampKbTextScale(current + KB_TEXT_SCALE_STEP);

  return (
    <>
      <ToolButton
        label="Smanji tekst na stranici"
        disabled={current <= KB_TEXT_SCALE_MIN}
        onClick={() => onChange(smaller)}
      >
        <span className="text-[12px] font-bold leading-none">A−</span>
      </ToolButton>
      <ToolButton
        label="Povećaj tekst na stranici"
        disabled={current >= KB_TEXT_SCALE_MAX}
        onClick={() => onChange(larger)}
      >
        <span className="text-[16px] font-bold leading-none">A+</span>
      </ToolButton>
    </>
  );
}
