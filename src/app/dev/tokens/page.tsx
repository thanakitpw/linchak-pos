import { getTranslations } from "next-intl/server";
import { Icon } from "@/components/ui/icon";
import { MockupOverlay } from "@/components/dev/mockup-overlay";
import { Swatch } from "@/components/dev/swatch";
import {
  COLOR_GROUPS,
  LAYOUT_TOKENS,
  RADII,
  SHADOWS,
  TYPE_STEPS,
  Z_LADDER,
} from "@/lib/design-tokens";
import { ICON_NAMES } from "@/lib/icons";
import { formatTHB, formatDateTime } from "@/lib/format";
import { toSatang } from "@/lib/money";

const ICON_SIZES = [16, 20, 24, 32, 40, 48] as const;

/* Tailwind สแกนซอร์สแบบ static — `text-${name}` ไม่ถูก detect และจะไม่ถูก generate
   ทุก class ที่ผันตามข้อมูลจึงต้องเขียนเต็มไว้ในตาราง lookup */
const TYPE_CLASS: Record<string, string> = {
  "display-lg": "text-display-lg",
  "headline-lg": "text-headline-lg",
  "headline-md": "text-headline-md",
  "title-lg": "text-title-lg",
  "body-lg": "text-body-lg",
  "body-md": "text-body-md",
  "label-lg": "text-label-lg",
  "label-sm": "text-label-sm",
};

const SHADOW_CLASS: Record<string, string> = {
  card: "shadow-card",
  raised: "shadow-raised",
  nav: "shadow-nav",
  overlay: "shadow-overlay",
  primary: "shadow-primary",
};

function Section({
  id,
  title,
  note,
  children,
}: {
  id: string;
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20 space-y-4">
      <div className="border-outline-variant border-b pb-2">
        <h2 className="text-headline-md text-on-surface">{title}</h2>
        {note && <p className="text-label-lg text-on-surface-variant mt-1">{note}</p>}
      </div>
      {children}
    </section>
  );
}

