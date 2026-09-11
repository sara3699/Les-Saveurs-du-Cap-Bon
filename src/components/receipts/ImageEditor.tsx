"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Straightening a photograph before it is sent.
 *
 * A receipt photographed on a counter is usually crooked and usually has half the
 * counter in it. Turning it the right way up and cropping to the paper is what makes
 * the difference between a reader finding the total and not, and it costs nothing to do
 * here: the browser already has the pixels, and the server would otherwise need an
 * image library to do the same work.
 *
 * Only images. A PDF is passed through untouched, because turning one into a picture to
 * crop it would throw away the text it already contains.
 */

interface Crop {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ImageEditorProps {
  file: File;
  onChange: (file: File) => void;
  disabled?: boolean;
}

const BUTTON =
  "rounded-[var(--radius-sm)] border border-line-strong bg-surface px-3 py-1.5 text-xs font-semibold hover:bg-surface-2 disabled:opacity-50";

export function ImageEditor({ file, onChange, disabled = false }: ImageEditorProps) {
  const [source, setSource] = useState<HTMLImageElement | null>(null);
  const [rotation, setRotation] = useState(0);
  const [crop, setCrop] = useState<Crop | null>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  // The file this editor was handed, so a re-render does not re-read a file it made.
  const originalRef = useRef<File>(file);

  // No state is reset here. The parent gives this a key derived from the file, so a
  // different file remounts the editor and starts it straight rather than rewinding it.
  useEffect(() => {
    originalRef.current = file;
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => setSource(image);
    image.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !source) return;
    const turned = rotation % 180 !== 0;
    const width = turned ? source.naturalHeight : source.naturalWidth;
    const height = turned ? source.naturalWidth : source.naturalHeight;

    // Drawn at a size a screen can show; the export re-draws at full resolution.
    const scale = Math.min(1, 900 / Math.max(width, height));
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);

    const context = canvas.getContext("2d");
    if (!context) return;
    context.save();
    context.translate(canvas.width / 2, canvas.height / 2);
    context.rotate((rotation * Math.PI) / 180);
    context.drawImage(
      source,
      (-source.naturalWidth * scale) / 2,
      (-source.naturalHeight * scale) / 2,
      source.naturalWidth * scale,
      source.naturalHeight * scale,
    );
    context.restore();

    if (crop) {
      context.save();
      context.fillStyle = "rgba(8, 35, 31, .55)";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.clearRect(
        crop.x * canvas.width,
        crop.y * canvas.height,
        crop.width * canvas.width,
        crop.height * canvas.height,
      );
      context.strokeStyle = "#FFC53D";
      context.lineWidth = 2;
      context.strokeRect(
        crop.x * canvas.width,
        crop.y * canvas.height,
        crop.width * canvas.width,
        crop.height * canvas.height,
      );
      context.restore();
    }
  }, [source, rotation, crop]);

  useEffect(draw, [draw]);

  /** Re-draws at full resolution and hands back a new file, leaving the original alone. */
  const apply = useCallback(
    async (nextRotation: number, nextCrop: Crop | null) => {
      if (!source) return;
      setBusy(true);
      try {
        const turned = nextRotation % 180 !== 0;
        const fullWidth = turned ? source.naturalHeight : source.naturalWidth;
        const fullHeight = turned ? source.naturalWidth : source.naturalHeight;

        const stage = document.createElement("canvas");
        stage.width = fullWidth;
        stage.height = fullHeight;
        const context = stage.getContext("2d");
        if (!context) return;
        context.translate(fullWidth / 2, fullHeight / 2);
        context.rotate((nextRotation * Math.PI) / 180);
        context.drawImage(source, -source.naturalWidth / 2, -source.naturalHeight / 2);

        let output = stage;
        if (nextCrop && nextCrop.width > 0.02 && nextCrop.height > 0.02) {
          const cut = document.createElement("canvas");
          cut.width = Math.max(1, Math.round(nextCrop.width * fullWidth));
          cut.height = Math.max(1, Math.round(nextCrop.height * fullHeight));
          cut
            .getContext("2d")
            ?.drawImage(
              stage,
              Math.round(nextCrop.x * fullWidth),
              Math.round(nextCrop.y * fullHeight),
              cut.width,
              cut.height,
              0,
              0,
              cut.width,
              cut.height,
            );
          output = cut;
        }

        const blob = await new Promise<Blob | null>((resolve) =>
          output.toBlob(resolve, "image/jpeg", 0.92),
        );
        if (!blob) return;
        const name = originalRef.current.name.replace(/\.[a-z0-9]+$/i, "") || "recu";
        onChange(new File([blob], `${name}.jpg`, { type: "image/jpeg" }));
      } finally {
        setBusy(false);
      }
    },
    [source, onChange],
  );

  const pointAt = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1),
      y: Math.min(Math.max((event.clientY - rect.top) / rect.height, 0), 1),
    };
  };

  if (!source) {
    return <p className="text-sm text-muted">Chargement de l&apos;aperçu…</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <canvas
        ref={canvasRef}
        aria-label="Aperçu du reçu, faites glisser pour recadrer"
        className="w-full max-w-full cursor-crosshair touch-none rounded-[var(--radius-md)] border border-line bg-surface-2"
        onPointerDown={(event) => {
          if (disabled) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          startRef.current = pointAt(event);
          setDragging(true);
          setCrop(null);
        }}
        onPointerMove={(event) => {
          if (!dragging || !startRef.current) return;
          const now = pointAt(event);
          const start = startRef.current;
          setCrop({
            x: Math.min(start.x, now.x),
            y: Math.min(start.y, now.y),
            width: Math.abs(now.x - start.x),
            height: Math.abs(now.y - start.y),
          });
        }}
        onPointerUp={() => {
          setDragging(false);
          startRef.current = null;
        }}
      />

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={BUTTON}
          disabled={disabled || busy}
          onClick={() => setRotation((value) => (value + 270) % 360)}
        >
          ↺ Tourner à gauche
        </button>
        <button
          type="button"
          className={BUTTON}
          disabled={disabled || busy}
          onClick={() => setRotation((value) => (value + 90) % 360)}
        >
          ↻ Tourner à droite
        </button>
        <button
          type="button"
          className={BUTTON}
          disabled={disabled || busy || !crop}
          onClick={() => setCrop(null)}
        >
          Annuler le recadrage
        </button>
        <button
          type="button"
          className="rounded-[var(--radius-sm)] bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-hi disabled:opacity-50"
          disabled={disabled || busy || (rotation === 0 && !crop)}
          onClick={() => apply(rotation, crop)}
        >
          {busy ? "Application…" : "Appliquer"}
        </button>
      </div>

      <p className="text-xs text-muted">
        Faites glisser sur l&apos;image pour ne garder que le reçu, puis appuyez sur Appliquer. Une
        photo bien cadrée et à l&apos;endroit se lit beaucoup mieux.
      </p>
    </div>
  );
}
