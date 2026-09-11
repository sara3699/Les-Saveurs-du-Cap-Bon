"use client";

/**
 * Reading a QR code in the browser.
 *
 * Two readers, in order of preference. Chrome and Edge, on a computer and on Android,
 * have one built in, and using it costs nothing to download. Safari does not, and the
 * shop uses iPhones, so the second reader is ZXing compiled to WebAssembly, loaded from
 * this application rather than from a CDN and only when it is actually needed.
 *
 * Decoding here, in the browser, is only about speed: a code read by the camera arrives
 * instantly rather than after an upload. What the code *says* is decided on the server,
 * by `parseQrPayload`, which treats every byte of it as something a stranger printed.
 */

export type ReaderKind = "native" | "wasm" | "none";

interface DetectedBarcode {
  rawValue: string;
}

interface BarcodeDetectorLike {
  detect(source: CanvasImageSource | Blob | ImageData): Promise<DetectedBarcode[]>;
}

interface BarcodeDetectorConstructor {
  new (options?: { formats?: string[] }): BarcodeDetectorLike;
  getSupportedFormats?: () => Promise<string[]>;
}

export interface QrReader {
  kind: ReaderKind;
  /** The decoded string, or null when there is no code in this picture. */
  decode(source: ImageData | Blob): Promise<string | null>;
}

function nativeDetector(): BarcodeDetectorConstructor | null {
  if (typeof window === "undefined") return null;
  const candidate = (window as unknown as { BarcodeDetector?: BarcodeDetectorConstructor })
    .BarcodeDetector;
  return typeof candidate === "function" ? candidate : null;
}

async function nativeReader(): Promise<QrReader | null> {
  const Detector = nativeDetector();
  if (!Detector) return null;
  try {
    const formats = (await Detector.getSupportedFormats?.()) ?? [];
    if (formats.length > 0 && !formats.includes("qr_code")) return null;
    const detector = new Detector({ formats: ["qr_code"] });
    return {
      kind: "native",
      async decode(source) {
        // Chrome's detector takes pixels, and refuses a file outright, so a file is
        // decoded into pixels first. Camera frames already arrive as pixels.
        let bitmap: ImageBitmap | null = null;
        try {
          const pixels = source instanceof Blob ? (bitmap = await createImageBitmap(source)) : source;
          const found = await detector.detect(pixels);
          return found[0]?.rawValue ?? null;
        } catch {
          return null;
        } finally {
          bitmap?.close();
        }
      },
    };
  } catch {
    return null;
  }
}

async function wasmReader(): Promise<QrReader | null> {
  try {
    const { prepareZXingModule, readBarcodes } = await import("zxing-wasm/reader");
    prepareZXingModule({
      // Served from this application. Nothing here reaches a third party.
      overrides: { locateFile: (path: string) => (path.endsWith(".wasm") ? "/zxing/zxing_reader.wasm" : path) },
    });
    return {
      kind: "wasm",
      async decode(source) {
        try {
          const found = await readBarcodes(source, {
            formats: ["QRCode"],
            tryHarder: true,
            maxNumberOfSymbols: 1,
          });
          const first = found.find((result) => result.isValid);
          return first?.text ?? null;
        } catch {
          return null;
        }
      },
    };
  } catch {
    return null;
  }
}

let pending: Promise<QrReader> | null = null;

/**
 * One reader per page, built the first time something asks for it. When neither is
 * available the result reads codes as nothing at all, and the screen says so rather
 * than looking broken.
 */
export function qrReader(): Promise<QrReader> {
  if (!pending) {
    pending = (async () => {
      return (await nativeReader()) ?? (await wasmReader()) ?? { kind: "none", decode: async () => null };
    })();
  }
  return pending;
}

/** Whether a camera can be opened at all. Asked before a button offers to open one. */
export function cameraIsPossible(): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.mediaDevices?.getUserMedia === "function" &&
    // getUserMedia needs a secure context, which localhost also counts as.
    (typeof window === "undefined" || window.isSecureContext)
  );
}

/** A still frame, as a JPEG, ready to be uploaded. */
export function frameToJpeg(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
): Promise<Blob | null> {
  const width = video.videoWidth;
  const height = video.videoHeight;
  if (width === 0 || height === 0) return Promise.resolve(null);
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return Promise.resolve(null);
  context.drawImage(video, 0, 0, width, height);
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
}

/** The pixels a reader looks at, scaled down so a decode is quick enough to loop. */
export function frameToImageData(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  longestSide = 720,
): ImageData | null {
  const width = video.videoWidth;
  const height = video.videoHeight;
  if (width === 0 || height === 0) return null;
  const scale = Math.min(1, longestSide / Math.max(width, height));
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  return context.getImageData(0, 0, canvas.width, canvas.height);
}
