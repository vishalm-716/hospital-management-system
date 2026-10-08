import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/lib/utils";

export const { handlers, signIn, signOut, auth } = NextAuth({
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
      }
      return session;
    },
    async authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
      const isOnLogin = nextUrl.pathname === "/login";
      const isOnRegister = nextUrl.pathname === "/register";
      const isOnApi = nextUrl.pathname.startsWith("/api");
      const isOnHealth = nextUrl.pathname === "/api/health";

      // Allow health check
      if (isOnHealth) return true;

      // Allow public API routes
      if (isOnApi) return true;

      // Redirect logged-in users away from login/register
      if (isLoggedIn && (isOnLogin || isOnRegister)) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      // Protect dashboard routes
      if (isOnDashboard && !isLoggedIn) {
        return Response.redirect(new URL("/login", nextUrl));
      }

      // Protect other authenticated routes
      const protectedPaths = [
        "/patients",
        "/appointments",
        "/encounters",
        "/reports",
        "/billing",
        "/beds",
        "/audit-logs",
        "/settings",
      ];
      const isProtected = protectedPaths.some((p) =>
        nextUrl.pathname.startsWith(p)
      );

      if (isProtected && !isLoggedIn) {
        return Response.redirect(new URL("/login", nextUrl));
      }

      return true;
    },
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        // Rate limiting for login attempts
        const rateLimit = checkRateLimit(`login:${email}`, 5, 60000);
        if (!rateLimit.allowed) {
          throw new Error("Too many login attempts. Please try again later.");
        }

        try {
          let user: any = null;

          // Attempt fast Prisma query with 3s timeout
          try {
            const userPromise = prisma.user.findUnique({
              where: { email: email.toLowerCase() },
            });
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error("DB_TIMEOUT")), 3000)
            );
            user = await Promise.race([userPromise, timeoutPromise]);
          } catch {
            // Prisma timeout or port blocked by Wi-Fi, fallback to HTTPS REST
          }

          // Resilient HTTPS fallback for networks blocking raw TCP port 6543
          if (!user) {
            try {
              const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
              const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
              if (supabaseUrl && serviceKey) {
                const res = await fetch(
                  `${supabaseUrl}/rest/v1/User?email=eq.${encodeURIComponent(email.toLowerCase())}&select=*`,
                  {
                    headers: {
                      apikey: serviceKey,
                      Authorization: `Bearer ${serviceKey}`,
                    },
                  }
                );
                if (res.ok) {
                  const data = await res.json();
                  if (Array.isArray(data) && data.length > 0) {
                    user = data[0];
                  }
                }
              }
            } catch (err) {
              console.error("Supabase REST fallback error:", err);
            }
          }

          // Generic error message to prevent email enumeration
          if (!user) {
            return null;
          }

          if (!user.isActive) {
            throw new Error("Account is deactivated. Contact administrator.");
          }

          const isValidPassword = await compare(password, user.passwordHash);
          if (!isValidPassword) {
            return null;
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          };
        } catch (error) {
          if (error instanceof Error && error.message.includes("deactivated")) {
            throw error;
          }
          if (error instanceof Error && error.message.includes("Too many")) {
            throw error;
          }
          return null;
        }
      },
    }),
  ],
});
