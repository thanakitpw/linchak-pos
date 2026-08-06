"use client";

import { useEffect, useState } from "react";
import { contrastRatio, verdict, type ContrastVerdict } from "@/lib/contrast";
import type { ColorToken } from "@/lib/design-tokens";

/** อ่านค่าที่ browser resolve จริงจาก CSS variable */
function readVar(name: string): string {
  if (typeof window === "undefined") return "";
  return getComputedStyle(document.documentElement).getPropertyValue(`--color-${name}`).trim();
}

const BADGE: Record<ContrastVerdict, string> = {
  AAA: "bg-primary text-on-primary",
  AA: "bg-secondary-container text-on-secondary-fixed-variant",
  "AA-large": "bg-tertiary-fixed text-on-tertiary-fixed-variant",
  FAIL: "bg-error text-on-error",
};

export function Swatch({ token }: { token: ColorToken }) {
  const [hex, setHex] = useState("");
  const [pairs, setPairs] = useState<{ fg: string; ratio: number }[]>([]);

  useEffect(() => {
    const bg = readVar(token.name);
    setHex(bg);
    setPairs(
      (token.on ?? [])
        .map((fg) => ({ fg, ratio: contrastRatio(readVar(fg), bg) ?? 0 }))
        .filter((p) => p.ratio > 0)
    );
  }, [token]);

  const warn = token.use.startsWith("⚠️");

  return (
    <div className="border-outline-variant bg-surface-container-lowest shadow-card overflow-hidden rounded-md border">
      <div
        className="border-outline-variant/40 h-16 border-b"
        style={{ backgroundColor: `var(--color-${token.name})` }}
      />
      <div className="space-y-1 p-3">
        <div className="flex items-baseline justify-between gap-2">
          <code className="text-label-lg text-on-surface">{token.name}</code>
          <code className="text-label-sm text-on-surface-variant tnum uppercase">{hex || "…"}</code>
        </div>
        <p className={warn ? "text-label-sm text-error" : "text-label-sm text-on-surface-variant"}>
          {token.use}
        </p>
        {pairs.length > 0 && (
          <ul className="flex flex-wrap gap-1 pt-1">
            {pairs.map(({ fg, ratio }) => {
              const v = verdict(ratio);
              return (
                <li
                  key={fg}
                  className={`text-label-sm tnum rounded-full px-2 py-0.5 ${BADGE[v]}`}
                  title={`${fg} บน ${token.name}`}
                >
                  {fg} {ratio.toFixed(2)} {v}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
