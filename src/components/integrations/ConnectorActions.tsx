"use client";

import { useState } from "react";

export function ConnectorActions({
  name,
  channelLabel,
  canTest,
  canDisconnect,
  primaryLabel,
  guideHref,
}: {
  name: string;
  channelLabel: string;
  canTest: boolean;
  canDisconnect: boolean;
  primaryLabel: string;
  guideHref: string;
}) {
  const [receipt, setReceipt] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="mt-auto flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        <a
          href={guideHref}
          className="rounded-[var(--radius-sm)] bg-primary px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-primary-hi"
        >
          {primaryLabel}
        </a>
        <button
          type="button"
          disabled={!canTest}
          onClick={() =>
            setReceipt(
              `A test ${channelLabel} request was added to the inbox and labelled as a test. Nothing was sent to ${name}.`,
            )
          }
          className="rounded-[var(--radius-sm)] border border-line bg-surface-2 px-3 py-1.5 text-[12px] font-medium disabled:cursor-not-allowed disabled:text-faint"
        >
          Send a test
        </button>
        {canDisconnect ? (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="rounded-[var(--radius-sm)] border border-line bg-surface px-3 py-1.5 text-[12px] font-medium"
          >
            Disconnect
          </button>
        ) : null}
      </div>

      {confirming ? (
        <div className="rounded-[var(--radius-sm)] border border-danger/20 bg-danger-soft px-3 py-2 text-[12px] text-danger">
          <p className="font-semibold">Disconnect {name}?</p>
          <p className="mt-0.5">
            New requests stop arriving straight away. Conversations already received stay, and keep
            their source.
          </p>
          <div className="mt-2 flex gap-1.5">
            <button
              type="button"
              onClick={() => {
                setConfirming(false);
                setReceipt("Nothing was disconnected. Disconnecting works once a real account is connected.");
              }}
              className="rounded-[var(--radius-sm)] border border-danger/30 px-2.5 py-1 font-semibold"
            >
              Yes, disconnect
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="rounded-[var(--radius-sm)] border border-line bg-surface px-2.5 py-1 text-ink"
            >
              Keep it
            </button>
          </div>
        </div>
      ) : null}

      {receipt ? (
        <p role="status" className="rounded-[var(--radius-sm)] border border-line bg-surface-2 px-3 py-2 text-[12px] text-muted">
          {receipt}
        </p>
      ) : null}
    </div>
  );
}
