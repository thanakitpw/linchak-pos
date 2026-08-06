import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import betterTailwind from "eslint-plugin-better-tailwindcss";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { "better-tailwindcss": betterTailwind },
    rules: {
      /**
       * กฎที่คุ้มที่สุดในไฟล์นี้
       * มัน resolve ทุก class กับ Tailwind build จริง แปลว่า `px-md`,
       * `text-title-lg-mobile`, `shadow-sm` กลายเป็นเส้นแดงใน editor
       * แทนที่จะเป็น class ที่ไม่ทำอะไรเลยแบบเงียบๆ ตอนพอร์ต mockup
       */
      "better-tailwindcss/no-unknown-classes": [
        "error",
        {
          entryPoint: "src/app/globals.css",
          // class ที่ไม่ใช่ utility ของ Tailwind: ของเราเอง + ของ shadcn
          ignore: ["^material-symbols$", "^(group|peer)(/.*)?$", "^dark$"],
        },
      ],
      "better-tailwindcss/no-conflicting-classes": ["error", { entryPoint: "src/app/globals.css" }],
      "better-tailwindcss/no-duplicate-classes": "error",
      "better-tailwindcss/no-deprecated-classes": ["error", { entryPoint: "src/app/globals.css" }],
    },
  },

  {
    // lucide เข้ามาพร้อม shadcn primitive (X, Check, Chevron*) — ยอมให้อยู่แค่ใน ui/
    // ไอคอนของแอปทั้งหมดต้องผ่าน <Icon name=…/> ซึ่งใช้ Material Symbols subset
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/components/ui/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "lucide-react",
              message:
                'ใช้ <Icon name="…"/> (Material Symbols) — lucide ใช้ได้เฉพาะภายใน src/components/ui/',
            },
          ],
        },
      ],
    },
  },

  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // reference material — ไม่ใช่ซอร์สของแอป
    "pos_design/**",
    "docs/**",
  ]),
]);

export default eslintConfig;
