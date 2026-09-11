/**
 * Writes the files the tests upload.
 *
 * They are small and committed, so `npm run test:e2e` needs no generation step. This
 * script exists so they can be rebuilt, and so nobody has to wonder where a binary in
 * the repository came from.
 *
 *   node scripts/make-fixtures.mjs
 *
 * Two of them carry a QR code inside a PDF, and they carry it the two different ways a
 * real invoice does. A receipt scanned or generated from HTML holds the code as an
 * embedded picture. A receipt from PHP invoicing software, which is most of the
 * invoicing software in this part of the world, draws it as vector rectangles and
 * embeds no picture at all. Pulling pictures out of a PDF finds the first and misses
 * the second entirely, so both are needed to prove the reader handles both.
 */
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { readFileSync } from "node:fs";
import { prepareZXingModule, writeBarcode } from "zxing-wasm/writer";

const into = new URL("../e2e/fixtures/", import.meta.url);
mkdirSync(into, { recursive: true });

const PAYLOAD = "FAC-2026-00412";

const RECEIPT_LINES = [
  "COMPTOIR EXEMPLE, GROS",
  "12 rue de l'Exemple, 8000 Nabeul",
  "Matricule fiscal : 9999101A/M/000",
  "--------------------------------",
  "Facture N 8421",
  "Date : 04/03/2026    14:35",
  "--------------------------------",
  "3 x Pistaches decortiquees, kg   144,000",
  "1 x Miel de romarin, pot 1 kg   38,000",
  "--------------------------------",
  "SOUS-TOTAL HT        182,000",
  "TVA 19%              34,580",
  "TOTAL TTC            216,580",
  "Reglement : Carte bancaire",
  "Carte **** **** **** 4242",
  "--------------------------------",
  "Donnees d'exemple, aucun recu reel",
];

function escapeText(line) {
  let out = "";
  for (const character of line) {
    const code = character.codePointAt(0) ?? 63;
    if (character === "(" || character === ")" || character === "\\") out += `\\${character}`;
    else if (code < 32) out += " ";
    else if (code < 127) out += character;
    else if (code < 256) out += `\\${code.toString(8).padStart(3, "0")}`;
    else out += "?";
  }
  return out;
}

/**
 * Assembles a PDF from objects, tracking byte offsets rather than string lengths.
 *
 * Buffers, not a string: a compressed image stream is arbitrary bytes, and pushing
 * those through a JavaScript string survives only by the accident that every one of
 * them happens to be below 256.
 */
function assemble(objects) {
  const parts = [Buffer.from("%PDF-1.4\n", "latin1")];
  let at = parts[0].length;
  const offsets = [];

  objects.forEach((object, index) => {
    offsets.push(at);
    const head = Buffer.from(`${index + 1} 0 obj\n`, "latin1");
    const tail = Buffer.from("\nendobj\n", "latin1");
    const body = Buffer.isBuffer(object) ? object : Buffer.from(object, "latin1");
    parts.push(head, body, tail);
    at += head.length + body.length + tail.length;
  });

  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) xref += `${String(offset).padStart(10, "0")} 00000 n \n`;
  xref += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${at}\n%%EOF\n`;
  parts.push(Buffer.from(xref, "latin1"));

  return Buffer.concat(parts);
}

function streamObject(dictionary, payload) {
  const bytes = Buffer.isBuffer(payload) ? payload : Buffer.from(payload, "latin1");
  return Buffer.concat([
    Buffer.from(`<< ${dictionary} /Length ${bytes.length} >>\nstream\n`, "latin1"),
    bytes,
    Buffer.from("\nendstream", "latin1"),
  ]);
}

/**
 * The QR symbol as vector rectangles.
 *
 * The white ground underneath is load-bearing, not decoration. A renderer that
 * composites the page onto transparency turns an unpainted quiet zone into black, and
 * then nothing decodes at any resolution.
 */
function qrOperators(symbol, { x, y, module = 4, quiet = 4 }) {
  const { width: n, data } = symbol;
  const side = (n + quiet * 2) * module;
  const dark = (column, row) => data[row * n + column] === 0;

  const ops = ["q", "1 1 1 rg", `${x} ${y} ${side} ${side} re`, "f", "0 0 0 rg"];
  for (let row = 0; row < n; row += 1) {
    // Row 0 of the symbol is its top row, and a PDF's y grows upward, so the row
    // index is flipped. Get this wrong and the symbol is mirrored, which readers
    // decode happily and only report in a flag nobody reads.
    const top = y + (n + quiet - 1 - row) * module;
    let column = 0;
    while (column < n) {
      if (!dark(column, row)) {
        column += 1;
        continue;
      }
      let run = 1;
      while (column + run < n && dark(column + run, row)) run += 1;
      ops.push(`${x + (quiet + column) * module} ${top} ${run * module} ${module} re`);
      column += run;
    }
  }
  ops.push("f", "Q");
  return { ops: ops.join("\n"), side };
}

/** The same symbol as an 8-bit greyscale picture, the way a scanner would leave it. */
function qrGreyscale(symbol, { module = 8, quiet = 4 }) {
  const { width: n, data } = symbol;
  const side = (n + quiet * 2) * module;
  const samples = Buffer.alloc(side * side, 255);
  for (let row = 0; row < n; row += 1) {
    for (let column = 0; column < n; column += 1) {
      if (data[row * n + column] !== 0) continue;
      for (let dy = 0; dy < module; dy += 1) {
        const at = ((quiet + row) * module + dy) * side + (quiet + column) * module;
        samples.fill(0, at, at + module);
      }
    }
  }
  return { samples, side };
}

function receiptPdf(symbol, { drawAs }) {
  const qrModule = 4;
  const vector = symbol ? qrOperators(symbol, { x: 16, y: 16, module: qrModule, quiet: 4 }) : null;
  const raster = symbol && drawAs === "image" ? qrGreyscale(symbol, { module: 8, quiet: 4 }) : null;
  const qrSide = symbol ? (symbol.width + 8) * qrModule : 0;

  const textTop = 26 + (symbol ? qrSide + 16 : 0);
  const height = 48 + RECEIPT_LINES.length * 12 + (symbol ? qrSide + 16 : 0);

  const content = [
    "BT",
    "/F1 8 Tf",
    ...RECEIPT_LINES.map(
      (line, index) => `1 0 0 1 16 ${height - textTop + 12 - index * 12} Tm (${escapeText(line)}) Tj`,
    ),
    "ET",
  ];
  if (drawAs === "vector" && vector) content.push(vector.ops);
  if (drawAs === "image" && raster) {
    content.push("q", `${qrSide} 0 0 ${qrSide} 16 16 cm`, "/Qr Do", "Q");
  }

  const resources =
    drawAs === "image"
      ? "/Font << /F1 5 0 R >> /XObject << /Qr 6 0 R >>"
      : "/Font << /F1 5 0 R >>";

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 ${height}] /Contents 4 0 R /Resources << ${resources} >> >>`,
    streamObject("", content.join("\n")),
    "<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>",
  ];

  if (drawAs === "image" && raster) {
    objects.push(
      streamObject(
        `/Type /XObject /Subtype /Image /Width ${raster.side} /Height ${raster.side} /ColorSpace /DeviceGray /BitsPerComponent 8 /Filter /FlateDecode`,
        deflateSync(raster.samples),
      ),
    );
  }

  return assemble(objects);
}

