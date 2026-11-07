"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";

/** Draws the QR in the browser as an SVG, so it stays sharp on screen and in print. */
export default function QrCode({ value, size, label }: { value: string; size: number; label: string }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    QRCode.toString(value, {
      type: "svg",
      margin: 0,
      errorCorrectionLevel: "M",
      color: { dark: "#0E0B10", light: "#FFFFFF" },
    }).then(
      (svg) => {
        if (live) setSrc(`data:image/svg+xml,${encodeURIComponent(svg)}`);
      },
      () => {
        if (live) setSrc(null);
      },
    );
    return () => {
      live = false;
    };
  }, [value]);

  return (
    <div className="p-3 rounded-lg bg-white shrink-0">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={label} width={size} height={size} className="block" style={{ width: size, height: size }} />
      ) : (
        <div role="img" aria-label={label} style={{ width: size, height: size }} />
      )}
    </div>
  );
}
