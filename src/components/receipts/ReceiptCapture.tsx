"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ImageEditor } from "./ImageEditor";
import { QrScanner } from "./QrScanner";
import { DemoReaderNotice } from "./badges";
import { ACCEPT_ATTRIBUTE, MAX_RECEIPT_BYTES } from "@/lib/receipts/files";
import { cameraIsPossible, qrReader } from "@/lib/receipts/scan";

/**
 * Scanner un reçu.
 *
 * Three ways in, one path out. However the file arrives, it is uploaded, read, and the
 * person lands on the review screen with the figures in front of them. Nothing is saved
 * as a verified expense along the way.
 *
 * Progress is real: the upload reports what the browser has actually sent, and can be
 * cancelled mid-way. The reading step after it has no progress to report, so it says
 * what it is doing rather than drawing a bar that does not mean anything.
 */

type Stage = "choose" | "camera" | "ready" | "uploading" | "reading" | "failed";

export interface ReceiptCaptureProps {
  canWrite: boolean;
  demoReader: boolean;
}

const PRIMARY =
  "rounded-[var(--radius-md)] bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hi disabled:opacity-50";
const SECONDARY =
  "rounded-[var(--radius-md)] border border-line-strong bg-surface px-4 py-2.5 text-sm font-semibold hover:bg-surface-2 disabled:opacity-50";

