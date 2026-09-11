import { describe, expect, it } from "vitest";
import {
  MAX_RECEIPT_BYTES,
  canonicalMime,
  displayFileName,
  hashBytes,
  sniffMime,
  storagePath,
  validateReceiptFile,
} from "./files";

const ORG = "10f2108b-0e88-46ba-a9bb-d53550b0fbdb";

/** A file of the right shape at the front and padding behind, like a real upload. */
function fileOf(signature: number[], size = 2048): Uint8Array {
  const bytes = new Uint8Array(size);
  bytes.set(signature, 0);
  for (let index = signature.length; index < size; index += 1) bytes[index] = index % 251;
  return bytes;
}

const JPEG = fileOf([0xff, 0xd8, 0xff, 0xe0]);
const PNG = fileOf([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const PDF = fileOf([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]);
const HEIC = (() => {
  const bytes = fileOf([0x00, 0x00, 0x00, 0x18]);
  bytes.set([0x66, 0x74, 0x79, 0x70], 4); // "ftyp"
  bytes.set([0x68, 0x65, 0x69, 0x63], 8); // "heic"
  return bytes;
})();

describe("sniffMime", () => {
  it("reads the four formats from their first bytes", () => {
    expect(sniffMime(JPEG)).toBe("image/jpeg");
    expect(sniffMime(PNG)).toBe("image/png");
    expect(sniffMime(PDF)).toBe("application/pdf");
    expect(sniffMime(HEIC)).toBe("image/heic");
  });

  it("says nothing about bytes it does not recognise", () => {
    expect(sniffMime(fileOf([0x4d, 0x5a]))).toBeNull();
    expect(sniffMime(new Uint8Array(2))).toBeNull();
  });
});

describe("canonicalMime", () => {
  it("accepts the spellings phones and browsers actually send", () => {
    expect(canonicalMime("image/jpg")).toBe("image/jpeg");
    expect(canonicalMime("IMAGE/JPEG; charset=binary")).toBe("image/jpeg");
    expect(canonicalMime("image/heic-sequence")).toBe("image/heic");
  });

  it("refuses anything outside the five", () => {
    expect(canonicalMime("text/html")).toBeNull();
    expect(canonicalMime("application/octet-stream")).toBeNull();
    expect(canonicalMime(null)).toBeNull();
  });
});

describe("validateReceiptFile", () => {
  it("accepts a real photograph", () => {
    const verdict = validateReceiptFile({
      fileName: "recu.jpg",
      declaredType: "image/jpeg",
      size: JPEG.length,
      bytes: JPEG,
    });
    expect(verdict).toMatchObject({ ok: true, mime: "image/jpeg", extension: "jpg", previewable: true });
  });

  it("accepts HEIC and says a browser cannot show it", () => {
    const verdict = validateReceiptFile({
      fileName: "IMG_0042.HEIC",
      declaredType: "image/heic",
      size: HEIC.length,
      bytes: HEIC,
    });
    expect(verdict.ok).toBe(true);
    expect(verdict.previewable).toBe(false);
  });

  it("refuses a file renamed to look like an image", () => {
    const disguised = fileOf([0x4d, 0x5a, 0x90, 0x00]);
    const verdict = validateReceiptFile({
      fileName: "recu.jpg",
      declaredType: "image/jpeg",
      size: disguised.length,
      bytes: disguised,
    });
    expect(verdict.ok).toBe(false);
    expect(verdict.error).toMatch(/n'est pas une image ni un PDF/);
  });

  it("refuses a PDF wearing a jpg extension", () => {
    const verdict = validateReceiptFile({
      fileName: "recu.jpg",
      declaredType: "image/jpeg",
      size: PDF.length,
      bytes: PDF,
    });
    expect(verdict.ok).toBe(false);
    expect(verdict.error).toMatch(/son contenu est application\/pdf/);
  });

  it("refuses an extension outside the list", () => {
    const verdict = validateReceiptFile({
      fileName: "recu.svg",
      declaredType: "image/jpeg",
      size: JPEG.length,
      bytes: JPEG,
    });
    expect(verdict.ok).toBe(false);
    expect(verdict.error).toMatch(/\.svg/);
  });

  it("refuses something too large and something too small", () => {
    expect(
      validateReceiptFile({
        fileName: "recu.jpg",
        declaredType: "image/jpeg",
        size: MAX_RECEIPT_BYTES + 1,
        bytes: JPEG,
      }).error,
    ).toMatch(/15 Mo/);

    expect(
      validateReceiptFile({ fileName: "recu.jpg", declaredType: "image/jpeg", size: 4, bytes: new Uint8Array(4) })
        .error,
    ).toMatch(/vide ou incomplet/);
  });

  it("refuses an upload whose bytes do not match its declared size", () => {
    const verdict = validateReceiptFile({
      fileName: "recu.jpg",
      declaredType: "image/jpeg",
      size: JPEG.length + 100,
      bytes: JPEG,
    });
    expect(verdict.ok).toBe(false);
    expect(verdict.error).toMatch(/taille annoncée/);
  });
});

describe("storagePath", () => {
  it("puts the file in its own shop's folder under a generated name", () => {
    const path = storagePath({
      organizationId: ORG,
      extension: "jpg",
      now: new Date("2026-03-04T10:00:00Z"),
      id: "11111111-2222-4333-a444-555555555555",
    });
    expect(path).toBe(`${ORG}/2026/11111111-2222-4333-a444-555555555555.jpg`);
  });

  it("refuses to build a path out of anything but a real shop id", () => {
    expect(() => storagePath({ organizationId: "../../etc", extension: "jpg" })).toThrow();
    expect(() => storagePath({ organizationId: ORG, extension: "php" })).toThrow();
    expect(() =>
      storagePath({ organizationId: ORG, extension: "jpg", id: "../../../secret" }),
    ).toThrow();
  });

  it("never lets a traversal out of the folder", () => {
    const path = storagePath({ organizationId: ORG, extension: "jpg" });
    expect(path.startsWith(`${ORG}/`)).toBe(true);
    expect(path).not.toContain("..");
    expect(path.split("/")).toHaveLength(3);
  });
});

describe("hashBytes", () => {
  it("gives the same file the same fingerprint and a different file another", async () => {
    const one = await hashBytes(JPEG);
    const same = await hashBytes(JPEG);
    const other = await hashBytes(PNG);
    expect(one).toBe(same);
    expect(one).not.toBe(other);
    expect(one).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("displayFileName", () => {
  it("keeps only the name, without a path or control characters", () => {
    expect(displayFileName("/Users/sarra/Desktop/recu.jpg")).toBe("recu.jpg");
    expect(displayFileName("C:\\photos\\recu.jpg")).toBe("recu.jpg");
    expect(displayFileName("re\u0000cu.jpg")).toBe("recu.jpg");
    expect(displayFileName(null)).toBe("Reçu");
  });
});
