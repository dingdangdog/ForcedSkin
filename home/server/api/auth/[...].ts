import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { NuxtAuthHandler } from "#auth";
import prisma from "~~/server/lib/prisma";

/** 找到或创建 OAuth 用户，返回数据库记录 */
async function upsertOAuthUser(params: {
  provider: "github" | "google";
  providerId: string;
  name: string;
  email: string | null | undefined;
  avatar: string | null | undefined;
}) {
  const { provider, providerId, name, email, avatar } = params;
  const where =
    provider === "github"
      ? { githubId: providerId }
      : { googleId: providerId };

  let user = await prisma.user.findUnique({ where });

  if (!user) {
    user = await prisma.user.create({
      data: {
        ...(provider === "github" ? { githubId: providerId } : { googleId: providerId }),
        name: name || "User",
        email: email || undefined,
        avatar: avatar || undefined,
        roles: "user",
        lastLoginAt: new Date(),
      },
    });
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        // 同步最新头像和名称
        name: name || user.name,
        avatar: avatar || user.avatar,
        email: email || user.email,
      },
    });
  }

  return user;
}

export default NuxtAuthHandler({
  secret: useRuntimeConfig().authSecret,

  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
    signOut: "/auth/login",
  },

  providers: [
    // @ts-ignore — .default required for SSR
    GithubProvider.default({
      clientId: useRuntimeConfig().github.clientId,
      clientSecret: useRuntimeConfig().github.clientSecrets,
      httpOptions: { timeout: 30000 },
    }),
    // @ts-ignore
    GoogleProvider.default({
      clientId: useRuntimeConfig().google.clientId,
      clientSecret: useRuntimeConfig().google.clientSecrets,
      httpOptions: { timeout: 30000 },
    }),
  ],

  callbacks: {
    /** OAuth 登录成功后把数据库用户信息写入 token */
    async jwt(param) {
      try {
        if (param.account) {
          const provider = param.account.provider as "github" | "google";
          if (provider !== "github" && provider !== "google") return param.token;

          const user = await upsertOAuthUser({
            provider,
            providerId: param.user.id,
            name: param.user.name ?? "",
            email: param.user.email,
            avatar: param.user.image,
          });

          param.token.id = user.id;
          param.token.name = user.name;
          param.token.email = user.email ?? "";
          param.token.picture = user.avatar ?? param.user.image ?? "";
          param.token.provider = provider;
          param.token.roles = user.roles ?? "user";
        }
        return param.token;
      } catch (err) {
        console.error("[auth] jwt callback error:", err);
        return param.token;
      }
    },

    /** 把 token 映射到 session，客户端通过 useAuth().data 可访问 */
    async session(param) {
      try {
        if (param.token) {
          param.session.user = {
            name: param.token.name ?? null,
            email: param.token.email ?? null,
            image: (param.token.picture as string) ?? null,
          };
          // 扩展字段
          // @ts-ignore
          param.session.user.id = param.token.id;
          // @ts-ignore
          param.session.user.provider = param.token.provider;
          // @ts-ignore
          param.session.user.roles = param.token.roles ?? "user";
        }
        return param.session;
      } catch (err) {
        console.error("[auth] session callback error:", err);
        return param.session;
      }
    },

    /** 安全处理 callbackUrl */
    async redirect({ url, baseUrl }) {
      try {
        const u = new URL(url, baseUrl);
        const redir = u.searchParams.get("callbackUrl");
        if (redir) {
          const decoded = decodeURIComponent(redir);
          if (decoded.startsWith("/")) return `${baseUrl}${decoded}`;
        }
        return url.startsWith(baseUrl) ? url : baseUrl;
      } catch {
        return baseUrl;
      }
    },
  },
});
