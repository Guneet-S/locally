import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const SHOPPER_PATHS = [
  "/dashboard",
  "/inventory",
  "/reviews",
  "/settings",
  "/setup",
];

const SHOPPEE_PATHS = [
  "/home",
  "/explore",
  "/wishlist",
  "/profile",
  "/store",
  "/product",
];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const isShopperPath = SHOPPER_PATHS.some((p) => pathname.startsWith(p));
  const isShopeePath = SHOPPEE_PATHS.some((p) => pathname.startsWith(p));
  const isProtected = isShopperPath || isShopeePath;

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("role", isShopperPath ? "shopper" : "shoppee");
    return NextResponse.redirect(url);
  }

  if (user && isProtected) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile) {
      if (isShopperPath && profile.role !== "shopper") {
        const url = request.nextUrl.clone();
        url.pathname = "/role";
        return NextResponse.redirect(url);
      }
      if (isShopeePath && profile.role !== "shoppee") {
        const url = request.nextUrl.clone();
        url.pathname = "/role";
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}