export default async function TokensPage() {
  const t = await getTranslations("dev");
  const sampleDate = new Date("2026-08-05T08:56:00Z");

  return (
    <main className="max-w-content mx-auto space-y-12 p-4 pb-24 md:p-8">
      <header className="space-y-2">
        <h1 className="text-headline-md md:text-headline-lg text-primary">
          {t("tokensTitle")}
        </h1>
        <p className="text-body-md text-on-surface-variant">
          หน้าพิสูจน์ token ทุกตัวใน <code>src/styles/theme.css</code> · ค่าที่แสดงอ่านจาก{" "}
          <code>getComputedStyle</code> ไม่ใช่จาก literal ในซอร์ส
        </p>
        <nav className="flex flex-wrap gap-2 pt-2">
          {[
            ["colors", "สี"],
            ["type", "ตัวอักษร"],
            ["weight-test", "ทดสอบ font-weight"],
            ["radius", "มุมโค้ง"],
            ["elevation", "เงา"],
            ["spacing", "ระยะ"],
            ["layout", "layout + z"],
            ["icons", "ไอคอน"],
            ["thai", "ข้อความไทย"],
          ].map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              className="border-outline-variant text-label-lg text-on-surface hover:bg-surface-container-low rounded-full border px-3 py-1 transition-colors"
            >
              {label}
            </a>
          ))}
        </nav>
      </header>

      {/* ── สี ───────────────────────────────────────────────────────────── */}
      <Section
        id="colors"
        title="สี"
        note="badge บอกอัตราส่วน contrast ที่คำนวณสดจากค่าที่ browser resolve · FAIL = ห้ามใช้คู่นี้"
      >
        {COLOR_GROUPS.map((group) => (
          <div key={group.title} className="space-y-3">
            <h3 className="text-title-lg text-on-surface">{group.title}</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.tokens.map((token) => (
                <Swatch key={token.name} token={token} />
              ))}
            </div>
          </div>
        ))}
      </Section>

      {/* ── ตัวอักษร ─────────────────────────────────────────────────────── */}
      <Section
        id="type"
        title="ตัวอักษร"
        note="8 ขั้น · ไม่มี token ลงท้าย -mobile — responsive ใช้ text-X md:text-Y"
      >
        <div className="space-y-6">
          {TYPE_STEPS.map((step) => (
            <div key={step.name} className="border-outline-variant/40 space-y-1 border-b pb-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <code className="text-label-lg text-primary">text-{step.name}</code>
                <span className="text-label-sm text-on-surface-variant tnum">
                  {step.spec} · {step.use}
                </span>
              </div>
              <p className={`${TYPE_CLASS[step.name]} text-on-surface`}>
                ยอดขายวันนี้ ฿1,250.00 · Sales today
              </p>
              <p className={`${TYPE_CLASS[step.name]} text-on-surface-variant tnum`}>
                0123456789 ฿1,250.00 · ก้ำกึ่ง ปั๊ปปี้ ญี่ปุ่น
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── ทดสอบ font-weight override ───────────────────────────────────── */}
      <Section
        id="weight-test"
        title="ทดสอบ font-weight override"
        note="v4 emit `font-weight: var(--tw-font-weight, <token>)` และ font-bold เซ็ต --tw-font-weight ⇒ class font-* ต้องชนะเสมอ"
      >
        <div className="border-outline-variant bg-surface-container-lowest space-y-3 rounded-md border p-4">
          <p className="text-title-lg">
            <code className="text-label-sm text-on-surface-variant">text-title-lg</code> — ต้องเป็น
            600
          </p>
          <p className="text-title-lg font-bold">
            <code className="text-label-sm text-on-surface-variant">
              text-title-lg font-bold
            </code>{" "}
            — ต้องเป็น 700 (หนากว่าบรรทัดบน)
          </p>
          <p className="text-title-lg font-normal">
            <code className="text-label-sm text-on-surface-variant">
              text-title-lg font-normal
            </code>{" "}
            — ต้องเป็น 400 (บางกว่าบรรทัดแรก)
          </p>
          <p className="text-body-md font-semibold">
            <code className="text-label-sm text-on-surface-variant">
              text-body-md font-semibold
            </code>{" "}
            — ต้องเป็น 600
          </p>
          <p className="text-display-lg leading-tight">
            <code className="text-label-sm text-on-surface-variant">
              text-display-lg leading-tight
            </code>{" "}
            — line-height ต้องแคบลง
          </p>
        </div>
      </Section>

      {/* ── มุมโค้ง ──────────────────────────────────────────────────────── */}
      <Section
        id="radius"
        title="มุมโค้ง"
        note="ค่าที่ mockup render จริง เปลี่ยนชื่อให้ monotonic · DESIGN.md เพี้ยนไป 1 ขั้น"
      >
        <div className="flex flex-wrap gap-4">
          {RADII.map((r) => (
            <div key={r.name} className="space-y-2 text-center">
              <div
                className="bg-primary-container border-outline-variant size-24 border"
                style={{ borderRadius: r.name === "full" ? "9999px" : `var(--radius-${r.name})` }}
              />
              <code className="text-label-lg text-on-surface block">rounded-{r.name}</code>
              <span className="text-label-sm text-on-surface-variant tnum block">
                {r.name === "full" ? "∞" : `${r.px}px`}
              </span>
              <span className="text-label-sm text-on-surface-variant block max-w-24">{r.use}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* ── เงา ─────────────────────────────────────────────────────────── */}
      <Section
        id="elevation"
        title="เงา"
        note="แทน arbitrary shadow-[…] กว่า 90 จุดใน mockup · แสดงบนสองพื้นเพื่อดูว่า 0.02 กับ 0.05 แยกออกจากกันจริง"
      >
        {(
          [
            { label: "surface", cls: "bg-surface" },
            { label: "surface-container-lowest", cls: "bg-surface-container-lowest" },
          ] as const
        ).map((bg) => (
          <div
            key={bg.label}
            className={`${bg.cls} border-outline-variant rounded-md border p-6`}
          >
            <code className="text-label-sm text-on-surface-variant mb-4 block">บน {bg.label}</code>
            <div className="flex flex-wrap gap-6">
              {SHADOWS.map((s) => (
                <div
                  key={s.name}
                  className={`bg-surface-container-lowest ${SHADOW_CLASS[s.name]} w-40 rounded-md p-4`}
                >
                  <code className="text-label-lg text-on-surface block">shadow-{s.name}</code>
                  <span className="text-label-sm text-on-surface-variant">{s.use}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </Section>

      {/* ── ระยะ ────────────────────────────────────────────────────────── */}
      <Section
        id="spacing"
        title="ระยะ"
        note="ใช้เลข Tailwind อย่างเดียว (p-4 = 16px) · ไม่มี p-md / gap-gutter อีกแล้ว"
      >
        <div className="space-y-2">
          {[1, 2, 3, 4, 6, 8].map((n) => (
            <div key={n} className="flex items-center gap-4">
              <code className="text-label-lg text-on-surface w-16">p-{n}</code>
              <div className="bg-primary h-4" style={{ width: `calc(var(--spacing) * ${n})` }} />
              <span className="text-label-sm text-on-surface-variant tnum">{n * 4}px</span>
            </div>
          ))}
        </div>
      </Section>

      {/* ── layout + z ──────────────────────────────────────────────────── */}
      <Section id="layout" title="Layout + z-index" note="ค่าที่เข้ารหัสการตัดสินใจ ไม่ใช่แค่ตัวเลข">
        <div className="grid gap-6 md:grid-cols-2">
          <table className="text-body-md w-full">
            <tbody>
              {LAYOUT_TOKENS.map((l) => (
                <tr key={l.name} className="border-outline-variant/40 border-b">
                  <td className="py-2">
                    <code className="text-label-lg text-primary">{l.name}</code>
                  </td>
                  <td className="text-label-sm text-on-surface-variant py-2">{l.use}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <table className="text-body-md w-full">
            <tbody>
              {Z_LADDER.map((z) => (
                <tr key={z.name} className="border-outline-variant/40 border-b">
                  <td className="py-2">
                    <code className="text-label-lg text-primary">{z.name}</code>
                  </td>
                  <td className="text-label-sm text-on-surface-variant tnum py-2">{z.z}</td>
                  <td className="text-label-sm text-on-surface-variant py-2">{z.use}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-outline-variant rounded-md border p-4">
          <code className="text-label-sm text-on-surface-variant mb-2 block">
            safe area — ต้องทดสอบบน iPhone Safari เครื่องจริง simulator รายงานผิด
          </code>
          <div className="bg-secondary-container pb-safe rounded-sm p-2">
            <span className="text-label-lg text-on-secondary-fixed-variant">
              กล่องนี้ใช้ .pb-safe
            </span>
          </div>
        </div>
      </Section>

      {/* ── ไอคอน ───────────────────────────────────────────────────────── */}
      <Section
        id="icons"
        title={`ไอคอน (${ICON_NAMES.length} ตัว)`}
        note="subset woff2 7.5 KB · ถ้าเห็นกล่องสี่เหลี่ยม (tofu) หรือเห็นชื่อไอคอนเป็นข้อความ = ฟอนต์ไม่โหลด"
      >
        <div className="flex flex-wrap gap-4">
          {ICON_SIZES.map((size) => (
            <div key={size} className="border-outline-variant rounded-md border p-3">
              <code className="text-label-sm text-on-surface-variant mb-2 block">size={size}</code>
              <div className="flex items-center gap-2">
                <Icon name="point_of_sale" size={size} />
                <Icon name="point_of_sale" size={size} filled />
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {ICON_NAMES.map((name) => (
            <div
              key={name}
              className="border-outline-variant bg-surface-container-lowest flex flex-col items-center gap-1 rounded-md border p-3"
            >
              <div className="text-on-surface flex gap-2">
                <Icon name={name} size={24} />
                <Icon name={name} size={24} filled />
              </div>
              <code className="text-label-sm text-on-surface-variant text-center break-all">
                {name}
              </code>
            </div>
          ))}
        </div>
      </Section>

      {/* ── ข้อความไทย ──────────────────────────────────────────────────── */}
      <Section
        id="thai"
        title="ข้อความไทย"
        note="ไทยไม่มีช่องว่างระหว่างคำ — ชื่อยาวจะล้นตรงที่อังกฤษตัดบรรทัดได้ · ทดสอบที่ 360px"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="border-outline-variant bg-surface-container-lowest space-y-3 rounded-md border p-4">
            <code className="text-label-sm text-on-surface-variant block">
              ชื่อสินค้ายาว ไม่ break-words → ล้น
            </code>
            <div className="border-error w-[200px] border p-2">
              <p className="text-body-md text-on-surface">{t("sampleProductName")}</p>
            </div>
            <code className="text-label-sm text-on-surface-variant block">
              + break-words → ตัดได้
            </code>
            <div className="border-primary w-[200px] border p-2">
              <p className="text-body-md text-on-surface break-words">{t("sampleProductName")}</p>
            </div>
            <code className="text-label-sm text-on-surface-variant block">
              + line-clamp-2 → ตัดจบ
            </code>
            <div className="border-primary w-[200px] border p-2">
              <p className="text-body-md text-on-surface line-clamp-2 break-words">
                {t("sampleProductName")}
              </p>
            </div>
          </div>

          <div className="border-outline-variant bg-surface-container-lowest space-y-3 rounded-md border p-4">
            <code className="text-label-sm text-on-surface-variant block">
              เงิน + วันที่ (ต้องเป็นปี ค.ศ. ไม่ใช่ พ.ศ.)
            </code>
            <p className="text-display-lg text-primary tnum">{formatTHB(toSatang(1250), "th")}</p>
            <p className="text-body-md text-on-surface tnum">
              {formatDateTime(sampleDate, "th")}
            </p>
            <p className="text-body-md text-on-surface">{t("sampleSentence")}</p>
            <code className="text-label-sm text-on-surface-variant block pt-2">
              คอลัมน์เงินต้องใช้ .tnum ไม่งั้นตัวเลขเต้น
            </code>
            <div className="grid grid-cols-2 gap-1">
              <span className="text-body-md text-on-surface tnum text-right">1,111.11</span>
              <span className="text-body-md text-on-surface text-right">1,111.11</span>
              <span className="text-body-md text-on-surface tnum text-right">8,888.88</span>
              <span className="text-body-md text-on-surface text-right">8,888.88</span>
              <span className="text-label-sm text-on-surface-variant text-right">tnum ✓</span>
              <span className="text-label-sm text-on-surface-variant text-right">ไม่มี tnum</span>
            </div>
          </div>
        </div>
      </Section>

      <MockupOverlay />
    </main>
  );
}
