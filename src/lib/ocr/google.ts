import { OcrUnavailable, type OcrProvider, type OcrRequest, type OcrResult } from "./types";

/**
 * Google Cloud Vision.
 *
 * A warning that belongs at the top of the file rather than buried in a document:
 * **this adapter has never been run against the live service.** It was written from
 * Google's published request and response shapes, with no account and no key to test
 * it. Before anyone relies on it, read `docs-receipts.md`, put a key in, and process
 * one real receipt while watching what comes back.
 *
 * The key is read here, on the server, and nothing exports it. It must never appear in
 * a NEXT_PUBLIC_ variable, because those are delivered to the browser.
 */

const IMAGES_ENDPOINT = "https://vision.googleapis.com/v1/images:annotate";
const FILES_ENDPOINT = "https://vision.googleapis.com/v1/files:annotate";

/** Cloud Vision reads these. It does not read HEIC. */
const READABLE = new Set(["image/jpeg", "image/png", "application/pdf"]);

function base64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  }
  return btoa(binary);
}

interface VisionPage {
  confidence?: number;
}

interface VisionAnnotation {
  text?: string;
  pages?: VisionPage[];
}

interface VisionResponse {
  error?: { message?: string };
  fullTextAnnotation?: VisionAnnotation;
  responses?: VisionResponse[];
}

interface VisionEnvelope {
  error?: { message?: string };
  responses?: VisionResponse[];
}

function readText(envelope: VisionEnvelope): { text: string; confidence: number } {
  // An image answer nests one level, a PDF answer nests two.
  const outer = envelope.responses ?? [];
  const flat: VisionResponse[] = [];
  for (const response of outer) {
    if (response.responses) flat.push(...response.responses);
    else flat.push(response);
  }

  const texts: string[] = [];
  const confidences: number[] = [];
  for (const response of flat) {
    const annotation = response.fullTextAnnotation;
    if (annotation?.text) texts.push(annotation.text);
    for (const page of annotation?.pages ?? []) {
      if (typeof page.confidence === "number") confidences.push(page.confidence);
    }
  }

  const confidence =
    confidences.length === 0
      ? 0.6
      : Number((confidences.reduce((sum, value) => sum + value, 0) / confidences.length).toFixed(3));
  return { text: texts.join("\n"), confidence };
}

export function googleOcr(apiKey: string): OcrProvider {
  return {
    name: "google-vision",
    demo: false,
    accepts: (mime) => READABLE.has(mime),

    async extract(request: OcrRequest): Promise<OcrResult> {
      if (!READABLE.has(request.mime)) {
        throw new OcrUnavailable(
          "Ce format ne peut pas être lu automatiquement. Envoyez une photo JPG ou PNG, ou un PDF, ou saisissez les montants à la main.",
        );
      }

      const content = base64(request.bytes);
      const isPdf = request.mime === "application/pdf";
      const body = isPdf
        ? {
            requests: [
              {
                inputConfig: { content, mimeType: "application/pdf" },
                features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
                // A receipt is never longer than this, and asking for more pages costs
                // money for nothing.
                pages: [1, 2, 3],
              },
            ],
          }
        : {
            requests: [
              {
                image: { content },
                features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
                imageContext: { languageHints: ["fr", "en", "ar"] },
              },
            ],
          };

      let response: Response;
      try {
        response = await fetch(`${isPdf ? FILES_ENDPOINT : IMAGES_ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(45_000),
        });
      } catch (cause) {
        throw new OcrUnavailable(
          "Le service de lecture n'a pas répondu. Réessayez dans un moment, ou saisissez les montants à la main.",
          cause,
        );
      }

      if (!response.ok) {
        // The status is logged, the body is not: it can quote the receipt back.
        throw new OcrUnavailable(
          response.status === 401 || response.status === 403
            ? "Le service de lecture a refusé la clé configurée. Prévenez la personne qui gère le paramétrage."
            : "Le service de lecture a renvoyé une erreur. Réessayez, ou saisissez les montants à la main.",
          new Error(`vision responded ${response.status}`),
        );
      }

      let envelope: VisionEnvelope;
      try {
        envelope = (await response.json()) as VisionEnvelope;
      } catch (cause) {
        throw new OcrUnavailable("La réponse du service de lecture n'a pas pu être lue.", cause);
      }

      if (envelope.error?.message) {
        throw new OcrUnavailable(
          "Le service de lecture a refusé ce fichier. Réessayez avec une photo plus nette.",
          new Error(envelope.error.message),
        );
      }

      const { text, confidence } = readText(envelope);
      if (text.trim() === "") {
        throw new OcrUnavailable(
          "Aucun texte n'a été trouvé sur cette image. Reprenez la photo à plat, bien éclairée, ou saisissez les montants à la main.",
        );
      }

      return { provider: "google-vision", rawText: text, confidence, demo: false };
    },
  };
}
