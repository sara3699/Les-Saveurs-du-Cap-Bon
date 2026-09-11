/**
 * The contract between this product and whatever reads a receipt.
 *
 * A provider returns text and says how sure it is. It does not decide what "TOTAL TTC"
 * means, because that knowledge belongs in `src/lib/receipts/extract.ts` where it can
 * be tested without a network and kept when the provider is replaced.
 *
 * Two implementations exist. `demo` invents a receipt deterministically from the file's
 * own hash and says so, loudly, on every screen that shows its output. `google` calls
 * Cloud Vision. Nothing else in the application knows which one it is talking to.
 */

export interface OcrRequest {
  bytes: Uint8Array;
  mime: string;
  fileName: string | null;
  /** Stable per file. The demonstration reader uses it to answer the same way twice. */
  fileHash: string;
}

export interface OcrResult {
  /** Recorded on the receipt, so a reader can be told apart later. */
  provider: string;
  rawText: string;
  /** 0 to 1. How sure the reader is it read the characters correctly. */
  confidence: number;
  /** True when no live service was involved. Drives the "Mode démonstration" label. */
  demo: boolean;
}

export interface OcrProvider {
  name: string;
  demo: boolean;
  /** Formats this reader can actually handle. Anything else is refused, not attempted. */
  accepts(mime: string): boolean;
  extract(request: OcrRequest): Promise<OcrResult>;
}

/**
 * Thrown when a reader cannot do the job: a format it does not take, a key that was
 * refused, a service that did not answer. The message is French and goes straight onto
 * the receipt, so it has to be something a shopkeeper can act on.
 */
export class OcrUnavailable extends Error {
  readonly frenchMessage: string;

  constructor(frenchMessage: string, cause?: unknown) {
    super(frenchMessage);
    this.name = "OcrUnavailable";
    this.frenchMessage = frenchMessage;
    this.cause = cause;
  }
}
