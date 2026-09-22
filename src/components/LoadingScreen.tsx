import { text } from "@/i18n";

export function LoadingScreen() {
  return (
    <div
      className="pane-loader"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="pane-loader__inner">
        <span className="pane-loader__spinner" />
        <p className="pane-loader__label">{text("common.loading")}</p>
      </div>
    </div>
  );
}
