import { describe, expect, it } from "vitest";
import { MAX_QR_LENGTH, checkVerificationUrl, parseQrPayload, sanitizeForDisplay } from "./qr";

describe("parseQrPayload, the shapes we accept", () => {
  it("reads structured data and maps the keys a receipt uses", () => {
    const result = parseQrPayload(
      JSON.stringify({
        merchant: "Comptoir Exemple",
        Total: "42,300",
        devise: "TND",
        "invoice number": "2412",
        matricule: "9999101A/M/000",
      }),
    );
    expect(result.kind).toBe("json");
    expect(result.fields.merchant_name).toBe("Comptoir Exemple");
    expect(result.fields.total_amount).toBe("42,300");
    expect(result.fields.currency).toBe("TND");
    expect(result.fields.receipt_number).toBe("2412");
    expect(result.fields.tax_identifier).toBe("9999101A/M/000");
    expect(result.needsReview).toBe(false);
  });

  it("keeps structured data it cannot map, and asks for a person", () => {
    const result = parseQrPayload(JSON.stringify({ colour: "blue", size: 3 }));
    expect(result.kind).toBe("json");
    expect(result.fields).toEqual({});
    expect(result.needsReview).toBe(true);
    expect(result.reason).toMatch(/saisir à la main/);
  });

  it("keeps an https verification address but never opens it", () => {
    const result = parseQrPayload("https://impots.example.tn/verif?id=2412");
    expect(result.kind).toBe("url");
    expect(result.verificationUrl).toBe("https://impots.example.tn/verif?id=2412");
    expect(result.needsReview).toBe(true);
    expect(result.reason).toMatch(/jamais ouverte automatiquement/);
  });

  it("recognises a Tunisian matricule fiscal on its own", () => {
    const result = parseQrPayload("9999101A/M/000");
    expect(result.kind).toBe("tax_identifier");
    expect(result.fields.tax_identifier).toBe("9999101A/M/000");
  });

  it("puts a lone reference in the receipt number, and says it is unconfirmed", () => {
    const result = parseQrPayload("FAC-2026-00412");
    expect(result.kind).toBe("receipt_number");
    expect(result.fields.receipt_number).toBe("FAC-2026-00412");
    expect(result.needsReview).toBe(true);
  });

  it("recognises a payment reference", () => {
    const result = parseQrPayload("REF: 88213-AA91");
    expect(result.kind).toBe("payment_reference");
    expect(result.fields.receipt_number).toBe("88213-AA91");
  });
});

describe("parseQrPayload, what it refuses", () => {
  it("refuses a script address", () => {
    const result = parseQrPayload("javascript:alert(document.cookie)");
    expect(result.kind).toBe("unsupported");
    expect(result.verificationUrl).toBeNull();
    expect(result.reason).toMatch(/n'est pas acceptée/);
  });

  it("refuses data, file and plain http addresses", () => {
    for (const payload of [
      "data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==",
      "file:///etc/passwd",
      "http://example.tn/verif",
    ]) {
      const result = parseQrPayload(payload);
      expect(result.kind).toBe("unsupported");
      expect(result.verificationUrl).toBeNull();
    }
  });

  it("refuses an address pointing back inside the network", () => {
    for (const host of [
      "https://localhost/verif",
      "https://127.0.0.1/verif",
      "https://10.0.0.5/verif",
      "https://192.168.1.1/verif",
      "https://172.20.0.3/verif",
      "https://169.254.169.254/latest/meta-data",
      "https://metadata.google.internal/computeMetadata/v1/",
      "https://printer.local/verif",
    ]) {
      const result = parseQrPayload(host);
      expect(result.verificationUrl, host).toBeNull();
      expect(result.reason, host).toMatch(/réseau privé|n'est pas acceptée|refusée/);
    }
  });

  it("refuses an address carrying a credential or an unusual port", () => {
    expect(parseQrPayload("https://user:pass@example.tn/x").verificationUrl).toBeNull();
    expect(parseQrPayload("https://example.tn:8080/x").verificationUrl).toBeNull();
  });

  it("refuses a payload longer than a QR code can hold, and keeps what it can", () => {
    const huge = "A".repeat(MAX_QR_LENGTH + 500);
    const result = parseQrPayload(huge);
    expect(result.kind).toBe("unsupported");
    expect(result.raw.length).toBe(MAX_QR_LENGTH);
    expect(result.needsReview).toBe(true);
  });

  it("strips control characters rather than carrying them onward", () => {
    const result = parseQrPayload("FAC\u0007-2026\u001b[31m-1\u0000");
    expect(result.raw).not.toMatch(/[\u0000-\u001F\u007F]/);
    expect(result.raw).toContain("FAC-2026");
  });

  it("refuses anything that is not a string", () => {
    for (const payload of [null, undefined, 42, {}, []]) {
      const result = parseQrPayload(payload);
      expect(result.kind).toBe("unsupported");
      expect(result.needsReview).toBe(true);
    }
  });

  it("does not let a script tag out of a JSON payload unescaped", () => {
    const result = parseQrPayload(JSON.stringify({ merchant: "<script>alert(1)</script>" }));
    // It is kept as text. React escapes it on the way to the screen, and nothing here
    // ever builds HTML from it.
    expect(result.fields.merchant_name).toBe("<script>alert(1)</script>");
    expect(result.kind).toBe("json");
  });
});

describe("checkVerificationUrl", () => {
  it("accepts a plain public https address", () => {
    expect(checkVerificationUrl("https://verif.example.tn/r/1").url).toBe("https://verif.example.tn/r/1");
  });

  it("gives a reason a person can act on when it refuses", () => {
    expect(checkVerificationUrl("ftp://example.tn/x").reason).toMatch(/https/);
    expect(checkVerificationUrl("pas une adresse").reason).toMatch(/pas une adresse valide/);
  });
});

describe("sanitizeForDisplay", () => {
  it("flattens whitespace, removes control characters and caps the length", () => {
    expect(sanitizeForDisplay("  Comptoir \n  Exemple  ")).toBe("Comptoir Exemple");
    expect(sanitizeForDisplay("a\u0000b")).toBe("ab");
    expect(sanitizeForDisplay("x".repeat(900), 100)).toHaveLength(100);
    expect(sanitizeForDisplay(null)).toBe("");
  });
});
