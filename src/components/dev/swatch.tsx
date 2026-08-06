"use client";

import { useCallback, useState } from "react";
import { contrastRatio, verdict, type ContrastVerdict } from "@/lib/contrast";
import type { ColorGroup } from "@/lib/design-tokens";

type Resolved = { hex: string; pairs: { fg: string; ratio: number }[] };

const BADGE: Record<ContrastVerdict, string> = {
  AAA: "bg-primary text-on-primary",
  AA: "bg-secondary-container text-on-secondary-fixed-variant",
  "AA-large": "bg-tertiary-fixed text-on-tertiary-fixed-variant",
  FAIL: "bg-error text-on-error",
};

/**
 * อ่านค่าที่ browser resolve จริง แล้วคำนวณ contrast สด
 * — ไม่ใช่อ่าน literal จาก theme.css เพราะแบบนั้นพิสูจน์ได้แค่ว่าเราพิมพ์อะไรลงไป
 * ไม่ได้พิสูจน์ว่า CSS resolve ออกมาเป็นอะไรจริงๆ
 *
 * ใช้ callback ref ไม่ใช่ useEffect: การวัดค่าจาก DOM ต้องรอจนโหนดติดจอ
 * ซึ่ง ref callback คือจังหวะนั้นพอดี ส่วน setState ใน effect จะทำให้ render ซ้อน
 */
export function SwatchGrid({ groups }: { groups: ColorGroup[] }) {
  const [resolved, setResolved] = useState<Record<string, Resolved>>({});

  const measure = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) return;
      const style = getComputedStyle(document.documentElement);
      const read = (n: string) => style.getPropertyValue(`--color-${n}`).trim();

      const next: Record<string, Resolved> = {};
      for (const group of groups) {
        for (const token of group.tokens) {
          const hex = read(token.name);
          next[token.name] = {
            hex,
            pairs: (token.on ?? [])
              .map((fg) => ({ fg, ratio: contrastRatio(read(fg), hex) ?? 0 }))
              .filter((p) => p.ratio > 0),
          };
        }
      }
      setResolved(next);
    },
    [groups]
  );

  return (
    <div ref={measure} className="space-y-8">
      {groups.map((group) => (
        <div key={group.title} className="space-y-3">
          <h3 className="text-title-lg text-on-surface">{group.title}</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {group.tokens.map((token) => {
              const r = resolved[token.name];
              const warn = token.use.startsWith("⚠️");
              return (
                <div
                  key={token.name}
                  className="overflow-hidden rounded-md border border-outline-variant bg-surface-container-lowest shadow-card"
                >
                  <div
                    className="h-16 border-b border-outline-variant/40"
                    style={{ backgroundColor: `var(--color-${token.name})` }}
                  />
                  <div className="space-y-1 p-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <code className="text-label-lg text-on-surface">{token.name}</code>
                      <code className="text-label-sm text-on-surface-variant uppercase tnum">
                        {r?.hex ?? "…"}
                      </code>
                    </div>
                    <p
                      className={
                        warn ? "text-label-sm text-error" : "text-label-sm text-on-surface-variant"
                      }
                    >
                      {token.use}
                    </p>
                    {r && r.pairs.length > 0 && (
                      <ul className="flex flex-wrap gap-1 pt-1">
                        {r.pairs.map(({ fg, ratio }) => {
                          const v = verdict(ratio);
                          return (
                            <li
                              key={fg}
                              className={`rounded-full px-2 py-0.5 text-label-sm tnum ${BADGE[v]}`}
                              title={`${fg} / ${token.name}`}
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
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
