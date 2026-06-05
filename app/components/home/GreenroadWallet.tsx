"use client";

import { useState } from "react";

interface GreenroadWalletProps {
  onJoinClick?: () => void;
}

export function GreenroadWallet({ onJoinClick }: GreenroadWalletProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="greenroad-wallet">
      <button
        type="button"
        className="greenroad-wallet__trigger"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Your Green Road wallet"
      >
        <span className="greenroad-wallet__icon" aria-hidden>
          ◈
        </span>
        <span>Your Green Road</span>
      </button>

      {open && (
        <div className="greenroad-wallet__panel" role="dialog" aria-label="Wallet">
          <h2 className="greenroad-wallet__panel-title">Your Green Road</h2>
          <p className="greenroad-wallet__panel-copy">
            Save discoveries, follow ecosystems, and track choices that align with
            you. Guest mode for now — email sign-in comes later.
          </p>
          <button
            type="button"
            className="greenroad-wallet__panel-cta"
            onClick={() => {
              onJoinClick?.();
              setOpen(false);
            }}
          >
            Join The Green Road
          </button>
        </div>
      )}
    </div>
  );
}
