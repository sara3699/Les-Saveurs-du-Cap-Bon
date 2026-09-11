import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Reading a QR code off a file the server already holds.
 *
 * The browser reads codes too, in `scan.ts`, and that is for speed: a code caught by
 * the camera appears instantly instead of after an upload. This file is the one that
 * matters for correctness. A receipt's QR code is a tax artefact, the browser is a
 * stranger's machine, and the server has the bytes in hand anyway because it is about
 * to send them to a reader. So the server looks for itself.
 *
 * It covers two things the browser cannot:
 *
 *  - **PDFs.** The browser cannot read a code inside a PDF at all, and PDFs are how
 *    suppliers send invoices.
 *  - **A browser that missed one.** An old browser, a blocked WebAssembly file, a
 *    photograph the camera path never saw.
 *
 * Nothing here decides what a code MEANS. Whatever it finds goes through
 * `parseQrPayload` like every other byte, which is where the length cap, the scheme
 * allowlist and the private-network refusal live.
 *
 * Server only. Never import this from a client component: it reads the filesystem, and
 * the WebAssembly reader it sets up is process-global, so the browser copy in `scan.ts`
 * and this one must never meet.
 */

const QR_ONLY = { formats: ["QRCode" as const], tryHarder: true, maxNumberOfSymbols: 1 };

/** A receipt is one or two pages. A forty-page PDF is not a receipt, and rendering it would cost real money. */
const MAX_PAGES = 3;
/** Above this, an image is a scanning artefact or an attack, not a photograph of a till roll. */
const MAX_PIXELS = 40_000_000;
/** Enough that a dense code on a small receipt still lands on several pixels a module. */
const RENDER_DPI = 200;

/** Formats the reader can decode from their own bytes. It cannot decode HEIC. */
const READABLE_IMAGES = new Set(["image/jpeg", "image/png"]);

/**
 * Both readers want their WebAssembly from the filesystem, because a serverless function
 * has no page to fetch one from and neither should be pulled off somebody else's CDN on
 * every receipt.
 *
 * Every path here is written out in full, on purpose. A path the compiler cannot read
 * makes the deployment give up and trace the entire project into the function, which it
 * warns about and which costs far more than the two files actually wanted.
 * `next.config.ts` names these same paths so they survive the trip.
 */
function zxingWasm(): Buffer {
  try {
    return readFileSync(
      join(process.cwd(), "node_modules/zxing-wasm/dist/reader/zxing_reader.wasm"),
    );
  } catch {
    // scripts/copy-zxing.mjs puts a copy here before every dev and build.
    return readFileSync(join(process.cwd(), "public/zxing/zxing_reader.wasm"));
  }
}

function pdfiumWasm(): Buffer {
  return readFileSync(join(process.cwd(), "node_modules/@hyzyla/pdfium/dist/pdfium.wasm"));
}

function toArrayBuffer(buffer: Buffer): ArrayBuffer {
  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  ) as ArrayBuffer;
}

type Reader = typeof import("zxing-wasm/reader");

let readerOnce: Promise<Reader> | null = null;

function reader(): Promise<Reader> {
  readerOnce ??= (async () => {
    const zxing = await import("zxing-wasm/reader");
    zxing.prepareZXingModule({
      overrides: {
        wasmBinary: toArrayBuffer(zxingWasm()),
      },
    });
    return zxing;
  })();
  return readerOnce;
}

let pdfiumOnce: Promise<{ loadDocument(bytes: Uint8Array): Promise<PdfDocument> }> | null = null;

interface PdfPage {
  render(options: {
    scale: number;
    colorSpace: "Gray" | "BGRA";
    transparent: boolean;
    render: (options: { data: Uint8Array }) => Uint8Array;
  }): Promise<{ data: Uint8Array; width: number; height: number }>;
}

interface PdfDocument {
  getPage(index: number): PdfPage;
  getPageCount(): number;
  destroy(): void;
}

function pdfium() {
  pdfiumOnce ??= (async () => {
    const { PDFiumLibrary } = await import("@hyzyla/pdfium");
    // The base64 build is compiled for browsers and refuses to start under Node, so
    // the binary is read from disk. Kept for the life of the process: starting it
    // costs about thirty milliseconds and nothing about it is per-request.
    return (await PDFiumLibrary.init({
      wasmBinary: toArrayBuffer(pdfiumWasm()),
    })) as unknown as { loadDocument(bytes: Uint8Array): Promise<PdfDocument> };
  })();
  return pdfiumOnce;
}

