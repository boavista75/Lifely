import { IconChevron } from "@/components/icons";
import { KbDownloadButton } from "@/components/KbDownloadButton";
import { ToolButton } from "@/components/RichEditorToolbar";
import { cn } from "@/lib/cn";
import { KB_FILE_UNOPENABLE } from "@/lib/kbFilePreview";
import {
  applyLineOverrides,
  bakePdfEdits,
  clampPdfZoom,
  linesFromTextItems,
  mergePdfLines,
  parsePdfEdits,
  pdfBytesToBlob,
  PDF_ZOOM_DEFAULT,
  PDF_ZOOM_MAX,
  PDF_ZOOM_MIN,
  PDF_ZOOM_STEP,
  serializePdfEdits,
  type PdfTextLine,
} from "@/lib/kbPdf";
import { loadMedia, saveMediaMany } from "@/lib/media";
import { useKbStore } from "@/store/useKbStore";
import { useUiStore } from "@/store/useUiStore";
import type { LifelyKbFile } from "@/types";
import {
  getDocument,
  GlobalWorkerOptions,
  type PDFDocumentProxy,
  type PDFPageProxy,
  type RenderTask,
} from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";

GlobalWorkerOptions.workerSrc = workerSrc;

export function KbPdfEditor({ fileId }: { fileId: string }) {
  const nodes = useKbStore((state) => state.nodes);
  const file = nodes.find(
    (node): node is LifelyKbFile => node.id === fileId && node.kind === "file",
  );
  const updateNode = useKbStore((state) => state.updateNode);
  const closeKbPage = useUiStore((state) => state.closeKbPage);
  const requestDeleteKb = useUiStore((state) => state.requestDeleteKb);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sourceRef = useRef<Uint8Array | null>(null);
  const linesRef = useRef<PdfTextLine[]>([]);
  const overridesRef = useRef<Record<string, string>>({});
  const saveTimer = useRef<number | null>(null);
  const persistGen = useRef(0);
  const persistRef = useRef<() => Promise<void>>(async () => {});
  const pdfRef = useRef<PDFDocumentProxy | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [pageWidth, setPageWidth] = useState(0);
  const [fit, setFit] = useState(1);
  const [zoom, setZoom] = useState(PDF_ZOOM_DEFAULT);
  const [lines, setLines] = useState<PdfTextLine[]>([]);
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);

  linesRef.current = lines;
  overridesRef.current = overrides;

  const persist = useCallback(async () => {
    const source = sourceRef.current;
    const mediaId = file?.mediaId;
    if (!source || !file || !mediaId) return;
    const nextLines = applyLineOverrides(linesRef.current, overridesRef.current);
    const sidecar = serializePdfEdits(nextLines);
    try {
      const baked = await bakePdfEdits(source, nextLines);
      const blob = pdfBytesToBlob(baked);
      await saveMediaMany([{ id: mediaId, blob }]);
      sourceRef.current = baked;
      updateNode(file.id, { size: blob.size, content: sidecar || null });
    } catch {
      updateNode(file.id, { content: sidecar || null });
    }
  }, [file, updateNode]);
  persistRef.current = persist;

  const schedulePersist = useCallback(() => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      void persist();
    }, 700);
  }, [persist]);

  useEffect(() => {
    if (!file?.mediaId) return;
    const mediaId = file.mediaId;
    const saved = parsePdfEdits(
      useKbStore.getState().nodes.find(
        (node): node is LifelyKbFile => node.id === fileId && node.kind === "file",
      )?.content ?? null,
    );
    const gen = ++persistGen.current;
    let cancelled = false;
    let loadingTask: ReturnType<typeof getDocument> | null = null;

    async function load() {
      setLoading(true);
      setError(false);
      const blob = await loadMedia(mediaId);
      if (cancelled || persistGen.current !== gen) return;
      if (!blob) {
        setError(true);
        setLoading(false);
        return;
      }
      const bytes = new Uint8Array(await blob.arrayBuffer());
      const owned = bytes.slice();
      if (cancelled || persistGen.current !== gen) return;
      sourceRef.current = owned;
      loadingTask = getDocument({ data: bytes });
      const doc = await loadingTask.promise;
      if (cancelled || persistGen.current !== gen) {
        void loadingTask.destroy();
        return;
      }
      const extracted: PdfTextLine[] = [];
      for (let index = 0; index < doc.numPages; index += 1) {
        const page = await doc.getPage(index + 1);
        const content = await page.getTextContent();
        extracted.push(...linesFromTextItems(index, content.items));
      }
      if (cancelled || persistGen.current !== gen) {
        void doc.cleanup();
        return;
      }
      const first = await doc.getPage(1);
      const viewport = first.getViewport({ scale: 1 });
      setPdf((current) => {
        void current?.cleanup();
        pdfRef.current = doc;
        return doc;
      });
      setPageCount(doc.numPages);
      setPageWidth(viewport.width);
      setLines(mergePdfLines(extracted, saved));
      setOverrides({});
      setLoading(false);
    }

    void load().catch(() => {
      if (!cancelled && persistGen.current === gen) {
        setError(true);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      void loadingTask?.destroy();
    };
  }, [file?.id, file?.mediaId, fileId]);

  useEffect(() => {
    const host = scrollRef.current;
    if (!host || pageWidth <= 0) return;
    function update() {
      if (!host) return;
      setFit(Math.max(0.35, (host.clientWidth - 8) / pageWidth));
    }
    update();
    const observer = new ResizeObserver(update);
    observer.observe(host);
    return () => observer.disconnect();
  }, [pageWidth]);

  useEffect(() => {
    const host = scrollRef.current;
    if (!host) return;
    function onWheel(event: WheelEvent) {
      if (!event.ctrlKey) return;
      event.preventDefault();
      const direction = event.deltaY > 0 ? -PDF_ZOOM_STEP : PDF_ZOOM_STEP;
      setZoom((current) => clampPdfZoom(current + direction));
    }
    host.addEventListener("wheel", onWheel, { passive: false });
    return () => host.removeEventListener("wheel", onWheel);
  }, []);

  useEffect(() => {
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      void persistRef.current();
      void pdfRef.current?.cleanup();
      pdfRef.current = null;
    };
  }, []);

  if (!file) return null;

  const scale = fit * zoom;

  function onLineChange(id: string, value: string) {
    setOverrides((current) => ({ ...current, [id]: value }));
    schedulePersist();
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex shrink-0 items-center justify-between gap-2 px-2 pt-2 md:px-4 md:pt-5">
        <button
          type="button"
          onClick={closeKbPage}
          className="pressable inline-flex min-h-11 items-center gap-0.5 rounded-full px-2 text-[16px] text-accent"
        >
          <IconChevron className="size-5" />
          Knowledge
        </button>
        <div className="flex shrink-0 items-center">
          <KbDownloadButton
            nodeId={file.id}
            variant="label"
            beforeDownload={persist}
          />
          <button
            type="button"
            onClick={() => requestDeleteKb("kb-file", file.id)}
            className="pressable min-h-11 rounded-full px-3 text-[16px] text-danger"
          >
            Obriši
          </button>
        </div>
      </header>
      <input
        value={file.title}
        onChange={(event) => updateNode(file.id, { title: event.target.value })}
        className="w-full shrink-0 bg-transparent px-5 py-2 font-display text-[32px] font-semibold leading-tight tracking-[-0.03em] outline-none md:px-8"
      />
      <div className="shrink-0 px-3 pb-2 md:px-6">
        <div className="flex items-center gap-0.5 overflow-x-auto no-scrollbar rounded-2xl bg-surface-2/90 p-1">
          <ToolButton
            label="Smanji"
            disabled={zoom <= PDF_ZOOM_MIN}
            onClick={() => setZoom((current) => clampPdfZoom(current - PDF_ZOOM_STEP))}
          >
            <span className="text-[18px] font-semibold leading-none">−</span>
          </ToolButton>
          <span className="min-w-14 px-1 text-center text-[13px] tabular-nums text-ink-secondary">
            {Math.round(zoom * 100)}%
          </span>
          <ToolButton
            label="Povećaj"
            disabled={zoom >= PDF_ZOOM_MAX}
            onClick={() => setZoom((current) => clampPdfZoom(current + PDF_ZOOM_STEP))}
          >
            <span className="text-[18px] font-semibold leading-none">+</span>
          </ToolButton>
          <p className="ml-2 hidden text-[13px] text-ink-tertiary sm:block">
            {lines.length > 0 ? "Klikni na tekst da ga izmeniš" : "Prilagodi veličinu stranice"}
          </p>
        </div>
      </div>
      <div className="relative min-h-0 flex-1 overflow-hidden px-3 pb-4 md:px-6">
        {loading ? (
          <p className="absolute inset-0 z-10 grid place-items-center text-[15px] text-ink-secondary">
            Učitavanje…
          </p>
        ) : null}
        {error ? (
          <p className="pt-16 text-center text-[16px] text-ink-secondary">
            {KB_FILE_UNOPENABLE}
          </p>
        ) : (
          <div ref={scrollRef} className="kb-pdf-container absolute inset-x-3 inset-y-0 overflow-auto md:inset-x-6">
            {pdf
              ? Array.from({ length: pageCount }, (_, index) => (
                  <PdfPage
                    key={`${file.id}-${index}`}
                    pdf={pdf}
                    pageNumber={index + 1}
                    scale={scale}
                    lines={applyLineOverrides(lines, overrides).filter(
                      (line) => line.pageIndex === index,
                    )}
                    onLineChange={onLineChange}
                  />
                ))
              : null}
          </div>
        )}
      </div>
    </div>
  );
}

