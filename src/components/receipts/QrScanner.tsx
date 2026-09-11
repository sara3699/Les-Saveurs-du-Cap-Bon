"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cameraIsPossible, frameToImageData, frameToJpeg, qrReader, type ReaderKind } from "@/lib/receipts/scan";

/**
 * The camera, opened only when somebody asks for it.
 *
 * A page that asks for camera permission on load teaches people to say no. So nothing
 * here touches `getUserMedia` until the button is pressed, and a refusal is answered
 * with the upload path rather than a dead end.
 *
 * Finding a code does not finish the job: the photograph is still needed, because a QR
 * code on a Tunisian receipt rarely carries the whole receipt. So the same frame that
 * held the code is kept as the picture, and the person is not asked to aim twice.
 */

export interface QrScannerProps {
  /** Called with the still frame, and the code if there was one in it. */
  onCapture: (file: File, qrPayload: string | null) => void;
  onCancel: () => void;
}

type Phase = "asking" | "scanning" | "denied" | "unavailable";

const SCAN_EVERY_MS = 320;

export function QrScanner({ onCapture, onCancel }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  // Worked out when the state is first created rather than corrected afterwards. This
  // component only ever mounts after a press, so there is no server render to disagree with.
  const [phase, setPhase] = useState<Phase>(() => (cameraIsPossible() ? "asking" : "unavailable"));
  const [readerKind, setReaderKind] = useState<ReaderKind | null>(null);
  const [found, setFound] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  const stop = useCallback(() => {
    for (const track of streamRef.current?.getTracks() ?? []) track.stop();
    streamRef.current = null;
  }, []);

  useEffect(() => stop, [stop]);

  useEffect(() => {
    if (!cameraIsPossible()) return;
    let cancelled = false;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 } },
          audio: false,
        });
        if (cancelled) {
          for (const track of stream.getTracks()) track.stop();
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
        setPhase("scanning");
      } catch (cause) {
        if (cancelled) return;
        const name = cause instanceof DOMException ? cause.name : "";
        setPhase(name === "NotFoundError" || name === "OverconstrainedError" ? "unavailable" : "denied");
      }
    })();

    return () => {
      cancelled = true;
      stop();
    };
  }, [stop]);

  useEffect(() => {
    if (phase !== "scanning") return;
    let running = true;
    let timer: ReturnType<typeof setTimeout> | null = null;

    (async () => {
      const reader = await qrReader();
      if (!running) return;
      setReaderKind(reader.kind);
      if (reader.kind === "none") return;

      const tick = async () => {
        if (!running) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (video && canvas && video.readyState >= 2) {
          const pixels = frameToImageData(video, canvas);
          if (pixels) {
            const text = await reader.decode(pixels);
            if (text && running) setFound(text);
          }
        }
        if (running) timer = setTimeout(tick, SCAN_EVERY_MS);
      };
      void tick();
    })();

    return () => {
      running = false;
      if (timer) clearTimeout(timer);
    };
  }, [phase]);

  const take = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const blob = await frameToJpeg(video, canvas);
    if (!blob) {
      setProblem("La photo n'a pas pu être prise. Réessayez.");
      return;
    }
    stop();
    onCapture(new File([blob], "recu.jpg", { type: "image/jpeg" }), found);
  }, [found, onCapture, stop]);

  if (phase === "denied" || phase === "unavailable") {
    return (
      <div className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-dashed border-line-strong bg-surface-2 p-4">
        <p className="text-sm font-semibold">
          {phase === "denied"
            ? "L'accès à la caméra a été refusé."
            : "Aucune caméra utilisable sur cet appareil."}
        </p>
        <p className="text-sm text-muted">
          {phase === "denied"
            ? "Vous pouvez l'autoriser dans les réglages du navigateur, ou déposer une photo du reçu prise avec l'appareil photo."
            : "Prenez la photo avec l'appareil photo, puis déposez le fichier ici."}
        </p>
        <button
          type="button"
          onClick={onCancel}
          className="self-start rounded-[var(--radius-md)] bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hi"
        >
          Déposer un fichier à la place
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative overflow-hidden rounded-[var(--radius-md)] border border-line bg-[#08231F]">
        <video
          ref={videoRef}
          playsInline
          muted
          aria-label="Vue de la caméra"
          className="block max-h-[52vh] w-full object-contain"
        />
        <canvas ref={canvasRef} className="hidden" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-[12%] rounded-[var(--radius-md)] border-2 border-dashed border-accent/70"
        />
        {found ? (
          <p className="absolute inset-x-3 bottom-3 rounded-[var(--radius-sm)] bg-success px-3 py-2 text-xs font-semibold text-white">
            Code QR trouvé. Prenez la photo du reçu, les deux seront envoyés ensemble.
          </p>
        ) : null}
      </div>

      {phase === "asking" ? <p className="text-sm text-muted">Ouverture de la caméra…</p> : null}

      {readerKind === "none" ? (
        <p className="rounded-[var(--radius-md)] border border-accent-line bg-accent-soft px-3 py-2 text-xs font-semibold text-accent-ink">
          Ce navigateur ne sait pas lire un code QR. Vous pouvez quand même photographier le reçu,
          il sera lu comme une image.
        </p>
      ) : null}

      {problem ? <p className="text-sm font-semibold text-danger">{problem}</p> : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={take}
          disabled={phase !== "scanning"}
          className="rounded-[var(--radius-md)] bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hi disabled:opacity-50"
        >
          Prendre la photo
        </button>
        <button
          type="button"
          onClick={() => {
            stop();
            onCancel();
          }}
          className="rounded-[var(--radius-md)] border border-line-strong bg-surface px-4 py-2 text-sm font-semibold"
        >
          Fermer la caméra
        </button>
      </div>
    </div>
  );
}
