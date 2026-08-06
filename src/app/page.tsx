import { redirect } from "next/navigation";

/** PRD §4 · แท็บ "ขาย" เป็นหน้าเริ่มต้นของแอป */
export default function Root() {
  redirect("/sell");
}