function PdfPage({
  pdf,
  pageNumber,
  scale,
  lines,
  onLineChange,
}: {
  pdf: PDFDocumentProxy;
  pageNumber: number;
  scale: number;
  lines: PdfTextLine[];
  onLineChange: (id: string, value: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [viewportScale, setViewportScale] = useState(1);
  const [page, setPage] = useState<PDFPageProxy | null>(null);

  useEffect(() => {
    let cancelled = false;
    void pdf.getPage(pageNumber).then((next) => {
      if (!cancelled) setPage(next);
    });
    return () => {
      cancelled = true;
    };
  }, [pageNumber, pdf]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!page || !canvas || scale <= 0) return;
    const viewport = page.getViewport({ scale });
    const outputScale = window.devicePixelRatio || 1;
    canvas.width = Math.floor(viewport.width * outputScale);
    canvas.height = Math.floor(viewport.height * outputScale);
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.setTransform(outputScale, 0, 0, outputScale, 0, 0);
    setSize({ width: viewport.width, height: viewport.height });
    setViewportScale(viewport.scale);
    let task: RenderTask | null = null;
    try {
      task = page.render({ canvasContext: context, canvas, viewport });
    } catch {
      return;
    }
    void task.promise.catch(() => undefined);
    return () => {
      task?.cancel();
    };
  }, [page, scale]);

  return (
    <div
      className="kb-pdf-page"
      style={{ width: size.width || undefined, height: size.height || undefined }}
    >
      <canvas ref={canvasRef} />
      {page
        ? lines.map((line) => (
            <PdfLineField
              key={line.id}
              line={line}
              page={page}
              scale={viewportScale || scale}
              onChange={onLineChange}
            />
          ))
        : null}
    </div>
  );
}

function PdfLineField({
  line,
  page,
  scale,
  onChange,
}: {
  line: PdfTextLine;
  page: PDFPageProxy;
  scale: number;
  onChange: (id: string, value: string) => void;
}) {
  const viewport = page.getViewport({ scale });
  const [x0, y0] = viewport.convertToViewportPoint(
    line.x,
    line.y + line.fontSize * 0.82,
  );
  const [x1, y1] = viewport.convertToViewportPoint(
    line.x + line.width,
    line.y - line.fontSize * 0.18,
  );
  const left = Math.min(x0, x1);
  const top = Math.min(y0, y1);
  const width = Math.max(8, Math.abs(x1 - x0));
  const height = Math.max(8, Math.abs(y1 - y0));
  const dirty = line.text !== line.original;

  return (
    <input
      value={line.text}
      tabIndex={-1}
      aria-label="Tekst u PDF-u"
      onChange={(event) => onChange(line.id, event.target.value)}
      className={cn("kb-pdf-line", dirty && "kb-pdf-line-dirty")}
      style={
        {
          left,
          top,
          width,
          height,
          fontSize: `${line.fontSize * scale}px`,
        } as CSSProperties
      }
    />
  );
}
