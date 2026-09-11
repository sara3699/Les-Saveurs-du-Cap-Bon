import type { NextConfig } from "next";

/**
 * Two WebAssembly files have to survive the trip to the server.
 *
 * The receipt processing route reads a QR code off the stored file: ZXing decodes the
 * code, and PDFium draws a PDF page so a code drawn as vector shapes can be read at
 * all. Both want their binary from the filesystem, because a serverless function has no
 * page to fetch one from and neither should be pulled off somebody else's CDN on every
 * receipt.
 *
 * Nothing imports those files, so nothing traces them, so without this they are simply
 * absent once deployed and every PDF quietly reports no code. Naming them here is what
 * keeps them. `src/lib/receipts/scan-server.ts` is the only thing that reads them.
 */
const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/receipts/[id]/process": [
      "./node_modules/zxing-wasm/dist/reader/zxing_reader.wasm",
      "./node_modules/@hyzyla/pdfium/dist/pdfium.wasm",
      "./public/zxing/zxing_reader.wasm",
    ],
  },
};

export default nextConfig;
