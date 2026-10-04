export interface ScreenshotMetadata {
  experimentId?: string;
  year?: number;
  seed?: number;
  tick?: number;
  capturedAt?: string;
  [key: string]: unknown;
}

export interface ScreenshotOptions {
  filename?: string;
  includeMetadata?: boolean;
  metadata?: ScreenshotMetadata;
  mimeType?: "image/png" | "image/jpeg" | "image/webp";
  quality?: number;
  download?: boolean;
}

export interface ScreenshotResult {
  blob: Blob | null;
  dataUrl: string;
  filename: string;
  metadata?: ScreenshotMetadata;
}

function safeName(name: string): string {
  return name.replace(/[^a-z0-9._-]+/gi, "-").replace(/^-+|-+$/g, "") || "ai-evolution-frame";
}

/** Capture a canvas without adding UI overlays to the source surface. */
export async function captureCanvasFrame(canvas: HTMLCanvasElement, options: ScreenshotOptions = {}): Promise<ScreenshotResult> {
  const mimeType = options.mimeType ?? "image/png";
  const dataUrl = typeof canvas.toDataURL === "function" ? canvas.toDataURL(mimeType, options.quality) : "";
  const blob = typeof canvas.toBlob === "function"
    ? await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mimeType, options.quality))
    : null;
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `${safeName(options.filename ?? "ai-evolution-frame")}-${timestamp}.${mimeType.split("/")[1]}`;
  const metadata = options.includeMetadata ? { capturedAt: new Date().toISOString(), ...(options.metadata ?? {}) } : undefined;
  if (options.download !== false) downloadBlobOrDataUrl(blob, dataUrl, filename);
  return { blob, dataUrl, filename, metadata };
}

export function downloadBlobOrDataUrl(blob: Blob | null, dataUrl: string, filename: string): void {
  if (typeof document === "undefined") return;
  const anchor = document.createElement("a");
  anchor.download = filename;
  anchor.href = blob ? URL.createObjectURL(blob) : dataUrl;
  anchor.rel = "noopener";
  anchor.style.display = "none";
  document.body?.appendChild(anchor);
  anchor.click();
  const schedule = typeof window !== "undefined" ? window.setTimeout.bind(window) : setTimeout;
  schedule(() => {
    anchor.remove();
    if (blob) URL.revokeObjectURL(anchor.href);
  }, 0);
}

/** Download metadata as a sidecar JSON file when requested by a presentation UI. */
export function downloadScreenshotMetadata(metadata: ScreenshotMetadata, filename = "ai-evolution-frame.json"): void {
  if (typeof document === "undefined") return;
  const blob = new Blob([JSON.stringify(metadata, null, 2)], { type: "application/json" });
  downloadBlobOrDataUrl(blob, "", safeName(filename));
}

export const captureFrame = captureCanvasFrame;
