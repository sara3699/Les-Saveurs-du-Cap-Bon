/**
 * What may be uploaded, and what it is really called.
 *
 * Three things matter here and each is checked separately, because any one of them
 * alone is a lie waiting to happen:
 *
 *  - the extension, which the person who took the photograph chose;
 *  - the media type, which their browser guessed;
 *  - the first few bytes, which the file cannot argue with.
 *
 * The name the file is stored under is generated here and never taken from the upload,
 * so nothing a filename contains can put the file anywhere but inside its own shop's
 * folder.
 */

export const MAX_RECEIPT_BYTES = 15 * 1024 * 1024;
/** Smaller than this is not a photograph of anything. */
export const MIN_RECEIPT_BYTES = 256;

export interface AllowedType {
  mime: string;
  extension: string;
  label: string;
  /** True when a browser can show it directly. HEIC cannot be shown by any of them. */
  previewable: boolean;
}

export const ALLOWED_TYPES: AllowedType[] = [
  { mime: "image/jpeg", extension: "jpg", label: "JPEG", previewable: true },
  { mime: "image/png", extension: "png", label: "PNG", previewable: true },
  { mime: "image/heic", extension: "heic", label: "HEIC", previewable: false },
  { mime: "image/heif", extension: "heif", label: "HEIF", previewable: false },
  { mime: "application/pdf", extension: "pdf", label: "PDF", previewable: true },
];

export const ACCEPT_ATTRIBUTE = ".jpg,.jpeg,.png,.heic,.heif,.pdf,image/jpeg,image/png,image/heic,image/heif,application/pdf";

/** Spellings browsers and phones actually send, mapped onto the five above. */
const MIME_ALIASES: Record<string, string> = {
  "image/jpg": "image/jpeg",
  "image/pjpeg": "image/jpeg",
  "image/x-png": "image/png",
  "image/heic-sequence": "image/heic",
  "image/heif-sequence": "image/heif",
  "application/x-pdf": "application/pdf",
};

const EXTENSION_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  heic: "image/heic",
  heif: "image/heif",
  pdf: "application/pdf",
};

export function canonicalMime(declared: string | null | undefined): string | null {
  if (!declared) return null;
  const clean = declared.split(";")[0].trim().toLowerCase();
  const resolved = MIME_ALIASES[clean] ?? clean;
  return ALLOWED_TYPES.some((type) => type.mime === resolved) ? resolved : null;
}

export function extensionOf(fileName: string | null | undefined): string | null {
  if (!fileName) return null;
  const match = fileName.toLowerCase().match(/\.([a-z0-9]{1,5})$/);
  return match ? match[1] : null;
}

function startsWith(bytes: Uint8Array, signature: number[]): boolean {
  if (bytes.length < signature.length) return false;
  return signature.every((byte, index) => bytes[index] === byte);
}

const HEIF_BRANDS = new Set([
  "heic", "heix", "hevc", "hevx", "heim", "heis", "hevm", "hevs", "mif1", "msf1", "avif",
]);

/**
 * The media type the bytes themselves say they are. Null when they say nothing we
 * accept, which is the answer for a renamed executable and for a truncated upload alike.
 */
export function sniffMime(bytes: Uint8Array): string | null {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (startsWith(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d])) return "application/pdf";

  // An ISO base media file: a length, then "ftyp", then the brand.
  if (bytes.length >= 12) {
    const boxType = String.fromCharCode(bytes[4], bytes[5], bytes[6], bytes[7]);
    if (boxType === "ftyp") {
      const brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]).toLowerCase();
      if (HEIF_BRANDS.has(brand)) return brand === "mif1" || brand === "msf1" ? "image/heif" : "image/heic";
    }
  }
  return null;
}

export interface FileVerdict {
  ok: boolean;
  mime: string | null;
  extension: string | null;
  previewable: boolean;
  /** French, shown to the person who tried to upload it. */
  error: string | null;
}

const TYPES_SENTENCE = "Formats acceptés : JPG, PNG, HEIC et PDF.";

export function validateReceiptFile(input: {
  fileName: string | null | undefined;
  declaredType: string | null | undefined;
  size: number;
  bytes: Uint8Array;
}): FileVerdict {
  const refuse = (error: string): FileVerdict => ({
    ok: false,
    mime: null,
    extension: null,
    previewable: false,
    error,
  });

  if (input.size > MAX_RECEIPT_BYTES) {
    return refuse("Ce fichier dépasse 15 Mo. Reprenez la photo en qualité normale, ou envoyez un PDF.");
  }
  if (input.size < MIN_RECEIPT_BYTES || input.bytes.length < MIN_RECEIPT_BYTES) {
    return refuse("Ce fichier est vide ou incomplet. Réessayez.");
  }
  if (input.bytes.length !== input.size) {
    return refuse("Le fichier reçu ne correspond pas à sa taille annoncée. Réessayez.");
  }

  const sniffed = sniffMime(input.bytes);
  if (!sniffed) {
    return refuse(`Ce fichier n'est pas une image ni un PDF lisible. ${TYPES_SENTENCE}`);
  }

  const extension = extensionOf(input.fileName);
  const declared = canonicalMime(input.declaredType);

  // HEIC and HEIF share their container, so they are allowed to disagree with each
  // other. Anything else that disagrees with its own bytes is refused.
  const family = (mime: string) => (mime === "image/heif" ? "image/heic" : mime);
  if (declared && family(declared) !== family(sniffed)) {
    return refuse(
      `Ce fichier est annoncé comme ${declared} mais son contenu est ${sniffed}. ${TYPES_SENTENCE}`,
    );
  }
  if (extension) {
    const byExtension = EXTENSION_MIME[extension];
    if (!byExtension) {
      return refuse(`L'extension « .${extension} » n'est pas acceptée. ${TYPES_SENTENCE}`);
    }
    if (family(byExtension) !== family(sniffed)) {
      return refuse(
        `Ce fichier se termine par « .${extension} » mais son contenu est ${sniffed}. ${TYPES_SENTENCE}`,
      );
    }
  }

  const type = ALLOWED_TYPES.find((entry) => entry.mime === sniffed)!;
  return { ok: true, mime: type.mime, extension: type.extension, previewable: type.previewable, error: null };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Where the file goes: the shop's own folder, the year, and a name nobody chose.
 *
 * The database checks the first segment against the caller's own shop, so a path built
 * anywhere else is refused rather than trusted.
 */
export function storagePath(input: {
  organizationId: string;
  extension: string;
  now?: Date;
  id?: string;
}): string {
  if (!UUID.test(input.organizationId)) {
    throw new Error("A receipt path needs a real organisation id.");
  }
  const extension = input.extension.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!ALLOWED_TYPES.some((type) => type.extension === extension)) {
    throw new Error(`Refusing to store a receipt as .${extension}`);
  }
  const year = (input.now ?? new Date()).getUTCFullYear();
  const id = input.id ?? crypto.randomUUID();
  if (!UUID.test(id)) throw new Error("A receipt file needs a generated name.");
  return `${input.organizationId}/${year}/${id}.${extension}`;
}

/** The fingerprint the unique index uses to make the same file unfileable twice. */
export async function hashBytes(bytes: Uint8Array): Promise<string> {
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  const digest = await crypto.subtle.digest("SHA-256", buffer as ArrayBuffer);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/** A shortened, harmless version of the uploaded name, kept only to show the person. */
export function displayFileName(fileName: string | null | undefined): string {
  if (!fileName) return "Reçu";
  const base = fileName.replace(/^.*[\\/]/, "").replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
  return base.trim().slice(0, 120) || "Reçu";
}