/**
 * The QR code as a fake camera feed.
 *
 * Chromium can be handed a raw Y4M file in place of a webcam, which is the only way to
 * exercise live scanning without a physical phone. Live scanning is the headline action
 * of this feature, so leaving it untested would mean shipping the main path on hope.
 *
 * Small on purpose: Y4M is uncompressed, so 160x120 keeps the fixture at tens of
 * kilobytes rather than megabytes, and still leaves nearly four pixels per module, well
 * above the roughly one and a half a reader needs.
 */
function qrY4m(symbol, { width = 160, height = 120, frames = 2, quiet = 4 } = {}) {
  const n = symbol.width;
  const side = n + quiet * 2;
  const scale = Math.floor((Math.min(width, height) * 0.92) / side);
  const drawn = side * scale;
  const left = Math.floor((width - drawn) / 2);
  const top = Math.floor((height - drawn) / 2);

  const luma = Buffer.alloc(width * height, 255);
  for (let row = 0; row < n; row += 1) {
    for (let column = 0; column < n; column += 1) {
      if (symbol.data[row * n + column] !== 0) continue;
      for (let dy = 0; dy < scale; dy += 1) {
        const y = top + (quiet + row) * scale + dy;
        const x = left + (quiet + column) * scale;
        luma.fill(0, y * width + x, y * width + x + scale);
      }
    }
  }
  // Grey has no colour: both chroma planes sit at their neutral value.
  const chroma = Buffer.alloc((width / 2) * (height / 2), 128);

  const parts = [Buffer.from(`YUV4MPEG2 W${width} H${height} F15:1 Ip A1:1 C420\n`, "latin1")];
  for (let frame = 0; frame < frames; frame += 1) {
    parts.push(Buffer.from("FRAME\n", "latin1"), luma, chroma, chroma);
  }
  return Buffer.concat(parts);
}

const wasmBinary = readFileSync(
  new URL("../node_modules/zxing-wasm/dist/writer/zxing_writer.wasm", import.meta.url),
);
prepareZXingModule({ overrides: { wasmBinary } });

const written = await writeBarcode(PAYLOAD, { format: "QRCode", scale: 6, withQuietZones: true });
if (written.error) throw new Error(`The QR code could not be written: ${written.error}`);
const symbol = written.symbol;
if (!symbol) throw new Error("zxing returned no symbol matrix.");

writeFileSync(new URL("recu-qr.png", into), Buffer.from(await written.image.arrayBuffer()));
writeFileSync(new URL("recu-simple.pdf", into), receiptPdf(null, { drawAs: "none" }));
writeFileSync(new URL("recu-qr-vectoriel.pdf", into), receiptPdf(symbol, { drawAs: "vector" }));
writeFileSync(new URL("recu-qr-image.pdf", into), receiptPdf(symbol, { drawAs: "image" }));

// A file that is not what its name says, for the test that this is refused.
writeFileSync(
  new URL("pas-une-image.jpg", into),
  Buffer.from("Ceci n'est pas une image.\n".repeat(20)),
);

writeFileSync(new URL("camera-qr.y4m", into), qrY4m(symbol));

console.log(`Fixtures written to e2e/fixtures/ (QR payload: ${PAYLOAD}, symbol ${symbol.width}x${symbol.height})`);
