import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { scanFileForQr, scanImageForQr, scanPdfForQr } from "./scan-server";

/**
 * The two shapes a QR code takes inside a real PDF.
 *
 * A scanned receipt, or one produced by printing a web page, carries the code as an
 * embedded picture. Invoicing software written in PHP, which is most of it in this part
 * of the world, draws the code as vector shapes and embeds no picture at all. Reading
 * only the pictures finds the first and silently misses the second, so both fixtures
 * exist and both are asserted here. `node scripts/make-fixtures.mjs` rebuilds them.
 */

const fixture = (name: string) => new Uint8Array(readFileSync(`e2e/fixtures/${name}`));
const PAYLOAD = "FAC-2026-00412";

describe("reading a QR code off a stored image", () => {
  it("reads one out of a PNG", async () => {
    expect(await scanImageForQr(fixture("recu-qr.png"), "image/png")).toBe(PAYLOAD);
  });

  it("says nothing rather than inventing something, when there is no code", async () => {
    expect(await scanImageForQr(fixture("pas-une-image.jpg"), "image/jpeg")).toBeNull();
  });

  it("does not attempt a format the reader cannot open", async () => {
    expect(await scanImageForQr(fixture("recu-qr.png"), "image/heic")).toBeNull();
  });
});

describe("reading a QR code out of a PDF", () => {
  it("finds one embedded as a picture", async () => {
    expect(await scanPdfForQr(fixture("recu-qr-image.pdf"))).toBe(PAYLOAD);
  });

  it("finds one drawn as vector shapes, which leaves no picture to extract", async () => {
    expect(await scanPdfForQr(fixture("recu-qr-vectoriel.pdf"))).toBe(PAYLOAD);
  });

  it("finds nothing in a receipt that carries no code", async () => {
    expect(await scanPdfForQr(fixture("recu-simple.pdf"))).toBeNull();
  });

  it("gives up quietly on something that is not a PDF at all", async () => {
    expect(await scanPdfForQr(fixture("pas-une-image.jpg"))).toBeNull();
  });
});

describe("scanFileForQr", () => {
  it("sends each kind of file to the right reader", async () => {
    expect(await scanFileForQr(fixture("recu-qr-vectoriel.pdf"), "application/pdf")).toBe(PAYLOAD);
    expect(await scanFileForQr(fixture("recu-qr.png"), "image/png")).toBe(PAYLOAD);
    expect(await scanFileForQr(fixture("recu-simple.pdf"), "application/pdf")).toBeNull();
  });

  it("returns a plain string, leaving every judgement about it to parseQrPayload", async () => {
    const found = await scanFileForQr(fixture("recu-qr-image.pdf"), "application/pdf");
    expect(typeof found).toBe("string");
    expect(found).toBe(PAYLOAD);
  });
});
