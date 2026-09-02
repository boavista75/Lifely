export const SIDEBAR_WIDTH_DEFAULT = 248;
export const SIDEBAR_WIDTH_MIN = 248;
export const SIDEBAR_WIDTH_MAX = 440;
export const MAIN_PANE_MIN = 400;
export const SIDEBAR_WIDTH_STEP = 16;

export function viewportWidth(): number {
  return typeof window === "undefined" ? 1280 : window.innerWidth;
}

export function sidebarWidthMax(viewport = viewportWidth()): number {
  return Math.min(
    SIDEBAR_WIDTH_MAX,
    Math.max(SIDEBAR_WIDTH_MIN, viewport - MAIN_PANE_MIN),
  );
}

export function clampSidebarWidth(
  width: number,
  viewport = viewportWidth(),
): number {
  const max = sidebarWidthMax(viewport);
  if (!Number.isFinite(width)) {
    return Math.min(max, SIDEBAR_WIDTH_DEFAULT);
  }
  return Math.round(Math.min(max, Math.max(SIDEBAR_WIDTH_MIN, width)));
}