/** The reader wants four bytes a pixel and throws the fourth away. Anything narrower reads as a sheared image. */
function toRgba(
  data: Uint8Array | Uint8ClampedArray,
  width: number,
  height: number,
  channels: number,
): Uint8ClampedArray {
  if (channels === 4) return new Uint8ClampedArray(data.buffer.slice(0) as ArrayBuffer);
  const out = new Uint8ClampedArray(width * height * 4);
  for (let pixel = 0; pixel < width * height; pixel += 1) {
    const at = pixel * 4;
    if (channels === 1) {
      out[at] = out[at + 1] = out[at + 2] = data[pixel];
    } else {
      out[at] = data[pixel * 3];
      out[at + 1] = data[pixel * 3 + 1];
      out[at + 2] = data[pixel * 3 + 2];
    }
    out[at + 3] = 255;
  }
  return out;
}

async function decode(input: Uint8Array | { data: Uint8ClampedArray; width: number; height: number }) {
  const { readBarcodes } = await reader();
  const found = await readBarcodes(input as Uint8Array, QR_ONLY);
  const hit = found.find((result) => result.isValid && result.text !== "");
  return hit?.text ?? null;
}

/**
 * A photograph. The reader decodes JPEG and PNG itself, so the stored bytes go
 * straight in. HEIC is not something it can open, and is not attempted.
 */
export async function scanImageForQr(bytes: Uint8Array, mime: string): Promise<string | null> {
  if (!READABLE_IMAGES.has(mime)) return null;
  try {
    return await decode(bytes);
  } catch {
    return null;
  }
}

/**
 * A PDF, in two passes.
 *
 * First the pictures inside it are pulled out and read at their own resolution. That
 * catches a scanned receipt and anything produced by printing a web page, and it is
 * cheap because nothing is drawn.
 *
 * A code drawn as vector shapes leaves no picture to pull out, and that is not a rare
 * shape: the PHP invoicing software common in France and North Africa draws it that
 * way. So when the first pass finds nothing, the page is actually rendered and read.
 */
export async function scanPdfForQr(bytes: Uint8Array): Promise<string | null> {
  try {
    const { extractImages, getDocumentProxy } = await import("unpdf");
    // Its own copy. This reader hands the buffer to a worker, which detaches it, and a
    // detached buffer reaches the next reader as nothing at all. That failure looks
    // exactly like a PDF with no code in it, which is the worst way for it to fail.
    const proxy = await getDocumentProxy(new Uint8Array(bytes));
    const pages = Math.min(proxy.numPages, MAX_PAGES);
    for (let page = 1; page <= pages; page += 1) {
      const images = await extractImages(proxy, page);
      for (const image of images) {
        if (image.width * image.height > MAX_PIXELS) continue;
        const found = await decode({
          data: toRgba(image.data, image.width, image.height, image.channels),
          width: image.width,
          height: image.height,
        });
        if (found) return found;
      }
    }
  } catch {
    // Fall through to drawing the page.
  }

  let document: PdfDocument | null = null;
  try {
    const library = await pdfium();
    document = await library.loadDocument(new Uint8Array(bytes));
    const pages = Math.min(document.getPageCount(), MAX_PAGES);
    for (let index = 0; index < pages; index += 1) {
      const shot = await document.getPage(index).render({
        scale: RENDER_DPI / 72,
        // Grey is a quarter of the bytes of colour and needs no channel reordering.
        colorSpace: "Gray",
        // A transparent background reads as solid black, and then nothing decodes.
        transparent: false,
        render: (options) => options.data,
      });
      if (shot.width * shot.height > MAX_PIXELS) continue;
      const found = await decode({
        data: toRgba(shot.data, shot.width, shot.height, 1),
        width: shot.width,
        height: shot.height,
      });
      if (found) return found;
    }
  } catch {
    return null;
  } finally {
    try {
      document?.destroy();
    } catch {
      // Nothing useful to do if it was already gone.
    }
  }

  return null;
}

/** The one entry point the upload pipeline calls. Returns the raw string, never a verdict on it. */
export async function scanFileForQr(bytes: Uint8Array, mime: string): Promise<string | null> {
  if (mime === "application/pdf") return scanPdfForQr(bytes);
  return scanImageForQr(bytes, mime);
}