function sizeLabel(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${Math.round(bytes / 1024)} Ko`
    : `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export function ReceiptCapture({ canWrite, demoReader }: ReceiptCaptureProps) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("choose");
  const [file, setFile] = useState<File | null>(null);
  const [qrPayload, setQrPayload] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [problem, setProblem] = useState<string | null>(null);
  const [duplicateId, setDuplicateId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const requestRef = useRef<XMLHttpRequest | null>(null);

  const isImage = file?.type.startsWith("image/") ?? false;
  const canPreview = isImage && file?.type !== "image/heic" && file?.type !== "image/heif";
  const isPdf = file?.type === "application/pdf";

  // Made once per file and released when the file changes. Built in the render before,
  // which handed the browser a new blob address on every keystroke and freed none of them.
  const pdfPreviewUrl = useMemo(
    () => (file && file.type === "application/pdf" ? URL.createObjectURL(file) : null),
    [file],
  );
  useEffect(() => {
    if (!pdfPreviewUrl) return;
    return () => URL.revokeObjectURL(pdfPreviewUrl);
  }, [pdfPreviewUrl]);

  const accept = useCallback(async (chosen: File, payload: string | null) => {
    setProblem(null);
    setDuplicateId(null);
    if (chosen.size > MAX_RECEIPT_BYTES) {
      setProblem("Ce fichier dépasse 15 Mo. Reprenez la photo en qualité normale, ou envoyez un PDF.");
      return;
    }
    setFile(chosen);
    setQrPayload(payload);
    setStage("ready");

    // A code on a photograph the person chose from their gallery is worth looking for
    // too, not only one held up to the camera.
    if (!payload && chosen.type.startsWith("image/")) {
      try {
        const reader = await qrReader();
        if (reader.kind !== "none") {
          const found = await reader.decode(chosen);
          if (found) setQrPayload(found);
        }
      } catch {
        // A file that cannot be decoded is simply a file with no code in it.
      }
    }
  }, []);

  const send = useCallback(() => {
    if (!file) return;
    setStage("uploading");
    setProgress(0);
    setProblem(null);

    const form = new FormData();
    form.append("file", file);
    form.append("source_type", qrPayload ? "qr" : file.name === "recu.jpg" ? "camera" : "upload");
    if (qrPayload) form.append("qr_payload", qrPayload);

    const request = new XMLHttpRequest();
    requestRef.current = request;
    request.open("POST", "/api/receipts");
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) setProgress(Math.round((event.loaded / event.total) * 100));
    };

    request.onerror = () => {
      setStage("failed");
      setProblem("L'envoi a échoué. Vérifiez la connexion et réessayez.");
    };
    request.onabort = () => {
      setStage("ready");
      setProgress(0);
    };

    request.onload = async () => {
      let body: { ok?: boolean; receiptId?: string; error?: string; duplicate?: boolean };
      try {
        body = JSON.parse(request.responseText);
      } catch {
        setStage("failed");
        setProblem("La réponse du serveur n'a pas pu être lue.");
        return;
      }

      if (!body.ok || !body.receiptId) {
        setStage("failed");
        setProblem(body.error ?? "Le reçu n'a pas pu être enregistré.");
        if (body.duplicate && body.receiptId) setDuplicateId(body.receiptId);
        return;
      }

      const receiptId = body.receiptId;
      setStage("reading");
      try {
        await fetch(`/api/receipts/${receiptId}/process`, { method: "POST" });
      } catch {
        // The receipt exists either way. The review screen shows what state it is in,
        // and offers to read it again.
      }
      router.push(`/receipts/${receiptId}`);
    };

    request.send(form);
  }, [file, qrPayload, router]);

  if (!canWrite) {
    return (
      <div className="os-card p-5">
        <h2 className="text-[15px]">Scanner un reçu</h2>
        <p className="mt-2 text-sm text-muted">
          Cette visite passe par l&apos;entrée de démonstration, qui peut tout consulter et rien
          enregistrer. Connectez-vous avec un compte pour déposer un reçu.
        </p>
        <Link href="/connexion" className={`${PRIMARY} mt-4 inline-block`}>
          Se connecter
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {demoReader ? <DemoReaderNotice /> : null}

      {stage === "camera" ? (
        <div className="os-card p-4 sm:p-5">
          <QrScanner
            onCapture={(taken, payload) => accept(taken, payload)}
            onCancel={() => {
              setStage("choose");
              inputRef.current?.click();
            }}
          />
        </div>
      ) : null}

      {stage === "choose" ? (
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragOver(false);
            const dropped = event.dataTransfer.files?.[0];
            if (dropped) void accept(dropped, null);
          }}
          className={`flex flex-col items-center gap-4 rounded-[var(--radius-card)] border-2 border-dashed px-6 py-10 text-center transition-colors ${
            dragOver ? "border-primary bg-primary-soft" : "border-line-strong bg-surface-2"
          }`}
        >
          <p className="text-[15px] font-semibold">Déposez le reçu ici</p>
          <p className="max-w-[46ch] text-sm text-muted">
            Photographiez-le, scannez son code QR s&apos;il en a un, ou déposez un fichier.
            JPG, PNG, HEIC ou PDF, 15 Mo au maximum.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {/*
              Whether a camera exists is only knowable in the browser, so it is asked
              when the button is pressed rather than while deciding how to draw it. A
              button whose state depended on that would render one way on the server and
              another here, and React would rightly complain.
            */}
            <button
              type="button"
              className={PRIMARY}
              onClick={() => {
                if (cameraIsPossible()) {
                  setStage("camera");
                  return;
                }
                setProblem(
                  "Aucune caméra utilisable sur cet appareil ou sur cette connexion. Choisissez un fichier à la place.",
                );
                inputRef.current?.click();
              }}
            >
              Scanner avec la caméra
            </button>
            <button type="button" className={SECONDARY} onClick={() => inputRef.current?.click()}>
              Choisir un fichier
            </button>
          </div>
          {problem && !file ? (
            <p className="text-sm font-semibold text-danger">{problem}</p>
          ) : null}
        </div>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTRIBUTE}
        className="hidden"
        onChange={(event) => {
          const chosen = event.target.files?.[0];
          if (chosen) void accept(chosen, null);
          event.target.value = "";
        }}
      />

      {file && stage !== "camera" ? (
        <div className="os-card flex flex-col gap-4 p-4 sm:p-5">
          <header className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-[15px]">{file.name}</h2>
              <p className="mt-0.5 text-xs text-muted">
                {file.type || "type inconnu"} · {sizeLabel(file.size)}
                {qrPayload ? " · code QR lu" : ""}
              </p>
            </div>
            <button
              type="button"
              className={SECONDARY}
              disabled={stage === "uploading" || stage === "reading"}
              onClick={() => {
                setFile(null);
                setQrPayload(null);
                setProblem(null);
                setStage("choose");
              }}
            >
              Changer de fichier
            </button>
          </header>

          {canPreview ? (
            <ImageEditor
              key={`${file.name}-${file.size}-${file.lastModified}`}
              file={file}
              onChange={setFile}
              disabled={stage === "uploading" || stage === "reading"}
            />
          ) : file.type === "application/pdf" ? (
            <object
              data={pdfPreviewUrl ?? undefined}
              type="application/pdf"
              aria-label="Aperçu du PDF"
              className="h-[46vh] w-full rounded-[var(--radius-md)] border border-line bg-surface-2"
            >
              <p className="p-4 text-sm text-muted">
                Ce navigateur ne peut pas afficher le PDF ici. Il sera quand même envoyé et lu.
              </p>
            </object>
          ) : (
            <p className="rounded-[var(--radius-md)] border border-line bg-surface-2 px-3 py-3 text-sm text-muted">
              Les fichiers HEIC ne s&apos;affichent dans aucun navigateur, il n&apos;y a donc pas
              d&apos;aperçu ici. Le fichier sera envoyé tel quel. Si la lecture automatique le
              refuse, le reçu passera en « Erreur » et vous pourrez saisir les montants à la main.
            </p>
          )}

          {!qrPayload && isPdf ? (
            <p className="rounded-[var(--radius-md)] border border-line bg-surface-2 px-3 py-2 text-xs text-muted">
              Un navigateur ne sait pas lire un code QR à l&apos;intérieur d&apos;un PDF. S&apos;il y
              en a un, il sera lu sur le serveur après l&apos;envoi, et vous le verrez sur
              l&apos;écran de vérification.
            </p>
          ) : null}

          {qrPayload ? (
            <div className="rounded-[var(--radius-md)] border border-line bg-surface-2 px-3 py-2">
              <p className="os-label text-xs font-semibold text-muted">Contenu du code QR</p>
              <p className="mt-1 break-all font-mono text-xs text-ink">{qrPayload.slice(0, 300)}</p>
              <p className="mt-1 text-xs text-muted">
                Conservé tel quel. Il n&apos;est jamais ouvert automatiquement, et ce qu&apos;il
                contient est vérifié sur le serveur avant d&apos;être utilisé.
              </p>
            </div>
          ) : null}

          {stage === "uploading" ? (
            <div className="flex flex-col gap-2">
              <div
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Envoi du reçu"
                className="h-2 w-full overflow-hidden rounded-full bg-surface-2"
              >
                <div
                  className="h-full rounded-full bg-primary transition-[width]"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-muted">Envoi… {progress} %</p>
                <button
                  type="button"
                  className={SECONDARY}
                  onClick={() => requestRef.current?.abort()}
                >
                  Annuler
                </button>
              </div>
            </div>
          ) : null}

          {stage === "reading" ? (
            <p className="text-sm font-semibold text-primary">
              Reçu enregistré. Lecture en cours, vous allez arriver sur l&apos;écran de
              vérification…
            </p>
          ) : null}

          {problem ? (
            <div className="rounded-[var(--radius-md)] border border-danger/25 bg-danger-soft px-3 py-2">
              <p className="text-sm font-semibold text-danger">{problem}</p>
              {duplicateId ? (
                <Link
                  href={`/receipts/${duplicateId}`}
                  className="mt-1 inline-block text-sm font-semibold text-primary hover:underline"
                >
                  Ouvrir le reçu déjà enregistré
                </Link>
              ) : null}
            </div>
          ) : null}

          {stage === "ready" || stage === "failed" ? (
            <div className="flex flex-wrap gap-2">
              <button type="button" className={PRIMARY} onClick={send}>
                {stage === "failed" ? "Réessayer l'envoi" : "Envoyer et lire le reçu"}
              </button>
              <Link href="/receipts" className={SECONDARY}>
                Annuler
              </Link>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
