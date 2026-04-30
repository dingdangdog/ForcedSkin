import jwtLib from "jsonwebtoken";
import prisma from "~~/server/lib/prisma";
import { getServerSession } from "#auth";

function sanitizeRedirectUri(redirectUri: string | null): string | null {
  if (!redirectUri) return null;
  const trimmed = redirectUri.trim();
  if (!trimmed.startsWith("https://") && !trimmed.startsWith("http://") && !trimmed.startsWith("chrome-extension://")) {
    return null;
  }
  return trimmed;
}

function appendQuery(url: string, key: string, value: string): string {
  const u = new URL(url);
  u.searchParams.set(key, value);
  return u.toString();
}

export default defineEventHandler(async (event) => {
  const redirectUri = sanitizeRedirectUri(getQuery(event).redirect_uri as string | null);
  if (!redirectUri) {
    throw createError({ statusCode: 400, statusMessage: "redirect_uri is required" });
  }

  const currentUrl = getRequestURL(event).toString();
  const session = await getServerSession(event);
  const sessionUser = session?.user as { id?: string } | undefined;

  if (!sessionUser?.id) {
    const loginUrl = new URL("/auth/login", useRuntimeConfig().public.siteUrl || "https://forcedskin.com");
    loginUrl.searchParams.set("callbackUrl", currentUrl);
    return sendRedirect(event, loginUrl.toString(), 302);
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      roles: true,
      lightTheme: true,
      darkTheme: true,
    },
  });

  if (!user?.id) {
    const failedUrl = appendQuery(redirectUri, "error", "user_not_found");
    return sendRedirect(event, failedUrl, 302);
  }

  const secretKey = useRuntimeConfig().authSecret;
  const token = jwtLib.sign(
    {
      id: user.id,
      name: user.name || "",
      email: user.email || "",
      roles: user.roles || "user",
    },
    secretKey,
    { expiresIn: "30d" },
  );

  const successUrl = new URL(redirectUri);
  successUrl.searchParams.set("token", token);
  successUrl.searchParams.set("id", user.id);
  successUrl.searchParams.set("name", user.name || "");
  successUrl.searchParams.set("email", user.email || "");
  successUrl.searchParams.set("avatar", user.avatar || "");
  successUrl.searchParams.set("roles", user.roles || "user");
  successUrl.searchParams.set("lightTheme", user.lightTheme || "");
  successUrl.searchParams.set("darkTheme", user.darkTheme || "");
  return sendRedirect(event, successUrl.toString(), 302);
});
