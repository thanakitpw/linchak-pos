import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** หน้าที่เปิดได้โดยไม่ต้องล็อกอิน */
const PUBLIC_PREFIXES = [
  "/login",
  "/signup",
  "/reset-password",
  "/auth", // callback ของ Supabase Auth
  "/r", // FR-4.6 · ลิงก์บิล public ที่ลูกค้าเปิดจาก LINE
  "/dev", // หน้าพิสูจน์ (มี notFound() กันไว้อีกชั้นตอน production)
];

/**
 * รีเฟรช session ทุก request แล้วกันหน้าที่ต้องล็อกอิน
 *
 * ⚠️ ห้ามแทรกโค้ดระหว่าง createServerClient กับ getClaims()
 * ลำดับที่สลับทำให้ token ไม่ถูกรีเฟรช แล้วผู้ใช้จะหลุดล็อกอินแบบสุ่ม ซึ่งดีบักยากมาก
 *
 * ⚠️ ต้อง return `response` ตัวเดิมที่ setAll เขียน cookie ลงไป
 * ถ้าสร้าง NextResponse ใหม่โดยไม่ copy cookie มาด้วย session จะหายทุกครั้ง
 *
 * นี่คือ optimistic check เท่านั้น — การอนุญาตจริงอยู่ที่ RLS ในฐานข้อมูล
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data } = await supabase.auth.getClaims();
  const isSignedIn = Boolean(data?.claims);

  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (!isSignedIn && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    // จำไว้ว่าจะพากลับไปไหนหลังล็อกอินเสร็จ
    if (pathname !== "/") url.searchParams.set("next", pathname);
    return redirectKeepingSession(url, response);
  }

  // ล็อกอินอยู่แล้วแต่เปิดหน้า auth → ส่งเข้าแอป
  if (isSignedIn && ["/login", "/signup"].includes(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return redirectKeepingSession(url, response);
  }

  return response;
}

/**
 * เด้งไปหน้าอื่นโดย **ไม่ทิ้ง cookie ที่เพิ่งรีเฟรช**
 *
 * 🚨 นี่คือสาเหตุที่ผู้ใช้หลุดล็อกอินเป็นระยะ
 *
 * `getClaims()` ด้านบนรีเฟรช token ให้เมื่อใกล้หมดอายุ แล้วเขียน token ชุดใหม่
 * ลง `response` ผ่าน `setAll` · การ `return NextResponse.redirect(url)` เฉยๆ
 * คือการโยน `response` ตัวนั้นทิ้งทั้งใบ — cookie ชุดใหม่ไม่เคยไปถึงเบราว์เซอร์
 *
 * ผลคือ **refresh token ตัวเก่าถูกใช้ไปแล้วฝั่ง Supabase แต่เบราว์เซอร์ยังถือตัวเก่าอยู่**
 * request ถัดไปจึงรีเฟรชไม่ผ่าน → ถือว่าไม่ได้ล็อกอิน → เด้งไปหน้า login
 *
 * เห็นในตาราง `auth.sessions` เป็นบัญชีเดียวที่มี session ใหม่ 5 อันในชั่วโมงครึ่ง
 * ห่างกันบางครั้งแค่ 3 นาที ซึ่งอธิบายด้วย "token หมดอายุ 1 ชม." ไม่ได้เลย
 */
function redirectKeepingSession(url: URL, from: NextResponse) {
  const redirect = NextResponse.redirect(url);
  from.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}
