/**
 * ธนาคารไทยที่รับโอนได้ — FR-1.2 (ส่วนขยาย: ช่องทางโอนเงิน)
 *
 * รหัสเป็นรหัสธนาคารของ ธปท. (BOT) ตัวเดียวกับที่ใช้ใน PromptPay/ITMX
 * เก็บรหัสลง DB ไม่ใช่ชื่อ — ชื่อธนาคารเปลี่ยนได้ (TMB+ธนชาต → ttb ปี 2564)
 * แต่รหัสไม่เปลี่ยน และการ rename ทีหลังจะไม่ทำให้ข้อมูลเก่าอ่านไม่ออก
 *
 * ⚠️ `color` คือ **สีประจำแบรนด์** ไม่ใช่ token ของ design system
 *    อย่าเอาไปใส่ theme.css และอย่าเอาไปใช้กับอย่างอื่น
 *    ใช้เป็น inline style เพราะ 15 สีนี้ generate เป็น utility ไม่ได้
 *    (และกฎ 4 ห้าม `bg-[#…]` อยู่แล้ว)
 *
 * ⚠️ ไม่ได้ฝังไฟล์โลโก้จริงของธนาคาร — โลโก้เป็นเครื่องหมายการค้า
 *    การเอามาแจกในแอปโดยไม่มีสิทธิ์เป็นความเสี่ยงที่ไม่คุ้ม
 *    ใช้ป้ายสีประจำแบรนด์ + อักษรย่อแทน ซึ่งคนไทยจำสีธนาคารได้อยู่แล้ว
 *    (ถ้าวันหนึ่งได้ไฟล์โลโก้มาถูกต้อง เติม field `logo` ตรงนี้ได้เลย)
 */
export type Bank = {
  /** รหัส ธปท. 3 หลัก */
  code: string;
  /** อักษรย่อบนป้ายสี — สั้นพอที่ 40×40px */
  short: string;
  nameTh: string;
  nameEn: string;
  /** สีพื้นป้าย (hex ทึบ — ใบเสร็จห้าม color-mix ตามกฎ 31) */
  color: string;
  /** สีตัวอักษรบนป้าย — คู่ที่ผ่าน contrast กับ `color` */
  onColor: string;
};

export const BANKS: readonly Bank[] = [
  { code: "004", short: "KBANK", nameTh: "กสิกรไทย", nameEn: "Kasikornbank", color: "#138f2d", onColor: "#ffffff" }, // prettier-ignore
  { code: "014", short: "SCB", nameTh: "ไทยพาณิชย์", nameEn: "Siam Commercial Bank", color: "#4e2e7f", onColor: "#ffffff" }, // prettier-ignore
  { code: "002", short: "BBL", nameTh: "กรุงเทพ", nameEn: "Bangkok Bank", color: "#1e4598", onColor: "#ffffff" }, // prettier-ignore
  { code: "006", short: "KTB", nameTh: "กรุงไทย", nameEn: "Krungthai Bank", color: "#1ba5e1", onColor: "#ffffff" }, // prettier-ignore
  { code: "025", short: "BAY", nameTh: "กรุงศรีอยุธยา", nameEn: "Krungsri", color: "#7c3f00", onColor: "#ffffff" }, // prettier-ignore
  { code: "011", short: "TTB", nameTh: "ทีทีบี", nameEn: "ttb", color: "#1279be", onColor: "#ffffff" }, // prettier-ignore
  { code: "030", short: "GSB", nameTh: "ออมสิน", nameEn: "Government Savings Bank", color: "#eb198d", onColor: "#ffffff" }, // prettier-ignore
  { code: "034", short: "BAAC", nameTh: "ธ.ก.ส.", nameEn: "BAAC", color: "#4b9b1d", onColor: "#ffffff" }, // prettier-ignore
  { code: "033", short: "GHB", nameTh: "อาคารสงเคราะห์", nameEn: "Government Housing Bank", color: "#f57d23", onColor: "#ffffff" }, // prettier-ignore
  { code: "069", short: "KKP", nameTh: "เกียรตินาคินภัทร", nameEn: "Kiatnakin Phatra", color: "#199cc5", onColor: "#ffffff" }, // prettier-ignore
  { code: "022", short: "CIMB", nameTh: "ซีไอเอ็มบีไทย", nameEn: "CIMB Thai", color: "#7e2f36", onColor: "#ffffff" }, // prettier-ignore
  { code: "067", short: "TISCO", nameTh: "ทิสโก้", nameEn: "Tisco Bank", color: "#12549f", onColor: "#ffffff" }, // prettier-ignore
  { code: "024", short: "UOB", nameTh: "ยูโอบี", nameEn: "UOB", color: "#0b3979", onColor: "#ffffff" }, // prettier-ignore
  { code: "073", short: "LHB", nameTh: "แลนด์ แอนด์ เฮ้าส์", nameEn: "LH Bank", color: "#6d6e71", onColor: "#ffffff" }, // prettier-ignore
  { code: "070", short: "ICBC", nameTh: "ไอซีบีซี (ไทย)", nameEn: "ICBC (Thai)", color: "#c50f1c", onColor: "#ffffff" }, // prettier-ignore
];

const BY_CODE = new Map(BANKS.map((b) => [b.code, b]));

export function findBank(code: string | null | undefined): Bank | null {
  return code ? (BY_CODE.get(code) ?? null) : null;
}

export function isBankCode(v: unknown): v is string {
  return typeof v === "string" && BY_CODE.has(v);
}

/**
 * เลขบัญชีไทยมี 10-15 หลัก แล้วแต่ธนาคาร (ออมสินยาวสุด)
 * เก็บเป็นตัวเลขล้วน — ขีดคั่นเป็นเรื่องของการแสดงผล ไม่ใช่ของข้อมูล
 */
export function normaliseAccountNo(raw: string): string {
  return raw.replace(/\D/g, "");
}

export function isValidAccountNo(digits: string): boolean {
  return /^\d{10,15}$/.test(digits);
}

/**
 * คั่นเป็นกลุ่มให้อ่านและกดตามได้ง่าย — คนคัดลอกเลขบัญชีจากจอไปพิมพ์ในแอปธนาคาร
 * รูปแบบ x-xxx-xxxxx-x คือแบบที่พบบ่อยสุดของบัญชี 10 หลัก
 * เลขความยาวอื่นคั่นทีละ 4 ซึ่งอ่านง่ายกว่าไม่คั่นเลย
 */
export function formatAccountNo(digits: string): string {
  if (digits.length === 10) {
    return `${digits.slice(0, 1)}-${digits.slice(1, 4)}-${digits.slice(4, 9)}-${digits.slice(9)}`;
  }
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
}
